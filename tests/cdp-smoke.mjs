/**
 * 零依赖 CDP 冒烟测试：驱动真实浏览器验证渲染与交互。
 * 用法：先以 --remote-debugging-port=9222 启动 Edge 指向 dev server，
 * 再运行 node tests/cdp-smoke.mjs <base-url>
 */
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5183';

async function getWsUrl() {
  for (let i = 0; i < 20; i++) {
    const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
    const page = list.find((t) => t.type === 'page' && t.url.includes('127.0.0.1:5183'));
    if (page) return page.webSocketDebuggerUrl;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('no target page on :5183 after retries');
}

const ws = new WebSocket(await getWsUrl());
await new Promise((r) => (ws.onopen = r));
let msgId = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
};
function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expression) {
  const r = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.result?.exceptionDetails) {
    throw new Error('JS exception: ' + JSON.stringify(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text));
  }
  return r.result.result.value;
}

const results = [];
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail: String(detail) });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: baseUrl });
await new Promise((r) => setTimeout(r, 9000));

// 1. 引擎与画布
const engineKind = await evalJs(`document.querySelector('.engine-badge').textContent.trim()`);
check('引擎已初始化（WebGPU 或 WebGL2 回退）', /WebGPU|WebGL2/.test(engineKind), engineKind);
const canvasOk = await evalJs(`(() => {
  const c = document.querySelector('canvas.scene-canvas');
  return c && c.dataset.engine?.startsWith('Babylon') && c.width > 100 && c.height > 100;
})()`);
check('Babylon 画布已挂载且有尺寸', canvasOk);

// 2. 初始眩光读数
const initialGlare = await evalJs(`document.querySelectorAll('.metric-value')[0].textContent`);
check('初始眩光通量已计算', parseFloat(initialGlare) > 0, initialGlare);

// 3. DOM 分格总览的格数
const chipCount = await evalJs(`document.querySelectorAll('.cell-chip').length`);
check('分格总览渲染 8×6=48 格', chipCount === 48, `actual=${chipCount}`);

// 4. 点击分格图选中第 1 格，再改成镀膜
await evalJs(`document.querySelectorAll('.cell-chip')[0].click()`);
await new Promise((r) => setTimeout(r), 300);
const selectedTag = await evalJs(`document.querySelector('.cell-tag')?.textContent.trim() ?? ''`);
check('点击后出现选中态', /第 1 格/.test(selectedTag), selectedTag);

await evalJs(`(() => {
  const sel = document.querySelectorAll('.panel-block select')[0];
  sel.value = 'coated';
  sel.dispatchEvent(new Event('change', { bubbles: true }));
})()`);
await new Promise((r) => setTimeout(r), 600);
const tintRowVisible = await evalJs(`!!document.querySelector('.tint-row')`);
check('切换镀膜玻璃后出现色偏选择器', tintRowVisible);

// 5. 切换彩釉，验证遮罩控件
await evalJs(`(() => {
  const sel = document.querySelectorAll('.panel-block select')[0];
  sel.value = 'fritted';
  sel.dispatchEvent(new Event('change', { bubbles: true }));
})()`);
await new Promise((r) => setTimeout(r), 600);
const fritControls = await evalJs(`document.body.innerText.includes('彩釉覆盖率') && document.body.innerText.includes('图案周期')`);
check('彩釉玻璃显示遮罩覆盖率/周期控件', fritControls);

// 6. 改透射率滑杆到 20%，验证读数联动
await evalJs(`(() => {
  const ranges = [...document.querySelectorAll('input[type=range]')];
  const t = ranges.find(r => r.min === '0.1' && r.max === '0.9' && r.step === '0.01');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(t, 0.2);
  t.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await new Promise((r) => setTimeout(r), 600);
const openFractionText = await evalJs(`document.body.innerText.match(/透光面积占比\\s*(\\d+%)/)?.[1] ?? ''`);
check('彩釉覆盖率 50% 时开孔率显示 50%', openFractionText === '50%', openFractionText);

// 7. 双层玻璃开关
const beforeDouble = await evalJs(`document.querySelectorAll('.metric-value')[1].textContent`);
await evalJs(`(() => {
  const cb = document.querySelector('.field.switch input[type=checkbox]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked').set;
  setter.call(cb, true);
  cb.dispatchEvent(new Event('change', { bubbles: true }));
  return cb.checked;
})()`);
await new Promise((r) => setTimeout(r), 900);
const afterDouble = await evalJs(`document.querySelectorAll('.metric-value')[1].textContent`);
check('双层开启后平均透射比下降', parseFloat(afterDouble) < parseFloat(beforeDouble), `${beforeDouble} -> ${afterDouble}`);
const gapVisible = await evalJs(`document.body.innerText.includes('层间距')`);
check('双层开启后出现层间距控制', gapVisible);
const layerCounts = await evalJs(`(() => {
  const glass = document.querySelector('canvas.scene-canvas').__sceneManager.scene.meshes
    .filter((m) => m.name.startsWith('glass'));
  return {
    l0: glass.filter((m) => m.name.endsWith('-l0')).length,
    l1: glass.filter((m) => m.name.endsWith('-l1')).length,
  };
})()`);
check('双层幕墙生成前后两套玻璃网格（各 48 片）', layerCounts.l0 === 48 && layerCounts.l1 === 48, JSON.stringify(layerCounts));

// 8. 导出/导入往返：在页面内调用 store 的导出文本，再导入回去
const roundTrip = await evalJs(`(async () => {
  // 找到 Vue 应用实例比较困难，改为直接触发导出下载并拦截 blob 内容
  const blobText = await new Promise((resolve) => {
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = (blob) => {
      blob.text().then(resolve);
      return origCreate.call(URL, blob);
    };
    document.querySelector('.primary-btn').click();
  });
  const parsed = JSON.parse(blobText);
  const magicOk = parsed.magic === 'CURTAIN_WALL_SCHEME';
  const cell0Fritted = parsed.config.cells[0].type === 'fritted';
  const cell0Tau = parsed.config.cells[0].transmittance;
  return { magicOk, cell0Fritted, cell0Tau, length: parsed.config.cells.length };
})()`);
check('导出文件含正确 magic 与完整分格', roundTrip.magicOk && roundTrip.length === 48, JSON.stringify(roundTrip));
check('导出内容反映已修改的玻璃参数', roundTrip.cell0Fritted && Math.abs(roundTrip.cell0Tau - 0.2) < 1e-9, JSON.stringify(roundTrip));

// 9. 导入非法文件应报错而不崩溃
const badImport = await evalJs(`(() => {
  // 直接用 FileReader 路径：构造 File 并喂给隐藏 input
  const input = document.querySelector('.file-btn input[type=file]');
  const dt = new DataTransfer();
  dt.items.add(new File(['{not valid'], 'bad.json', { type: 'application/json' }));
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`);
await new Promise((r) => setTimeout(r), 400);
const errorShown = await evalJs(`!!document.querySelector('.error-box')`);
check('非法方案文件被拒绝并提示错误', badImport && errorShown);
const stillAlive = await evalJs(`document.querySelectorAll('.cell-chip').length === 48 && !!document.querySelector('canvas')`);
check('报错后应用仍存活、场景未被破坏', stillAlive);

// 10. 改太阳高度角：眩光通量按定义与角度无关，但光斑几何必须整体重算
const patchesBefore = await evalJs(`document.querySelector('canvas.scene-canvas').__sceneManager.debugPatchCount`);
await evalJs(`(() => {
  const ranges = [...document.querySelectorAll('input[type=range]')];
  const alt = ranges.find(r => r.min === '5' && r.max === '90');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(alt, 15);
  alt.dispatchEvent(new Event('input', { bubbles: true }));
})()`);
await new Promise((r) => setTimeout(r), 800);
const patchesAfter = await evalJs(`document.querySelector('canvas.scene-canvas').__sceneManager.debugPatchCount`);
check('日照改变触发光斑整体重算（几何数量变化）', patchesBefore > 0 && patchesAfter > 0 && patchesBefore !== patchesAfter, `${patchesBefore} -> ${patchesAfter}`);

// 11. 太阳降到贴地（高度角 1°）：投影逻辑应返回零光斑且不报错
const grazingCount = await evalJs(`(() => {
  const mgr = document.querySelector('canvas.scene-canvas').__sceneManager;
  mgr.debugSetSun(30, 1);
  return mgr.debugPatchCount;
})()`);
check('贴地太阳（高度角 1°）产出零光斑', grazingCount === 0, `count=${grazingCount}`);
// 恢复角度，光斑应重新出现
const recovered = await evalJs(`(() => {
  const mgr = document.querySelector('canvas.scene-canvas').__sceneManager;
  mgr.debugSetSun(30, 45);
  return mgr.debugPatchCount;
})()`);
check('角度恢复后光斑重新生成', recovered > 0, `count=${recovered}`);

// 12. GL 上下文健康检查
const sceneHealth = await evalJs(`(() => {
  const c = document.querySelector('canvas.scene-canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  return { hasGL: !!gl, w: c.width, h: c.height };
})()`);
check('GL 上下文在全部交互后仍存活', sceneHealth.hasGL);

const failed = results.filter((r) => !r.pass);
console.log(`\\n=== ${results.length - failed.length}/${results.length} passed ===`);
ws.close();
process.exit(failed.length ? 1 : 0);
