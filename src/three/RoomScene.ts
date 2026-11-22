import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { EnvMode, FloorPlan, Lamp, LampType, Vec3 } from '../types';
import {
  ambientFor,
  CCTS,
  cctColor,
  ensureCCW,
  heatColor,
  heatT,
  illuminanceAt,
  LAMP_SPECS,
  LOW_E_THRESHOLD,
  planBBox,
  pointInPolygon,
} from '../photometry';

export interface SceneCallbacks {
  onLampPlace: (type: LampType, pos: Vec3, normal: Vec3) => void;
  onLampMove: (id: string, pos: Vec3, normal: Vec3) => void;
  onLampSelect: (id: string | null) => void;
  onPick: (point: Vec3, normal: Vec3) => void;
  onView: (eye: Vec3, dir: Vec3) => void;
}

interface WallRec {
  mesh: THREE.Mesh;
  heatMesh: THREE.Mesh;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  ax: number;
  az: number;
  dirx: number;
  dirz: number;
  nx: number;
  nz: number;
  len: number;
  openings: { u0: number; v0: number; u1: number; v1: number }[];
}

/* 热力图分辨率：拖动中用粗网格保证 40+ 灯具流畅，松手后细网格精算 */
const FLOOR_FINE = 200;
const FLOOR_COARSE = 64;
const WALL_FINE_W = 128;
const WALL_FINE_H = 56;
const WALL_COARSE_W = 48;
const WALL_COARSE_H = 20;

/* 透明对象渲染顺序：热力叠加层 → 玻璃隔断/窗玻璃 → 半透明灯罩，均关闭深度写入，避免穿透 */
const ORDER_HEAT = 1;
const ORDER_GLASS = 2;
const ORDER_SHADE = 3;

/* 共享几何体与材质（40+ 灯具时不随数量增长） */
const GEO = {
  ceilShade: new THREE.CylinderGeometry(0.26, 0.3, 0.1, 24),
  ceilEmitter: new THREE.CircleGeometry(0.23, 24),
  wallBase: new THREE.BoxGeometry(0.1, 0.24, 0.04),
  wallShade: new THREE.SphereGeometry(0.11, 20, 12, 0, Math.PI),
  wallEmitter: new THREE.CircleGeometry(0.085, 20),
  nightBase: new THREE.CylinderGeometry(0.05, 0.06, 0.03, 16),
  nightShade: new THREE.SphereGeometry(0.06, 16, 12),
  nightEmitter: new THREE.SphereGeometry(0.032, 12, 8),
};
const SHADE_MAT = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.38,
  roughness: 0.35,
  metalness: 0,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const BASE_MAT = new THREE.MeshStandardMaterial({ color: 0x8a8f98, roughness: 0.6, metalness: 0.4 });

const Z_AXIS = new THREE.Vector3(0, 0, 1);

export class RoomScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private container: HTMLElement;
  private cb: SceneCallbacks;
  private resizeObs: ResizeObserver;

  private roomGroup = new THREE.Group();
  private lampGroup = new THREE.Group();
  private pathGroup = new THREE.Group();

  private plan: FloorPlan | null = null;
  private outline: [number, number][] = [];
  private bbox = { minX: 0, minZ: 0, w: 1, h: 1 };
  private walls: WallRec[] = [];
  private floorMesh: THREE.Mesh | null = null;
  private ceilingMesh: THREE.Mesh | null = null;
  private floorHeat: {
    mesh: THREE.Mesh;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    texture: THREE.CanvasTexture;
  } | null = null;

  private lampData: Lamp[] = [];
  private lampMeshes = new Map<string, THREE.Group>();
  private mode: EnvMode = 'day';
  private placing: LampType | null = null;
  private selectedId: string | null = null;
  private draggingId: string | null = null;
  private downPos = { x: 0, y: 0 };
  private heatPending: 'coarse' | 'fine' | null = null;
  private disposed = false;
  private lastViewEmit = 0;

  private hemi = new THREE.HemisphereLight(0xffffff, 0x8a7f70, 0.9);
  private sun = new THREE.DirectionalLight(0xfff2dd, 1.6);
  private amb = new THREE.AmbientLight(0xffffff, 0.35);

  private pickMarker: THREE.Mesh;
  private selectionMark: THREE.Mesh;

  constructor(container: HTMLElement, cb: SceneCallbacks) {
    this.container = container;
    this.cb = cb;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      200,
    );
    this.camera.position.set(8, 7, 9);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.maxDistance = 40;
    this.controls.addEventListener('change', () => this.emitViewThrottled());

    this.sun.position.set(6, 8, -4);
    this.scene.add(this.hemi, this.sun, this.amb);
    this.scene.add(this.roomGroup, this.lampGroup, this.pathGroup);
    this.scene.background = new THREE.Color(0xaebfd0);

    this.pickMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xff3b30, depthTest: false }),
    );
    this.pickMarker.renderOrder = 10;
    this.pickMarker.visible = false;
    this.scene.add(this.pickMarker);

    this.selectionMark = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0x2d9cdb, wireframe: true, transparent: true, opacity: 0.7 }),
    );
    this.selectionMark.visible = false;
    this.scene.add(this.selectionMark);

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);

    this.resizeObs = new ResizeObserver(() => this.onResize());
    this.resizeObs.observe(container);

    this.animate();
  }

  dispose() {
    this.disposed = true;
    this.resizeObs.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
    this.controls.dispose();
    this.clearGroup(this.roomGroup);
    this.clearGroup(this.lampGroup);
    this.clearGroup(this.pathGroup);
    this.renderer.dispose();
    el.parentElement?.removeChild(el);
  }

  /* ------------------------------- 户型构建 ------------------------------- */

  setFloorPlan(plan: FloorPlan) {
    this.plan = plan;
    this.outline = ensureCCW(plan.outline);
    this.bbox = planBBox(this.outline);
    this.walls = [];
    this.floorHeat = null;
    this.clearGroup(this.roomGroup);

    const H = plan.height;
    const o = this.outline;
    const n = o.length;

    // 地面（FrontSide 朝上，外部俯视可见）
    const floorShape = new THREE.Shape(o.map(([x, z]) => new THREE.Vector2(x, -z)));
    const floorGeo = new THREE.ShapeGeometry(floorShape);
    floorGeo.rotateX(-Math.PI / 2);
    this.floorMesh = new THREE.Mesh(
      floorGeo,
      new THREE.MeshStandardMaterial({ color: 0xd9cfbe, roughness: 0.9 }),
    );
    this.roomGroup.add(this.floorMesh);

    // 顶棚（FrontSide 朝下，从外部看自动隐藏，形成剖视效果）
    const ceilShape = new THREE.Shape(o.map(([x, z]) => new THREE.Vector2(x, z)));
    const ceilGeo = new THREE.ShapeGeometry(ceilShape);
    ceilGeo.rotateX(Math.PI / 2);
    this.ceilingMesh = new THREE.Mesh(
      ceilGeo,
      new THREE.MeshStandardMaterial({ color: 0xf5f2ec, roughness: 0.95 }),
    );
    this.ceilingMesh.position.y = H;
    this.roomGroup.add(this.ceilingMesh);

    // 地面热力叠加层（UV 按包围盒归一）
    const heatGeo = floorGeo.clone();
    this.setBboxUV(heatGeo);
    const fCanvas = document.createElement('canvas');
    const fCtx = fCanvas.getContext('2d')!;
    const fTex = new THREE.CanvasTexture(fCanvas);
    fTex.colorSpace = THREE.SRGBColorSpace;
    const heatMesh = new THREE.Mesh(
      heatGeo,
      new THREE.MeshBasicMaterial({
        map: fTex,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
    );
    heatMesh.position.y = 0.02;
    heatMesh.renderOrder = ORDER_HEAT;
    this.roomGroup.add(heatMesh);
    this.floorHeat = { mesh: heatMesh, canvas: fCanvas, ctx: fCtx, texture: fTex };

    // 墙体（带门窗洞）
    for (let i = 0; i < n; i++) {
      this.buildWall(i, o[i], o[(i + 1) % n], H);
    }

    // 玻璃隔断
    for (const gp of plan.glassPartitions ?? []) {
      const dx = gp.to[0] - gp.from[0];
      const dz = gp.to[1] - gp.from[1];
      const len = Math.hypot(dx, dz);
      if (len < 0.05) continue;
      const h = gp.height ?? 2.2;
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(len, h),
        new THREE.MeshPhysicalMaterial({
          color: 0xcfe8ef,
          transparent: true,
          opacity: 0.22,
          roughness: 0.1,
          metalness: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      glass.renderOrder = ORDER_GLASS;
      glass.position.set((gp.from[0] + gp.to[0]) / 2, h / 2, (gp.from[1] + gp.to[1]) / 2);
      glass.rotation.y = -Math.atan2(dz, dx);
      this.roomGroup.add(glass);
    }

    // 视角对准户型中心
    const cx = this.bbox.minX + this.bbox.w / 2;
    const cz = this.bbox.minZ + this.bbox.h / 2;
    this.controls.target.set(cx, 0.8, cz);
    const r = Math.max(this.bbox.w, this.bbox.h);
    this.camera.position.set(cx + r * 0.9, r * 1.05, cz + r * 1.1);
    this.controls.update();
    this.emitViewThrottled();

    this.rebuildNightPath();
    this.scheduleHeatmap('fine');
  }

  private buildWall(i: number, a: [number, number], b: [number, number], H: number) {
    const plan = this.plan!;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) return;
    const dirx = dx / len;
    const dirz = dz / len;
    // CCW 轮廓：内法线 = 方向左转 90°
    const nx = -dirz;
    const nz = dirx;

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(len, 0);
    shape.lineTo(len, H);
    shape.lineTo(0, H);
    shape.closePath();

    const openings: WallRec['openings'] = [];
    for (const d of plan.doors) {
      if (d.wall !== i) continue;
      const dh = d.height ?? 2.1;
      openings.push({ u0: d.offset, v0: 0, u1: d.offset + d.width, v1: dh });
    }
    for (const w of plan.windows) {
      if (w.wall !== i) continue;
      openings.push({ u0: w.offset, v0: w.sill, u1: w.offset + w.width, v1: w.sill + w.height });
    }
    for (const op of openings) {
      const hole = new THREE.Path();
      hole.moveTo(op.u0, op.v0);
      hole.lineTo(op.u1, op.v0);
      hole.lineTo(op.u1, op.v1);
      hole.lineTo(op.u0, op.v1);
      hole.closePath();
      shape.holes.push(hole);
    }

    const geo = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0xf0eae0, roughness: 0.92, side: THREE.DoubleSide }),
    );
    mesh.position.set(a[0], 0, a[1]);
    mesh.rotation.y = -Math.atan2(dirz, dirx);
    mesh.userData.wallIndex = this.walls.length;
    this.roomGroup.add(mesh);

    // 窗玻璃
    for (const w of plan.windows) {
      if (w.wall !== i) continue;
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(w.width, w.height),
        new THREE.MeshPhysicalMaterial({
          color: 0xd8ecf5,
          transparent: true,
          opacity: 0.18,
          roughness: 0.05,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      glass.renderOrder = ORDER_GLASS;
      glass.position.set(
        a[0] + dirx * (w.offset + w.width / 2),
        w.sill + w.height / 2,
        a[1] + dirz * (w.offset + w.width / 2),
      );
      glass.rotation.y = -Math.atan2(dirz, dirx);
      this.roomGroup.add(glass);
    }

    // 墙面热力叠加层
    const heatGeo = new THREE.PlaneGeometry(len, H);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const heatMesh = new THREE.Mesh(
      heatGeo,
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    heatMesh.renderOrder = ORDER_HEAT;
    heatMesh.position.set(a[0] + dirx * (len / 2) + nx * 0.02, H / 2, a[1] + dirz * (len / 2) + nz * 0.02);
    heatMesh.rotation.y = -Math.atan2(dirz, dirx);
    this.roomGroup.add(heatMesh);

    this.walls.push({ mesh, heatMesh, canvas, ctx, texture, ax: a[0], az: a[1], dirx, dirz, nx, nz, len, openings });
  }

  private setBboxUV(geo: THREE.BufferGeometry) {
    const pos = geo.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) - this.bbox.minX) / this.bbox.w;
      uv[i * 2 + 1] = (pos.getZ(i) - this.bbox.minZ) / this.bbox.h;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }

  /* ------------------------------- 灯具管理 ------------------------------- */

  syncLamps(lamps: Lamp[]) {
    this.lampData = lamps;
    const seen = new Set<string>();
    for (const lamp of lamps) {
      seen.add(lamp.id);
      let g = this.lampMeshes.get(lamp.id);
      if (!g) {
        g = this.createLampGroup(lamp);
        this.lampMeshes.set(lamp.id, g);
        this.lampGroup.add(g);
      }
      this.updateLampVisual(g, lamp);
    }
    for (const [id, g] of this.lampMeshes) {
      if (!seen.has(id)) {
        (g.userData.emitter as THREE.Material | undefined)?.dispose();
        this.lampGroup.remove(g);
        this.lampMeshes.delete(id);
      }
    }
    this.rebuildNightPath();
    this.updateSelectionMark();
    this.scheduleHeatmap('fine');
  }

  private createLampGroup(lamp: Lamp): THREE.Group {
    const g = new THREE.Group();
    const emitterMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    if (lamp.type === 'ceiling') {
      const shade = new THREE.Mesh(GEO.ceilShade, SHADE_MAT);
      shade.position.y = -0.06;
      shade.renderOrder = ORDER_SHADE;
      const emitter = new THREE.Mesh(GEO.ceilEmitter, emitterMat);
      emitter.rotation.x = Math.PI / 2;
      emitter.position.y = -0.115;
      g.add(shade, emitter);
    } else if (lamp.type === 'wall') {
      const base = new THREE.Mesh(GEO.wallBase, BASE_MAT);
      base.position.z = 0.02;
      const shade = new THREE.Mesh(GEO.wallShade, SHADE_MAT);
      shade.position.z = 0.05;
      shade.renderOrder = ORDER_SHADE;
      const emitter = new THREE.Mesh(GEO.wallEmitter, emitterMat);
      emitter.position.z = 0.1;
      g.add(base, shade, emitter);
    } else {
      const base = new THREE.Mesh(GEO.nightBase, BASE_MAT);
      base.position.y = 0.015;
      const shade = new THREE.Mesh(GEO.nightShade, SHADE_MAT);
      shade.position.y = 0.06;
      shade.renderOrder = ORDER_SHADE;
      const emitter = new THREE.Mesh(GEO.nightEmitter, emitterMat);
      emitter.position.y = 0.06;
      g.add(base, shade, emitter);
    }
    g.userData.lampId = lamp.id;
    g.userData.emitter = emitterMat;
    g.traverse((o) => (o.userData.lampId = lamp.id));
    return g;
  }

  private updateLampVisual(g: THREE.Group, lamp: Lamp) {
    const emitter = g.userData.emitter as THREE.MeshBasicMaterial;
    // 夜间模式下夜灯发光增强，突出路径照明
    const boost = this.mode === 'night' && lamp.type === 'night' ? 1.8 : 1;
    const k = (0.55 + 0.6 * lamp.powerIndex) * boost;
    emitter.color.set(cctColor(CCTS[lamp.cctIndex] ?? 4000)).multiplyScalar(k);
    g.position.set(lamp.position[0], lamp.position[1], lamp.position[2]);
    if (lamp.type === 'wall') {
      const n = new THREE.Vector3(lamp.normal[0], lamp.normal[1], lamp.normal[2]);
      if (n.lengthSq() > 1e-6) g.quaternion.setFromUnitVectors(Z_AXIS, n.normalize());
    }
  }

  setSelected(id: string | null) {
    this.selectedId = id;
    this.updateSelectionMark();
  }

  private updateSelectionMark() {
    const lamp = this.lampData.find((l) => l.id === this.selectedId);
    if (lamp) {
      this.selectionMark.position.set(lamp.position[0], lamp.position[1], lamp.position[2]);
      this.selectionMark.visible = true;
    } else {
      this.selectionMark.visible = false;
    }
  }

  /** 夜灯路径：从离门最近的夜灯出发最近邻串联，并延伸到门口 */
  private rebuildNightPath() {
    this.clearGroup(this.pathGroup);
    if (!this.plan) return;
    const nights = this.lampData.filter((l) => l.type === 'night');
    if (nights.length === 0) return;

    const doorPts: THREE.Vector3[] = [];
    for (const d of this.plan.doors) {
      const w = this.walls[d.wall];
      if (!w) continue;
      const u = d.offset + d.width / 2;
      doorPts.push(new THREE.Vector3(w.ax + w.dirx * u + w.nx * 0.35, 0.06, w.az + w.dirz * u + w.nz * 0.35));
    }

    const remaining = nights.slice();
    const dist2 = (l: Lamp, p: THREE.Vector3) => {
      const dx = l.position[0] - p.x;
      const dz = l.position[2] - p.z;
      return dx * dx + dz * dz;
    };
    let start = remaining[0];
    if (doorPts.length > 0) {
      let best = Infinity;
      for (const l of remaining) {
        for (const dp of doorPts) {
          const d = dist2(l, dp);
          if (d < best) {
            best = d;
            start = l;
          }
        }
      }
    }
    const chain: THREE.Vector3[] = [];
    if (doorPts.length > 0) {
      let bestD = Infinity;
      let bestP = doorPts[0];
      for (const dp of doorPts) {
        const d = dist2(start, dp);
        if (d < bestD) {
          bestD = d;
          bestP = dp;
        }
      }
      chain.push(bestP);
    }
    let cur = start;
    remaining.splice(remaining.indexOf(cur), 1);
    chain.push(new THREE.Vector3(cur.position[0], 0.06, cur.position[2]));
    while (remaining.length > 0) {
      let best = Infinity;
      let next = remaining[0];
      const cp = chain[chain.length - 1];
      for (const l of remaining) {
        const d = dist2(l, cp);
        if (d < best) {
          best = d;
          next = l;
        }
      }
      chain.push(new THREE.Vector3(next.position[0], 0.06, next.position[2]));
      remaining.splice(remaining.indexOf(next), 1);
    }

    if (chain.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(chain, false, 'catmullrom', 0.1);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 64, 0.025, 6),
        new THREE.MeshBasicMaterial({
          color: 0xffc46b,
          transparent: true,
          opacity: this.mode === 'night' ? 0.95 : 0.3,
          depthWrite: false,
        }),
      );
      tube.renderOrder = ORDER_HEAT + 1;
      this.pathGroup.add(tube);
    }
    for (const p of chain) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 10, 8),
        new THREE.MeshBasicMaterial({
          color: 0xffd9a0,
          transparent: true,
          opacity: this.mode === 'night' ? 1 : 0.4,
          depthWrite: false,
        }),
      );
      dot.position.copy(p);
      dot.renderOrder = ORDER_HEAT + 1;
      this.pathGroup.add(dot);
    }
  }

  /* ------------------------------- 环境预设 ------------------------------- */

  setMode(mode: EnvMode) {
    this.mode = mode;
    if (mode === 'day') {
      this.scene.background = new THREE.Color(0xaebfd0);
      this.hemi.intensity = 0.9;
      this.amb.intensity = 0.35;
      this.sun.intensity = 1.6;
      this.sun.visible = true;
    } else {
      this.scene.background = new THREE.Color(0x0c1220);
      this.hemi.intensity = 0.12;
      this.amb.intensity = 0.06;
      this.sun.visible = false;
    }
    // 夜灯发光增强 + 路径突出
    for (const lamp of this.lampData) {
      const g = this.lampMeshes.get(lamp.id);
      if (g) this.updateLampVisual(g, lamp);
    }
    this.rebuildNightPath();
    this.scheduleHeatmap('fine');
  }

  setPlacing(type: LampType | null) {
    this.placing = type;
    this.renderer.domElement.style.cursor = type ? 'crosshair' : '';
  }

  /* ------------------------------- 交互 ------------------------------- */

  private setPointer(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
  }

  private raycastLamps(e: PointerEvent): string | null {
    this.setPointer(e);
    const hits = this.raycaster.intersectObjects(this.lampGroup.children, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o) {
        if (o.userData.lampId) return o.userData.lampId as string;
        o = o.parent;
      }
    }
    return null;
  }

  private raycastWalls(e: PointerEvent): { point: THREE.Vector3; wall: WallRec } | null {
    this.setPointer(e);
    const meshes = this.walls.map((w) => w.mesh);
    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return null;
    const hit = hits[0];
    const wall = this.walls[hit.object.userData.wallIndex as number];
    return { point: hit.point, wall };
  }

  private floorPoint(e: PointerEvent): THREE.Vector3 | null {
    this.setPointer(e);
    const p = new THREE.Vector3();
    const ok = this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p);
    return ok ? p : null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.downPos = { x: e.clientX, y: e.clientY };
    if (this.placing) return;
    const id = this.raycastLamps(e);
    if (id) {
      this.draggingId = id;
      this.controls.enabled = false;
      // 捕获指针，拖出画布也能继续接收 move/up
      this.renderer.domElement.setPointerCapture(e.pointerId);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.draggingId) return;
    const lamp = this.lampData.find((l) => l.id === this.draggingId);
    if (!lamp || !this.plan) return;

    if (lamp.type === 'wall') {
      const hit = this.raycastWalls(e);
      if (!hit) return;
      const { point, wall } = hit;
      let u = (point.x - wall.ax) * wall.dirx + (point.z - wall.az) * wall.dirz;
      u = Math.min(Math.max(u, 0.15), wall.len - 0.15);
      const y = Math.min(Math.max(point.y, 0.4), this.plan.height - 0.2);
      lamp.position = [wall.ax + wall.dirx * u + wall.nx * 0.08, y, wall.az + wall.dirz * u + wall.nz * 0.08];
      lamp.normal = [wall.nx, 0, wall.nz];
    } else {
      const p = this.floorPoint(e);
      if (!p || !pointInPolygon(p.x, p.z, this.outline)) return;
      const y = lamp.type === 'ceiling' ? this.plan.height - 0.06 : 0.28;
      lamp.position = [p.x, y, p.z];
    }
    const g = this.lampMeshes.get(lamp.id);
    if (g) this.updateLampVisual(g, lamp);
    this.updateSelectionMark();
    this.scheduleHeatmap('coarse');
  };

  private onPointerUp = (e: PointerEvent) => {
    const moved = Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y);
    if (this.draggingId) {
      const id = this.draggingId;
      this.draggingId = null;
      this.controls.enabled = true;
      const lamp = this.lampData.find((l) => l.id === id);
      if (lamp) this.cb.onLampMove(id, [...lamp.position] as Vec3, [...lamp.normal] as Vec3);
      this.scheduleHeatmap('fine');
      return;
    }
    if (e.button !== 0 || moved > 5) return;

    if (this.placing) {
      this.placeLamp(e, this.placing);
      return;
    }
    const lampId = this.raycastLamps(e);
    if (lampId) {
      this.cb.onLampSelect(lampId);
      return;
    }
    this.cb.onLampSelect(null);
    // 点击表面读取照度
    this.setPointer(e);
    const surfaces: THREE.Object3D[] = [];
    if (this.floorMesh) surfaces.push(this.floorMesh);
    if (this.ceilingMesh) surfaces.push(this.ceilingMesh);
    for (const w of this.walls) surfaces.push(w.mesh);
    const hits = this.raycaster.intersectObjects(surfaces, false);
    if (hits.length > 0) {
      const hit = hits[0];
      const n = hit.face
        ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        : new THREE.Vector3(0, 1, 0);
      this.pickMarker.position.copy(hit.point).addScaledVector(n, 0.04);
      this.pickMarker.visible = true;
      this.cb.onPick(
        [hit.point.x, hit.point.y, hit.point.z],
        [n.x, n.y, n.z],
      );
    }
  };

  private placeLamp(e: PointerEvent, type: LampType) {
    if (!this.plan) return;
    if (type === 'wall') {
      const hit = this.raycastWalls(e);
      if (!hit) return;
      const { point, wall } = hit;
      let u = (point.x - wall.ax) * wall.dirx + (point.z - wall.az) * wall.dirz;
      u = Math.min(Math.max(u, 0.15), wall.len - 0.15);
      const y = Math.min(Math.max(point.y, 0.4), this.plan.height - 0.2);
      this.cb.onLampPlace(
        'wall',
        [wall.ax + wall.dirx * u + wall.nx * 0.08, y, wall.az + wall.dirz * u + wall.nz * 0.08],
        [wall.nx, 0, wall.nz],
      );
    } else {
      const p = this.floorPoint(e);
      if (!p || !pointInPolygon(p.x, p.z, this.outline)) return;
      const y = type === 'ceiling' ? this.plan.height - 0.06 : 0.28;
      this.cb.onLampPlace(type, [p.x, y, p.z], type === 'ceiling' ? [0, -1, 0] : [0, 1, 0]);
    }
  }

  /* ------------------------------- 热力图 ------------------------------- */

  private scheduleHeatmap(quality: 'coarse' | 'fine') {
    if (this.heatPending === 'fine') return;
    this.heatPending = quality;
  }

  private computeHeatmaps(coarse: boolean) {
    if (!this.plan) return;
    const ambient = ambientFor(this.mode);
    this.computeFloorHeat(coarse, ambient);
    for (const w of this.walls) this.computeWallHeat(w, coarse, ambient);
  }

  private computeFloorHeat(coarse: boolean, ambient: number) {
    const fh = this.floorHeat;
    if (!fh) return;
    const res = coarse ? FLOOR_COARSE : FLOOR_FINE;
    const w = res;
    const h = Math.max(8, Math.round((res * this.bbox.h) / this.bbox.w));
    if (fh.canvas.width !== w || fh.canvas.height !== h) {
      fh.canvas.width = w;
      fh.canvas.height = h;
    }
    const img = fh.ctx.createImageData(w, h);
    const data = img.data;
    const below = new Uint8Array(w * h);
    const bb = this.bbox;
    const lamps = this.lampData;
    for (let py = 0; py < h; py++) {
      const z = bb.minZ + (1 - (py + 0.5) / h) * bb.h;
      for (let px = 0; px < w; px++) {
        const x = bb.minX + ((px + 0.5) / w) * bb.w;
        const idx4 = (py * w + px) * 4;
        if (!pointInPolygon(x, z, this.outline)) {
          data[idx4 + 3] = 0;
          continue;
        }
        const e = illuminanceAt(x, 0.02, z, 0, 1, 0, lamps, ambient);
        const [r, g, b] = heatColor(heatT(e));
        data[idx4] = r;
        data[idx4 + 1] = g;
        data[idx4 + 2] = b;
        data[idx4 + 3] = 255;
        if (e < LOW_E_THRESHOLD) below[py * w + px] = 1;
      }
    }
    fh.ctx.putImageData(img, 0, 0);
    this.drawHatch(fh.ctx, below, w, h);
    fh.texture.needsUpdate = true;
  }

  private computeWallHeat(wall: WallRec, coarse: boolean, ambient: number) {
    const H = this.plan!.height;
    const w = coarse ? WALL_COARSE_W : WALL_FINE_W;
    const h = coarse ? WALL_COARSE_H : WALL_FINE_H;
    if (wall.canvas.width !== w || wall.canvas.height !== h) {
      wall.canvas.width = w;
      wall.canvas.height = h;
    }
    const img = wall.ctx.createImageData(w, h);
    const data = img.data;
    const below = new Uint8Array(w * h);
    const lamps = this.lampData;
    for (let py = 0; py < h; py++) {
      const y = (1 - (py + 0.5) / h) * H;
      for (let px = 0; px < w; px++) {
        const u = ((px + 0.5) / w) * wall.len;
        const idx4 = (py * w + px) * 4;
        let inOpening = false;
        for (const op of wall.openings) {
          if (u >= op.u0 && u <= op.u1 && y >= op.v0 && y <= op.v1) {
            inOpening = true;
            break;
          }
        }
        if (inOpening) {
          data[idx4 + 3] = 0;
          continue;
        }
        const x = wall.ax + wall.dirx * u;
        const z = wall.az + wall.dirz * u;
        const e = illuminanceAt(x, y, z, wall.nx, 0, wall.nz, lamps, ambient);
        const [r, g, b] = heatColor(heatT(e));
        data[idx4] = r;
        data[idx4 + 1] = g;
        data[idx4 + 2] = b;
        data[idx4 + 3] = 255;
        if (e < LOW_E_THRESHOLD) below[py * w + px] = 1;
      }
    }
    wall.ctx.putImageData(img, 0, 0);
    this.drawHatch(wall.ctx, below, w, h);
    wall.texture.needsUpdate = true;
  }

  /** 低于 150lx 的格子画对角斜线（每像素格一条，整体一次描边） */
  private drawHatch(ctx: CanvasRenderingContext2D, below: Uint8Array, w: number, h: number) {
    ctx.strokeStyle = 'rgba(12, 12, 22, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        if (below[py * w + px]) {
          ctx.moveTo(px, py + 1);
          ctx.lineTo(px + 1, py);
        }
      }
    }
    ctx.stroke();
  }

  /* ------------------------------- 渲染循环 ------------------------------- */

  private emitViewThrottled() {
    const now = performance.now();
    if (now - this.lastViewEmit < 250) return;
    this.lastViewEmit = now;
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const p = this.camera.position;
    this.cb.onView([p.x, p.y, p.z], [dir.x, dir.y, dir.z]);
  }

  private onResize() {
    const w = this.container.clientWidth;
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private animate = () => {
    if (this.disposed) return;
    requestAnimationFrame(this.animate);
    this.controls.update();
    if (this.heatPending) {
      const q = this.heatPending;
      this.heatPending = null;
      this.computeHeatmaps(q === 'coarse');
    }
    this.renderer.render(this.scene, this.camera);
  };

  private clearGroup(group: THREE.Group) {
    for (let i = group.children.length - 1; i >= 0; i--) {
      const obj = group.children[i];
      group.remove(obj);
      obj.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry && !Object.values(GEO).includes(m.geometry as never)) m.geometry.dispose();
        const mat = (m as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((mm) => this.disposeMat(mm));
        else if (mat && mat !== SHADE_MAT && mat !== BASE_MAT) this.disposeMat(mat);
      });
    }
  }

  private disposeMat(m: THREE.Material) {
    const mm = m as THREE.MeshBasicMaterial;
    if (mm.map) mm.map.dispose();
    m.dispose();
  }
}
