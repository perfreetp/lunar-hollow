// 冒烟测试:验证运动学 + manifold 布尔逻辑(不经过浏览器)
import Module from 'manifold-3d';
import { createRequire } from 'node:module';
import { solveKinematics } from './kinematics-bundle.mjs';

const require = createRequire(import.meta.url);
const wasmPath = require.resolve('manifold-3d/manifold.wasm');
const mod = await Module({ locateFile: () => wasmPath });
mod.setup();
const { Manifold } = mod;

const DEG = Math.PI / 180;
const HALF_SPAN = 12, MITER_OFFSET = 2;
const LEAF = { length: Math.hypot(12, 2), thickness: 0.8, height: 8 };
const WALL = { thickness: 3, height: 8.0, zMin: -20, zMax: 20 };
const RECESS = { depthIntoChamber: 0.5, zMin: -15, zMax: 0.8, yMin: -0.5, yMax: 8.5 };
const OBSTACLE = { cx: -10.2, cz: -7.5, sx: 1.6, sy: 2.5, sz: 2.0 };
const CLOSED = Math.atan2(-MITER_OFFSET, HALF_SPAN);

function toMat4(m) {
  return [m[0],m[4],m[8],0, m[1],m[5],m[9],0, m[2],m[6],m[10],0, m[3],m[7],m[11],1];
}
function rotYTranslate(a, tx, ty, tz) {
  const c = Math.cos(a), s = Math.sin(a);
  return [c,0,s,tx, 0,1,0,ty, -s,0,c,tz];
}
function offsetZ(m, dz) {
  return [m[0],m[1],m[2],m[3]+m[2]*dz, m[4],m[5],m[6],m[7]+m[6]*dz, m[8],m[9],m[10],m[11]+m[10]*dz];
}
const boxAt = (sx,sy,sz,m) => Manifold.cube([sx,sy,sz], false).transform(toMat4(m));
const translateMat = (x,y,z) => [1,0,0,x, 0,1,0,y, 0,0,1,z];

let pass = 0, fail = 0;
function check(name, cond, extra='') {
  if (cond) { pass++; console.log(`  PASS ${name} ${extra}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
}

// 1. 运动学:全行程 |B-C| = 3,判别式 > 0,行程单调增
console.log('运动学:');
let reach = true, rodOk = true, mono = true, prevStroke = -1;
for (let t = 0; t <= 90; t += 2) {
  const kin = solveKinematics(t);
  for (const sk of kin.sides) {
    if (!sk.reachable) reach = false;
    if (Math.abs(sk.rodLength - 3.0) > 1e-6) rodOk = false;
  }
  if (kin.sides[0].stroke < prevStroke - 1e-9) mono = false;
  prevStroke = kin.sides[0].stroke;
}
check('连杆长度恒为 3.0', rodOk);
check('全行程可达', reach);
check('活塞行程随开度单调增', mono);
const k0 = solveKinematics(0), k90 = solveKinematics(90);
console.log(`  行程范围: ${k0.sides[0].stroke.toFixed(3)} → ${k90.sides[0].stroke.toFixed(3)} m, 伸出 ${k0.sides[0].rodExtension.toFixed(3)} → ${k90.sides[0].rodExtension.toFixed(3)} m`);
check('全开行程 > 0.5m', k90.sides[0].stroke > 0.5);

// 2. 圆柱轴向:沿 Z
console.log('manifold 基元:');
const cyl = Manifold.cylinder(5, 1, 1, 16, false);
const cm = cyl.getMesh();
let zmin = 1e9, zmax = -1e9, xmax = -1e9;
for (let i = 0; i < cm.numVert; i++) {
  const x = cm.vertProperties[i*cm.numProp], z = cm.vertProperties[i*cm.numProp+2];
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z); xmax = Math.max(xmax, Math.abs(x));
}
check('圆柱沿 Z 轴、底部在原点', Math.abs(zmin) < 1e-6 && Math.abs(zmax - 5) < 1e-6 && xmax <= 1.0001, `z=[${zmin.toFixed(2)},${zmax.toFixed(2)}] r=${xmax.toFixed(2)}`);
cyl.delete();

// 3. 墙壁 - 门龛
console.log('墙壁布尔:');
const wallBox = boxAt(WALL.thickness, WALL.height, 40, translateMat(-15, 0, -20));
const recess = boxAt(WALL.thickness + RECESS.depthIntoChamber, RECESS.yMax - RECESS.yMin, RECESS.zMax - RECESS.zMin, translateMat(-15, RECESS.yMin, RECESS.zMin));
const wall = wallBox.subtract(recess);
const vWall = wall.volume();
// 凹槽与墙体的实际交集:3.0(墙厚)× 8.0(墙高)× 15.8(z 跨度)
check('门龛差集体积减小', Math.abs(vWall - (3*8.0*40 - 3*8.0*15.8)) < 1, `V=${vWall.toFixed(1)}`);
wallBox.delete(); recess.delete();

// 4. 门叶 vs 障碍块:中高开度应干涉,低开度不干涉
console.log('门叶-障碍块干涉:');
{
  const lv = leafLocal(-1);
  const vol = lv.volume();
  check('门叶斜切后体积合理(≈78m³)', vol > 70 && vol < 79, `V=${vol.toFixed(2)}`);
  lv.delete();
}
const obstacle = boxAt(OBSTACLE.sx, OBSTACLE.sy, OBSTACLE.sz, translateMat(OBSTACLE.cx - OBSTACLE.sx/2, 0, OBSTACLE.cz - OBSTACLE.sz/2));
// 门叶局部实体:盒体 + 铰点支架 + 中缝斜切(与应用逻辑一致)
function leafLocal(side) { // side: -1 左,+1 右
  const box = Manifold.cube([LEAF.length, LEAF.height, LEAF.thickness], false).translate([0, 0, -LEAF.thickness/2]);
  const bracket = Manifold.cube([0.3, 8.6-7.5, 0.3], false).translate([4-0.15, 7.5, -0.15]);
  let leaf = box.add(bracket);
  box.delete(); bracket.delete();
  const closedA = side < 0 ? CLOSED : Math.atan2(-MITER_OFFSET, -HALF_SPAN);
  const wx = side < 0 ? 1 : -1;
  // trimByPlane 保留法向正侧 → 取负法向
  const nl = [-wx * Math.cos(closedA), 0, wx * Math.sin(closedA)];
  const trimmed = leaf.trimByPlane(nl, -wx * Math.cos(closedA) * LEAF.length);
  leaf.delete();
  return trimmed;
}

function leafAt(thetaDeg, side) { // side: -1 左
  const closedA = side < 0 ? CLOSED : Math.atan2(-MITER_OFFSET, -HALF_SPAN);
  const a = closedA + (side < 0 ? -1 : 1) * thetaDeg * DEG;
  const hinge = side < 0 ? -12 : 12;
  const local = leafLocal(side);
  const t = local.transform(toMat4(rotYTranslate(-a, hinge, 0, 0)));
  local.delete();
  return t;
}
let hitAngles = [];
for (let t = 0; t <= 90; t += 5) {
  const leaf = leafAt(t, -1);
  const inter = leaf.intersect(obstacle);
  const v = inter.volume();
  if (v > 1e-4) hitAngles.push(t);
  leaf.delete(); inter.delete();
}
console.log(`  左门叶与障碍块干涉的开度: ${hitAngles.join(', ') || '无'}`);
check('某段开度存在干涉(演示用)', hitAngles.length > 0);
check('关闭时(0°)不与障碍块干涉', !hitAngles.includes(0));

// 5. 门叶 vs 墙壁(含门龛):全开不应穿墙
console.log('门叶-墙壁干涉:');
let wallHit = [];
for (let t = 0; t <= 90; t += 5) {
  const leaf = leafAt(t, -1);
  const inter = leaf.intersect(wall);
  const v = inter.volume();
  if (v > 1e-4) wallHit.push([t, v]);
  leaf.delete(); inter.delete();
}
check('门叶全行程不穿墙(门龛有效)', wallHit.length === 0, wallHit.length ? JSON.stringify(wallHit) : '');

// 6. 双门叶互检:0° 应仅接触(体积≈0)
const l0 = leafAt(0, -1), r0 = leafAt(0, 1);
const vPair = l0.intersect(r0).volume();
check('关闭时两门叶不重叠', vPair < 1e-4, `V=${vPair.toExponential(2)}`);
l0.delete(); r0.delete(); wall.delete(); obstacle.delete();

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
