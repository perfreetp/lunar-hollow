import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox','--ignore-gpu-blocklist','--enable-gpu-rasterization'] });
const page = await (await browser.newContext({ viewport: { width: 1600, height: 960 } })).newPage();
await page.goto(process.argv[2] ?? 'http://localhost:5310/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4500);
await page.evaluate(() => {
  window.np.app.mapHandle.map.jumpTo({ center: [122.1635, 30.0615], zoom: 13.7 });
  window.np.app.selectAid(null);
});
await page.waitForTimeout(800);
// Hold the animated frame that has the most cluster lamps lit at once.
const best = await page.evaluate(async () => {
  const ids = ['L-BAIJIAO','B-LAOREN','B-SISTER-W','B-SISTER-E','F-MID'];
  let bestScore = -1, bestT = 0, bestList = [];
  for (let i = 0; i < 200; i++) {
    const views = window.np.app.lightViews();
    const scores = ids.map(id => ({ id, env: views.find(v => v.aid.id === id)?.envelope ?? 0 }));
    const score = scores.reduce((s, x) => s + x.env, 0);
    if (score > bestScore) { bestScore = score; bestList = scores; bestT = i; }
    await new Promise(r => setTimeout(r, 40));
  }
  return { bestScore: +bestScore.toFixed(2), bestList: bestList.filter(x=>x.env>0.05).map(x=>`${x.id}:${x.env.toFixed(2)}`) };
});
console.log(JSON.stringify(best));
// Pause exactly on a fresh frame and shoot several, keeping the brightest.
await page.evaluate(() => window.np.app.setMotion('frozen'));
await page.waitForTimeout(600);
await page.screenshot({ path: 'shots-final/10-overlap.png' });
const comp = await page.evaluate(() => {
  const c = window.np.app.renderer.lastComposition;
  return c ? { items: c.items.map(x => ({ id: x.source.id, gain: +x.gain.toFixed(2), sup: +x.suppression.toFixed(2), peak: +x.peakAlpha.toFixed(2) })), pairs: c.overlapPairs, maxSup: +c.maxSuppression.toFixed(2) } : null;
});
console.log(JSON.stringify(comp));
await page.evaluate(() => window.np.app.setMode('day'));
await page.waitForTimeout(1300);
await page.screenshot({ path: 'shots-final/11-overlap-day.png' });
await browser.close();
