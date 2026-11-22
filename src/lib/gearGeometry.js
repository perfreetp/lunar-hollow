/**
 * gearGeometry.js —— 齿轮 three.js 几何
 *
 * 齿廓采用简化渐开线（基圆→分度圆→齿顶圆两段直线近似 + 齿顶圆弧），
 * 齿厚占齿距 42%（标准 50%），预留 16% 齿厚侧隙；
 * 齿根圆比啮合深度再低 0.25m 预留顶隙。
 * 配合 gearMath 的滚动约束，啮合齿在接触点始终齿入槽、不刮擦。
 */
import * as THREE from 'three';
import { MODULE, tipRadius, rootRadius } from './gearMath.js';

function polar(r, a) {
  return [r * Math.cos(a), r * Math.sin(a)];
}

/**
 * 生成齿轮二维轮廓点（XY 平面，逆时针）
 * 采用梯形齿（机械示意中最稳妥的齿形）：
 *  - 齿顶：齿顶圆上 40% 齿距角宽的平直弧段
 *  - 齿槽：齿根圆上 48% 齿距角宽的槽底，容纳配对齿并留侧隙
 *  - 侧面：齿顶角 → 齿根角的斜直边，两段细分保证平滑
 * 角度用单调递增游标贯穿，杜绝回卷裂缝。
 * @param {number} z 齿数
 * @returns {Array<[number,number]>}
 */
export function gearOutline(z) {
  const ra = tipRadius(z);
  const rf = rootRadius(z);
  const p = (Math.PI * 2) / z;
  const pts = [];

  const W_TIP = 0.40 * p;   // 齿顶角宽
  const W_GAP = 0.48 * p;   // 槽底角宽（>齿顶，提供侧隙）
  const tipSteps = Math.max(2, Math.round(32 / z));
  const gapSteps = Math.max(2, Math.round(28 / z));
  const flankSteps = 2;

  let a = 0;
  const lineTo = (rad, ang) => { a = ang; pts.push(polar(rad, a)); };
  const arcTo = (rad, ang, steps) => {
    const from = a;
    for (let i = 1; i <= steps; i++) {
      a = from + ((ang - from) * i) / steps;
      pts.push(polar(rad, a));
    }
  };
  // 斜直侧面：在 (rad1,a1)→(rad2,a2) 间插值
  const flank = (rad1, a1, rad2, a2) => {
    for (let i = 1; i <= flankSteps; i++) {
      const t = i / flankSteps;
      lineTo(rad1 + (rad2 - rad1) * t, a1 + (a2 - a1) * t);
    }
  };

  for (let k = 0; k < z; k++) {
    const c = k * p;                  // 齿中心线
    const gapC = c + p / 2;           // 槽中心线
    const tipL = c - W_TIP / 2;
    const tipR = c + W_TIP / 2;
    const gapL = gapC - W_GAP / 2;
    const gapR = gapC + W_GAP / 2;

    if (k === 0) lineTo(rf, gapL);

    // ① 槽底圆弧
    arcTo(rf, gapR, gapSteps);
    // ② 上升斜侧面：槽右缘(齿根) → 下一齿齿顶左缘
    flank(rf, gapR, ra, tipL + p);
    // ③ 齿顶圆弧
    arcTo(ra, tipR + p, tipSteps);
    // ④ 下降斜侧面：齿顶右缘 → 下一槽左缘(齿根)
    flank(ra, tipR + p, rf, gapL + p);
    // ⑤ 齿根圆弧进入下一槽（下一循环 ① 接管，这里走到下一槽左缘）
    arcTo(rf, gapL + p, 1);
  }
  return pts;
}

/**
 * 构建一个挤出齿轮网格（含轴孔与轮毂）
 * @param {number} z 齿数
 * @param {number} depth 齿厚（Z 向）
 * @param {THREE.Material} material
 */
export function buildGearMesh(z, depth, material) {
  const outline = gearOutline(z);
  const shape = new THREE.Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
  shape.closePath();

  // 轴孔
  const holeR = Math.max(0.35, MODULE * 0.9);
  const hole = new THREE.Path();
  hole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
    curveSegments: 8
  });
  geom.translate(0, 0, -depth / 2);
  geom.computeVertexNormals();

  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** 轮毂（轴位衬套），比齿面略凸出，渲染轴心穿插关系 */
export function buildHub(z, depth, material) {
  const hubR = Math.max(0.7, MODULE * 1.6);
  const g = new THREE.CylinderGeometry(hubR, hubR, depth * 0.55, 24);
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  return m;
}

/** 轴杆：贯穿所有层的细圆柱，表达轴心 */
export function buildAxle(height, material) {
  const g = new THREE.CylinderGeometry(0.16, 0.16, height, 12);
  g.rotateX(Math.PI / 2);
  return new THREE.Mesh(g, material);
}
