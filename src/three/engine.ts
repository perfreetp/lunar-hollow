import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  OutlineEffect,
  BlendFunction,
} from 'postprocessing';
import {
  GrabBar,
  typeNameOf,
  MIN_LEN,
  MAX_LEN,
  MIN_H,
  MAX_H,
  L_VERTICAL,
} from './bars';
import {
  buildDefaultBathroom,
  classifyImported,
  createMirror,
  disposeObject,
  type Surfaces,
  type MirrorRig,
} from './world';
import { setState } from '../state';
import type { BarSpec, BarType, LayoutFile, ViewMode } from '../types';

const UP = new THREE.Vector3(0, 1, 0);
let uid = 1;

interface WallFrame {
  normal: THREE.Vector3;
  right: THREE.Vector3;
  /** 墙面上、地面标高处的参考原点（u = 0） */
  base: THREE.Vector3;
  minU: number;
  maxU: number;
  maxH: number;
}

interface RuntimeBar extends WallFrame {
  bar: GrabBar;
  spec: BarSpec;
  wall: THREE.Mesh;
}

/**
 * 渲染与交互引擎：场景、轮廓描边后处理、拖拽放置、镜面反射预览、
 * 透明排序、标签投影、布局导入导出。
 */
export class Engine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private outlineEffect: OutlineEffect;
  private outlinePass: EffectPass;
  private raycaster = new THREE.Raycaster();

  private room: THREE.Group | null = null;
  private surfaces!: Surfaces;
  private mirror: MirrorRig;
  private overlayByWall = new Map<THREE.Mesh, THREE.Mesh>();

  private bars = new Map<string, RuntimeBar>();
  private ghost: { bar: GrabBar; frame: (WallFrame & { wall: THREE.Mesh }) | null } | null = null;
  private dragId: string | null = null;
  private selectedId: string | null = null;
  private hoveredWall: THREE.Mesh | null = null;

  private mode: ViewMode = 'normal';
  private outlineOn = true;
  private savedCam: { pos: THREE.Vector3; tgt: THREE.Vector3 } | null = null;
  private tween: {
    t: number;
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTgt: THREE.Vector3;
    toTgt: THREE.Vector3;
  } | null = null;

  private labels = new Map<string, HTMLDivElement>();
  private clock = new THREE.Clock();
  private raf = 0;

  constructor(
    private container: HTMLElement,
    private labelLayer: HTMLElement,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0xbfc9d1);
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.05,
      100,
    );
    this.camera.position.set(2.6, 2.0, 3.0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.9, 0);
    this.controls.enableDamping = true;
    this.controls.maxDistance = 9;
    this.controls.minDistance = 0.3;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x666a70, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(2, 3.5, 2);
    this.scene.add(dir);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    this.resetScene();

    this.mirror = createMirror();
    this.scene.add(this.mirror.group);

    this.composer = new EffectComposer(this.renderer, {
      multisampling: 4,
      frameBufferType: THREE.HalfFloatType,
    });
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.outlineEffect = new OutlineEffect(this.scene, this.camera, {
      blendFunction: BlendFunction.SCREEN,
      edgeStrength: 3.5,
      pulseSpeed: 0,
      visibleEdgeColor: 0xff9020,
      hiddenEdgeColor: 0x99601a,
      xRay: true,
    });
    this.outlinePass = new EffectPass(this.camera, this.outlineEffect);
    this.composer.addPass(this.outlinePass);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onWinMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);

    this.animate();
  }

  // ---------------------------------------------------------- 场景与墙面

  resetScene() {
    this.clearBars();
    if (this.room) {
      this.scene.remove(this.room);
      disposeObject(this.room);
    }
    const room = buildDefaultBathroom();
    this.room = room.group;
    this.scene.add(room.group);
    this.surfaces = room.surfaces;
    this.rebuildOverlayMap();
    setState('sceneInfo', '默认浴室场景');
  }

  async loadModel(file: File): Promise<string> {
    try {
      const buf = await file.arrayBuffer();
      const loader = new GLTFLoader();
      return await new Promise((resolve) => {
        loader.parse(
          buf,
          '',
          (gltf) => {
            this.installModel(gltf.scene, file.name);
            resolve(`已载入模型：${file.name}，识别到 ${this.surfaces.walls.length} 面墙`);
          },
          () => resolve('模型解析失败（仅支持 .glb / 内嵌资源的 .gltf）'),
        );
      });
    } catch {
      return '模型读取失败';
    }
  }

  private installModel(model: THREE.Object3D, name: string) {
    this.clearBars();
    if (this.room) {
      this.scene.remove(this.room);
      disposeObject(this.room);
    }
    const group = new THREE.Group();
    group.name = 'room';
    group.add(model);
    this.room = group;
    this.scene.add(group);
    this.surfaces = classifyImported(model);
    this.surfaces.overlays.forEach((o) => group.add(o));
    this.rebuildOverlayMap();
    // 视角对准模型
    const bbox = new THREE.Box3().setFromObject(model);
    const c = bbox.getCenter(new THREE.Vector3());
    const s = Math.max(bbox.getSize(new THREE.Vector3()).length(), 0.5);
    this.camera.position.copy(c).add(new THREE.Vector3(s * 0.45, s * 0.35, s * 0.45));
    this.controls.target.copy(c);
    setState('sceneInfo', name);
  }

  private rebuildOverlayMap() {
    this.overlayByWall.clear();
    for (const o of this.surfaces.overlays) {
      const w = o.userData.wall as THREE.Mesh | undefined;
      if (w) this.overlayByWall.set(w, o);
    }
  }

  /** 由墙面网格推导安装坐标系：法线、水平轴、u 范围、高度上限 */
  private wallFrame(mesh: THREE.Mesh, hint?: THREE.Vector3): WallFrame | null {
    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
    let axis: 'x' | 'y' | 'z' = 'x';
    for (const a of axes) if (size[a] < size[axis]) axis = a;
    if (axis === 'y') return null;
    const normal = new THREE.Vector3();
    normal[axis] = center[axis] > this.surfaces.center[axis] ? -1 : 1;
    if (hint && normal.dot(hint) < 0) normal.negate();
    const right = new THREE.Vector3().crossVectors(UP, normal);
    if (right.lengthSq() < 1e-8) return null;
    right.normalize();
    const base = center.clone().addScaledVector(normal, size[axis] / 2);
    base.y = this.surfaces.floorY;
    let minU = Infinity;
    let maxU = -Infinity;
    const corner = new THREE.Vector3();
    for (let i = 0; i < 8; i++) {
      corner.set(
        i & 1 ? bbox.max.x : bbox.min.x,
        i & 2 ? bbox.max.y : bbox.min.y,
        i & 4 ? bbox.max.z : bbox.min.z,
      );
      const u = corner.sub(base).dot(right);
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
    }
    return { normal, right, base, minU, maxU, maxH: bbox.max.y - this.surfaces.floorY };
  }

  /** 将扶手约束到墙面范围内，并按墙面坐标系放置（贴合法线、保持离地高度） */
  private clampAndPlace(rt: RuntimeBar) {
    const half = rt.spec.type === 'folding' ? 0.12 : rt.spec.length / 2 + 0.02;
    const lo = rt.minU + half;
    const hi = rt.maxU - half;
    rt.spec.u = lo > hi ? (rt.minU + rt.maxU) / 2 : THREE.MathUtils.clamp(rt.spec.u, lo, hi);
    const topExtra = rt.spec.type === 'lshape' ? L_VERTICAL + 0.05 : 0.05;
    const hMax = Math.max(MIN_H, Math.min(MAX_H, rt.maxH - topExtra));
    rt.spec.height = THREE.MathUtils.clamp(rt.spec.height, MIN_H, hMax);

    const pos = rt.base.clone().addScaledVector(rt.right, rt.spec.u);
    pos.y = this.surfaces.floorY + rt.spec.height;
    const up2 = new THREE.Vector3().crossVectors(rt.normal, rt.right);
    const m = new THREE.Matrix4().makeBasis(rt.right, up2, rt.normal);
    rt.bar.group.quaternion.setFromRotationMatrix(m);
    rt.bar.group.position.copy(pos);
    rt.spec.point = [pos.x, pos.y, pos.z];
    rt.spec.normal = [rt.normal.x, rt.normal.y, rt.normal.z];
    rt.spec.wallName = rt.wall.name;
  }

  // ---------------------------------------------------------- 拾取（含镜面反射）

  private ndc(ev: PointerEvent): THREE.Vector2 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (
      ev.clientX < rect.left ||
      ev.clientX > rect.right ||
      ev.clientY < rect.top ||
      ev.clientY > rect.bottom
    )
      return null;
    return new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  private barPickMeshes(): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    this.bars.forEach((rt) => out.push(...rt.bar.pickMeshes));
    return out;
  }

  /**
   * 取拾取射线。镜面模式下若视线首先命中镜面，
   * 返回关于镜面反射后的"镜中"射线——镜中拖动由此实现。
   */
  private pickRay(ev: PointerEvent): THREE.Ray | null {
    const n = this.ndc(ev);
    if (!n) return null;
    this.raycaster.setFromCamera(n, this.camera);
    const direct = this.raycaster.ray.clone();
    if (this.mode === 'mirror' && this.mirror.reflector.visible) {
      const targets = [this.mirror.reflector, ...this.barPickMeshes(), ...this.surfaces.walls];
      const hits = this.raycaster.intersectObjects(targets, false);
      if (hits.length && hits[0].object === this.mirror.reflector) {
        const d = direct.direction.clone().reflect(this.mirror.normal).normalize();
        return new THREE.Ray(hits[0].point.clone().addScaledVector(d, 0.001), d);
      }
    }
    return direct;
  }

  private raycast(ray: THREE.Ray, objects: THREE.Object3D[]): THREE.Intersection | null {
    this.raycaster.set(ray.origin, ray.direction);
    this.raycaster.near = 0;
    this.raycaster.far = Infinity;
    return this.raycaster.intersectObjects(objects, false)[0] ?? null;
  }

  private faceNormal(hit: THREE.Intersection, ray: THREE.Ray): THREE.Vector3 {
    const n = hit.face!.normal.clone().transformDirection(hit.object.matrixWorld);
    if (n.dot(ray.direction) > 0) n.negate();
    return n;
  }

  // ---------------------------------------------------------- 指针交互

  private onPointerDown = (ev: PointerEvent) => {
    if (ev.button !== 0 || this.ghost) return;
    const ray = this.pickRay(ev);
    if (!ray) return;
    const hit = this.raycast(ray, this.barPickMeshes());
    if (hit) {
      const id = hit.object.userData.barId as string;
      this.select(id);
      this.dragId = id;
    } else {
      this.select(null);
    }
  };

  private onWinMove = (ev: PointerEvent) => {
    if (this.ghost) {
      this.updateGhost(ev);
      return;
    }
    if (this.dragId) {
      this.updateDrag(ev);
      return;
    }
    this.updateHover(ev);
  };

  private onPointerUp = () => {
    if (this.ghost) this.commitGhost();
    if (this.dragId) {
      this.dragId = null;
      this.syncStore();
    }
  };

  private onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') this.cancelGhost();
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && this.selectedId)
      this.deleteBar(this.selectedId);
  };

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  };

  private updateHover(ev: PointerEvent) {
    const ray = this.pickRay(ev);
    const wall = ray
      ? ((this.raycast(ray, this.surfaces.walls)?.object as THREE.Mesh) ?? null)
      : null;
    if (wall === this.hoveredWall) return;
    this.setOverlayOpacity(this.hoveredWall, 0.07);
    this.hoveredWall = wall;
    this.setOverlayOpacity(wall, 0.22);
    this.renderer.domElement.style.cursor = wall ? 'pointer' : 'default';
  }

  private setOverlayOpacity(wall: THREE.Mesh | null, opacity: number) {
    if (!wall) return;
    const ov = this.overlayByWall.get(wall);
    if (ov) (ov.material as THREE.MeshBasicMaterial).opacity = opacity;
  }

  // ---------------------------------------------------------- 拖拽放置

  /** 从扶手库开始拖出指定类型（绿色预览跟随光标，松开落墙） */
  beginPaletteDrag(type: BarType) {
    this.cancelGhost();
    const spec: BarSpec = {
      id: '__ghost__',
      type,
      wallName: '',
      point: [0, 0, 0],
      normal: [0, 0, 1],
      u: 0,
      height: 0.8,
      length: type === 'folding' ? 0.7 : 0.8,
      foldAngle: 0,
    };
    const bar = new GrabBar(spec, true);
    bar.group.visible = false;
    this.scene.add(bar.group);
    this.ghost = { bar, frame: null };
  }

  private updateGhost(ev: PointerEvent) {
    const g = this.ghost!;
    const ray = this.pickRay(ev);
    const hit = ray ? this.raycast(ray, this.surfaces.walls) : null;
    if (!hit) {
      g.bar.group.visible = false;
      g.frame = null;
      return;
    }
    const wall = hit.object as THREE.Mesh;
    const frame = this.wallFrame(wall, this.faceNormal(hit, ray!));
    if (!frame) {
      g.bar.group.visible = false;
      g.frame = null;
      return;
    }
    g.frame = { ...frame, wall };
    g.bar.spec.u = hit.point.clone().sub(frame.base).dot(frame.right);
    g.bar.spec.height = hit.point.y - this.surfaces.floorY;
    this.clampAndPlace({ bar: g.bar, spec: g.bar.spec, wall, ...frame });
    g.bar.group.visible = true;
  }

  private commitGhost() {
    const g = this.ghost!;
    this.ghost = null;
    g.bar.group.removeFromParent();
    if (!g.frame) {
      g.bar.dispose();
      return;
    }
    const spec: BarSpec = { ...g.bar.spec, id: `bar-${uid++}` };
    const bar = new GrabBar(spec);
    const rt: RuntimeBar = { bar, spec, ...g.frame };
    this.clampAndPlace(rt);
    this.bars.set(spec.id, rt);
    this.scene.add(bar.group);
    g.bar.dispose();
    this.updateOutlineSelection();
    this.select(spec.id);
    this.bumpSpec();
    this.syncStore();
  }

  private cancelGhost() {
    if (!this.ghost) return;
    this.ghost.bar.dispose();
    this.ghost = null;
  }

  /** 拖动已放置扶手：沿其墙面滑动，水平位置与离地高度同步更新 */
  private updateDrag(ev: PointerEvent) {
    const rt = this.bars.get(this.dragId!);
    if (!rt) return;
    const ray = this.pickRay(ev);
    if (!ray) return;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(rt.normal, rt.base);
    const pt = new THREE.Vector3();
    if (!ray.intersectPlane(plane, pt)) return;
    rt.spec.u = pt.clone().sub(rt.base).dot(rt.right);
    rt.spec.height = pt.y - this.surfaces.floorY;
    this.clampAndPlace(rt);
    this.bumpSpec();
  }

  // ---------------------------------------------------------- 扶手操作

  updateBarSpec(id: string, partial: { length?: number; height?: number; foldAngle?: number }) {
    const rt = this.bars.get(id);
    if (!rt) return;
    if (partial.length !== undefined) {
      rt.spec.length = THREE.MathUtils.clamp(partial.length, MIN_LEN, MAX_LEN);
      rt.bar.setLength(rt.spec.length);
    }
    if (partial.height !== undefined) rt.spec.height = partial.height;
    if (partial.foldAngle !== undefined) {
      rt.spec.foldAngle = THREE.MathUtils.clamp(partial.foldAngle, 0, 90);
      rt.bar.setFoldAngle(rt.spec.foldAngle);
    }
    this.clampAndPlace(rt);
    this.bumpSpec();
    this.syncStore();
  }

  /** L 型水平镜像（重建网格，保持墙面坐标不变） */
  flipBar(id: string) {
    const rt = this.bars.get(id);
    if (!rt || rt.spec.type !== 'lshape') return;
    rt.spec.flipped = !rt.spec.flipped;
    const bar = new GrabBar(rt.spec);
    this.scene.add(bar.group);
    rt.bar.dispose();
    rt.bar = bar;
    this.clampAndPlace(rt);
    bar.setSelected(this.selectedId === id);
    this.updateOutlineSelection();
    this.bumpSpec();
    this.syncStore();
  }

  deleteBar(id: string) {
    const rt = this.bars.get(id);
    if (!rt) return;
    rt.bar.dispose();
    this.bars.delete(id);
    this.labels.get(id)?.remove();
    this.labels.delete(id);
    if (this.selectedId === id) this.select(null);
    this.updateOutlineSelection();
    this.syncStore();
  }

  clearBars() {
    this.bars.forEach((rt, id) => {
      rt.bar.dispose();
      this.labels.get(id)?.remove();
    });
    this.labels.clear();
    this.bars.clear();
    this.select(null);
    this.updateOutlineSelection();
    this.syncStore();
  }

  select(id: string | null) {
    if (this.selectedId === id) return;
    if (this.selectedId) this.bars.get(this.selectedId)?.bar.setSelected(false);
    this.selectedId = id;
    if (id) this.bars.get(id)?.bar.setSelected(true);
    setState('selectedId', id);
  }

  getSpec(id: string): BarSpec | null {
    const rt = this.bars.get(id);
    return rt ? { ...rt.spec } : null;
  }

  // ---------------------------------------------------------- 视图模式

  setMode(mode: ViewMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    setState('mode', mode);
    this.mirror.reflector.visible = mode === 'mirror';
    this.mirror.glass.visible = mode !== 'mirror';
    if (mode === 'mirror') {
      this.savedCam = {
        pos: this.camera.position.clone(),
        tgt: this.controls.target.clone(),
      };
      this.startTween(new THREE.Vector3(0.1, 1.5, 0.5), this.mirror.center.clone());
    } else if (this.savedCam) {
      this.startTween(this.savedCam.pos.clone(), this.savedCam.tgt.clone());
      this.savedCam = null;
    }
  }

  setOutline(on: boolean) {
    this.outlineOn = on;
    this.outlinePass.enabled = on;
    setState('outline', on);
  }

  private startTween(toPos: THREE.Vector3, toTgt: THREE.Vector3) {
    this.tween = {
      t: 0,
      fromPos: this.camera.position.clone(),
      fromTgt: this.controls.target.clone(),
      toPos,
      toTgt,
    };
  }

  // ---------------------------------------------------------- 导入 / 导出

  exportJSON(): string {
    const data: LayoutFile = {
      app: 'grabbar-planner',
      version: 1,
      camera: {
        position: this.camera.position.toArray(),
        target: this.controls.target.toArray(),
      },
      mode: this.mode,
      outline: this.outlineOn,
      bars: [...this.bars.values()].map((rt) => ({ ...rt.spec })),
    };
    return JSON.stringify(data, null, 2);
  }

  importJSON(text: string): { ok: boolean; message: string } {
    let data: LayoutFile;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, message: '文件不是有效的 JSON' };
    }
    if (!data || data.app !== 'grabbar-planner' || !Array.isArray(data.bars))
      return { ok: false, message: '文件格式不正确' };
    this.clearBars();
    let dropped = 0;
    for (const raw of data.bars) {
      const spec: BarSpec = { ...raw, id: raw.id || `bar-${uid++}` };
      const rt = this.relocate(spec);
      if (!rt) {
        dropped++;
        continue;
      }
      this.bars.set(spec.id, rt);
      this.scene.add(rt.bar.group);
    }
    // 还原视角与模式
    if (Array.isArray(data.camera?.position) && Array.isArray(data.camera?.target)) {
      this.camera.position.fromArray(data.camera.position);
      this.controls.target.fromArray(data.camera.target);
    }
    this.mode = data.mode === 'mirror' ? 'mirror' : 'normal';
    setState('mode', this.mode);
    this.mirror.reflector.visible = this.mode === 'mirror';
    this.mirror.glass.visible = this.mode !== 'mirror';
    this.setOutline(data.outline !== false);
    this.updateOutlineSelection();
    this.bumpSpec();
    this.syncStore();
    return {
      ok: true,
      message: dropped ? `已还原布置与视角，${dropped} 根扶手未找到墙面被跳过` : '已还原相同视角与布置',
    };
  }

  /** 导入时按墙面名或"贴合点 + 法线"反查墙面网格 */
  private relocate(spec: BarSpec): RuntimeBar | null {
    let wall = this.surfaces.walls.find((w) => w.name === spec.wallName) ?? null;
    const hint =
      Array.isArray(spec.normal) && spec.normal.length === 3
        ? new THREE.Vector3(...spec.normal)
        : undefined;
    if (!wall && Array.isArray(spec.point) && hint) {
      const origin = new THREE.Vector3(...spec.point).addScaledVector(hint, 0.5);
      this.raycaster.set(origin, hint.clone().negate());
      const hit = this.raycaster.intersectObjects(this.surfaces.walls, false)[0];
      if (hit) wall = hit.object as THREE.Mesh;
    }
    if (!wall) return null;
    const frame = this.wallFrame(wall, hint);
    if (!frame) return null;
    const bar = new GrabBar(spec);
    const rt: RuntimeBar = { bar, spec, wall, ...frame };
    this.clampAndPlace(rt);
    return rt;
  }

  // ---------------------------------------------------------- 渲染循环

  private updateOutlineSelection() {
    // 构造函数中 resetScene 先于 outlineEffect 创建，需判空
    if (!this.outlineEffect) return;
    this.outlineEffect.selection.set(
      [...this.bars.values()].map((rt) => rt.bar.group),
    );
  }

  /** 半透明扶手按离相机距离远→近赋 renderOrder，交叠处绘制顺序稳定、不闪烁 */
  private sortTransparent() {
    const cam = this.camera.position;
    const arr = [...this.bars.values()].map((rt) => ({
      rt,
      d: rt.bar.group.position.distanceToSquared(cam),
    }));
    arr.sort((a, b) => b.d - a.d);
    arr.forEach(({ rt }, i) => {
      rt.bar.group.traverse((o) => {
        o.renderOrder = i;
      });
    });
    if (this.ghost)
      this.ghost.bar.group.traverse((o) => {
        o.renderOrder = 999;
      });
  }

  private updateLabels() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const v = new THREE.Vector3();
    this.bars.forEach((rt, id) => {
      let div = this.labels.get(id);
      if (!div) {
        div = document.createElement('div');
        div.className = 'bar-label';
        this.labelLayer.appendChild(div);
        this.labels.set(id, div);
      }
      v.copy(rt.bar.group.position).addScaledVector(rt.normal, 0.12);
      v.y += 0.1;
      v.project(this.camera);
      if (v.z > 1 || v.z < -1) {
        div.style.display = 'none';
        return;
      }
      div.style.display = 'block';
      div.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
      div.style.top = `${(-v.y * 0.5 + 0.5) * h}px`;
      const txt = `${typeNameOf(rt.spec.type)} · 长度 ${(rt.spec.length * 100).toFixed(0)}cm · 离地 ${(rt.spec.height * 100).toFixed(0)}cm`;
      if (div.textContent !== txt) div.textContent = txt;
    });
  }

  private animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.tween) {
      const tw = this.tween;
      tw.t += dt / 0.8;
      const k = THREE.MathUtils.smoothstep(Math.min(tw.t, 1), 0, 1);
      this.camera.position.lerpVectors(tw.fromPos, tw.toPos, k);
      this.controls.target.lerpVectors(tw.fromTgt, tw.toTgt, k);
      if (tw.t >= 1) this.tween = null;
    }
    this.controls.enabled = !this.tween && !this.dragId && !this.ghost;
    this.controls.update();
    this.sortTransparent();
    this.composer.render();
    this.updateLabels();
  };

  private bumpSpec() {
    setState('specVersion', (v) => v + 1);
  }

  private syncStore() {
    setState('bars', [...this.bars.values()].map((rt) => ({ ...rt.spec })));
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onWinMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);
    this.clearBars();
    this.controls.dispose();
    this.renderer.dispose();
    dom.remove();
  }
}
