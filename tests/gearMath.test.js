import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pitchRadius,
  evaluatePair,
  meshChildAngle,
  recompute,
  frameAngle,
  mod2pi,
  GRID,
  wrapToPi
} from '../src/lib/gearMath.js';

let seq = 0;
const mk = (teeth, gridX, gridY) => ({
  id: `g${++seq}`,
  label: `G${seq}`,
  teeth,
  gridX,
  gridY
});

test('正确啮合距离：网格中心距 = z1+z2', () => {
  const a = mk(12, 0, 0);
  const b = mk(24, 12 + 24, 0); // 理想外啮合位置
  const ev = evaluatePair(a, b);
  assert.equal(ev.state, 'mesh');
  assert.ok(Math.abs(ev.delta) < 1e-9);
});

test('间隙超阈值给出 gap 提示', () => {
  const a = mk(12, 0, 0);
  const b = mk(24, 12 + 24 + 4, 0); // 远 4 格 = 2 世界单位
  const ev = evaluatePair(a, b);
  assert.ok(ev.state === 'gap' || ev.state === 'far');
  assert.ok(ev.delta > 0.18);
});

test('过紧判定 tight，重叠判定 overlap', () => {
  const a = mk(20, 0, 0);
  const tight = mk(20, 20 + 20 - 2, 0); // 近 1 世界单位
  assert.equal(evaluatePair(a, tight).state, 'tight');
  const over = mk(20, 4, 0);
  assert.equal(evaluatePair(a, over).state, 'overlap');
});

test('滚动约束不变量：任意驱动转角下 zjθj+ziθi 恒定（无穿透核心）', () => {
  const zi = 12, zj = 24;
  const beta = 0;
  const thetaI0 = 0.37;
  const { theta: thetaJ0, invariant } = meshChildAngle(thetaI0, zi, zj, beta);
  const ratio = -zi / zj;
  for (const turns of [0, 0.25, 1, 3.7, 20]) {
    const ti = thetaI0 + turns * Math.PI * 2;
    const tj = frameAngle(thetaJ0, ratio, turns);
    const inv = mod2pi(zj * tj + zi * ti);
    assert.ok(Math.abs(wrapToPi(inv - invariant)) < 1e-9, `turns=${turns}`);
  }
});

test('接触点处齿槽始终对准父轮齿（建边对准 + 滚动约束保持）', () => {
  const zi = 16, zj = 10;
  const beta = Math.PI / 3;
  const thetaI0 = 0.11;
  const { theta: thetaJ0 } = meshChildAngle(thetaI0, zi, zj, beta);
  // 建边时：父轮在接触方向的最近齿相位误差 δi；
  // 子轮在其接触方向(β+π)上的齿槽相位满足 pj = π − (zi/zj)·δi
  const deltaI0 = wrapToPi(zi * (thetaI0 - beta));
  const pj0 = wrapToPi(zj * (thetaJ0 - (beta + Math.PI)));
  assert.ok(Math.abs(wrapToPi(pj0 - (Math.PI - (zi / zj) * deltaI0))) < 1e-12);

  // 播放中：滚动不变量守恒即等价于接触点齿/槽对准关系恒定（侧隙恒定，不穿透）
  const ratio = -zi / zj;
  const invariant = mod2pi(zj * thetaJ0 + zi * thetaI0);
  for (const turns of [0.5, 2, 13.3, 20]) {
    const ti = thetaI0 + turns * Math.PI * 2;
    const tj = frameAngle(thetaJ0, ratio, turns);
    assert.ok(Math.abs(wrapToPi(mod2pi(zj * tj + zi * ti) - invariant)) < 1e-9, `turns=${turns}`);
  }
});

test('三级传动链 BFS：转速比连乘、方向交替、齿数修改后联动重算', () => {
  seq = 0;
  const g1 = mk(12, 0, 0);
  const g2 = mk(24, 36, 0);
  const g3 = mk(8, 36 + 32, 0);
  let snap = recompute([g1, g2, g3], g1.id);
  assert.ok(snap.connected.has(g2.id));
  assert.ok(snap.connected.has(g3.id));
  assert.ok(Math.abs(snap.ratios.get(g2.id) - -0.5) < 1e-12);
  assert.ok(Math.abs(snap.ratios.get(g3.id) - (-0.5 * -24 / 8)) < 1e-12);
  assert.equal(snap.direction.get(g1.id), 1);
  assert.equal(snap.direction.get(g2.id), -1);
  assert.equal(snap.direction.get(g3.id), 1);

  // 修改主动轮齿数 12 → 18，全链联动
  const g1b = { ...g1, teeth: 18 };
  // 中心距已不匹配（36 格 vs 18+24=42），先把 g2 移到新理想位置再验证比率
  const g2b = { ...g2, gridX: 42 };
  const g3b = { ...g3, gridX: 42 + 32 };
  snap = recompute([g1b, g2b, g3b], g1b.id);
  assert.ok(Math.abs(snap.ratios.get(g2b.id) - -18 / 24) < 1e-12);
  assert.ok(Math.abs(snap.ratios.get(g3b.id) - (-18 / 24) * (-24 / 8)) < 1e-12);
});

test('未连通齿轮标记静止并产生提示', () => {
  seq = 0;
  const g1 = mk(12, 0, 0);
  const g2 = mk(24, 36, 0);
  const lonely = mk(10, 200, 200);
  const snap = recompute([g1, g2, lonely], g1.id);
  assert.equal(snap.ratios.get(lonely.id), 0);
  assert.ok(snap.issues.some((i) => i.type === 'disconnected'));
});

test('深度分层：啮合同层、重叠异层', () => {
  seq = 0;
  const g1 = mk(12, 0, 0);
  const g2 = mk(24, 36, 0);          // 与 g1 啮合 → 同层
  const g3 = mk(10, 6, 0);           // 与 g1 重叠、与 g2 不接触 → 另一层
  const snap = recompute([g1, g2, g3], g1.id);
  assert.equal(snap.layers.get(g1.id), snap.layers.get(g2.id));
  assert.notEqual(snap.layers.get(g1.id), snap.layers.get(g3.id));
  assert.ok(snap.issues.some((i) => i.type === 'overlap'));
});

test('无主动轮时给出驱动提示且不报错', () => {
  seq = 0;
  const g1 = mk(12, 0, 0);
  const snap = recompute([g1], null);
  assert.ok(snap.issues.some((i) => i.type === 'driver'));
  assert.equal(snap.ratios.get(g1.id), 0);
});

test('20 圈播放末端整链角度自洽', () => {
  seq = 0;
  const g1 = mk(12, 0, 0);
  const g2 = mk(18, 30, 0);
  const snap = recompute([g1, g2], g1.id);
  const t = 20;
  const a1 = frameAngle(snap.baseAngles.get(g1.id), snap.ratios.get(g1.id), t);
  const a2 = frameAngle(snap.baseAngles.get(g2.id), snap.ratios.get(g2.id), t);
  assert.ok(Math.abs(a1 - 40 * Math.PI) < 1e-9);
  assert.ok(Math.abs(a2 - snap.baseAngles.get(g2.id) - (-12 / 18) * 40 * Math.PI) < 1e-9);
});
