/**
 * Screenshot helper: boots the build headlessly and captures each module plus a
 * few camera angles. Handy for eyeballing a change without opening a browser.
 *
 *   node scripts/shots.mjs
 */
import { existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const PORT = 4395;
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => existsSync(p));
if (!CHROME) throw new Error('Chrome/Edge not found');

const outDir = 'artifacts';
mkdirSync(outDir, { recursive: true });

const server = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { stdio: 'ignore', shell: process.platform === 'win32' },
);
const waitUp = async () => {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return;
    } catch {
      /* keep polling */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('preview server did not start');
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await waitUp();
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
});
const page = await browser.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') console.log('ERR', m.text());
});
await page.setViewport({ width: 1500, height: 1000 });
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle2' });
await page.waitForFunction(() => window.__lab, { timeout: 30000 });
await sleep(1200);

const shot = async (name) => {
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log('shot', name);
};

await shot('01-assembly');

for (const tab of ['travel', 'preview', 'export']) {
  await page.click(`[data-testid="tab-${tab}"]`);
  await sleep(500);
  await shot(`panel-${tab}`);
}

await page.click('[data-testid="tab-travel"]');
await page.$eval('[data-testid="travel-slider"]', (el) => {
  el.value = el.max;
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(800);
await shot('02-full-bump');
await page.$eval('[data-testid="travel-slider"]', (el) => {
  el.value = el.min;
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(800);
await shot('03-full-droop');

for (const preset of ['longtravel', 'stance']) {
  await page.click(`[data-testid="preset-${preset}"]`);
  await sleep(700);
  await shot(`04-${preset}`);
}

await page.click('[data-testid="toggle-probes"]');
await sleep(900);
await shot('05-occlusion-probes');

const angles = [
  { name: '06-close-front', a: 0.86, b: 1.16, r: 330 },
  { name: '07-close-side', a: 1.45, b: 1.35, r: 300 },
  { name: '08-close-inboard', a: 0.3, b: 1.25, r: 320 },
];
for (const v of angles) {
  await page.evaluate((v) => {
    const cam = window.__lab.scene.activeCamera;
    cam.alpha = v.a;
    cam.beta = v.b;
    cam.radius = v.r;
    cam.setTarget(new (cam.target.constructor)(150, 80, 0));
  }, v);
  await sleep(700);
  await shot(v.name);
}

await browser.close();
server.kill();
console.log('done ->', outDir);
