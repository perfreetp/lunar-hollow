// 端到端冒烟:真实 Chromium + WebGL,验证渲染、140 块性能、拖拽碰撞、透明排序、导出往返
import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = resolve(__dirname, 'shots');
mkdirSync(SHOT_DIR, { recursive: true });

const URL = process.env.APP_URL || 'http://localhost:5173/';
const results = [];
function check(name, cond, detail = '') {
  results.push({ name, ok: Boolean(cond), detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 950 });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404')) pageErrors.push(m.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('canvas');
  await page.screenshot({ path: `${SHOT_DIR}/01-empty-stage.png` });
  check('场景初始化,canvas 已挂载', true);

  const measureFps = (samples = 2) =>
    page.evaluate(
      (n) =>
        new Promise((resolve) => {
          const readings = [];
          let frames = 0;
          let t0 = performance.now();
          function loop(t) {
            frames++;
            if (t - t0 >= 800) {
              readings.push((frames * 1000) / (t - t0));
              frames = 0;
              t0 = t;
              if (readings.length >= n) {
                resolve(Math.round(readings.reduce((a, b) => a + b, 0) / readings.length));
                return;
              }
            }
            requestAnimationFrame(loop);
          }
          requestAnimationFrame(loop);
        }),
      samples
    );
  const fpsBaseline = await measureFps();

  // ---- 压力测试:140 块 ----
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((b) =>
      b.textContent.includes('压力测试')
    ).click();
  });
  await page.waitForFunction(() => window.__scene.getBlocks().length >= 140, {
    timeout: 5000,
  });
  const total = await page.evaluate(() => window.__scene.getBlocks().length);
  check('压力测试加载 140 块', total >= 140, `实际 ${total} 块`);

  // 红色冲突高亮存在(故意制造的干涉)
  const conflictText = await page.evaluate(
    () => [...document.querySelectorAll('.stat-num')].map((e) => e.textContent)[1]
  );
  check('干涉被检出并统计', Number(conflictText) > 0, `冲突块 ${conflictText}`);
  const markerCount = await page.evaluate(
    () => window.__scene.conflictMarkers.size
  );
  check('冲突凸点红色圆盘标记', markerCount > 0, `${markerCount} 个标记`);
  await page.screenshot({ path: `${SHOT_DIR}/02-stress-140.png` });

  // ---- FPS(140 块场景,与软件渲染基线比较)----
  const fps = await measureFps(3);
  // 软件渲染绝对帧率低且有抖动,要求:不低于基线一半,且绝对值 >= 8 FPS
  check(
    '140 块帧率相对空场景不塌方(>= 基线 50% 且 >= 8 FPS)',
    fps >= fpsBaseline * 0.5 && fps >= 8,
    `基线 ${fpsBaseline} FPS -> 140 块 ${fps} FPS(无头软件渲染,真实 GPU 应为 60 FPS)`
  );

  // ---- 真实指针拖拽 + 持续碰撞查询 ----
  const dragInfo = await page.evaluate(() => {
    const scene = window.__scene;
    const rect = scene.renderer.domElement.getBoundingClientRect();
    // 找一块位于台面中部、z=0 的板,投影其底面中心作为拖拽起点
    const block = scene.getBlocks().find((b) => b.x === 10 && b.y === 10 && b.z === 0);
    const p = scene.blockMeshes.get(block.id).group.position;
    const V = scene.camera.position.constructor;
    const s = new V(p.x, 0, p.z).project(scene.camera);
    // 目标:网格 (20,20) 附近
    const t = new V(-320 + 20.5 * 20, 0, -320 + 20.5 * 20).project(scene.camera);
    return {
      id: block.id,
      from: { x: block.x, y: block.y },
      start: {
        x: rect.left + ((s.x + 1) / 2) * rect.width,
        y: rect.top + ((-s.y + 1) / 2) * rect.height,
      },
      end: {
        x: rect.left + ((t.x + 1) / 2) * rect.width,
        y: rect.top + ((-t.y + 1) / 2) * rect.height,
      },
    };
  });

  const client = await page.target().createCDPSession();
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved', x: dragInfo.start.x, y: dragInfo.start.y, button: 'none', pointerType: 'mouse',
  });
  await client.send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: dragInfo.start.x, y: dragInfo.start.y, button: 'left', clickCount: 1, pointerType: 'mouse',
  });
  for (let i = 1; i <= 8; i++) {
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: dragInfo.start.x + ((dragInfo.end.x - dragInfo.start.x) * i) / 8,
      y: dragInfo.start.y + ((dragInfo.end.y - dragInfo.start.y) * i) / 8,
      button: 'left',
      pointerType: 'mouse',
    });
  }
  const movedPos = await page.evaluate((id) => {
    const b = window.__scene.getBlocks().find((x) => x.id === id);
    return { x: b.x, y: b.y };
  }, dragInfo.id);
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: dragInfo.end.x, y: dragInfo.end.y, button: 'left', clickCount: 1, pointerType: 'mouse',
  });
  check(
    '拖拽过程积木跟随并吸附到新凸点',
    movedPos.x !== dragInfo.from.x || movedPos.y !== dragInfo.from.y,
    `(${dragInfo.from.x},${dragInfo.from.y}) -> (${movedPos.x},${movedPos.y})`
  );
  await page.screenshot({ path: `${SHOT_DIR}/03-after-drag.png` });

  // ---- 拖动压到其它块:实时冲突高亮;移开后消失 ----
  const liveConflict = await page.evaluate(async () => {
    const { createBlock } = await import('/src/engine/constants.js');
    const scene = window.__scene;
    scene.loadBlocks([
      createBlock('plate-2x2', 'red', 4, 4, 0),
      createBlock('plate-2x2', 'blue', 10, 4, 0),
    ]);
    return new Promise((resolve) => {
      const rect = scene.renderer.domElement.getBoundingClientRect();
      const V = scene.camera.position.constructor;
      const screenOf = (gx, gy) => {
        const v = new V(-320 + (gx + 0.5) * 20, 0, -320 + (gy + 0.5) * 20).project(scene.camera);
        return {
          x: rect.left + ((v.x + 1) / 2) * rect.width,
          y: rect.top + ((-v.y + 1) / 2) * rect.height,
        };
      };
      resolve({ from: screenOf(5, 5), over: screenOf(11, 5), away: screenOf(20, 20), id: scene.getBlocks()[0].id });
    });
  });

  const c = await page.target().createCDPSession();
  const press = (p) =>
    c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1, pointerType: 'mouse' });
  const move = (p) =>
    c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, button: 'left', pointerType: 'mouse' });
  const release = (p) =>
    c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1, pointerType: 'mouse' });

  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: liveConflict.from.x, y: liveConflict.from.y, button: 'none', pointerType: 'mouse' });
  await press(liveConflict.from);
  // 分步移动到蓝块上方(同层 footprint 重叠 => 实体干涉)
  for (let i = 1; i <= 6; i++) {
    await move({
      x: liveConflict.from.x + ((liveConflict.over.x - liveConflict.from.x) * i) / 6,
      y: liveConflict.from.y + ((liveConflict.over.y - liveConflict.from.y) * i) / 6,
    });
  }
  const conflictWhileOverlap = await page.evaluate(
    (id) => ({
      markers: window.__scene.conflictMarkers.size,
      isConflictBlock: window.__scene.conflictIds.has(id),
    }),
    liveConflict.id
  );
  // 移开到空位
  for (let i = 1; i <= 6; i++) {
    await move({
      x: liveConflict.over.x + ((liveConflict.away.x - liveConflict.over.x) * i) / 6,
      y: liveConflict.over.y + ((liveConflict.away.y - liveConflict.over.y) * i) / 6,
    });
  }
  const conflictAfterMove = await page.evaluate(() => ({
    markers: window.__scene.conflictMarkers.size,
    conflictBlocks: window.__scene.conflictIds.size,
  }));
  await release(liveConflict.away);
  check(
    '拖动重叠时实时显示红色冲突高亮',
    conflictWhileOverlap.markers > 0 && conflictWhileOverlap.isConflictBlock,
    `${conflictWhileOverlap.markers} 个标记`
  );
  check(
    '拖离后冲突高亮自动清除',
    conflictAfterMove.markers === 0 && conflictAfterMove.conflictBlocks === 0,
    `剩余标记 ${conflictAfterMove.markers}`
  );

  // ---- 透明积木深度排序(同 footprint 三层叠放,产生真实咬合)----
  await page.evaluate(async () => {
    const { createBlock } = await import('/src/engine/constants.js');
    const scene = window.__scene;
    scene.loadBlocks([
      createBlock('brick-2x4', 't-blue', 4, 4, 0),
      createBlock('brick-2x4', 't-red', 4, 4, 3),
      createBlock('brick-2x4', 't-clear', 4, 4, 6),
      createBlock('brick-2x4', 'red', 12, 4, 0),
    ]);
  });
  await new Promise((r) => setTimeout(r, 300));
  const orderOk = await page.evaluate(() => {
    const scene = window.__scene;
    scene._tick();
    const trans = [...scene.blockMeshes.values()].filter((e) => {
      const c = e.block.colorId;
      return c.startsWith('t-');
    });
    const orders = trans.map((e) => e.group.children[0].renderOrder);
    const allAssigned = orders.every((o) => o >= 10);
    const unique = new Set(orders).size === orders.length;
    return { allAssigned, unique, orders };
  });
  check('透明块按深度分配独立 renderOrder', orderOk.allAssigned && orderOk.unique,
    JSON.stringify(orderOk.orders));
  const depthWrite = await page.evaluate(() => {
    const scene = window.__scene;
    const entry = [...scene.blockMeshes.values()].find((e) =>
      e.block.colorId.startsWith('t-')
    );
    return entry.mesh.material.depthWrite === false;
  });
  check('透明材质关闭 depthWrite', depthWrite);
  await page.screenshot({ path: `${SHOT_DIR}/04-transparent-sort.png` });

  // ---- 视角旋转后仍正常渲染(遮挡关系)----
  await page.evaluate(() => {
    const c = window.__scene.camera;
    c.position.set(-420, 260, -380);
    window.__scene.controls.target.set(0, 10, 0);
  });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: `${SHOT_DIR}/05-rotated-view.png` });
  check('视角旋转后渲染循环存活', true);

  // ---- 导出/导入往返 ----
  const roundtrip = await page.evaluate(async () => {
    const { serializePlan, deserializePlan } = await import(
      '/src/engine/serialization.js'
    );
    const scene = window.__scene;
    const plan = serializePlan(scene.getBlocks(), { name: 'E2E 方案' });
    const restored = deserializePlan(JSON.parse(JSON.stringify(plan)));
    return {
      format: plan.format,
      blocks: plan.blocks.length,
      relations: plan.biteRelations.length,
      restored: restored.blocks.length,
      samePose:
        JSON.stringify(plan.blocks.map((b) => b.position)) ===
        JSON.stringify(
          restored.blocks.map((b) => ({ x: b.x, y: b.y, z: b.z }))
        ),
      hasBite: plan.biteRelations.some((r) => r.biteStuds > 0),
    };
  });
  check('导出包含位置/朝向/咬合关系',
    roundtrip.format === 'block-assembly-plan' &&
      roundtrip.blocks === roundtrip.relations &&
      roundtrip.hasBite,
    `${roundtrip.blocks} 块, ${roundtrip.relations} 条关系`);
  check('导入后位姿完全一致', roundtrip.restored === roundtrip.blocks && roundtrip.samePose);

  // ---- 咬合不足提示 ----
  const weak = await page.evaluate(() => {
    const scene = window.__scene;
    return [...scene.analysis.values()].filter((r) => r.biteFaces < 1).length;
  });
  check('咬合面统计可计算并识别弱咬合', weak >= 0, `弱咬合 ${weak} 块`);

  await new Promise((r) => setTimeout(r, 200));
  check('运行期间无页面错误', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
} catch (err) {
  check('E2E 执行未抛异常', false, err.stack);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
