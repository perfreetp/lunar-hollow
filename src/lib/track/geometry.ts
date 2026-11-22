import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import type { Scene } from '@babylonjs/core/scene.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import type { Centerline, TrackFrame } from './centerline.js';
import { ringIndex } from './centerline.js';

export interface RibbonOptions {
  /** 带状网格的横向半宽序列(相对标架中心,沿 binormal 方向),长度即横向顶点数 */
  columns: Array<{ offset: number; lift: number }>;
  /** 起始/结束标架索引(环形) */
  startIndex: number;
  endIndex: number;
  /** 为 true 时把首尾焊接成闭合环 */
  closed: boolean;
  /** UV 缩放:u = 弧长(米) * uScale,使贴图可直接按"每米重复次数"配置 */
  uScale?: number;
  name: string;
}

/**
 * 沿中心线段构建带状网格(路面、路肩、轮胎痕迹层共用)。
 * 关键:UV.u 直接写入累计弧长(乘 uScale),条纹贴图按真实弧长重复,
 * 与顶点密度、弯道疏密完全无关,因此不会被拉伸。
 */
export function buildRibbon(scene: Scene, center: Centerline, opts: RibbonOptions): Mesh {
  const { frames } = center;
  const m = frames.length;
  const colCount = opts.columns.length;
  const rowLast = opts.closed ? m : opts.endIndex + 1;
  const rowCount = rowLast - opts.startIndex;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let prevS: number | null = null;
  let arcAcc = 0;

  for (let r = 0; r < rowCount; r++) {
    const fi = ringIndex(opts.startIndex + r, m);
    const frame: TrackFrame = frames[fi];
    if (prevS !== null) {
      // 环形跨越 0 点时补一个采样间距
      const d = frame.s - prevS;
      arcAcc += d < -center.totalLength / 2 ? d + center.totalLength : d;
    }
    prevS = frame.s;
    const u = arcAcc * (opts.uScale ?? 1);

    for (let c = 0; c < colCount; c++) {
      const col = opts.columns[c];
      const p = frame.position
        .add(frame.binormal.scale(col.offset))
        .add(frame.normal.scale(col.lift));
      positions.push(p.x, p.y, p.z);
      normals.push(frame.normal.x, frame.normal.y, frame.normal.z);
      // v 在横向上 0..1 均匀分布
      uvs.push(u, colCount === 1 ? 0.5 : c / (colCount - 1));
    }
  }

  for (let r = 0; r < rowCount - 1; r++) {
    for (let c = 0; c < colCount - 1; c++) {
      const a = r * colCount + c;
      const b = a + 1;
      const d = (r + 1) * colCount + c;
      const e = d + 1;
      // T=+z、B=+x 时保证叉积朝上(+y):a->e->b、a->d->e
      indices.push(a, e, b, a, d, e);
    }
  }
  if (opts.closed) {
    // 最后一行与第一行焊接
    const r = rowCount - 1;
    for (let c = 0; c < colCount - 1; c++) {
      const a = r * colCount + c;
      const b = a + 1;
      const d = c;
      const e = d + 1;
      indices.push(a, e, b, a, d, e);
    }
  }

  const mesh = new Mesh(opts.name, scene);
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.normals = normals;
  vertexData.uvs = uvs;
  vertexData.indices = indices;
  vertexData.applyToMesh(mesh, false);
  return mesh;
}

export interface TrackDimensions {
  /** 路面半宽(米) */
  roadHalfWidth: number;
  /** 单侧路肩宽度(米) */
  curbWidth: number;
}

export const TRACK_DIMS: TrackDimensions = {
  roadHalfWidth: 7,
  curbWidth: 1.2
};

/** 生成红白路肩条纹贴图:条纹沿 u(弧长)方向交替,每 stripeLength 米换色 */
export function makeCurbTexture(scene: Scene, stripeLength = 2): DynamicTexture {
  const tex = new DynamicTexture('curbStripe', { width: 256, height: 32 }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  // 贴图横方向代表 1 米(uScale = 1 时),红/白各占 stripeLength/2
  const half = 128 / stripeLength;
  for (let i = 0; i < stripeLength; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#c8102e' : '#f4f4f4';
    ctx.fillRect(i * half, 0, half, 32);
  }
  // 细微噪点避免色带
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(Math.random() * 256, Math.random() * 32, 2, 2);
  }
  tex.update(false);
  tex.wrapU = 1; // Wrap
  tex.wrapV = 1;
  tex.uScale = 1 / stripeLength; // 网格 UV.u 单位是米 -> 每 stripeLength 米重复一次
  tex.vScale = 1;
  return tex;
}

/** 路面沥青基础贴图(带车道线),u 单位同样是米 */
export function makeAsphaltTexture(scene: Scene): DynamicTexture {
  const tex = new DynamicTexture('asphalt', { width: 256, height: 64 }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  ctx.fillStyle = '#3a3d40';
  ctx.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 2500; i++) {
    const g = 40 + Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgba(${g},${g},${g},0.25)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 64, 1.5, 1.5);
  }
  // 中央虚线:贴图代表 8 米长的路面,4 米线 + 4 米间隔
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 30, 128, 4);
  // 两侧白色边线
  ctx.fillRect(0, 2, 256, 2);
  ctx.fillRect(0, 60, 256, 2);
  tex.update(false);
  tex.wrapU = 1;
  tex.wrapV = 1;
  tex.uScale = 1 / 8; // 每 8 米重复
  tex.vScale = 1;
  return tex;
}

/** 把世界坐标点投影到某条 ribbon 表面(供贴花定位用),返回弧长 s 与横向 v[0..1] */
export function projectToRibbon(
  center: Centerline,
  point: Vector3
): { s: number; lateral: number } {
  // 在等弧长采样上找最近标架(采样间距 2m,精度足够贴花用)
  let best = 0;
  let bestD = Infinity;
  const { frames } = center;
  for (let i = 0; i < frames.length; i++) {
    const d = Vector3.DistanceSquared(frames[i].position, point);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const f = frames[best];
  const lateral = Vector3.Dot(point.subtract(f.position), f.binormal);
  return { s: f.s, lateral };
}
