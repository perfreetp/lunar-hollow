/** 把相机推近幕墙正面，用于近距离核对彩釉遮罩贴图 */
let page;
for (let i = 0; i < 20; i++) {
  const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  page = list.find((t) => t.type === 'page' && t.url.includes('127.0.0.1:5183'));
  if (page) break;
  await new Promise((r) => setTimeout(r, 500));
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
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.result?.exceptionDetails) return { __error: r.result.exceptionDetails.exception?.description };
  return r.result.result.value;
};
// 近距离正对幕墙顶行（alpha=-PI/2 正面，beta 接近 PI/2 平视）
const out = await ev(`(() => {
  const mgr = document.querySelector('canvas.scene-canvas').__sceneManager;
  mgr.debugSetCamera(7.5, -Math.PI / 2, Math.PI / 2.2, [-3, 7.3, 0]);
  return { patches: mgr.debugPatchCount };
})()`);
console.log(JSON.stringify(out));
await new Promise((r) => setTimeout(r, 800));
ws.close();
