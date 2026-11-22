import { Scene } from '@babylonjs/core/scene.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import type { InstancedMesh } from '@babylonjs/core/Meshes/instancedMesh.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import type { Centerline } from './centerline.js';
import { ringDistance, sampleAt } from './centerline.js';
import { TRACK_DIMS } from './geometry.js';
import { LOD_BOUNDARIES, STREAM_RADIUS } from '../state/roam.js';
import type { ChunkInfo, ChunkState } from '../state/roam.js';

/** 确定性伪随机(分块内容在多次加载间保持一致) */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SourceMesh {
  mesh: Mesh;
  /** LOD 级别门槛:tier <= 当前 lod 时其实例才可见 */
  tier: 0 | 1 | 2;
}

interface SceneryInstance {
  source: SourceMesh;
  instance: InstancedMesh;
}

export interface ChunkManagerCallbacks {
  onChunkState: (infos: ChunkInfo[]) => void;
}

const CHUNK_SPAN = 50; // 每个分块沿弧长跨度(米)
const LOAD_LATENCY = [220, 600] as const; // 模拟流式加载延迟(毫秒)
const MAX_CONCURRENT_LOADS = 2;

/**
 * 赛道场景分块管理器:
 * - 沿弧长等距分块,视点 300m 环域内的分块进入流式加载;
 * - 加载期间显示半透明占位盒衔接,杜绝空洞;
 * - 已加载分块按距离在 LOD0/1/2 之间切换(实例显隐三级降级),远处分块卸载;
 * - 护栏、看台、树木全部为 InstancedMesh,源网格只构建一次。
 */
export class ChunkManager {
  private readonly chunkCount: number;
  private readonly sources: SourceMesh[] = [];
  private readonly chunks = new Map<
    number,
    {
      state: ChunkState;
      instances: SceneryInstance[];
      placeholder: Mesh;
      loadToken: number;
      lod: number;
    }
  >();

  private loadingQueue: number[] = [];
  private activeLoads = 0;
  private tokenCounter = 0;
  private evalTimer = 0;
  private infos: ChunkInfo[] = [];
  private readonly root: TransformNode;

  constructor(
    private readonly scene: Scene,
    private readonly center: Centerline,
    private readonly cb: ChunkManagerCallbacks
  ) {
    this.chunkCount = Math.ceil(center.totalLength / CHUNK_SPAN);
    this.root = new TransformNode('sceneryRoot', scene);
    this.buildSourceMeshes();
    for (let i = 0; i < this.chunkCount; i++) {
      this.infos.push({
        id: i,
        state: 'idle',
        lod: -1,
        centerS: (i + 0.5) * CHUNK_SPAN
      });
    }
    this.cb.onChunkState(this.infos.map((x) => ({ ...x })));
  }

  get count() {
    return this.chunkCount;
  }

  private makeMat(name: string, color: Color3, roughness = 0.9): StandardMaterial {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = color;
    mat.specularColor = new Color3(roughness * 0.1, roughness * 0.1, roughness * 0.1);
    return mat;
  }

  /** 构建全部源网格(隐藏,仅作为 InstancedMesh 模板) */
  private buildSourceMeshes() {
    const steel = this.makeMat('guardrailSteel', new Color3(0.62, 0.66, 0.7));
    const post = this.makeMat('guardrailPost', new Color3(0.35, 0.37, 0.4));
    const concrete = this.makeMat('standConcrete', new Color3(0.55, 0.53, 0.5));
    const seatRed = this.makeMat('seatRed', new Color3(0.75, 0.12, 0.12));
    const trunk = this.makeMat('trunk', new Color3(0.35, 0.22, 0.12));
    const leaf = this.makeMat('leaf', new Color3(0.16, 0.42, 0.18));

    const register = (mesh: Mesh, tier: 0 | 1 | 2): SourceMesh => {
      mesh.setEnabled(false);
      mesh.parent = this.root;
      const src = { mesh, tier };
      this.sources.push(src);
      return src;
    };

    // --- 护栏:横梁(tier2,所有 LOD 保留)+ 密立柱(tier0)+ 疏立柱(tier1) ---
    const beam = MeshBuilder.CreateBox(
      'railBeam',
      { width: 4.6, height: 0.18, depth: 0.12 },
      this.scene
    );
    beam.material = steel;
    register(beam, 2);

    const postDense = MeshBuilder.CreateBox('postDense', { width: 0.12, height: 1, depth: 0.12 }, this.scene);
    postDense.position.y = -0.5;
    postDense.material = post;
    register(postDense, 0);

    const postSparse = MeshBuilder.CreateBox('postSparse', { width: 0.16, height: 1, depth: 0.16 }, this.scene);
    postSparse.position.y = -0.5;
    postSparse.material = post;
    register(postSparse, 1);

    // --- 看台:混凝土主体(tier2)+ 座位排(tier1)+ 细排(tier0) ---
    const standCore = MeshBuilder.CreateBox('standCore', { width: 10, height: 6, depth: 8 }, this.scene);
    standCore.material = concrete;
    register(standCore, 2);

    const seatRows = MeshBuilder.CreateBox('seatRows', { width: 9.2, height: 1.2, depth: 5 }, this.scene);
    seatRows.position.set(0, 3.4, -1.2);
    seatRows.material = seatRed;
    register(seatRows, 1);

    const seatFine = MeshBuilder.CreateBox('seatFine', { width: 9.2, height: 0.5, depth: 4.6 }, this.scene);
    seatFine.position.set(0, 4.2, -1.2);
    seatFine.material = seatRed;
    register(seatFine, 0);

    // --- 树木:树冠(tier1)+ 树干(tier2 合并保留);细枝仅 LOD0 ---
    const crown = MeshBuilder.CreateSphere('crown', { diameter: 3.4, segments: 6 }, this.scene);
    crown.position.y = 2.6;
    crown.material = leaf;
    register(crown, 1);

    const trunkMesh = MeshBuilder.CreateCylinder('trunkMesh', { height: 2.4, diameter: 0.4 }, this.scene);
    trunkMesh.position.y = 1.2;
    trunkMesh.material = trunk;
    register(trunkMesh, 2);

    const twig = MeshBuilder.CreateCylinder('twig', { height: 1.2, diameter: 0.12 }, this.scene);
    twig.position.y = 3.6;
    twig.material = trunk;
    register(twig, 0);
  }

  private sourceByName(name: string): SourceMesh {
    const s = this.sources.find((x) => x.mesh.name === name);
    if (!s) throw new Error(`source mesh ${name} missing`);
    return s;
  }

  /** 为一个分块确定性生成实例布局 */
  private buildChunkInstances(chunkId: number): SceneryInstance[] {
    const rand = mulberry32(0x9e3779b9 ^ (chunkId * 2654435761));
    const s0 = chunkId * CHUNK_SPAN;
    const result: SceneryInstance[] = [];
    const railOffset = TRACK_DIMS.roadHalfWidth + TRACK_DIMS.curbWidth + 0.9;

    const add = (src: SourceMesh, s: number, lateral: number, lift = 0, yawExtra = 0) => {
      const f = sampleAt(this.center, s);
      const pos = f.position
        .add(f.binormal.scale(lateral))
        .add(f.normal.scale(lift));
      const yaw = Math.atan2(f.tangent.x, f.tangent.z) + yawExtra;
      const instance = src.mesh.createInstance(`${src.mesh.name}_c${chunkId}_${result.length}`);
      instance.position = pos;
      // 偏航对齐切线;上下坡较缓,标架倾斜可忽略
      instance.rotation = new Vector3(0, yaw, 0);
      instance.parent = this.root;
      result.push({ source: src, instance });
    };

    // 1. 双侧护栏:每 5m 一组横梁;立柱 2.5m(密)/5m(疏)
    for (let s = s0; s < s0 + CHUNK_SPAN; s += 5) {
      for (const side of [-1, 1]) {
        add(this.sourceByName('railBeam'), s, side * railOffset, 0.85);
        add(this.sourceByName('postSparse'), s, side * railOffset, 0.5);
        add(this.sourceByName('postDense'), s + 2.5, side * railOffset, 0.5);
      }
    }

    // 2. 看台:约 1/3 分块在外侧放置
    if (rand() < 0.34) {
      const side = rand() > 0.5 ? 1 : -1;
      const sStand = s0 + 10 + rand() * 25;
      const lateral = side * (railOffset + 7 + rand() * 4);
      add(this.sourceByName('standCore'), sStand, lateral, 3);
      add(this.sourceByName('seatRows'), sStand, lateral, 3);
      add(this.sourceByName('seatFine'), sStand, lateral, 3);
    }

    // 3. 树木:随机散布在更外侧
    const treeCount = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < treeCount; i++) {
      const s = s0 + rand() * CHUNK_SPAN;
      const side = rand() > 0.5 ? 1 : -1;
      const lateral = side * (railOffset + 6 + rand() * 22);
      add(this.sourceByName('crown'), s, lateral);
      add(this.sourceByName('trunkMesh'), s, lateral);
      if (rand() < 0.4) add(this.sourceByName('twig'), s, lateral);
    }

    return result;
  }

  private makePlaceholder(chunkId: number): Mesh {
    const s0 = chunkId * CHUNK_SPAN;
    const start = sampleAt(this.center, s0);
    const end = sampleAt(this.center, Math.min(this.center.totalLength - 0.01, s0 + CHUNK_SPAN));
    const center = start.position.add(end.position).scale(0.5);
    const span = Vector3.Distance(start.position, end.position) + 4;
    const width = (TRACK_DIMS.roadHalfWidth + TRACK_DIMS.curbWidth) * 2 + 26;
    const box = MeshBuilder.CreateBox(
      `placeholder_${chunkId}`,
      { width, height: 1.2, depth: Math.max(8, span) },
      this.scene
    );
    box.position = center.add(new Vector3(0, 0.4, 0));
    const yaw = Math.atan2(start.tangent.x, start.tangent.z);
    box.rotation = new Vector3(0, yaw, 0);
    const mat = new StandardMaterial(`placeholderMat_${chunkId}`, this.scene);
    mat.diffuseColor = new Color3(0.45, 0.42, 0.6);
    mat.alpha = 0.32;
    mat.emissiveColor = new Color3(0.12, 0.1, 0.2);
    box.material = mat;
    box.parent = this.root;
    return box;
  }

  private emitState() {
    for (const info of this.infos) {
      const c = this.chunks.get(info.id);
      info.state = c?.state ?? 'idle';
      info.lod = c?.lod ?? -1;
    }
    this.cb.onChunkState(this.infos.map((x) => ({ ...x })));
  }

  private beginLoad(chunkId: number) {
    const token = ++this.tokenCounter;
    const placeholder = this.makePlaceholder(chunkId);
    this.chunks.set(chunkId, {
      state: 'loading',
      instances: [],
      placeholder,
      loadToken: token,
      lod: -1
    });
    this.activeLoads++;
    const latency = LOAD_LATENCY[0] + Math.random() * (LOAD_LATENCY[1] - LOAD_LATENCY[0]);
    // 模拟异步分块资源加载
    window.setTimeout(() => {
      const chunk = this.chunks.get(chunkId);
      if (!chunk || chunk.loadToken !== token) {
        // 加载期间分块已被卸载,作废本次结果
        this.activeLoads--;
        this.pumpQueue();
        return;
      }
      chunk.instances = this.buildChunkInstances(chunkId);
      chunk.placeholder.dispose();
      chunk.state = 'ready';
      chunk.lod = 0;
      this.applyLod(chunkId);
      this.activeLoads--;
      this.emitState();
      this.pumpQueue();
    }, latency);
  }

  private pumpQueue() {
    while (this.activeLoads < MAX_CONCURRENT_LOADS && this.loadingQueue.length > 0) {
      const id = this.loadingQueue.shift()!;
      if (this.chunks.has(id)) continue;
      this.beginLoad(id);
    }
    this.emitState();
  }

  private unload(chunkId: number) {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) return;
    chunk.loadToken = -1; // 使进行中的加载回调失效
    for (const ins of chunk.instances) ins.instance.dispose();
    chunk.placeholder.dispose();
    this.chunks.delete(chunkId);
  }

  /** 按视点弧长应用三级 LOD:只切换实例显隐,不重建几何 */
  private applyLod(chunkId: number) {
    const chunk = this.chunks.get(chunkId);
    if (!chunk || chunk.state !== 'ready') return;
    for (const { source, instance } of chunk.instances) {
      instance.setEnabled(source.tier <= chunk.lod);
    }
  }

  /** 每 200ms 评估一次流式范围与 LOD(相机跳段时立即评估) */
  update(viewerS: number, force = false) {
    this.evalTimer++;
    if (!force && this.evalTimer % 12 !== 0) return;

    const L = this.center.totalLength;
    const wanted: Array<{ id: number; dist: number }> = [];
    for (let i = 0; i < this.chunkCount; i++) {
      const centerS = (i + 0.5) * CHUNK_SPAN;
      const dist = ringDistance(viewerS, centerS, L);
      if (dist <= STREAM_RADIUS) wanted.push({ id: i, dist });
    }

    // 卸载超出 300m 环域的分块
    const wantedIds = new Set(wanted.map((w) => w.id));
    for (const id of [...this.chunks.keys()]) {
      if (!wantedIds.has(id)) this.unload(id);
    }

    // 入队新加载(近的优先)
    wanted.sort((a, b) => a.dist - b.dist);
    this.loadingQueue = wanted
      .filter((w) => !this.chunks.has(w.id))
      .map((w) => w.id);

    // 已加载分块按距离降级 LOD
    for (const w of wanted) {
      const chunk = this.chunks.get(w.id);
      if (!chunk || chunk.state !== 'ready') continue;
      let lod = 0;
      if (w.dist >= LOD_BOUNDARIES[1]) lod = 2;
      else if (w.dist >= LOD_BOUNDARIES[0]) lod = 1;
      if (lod !== chunk.lod) {
        chunk.lod = lod;
        this.applyLod(w.id);
      }
    }

    this.pumpQueue();
  }

  /** 路段跳转:相机位置与分块加载状态联动,立即重排流式范围 */
  jumpTo(s: number) {
    this.update(s, true);
  }

  /** 当前分块加载状态快照(供导出文件) */
  snapshot(): ChunkInfo[] {
    return this.infos.map((x) => ({ ...x }));
  }
}
