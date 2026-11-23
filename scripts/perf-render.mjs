import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
await page.goto('http://localhost:5310/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
const out = await page.evaluate(async () => {
  const r = window.np.app.renderer;
  const proto = Object.getPrototypeOf(r);
  const original = proto.render;
  const samples = [];
  let t0 = 0;
  proto.render = function (ts) {
    t0 = performance.now();
    original.call(this, ts);
    samples.push(performance.now() - t0);
  };
  await new Promise(res => setTimeout(res, 3200));
  proto.render = original;
  samples.sort((a,b)=>a-b);
  const n = samples.length;
  return {
    frames: n,
    medianMs: +samples[Math.floor(n*0.5)].toFixed(2),
    p90Ms: +samples[Math.floor(n*0.9)].toFixed(2),
    maxMs: +samples[n-1].toFixed(2),
    meanMs: +(samples.reduce((a,b)=>a+b,0)/n).toFixed(2),
  };
});
console.log(JSON.stringify(out,null,1));
await browser.close();
