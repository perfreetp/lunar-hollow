// 无头验证仿真内核:node verify-sim.mjs
import { simulate, Sampler, validateConfig, computeBatches, sortedShips } from './src/sim/simulate.ts';

const config = {
  chamberLength: 180, chamberWidth: 23, approachLength: 1000, approachWidth: 45,
  upstreamLevel: 12, downstreamLevel: 4, waterRate: 0.05,
  gateMaxAngle: 90, gateStepAngle: 5, gateStepInterval: 1,
  direction: 'down', berthGap: 8, queueGap: 15, endMargin: 10, cruiseSpeedCap: 2.5,
};

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261123);
const ships = Array.from({ length: 20 }, (_, i) => ({
  id: `ship-${i + 1}`, name: `船舶${i + 1}`,
  length: Math.round((45 + rnd() * 30) * 10) / 10,
  width: Math.round((8 + rnd() * 5) * 10) / 10,
  order: i + 1,
  speed: Math.round((1.5 + rnd() * 1.5) * 100) / 100,
  draft: Math.round((2 + rnd() * 1.5) * 100) / 100,
}));

const warnings = validateConfig(config, ships);
console.log('validate warnings:', warnings);

const t0 = Date.now();
const res = simulate(config, ships);
console.log(`simulate() took ${Date.now() - t0}ms`);
console.log(`completed=${res.completed} duration=${res.duration}s batches=${res.batches.length} collisions=${res.collisions} frames=${res.frameCount} events=${res.events.length}`);
console.log('batch sizes:', res.batches.map((b) => b.length).join(','));

// 基本断言
let fail = 0;
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); fail++; } };
assert(res.completed, 'simulation should complete');
assert(res.frameCount > 100, 'enough frames');
assert(res.events.some((e) => e.type === 'collision') === (res.collisions > 0), 'collision count matches events');

// 帧数据合理性:无 NaN,水位在范围内,闸门角度在 [0,90],状态机单调
const s = res.stride, d = res.data, N = ships.length;
let maxV = 0;
for (let f = 0; f < res.frameCount; f++) {
  const o = f * s;
  for (let k = 0; k < s; k++) assert(!Number.isNaN(d[o + k]), `NaN at frame ${f} field ${k}`);
  assert(d[o + 1] >= 3.9 && d[o + 1] <= 12.1, `water in range, got ${d[o + 1]}`);
  assert(d[o + 2] >= -0.01 && d[o + 2] <= 90.01, 'upGate range');
  assert(d[o + 3] >= -0.01 && d[o + 3] <= 90.01, 'downGate range');
  for (let i = 0; i < N; i++) maxV = Math.max(maxV, d[o + 5 + 4 * i + 2]);
}
console.log('max ship speed:', maxV.toFixed(2), 'm/s');
assert(maxV <= 3.01, 'speed cap respected');

// 采样器:任意时刻可取帧,船数一致
const sampler = new Sampler(res);
const mid = sampler.sample(res.duration / 2);
assert(mid.ships.length === 4 * N, 'sampler ship count');
const end = sampler.sample(res.duration);
for (let i = 0; i < N; i++) assert(Math.round(end.ships[4 * i + 3]) === 4, `ship ${i} done at end`);

// 事件时间单调
for (let i = 1; i < res.events.length; i++) assert(res.events[i].t >= res.events[i - 1].t - 0.011, 'events ordered');

// 上行方向也能完成
const resUp = simulate({ ...config, direction: 'up' }, ships);
console.log(`up-direction: completed=${resUp.completed} duration=${resUp.duration}s collisions=${resUp.collisions}`);
assert(resUp.completed, 'up direction completes');

// 碰撞场景:引航道过窄,船宽超限,应触发墙壁碰撞且仿真仍能完成
const narrow = simulate({ ...config, approachWidth: 12 }, ships);
console.log(`narrow-channel: completed=${narrow.completed} collisions=${narrow.collisions}`);
assert(narrow.collisions > 0, 'wall collisions should be detected in narrow channel');
assert(narrow.events.some((e) => e.type === 'collision'), 'collision events emitted');

console.log(fail === 0 ? 'ALL CHECKS PASSED' : `${fail} CHECKS FAILED`);
process.exit(fail === 0 ? 0 : 1);
