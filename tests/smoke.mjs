// 自动化冒烟测试：本机 Chrome + playwright-core，不下载浏览器
// 用法：node tests/smoke.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = resolve(__dirname, 'shots');
mkdirSync(SHOT_DIR, { recursive: true });
const BASE = await resolveBase();

async function resolveBase() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  for (const port of [5173, 5174, 5175]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return `http://127.0.0.1:${port}`;
    } catch {
      /* try next */
    }
  }
  throw new Error('未找到 Vite dev server，请先 npm run dev 或设置 BASE_URL');
}
const CHROME =
  process.env.CHROME_PATH ||
  'C:/Program Files/Google/Chrome/Application/chrome.exe';

const failures = [];
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures.push(name);
};

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__LH_TOOL__ && window.__LH_STORE__, null, { timeout: 15000 });
await page.waitForTimeout(1500); // 等 shader 编译与首帧稳定

// 1. 基础场景
const stats0 = await page.evaluate(() => window.__LH_TOOL__.debugStats);
check('初始三盏灯塔均已建光束', stats0.beams === 3, JSON.stringify(stats0));
check('无 WebGL/着色器致命错误', !consoleErrors.some((e) => /WebGL|shader|GL_|PAGEERROR/i.test(e)), consoleErrors.join(' | ').slice(0, 300));

const runtime0 = await page.evaluate(() => window.__LH_STORE__.getState().runtime);
check(
  '光斑解算为有效数值',
  runtime0.length === 3 && runtime0.every((r) => Number.isFinite(r.spot.x) && Number.isFinite(r.radius)),
  runtime0.map((r) => `${r.name}:(${r.spot.x.toFixed(0)},${r.spot.z.toFixed(0)}) R${r.radius.toFixed(0)}`).join(' / '),
);

await page.screenshot({ path: resolve(SHOT_DIR, '01-default-scene.png') });

// 2. 真实鼠标拖拽船体 → 船位更新（验证拾取与拖拽管线）
const before = await page.evaluate(() => ({ ...window.__LH_STORE__.getState().config.ship }));
const start = await page.evaluate(() => {
  const s = window.__LH_STORE__.getState().config.ship;
  return window.__LH_TOOL__.worldToScreen(s.x, 3, s.z);
});
const end = await page.evaluate(() => window.__LH_TOOL__.worldToScreen(90, 0, 70));
check('拖拽起止点均在视口内', start.visible && end.visible, `(${start.x | 0},${start.y | 0}) → (${end.x | 0},${end.y | 0})`);

await page.mouse.move(start.x, start.y);
await page.mouse.down();
for (let i = 1; i <= 8; i++) {
  await page.mouse.move(start.x + ((end.x - start.x) * i) / 8, start.y + ((end.y - start.y) * i) / 8);
  await page.waitForTimeout(30);
}
await page.mouse.up();
await page.waitForTimeout(300);

const after = await page.evaluate(() => ({ ...window.__LH_STORE__.getState().config.ship }));
check('船位随拖拽更新', Math.hypot(after.x - before.x, after.z - before.z) > 30, `(${before.x},${before.z}) → (${after.x},${after.z})`);
await page.screenshot({ path: resolve(SHOT_DIR, '02-after-drag.png') });

// 2b. 遮挡联动三段式：把船移入第一盏灯光斑中心（应照亮）→ 连线中点放礁石（应变遮挡）→ 移除礁石（应恢复）
const linkResult = await page.evaluate(() => {
  const st = window.__LH_STORE__.getState();
  const lh = st.config.lighthouses[0];
  const rt = st.runtime.find((r) => r.id === lh.id);
  // 船放到光斑中心
  st.setShip({ x: rt.spot.x, z: rt.spot.z, heading: 0 });
  const litBefore = window.__LH_STORE__.getState().runtime.find((r) => r.id === lh.id).shipLit;
  // 在灯芯→船的水平连线中点放一块大礁石作为遮挡体
  const mx = (lh.x + rt.spot.x) / 2;
  const mz = (lh.z + rt.spot.z) / 2;
  const reef = st.config.reefs[0];
  st.updateReef(reef.id, { x: mx, z: mz, radius: 14 });
  const litOccluded = window.__LH_STORE__.getState().runtime.find((r) => r.id === lh.id).shipLit;
  // 礁石缩回原位 → 应恢复照亮
  st.updateReef(reef.id, { x: -20, z: 10, radius: 9 });
  const litRestored = window.__LH_STORE__.getState().runtime.find((r) => r.id === lh.id).shipLit;
  return { name: lh.name, litBefore, litOccluded, litRestored };
});
check(
  '船在光斑中心被照亮',
  linkResult.litBefore === true,
  `${linkResult.name} litBefore=${linkResult.litBefore}`,
);
check(
  '礁石遮挡后该灯判定为未照亮',
  linkResult.litOccluded === false,
  `litOccluded=${linkResult.litOccluded}`,
);
check(
  '移除礁石后恢复照亮（联动重算）',
  linkResult.litRestored === true,
  `litRestored=${linkResult.litRestored}`,
);
// 把首盏灯设为常亮并截图，保证抓到亮相位，验证体积光柱真实可见
await page.evaluate(() => {
  const id = window.__LH_STORE__.getState().config.lighthouses[0].id;
  window.__LH_STORE__.getState().updateBeam(id, { phase: 0, duty: 1 });
});
await page.waitForTimeout(600);
await page.screenshot({ path: resolve(SHOT_DIR, '02b-occlusion-link.png') });

// 3. 加灯到 12 盏（十余盏同屏）测 FPS
await page.evaluate(() => {
  // 每次 addLighthouse 都会产生新 state，必须重新 getState()
  while (window.__LH_STORE__.getState().config.lighthouses.length < 12) {
    window.__LH_STORE__.getState().addLighthouse();
  }
});
await page.waitForTimeout(2500);
const fps = await page.evaluate(async () => {
  await new Promise((r) => setTimeout(r, 2200));
  return window.__LH_TOOL__.debugStats;
});
check('12 盏灯同屏仍可渲染', fps.beams === 12, JSON.stringify(fps));
// 无头环境走 SwiftShader 软件渲染，阈值放宽；真机 GPU 通常 60fps
check('12 盏灯同屏 FPS ≥ 12（SwiftShader 软件渲染口径）', fps.fps >= 12, `fps=${fps.fps} drawCalls=${fps.drawCalls} tris=${fps.triangles}`);
check('12 灯同屏单帧绘制调用可观测', fps.drawCalls > 20, `drawCalls=${fps.drawCalls}`);
await page.screenshot({ path: resolve(SHOT_DIR, '03-twelve-lights.png') });

// 4. 远灯低分辨率 LOD 开关可切换
const lodOff = await page.evaluate(() => {
  if (window.__LH_STORE__.getState().lowResFar) window.__LH_STORE__.getState().toggle('lowResFar');
  return window.__LH_STORE__.getState().lowResFar;
});
check('低分辨率 LOD 开关生效', lodOff === false);
await page.evaluate(() => window.__LH_STORE__.getState().toggle('lowResFar'));

// 5. 导出 JSON 结构与再导入
const exported = await page.evaluate(() => {
  const cfg = window.__LH_STORE__.getState().config;
  return JSON.parse(JSON.stringify(cfg));
});
check(
  '导出 JSON 结构完整',
  exported.version === 1 && Array.isArray(exported.lighthouses) && Array.isArray(exported.reefs) && exported.ship && exported.environment,
  `lights=${exported.lighthouses.length} reefs=${exported.reefs.length}`,
);
const importOk = await page.evaluate((cfg) => {
  window.__LH_STORE__.getState().importConfig(cfg);
  const st = window.__LH_STORE__.getState();
  return st.config.lighthouses.length === cfg.lighthouses.length && st.runtime.length === cfg.lighthouses.length;
}, exported);
check('导入后场景与 runtime 重建一致', importOk);

// 6. 薄雾可读性：开关雾后光束仍在（对象数不变、无报错）
const mistStats = await page.evaluate(() => {
  const st = window.__LH_STORE__.getState();
  if (st.mistEnabled) st.toggle('mistEnabled');
  return window.__LH_TOOL__.debugStats;
});
check('雾开关切换不破坏渲染', mistStats.beams === 12);
check('全程无新增致命错误', !consoleErrors.some((e) => /PAGEERROR|Uncaught|TypeError|ReferenceError/i.test(e)), consoleErrors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${failures.length === 0 ? 'ALL CHECKS PASSED' : `${failures.length} CHECK(S) FAILED: ${failures.join(', ')}`}`);
process.exit(failures.length ? 1 : 0);
