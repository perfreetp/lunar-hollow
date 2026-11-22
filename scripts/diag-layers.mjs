/**
 * 分层渲染诊断：添加重叠齿轮后，查询 three.js 场景里每个齿轮 group 的位置/z/层
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 9511;
const profile = join(tmpdir(), `cdp-diag-${Date.now()}`);
await mkdir(profile, { recursive: true });
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--window-size=1600,900', 'about:blank'
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 40; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl; break; }
  catch { await sleep(250); }
}
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let mid = 0;
const pend = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
};
const send = (method, params = {}, sid) => new Promise((res, rej) => {
  const id = ++mid; pend.set(id, { resolve: res, reject: rej });
  ws.send(JSON.stringify({ id, method, params, ...(sid ? { sessionId: sid } : {}) }));
});
const { targetId } = await send('Target.createTarget', { url: `http://localhost:${process.env.BASE_PORT || 5173}/?capture=1` });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const call = (m, p = {}) => send(m, p, sessionId);
await call('Page.enable');
await sleep(2500);

const probe = await call('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => ({
    scene: typeof window.__scene,
    appStore: typeof window.__appStore,
    storeActions: typeof window.__storeActions,
    keys: window.__storeActions ? Object.keys(window.__storeActions) : null
  }))()`
});
console.log('PROBE:', JSON.stringify(probe.result.value));

await call('Runtime.evaluate', {
  awaitPromise: true,
  expression: `(() => {
    let cur = null;
    window.__appStore.subscribe((v) => { cur = v; })();
    const g1 = cur.gears[0];
    window.__storeActions.addGear(10, g1.gridX + 10, g1.gridY + 8);
  })()`
});
await sleep(800);

await sleep(1000);

const r = await call('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const sc = window.__scene;
    const appStore = window.__appStore;
    let cur = null;
    appStore.subscribe((v) => { cur = v; })();
    const items = [...sc.items.entries()].map(([id, it]) => ({
      id, teeth: it.teeth, layer: it.layer,
      x: it.group.position.x, z: it.group.position.z
    }));
    return {
      storeGearCount: cur.gears.length,
      storeGearIds: cur.gears.map((g) => g.id),
      itemCount: sc.items.size,
      items,
      snapshotLayers: [...cur.snapshot.layers.entries()]
    };
  })()`
});
console.log(JSON.stringify(r.result.value, null, 2));
await call('Browser.close').catch(() => {});
edge.kill();
process.exit(0);
