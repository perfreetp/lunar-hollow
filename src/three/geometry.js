// 积木几何体工厂:盒体 + 凸点圆柱合并,按类型缓存,避免 120+ 积木重复建模
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { STUD_PITCH, PLATE_HEIGHT, STUD_RADIUS, STUD_HEIGHT } from '../engine/constants.js';

const geometryCache = new Map();
const materialCache = new Map();
const GAP = 1.2; // 积木间视觉缝隙

export function getBlockGeometry(type) {
  const cached = geometryCache.get(type.id);
  if (cached) return cached;

  const w = type.w * STUD_PITCH - GAP;
  const d = type.d * STUD_PITCH - GAP;
  const h = type.h * PLATE_HEIGHT;

  const body = new THREE.BoxGeometry(w, h, d);
  body.translate(0, h / 2, 0);

  const studParts = [];
  const studGeo = new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 18);
  for (let i = 0; i < type.w; i++) {
    for (let j = 0; j < type.d; j++) {
      const g = studGeo.clone();
      g.translate(
        (i - (type.w - 1) / 2) * STUD_PITCH,
        h + STUD_HEIGHT / 2,
        (j - (type.d - 1) / 2) * STUD_PITCH
      );
      studParts.push(g);
    }
  }
  studGeo.dispose();

  const geometry = mergeGeometries([body, ...studParts]);
  const edgeBox = new THREE.BoxGeometry(w, h, d);
  edgeBox.translate(0, h / 2, 0);
  const edges = new THREE.EdgesGeometry(edgeBox);
  edgeBox.dispose();
  studParts.forEach((g) => g.dispose());

  const result = { geometry, edges, w, d, h };
  geometryCache.set(type.id, result);
  return result;
}

export function getMaterial(colorDef) {
  const cached = materialCache.get(colorDef.id);
  if (cached) return cached;

  let material;
  if (colorDef.transparent) {
    material = new THREE.MeshStandardMaterial({
      color: colorDef.color,
      transparent: true,
      opacity: colorDef.opacity,
      depthWrite: false, // 透明积木关闭深度写入,配合逐帧深度排序
      roughness: 0.15,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      color: colorDef.color,
      roughness: 0.45,
      metalness: 0.05,
    });
  }
  materialCache.set(colorDef.id, material);
  return material;
}

// 冲突/选中/警告三种轮廓共用材质,切换时替换引用即可
export const EDGE_MATERIALS = {
  conflict: new THREE.LineBasicMaterial({ color: 0xff1744, linewidth: 2 }),
  select: new THREE.LineBasicMaterial({ color: 0xffffff }),
  warn: new THREE.LineBasicMaterial({ color: 0xff9800 }),
};
