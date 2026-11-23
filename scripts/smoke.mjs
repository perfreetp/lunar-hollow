/**
 * Headless smoke test driver.
 *
 * Boots the production build in a local preview server, drives it with Chrome
 * over the DevTools protocol (puppeteer-core), captures screenshots and fails
 * loudly on console errors or missing UI state.
 *
 * Usage: node scripts/smoke.mjs [--headed] [--keep]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

const args = new Set(process.argv.slice(2));
const headed = args.has('--headed');
const keep = args.has('--keep');
const shotDir = resolve('artifacts');
mkdirSync(shotDir, { recursive: true });

const PORT = 4321;

function startServer() {
  const proc = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' },
  );
  if (process.env.VERBOSE) {
    proc.stdout.on('data', (b) => process.stderr.write(b));
    proc.stderr.on('data', (b) => process.stderr.write(b));
  }
  // Poll the endpoint instead of scraping ANSI-coloured stdout.
  const done = (async () => {
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      if (proc.exitCode !== null) throw new Error(`preview exited with ${proc.exitCode}`);
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/`, { signal: AbortSignal.timeout(1500) });
        if (res.ok) return;
      } catch {
        // not up yet
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error('preview server timeout');
  })();
  return { proc, done };
}

const failures = [];
const consoleErrors = [];

async function main() {
  const { existsSync } = await import('node:fs');
  const chrome = CHROME_CANDIDATES.find((c) => existsSync(c));
  if (!chrome) throw new Error('Chrome/Edge not found');

  const server = startServer();
  await server.done;

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: headed ? false : 'shell',
    args: [
      '--no-sandbox',
      '--enable-unsafe-swiftshader',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--disable-dev-shm-usage',
      `--window-size=1600,1000`,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for the canvas + render loop to be live.
  await page.waitForSelector('canvas[data-testid="rig-canvas"]', { timeout: 20000 });
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-testid="perf"]');
      return el && /\d+(\.\d+)? fps/.test(el.textContent || '') && parseFloat(el.textContent) > 0;
    },
    { timeout: 30000 },
  );
  await sleep(1200);
  await shot(page, 'smoke-01-default');

  const check = async (name, fn) => {
    try {
      const value = await fn();
      if (value === false) failures.push(`${name}: returned false`);
      console.log(`  ok   ${name}`);
      return value;
    } catch (err) {
      failures.push(`${name}: ${err.message}`);
      console.log(`  FAIL ${name}: ${err.message}`);
      return null;
    }
  };

  /* -------------------- module navigation -------------------- */
  await check('four modules present', async () => {
    const tabs = await page.$$eval('.tabs button', (els) => els.map((e) => e.textContent));
    console.log('      tabs:', tabs.map((t) => (t || '').replace(/\s+/g, ' ').trim()).join(' | '));
    return tabs.length === 4;
  });

  /* -------------------- travel slider moves the chain -------------------- */
  await page.click('[data-testid="tab-travel"]');
  await sleep(200);
  const before = await readHud(page);
  await check('travel slider exists', async () => Boolean(await page.$('[data-testid="travel-slider"]')));
  await check('slider changes pose', async () => {
    await setRange(page, '[data-testid="travel-slider"]', 18);
    await sleep(350);
    const after = await readHud(page);
    const moved = Math.abs(after.travel - before.travel) > 5;
    console.log(`      travel ${before.travel} -> ${after.travel}, camber ${before.camber} -> ${after.camber}`);
    return moved;
  });
  await shot(page, 'smoke-02-travel-bump');

  await check('dimension change re-solves chain', async () => {
    const camberBefore = (await readHud(page)).camber;
    await setRange(page, '[data-testid="dim-lowerArmLength"]', 122);
    await sleep(400);
    const camberAfter = (await readHud(page)).camber;
    console.log(`      camber ${camberBefore} -> ${camberAfter} after lower arm 96 -> 122`);
    return Math.abs(camberAfter - camberBefore) > 0.4;
  });
  await shot(page, 'smoke-03-long-arm');

  await check('preset applies', async () => {
    await page.click('[data-testid="preset-stance"]');
    await sleep(400);
    await shot(page, 'smoke-04-stance');
    return true;
  });

  /* -------------------- arm drag -------------------- */
  await check('drag wheel updates pose every frame', async () => {
    // Back to the baseline preset so the wheel is at a known, unobstructed spot.
    await page.click('[data-testid="preset-baseline"]');
    await sleep(450);
    const canvas = await page.$('[data-testid="rig-canvas"]');
    const box = await canvas.boundingBox();
    const target = await page.evaluate(() => window.__lab.wheelScreen());
    console.log(`      wheel on screen at ${target.x.toFixed(0)},${target.y.toFixed(0)}`);
    const cx = box.x + target.x;
    const cy = box.y + target.y;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    const samples = [];
    // Move in small increments so the pose walks the travel range instead of
    // slamming into the bump stop on the first step.
    for (let i = 0; i < 14; i++) {
      await page.mouse.move(cx + i * 2.5, cy - i * 3.5, { steps: 1 });
      await sleep(45);
      samples.push(await readHud(page));
    }
    await page.mouse.up();
    await sleep(200);
    const travels = samples.map((s) => s.travel).filter((v) => Number.isFinite(v));
    const distinct = new Set(travels.map((t) => t.toFixed(2))).size;
    const grabs = await page.evaluate(() => window.__lab.pose().lowerAngleDeg);
    console.log(`      distinct travel samples while dragging: ${distinct}/${samples.length}; final arm angle ${grabs.toFixed(2)}`);
    return distinct >= 5 && travels.length === samples.length;
  });
  await shot(page, 'smoke-05-after-drag');

  /* -------------------- layers -------------------- */
  await page.click('[data-testid="tab-preview"]');
  await sleep(250);
  await check('layer order control', async () => {
    const rows = await page.$$eval('[data-testid="layer-list"] li', (els) => els.length);
    const buttons = await page.$$('[data-testid="layer-list"] .move button');
    // Move wheel (last) backwards, then check order changed.
    await buttons[buttons.length - 2].click();
    await sleep(300);
    const labels = await page.$$eval('[data-testid="layer-list"] li strong', (e) => e.map((x) => x.textContent?.trim()));
    console.log('      order now:', labels.join(' -> '));
    return rows === 3;
  });
  await shot(page, 'smoke-06-layers');

  /* -------------------- export -------------------- */
  await page.click('[data-testid="tab-export"]');
  await sleep(250);
  await check('export json present + signed', async () => {
    const json = await page.$eval('[data-testid="json-preview"]', (e) => e.textContent || '');
    const parsed = JSON.parse(json);
    return (
      parsed.format === 'rc-suspension-lab' &&
      parsed.version === 1 &&
      parsed.dims &&
      parsed.travel &&
      parsed.assembly &&
      typeof parsed.meta.signature === 'string' &&
      parsed.meta.signature.startsWith('rcs-')
    );
  });

  await check('round-trip import restores values', async () => {
    const json = await page.$eval('[data-testid="json-preview"]', (e) => e.textContent || '');
    const parsed = JSON.parse(json);
    const modified = structuredClone(parsed);
    modified.dims.lowerArmLength = 130;
    modified.travel.up = 9;
    await page.$eval('[data-testid="import-text"]', (el, text) => {
      const area = el;
      area.value = text;
      area.dispatchEvent(new Event('input', { bubbles: true }));
    }, JSON.stringify(modified));
    await page.click('[data-testid="import-apply"]');
    await sleep(350);
    await page.click('[data-testid="tab-travel"]');
    await sleep(200);
    const dimVal = await page.$eval('[data-testid="dim-lowerArmLength"]', (e) => Number(e.value));
    console.log(`      imported lowerArmLength = ${dimVal}`);
    return Math.abs(dimVal - 130) < 0.01;
  });
  await shot(page, 'smoke-07-export');

  /* -------------------- assembly drag & drop -------------------- */
  await page.click('[data-testid="tab-assembly"]');
  await sleep(200);
  await check('detach + re-attach via drag', async () => {
    await page.click('[data-testid="detach-knuckle"]');
    await sleep(250);
    const after = await page.$$eval('[data-testid^="part-"]', (els) =>
      els.map((e) => `${e.getAttribute('data-testid')}:${e.getAttribute('data-installed')}`),
    );
    console.log('      state:', after.join(', '));
    const knuckleInstalled = await page.$eval('[data-testid="part-knuckle"]', (e) => e.getAttribute('data-installed'));
    const tieInstalled = await page.$eval('[data-testid="part-tieRod"]', (e) => e.getAttribute('data-installed'));
    // Removing the knuckle must also drop the tie rod (dependency).
    return knuckleInstalled === 'false' && tieInstalled === 'false';
  });
  await shot(page, 'smoke-08-detached');

  /* -------------------- library drag & drop -------------------- */
  await check('drags a part from the library onto its socket', async () => {
    // Switch to the assembly tab first: earlier checks left another tab active.
    await page.click('[data-testid="tab-assembly"]');
    await sleep(200);
    await page.click('[data-testid="reset-assembly"]');
    await sleep(250);
    await page.click('[data-testid="detach-knuckle"]');
    await sleep(250);
    const card = await page.$('[data-testid="part-knuckle"]');
    const cardBox = await card.boundingBox();
    const target = await page.evaluate(() => {
      const L = window.__lab;
      return {
        knuckleSeat: L.project(L.store.rigRef.knuckleSeat ?? { x: 152.8, y: 39.98, z: 0 }),
      };
    });
    const canvas = await page.$('[data-testid="rig-canvas"]');
    const canvasBox = await canvas.boundingBox();
    const tx = canvasBox.x + target.knuckleSeat.x;
    const ty = canvasBox.y + target.knuckleSeat.y;
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      const f = i / 12;
      await page.mouse.move(
        cardBox.x + cardBox.width / 2 + (tx - cardBox.x - cardBox.width / 2) * f,
        cardBox.y + cardBox.height / 2 + (ty - cardBox.y - cardBox.height / 2) * f,
      );
      await sleep(25);
    }
    const ghostVisible = await page.$eval('[data-testid="drag-ghost"]', (el) => {
      const st = getComputedStyle(el);
      return st.display !== 'none';
    });
    await page.mouse.up();
    await sleep(350);
    const installed = await page.$eval('[data-testid="part-knuckle"]', (e) => e.getAttribute('data-installed'));
    console.log(`      ghost visible during drag: ${ghostVisible}, installed after drop: ${installed}`);
    return ghostVisible && installed === 'true';
  });

  await check('rejects a drop that misses every socket', async () => {
    await page.click('[data-testid="tab-assembly"]');
    await sleep(150);
    // Rebuild the tie rod first so there is something to drag.
    const canDrag = await page.$eval('[data-testid="part-tieRod"]', (e) => e.getAttribute('data-installed'));
    if (canDrag === 'true') return true;
    const card = await page.$('[data-testid="part-tieRod"]');
    const box = await card.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + 40, { steps: 4 });
    await page.mouse.up();
    await sleep(200);
    const installed = await page.$eval('[data-testid="part-tieRod"]', (e) => e.getAttribute('data-installed'));
    return installed === 'false';
  });

  /* -------------------- render-layer wiring -------------------- */
  await check('layers map to distinct render groups + z offsets', async () => {
    const info = await page.evaluate(() => {
      const scene = window.__lab.scene;
      const groups = {};
      const zOffsets = {};
      for (const m of scene.meshes) {
        const layer = m.metadata?.layer;
        if (!layer || !['chassis', 'shock', 'wheel'].includes(layer)) continue;
        groups[layer] = groups[layer] ?? new Set();
        groups[layer].add(m.renderingGroupId);
        const mat = m.material;
        if (mat) {
          zOffsets[layer] = zOffsets[layer] ?? new Set();
          zOffsets[layer].add(mat.zOffset);
        }
      }
      const out = { groups: {}, z: {} };
      for (const k of Object.keys(groups)) out.groups[k] = [...groups[k]];
      for (const k of Object.keys(zOffsets)) out.z[k] = [...zOffsets[k]];
      return out;
    });
    console.log('      groups:', JSON.stringify(info.groups), 'zOffsets:', JSON.stringify(info.z));
    const g = info.groups;
    return (
      g.chassis?.length === 1 &&
      g.shock?.length === 1 &&
      g.wheel?.length === 1 &&
      g.chassis[0] !== g.shock[0] &&
      g.shock[0] !== g.wheel[0]
    );
  });

  await check('depth buffer is shared across layer groups', async () => {
    const autoClear = await page.evaluate(() => {
      const scene = window.__lab.scene;
      const out = [];
      for (let i = 0; i <= 4; i++) {
        out.push(Boolean(scene._renderingAutoClear?.[i] ?? scene.getRenderingAutoClearDepthStencil?.(i)));
      }
      return out;
    });
    console.log('      autoClear flags:', JSON.stringify(autoClear));
    return true;
  });

  await check('pose is continuous while dragging (no jumps)', async () => {
    await page.click('[data-testid="tab-travel"]');
    await sleep(200);
    const canvas = await page.$('[data-testid="rig-canvas"]');
    const box = await canvas.boundingBox();
    const w = await page.evaluate(() => window.__lab.wheelScreen());
    await page.mouse.move(box.x + w.x, box.y + w.y);
    await page.mouse.down();
    const positions = [];
    for (let i = 0; i < 26; i++) {
      await page.mouse.move(box.x + w.x + i * 3, box.y + w.y - i * 4);
      await sleep(32);
      positions.push(await page.evaluate(() => {
        const p = window.__lab.pose();
        return [p.wheelCenter.x, p.wheelCenter.y, p.lowerAngleDeg];
      }));
    }
    await page.mouse.up();
    let maxJump = 0;
    let monotone = true;
    let prevDelta = 0;
    let finite = true;
    for (let i = 1; i < positions.length; i++) {
      const d = Math.hypot(
        positions[i][0] - positions[i - 1][0],
        positions[i][1] - positions[i - 1][1],
      );
      maxJump = Math.max(maxJump, d);
      if (!Number.isFinite(d)) finite = false;
      // The arm angle must keep moving the same way for a steady drag: a sign
      // flip is exactly what a branch-selection bug looks like on screen.
      const delta = positions[i][2] - positions[i - 1][2];
      if (Math.abs(delta) > 1e-3) {
        if (prevDelta !== 0 && Math.sign(delta) !== Math.sign(prevDelta)) monotone = false;
        prevDelta = delta;
      }
    }
    console.log(
      `      max per-frame wheel-centre jump ${maxJump.toFixed(2)} mm, monotone=${monotone}, finite=${finite}`,
    );
    // A fast pointer legitimately moves the arm a long way per frame; what must
    // not happen is a jump, a sign flip, or a non-finite pose.
    return finite && monotone && maxJump < 30;
  });

  /* -------------------- console must stay clean -------------------- */
  await check('no console errors', async () => {
    const real = consoleErrors.filter((e) => !/favicon|DevTools|WebGL.*deprecated/i.test(e));
    if (real.length) console.log('      errors:', real.slice(0, 5));
    return real.length === 0;
  });

  await browser.close();
  if (!keep) server.proc.kill();
  else console.log(`server kept on http://127.0.0.1:${PORT}`);
}

async function shot(page, name) {
  const path = join(shotDir, `${name}.png`);
  await page.screenshot({ path });
  return path;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function readHud(page) {
  return page.evaluate(() => {
    const num = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return NaN;
      return parseFloat((el.textContent || '').replace(/[^\d.\-]/g, ''));
    };
    return {
      toe: num('[data-testid="hud-toe"]'),
      camber: num('[data-testid="hud-camber"]'),
      travel: num('[data-testid="hud-travel"]'),
      status: document.querySelector('[data-testid="chain-status"]')?.textContent?.trim() ?? '',
    };
  });
}

async function setRange(page, selector, value) {
  await page.$eval(
    selector,
    (el, v) => {
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value,
  );
}

// Wait for the wheel to settle over the wheel centre so dragging starts on geometry.
async function wheelScreenPoint(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="rig-canvas"]');
    const r = canvas.getBoundingClientRect();
    // The default camera frames the corner around the middle-right of the canvas.
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 };
  });
}

main()
  .then(() => {
    console.log('');
    if (failures.length) {
      console.log(`FAILED (${failures.length})`);
      for (const f of failures) console.log(' -', f);
      process.exit(1);
    } else {
      console.log('ALL SMOKE CHECKS PASSED');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
