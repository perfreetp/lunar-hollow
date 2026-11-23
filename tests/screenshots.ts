import { chromium } from 'playwright';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// 正视
await page.screenshot({ path: 'tests/shot-front.png' });

// 掠射视角：OrbitControls 旋转
await page.mouse.move(750, 475);
await page.mouse.down();
await page.mouse.move(220, 500, { steps: 16 });
await page.mouse.up();
await page.waitForTimeout(900);
const grazingStats = await page.locator('.stats-bar').innerText();
await page.screenshot({ path: 'tests/shot-grazing.png' });

// 回到接近正视并隔离第 3 层
await page.mouse.move(750, 475);
await page.mouse.down();
await page.mouse.move(1150, 460, { steps: 14 });
await page.mouse.up();
await page.waitForTimeout(700);
await page.locator('.layer-card').nth(2).locator('.isolate-btn').click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'tests/shot-isolated.png' });

console.log('掠射统计:', grazingStats.replace(/\n/g, ' | '));
await browser.close();
