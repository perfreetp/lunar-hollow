import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { store } from '../state/store';
import type { AppState } from '../state/store';
import type { Vec3, WheelContact, WheelGroup } from '../physics/types';
import { ROPE_DEFAULTS } from '../physics/config';
import { RopeTubeGeometry } from './ropeTube';
import { createRopeMaterial } from './ropeMaterial';
import { DragController } from './dragController';

interface WheelVisual {
  group: THREE.Group;
  visualGroup: THREE.Group;
  wheel: THREE.Mesh;
  contactMarker: THREE.Mesh;
  rayLine: THREE.Line;
  proxy: THREE.Mesh;
}

const v3 = (p: Vec3) => new THREE.Vector3(p.x, p.y, p.z);

/**
 * 索道三维场景。
 * 渲染循环常驻；状态变更由 store 订阅驱动，事件处理器内同步完成
 * 物理求解 → 几何重建 → 标记更新，下一帧（通常即当前事件所在帧的绘制）呈现。
 */
export class RopewayScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private ropeGeo: RopeTubeGeometry;
  private ropeMat: THREE.ShaderMaterial;
  private ropeMesh: THREE.Mesh;
  private supportGroup = new THREE.Group();
  private wheelGroup = new THREE.Group();
  private cabinGroup = new THREE.Group();
  private proxyGroup = new THREE.Group();
  private wheelVisuals = new Map<string, WheelVisual>();
  private supportVisuals = new Map<string, { tower: THREE.Group; proxy: THREE.Mesh; leg: THREE.Mesh; head: THREE.Mesh }>();
  private cabinVisual: { root: THREE.Group; body: THREE.Mesh; hanger: THREE.Mesh; grip: THREE.Mesh } | null = null;
  private cabinProxy!: THREE.Mesh;
  private drag: DragController;
  private rafId = 0;
  private lastRevision = -1;
  private resizeObserver: ResizeObserver;
  private unsubscribe: (() => void) | null = null;
  private followTarget = new THREE.Vector3();

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color('#0e141b');
    this.scene.fog = new THREE.Fog('#0e141b', 600, 1800);

    // 相机对准线路中点（初始线路长 300m），留出俯视角与环绕余量
    const midX = (store.state.supportA.position.x + store.state.supportB.position.x) / 2;
    const midY = (store.state.supportA.position.y + store.state.supportB.position.y) / 2;
    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      5000,
    );
    this.camera.position.set(midX - 60, midY + 90, 220);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxDistance = 2000;
    this.controls.minDistance = 5;
    this.controls.target.set(midX, midY, 0);
    this.controls.update();

    this.setupLights();
    this.setupGround();
    this.scene.add(this.supportGroup, this.wheelGroup, this.cabinGroup, this.proxyGroup);

    this.ropeGeo = new RopeTubeGeometry(2400, 10);
    this.ropeMat = createRopeMaterial(0.82);
    this.ropeMesh = new THREE.Mesh(this.ropeGeo, this.ropeMat);
    this.ropeMesh.renderOrder = 10; // 不透明轮组（默认 0）先绘制，绳后画但写深度
    this.scene.add(this.ropeMesh);

    this.drag = new DragController(
      this.renderer.domElement,
      this.camera,
      this.proxyGroup,
      this.handleDrag.bind(this),
    );

    this.unsubscribe = store.subscribe(this.handleStateChange);
    this.handleStateChange();

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
    this.animate();
  }

  private setupLights(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(120, 200, 90);
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0x8fb8ff, 0.5);
    fill.position.set(-100, 80, -120);
    this.scene.add(fill);
  }

  private setupGround(): void {
    const grid = new THREE.GridHelper(800, 80, 0x2a3a4a, 0x1b2733);
    grid.position.y = 0;
    this.scene.add(grid);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 1200),
      new THREE.MeshStandardMaterial({ color: 0x121a22, roughness: 1, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    this.scene.add(ground);
  }

  // ---------- 状态 → 场景同步 ----------

  private handleStateChange = (): void => {
    const s = store.state;
    if (s.revision === this.lastRevision) return;
    this.lastRevision = s.revision;

    this.syncSupports(s);
    this.syncWheels(s);
    this.syncCabin(s);
    this.syncRope(s);
  };

  /** 支架只创建一次，高度/位置变化时缩放塔柱并平移头部（拖拽帧零分配） */
  private syncSupports(s: AppState): void {
    for (const sup of [s.supportA, s.supportB]) {
      const p = sup.position;
      let vis = this.supportVisuals.get(sup.id);
      if (!vis) {
        const tower = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x9aa7b4, roughness: 0.5, metalness: 0.7 });
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 1, 8), mat);
        const head = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 2), mat);
        tower.add(leg, head);
        this.supportGroup.add(tower);

        const proxy = new THREE.Mesh(
          new THREE.SphereGeometry(2.2, 12, 10),
          new THREE.MeshBasicMaterial({ visible: false }),
        );
        proxy.userData = { kind: 'support', id: sup.id };
        this.proxyGroup.add(proxy);
        vis = { tower, proxy, leg, head };
        this.supportVisuals.set(sup.id, vis);
      }
      // 塔柱高 = 支架高度，头部与代理球位于塔顶
      vis.leg.scale.set(1, Math.max(0.1, p.y), 1);
      vis.leg.position.set(p.x, p.y / 2, p.z);
      vis.head.position.set(p.x, p.y, p.z);
      vis.proxy.position.copy(v3(p));
    }
  }

  private makeWheelVisual(wh: WheelGroup): WheelVisual {
    const group = new THREE.Group();
    // 可视件放内层组，整体做视觉放大；代理球独立，保持物理拾取尺寸
    const visualGroup = new THREE.Group();
    group.add(visualGroup);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x4d5a66, roughness: 0.4, metalness: 0.85 });
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wh.radius, wh.radius, 0.18, 24), wheelMat);
    wheel.rotation.x = Math.PI / 2; // 轴沿 z
    visualGroup.add(wheel);
    // 轮缘高亮圈
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(wh.radius, 0.025, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0xc9d4de, roughness: 0.3, metalness: 0.9 }),
    );
    visualGroup.add(rim);

    const contactMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0x34c759 }),
    );
    contactMarker.visible = false;
    group.add(contactMarker);

    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(), new THREE.Vector3(0, 1, 0),
    ]);
    const rayLine = new THREE.Line(
      rayGeo,
      new THREE.LineBasicMaterial({ color: 0x5ac8fa, transparent: true, opacity: 0.5 }),
    );
    rayLine.visible = false;
    group.add(rayLine);

    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(1.2, wh.radius * 2.2), 10, 8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    proxy.userData = { kind: 'wheel', id: wh.id };

    this.wheelGroup.add(group);
    this.proxyGroup.add(proxy);
    return { group, visualGroup, wheel, contactMarker, rayLine, proxy };
  }

  private syncWheels(s: AppState): void {
    const seen = new Set<string>();
    for (const wh of s.wheels) {
      seen.add(wh.id);
      let vis = this.wheelVisuals.get(wh.id);
      if (!vis) {
        vis = this.makeWheelVisual(wh);
        this.wheelVisuals.set(wh.id, vis);
      }
      vis.group.visible = wh.enabled;
      vis.proxy.visible = wh.enabled;
      vis.group.position.copy(v3(wh.position));
      vis.proxy.position.copy(v3(wh.position));
      // 可视件整体缩放（基础几何半径 = ROPE_FALLBACK_RADIUS），
      // 乘视觉放大系数让轮组在百米级线路上可辨识；代理球保持物理尺寸
      const radiusScale =
        (wh.radius / ROPE_FALLBACK_RADIUS) * ROPE_DEFAULTS.visualWheelScale;
      vis.visualGroup.scale.setScalar(radiusScale);
      this.updateContactVisual(vis, s.contacts.find((c) => c.wheelId === wh.id) ?? null, s);
    }
    for (const [id, vis] of this.wheelVisuals) {
      if (!seen.has(id)) {
        this.wheelGroup.remove(vis.group);
        this.proxyGroup.remove(vis.proxy);
        vis.group.traverse((o) => {
          if (o instanceof THREE.Mesh) o.geometry.dispose();
        });
        this.wheelVisuals.delete(id);
      }
    }
  }

  private updateContactVisual(vis: WheelVisual, c: WheelContact | null, s: AppState): void {
    if (!c || !c.contacting) {
      vis.contactMarker.visible = false;
      vis.rayLine.visible = false;
      vis.wheel.material instanceof THREE.MeshStandardMaterial &&
        (vis.wheel.material.color.set(0x4d5a66));
      return;
    }
    vis.contactMarker.visible = true;
    const local = new THREE.Vector3(c.point.x, c.point.y, c.point.z)
      .sub(vis.group.position);
    vis.contactMarker.position.copy(local);
    (vis.contactMarker.material as THREE.MeshBasicMaterial).color.set(
      c.overThreshold ? 0xff3b30 : 0x34c759,
    );
    // 压陷量越大，标记球越大
    const mm = Math.max(0, c.indentation * 1000);
    vis.contactMarker.scale.setScalar(1 + Math.min(2.5, mm / s.indentThresholdMm));

    if (c.overThreshold) {
      const mat = vis.wheel.material as THREE.MeshStandardMaterial;
      mat.color.set(0xff3b30);
      mat.emissive.setRGB(0.35, 0.02, 0.02);
    } else {
      const m = vis.wheel.material as THREE.MeshStandardMaterial;
      m.color.set(0x4d5a66);
      m.emissive?.setRGB(0, 0, 0);
    }

    // 射线可视化：轮心 → 接触点
    vis.rayLine.visible = true;
    const pts = [new THREE.Vector3(0, 0, 0), local.clone()];
    vis.rayLine.geometry.dispose();
    vis.rayLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    (vis.rayLine.material as THREE.LineBasicMaterial).color.set(
      c.overThreshold ? 0xff3b30 : 0x5ac8fa,
    );
  }

  /** 车厢网格只创建一次，求解后平移到平衡位置（拖拽帧零分配） */
  private syncCabin(s: AppState): void {
    if (!this.cabinVisual) {
      const root = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8b13d, roughness: 0.45, metalness: 0.35 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 2.2), bodyMat);
      body.position.y = -3.2;
      const hanger = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x8a95a1, metalness: 0.8, roughness: 0.3 }),
      );
      hanger.position.y = -1.4;
      const grip = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0x222831, metalness: 0.9, roughness: 0.25 }),
      );
      root.add(body, hanger, grip);
      this.cabinGroup.add(root);
      this.cabinVisual = { root, body, hanger, grip };

      this.cabinProxy = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 12, 10),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      this.cabinProxy.userData = { kind: 'cabin', id: 'cabin' };
      this.proxyGroup.add(this.cabinProxy);
    }
    const pos = v3(store.model.cabinPos);
    this.cabinVisual.root.position.copy(pos);
    this.cabinProxy.position.copy(pos);
  }

  private syncRope(s: AppState): void {
    // 管状网格按视觉系数放大（物理半径不变，压陷量仍用真实 ropeRadius）
    const visualRadius = s.ropeRadius * ROPE_DEFAULTS.visualRadiusScale;
    const { ringCount, geometryMs } = this.ropeGeo.update(store.model, visualRadius);
    if (ringCount > 0) store.reportGeometryMs(geometryMs);
    const over = s.contacts.some((c) => c.overThreshold);
    this.ropeMat.uniforms.uHighlight.value = over ? 1 : 0;
  }

  // ---------- 拖拽回调（物理求解在 store 内同步完成） ----------

  private handleDrag(kind: string, id: string, point: THREE.Vector3): void {
    const s = store.state;
    if (kind === 'support') {
      store.setSupportPosition(id as 'support-A' | 'support-B', {
        y: THREE.MathUtils.clamp(point.y, 2, 120),
        x: point.x,
        z: point.z,
      });
    } else if (kind === 'wheel') {
      store.setWheelPosition(id, {
        y: THREE.MathUtils.clamp(point.y, 0.5, 110),
        x: point.x,
        z: point.z,
      });
    } else if (kind === 'cabin') {
      // 世界点 → 车厢里程参数 t：投影到 A→B 水平方向（兼容带 z 偏移的线路）
      const a = s.supportA.position;
      const b = s.supportB.position;
      const abx = b.x - a.x;
      const abz = b.z - a.z;
      const len2 = abx * abx + abz * abz || 1;
      const t = THREE.MathUtils.clamp(
        ((point.x - a.x) * abx + (point.z - a.z) * abz) / len2,
        0.001,
        0.999,
      );
      store.setCabinT(t);
    }
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private animate = (): void => {
    this.rafId = requestAnimationFrame(this.animate);
    const s = store.state;
    if (s.cameraMode === 'follow') {
      // 沿线路跟随：目标锁定车厢，相机保持当前相对方位
      const target = v3(store.model.cabinPos);
      const delta = target.clone().sub(this.controls.target);
      this.controls.target.copy(target);
      this.camera.position.add(delta);
      this.followTarget.copy(target);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.unsubscribe?.();
    this.resizeObserver.disconnect();
    this.drag.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

const ROPE_FALLBACK_RADIUS = 0.22;
