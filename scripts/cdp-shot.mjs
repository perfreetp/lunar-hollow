/**
 * CDP 截图脚本：启动/连接无头 Edge，等待真实渲染（不依赖虚拟时间竞态），
 * 抓取页面 canvas 帧保存为 PNG。用法：node scripts/cdp-shot.mjs <url> <out.png>
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [, , url, outPath] = process.argv;
if (!url || !outPath) {
  console.error('usage: node cdp-shot.mjs <url> <out.png>');
  process.exit(1);
}
// 支持 BASE 环境变量覆盖源站
const target = url.startsWith('http') ? url : `http://localhost:${process.env.BASE_PORT || 5173}${url}`;

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222 + Math.floor(Math.random() * 500);
const profile = join(tmpdir(), `cdp-edge-${Date.now()}`);
await mkdir(profile, { recursive: true });

const edge = spawn(EDGE, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--window-size=1600,900',
  'about:blank'
], { stdio: ['ignore', 'pipe', 'pipe'] });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await res.json();
      return j.webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  throw new Error('CDP endpoint not reachable');
}

const wsUrl = await getWsUrl();
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
};
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

const { targetId } = await send('Target.createTarget', { url });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const call = (method, params = {}) => send(method, params, sessionId);

await call('Page.enable');
await new Promise((r) => {
  const onLoad = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Page.loadEventFired' && m.sessionId === sessionId) {
      ws.removeEventListener('message', onLoad);
      r();
    }
  };
  ws.addEventListener('message', onLoad);
});
// 等待 three.js 渲染多帧 + Svelte 组件稳定
await sleep(3500);

const { data } = await call('Page.captureScreenshot', { format: 'png' });
await writeFile(outPath, Buffer.from(data, 'base64'));
console.log('saved', outPath, Buffer.byteLength(Buffer.from(data, 'base64')), 'bytes');

await call('Browser.close').catch(() => {});
edge.kill();
process.exit(0);
