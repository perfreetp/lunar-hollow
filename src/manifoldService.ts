// manifold-3d WASM 加载与实体布尔干涉检查
import Module from 'manifold-3d';
import wasmUrl from 'manifold-3d/manifold.wasm?url';
import {
  BRACKET,
  CYLINDER,
  HALF_SPAN,
  HINGE,
  INTERFERENCE_VOLUME_EPS,
  LEAF,
  LINK_Y,
  OBSTACLE,
  RECESS,
  ROD_ATTACH_R,
  SIDES,
  WALL,
  type SideConfig,
} from './config';
import { cylinderBarrelEnds, leafAngleAt, solveKinematics, type Vec3 } from './kinematics';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ManifoldModule = any;

let modPromise: Promise<ManifoldModule> | null = null;

export function loadManifold(): Promise<ManifoldModule> {
  if (!modPromise) {
    modPromise = (async () => {
      const mod = await Module({ locateFile: () => wasmUrl });
      mod.setup();
      return mod;
    })();
  }
  return modPromise;
}

export interface MeshData {
  positions: Float32Array;
  indices: Uint32Array;
}

export interface InterferenceHit {
  a: string;
  b: string;
  volume: number;
  mesh: MeshData | null;
}

export interface InterferenceReport {
  thetaDeg: number;
  hits: InterferenceHit[];
  checkedPairs: number;
  timestamp: string;
}

/** 3x4 行主序变换矩阵(内部表示) */
type Mat34 = number[];

/** 转为 manifold 需要的 4x4 列主序矩阵 */
function toMat4(m: Mat34): number[] {
  return [
    m[0], m[4], m[8], 0,
    m[1], m[5], m[9], 0,
    m[2], m[6], m[10], 0,
    m[3], m[7], m[11], 1,
  ];
}

function rotYTranslate(angleRad: number, tx: number, ty: number, tz: number): Mat34 {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  // 列 = 基向量:localX→(c,0,-s), localY→(0,1,0), localZ→(s,0,c)
  return [c, 0, s, tx, 0, 1, 0, ty, -s, 0, c, tz];
}

/** 构造把局部 +Z 轴映射到 dir、原点映射到 p0 的变换 */
function segmentTransform(p0: Vec3, p1: Vec3): Mat34 {
  const zx = p1.x - p0.x;
  const zy = p1.y - p0.y;
  const zz = p1.z - p0.z;
  const len = Math.hypot(zx, zy, zz) || 1;
  const z = { x: zx / len, y: zy / len, z: zz / len };
  // 选一个不与 z 平行的参考向量构造正交基
  const ref = Math.abs(z.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const x = norm(cross(ref, z));
  const y = cross(z, x);
  return [
    x.x, y.x, z.x, p0.x,
    x.y, y.y, z.y, p0.y,
    x.z, y.z, z.z, p0.z,
  ];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

// ---------- 实体构造 ----------

function boxAt(mod: ManifoldModule, sx: number, sy: number, sz: number, mat: Mat34) {
  return mod.Manifold.cube([sx, sy, sz], false).transform(toMat4(mat));
}

function translateMat(tx: number, ty: number, tz: number): Mat34 {
  return [1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz];
}

/** 墙壁实体(含门龛凹槽)。side=-1 左岸,+1 右岸 */
function buildWall(mod: ManifoldModule, sideSign: number) {
  const x0 = sideSign < 0 ? -(HALF_SPAN + WALL.thickness) : HALF_SPAN;
  const wall = boxAt(
    mod,
    WALL.thickness,
    WALL.height,
    WALL.zMax - WALL.zMin,
    translateMat(x0, 0, WALL.zMin),
  );
  // 门龛凹槽:从墙面往墙内掏,并略伸入闸室
  const rx0 = sideSign < 0 ? -(HALF_SPAN + WALL.thickness) : HALF_SPAN - RECESS.depthIntoChamber;
  const recess = boxAt(
    mod,
    WALL.thickness + RECESS.depthIntoChamber,
    RECESS.yMax - RECESS.yMin,
    RECESS.zMax - RECESS.zMin,
    translateMat(rx0, RECESS.yMin, RECESS.zMin),
  );
  const result = wall.subtract(recess);
  wall.delete();
  recess.delete();
  return result;
}

function buildObstacle(mod: ManifoldModule) {
  return boxAt(
    mod,
    OBSTACLE.sx,
    OBSTACLE.sy,
    OBSTACLE.sz,
    translateMat(OBSTACLE.cx - OBSTACLE.sx / 2, 0, OBSTACLE.cz - OBSTACLE.sz / 2),
  );
}

/** 门叶实体(局部:支铰在原点,门叶沿 +X,含铰点支架与中缝斜切) */
function buildLeafLocal(mod: ManifoldModule, side: SideConfig) {
  const box = mod.Manifold.cube([LEAF.length, LEAF.height, LEAF.thickness], false).translate([
    0,
    0,
    -LEAF.thickness / 2,
  ]);
  const bracket = mod.Manifold.cube([BRACKET.size, BRACKET.yTop - BRACKET.yBottom, BRACKET.size], false).translate([
    ROD_ATTACH_R - BRACKET.size / 2,
    BRACKET.yBottom,
    -BRACKET.size / 2,
  ]);
  let leaf = box.add(bracket);
  box.delete();
  bracket.delete();
  // 中缝斜切:真实人字门门叶端部切成斜口,关闭时沿中缝平面接触而非重叠。
  // 切割面在关闭位姿下与世界平面 x=0 重合,转换到门叶局部坐标(绕 Y 旋转 closedAngle)。
  // trimByPlane 保留法向正侧,故取负法向以保留 n·p ≤ offset 一侧。
  const wx = side.id === 'L' ? 1 : -1; // 世界法向(保留侧为负)
  const a = side.closedAngle;
  const nl: [number, number, number] = [-wx * Math.cos(a), 0, wx * Math.sin(a)];
  const trimmed = leaf.trimByPlane(nl, -wx * Math.cos(a) * LEAF.length);
  leaf.delete();
  leaf = trimmed;
  return leaf;
}

/** 门叶局部实体缓存 */
const leafLocalCache = new Map<string, ManifoldModule>();

async function getLeafLocal(side: SideConfig) {
  let m = leafLocalCache.get(side.id);
  if (!m) {
    const mod = await loadManifold();
    m = buildLeafLocal(mod, side);
    leafLocalCache.set(side.id, m);
  }
  return m;
}

function buildLeafTransformed(local: ManifoldModule, side: SideConfig, thetaDeg: number) {
  const a = leafAngleAt(side, thetaDeg);
  // 旋转角 γ 使局部 +X 映射到方向 (cos a, 0, sin a):γ = -a
  const mat = rotYTranslate(-a, side.hinge[0], 0, side.hinge[2]);
  return local.transform(toMat4(mat));
}

/** 圆柱实体:从 p0 到 p1 */
function cylinderBetween(mod: ManifoldModule, p0: Vec3, p1: Vec3, radius: number, seg = 24) {
  const len = Math.hypot(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z);
  const cyl = mod.Manifold.cylinder(len, radius, radius, seg, false);
  const t = cyl.transform(toMat4(segmentTransform(p0, p1)));
  cyl.delete();
  return t;
}

// ---------- 静态场景缓存 ----------

interface StaticScene {
  wallL: ManifoldModule;
  wallR: ManifoldModule;
  obstacle: ManifoldModule;
}

let staticScene: StaticScene | null = null;

async function getStaticScene(): Promise<StaticScene> {
  if (!staticScene) {
    const mod = await loadManifold();
    staticScene = {
      wallL: buildWall(mod, -1),
      wallR: buildWall(mod, 1),
      obstacle: buildObstacle(mod),
    };
  }
  return staticScene;
}

/** 静态部件的显示网格(墙壁/障碍),供 three.js 使用 */
export async function getStaticMeshes(): Promise<Record<'wallL' | 'wallR' | 'obstacle', MeshData>> {
  const s = await getStaticScene();
  return {
    wallL: extractMesh(s.wallL),
    wallR: extractMesh(s.wallR),
    obstacle: extractMesh(s.obstacle),
  };
}

/** 门叶局部坐标显示网格(支铰在原点,+X 沿门叶),供 three.js 使用 */
export async function getLeafMeshes(): Promise<Record<'L' | 'R', MeshData>> {
  const l = await getLeafLocal(SIDES[0]);
  const r = await getLeafLocal(SIDES[1]);
  return { L: extractMesh(l), R: extractMesh(r) };
}

function extractMesh(manifold: ManifoldModule): MeshData {
  const mesh = manifold.getMesh();
  const numProp = mesh.numProp;
  const positions = new Float32Array(mesh.numVert * 3);
  for (let i = 0; i < mesh.numVert; i++) {
    positions[i * 3] = mesh.vertProperties[i * numProp];
    positions[i * 3 + 1] = mesh.vertProperties[i * numProp + 1];
    positions[i * 3 + 2] = mesh.vertProperties[i * numProp + 2];
  }
  return { positions, indices: new Uint32Array(mesh.triVerts) };
}

// ---------- 干涉检查 ----------

interface MovingPart {
  name: string;
  manifold: ManifoldModule;
}

async function buildMovingParts(mod: ManifoldModule, thetaDeg: number): Promise<MovingPart[]> {
  const kin = solveKinematics(thetaDeg);
  const parts: MovingPart[] = [];
  for (const sk of kin.sides) {
    const side = sk.side;
    const tag = side.id === 'L' ? '左' : '右';
    const leafLocal = await getLeafLocal(side);
    parts.push({ name: `${tag}门叶`, manifold: buildLeafTransformed(leafLocal, side, thetaDeg) });
    // 连杆:B → C
    parts.push({
      name: `${tag}连杆`,
      manifold: cylinderBetween(mod, sk.B, sk.C, CYLINDER.linkRodRadius),
    });
    // 活塞杆:缸筒出口 → B
    const barrel = cylinderBarrelEnds(side);
    parts.push({
      name: `${tag}活塞杆`,
      manifold: cylinderBetween(mod, barrel.p1, sk.B, CYLINDER.rodRadius),
    });
    // 缸筒
    parts.push({
      name: `${tag}启闭机缸筒`,
      manifold: cylinderBetween(mod, barrel.p0, barrel.p1, CYLINDER.barrelRadius),
    });
  }
  return parts;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** 铰接相连、允许接触的部件对(不参与判定) */
const EXCLUDED_PAIRS = new Set([
  pairKey('左门叶', '左连杆'),
  pairKey('左连杆', '左活塞杆'),
  pairKey('左活塞杆', '左启闭机缸筒'),
  pairKey('右门叶', '右连杆'),
  pairKey('右连杆', '右活塞杆'),
  pairKey('右活塞杆', '右启闭机缸筒'),
]);

export async function checkInterference(thetaDeg: number): Promise<InterferenceReport> {
  const mod = await loadManifold();
  const stat = await getStaticScene();
  const moving = await buildMovingParts(mod, thetaDeg);

  const statics: MovingPart[] = [
    { name: '左闸室墙', manifold: stat.wallL },
    { name: '右闸室墙', manifold: stat.wallR },
    { name: '闸室障碍块', manifold: stat.obstacle },
  ];

  const hits: InterferenceHit[] = [];
  let checked = 0;
  const tryPair = (a: MovingPart, b: MovingPart) => {
    if (EXCLUDED_PAIRS.has(pairKey(a.name, b.name))) return;
    checked++;
    const inter = a.manifold.intersect(b.manifold);
    const vol = inter.volume();
    if (vol > INTERFERENCE_VOLUME_EPS) {
      hits.push({ a: a.name, b: b.name, volume: vol, mesh: extractMesh(inter) });
    }
    inter.delete();
  };

  // 运动件 × 静态件
  for (const m of moving) for (const s of statics) tryPair(m, s);
  // 运动件 × 运动件(左右门叶互检等)
  for (let i = 0; i < moving.length; i++)
    for (let j = i + 1; j < moving.length; j++) tryPair(moving[i], moving[j]);

  for (const m of moving) m.manifold.delete();

  hits.sort((x, y) => y.volume - x.volume);
  return {
    thetaDeg,
    hits,
    checkedPairs: checked,
    timestamp: new Date().toISOString(),
  };
}

/** 支铰显示用参数(仅可视化,不参与布尔) */
export const HINGE_VISUAL = HINGE;
export const LINK_Y_VISUAL = LINK_Y;
export const SIDES_VISUAL = SIDES;
