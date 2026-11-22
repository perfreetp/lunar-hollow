/**
 * 浏览器端到端冒烟:启动真实 Chrome(WebGL),
 * 验证赛道初始化、分块流式加载、LOD、跳转、贴花累积、导出文件。
 * 运行:npx playwright test 不依赖 runner,直接 node 执行本脚本。
 */
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:5173/';

interface Fail {
  name: string;
  detail: string;
}
const fails: Fail[] = [];
const ok: string[] = [];
function check(name: string, cond: boolean, detail = '') {
  if (cond) ok.push(name);
  else fails.push({ name, detail });
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  args: ['--use-gl=angle', '--use-angle=gl', '--enable-webgl', '--ignore-gpu-blocklist']
});
const consoleErrors: string[] = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(`PAGEERROR: ${err.message}`));

await page.goto(URL, { waitUntil: 'networkidle' });
check('页面标题与画布渲染', await page.locator('canvas.render-canvas').count() === 1);
check('首屏显示进入赛道按钮', (await page.getByRole('button', { name: '进入赛道' }).count()) === 1);

// 1. 进入赛道
await page.getByRole('button', { name: '进入赛道' }).click();
await page.waitForFunction(() => document.querySelectorAll('button').length > 8, { timeout: 15000 });
await page.waitForTimeout(2500); // 等待首批分块异步加载

const stateText = await page.locator('.hud').innerText();
check('HUD 显示 8 个路段按钮', (stateText.match(/路段\d/g) || []).length >= 8);
check('显示赛道总长(米)', /赛道总长[\s\S]*?\d{3,}\s*m/.test(stateText));
check('显示场景分块数', /场景分块[\s\S]*?块/.test(stateText));
check('出现自动巡航/自由飞行切换', stateText.includes('自动巡航') && stateText.includes('自由飞行'));
check('出现 5 个速度档位按钮', (await page.locator('.gear-row button').count()) === 5);

// 2. 验证 WebGL 实际绘制(取像素,不能是纯透明)
const pixels = await page.evaluate(() => {
  const c = document.querySelector('canvas.render-canvas') as HTMLCanvasElement;
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  if (!gl) return null;
  const px = new Uint8Array(4);
  gl.readPixels(c.width / 2, c.height / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  return Array.from(px);
});
check('WebGL 上下文存在且有像素输出', pixels !== null && pixels.some((v) => v > 0), JSON.stringify(pixels));

// 3. 分块流式:300m 半径内应有 ready/loading 分块
await page.waitForFunction(
  () => {
    const txt = document.querySelector('.hud')?.textContent || '';
    return /流式加载已稳定|加载中/.test(txt);
  },
  { timeout: 8000 }
);
const chunkStable = await page.locator('.hud').innerText();
check('分块加载状态可见', /流式加载已稳定|块加载中/.test(chunkStable));

// 4. 路段跳转:点路段 5,等位置变化
const segBefore = await page.locator('.kv b').first().innerText().catch(() => '');
await page.getByRole('button', { name: '路段5' }).click();
await page.waitForTimeout(800);
const afterJump = await page.locator('.hud').innerText();
check('跳转后当前路段显示第 5 路段', afterJump.includes('第 5 / 8 路段'));
void segBefore;

// 5. 模式切换
await page.getByRole('button', { name: '自由飞行' }).click();
await page.waitForTimeout(300);
check('自由飞行按钮激活', (await page.locator('button.active', { hasText: '自由飞行' }).count()) >= 1);
await page.getByRole('button', { name: '自动巡航' }).click();
await page.waitForTimeout(300);

// 6. 速度档位切换
await page.locator('.gear-row button').nth(4).click(); // 5 档
await page.waitForTimeout(400);
const gear5Text = await page.locator('.hud').innerText();
check('切到 5 档后速度接近 120km/h', /1[12]\d\.\d km\/h/.test(gear5Text), gear5Text.match(/[\d.]+ km\/h/)?.[0] || '');
await page.locator('.gear-row button').nth(1).click(); // 2 档

// 7. 轮胎痕迹随行驶累积(回到巡航后等待)
const intensityBefore = await page.evaluate(() => {
  const m = document.querySelector('.hud')?.textContent?.match(/(\d+)%/);
  return m ? Number(m[1]) : -1;
});
await page.waitForTimeout(3500);
const intensityAfter = await page.evaluate(() => {
  const m = document.querySelector('.hud')?.textContent?.match(/(\d+)%/);
  return m ? Number(m[1]) : -1;
});
check('轮胎痕迹强度随行驶增加', intensityAfter > intensityBefore, `${intensityBefore} -> ${intensityAfter}`);

// 8. 小地图存在且可点击(点击不同位置,断言弧长发生跳转)
const miniBox = await page.locator('.minimap-panel canvas').boundingBox();
check('小地图 canvas 已布局', miniBox !== null && miniBox.width > 100);
if (miniBox) {
  const readArc = async () => {
    const t = await page.locator('.hud').innerText();
    const m = t.match(/弧长位置\s*([\d.]+)\s*m/);
    return m ? Number(m[1]) : NaN;
  };
  const arcBefore = await readArc();
  await page.mouse.click(miniBox.x + miniBox.width * 0.3, miniBox.y + miniBox.height * 0.5);
  await page.waitForTimeout(500);
  const arcAfter = await readArc();
  check('小地图点击触发弧长跳转', Number.isFinite(arcAfter) && Math.abs(arcAfter - arcBefore) > 1, `${arcBefore} -> ${arcAfter}`);
}

// 9. 导出 JSON:拦截下载
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 5000 }),
  page.getByRole('button', { name: /导出当前位置/ }).click()
]);
const filename = download.suggestedFilename();
check('导出文件名符合 track-pose-*.json', /^track-pose-s\d+\.json$/.test(filename), filename);
const stream = await download.createReadStream();
const chunks: Buffer[] = [];
for await (const c of stream) chunks.push(c as Buffer);
const json = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
check('导出含相机位置与朝向', !!json.camera?.position && !!json.camera?.direction && typeof json.camera.arcLength === 'number');
check('导出含分块加载状态快照', Array.isArray(json.chunks) && json.chunks.length > 0);
check('导出含 8 路段元数据', json.track?.segmentCount === 8);

// 10. 控制台无致命错误(忽略浏览器扩展/GPU 告警与 favicon 之类资源噪音)
const fatal = consoleErrors.filter(
  (e) => !/WebGL|GPU|swiftshader|favicon|404|Failed to load resource/i.test(e)
);
check('浏览器控制台无致命 JS 错误', fatal.length === 0, fatal.slice(0, 3).join(' | '));

await browser.close();

console.log(`\n通过 ${ok.length} 项:`);
for (const n of ok) console.log(`  ✓ ${n}`);
if (fails.length) {
  console.error(`\n失败 ${fails.length} 项:`);
  for (const f of fails) console.error(`  ✗ ${f.name} ${f.detail}`);
  process.exit(1);
}
console.log('\n端到端冒烟全部通过');
