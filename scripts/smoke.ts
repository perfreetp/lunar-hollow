/**
 * 纯逻辑冒烟测试:中心线/弧长/标架/分块距离。
 * 运行:npx tsx scripts/smoke.ts(或 node --import tsx)
 */
import { buildCenterline, sampleAt, ringDistance, segmentAt, SEGMENT_COUNT, segmentStart } from '../src/lib/track/centerline.js';
import { gearToSpeed } from '../src/lib/state/roam.js';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

console.log('1. 中心线构建');
const center = buildCenterline();
check('生成标架数量 > 1000', center.frames.length > 1000, `got ${center.frames.length}`);
check('总长度 > 2000m', center.totalLength > 2000, `got ${center.totalLength.toFixed(1)}`);
check('采样间距接近 2m', Math.abs(center.sampleSpacing - 2) < 0.01);

console.log('2. 弧长均匀性(相邻标架间距)');
let maxGap = 0;
let minGap = Infinity;
for (let i = 0; i < center.frames.length; i++) {
  const a = center.frames[i].position;
  const b = center.frames[(i + 1) % center.frames.length].position;
  const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  maxGap = Math.max(maxGap, d);
  minGap = Math.min(minGap, d);
}
check('最大间距 < 2.05m', maxGap < 2.05, `max=${maxGap.toFixed(3)}`);
check('最小间距 > 1.95m', minGap > 1.95, `min=${minGap.toFixed(3)}`);

console.log('3. 标架正交性');
let worstOrtho = 0;
for (const f of center.frames) {
  const tbn = Math.abs(Vector3dot(f.tangent, f.binormal));
  const tn = Math.abs(Vector3dot(f.tangent, f.normal));
  const bn = Math.abs(Vector3dot(f.binormal, f.normal));
  worstOrtho = Math.max(worstOrtho, tbn, tn, bn);
}
check('T/B/N 两两正交(误差 < 0.01)', worstOrtho < 0.01, `worst=${worstOrtho.toFixed(4)}`);

console.log('4. 环形采样越界回绕');
const f0 = sampleAt(center, 0);
const fWrap = sampleAt(center, center.totalLength);
check('s=L 与 s=0 位置一致', Math.hypot(f0.position.x - fWrap.position.x, f0.position.z - fWrap.position.z) < 0.01);
const fNeg = sampleAt(center, -10);
const fPos = sampleAt(center, center.totalLength - 10);
check('负弧长正确回绕', Math.hypot(fNeg.position.x - fPos.position.x, fNeg.position.z - fPos.position.z) < 0.05);

console.log('5. 路段划分');
check(`路段数 = ${SEGMENT_COUNT}`, new Set(center.frames.map((f) => f.segment)).size === SEGMENT_COUNT);
check('segmentAt(0) = 0', segmentAt(center, 0) === 0);
check('segmentAt(L-1) = 7', segmentAt(center, center.totalLength - 1) === SEGMENT_COUNT - 1);
for (let k = 0; k < SEGMENT_COUNT; k++) {
  check(`路段 ${k + 1} 起点 segmentAt 正确`, segmentAt(center, segmentStart(center, k)) === k);
}

console.log('6. 环形距离');
check('环内距离正确', Math.abs(ringDistance(10, 50, center.totalLength) - 40) < 1e-9);
check('跨零点距离取短弧', ringDistance(center.totalLength - 5, 5, center.totalLength) === 10);

console.log('7. 速度档位');
check('1 档 ≈ 2.78 m/s', Math.abs(gearToSpeed(1) - 10 / 3.6) < 1e-9);
check('5 档 ≈ 33.33 m/s', Math.abs(gearToSpeed(5) - 120 / 3.6) < 1e-9);

function Vector3dot(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

if (failures > 0) {
  console.error(`\n${failures} 项检查失败`);
  process.exit(1);
} else {
  console.log('\n全部冒烟检查通过');
}
