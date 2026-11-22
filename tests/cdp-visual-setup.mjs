/**
 * 视觉验证准备脚本（幂等）：把顶行 6 格配成三种玻璃并存的状态。
 * 每一步都做空值防护，失败时返回具体阶段而非抛异常。
 */
let page;
for (let i = 0; i < 20; i++) {
  const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  page = list.find((t) => t.type === 'page' && t.url.includes('127.0.0.1:5183'));
  if (page) break;
  await new Promise((r) => setTimeout(r, 500));
}
if (!page) {
  console.log('NO_TARGET');
  process.exit(1);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) {
    pend.get(m.id)(m);
    pend.delete(m.id);
  }
};
const send = (method, params = {}) => {
  const i = ++id;
  return new Promise((res) => {
    pend.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
};
await send('Runtime.enable');
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) {
    return { __error: r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text };
  }
  return r.result.result.value;
};

const result = await ev(`(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const chips = document.querySelectorAll('.cell-chip');
  if (chips.length < 6) return { __error: 'chips=' + chips.length };
  // 玻璃类型 select 是文档中第一个 select（太阳/网格面板只有 range）
  const typeSelect = () => document.querySelector('.panel-block select');
  const cellBlock = () => typeSelect()?.closest('.panel-block');
  const setSelect = (el, val) => {
    const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    d.call(el, val);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const setRange = (el, val) => {
    const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    d.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const setup = [
    { type: 'clear' },
    { type: 'coated', tintIdx: 1 },
    { type: 'coated', tintIdx: 2 },
    { type: 'fritted', pattern: 'dot', coverage: 0.4 },
    { type: 'fritted', pattern: 'stripe', coverage: 0.4 },
    { type: 'fritted', pattern: 'diamond', coverage: 0.4 },
  ];
  for (let idx = 0; idx < setup.length; idx++) {
    const cfg = setup[idx];
    chips[idx].click();
    await sleep(120); // 等 Vue 渲染选中态与玻璃参数控件
    const ts = typeSelect();
    if (!ts) return { __error: 'no type select at idx ' + idx };
    setSelect(ts, cfg.type);
    await sleep(120); // 等类型切换后的条件控件（色偏/遮罩）渲染
    const block = cellBlock();
    if (cfg.tintIdx !== undefined) {
      const tints = block?.querySelectorAll('.tint-chip');
      if (!tints || tints.length <= cfg.tintIdx) return { __error: 'tint missing at idx ' + idx };
      tints[cfg.tintIdx].click();
      await sleep(80);
    }
    if (cfg.pattern) {
      const patternSelect = block?.querySelectorAll('select')[1];
      if (!patternSelect) return { __error: 'pattern select missing at idx ' + idx };
      setSelect(patternSelect, cfg.pattern);
      await sleep(80);
      const ranges = block?.querySelectorAll('input[type=range]');
      if (!ranges?.length) return { __error: 'ranges missing at idx ' + idx };
      setRange(ranges[0], cfg.coverage);
      await sleep(80);
    }
  }
  return { ok: true };
})()`);

await new Promise((r) => setTimeout(r, 1200));
const patchCount = await ev(`document.querySelector('canvas.scene-canvas').__sceneManager.debugPatchCount`);
console.log(JSON.stringify({ result, patchCount }));
ws.close();
