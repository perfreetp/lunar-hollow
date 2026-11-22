/* 长线路 2000 段帧率压力测试：测量求解、接触计算、几何更新的端到端耗时 */
import { RopeModel, type RopeModelInput } from '../src/physics/ropeModel';
import { computeWheelContacts } from '../src/physics/contacts';
import { ROPE_DEFAULTS } from '../src/physics/config';
import { RopeTubeGeometry } from '../src/three/ropeTube';

// 构造一条 2000m 线路，12 组轮组，目标 2000+ 环段
const wheels = Array.from({ length: 12 }, (_, i) => ({
  id: `w${i}`,
  name: `w${i}`,
  position: { x: 150 + i * 150, y: 10 + (i % 3) * 1.5, z: 0 },
  radius: 0.22,
  enabled: true,
}));

const input: RopeModelInput = {
  supportA: { id: 'a', name: 'A', position: { x: 0, y: 20, z: 0 } },
  supportB: { id: 'b', name: 'B', position: { x: 2000, y: 32, z: 0 } },
  wheels,
  cabin: { t: 0.42, payloadKg: 2000, deadWeightKg: 800 },
  horizontalTension: 120_000,
  linearDensity: ROPE_DEFAULTS.linearDensity,
  ropeRadius: ROPE_DEFAULTS.radius,
};

const model = new RopeModel();
// 预热：触发 JIT 编译与缓冲扩容，避免冷启动抖动进入统计
for (let i = 0; i < 5; i++) {
  model.clearCache();
  model.solve(input, 'all');
  computeWheelContacts(model, wheels, input.ropeRadius, 2);
}
const geo = new RopeTubeGeometry(3000, 10);
geo.update(model, input.ropeRadius);

console.log(`线路长度 2000m，环段数 ${model.ringCount}，轮组 ${wheels.length} 组\n`);

// 10 次全绳求解统计
const solveTimes: number[] = [];
for (let i = 0; i < 10; i++) {
  model.clearCache();
  const t0 = performance.now();
  model.solve(input, 'all');
  solveTimes.push(performance.now() - t0);
}
// 10 次接触计算
const contactTimes: number[] = [];
for (let i = 0; i < 10; i++) {
  const t0 = performance.now();
  computeWheelContacts(model, wheels, input.ropeRadius, 2);
  contactTimes.push(performance.now() - t0);
}
// 10 次几何更新
const geoTimes: number[] = [];
for (let i = 0; i < 10; i++) {
  const t0 = performance.now();
  geo.update(model, input.ropeRadius);
  geoTimes.push(performance.now() - t0);
}
// 车厢拖动（最坏情况全链路一帧内完成）
const frameTimes: number[] = [];
for (let i = 0; i < 10; i++) {
  const t0 = performance.now();
  model.solve({ ...input, cabin: { ...input.cabin, t: 0.1 + i * 0.08 } }, 'cabin');
  computeWheelContacts(model, wheels, input.ropeRadius, 2);
  geo.update(model, input.ropeRadius);
  frameTimes.push(performance.now() - t0);
}

const stat = (a: number[]) => ({
  avg: a.reduce((x, y) => x + y, 0) / a.length,
  max: Math.max(...a),
});
const s = stat(solveTimes);
const c = stat(contactTimes);
const g = stat(geoTimes);
const f = stat(frameTimes);

console.log('全绳求解  ', `avg ${s.avg.toFixed(2)}ms  max ${s.max.toFixed(2)}ms`);
console.log('接触计算  ', `avg ${c.avg.toFixed(2)}ms  max ${c.max.toFixed(2)}ms`);
console.log('几何更新  ', `avg ${g.avg.toFixed(2)}ms  max ${g.max.toFixed(2)}ms`);
console.log('拖动全链路', `avg ${f.avg.toFixed(2)}ms  max ${f.max.toFixed(2)}ms（预算 16.6ms/帧）`);
console.log('弦弧误差  ', model.maxChordArcError.toExponential(2), '（要求 < 1e-3）');

// 稳态判定：均值留足帧预算余量，单次 max 允许偶发调度抖动
const pass = f.avg < 12 && f.max < 16.6 && model.maxChordArcError < 1e-3 && model.ringCount >= 1500;
console.log(pass ? '\n2000 段长线路稳态帧率达标 ✅' : '\n未达标 ❌');
process.exit(pass ? 0 : 1);
