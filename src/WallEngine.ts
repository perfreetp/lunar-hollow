import {
  AmbientLight,
  BufferAttribute,
  BoxGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  GridHelper,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  BufferGeometry,
  Group,
  PlaneGeometry,
} from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { FrameStats, LayerConfig, WallConfig } from './types';
import {
  COATING_TABLE,
  FRAME_BUDGET_MS,
  OPTICAL_CLIP_THRESHOLD,
  THICKNESS_MAX,
  THICKNESS_MIN,
  TRANSMISSION_TABLE,
  clampGear,
  estimateTotalTransmission,
  fresnelReflectance,
} from './optics';
import { getConfig, subscribe } from './store';

// 让 three-mesh-bvh 接管 BufferGeometry 的射线求交
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;

/** 超过该层数后触发硬裁剪（导入异常大配置时的保护），只渲染最靠前的若干层 */
const HARD_LAYER_LIMIT = 80;

const glassVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const glassFragmentShader = /* glsl */ `
  uniform vec3 uTint;
  uniform vec3 uReflectionColor;
  uniform float uF0;
  uniform float uOpacity;
  uniform float uHighlight;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(vViewDir);
    float cosTheta = clamp(abs(dot(N, V)), 0.0, 1.0);
    // Schlick Fresnel：掠射角反射增强（镀膜反射随视角变化）
    float R = uF0 + (1.0 - uF0) * pow(1.0 - cosTheta, 5.0);

    vec3 reflectionTint = mix(uReflectionColor, vec3(1.0), 0.25);
    vec3 glassColor = mix(uTint, reflectionTint, R * 0.85);
    // 高亮隔离层：青色自发光
    glassColor = mix(glassColor, vec3(0.25, 0.95, 1.0), uHighlight * 0.65);

    // 不透明度随反射增强而升高：掠射时层叠趋暗但顺序稳定，不产生明暗跳变
    float alpha = clamp(uOpacity + R * 0.28 + uHighlight * 0.25, 0.05, 0.85);
    gl_FragColor = vec4(glassColor, alpha);
  }
`;

interface LayerRuntime {
  id: number;
  mesh: Mesh;
  material: ShaderMaterial;
  geometry: BufferGeometry;
  active: boolean;
}

/**
 * 幕墙渲染引擎：
 * - 每层一块合并网格 + 独立 BVH，射线 firstHitOnly 求交统计穿层数
 * - 每帧按相机距离做增量插入排序（back-to-front），半透明混合
 * - 排序/求交耗时纳入帧预算统计，超预算由 UI 给出提示
 */
export class WallEngine {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new Raycaster();
  private wallGroup = new Group();
  private layers: LayerRuntime[] = [];
  /** back-to-front 渲染顺序，存 layer id，每帧增量排序 */
  private order: number[] = [];
  private sightLine: Line;
  private sightEnd: Mesh;
  private costEma = 0;
  private isolatedId: number | null = null;
  private rafId = 0;
  private disposed = false;
  private hardClipped = 0;
  private statsAccum = 0;
  private lastThickness: number[] = [];
  private readonly onStats: (s: FrameStats) => void;
  private readonly normalZ = new Vector3(0, 0, 1);
  private readonly rayDir = new Vector3();
  private readonly rayOrigin = new Vector3();
  private readonly linePositions = new Float32Array(6);
  private unsubscribe: () => void;

  constructor(container: HTMLElement, onStats: (s: FrameStats) => void) {
    this.onStats = onStats;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(50, width / height, 0.05, 200);
    this.camera.position.set(6, 4, 14);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 2, -2.5);
    this.controls.minDistance = 2;
    this.controls.maxDistance = 60;

    this.scene.background = new Color(0x0e141d);
    this.scene.add(this.wallGroup);
    this.buildBackdrop();
    this.buildLights();

    // 视线指示线：从相机沿屏幕中心发出，命中幕墙时显示
    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute('position', new BufferAttribute(this.linePositions, 3));
    this.sightLine = new Line(
      lineGeo,
      new LineBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.9 }),
    );
    this.sightLine.visible = false;
    this.scene.add(this.sightLine);
    this.sightEnd = new Mesh(
      new SphereGeometry(0.07, 16, 12),
      new MeshBasicMaterial({ color: 0xffd54a }),
    );
    this.sightEnd.visible = false;
    this.scene.add(this.sightEnd);

    this.raycaster.firstHitOnly = true;

    this.rebuildWall();
    this.lastThickness = getConfig().layers.map((l) => l.thickness);
    this.unsubscribe = subscribe((reason) => this.handleConfigChange(reason));

    window.addEventListener('resize', this.handleResize);
    this.loop();
  }

  /* ---------------- 场景：幕墙背后的城市背景 ---------------- */

  private buildBackdrop() {
    const backdrop = new Group();

    const ground = new GridHelper(60, 60, 0x2a3a4d, 0x1b2733);
    ground.position.set(0, -2.6, -12);
    backdrop.add(ground);

    const skyGeo = new PlaneGeometry(70, 30);
    const sky = new Mesh(skyGeo, new MeshBasicMaterial({ color: 0x18263a, side: DoubleSide }));
    sky.position.set(0, 6, -22);
    backdrop.add(sky);

    // 城市楼块：透过玻璃可见的背景细节
    const palette = [0x33485f, 0x3d556e, 0x46607a, 0x2c3f54, 0x51708c];
    for (let i = 0; i < 26; i++) {
      const w = 0.8 + ((i * 37) % 10) * 0.22;
      const h = 1.5 + ((i * 53) % 14) * 0.55;
      const d = 0.8 + ((i * 23) % 6) * 0.3;
      const box = new Mesh(
        new BoxGeometry(w, h, d),
        new MeshStandardMaterial({
          color: palette[i % palette.length],
          roughness: 0.85,
          metalness: 0.1,
        }),
      );
      box.position.set(
        -14 + (i % 9) * 3.4 + ((i * 7) % 2) * 0.6,
        -2.6 + h / 2,
        -8 - Math.floor(i / 9) * 4.5 - ((i * 11) % 3) * 0.7,
      );
      backdrop.add(box);
    }
    this.scene.add(backdrop);
  }

  private buildLights() {
    this.scene.add(new HemisphereLight(0xbfd6ea, 0x1a2230, 0.9));
    this.scene.add(new AmbientLight(0xffffff, 0.35));
    const dir = new DirectionalLight(0xfff2d8, 1.4);
    dir.position.set(6, 10, 8);
    this.scene.add(dir);
  }

  /* ---------------- 幕墙构建 / 重建 ---------------- */

  private layerZ(index: number, cfg: WallConfig): number {
    // 第 0 层最靠近相机（z 最大），其余依次向后排列
    let z = 0;
    for (let i = 0; i < index; i++) {
      z -= cfg.spacing + cfg.layers[i].thickness;
    }
    return z;
  }

  /** 合并一整层 rows*cols 块玻璃为单个网格，并建立 BVH */
  private buildLayerGeometry(cfg: WallConfig, layer: LayerConfig): BufferGeometry {
    const geos: BufferGeometry[] = [];
    const totalW = cfg.cols * cfg.panelWidth;
    const totalH = cfg.rows * cfg.panelHeight;
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        const g = new BoxGeometry(
          cfg.panelWidth * 0.96,
          cfg.panelHeight * 0.96,
          layer.thickness,
        );
        g.translate(
          -totalW / 2 + cfg.panelWidth * (c + 0.5),
          -totalH / 2 + cfg.panelHeight * (r + 0.5),
          0,
        );
        geos.push(g);
      }
    }
    const merged = mergeGeometries(geos, false)!;
    for (const g of geos) g.dispose();
    merged.computeBoundsTree();
    return merged;
  }

  private makeMaterial(layer: LayerConfig): ShaderMaterial {
    const t0 = TRANSMISSION_TABLE[clampGear(layer.transmissionGear)] ?? 0.65;
    const f0 = COATING_TABLE[clampGear(layer.coatingGear)] ?? 0.07;
    const tint = new Color().setHSL(
      0.56 - (f0 - 0.04) * 0.35,
      0.22 + f0 * 0.9,
      0.42 + t0 * 0.28,
    );
    return new ShaderMaterial({
      vertexShader: glassVertexShader,
      fragmentShader: glassFragmentShader,
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      uniforms: {
        uTint: { value: tint },
        uReflectionColor: { value: new Color(0xbfd9e8) },
        uF0: { value: f0 },
        // 基础不透明度由法向透射率映射，层叠混合时多层叠加自然变暗
        uOpacity: { value: 0.1 + (1 - t0) * 0.42 },
        uHighlight: { value: 0 },
      },
    });
  }

  private disposeLayer(rt: LayerRuntime) {
    this.wallGroup.remove(rt.mesh);
    rt.geometry.disposeBoundsTree();
    rt.geometry.dispose();
    rt.material.dispose();
  }

  /** 全量重建（网格/间距/层数变化或导入配置） */
  private rebuildWall() {
    const cfg = getConfig();
    for (const rt of this.layers) this.disposeLayer(rt);
    this.layers = [];
    this.order = [];

    cfg.layers.forEach((layer, i) => {
      const geometry = this.buildLayerGeometry(cfg, layer);
      const material = this.makeMaterial(layer);
      const mesh = new Mesh(geometry, material);
      mesh.position.set(0, 2, this.layerZ(i, cfg));
      mesh.renderOrder = i; // 稳态初值，每帧由增量排序校正
      this.wallGroup.add(mesh);
      this.layers.push({ id: layer.id, mesh, material, geometry, active: true });
      this.order.push(layer.id);
    });
    this.lastThickness = cfg.layers.map((l) => l.thickness);
    this.applyVisibility();
  }

  /** 仅重建某层几何（厚度微调），保留其余层 BVH 不变，并刷新后续层 z 位置 */
  private rebuildLayerGeometry(id: number) {
    const cfg = getConfig();
    const rt = this.layers[id];
    if (!rt) return;
    rt.geometry.disposeBoundsTree();
    rt.geometry.dispose();
    rt.geometry = this.buildLayerGeometry(cfg, cfg.layers[id]);
    rt.mesh.geometry = rt.geometry;
    this.layers.forEach((other, i) => {
      other.mesh.position.z = this.layerZ(i, cfg);
    });
  }

  private refreshLayerMaterial(id: number) {
    const cfg = getConfig();
    const layer = cfg.layers[id];
    const rt = this.layers[id];
    if (!rt || !layer) return;
    const t0 = TRANSMISSION_TABLE[clampGear(layer.transmissionGear)] ?? 0.65;
    const f0 = COATING_TABLE[clampGear(layer.coatingGear)] ?? 0.07;
    const u = rt.material.uniforms;
    u.uF0.value = f0;
    u.uOpacity.value = 0.1 + (1 - t0) * 0.42;
    (u.uTint.value as Color).setHSL(0.56 - (f0 - 0.04) * 0.35, 0.22 + f0 * 0.9, 0.42 + t0 * 0.28);
  }

  private handleConfigChange(reason: string) {
    const cfg = getConfig();
    switch (reason) {
      case 'replace':
      case 'reset':
      case 'wall-geometry':
        this.rebuildWall();
        break;
      case 'layer-geometry':
        this.rebuildDirtyGeometries(cfg);
        break;
      case 'layer-optics':
        this.layers.forEach((_, id) => this.refreshLayerMaterial(id));
        break;
      case 'layer-enabled':
        this.applyVisibility();
        break;
      default:
        break;
    }
  }

  private rebuildDirtyGeometries(cfg: WallConfig) {
    const current = cfg.layers.map((l) => l.thickness);
    let thicknessChanged = false;
    current.forEach((t, i) => {
      if (this.lastThickness[i] !== t) {
        this.rebuildLayerGeometry(i);
        thicknessChanged = true;
      }
    });
    this.lastThickness = current;
    if (!thicknessChanged) {
      // 间距变化（wall-geometry 已覆盖，此处兜底）：统一刷新 z 位置
      this.layers.forEach((rt, i) => {
        rt.mesh.position.z = this.layerZ(i, cfg);
      });
    }
  }

  /* ---------------- 高亮 / 隔离 ---------------- */

  setIsolated(id: number | null) {
    this.isolatedId = id;
    this.applyVisibility();
  }

  getIsolated(): number | null {
    return this.isolatedId;
  }

  private applyVisibility() {
    const cfg = getConfig();
    let hardClipped = 0;
    const activeEnabled = cfg.layers.filter((l) => l.enabled).length;
    const hardClipStart = activeEnabled > HARD_LAYER_LIMIT ? HARD_LAYER_LIMIT : Infinity;
    let enabledSeen = 0;
    this.layers.forEach((rt) => {
      const layer = cfg.layers[rt.id];
      const enabled = !!layer?.enabled;
      let visible = enabled;
      if (enabled) {
        enabledSeen += 1;
        if (enabledSeen > hardClipStart) {
          visible = false;
          hardClipped += 1;
        }
      }
      if (this.isolatedId !== null) visible = rt.id === this.isolatedId;
      rt.active = visible;
      rt.mesh.visible = visible;
      rt.material.uniforms.uHighlight.value =
        this.isolatedId !== null && rt.id === this.isolatedId ? 1 : 0;
    });
    this.hardClipped = hardClipped;
  }

  /* ---------------- 每帧：增量排序 + BVH 求交 ---------------- */

  /**
   * 增量插入排序：层平面互相平行，旋转视角时顺序几乎不变，
   * 插入排序在近乎有序的输入上为 O(n)，并统计实际交换次数。
   * back-to-front：距离相机远的排前面（先绘制）。
   */
  private incrementalSort(): number {
    let swaps = 0;
    const dist = (id: number) =>
      this.layers[id].mesh.position.distanceToSquared(this.camera.position);
    for (let i = 1; i < this.order.length; i++) {
      const cur = this.order[i];
      const dCur = dist(cur);
      let j = i - 1;
      while (j >= 0 && dist(this.order[j]) < dCur) {
        this.order[j + 1] = this.order[j];
        swaps += 1;
        j -= 1;
      }
      this.order[j + 1] = cur;
    }
    for (let k = 0; k < this.order.length; k++) {
      const rt = this.layers[this.order[k]];
      if (rt) rt.mesh.renderOrder = k;
    }
    return swaps;
  }

  private updateSightRay(): { onWall: boolean; hitCount: number; cosTheta: number } {
    // 视线 = 相机穿过屏幕中心的射线（与画面中心十字线对齐）
    this.camera.getWorldDirection(this.rayDir);
    this.camera.getWorldPosition(this.rayOrigin);
    this.raycaster.set(this.rayOrigin, this.rayDir);
    this.raycaster.firstHitOnly = true;

    const targets = this.layers.filter((rt) => rt.active).map((rt) => rt.mesh);
    const hits = this.raycaster.intersectObjects(targets, false);
    const onWall = hits.length > 0;
    const cosTheta = Math.abs(this.rayDir.dot(this.normalZ));

    if (onWall) {
      const end = hits[hits.length - 1].point;
      this.linePositions[0] = this.rayOrigin.x;
      this.linePositions[1] = this.rayOrigin.y;
      this.linePositions[2] = this.rayOrigin.z;
      this.linePositions[3] = end.x;
      this.linePositions[4] = end.y;
      this.linePositions[5] = end.z;
      const attr = this.sightLine.geometry.getAttribute('position') as BufferAttribute;
      attr.needsUpdate = true;
      this.sightLine.geometry.computeBoundingSphere();
      this.sightLine.visible = true;
      this.sightEnd.position.copy(end);
      this.sightEnd.visible = true;
    } else {
      this.sightLine.visible = false;
      this.sightEnd.visible = false;
    }
    return { onWall, hitCount: hits.length, cosTheta };
  }

  private computeStats(
    swaps: number,
    costMs: number,
    ray: { onWall: boolean; hitCount: number; cosTheta: number },
  ): FrameStats {
    const cfg = getConfig();
    const enabledLayers = cfg.layers.filter((l) => l.enabled);
    const est = ray.onWall
      ? estimateTotalTransmission(enabledLayers, ray.cosTheta)
      : { total: 1, clipped: 0 };

    this.costEma = this.costEma === 0 ? costMs : this.costEma * 0.9 + costMs * 0.1;
    return {
      hitCount: ray.onWall ? ray.hitCount : 0,
      visibleCount: this.layers.filter((rt) => rt.active).length,
      totalTransmission: ray.onWall ? est.total : 0,
      incidenceDeg: Math.round((Math.acos(Math.min(1, ray.cosTheta)) * 180) / Math.PI),
      clippedLayers: est.clipped + this.hardClipped,
      frameCostMs: this.costEma,
      sortSwaps: swaps,
      onWall: ray.onWall,
    };
  }

  private loop = () => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.loop);
    this.controls.update();

    const t0 = performance.now();
    const swaps = this.incrementalSort();
    const ray = this.updateSightRay();
    const costMs = performance.now() - t0;

    this.renderer.render(this.scene, this.camera);

    // 统计回传节流到约 10Hz，避免 Solid 高频刷新
    this.statsAccum += 1;
    if (this.statsAccum >= 6) {
      this.statsAccum = 0;
      this.onStats(this.computeStats(swaps, costMs, ray));
    }
  };

  private handleResize = () => {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.unsubscribe();
    window.removeEventListener('resize', this.handleResize);
    for (const rt of this.layers) this.disposeLayer(rt);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

/** 供 UI 复用：单层在某入射角下的有效透射率（0-1） */
export function layerEffectiveTransmission(layer: LayerConfig, cosTheta: number): number {
  const t0 = TRANSMISSION_TABLE[clampGear(layer.transmissionGear)] ?? 0.65;
  const f0 = COATING_TABLE[clampGear(layer.coatingGear)] ?? 0.07;
  return (t0 * (1 - fresnelReflectance(cosTheta, f0))) / (1 - f0);
}

export {
  FRAME_BUDGET_MS,
  OPTICAL_CLIP_THRESHOLD,
  THICKNESS_MIN,
  THICKNESS_MAX,
};
