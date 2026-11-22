/* CDP 交互冒烟：启动 Chrome 远程调试，驱动页面交互并读取 DOM 状态 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9300 + Math.floor(Math.random() * 200);
// profile 放 workspace 外，避免 vite 文件监视与 Chrome 缓存冲突
const USER_DIR = `C:\\Users\\Administrator\\AppData\\Local\\Temp\\cdp-ropeway-${Date.now()}`;
// 目标地址可用 APP_URL 覆盖（默认对应 npm run dev 的 5180 端口）
const URL = process.env.APP_URL ?? 'http://localhost:5180/';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${PORT}`, '--no-sandbox',
  '--no-proxy-server', '--proxy-bypass-list=<-loopback>',
  `--user-data-dir=${USER_DIR}`,
  '--window-size=1600,900', URL,
], { stdio: 'ignore' });

async function getWsUrl(): Promise<string> {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json() as { webSocketDebuggerUrl: string; type: string; url: string; title: string }[];
      // 严格按本应用标题/端口筛选，环境里其他工具会注入同名 type=page 的 target
      const page =
        list.find((t) => t.type === 'page' && t.title.includes('索道钢丝绳')) ??
        list.find((t) => t.type === 'page' && t.url !== 'about:blank');
      if (page) {
        console.log('CDP target:', page.title, '|', page.url);
        return page.webSocketDebuggerUrl;
      }
      console.log('可用 target:', list.map((t) => `${t.type}:${t.title}@${t.url}`).join(' ; '));
    } catch { /* retry */ }
    await sleep(300);
  }
  throw new Error('CDP endpoint not available');
}

let msgId = 0;
const ws = new WebSocket(await getWsUrl());
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
ws.onmessage = (ev: MessageEvent) => {
  const m = JSON.parse(ev.data as string);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id)!;
    pending.delete(m.id);
    if (m.error) p.reject(new Error(`${m.method ?? 'CDP'}: ${JSON.stringify(m.error)}`));
    else p.resolve(m.result);
  }
};
function send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`CDP 超时: ${method}`));
      }
    }, 8000);
    pending.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v); },
      reject: (e) => { clearTimeout(timer); reject(e); },
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
const evalJs = async (expr: string): Promise<unknown> => {
  const r = (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })) as {
    result?: { value?: unknown; exceptionDetails?: unknown };
  };
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  // CDP 包两层：外层 send 返回 { result: { value, ... } }
  return r.result?.value;
};

await send('Runtime.enable');
// 轮询等待 React 应用挂载（SwiftShader 冷启动可能较慢）
for (let i = 0; i < 40; i++) {
  const ready = await evalJs(`document.querySelectorAll('.gear').length >= 7`);
  if (ready === true) break;
  await sleep(500);
}

// 诊断：确认 evalJs 返回结构
const diag = await evalJs(`JSON.stringify({
  gears: document.querySelectorAll('.gear').length,
  firstStat: document.querySelector('.stat')?.textContent,
  errText: document.querySelectorAll('.stat-value')[5]?.textContent,
})`);
console.log('evalJs 诊断返回:', diag);

const results: { name: string; ok: boolean; detail: string }[] = [];
async function step(name: string, expr: string, expect: (v: unknown) => boolean): Promise<void> {
  try {
    const v = await evalJs(expr);
    results.push({ name, ok: expect(v), detail: JSON.stringify(v) });
    console.log(`  ${expect(v) ? '✓' : '✗'} ${name}`);
  } catch (e) {
    results.push({ name, ok: false, detail: String(e) });
    console.log(`  ✗ ${name} (异常: ${String(e)})`);
  }
}

// 1. 初始状态
await step('初始 0 报警',
  `document.querySelectorAll('.wheel-row.alarm').length`,
  (v) => v === 0);
await step('初始弦弧误差 < 1e-3',
  `[...document.querySelectorAll('.stat-value')].some(e => /e-\\d/.test(e.textContent) && parseFloat(e.textContent) < 1e-3)`,
  (v) => v === true);

// 2. 张力换档到 5 档（前 5 个 .gear 是张力档位，后 2 个是相机模式）
await evalJs(`[...document.querySelectorAll('.gear')].slice(0, 5).find(b => b.textContent.trim() === '5').click()`);
await sleep(300);
await step('切 5 档后 H=180kN',
  `[...document.querySelectorAll('.stat')].find(s => s.textContent.includes('张力')).textContent`,
  (v) => typeof v === 'string' && v.includes('180'));

// 3. 车厢滑块拖到 t=0.8
await evalJs(`
  const slider = document.querySelector('input[type=range]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(slider, '0.8');
  slider.dispatchEvent(new Event('input', { bubbles: true }));
`);
await sleep(300);
await step('车厢移动后 t=0.800',
  `document.querySelector('input[type=range]').closest('.field').querySelector('em').textContent`,
  (v) => v === '0.800');
await step('更新来源标记为车厢局部重算',
  `[...document.querySelectorAll('.stat')].some(s => s.textContent.includes('车厢'))`,
  (v) => v === true);

// 4. 载荷调到 3000kg（number 输入按面板顺序：支架坐标 6 个之后是载荷）
await step('载荷输入可写',
  `(() => {
    const inputs = [...document.querySelectorAll('.field input[type=number]')];
    const payload = inputs[0];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(payload, '3000');
    payload.dispatchEvent(new Event('input', { bubbles: true }));
    return payload.value;
  })()`,
  (v) => v === '3000');

// 5. 点击第一个轮组的"压入3mm"快捷按钮，应产生 >2mm 压陷并触发超阈值报警
await evalJs(`
  document.querySelector('.wheel-row .alarm-btn').click();
`);
await sleep(400);
await step('压入 3mm 后出现报警轮组',
  `document.querySelectorAll('.wheel-row.alarm').length`,
  (v) => (v as number) >= 1);
await step('报警计数 > 0',
  `[...document.querySelectorAll('.stat')].find(s => s.textContent.includes('接触报警')).textContent`,
  (v) => typeof v === 'string' && !v.includes('0/'));
await step('面板压陷量显示正值且 >2mm',
  `document.querySelector('.wheel-row .indent-line').textContent`,
  (v) => typeof v === 'string' && /压陷量/.test(v) && parseFloat(v.replace(/[^\d.]/g, '')) > 2);

// 6. 添加轮组到上限 12
for (let i = 0; i < 6; i++) {
  await evalJs(`document.querySelector('.wheel-toolbar button').click()`);
  await sleep(60);
}
await step('轮组数达 12 且添加按钮禁用',
  `JSON.stringify({ count: document.querySelectorAll('.wheel-row').length, disabled: document.querySelector('.wheel-toolbar button').disabled })`,
  (v) => v === JSON.stringify({ count: 12, disabled: true }));

// 7. 导出：拦截 Blob 点击，验证生成 JSON 内容（页面内 3s 超时兜底）
const exported = await evalJs(`
  new Promise((resolve) => {
    const finish = (v) => resolve(v);
    const watchdog = setTimeout(() => finish({ error: 'page-timeout' }), 3000);
    const origCreate = URL.createObjectURL;
    let captured = null;
    URL.createObjectURL = (blob) => { captured = blob; return 'blob:mock'; };
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      captured.text().then(t => {
        clearTimeout(watchdog);
        URL.createObjectURL = origCreate;
        HTMLAnchorElement.prototype.click = origClick;
        const j = JSON.parse(t);
        finish({
          hasSpans: Array.isArray(j.spans) && j.spans.length === 2,
          hasCenterline: j.centerline.length > 100,
          hasContacts: Array.isArray(j.wheelContacts),
          hasParams: !!j.parameters.horizontalTensionN,
          arcIncreasing: j.centerline.every((p, i, a) => i === 0 || p.arc >= a[i - 1].arc),
        });
      }).catch((e) => finish({ error: String(e) }));
    };
    [...document.querySelectorAll('button')].find(b => b.textContent.includes('导出')).click();
  });
`);
const expObj = (exported as { result?: { value?: Record<string, boolean> } })?.result?.value
  ?? (exported as Record<string, boolean>);
const allExportOk = expObj && Object.values(expObj).every(Boolean);
results.push({
  name: '导出 JSON 结构完整（跨/中线/接触/参数/弧长单调）',
  ok: !!allExportOk,
  detail: JSON.stringify(expObj),
});

// 8. 重置
await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('重置')).click()`);
await sleep(400);
await step('重置后轮组恢复 6 个',
  `document.querySelectorAll('.wheel-row').length`,
  (v) => v === 6);

console.log('\n=== CDP 交互冒烟结果 ===');
let pass = 0;
for (const r of results) {
  console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : '  → ' + r.detail}`);
  if (r.ok) pass++;
}
console.log(`\n${pass}/${results.length} 通过`);
ws.close();
chrome.kill();
process.exit(pass === results.length ? 0 : 1);
