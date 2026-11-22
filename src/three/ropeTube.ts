import * as THREE from 'three';
import type { RopeModel, TessRing } from '../physics/ropeModel';
import type { Vec3 } from '../physics/types';
import { vec3 } from '../physics/config';

/**
 * 钢丝绳管状几何。
 * - 平行传输（Parallel Transport）标架，避免 Frenet 标架在拐点处翻转
 * - UV.u = 全绳累计弧长（扭绞纹理沿弧长参数化），UV.v = 环向角
 * - 缓冲预分配，环数变化只改 drawRange，不重建索引
 */
export class RopeTubeGeometry extends THREE.BufferGeometry {
  readonly radialSegments: number;
  private capacity: number;
  private positions: Float32Array;
  private normals: Float32Array;
  private uvs: Float32Array;
  private indexBuffer: Uint32Array;
  private usedRings = 0;

  constructor(initialCapacity = 2400, radialSegments = 10) {
    super();
    this.radialSegments = radialSegments;
    this.capacity = initialCapacity;
    const vCount = initialCapacity * radialSegments;
    this.positions = new Float32Array(vCount * 3);
    this.normals = new Float32Array(vCount * 3);
    this.uvs = new Float32Array(vCount * 2);
    this.indexBuffer = new Uint32Array((initialCapacity - 1) * radialSegments * 6);
    this.buildIndices(initialCapacity);

    this.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.setAttribute('normal', new THREE.BufferAttribute(this.normals, 3).setUsage(THREE.DynamicDrawUsage));
    this.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2).setUsage(THREE.DynamicDrawUsage));
    this.setIndex(new THREE.BufferAttribute(this.indexBuffer, 1));
    this.setDrawRange(0, 0);
  }

  private buildIndices(rings: number): void {
    const R = this.radialSegments;
    let k = 0;
    for (let i = 0; i < rings - 1; i++) {
      for (let j = 0; j < R; j++) {
        const a = i * R + j;
        const b = i * R + ((j + 1) % R);
        const c = (i + 1) * R + ((j + 1) % R);
        const d = (i + 1) * R + j;
        this.indexBuffer[k++] = a;
        this.indexBuffer[k++] = b;
        this.indexBuffer[k++] = d;
        this.indexBuffer[k++] = b;
        this.indexBuffer[k++] = c;
        this.indexBuffer[k++] = d;
      }
    }
  }

  /** 容量不足时扩容并重建索引（结构变化时偶发） */
  private ensureCapacity(required: number): void {
    if (required <= this.capacity) return;
    const newCap = Math.max(required, Math.floor(this.capacity * 1.5));
    const R = this.radialSegments;
    const newV = newCap * R;
    const np = new Float32Array(newV * 3);
    const nn = new Float32Array(newV * 3);
    const nu = new Float32Array(newV * 2);
    np.set(this.positions);
    nn.set(this.normals);
    nu.set(this.uvs);
    this.positions = np;
    this.normals = nn;
    this.uvs = nu;
    this.indexBuffer = new Uint32Array((newCap - 1) * R * 6);
    this.buildIndices(newCap);
    this.capacity = newCap;

    this.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.setAttribute('normal', new THREE.BufferAttribute(this.normals, 3).setUsage(THREE.DynamicDrawUsage));
    this.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2).setUsage(THREE.DynamicDrawUsage));
    this.setIndex(new THREE.BufferAttribute(this.indexBuffer, 1));
  }

  /**
   * 用求解结果填充几何。返回环数与耗时。
   * 每个跨独立做平行传输（跨端点为集中载荷折点，标架不连续是正确的）。
   */
  update(model: RopeModel, ropeRadius: number): { ringCount: number; geometryMs: number } {
    const t0 = performance.now();
    const totalRings = model.ringCount;
    this.ensureCapacity(totalRings);
    const R = this.radialSegments;

    let ringIdx = 0;
    let globalArc = 0;

    for (const span of model.spans) {
      const rings = span.rings;
      // 初始法向：取与首切向垂直、尽量贴近世界 UP 的向量
      const t0v = rings[0].tangent;
      let normal: Vec3 = vec3.normalize(
        vec3.sub(UP, vec3.scale(t0v, vec3.dot(UP, t0v))),
      );
      if (vec3.len(normal) < 1e-6) {
        normal = { x: 1, y: 0, z: 0 };
      }
      let prevTangent: Vec3 = t0v;

      for (let i = 0; i < rings.length; i++) {
        const ring: TessRing = rings[i];
        // 平行传输：把上一环法向投影到新切向的法平面
        if (i > 0) {
          normal = parallelTransport(normal, prevTangent, ring.tangent);
          prevTangent = ring.tangent;
        }
        const binormal: Vec3 = vec3.normalize(cross(ring.tangent, normal));
        normal = vec3.normalize(cross(binormal, ring.tangent));

        const u = globalArc + ring.arc;
        for (let j = 0; j < R; j++) {
          const theta = (j / R) * Math.PI * 2;
          const cos = Math.cos(theta);
          const sin = Math.sin(theta);
          const nx = normal.x * cos + binormal.x * sin;
          const ny = normal.y * cos + binormal.y * sin;
          const nz = normal.z * cos + binormal.z * sin;
          const vi = (ringIdx * R + j) * 3;
          const ui = (ringIdx * R + j) * 2;
          this.positions[vi] = ring.pos.x + nx * ropeRadius;
          this.positions[vi + 1] = ring.pos.y + ny * ropeRadius;
          this.positions[vi + 2] = ring.pos.z + nz * ropeRadius;
          this.normals[vi] = nx;
          this.normals[vi + 1] = ny;
          this.normals[vi + 2] = nz;
          this.uvs[ui] = u;
          this.uvs[ui + 1] = j / R;
        }
        ringIdx++;
      }
      globalArc += span.cat.length;
    }

    this.usedRings = ringIdx;
    this.setDrawRange(0, (ringIdx - 1) * R * 6);
    (this.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.getAttribute('normal') as THREE.BufferAttribute).needsUpdate = true;
    (this.getAttribute('uv') as THREE.BufferAttribute).needsUpdate = true;
    const indexAttr = this.getIndex();
    if (indexAttr) indexAttr.needsUpdate = true;
    this.computeBoundingSphere();

    return { ringCount: ringIdx, geometryMs: performance.now() - t0 };
  }

  get usedRingCount(): number {
    return this.usedRings;
  }
}

const UP: Vec3 = { x: 0, y: 1, z: 0 };

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/** 将法向从旧切向标架平行传输到新切向（旋转最小化） */
function parallelTransport(n: Vec3, tOld: Vec3, tNew: Vec3): Vec3 {
  const axis = cross(tOld, tNew);
  const sinA = vec3.len(axis);
  if (sinA < 1e-8) return n;
  const axisN = vec3.scale(axis, 1 / sinA);
  const cosA = Math.min(1, Math.max(-1, vec3.dot(tOld, tNew)));
  // Rodrigues 旋转
  return vec3.normalize({
    x:
      n.x * cosA +
      cross(axisN, n).x * sinA +
      axisN.x * vec3.dot(axisN, n) * (1 - cosA),
    y:
      n.y * cosA +
      cross(axisN, n).y * sinA +
      axisN.y * vec3.dot(axisN, n) * (1 - cosA),
    z:
      n.z * cosA +
      cross(axisN, n).z * sinA +
      axisN.z * vec3.dot(axisN, n) * (1 - cosA),
  });
}
