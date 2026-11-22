import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

export interface Surfaces {
  /** 可安装墙面网格 */
  walls: THREE.Mesh[];
  floors: THREE.Mesh[];
  /** 可安装区域的半透明标示面 */
  overlays: THREE.Mesh[];
  /** 地面标高（世界 y） */
  floorY: number;
  /** 场景中心，用于推断墙面朝向 */
  center: THREE.Vector3;
}

export interface Room {
  group: THREE.Group;
  surfaces: Surfaces;
}

export interface MirrorRig {
  group: THREE.Group;
  reflector: Reflector;
  glass: THREE.Mesh;
  center: THREE.Vector3;
  normal: THREE.Vector3;
}

export const ROOM = { W: 2.4, D: 2.7, H: 2.4 };

/**
 * 由墙面网格生成"可安装区域"标示面：
 * 取包围盒最薄轴为法线轴，朝场景中心一侧偏移少许。
 */
export function createOverlay(wall: THREE.Mesh, center: THREE.Vector3): THREE.Mesh | null {
  const bbox = new THREE.Box3().setFromObject(wall);
  const size = bbox.getSize(new THREE.Vector3());
  const c = bbox.getCenter(new THREE.Vector3());
  const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
  let axis: 'x' | 'y' | 'z' = 'x';
  for (const a of axes) if (size[a] < size[axis]) axis = a;
  if (axis === 'y') return null; // 水平面不是墙
  const n = new THREE.Vector3();
  n[axis] = c[axis] > center[axis] ? -1 : 1;
  const horiz = axes.find((a) => a !== axis && a !== 'y')!;
  const w = Math.max(size[horiz] - 0.04, 0.1);
  const h = Math.max(size.y - 0.04, 0.1);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x3d8bff,
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  m.position.copy(c).addScaledVector(n, size[axis] / 2 + 0.002);
  m.userData.overlay = true;
  m.userData.wall = wall;
  return m;
}

/** 默认浴室：四面墙（单面朝内的平面，外部看为透明，获得"剖视"效果）+ 地面 + 洁具 */
export function buildDefaultBathroom(): Room {
  const { W, D, H } = ROOM;
  const group = new THREE.Group();
  group.name = 'room';
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd3dde4, roughness: 0.92 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x8d9aa2, roughness: 0.85 });

  const walls: THREE.Mesh[] = [];
  const mkWall = (name: string, w: number, x: number, z: number, rotY: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), wallMat);
    m.name = name;
    m.position.set(x, H / 2, z);
    m.rotation.y = rotY;
    m.userData.wall = true;
    group.add(m);
    walls.push(m);
  };
  mkWall('wall-north', W, 0, -D / 2, 0);
  mkWall('wall-south', W, 0, D / 2, Math.PI);
  mkWall('wall-east', D, W / 2, 0, -Math.PI / 2);
  mkWall('wall-west', D, -W / 2, 0, Math.PI / 2);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.name = 'floor';
  floor.rotation.x = -Math.PI / 2;
  floor.userData.floor = true;
  group.add(floor);

  const grid = new THREE.GridHelper(Math.max(W, D), Math.max(W, D) * 10, 0x7a8890, 0x9aa6ad);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.25;
  grid.position.y = 0.001;
  group.add(grid);

  // 洁具（装饰，不参与安装）
  const decorMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f5, roughness: 0.4 });
  const decor = (geo: THREE.BufferGeometry, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, decorMat);
    m.position.set(x, y, z);
    m.userData.decor = true;
    group.add(m);
  };
  // 马桶
  decor(new THREE.BoxGeometry(0.4, 0.38, 0.52), -0.85, 0.19, -0.95);
  decor(new THREE.BoxGeometry(0.4, 0.42, 0.14), -0.85, 0.58, -1.24);
  // 洗手台（镜子下方）
  decor(new THREE.BoxGeometry(0.46, 0.1, 0.52), 0.92, 0.82, 0);
  decor(new THREE.CylinderGeometry(0.09, 0.11, 0.78, 16), 0.92, 0.39, 0);

  const center = new THREE.Vector3(0, H / 2, 0);
  const overlays = walls
    .map((w) => createOverlay(w, center))
    .filter((o): o is THREE.Mesh => o !== null);
  overlays.forEach((o) => group.add(o));

  return {
    group,
    surfaces: { walls, floors: [floor], overlays, floorY: 0, center },
  };
}

/** 取网格第一个三角形的世界法线，用于导入模型的墙面/地面识别 */
function firstFaceNormal(mesh: THREE.Mesh): THREE.Vector3 | null {
  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  if (!pos || pos.count < 3) return null;
  const idx = geo.index;
  const i0 = idx ? idx.getX(0) : 0;
  const i1 = idx ? idx.getX(1) : 1;
  const i2 = idx ? idx.getX(2) : 2;
  const a = new THREE.Vector3().fromBufferAttribute(pos, i0);
  const b = new THREE.Vector3().fromBufferAttribute(pos, i1);
  const c = new THREE.Vector3().fromBufferAttribute(pos, i2);
  const n = new THREE.Vector3().subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b));
  if (n.lengthSq() < 1e-12) return null;
  n.normalize().transformDirection(mesh.matrixWorld);
  return n;
}

/** 对导入的模型逐网格识别：|ny|>=0.55 视为地面，|ny|<=0.45 视为可安装墙面 */
export function classifyImported(model: THREE.Object3D): Surfaces {
  model.updateMatrixWorld(true);
  const walls: THREE.Mesh[] = [];
  const floors: THREE.Mesh[] = [];
  const bboxAll = new THREE.Box3().setFromObject(model);
  const center = bboxAll.getCenter(new THREE.Vector3());
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const n = firstFaceNormal(mesh);
    if (!n) return;
    if (n.y > 0.55) {
      mesh.userData.floor = true;
      floors.push(mesh);
    } else if (Math.abs(n.y) < 0.45) {
      mesh.userData.wall = true;
      walls.push(mesh);
    } else {
      mesh.userData.decor = true;
    }
  });
  const overlays = walls
    .map((w) => createOverlay(w, center))
    .filter((o): o is THREE.Mesh => o !== null);
  const floorY = floors.length
    ? Math.max(...floors.map((f) => new THREE.Box3().setFromObject(f).max.y))
    : bboxAll.min.y;
  return { walls, floors, overlays, floorY, center };
}

/** 浴室镜：Reflector 实时反射 + 普通模式下的磨砂玻璃 + 镜框 */
export function createMirror(): MirrorRig {
  const group = new THREE.Group();
  group.name = 'mirror-rig';
  const center = new THREE.Vector3(ROOM.W / 2 - 0.015, 1.5, 0);
  const normal = new THREE.Vector3(-1, 0, 0);

  const reflector = new Reflector(new THREE.PlaneGeometry(0.9, 0.7), {
    clipBias: 0.003,
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0x90a0a8,
  });
  reflector.position.copy(center);
  reflector.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  reflector.visible = false;
  group.add(reflector);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.7),
    new THREE.MeshPhysicalMaterial({
      color: 0x9fb4bc,
      metalness: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.4,
    }),
  );
  glass.position.copy(center).addScaledVector(normal, 0.001);
  glass.quaternion.copy(reflector.quaternion);
  group.add(glass);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.78, 0.98),
    new THREE.MeshStandardMaterial({ color: 0x3a4148, roughness: 0.6 }),
  );
  frame.position.copy(center).addScaledVector(normal, -0.012);
  group.add(frame);

  return { group, reflector, glass, center, normal };
}

export function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach((mm) => mm?.dispose());
  });
}
