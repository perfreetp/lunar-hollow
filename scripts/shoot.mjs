/**
 * Screenshot harness. Drives the installed Chrome via CDP with a persistent
 * profile; kept outside the app's source tree.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = process.argv[2] ?? 'shots';
const URL = process.argv[3] ?? 'http://localhost:5310/';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
try {
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 45000 });
} catch {
  errors.push('boot timeout: body[data-ready] never set');
}
await page.waitForTimeout(2200);

const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`shot ${name}`);
};

await shot('01-night');

// Extract diagnostics + open a lighthouse inspector.
const diag = await page.evaluate(() => {
  const app = window.np?.app;
  if (!app) return { error: 'no app' };
  const s = app.getState();
  const views = app.lightViews();
  return {
    fps: s.diagnostics.fps,
    frameMs: s.diagnostics.frameMs,
    drawCount: s.diagnostics.drawCount,
    overlapPairs: s.diagnostics.overlapPairs,
    maxSuppression: s.diagnostics.maxSuppression,
    visibleLights: views.length,
    radii: views.map((v) => ({ id: v.aid.id, r: Math.round(v.radiusPx), env: +v.envelope.toFixed(2), lum: +v.luminance.toFixed(2) })),
    selection: s.selectedAidId,
    zoom: +s.zoom.toFixed(3),
    ready: s.mapReady,
  };
});
console.log('DIAG', JSON.stringify(diag, null, 1));

// click first lighthouse label
await page.evaluate(() => window.np.app.selectAid('L-BAIJIAO'));
await page.waitForTimeout(900);
await shot('02-inspector');

// day mode
await page.evaluate(() => window.np.app.setMode('day'));
await page.waitForTimeout(1400);
await shot('03-day');

// night again + fog
await page.evaluate(() => { window.np.app.setMode('night'); window.np.app.setVisibility('fog'); });
await page.waitForTimeout(1300);
await shot('04-night-fog');

// clear, zoom in to test halo scale stability
await page.evaluate(() => { window.np.app.setVisibility('clear'); });
await page.waitForTimeout(800);
const radii14 = await page.evaluate(() => {
  const v = window.np.app.lightViews();
  return v.map((x) => ({ id: x.aid.id, r: Math.round(x.radiusPx), g: Math.round(x.groundRadiusM) }));
});
await page.evaluate(() => window.np.app.focusAid('L-BAIJIAO'));
await page.waitForTimeout(1600);
const radii16 = await page.evaluate(() => {
  const v = window.np.app.lightViews();
  return v.map((x) => ({ id: x.aid.id, r: Math.round(x.radiusPx), g: Math.round(x.groundRadiusM) }));
});
console.log('SCALE', JSON.stringify({ radii14, radii16 }, null, 1));
await shot('05-zoomed');

// zoom out
await page.evaluate(() => window.np.app.focusRoute());
await page.waitForTimeout(1600);
await shot('06-route');

// export dialog
await page.evaluate(() => window.np.app.openExport());
await page.waitForTimeout(700);
await shot('07-export');

// perf sample over 3s
const perf = await page.evaluate(async () => {
  const samples = [];
  let last = performance.now();
  let frames = 0;
  await new Promise((resolve) => {
    const t0 = performance.now();
    const tick = (now) => {
      frames++;
      if (now - t0 > 3000) {
        samples.push({ fps: frames / ((now - t0) / 1000) });
        resolve();
        return;
      }
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const s = window.np.app.getState();
  return { measuredFps: samples[0].fps, reported: s.diagnostics.fps, frameMs: s.diagnostics.frameMs, suppress: s.diagnostics.maxSuppression };
});
console.log('PERF', JSON.stringify(perf));

console.log('ERRORS', JSON.stringify(errors, null, 1));
await browser.close();
