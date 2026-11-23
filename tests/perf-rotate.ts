import { chromium } from 'playwright';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// 持续拖动旋转 8 秒，周期采集底部统计
const samples: Array<{ hit: string; trans: string; cost: string; swaps: string }> = [];
for (let i = 0; i < 10; i++) {
  await page.mouse.move(750, 475);
  await page.mouse.down();
  await page.mouse.move(750 - 60 + i * 14, 380 + (i % 3) * 60, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(220);
  const text = await page.locator('.stats-bar').innerText();
  samples.push({
    hit: (text.match(/视线穿层数\s*\n?\s*(\d+)/) || [])[1] ?? '?',
    trans: (text.match(/([\d.]+)%/) || [])[1] ?? '?',
    cost: (text.match(/([\d.]+)ms/) || [])[1] ?? '?',
    swaps: (text.match(/交换\s*(\d+)/) || [])[1] ?? '?',
  });
}

console.log('旋转期间采样 (hit / trans% / costMs / swaps):');
for (const s of samples) console.log(`  ${s.hit} 层 | ${s.trans}% | ${s.cost}ms | ${s.swaps} 次`);

const costs = samples.map((s) => Number(s.cost)).filter((n) => Number.isFinite(n));
const maxCost = Math.max(...costs);
const overBudget = costs.filter((c) => c > 2).length;
console.log(`\n峰值耗时 ${maxCost}ms，超预算样本 ${overBudget}/${costs.length}`);
console.log('页面错误:', errors.length ? errors.join('; ') : '无');

await browser.close();
if (maxCost > 2 || errors.length) process.exit(1);
