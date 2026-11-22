/**
 * 浏览器冒烟测试一键启动器：
 * 1. 启动 headless Edge（SwiftShader 软渲染，CI 无 GPU 也可跑）并开 CDP 端口；
 * 2. 等待 dev server 与页面就绪；
 * 3. 运行 cdp-smoke.mjs；
 * 4. 无论成败关闭浏览器。
 *
 * 前置：先在另一终端 `npm run dev`，或设置环境变量 BASE_URL 指向已运行的实例。
 */
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5183';
const CDP_PORT = 9333;
const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

function findEdge() {
  for (const p of EDGE_CANDIDATES) {
    const r = spawnSync(p, ['--version'], { stdio: 'ignore' });
    if (r.status === 0 || r.status === 1) return p;
  }
  return null;
}

const edge = findEdge();
if (!edge) {
  console.error('未找到 Microsoft Edge，无法启动浏览器冒烟测试');
  process.exit(2);
}

const userDataDir = new URL('../.tmp-edge-profile/', import.meta.url).pathname.replace(/^\//, '');
const proc = spawn(
  edge,
  [
    '--headless=new',
    '--no-sandbox',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userDataDir}`,
    BASE_URL,
  ],
  { stdio: 'ignore', detached: false },
);

let exitCode = 1;
try {
  // 等页面与 Babylon 初始化
  await delay(9000);
  const res = spawnSync('node', ['tests/cdp-smoke.mjs', BASE_URL], { stdio: 'inherit' });
  exitCode = res.status ?? 1;
} finally {
  proc.kill();
}
process.exit(exitCode);
