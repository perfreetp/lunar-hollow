/**
 * 评估运行器：CDP 打开页面 → 注入交互断言 → 抓分层截图 → 输出 JSON 结果
 * 用法：node scripts/assess-run.mjs <out.json> <layer-shot.png>
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [, , outJson, layerShot] = process.argv;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9300 + Math.floor(Math.random() * 400);
const profile = join(tmpdir(), `cdp-assess-${Date.now()}`);
await mkdir(profile, { recursive: true });

const edge = spawn(EDGE, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--window-size=1600,900', 'about:blank'
], { stdio: ['ignore', 'pipe', 'pipe'] });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getWs() {
  for (let i = 0; i < 40; i++) {
    try { return (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl; }
    catch { await sleep(250); }
  }
  throw new Error('no CDP');
}

const ws = new WebSocket(await getWs());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let mid = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id);
    m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
  }
};
const send = (method, params = {}, sid) => new Promise((resolve, reject) => {
  const id = ++mid;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params, ...(sid ? { sessionId: sid } : {}) }));
});

const { targetId } = await send('Target.createTarget', { url: `http://localhost:${process.env.BASE_PORT || 5173}/?capture=1` });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const call = (method, params = {}) => send(method, params, sessionId);
await call('Page.enable');
await new Promise((r) => {
  const h = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Page.loadEventFired' && m.sessionId === sessionId) { ws.removeEventListener('message', h); r(); }
  };
  ws.addEventListener('message', h);
});
await sleep(2500);

// 第一步：造部分错开的重叠场景并截图（上层齿轮压在下层之上、轴杆贯穿，遮挡可见）
await call('Runtime.evaluate', {
  awaitPromise: true,
  expression: `(() => {
    let cur = null;
    window.__appStore.subscribe((v) => { cur = v; })();
    const g1 = cur.gears[0];
    // 轴心相距约 g1 半径：两轮轮盘部分重叠、各露一半，上下遮挡清晰可见
    window.__overlap = window.__storeActions.addGear(10, g1.gridX + 10, g1.gridY + 8);
  })()`
});
await sleep(1200);
const shot = await call('Page.captureScreenshot', { format: 'png' });
await writeFile(layerShot, Buffer.from(shot.data, 'base64'));

// 第二步：完整断言
const { runAssessments } = await import('./assess.mjs');
let assessment;
try {
  assessment = await runAssessments(call);
} catch (e) {
  console.error('assessment threw:', e);
  process.exit(2);
}
await writeFile(outJson, JSON.stringify(assessment, null, 2));
console.log(JSON.stringify(assessment, null, 2));

await call('Browser.close').catch(() => {});
edge.kill();
process.exit(0);
