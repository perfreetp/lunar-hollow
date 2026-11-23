/**
 * End-to-end behaviour checks against the running dev server.
 *
 * Covers the brief's functional requirements: halo scale stability across
 * zoom, overlap ordering/suppression, day/night, visibility grades, light
 * selection with bearing, ship drag and lit-route recompute, and export.
 */
import { chromium } from 'playwright-core';

const URL = process.argv[2] ?? 'http://localhost:5310/';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 960 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 45000 });
await page.waitForTimeout(2200);

const state = () => page.evaluate(() => window.np.app.getState());

// --- boot -----------------------------------------------------------------
{
  const s = await state();
  check('boot: map ready', s.mapReady === true);
  check('boot: 60 fps-class renderer', s.diagnostics.fps > 50, `${s.diagnostics.fps.toFixed(0)} fps`);
  const views = await page.evaluate(() => window.np.app.lightViews().length);
  check('boot: lights projected', views >= 10, `${views} views`);
  const ui = await page.evaluate(() =>
    ['np-topbar', 'np-sidepanel', 'np-statusbar'].every((t) => document.querySelector(t)?.innerHTML.length > 500),
  );
  check('boot: components rendered', ui);
}

// --- halo scale stability across zoom --------------------------------------
async function radiiAt(zoom) {
  // `maxBounds` clamps the requested zoom, so read back the achieved level.
  await page.evaluate((z) => window.np.app.mapHandle.map.jumpTo({ zoom: z }), zoom);
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    const mpp = (() => {
      const map = window.np.app.mapHandle.map;
      const c = map.getCenter();
      const a = map.project([c.lng, c.lat]);
      const b = map.project([c.lng, c.lat + 0.01]);
      return (0.01 * 110540) / Math.abs(b.y - a.y);
    })();
    return window.np.app
      .lightViews()
      .map((v) => ({ id: v.aid.id, px: v.radiusPx, ground: v.groundRadiusM, mpp, zoom: window.np.app.mapHandle.map.getZoom(), clamped: v.clamped }));
  });
}

{
  const id = 'L-BAIJIAO';
  const pick = (rows) => rows.find((r) => r.id === id);
  const a = pick(await radiiAt(12.2));
  const b = pick(await radiiAt(13.2));
  const c = pick(await radiiAt(14.2));
  const within = (v, target, tol = 0.03) => Math.abs(v - target) / target < tol;

  // Ground footprint must not change with zoom: the same lamp, the same range.
  check(
    'halo: ground footprint constant across zoom',
    a.ground === b.ground && b.ground === c.ground,
    `${Math.round(a.ground)} m at z12.2/13.2/14.2`,
  );
  // Unclamped radii must equal ground metres / metres-per-pixel, i.e. the
  // painted halo is exactly the charted footprint at every zoom. The deep-zoom
  // viewport guard is asserted separately, and it reports itself as clamped.
  const exact = [a, b].every((r) => !r.clamped && within(r.px, r.ground / r.mpp));
  check(
    'halo: pixel radius equals ground footprint ÷ scale',
    exact,
    [a, b, c].map((r) => `z${r.zoom.toFixed(1)}: ${r.px.toFixed(0)}px vs ${(r.ground / r.mpp).toFixed(0)}px`).join(' · '),
  );
  // Pixel radius must still grow with zoom (scale lock, not screen lock).
  check('halo: radius grows as the chart zooms in', b.px > a.px, `${a.px.toFixed(0)} → ${b.px.toFixed(0)} px`);
  // Deep zoom exceeds the viewport guard; the clamp must be reported, not
  // silently applied, so the operator can see the scale is no longer exact.
  check(
    'halo: deep-zoom clamp is reported',
    c.clamped === true || within(c.px, c.ground / c.mpp),
    `z14.2 ${c.px.toFixed(0)}px (clamped=${c.clamped})`,
  );

  // Screen mode must hold pixel size instead.
  await page.evaluate(() => window.np.app.setScaleMode('screen'));
  await page.waitForTimeout(400);
  const s11 = pick(await radiiAt(12.2));
  const s14 = pick(await radiiAt(14.2));
  check('halo: screen mode holds pixel radius', Math.abs(s11.px - s14.px) < 1.5, `${s11.px.toFixed(0)} vs ${s14.px.toFixed(0)} px across 2 zoom levels`);
  await page.evaluate(() => window.np.app.setScaleMode('ground'));
}

// --- overlap ordering and suppression --------------------------------------
{
  await page.evaluate(() => window.np.app.focusAid('L-BAIJIAO'));
  await page.waitForTimeout(1800);
  // Sample repeatedly: the unfrozen stack changes which lamps are lit, and the
  // ordering invariant only means something on a frame with a real overlap.
  // The cluster only overlaps properly at a close zoom; at the wide view the
  // lamps are too far apart to suppress each other.
  await page.evaluate(() => window.np.app.focusAid('L-BAIJIAO'));
  await page.waitForTimeout(2000);
  let comp = null;
  for (let i = 0; i < 240; i++) {
    comp = await page.evaluate(() => {
      const c = window.np.app.renderer.lastComposition;
      if (!c) return null;
      return {
        order: c.items.map((i) => ({ id: i.source.id, lum: i.source.luminance, env: i.source.envelope, gain: i.gain, sup: i.suppression, dist: i.source.distanceM, r: i.source.radiusPx })),
        pairs: c.overlapPairs,
        maxSup: c.maxSuppression,
        totalPeak: c.totalPeak,
        crowded: c.crowded,
      };
    });
    // Need a frame where a *lit* lamp is actually being suppressed by a lit
    // neighbour. Suppression against a dark neighbour is zero by design, so a
    // frame without a lit suppressed lamp exercises nothing.
    const litSuppressed = comp && comp.order.some((o) => o.env > 0.4 && o.gain < 0.95);
    if (litSuppressed && comp.pairs > 0) break;
    await page.waitForTimeout(60);
  }
  // Priority is luminance × envelope × proximity, which is exactly what the
  // compositor sorts by; asserting on luminance alone would be wrong.
  const priority = (it) => it.lum * (0.3 + 0.7 * it.env) * (1 / (1 + it.dist / 9000));
  const ascending = comp.order.every((it, i) => i === 0 || priority(it) >= priority(comp.order[i - 1]) - 1e-6);
  check('overlap: draw order ascending by priority', ascending, comp.order.map((o) => o.id).join(' → '));
  const litSuppressed = comp.order.filter((o) => o.env > 0.4 && o.gain < 0.95);
  check(
    'overlap: a lit lamp is suppressed by a brighter lit neighbour',
    litSuppressed.length > 0,
    litSuppressed.map((o) => `${o.id} gain ${o.gain.toFixed(2)}`).join(', ') || 'none in frame',
  );
  check('overlap: overlapping pairs detected', comp.pairs > 0, `${comp.pairs} pairs`);
  check('overlap: bright lamp suppresses dim neighbour', comp.maxSup > 0.2, `suppression ${comp.maxSup.toFixed(2)}`);
  const top = comp.order[comp.order.length - 1];
  check('overlap: dominant lamp keeps full exposure', top.gain === 1, `${top.id} gain ${top.gain.toFixed(2)}`);
  // The real invariant: when several lamps overlap while lit, total exposure is
  // strictly less than the naive sum of their envelopes — otherwise overlaps
  // accumulate into the grey-out this compositor exists to prevent.
  const lit = comp.order.filter((o) => o.env > 0.4);
  const naive = lit.reduce((s, i) => s + i.env, 0);
  check(
    'overlap: lit stack exposure below naive sum',
    litSuppressed.length > 0 && comp.totalPeak < naive - 1e-6,
    `${comp.totalPeak.toFixed(2)} < naive ${naive.toFixed(2)} over ${lit.length} lit`,
  );
}

// --- route illumination must not depend on the camera ---------------------
{
  // Zoom onto the south channel so the towers that light it are off-screen.
  await page.evaluate(() => window.np.app.mapHandle.map.jumpTo({ center: [122.169, 30.025], zoom: 13.6 }));
  await page.waitForTimeout(1400);
  let maxLit = 0;
  for (let i = 0; i < 45; i++) {
    const snap = await page.evaluate(() => ({
      lit: window.np.app.getState().diagnostics.litLengthM,
      onScreen: window.np.app.lightViews().length,
      baijiaoOnScreen: window.np.app.lightViews().some((v) => v.aid.id === 'L-BAIJIAO'),
    }));
    if (snap.lit > maxLit) maxLit = snap.lit;
    await page.waitForTimeout(70);
  }
  const onScreen = await page.evaluate(() =>
    window.np.app.lightViews().length,
  );
  check(
    'route: still lit by lamps outside the viewport',
    maxLit > 2000,
    `${(maxLit / 1852).toFixed(2)} nm lit with ${onScreen} lights on screen`,
  );
  await page.evaluate(() => window.np.app.focusRoute());
  await page.waitForTimeout(1400);
}

// --- day / night -----------------------------------------------------------
{
  const nightLum = await page.evaluate(() => window.np.app.lightViews().reduce((m, v) => Math.max(m, v.luminance), 0));
  await page.evaluate(() => window.np.app.setMode('day'));
  await page.waitForTimeout(1200);
  const dayLum = await page.evaluate(() => window.np.app.lightViews().reduce((m, v) => Math.max(m, v.luminance), 0));
  const dayTheme = await page.evaluate(() => document.body.classList.contains('theme-day'));
  check('day: theme applied to document', dayTheme);
  check('day: sources dimmed versus night', dayLum < nightLum * 0.45, `night ${nightLum.toFixed(2)} → day ${dayLum.toFixed(2)}`);
  await page.evaluate(() => window.np.app.setMode('night'));
  await page.waitForTimeout(1000);
  const back = await page.evaluate(() => window.np.app.lightViews().reduce((m, v) => Math.max(m, v.luminance), 0));
  check('night: contrast restored', back > nightLum * 0.95, `${back.toFixed(2)}`);
}

// --- visibility grades -----------------------------------------------------
{
  const sample = async (grade) => {
    await page.evaluate((g) => window.np.app.setVisibility(g), grade);
    await page.waitForTimeout(800);
    return page.evaluate(() => {
      const v = window.np.app.lightViews().find((x) => x.aid.id === 'L-BAIJIAO');
      return { ground: v.groundRadiusM, lum: v.luminance, px: v.radiusPx };
    });
  };
  const clear = await sample('clear');
  const poor = await sample('poor');
  const fog = await sample('fog');
  check('visibility: halo shrinks with haze', clear.ground > poor.ground && poor.ground > fog.ground, `${Math.round(clear.ground)} → ${Math.round(poor.ground)} → ${Math.round(fog.ground)} m`);
  check('visibility: glow weakens with haze', clear.lum > poor.lum && poor.lum > fog.lum, `${clear.lum.toFixed(2)} → ${poor.lum.toFixed(2)} → ${fog.lum.toFixed(2)}`);
  await sample('clear');
}

// --- selection: characteristic and bearing --------------------------------
{
  await page.evaluate(() => window.np.app.selectAid('L-QINGLONG'));
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => {
    const el = document.querySelector('np-inspector');
    const pick = (k) => el.querySelector(`[data-live="${k}"]`)?.textContent?.trim() ?? '';
    return {
      open: el.classList.contains('is-open'),
      title: el.querySelector('.insp-title')?.textContent?.trim(),
      code: el.querySelector('.char-code')?.textContent?.trim(),
      bearing: pick('bearing'),
      distance: pick('distance'),
      range: pick('range'),
      hasTiming: !!el.querySelector('.timing-phase'),
      hasDial: !!el.querySelector('[data-dial-needle]'),
    };
  });
  check('select: inspector opens', info.open);
  check('select: names the light', info.title === '青龙角灯塔', info.title);
  check('select: shows characteristic', info.code === 'Mo(A) W 15s', info.code);
  check('select: shows bearing', /^\d{3}° [NSEW]{1,3}$/.test(info.bearing), info.bearing);
  check('select: shows distance', /\d/.test(info.distance), info.distance);
  check('select: shows visible range', /nm/.test(info.range), info.range);
  check('select: timing strip and dial present', info.hasTiming && info.hasDial);
  const sel = await state();
  check('select: state reflects selection', sel.selectedAidId === 'L-QINGLONG');
}

// --- ship drag recomputes illumination ------------------------------------
{
  const before = await page.evaluate(() => ({
    along: window.np.app.getState().ship.alongM,
    lit: window.np.app.getState().diagnostics.litLengthM,
    pos: window.np.app.shipInfo().position,
  }));
  await page.evaluate(() => window.np.app.setShipFromRoute(0.15));
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => ({
    along: window.np.app.getState().ship.alongM,
    lit: window.np.app.getState().diagnostics.litLengthM,
    pos: window.np.app.shipInfo().position,
    nearest: window.np.app.shipInfo().nearestName,
  }));
  check('ship: along-route distance updates', Math.abs(after.along - before.along) > 100, `${Math.round(before.along)} → ${Math.round(after.along)} m`);
  check('ship: nearest aid reported', typeof after.nearest === 'string' && after.nearest.length > 0, after.nearest);
  // Drag the puck with real pointer events.
  const puck = await page.locator('#ship-puck').boundingBox();
  const map = await page.locator('#map').boundingBox();
  if (puck) {
    await page.mouse.move(puck.x + puck.width / 2, puck.y + puck.height / 2);
    await page.mouse.down();
    await page.mouse.move(map.x + map.width * 0.62, map.y + map.height * 0.7, { steps: 14 });
    await page.mouse.up();
    await page.waitForTimeout(900);
    const dragged = await page.evaluate(() => window.np.app.getState().ship.alongM);
    check('ship: pointer drag moves vessel', Math.abs(dragged - after.along) > 50, `${Math.round(after.along)} → ${Math.round(dragged)} m`);
  } else {
    check('ship: pointer drag moves vessel', false, 'puck not found');
  }
  const lit = await page.evaluate(() => window.np.app.getState().diagnostics.litLengthM);
  check('ship: illuminated route length computed', lit > 0, `${(lit / 1852).toFixed(2)} nm lit`);
}

// --- toggles ---------------------------------------------------------------
{
  const before = await page.evaluate(() => window.np.app.getState().showRoute);
  await page.evaluate(() => window.np.app.toggleFlag('showRoute'));
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => ({
    flag: window.np.app.getState().showRoute,
    lit: window.np.app.getState().diagnostics.litLengthM,
  }));
  check('toggle: route flag flips', after.flag === !before);
  check('toggle: lit length zeroed when hidden', after.lit === 0, `${after.lit}`);
  await page.evaluate(() => window.np.app.toggleFlag('showRoute'));
}

// --- export ----------------------------------------------------------------
{
  await page.evaluate(() => window.np.app.openExport());
  await page.waitForTimeout(700);
  const dlg = await page.evaluate(() => {
    const el = document.querySelector('np-export-dialog');
    const preview = el.querySelector('[data-preview]')?.textContent ?? '';
    return {
      open: el.classList.contains('is-open'),
      previewLen: preview.length,
      hasSchema: preview.includes('chisha.voyage.config/1'),
      name: el.querySelector('[data-fname]')?.textContent ?? '',
      formats: [...el.querySelectorAll('[data-format]')].map((b) => b.dataset.format),
    };
  });
  check('export: dialog opens', dlg.open);
  check('export: JSON preview has schema', dlg.hasSchema, `${dlg.previewLen} chars`);
  check('export: three formats offered', dlg.formats.join(',') === 'json,geojson,briefing', dlg.formats.join(','));
  check('export: filename looks right', /^CN-18402-.+\.json$/.test(dlg.name), dlg.name);

  // Switch to briefing and confirm the text body renders.
  await page.click('[data-format="briefing"]');
  await page.waitForTimeout(400);
  const briefing = await page.evaluate(() => document.querySelector('[data-preview]')?.textContent ?? '');
  check('export: briefing text renders', briefing.includes('航段配置') && briefing.includes('灯标'), `${briefing.length} chars`);

  // Verify the file content end to end through the API.
  const exported = await page.evaluate(() => {
    const f = window.np.app.doExport('json');
    return {
      schema: f.schema,
      lights: f.lights.length,
      waypoints: f.route.waypoints.length,
      hasAtmosphere: !!f.atmosphere?.visibilityNm,
      hasShip: typeof f.ship?.position?.lng === 'number',
      ranges: f.lights.slice(0, 2).map((l) => l.visibleRangeNm),
    };
  });
  check('export: payload complete', exported.schema === 'chisha.voyage.config/1' && exported.lights === 12 && exported.waypoints === 8 && exported.hasAtmosphere && exported.hasShip, JSON.stringify(exported.ranges));
  await page.evaluate(() => window.np.app.closeExport());
}

// --- motion freeze ---------------------------------------------------------
{
  await page.evaluate(() => window.np.app.setMotion('frozen'));
  await page.waitForTimeout(400);
  const a = await page.evaluate(() => window.np.app.lightViews().map((v) => +v.envelope.toFixed(3)).join(','));
  await page.waitForTimeout(1400);
  const b = await page.evaluate(() => window.np.app.lightViews().map((v) => +v.envelope.toFixed(3)).join(','));
  check('motion: freeze holds envelopes', a === b, a.slice(0, 40));
  await page.evaluate(() => window.np.app.setMotion('animated'));
  await page.waitForTimeout(1200);
  const c = await page.evaluate(() => window.np.app.lightViews().map((v) => +v.envelope.toFixed(3)).join(','));
  check('motion: animation resumes', c !== b);
}

// --- responsiveness --------------------------------------------------------
{
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(900);
  const overflow = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth,
    winW: window.innerWidth,
    panelW: document.querySelector('np-sidepanel')?.getBoundingClientRect().width ?? 0,
  }));
  check('mobile: no horizontal overflow', overflow.docW <= overflow.winW + 1, `${overflow.docW} ≤ ${overflow.winW}`);
  check('mobile: panel fits viewport', overflow.panelW <= overflow.winW, `${Math.round(overflow.panelW)} px`);
  await page.screenshot({ path: 'shots-e2e/mobile.png' });
  await page.setViewportSize({ width: 1600, height: 960 });
  await page.waitForTimeout(700);
}

check('console: no runtime errors', errors.length === 0, errors.join(' | ') || 'clean');

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) console.log('FAILED:', failed.map((f) => f.name).join('; '));
await browser.close();
process.exit(failed.length ? 1 : 0);
