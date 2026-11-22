import { Engine } from '@babylonjs/core/Engines/engine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { buildCenterline, sampleAt, segmentStart, SEGMENT_COUNT } from './centerline.js';
import type { Centerline } from './centerline.js';
import {
  buildRibbon,
  makeAsphaltTexture,
  makeCurbTexture,
  TRACK_DIMS
} from './geometry.js';
import { ChunkManager } from './scenery.js';
import { TireMarkLayer } from './tireMarks.js';
import { RoamCamera } from './camera.js';
import { createRoamState, gearToSpeed, roamStore, STREAM_RADIUS } from '../state/roam.js';
import type { RoamState, ChunkInfo } from '../state/roam.js';

export { createRoamState, roamStore };
export type { RoamState, CameraMode, ChunkInfo } from '../state/roam.js';

/**
 * 赛道三维漫游引擎:负责场景装配、路面/路肩/贴花几何、
 * 分块流式调度、相机驱动与渲染循环。
 */
export class TrackEngine {
  private engine: Engine;
  private scene: Scene;
  private center!: Centerline;
  private camera!: RoamCamera;
  private chunks!: ChunkManager;
  private tireMarks!: TireMarkLayer;
  readonly state: RoamState = createRoamState();
  private fpsAccum = 0;
  private fpsFrames = 0;
  private disposed = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.55, 0.7, 0.85, 1);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.0016;
    this.scene.fogColor = new Color3(0.62, 0.72, 0.82);
  }

  /** 初始化赛道(进入赛道按钮触发) */
  async init(): Promise<void> {
    this.center = buildCenterline();
    this.setupLights();
    this.setupGround();
    this.buildTrackSurface();

    this.tireMarks = new TireMarkLayer(this.scene, this.center);
    this.chunks = new ChunkManager(this.scene, this.center, {
      onChunkState: (infos) => this.syncChunks(infos)
    });
    this.camera = new RoamCamera(this.scene, this.center, this.canvas);

    this.state.totalLength = this.center.totalLength;
    this.state.chunkCount = this.chunks.count;
    this.state.s = 0;
    this.state.segment = 1;
    this.state.speed = gearToSpeed(this.state.speedGear);
    this.state.ready = true;
    this.chunks.jumpTo(0);
    this.pushState();

    this.scene.onBeforeRenderObservable.add(() => this.tick());
    this.engine.runRenderLoop(() => {
      if (!this.disposed) this.scene.render();
    });
    window.addEventListener('resize', this.handleResize);

    // 调试钩子:便于浏览器控制台与自动化检查访问引擎内部
    (window as unknown as { __trackEngine?: TrackEngine }).__trackEngine = this;
  }

  private handleResize = () => this.engine.resize();

  private setupLights() {
    const hemi = new HemisphericLight('hemi', new Vector3(0.2, 1, 0.3), this.scene);
    hemi.intensity = 0.85;
    hemi.groundColor = new Color3(0.35, 0.32, 0.28);
    const dir = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.4), this.scene);
    dir.intensity = 0.7;
  }

  private setupGround() {
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 1800, height: 1800, subdivisions: 4 },
      this.scene
    );
    const mat = new StandardMaterial('groundMat', this.scene);
    mat.diffuseColor = new Color3(0.27, 0.4, 0.24);
    mat.specularColor = Color3.Black();
    ground.material = mat;
    ground.position.y = -0.15;
  }

  /** 路面 + 双侧路肩:三条全环 ribbon,UV.u 均为弧长(米) */
  private buildTrackSurface() {
    const hw = TRACK_DIMS.roadHalfWidth;
    const cw = TRACK_DIMS.curbWidth;

    // 路面:5 列顶点保证弯道处横向插值平滑
    const road = buildRibbon(this.scene, this.center, {
      name: 'roadSurface',
      columns: [-1, -0.5, 0, 0.5, 1].map((t) => ({ offset: t * hw, lift: 0 })),
      startIndex: 0,
      endIndex: this.center.frames.length - 1,
      closed: true,
      uScale: 1 / 8
    });
    const roadMat = new StandardMaterial('roadMat', this.scene);
    const asphalt = makeAsphaltTexture(this.scene);
    roadMat.diffuseTexture = asphalt;
    roadMat.specularColor = new Color3(0.04, 0.04, 0.04);
    road.material = roadMat;

    // 路肩条纹材质:贴图 uScale 已在纹理内按"每 2 米一对红白"配置
    const curbTex = makeCurbTexture(this.scene, 2);
    const makeCurb = (name: string, inner: number, outer: number, lift: number) => {
      const rib = buildRibbon(this.scene, this.center, {
        name,
        columns: [
          { offset: inner, lift },
          { offset: (inner + outer) / 2, lift: lift + 0.02 },
          { offset: outer, lift: lift + 0.05 }
        ],
        startIndex: 0,
        endIndex: this.center.frames.length - 1,
        closed: true
      });
      const mat = new StandardMaterial(name + 'Mat', this.scene);
      // 共用同一张弧长贴图:两侧路肩条纹严格同相位
      mat.diffuseTexture = curbTex;
      mat.specularColor = new Color3(0.05, 0.05, 0.05);
      rib.material = mat;
      return rib;
    };
    makeCurb('curbLeft', -hw - cw, -hw, 0);
    makeCurb('curbRight', hw, hw + cw, 0);
  }

  private syncChunks(infos: ChunkInfo[]) {
    this.state.chunks = infos;
    this.state.loadingCount = infos.filter((c) => c.state === 'loading').length;
    this.pushState();
  }

  private tick() {
    const dt = Math.min(0.05, this.engine.getDeltaTime() / 1000);
    if (!this.state.ready) return;

    const frame = this.camera.update(dt);
    this.state.s = frame.s;
    this.state.segment = frame.segment;
    this.state.mode = frame.mode;
    this.state.speed = frame.speed;
    this.state.heading = frame.heading;
    this.state.odometer = frame.odometer;
    this.state.speedGear = this.camera.speedGear;

    // 轮胎痕迹仅在巡航贴地行驶时沉积,自由飞行不留下胎印
    if (frame.mode === 'cruise') {
      const speed01 = Math.min(1, frame.speed / gearToSpeed(5));
      this.tireMarks.deposit(frame.s, dt, speed01);
    }
    this.tireMarks.update(dt, frame.s);
    this.state.tireIntensity = this.tireMarks.averageIntensity;

    this.chunks.update(frame.s);

    // FPS 每秒刷新一次
    this.fpsAccum += dt;
    this.fpsFrames++;
    if (this.fpsAccum >= 1) {
      this.state.fps = Math.round(this.fpsFrames / this.fpsAccum);
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }
    this.pushState();
  }

  private pushState() {
    roamStore.set({ ...this.state, chunks: this.state.chunks });
  }

  // ---------- 对 UI 暴露的命令 ----------

  /** 跳转到第 k 个路段(1..8),相机与分块加载联动 */
  jumpToSegment(k: number) {
    const target = segmentStart(this.center, Math.min(SEGMENT_COUNT - 1, Math.max(0, k - 1)));
    this.camera.jumpTo(target);
    this.chunks.jumpTo(target);
    this.state.s = target;
    this.state.segment = k;
    this.pushState();
  }

  /** 小地图点击:把世界 XZ 坐标反解为最近弧长后跳转 */
  jumpToWorldPoint(x: number, z: number) {
    let bestS = 0;
    let bestD = Infinity;
    for (const f of this.center.frames) {
      const dx = f.position.x - x;
      const dz = f.position.z - z;
      const d = dx * dx + dz * dz;
      if (d < bestD) {
        bestD = d;
        bestS = f.s;
      }
    }
    this.camera.jumpTo(bestS);
    this.chunks.jumpTo(bestS);
    this.pushState();
  }

  setMode(mode: RoamState['mode']) {
    this.camera.setMode(mode);
    this.pushState();
  }

  setGear(gear: number) {
    this.camera.speedGear = gear;
    this.state.speedGear = gear;
    this.pushState();
  }

  resetTireMarks() {
    this.tireMarks.reset();
    this.state.tireIntensity = 0;
    this.pushState();
  }

  /** 小地图折线数据(世界 XZ) */
  minimapPolyline(): Array<{ x: number; z: number }> {
    // 每 20m 取一个点即可
    const step = Math.max(1, Math.round(20 / this.center.sampleSpacing));
    const pts: Array<{ x: number; z: number }> = [];
    for (let i = 0; i < this.center.frames.length; i += step) {
      pts.push({ x: this.center.frames[i].position.x, z: this.center.frames[i].position.z });
    }
    return pts;
  }

  segmentLabelPoints(): Array<{ x: number; z: number; segment: number }> {
    const pts: Array<{ x: number; z: number; segment: number }> = [];
    for (let k = 0; k < SEGMENT_COUNT; k++) {
      const f = sampleAt(this.center, segmentStart(this.center, k));
      pts.push({ x: f.position.x, z: f.position.z, segment: k + 1 });
    }
    return pts;
  }

  /** 导出当前漫游位置与相机朝向为 JSON 文件 */
  exportPose(): { filename: string; content: string } {
    const pose = this.camera.exportPose();
    const payload = {
      tool: 'track-roam',
      exportedAt: new Date().toISOString(),
      streamRadiusMeters: STREAM_RADIUS,
      track: {
        totalLength: Math.round(this.center.totalLength * 100) / 100,
        segmentCount: SEGMENT_COUNT
      },
      camera: pose,
      chunks: this.chunks.snapshot().map((c) => ({
        id: c.id,
        state: c.state,
        lod: c.lod
      }))
    };
    return {
      filename: `track-pose-s${Math.round(pose.arcLength)}.json`,
      content: JSON.stringify(payload, null, 2)
    };
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.handleResize);
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}
