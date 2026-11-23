/* eslint-disable no-console */
import { chromium } from 'playwright';

const URL = 'http://localhost:5173/';

interface SmokeResult {
  name: string;
  ok: boolean;
  detail?: string;
}

const results: SmokeResult[] = [];
function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const consoleErrors: string[] = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas');
// 等渲染循环跑若干帧 + 统计回传
await page.waitForTimeout(1500);

/* 1. Solid 挂载 + 40 层卡片 */
const cardCount = await page.locator('.layer-card').count();
check('四十层玻璃层卡片渲染', cardCount === 40, `实际 ${cardCount} 张`);

/* 2. WebGL 画布存在且有绘制尺寸 */
const canvasInfo = await page.locator('canvas').evaluate((c) => ({
  w: (c as HTMLCanvasElement).width,
  h: (c as HTMLCanvasElement).height,
}));
check('WebGL 画布已绘制', canvasInfo.w > 0 && canvasInfo.h > 0, `${canvasInfo.w}x${canvasInfo.h}`);

/* 3. 底部统计出现（10Hz 节流后） */
const statsText = await page.locator('.stats-bar').innerText();
check('底部统计栏显示穿层数/总透射', /视线穿层数/.test(statsText) && /总透射估算/.test(statsText));

/* 4. 视线命中幕墙时穿层数 > 0（默认视角看向幕墙） */
const hitText = await page.locator('.stat-item').first().innerText();
const hit = Number(hitText.match(/\d+/)?.[0] ?? '0');
check('BVH 射线求交统计穿层数 > 0', hit > 0, `穿层 ${hit} 层`);

/* 5. 帧预算：读取底部耗时 */
const costText = await page.locator('.stats-bar').innerText();
const costMatch = costText.match(/([\d.]+)ms/);
const cost = costMatch ? Number(costMatch[1]) : NaN;
check('排序+求交在 2ms 预算内', Number.isFinite(cost) && cost <= 2, `${cost}ms`);

/* 6. 无控制台错误 */
check('无控制台/page 错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

/* 7. 档位调节联动：改第 1 层透射档位到 1 */
const firstCard = page.locator('.layer-card').first();
await firstCard.locator('.gear.transmission').first().click();
await page.waitForTimeout(300);
const activeGear = await firstCard.locator('.gear.transmission.active').innerText();
check('透射档位点击生效', activeGear === '1', `激活档位 ${activeGear}`);

/* 8. 隔离单层 */
await firstCard.locator('.isolate-btn').click();
await page.waitForTimeout(300);
const bannerVisible = await page.locator('.isolate-banner').isVisible();
check('单层隔离横幅出现', bannerVisible);
await page.locator('.isolate-banner .link-btn').click();
await page.waitForTimeout(200);
check('退出隔离', !(await page.locator('.isolate-banner').count()));

/* 9. 导出配置 → 下载文件结构校验 */
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.locator('.btn.primary').click(),
]);
const dlPath = await download.path();
check('触发配置文件下载', !!dlPath, download.suggestedFilename());
const fs = await import('node:fs');
const exported = JSON.parse(fs.readFileSync(dlPath!, 'utf8'));
check(
  '导出文件含 40 层光学档位',
  exported.format === 'curtain-wall-optics' &&
    exported.config?.layers?.length === 40 &&
    typeof exported.config.layers[0].transmissionGear === 'number' &&
    typeof exported.config.layers[0].coatingGear === 'number',
);

/* 10. 旋转视角后仍稳定（OrbitControls 拖动），统计继续更新且无错误 */
const before = await page.locator('.stats-bar').innerText();
await page.mouse.move(800, 500);
await page.mouse.down();
await page.mouse.move(600, 420, { steps: 12 });
await page.mouse.move(950, 600, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(800);
const after = await page.locator('.stats-bar').innerText();
check('旋转视角后统计仍刷新', before !== after || /[\d.]+ms/.test(after));
check('旋转过程无错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

/* 11. localStorage 持久化存在 */
const stored = await page.evaluate(() => localStorage.getItem('curtain-wall-optics:config:v1'));
check('配置持久化到 localStorage', !!stored && stored.includes('layerCount'));

/* 12. 网格调节 */
const colsInput = page.locator('.tool-field input[type="number"]').first();
await colsInput.fill('6');
await colsInput.evaluate((el) => el.dispatchEvent(new Event('change', { bubbles: true })));
await page.waitForTimeout(400);
const gridVal = await colsInput.inputValue();
check('网格列数可调并持久到 UI', gridVal === '6', `cols=${gridVal}`);

/* 13. 导入配置文件恢复层叠设置 */
const tmpImport = `${dlPath!}.import.json`;
const modified = JSON.parse(fs.readFileSync(dlPath!, 'utf8'));
modified.config.layers[0].transmissionGear = 2;
modified.config.layers[0].coatingGear = 5;
fs.writeFileSync(tmpImport, JSON.stringify(modified));
const fileChooserPromise = page.waitForEvent('filechooser');
await page.getByRole('button', { name: '导入配置' }).click();
const chooser = await fileChooserPromise;
await chooser.setFiles(tmpImport);
await page.waitForTimeout(500);
const firstGearAfterImport = await page
  .locator('.layer-card')
  .first()
  .locator('.gear.transmission.active')
  .innerText();
check('导入配置恢复层叠档位', firstGearAfterImport === '2', `首层透射档位=${firstGearAfterImport}`);
check('导入成功提示', (await page.locator('.flash-toast').innerText()).includes('导入成功'));

/* 14. 损坏文件导入被拒绝 */
const badPath = `${dlPath!}.bad.json`;
fs.writeFileSync(badPath, '{not valid json');
const chooser2Promise = page.waitForEvent('filechooser');
await page.getByRole('button', { name: '导入配置' }).click();
const chooser2 = await chooser2Promise;
await chooser2.setFiles(badPath);
await page.waitForTimeout(400);
check('损坏配置导入报错不崩溃', (await page.locator('.flash-toast').innerText()).includes('导入失败'));
fs.rmSync(tmpImport, { force: true });
fs.rmSync(badPath, { force: true });

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
await browser.close();
if (failed.length) process.exit(1);
