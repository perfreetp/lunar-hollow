/** 通过 CDP 抓取当前 5183 目标页面的截图，保存为 PNG */
import { writeFileSync } from 'node:fs';

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
await send('Page.enable');
await new Promise((r) => setTimeout(r, 1500));
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(process.argv[2] ?? '/tmp/cdp-shot.png', Buffer.from(shot.result.data, 'base64'));
console.log('saved', process.argv[2] ?? '/tmp/cdp-shot.png');
ws.close();
