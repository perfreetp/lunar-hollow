import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer, RenderPass, BloomEffect, VignetteEffect, ToneMappingEffect, EffectPass, ToneMappingMode } from 'postprocessing';
import type { LighthouseConfig, Reef, SceneConfig, ShipState } from '../types';
import { useToolStore } from '../store';
import { flashEnvelope } from '../lib/beamMath';
import { VolumetricBeam } from './VolumetricBeam';

const FAR_LOD_DISTANCE = 260; // 超过此距离的光柱切低分辨率体积纹理

interface LhView {
  beam: VolumetricBeam;
  tower: THREE.Group;
  lensMat: THREE.MeshStandardMaterial;
  selectRing: THREE.Mesh;
  config: LighthouseConfig;
}

/**
 * 三维海域场景：负责所有 three.js 对象的生命周期、船体拖拽拾取、
 * 半透明深度排序与后处理；业务状态全部来自 zustand，每帧单向同步。
 */
export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private clock = new THREE.Clock();
  private raf = 0;
  private container: HTMLElement;

  private lhViews = new Map<string, LhView>();
  private reefMeshes = new Map<string, THREE.Mesh>();
  private beamsGroup = new THREE.Group(); // 光束统一放在最后渲染队列
  private footprintGroup = new THREE.Group();
  private ship!: THREE.Group;
  private shipHullMat!: THREE.MeshStandardMaterial;
  private waterMat!: THREE.MeshStandardMaterial;
  private waterUniforms: Record<string, THREE.IUniform> | null = null;
  private expFog!: THREE.FogExp2;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private dragging = false;
  private dragOffset = new THREE.Vector3();
  private shipDragMarker!: THREE.Mesh;

  private lastConfigSig = '';
  private lastShipSig = '';
  private lastEnvSig = '';
  private lastFlagsSig = '';
  private resizeObs: ResizeObserver;

  constructor(container: HTMLElement) {
    this.container = container;
    const w = container.clientWidth;
    const h = container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // 关闭自动重置，让 renderer.info 统计覆盖后处理所有 pass（用于 FPS/绘制数调试读数）
    this.renderer.info.autoReset = false;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.5, 3000);
    this.camera.position.set(190, 150, 220);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 40;
    this.controls.maxDistance = 900;
    this.controls.target.set(0, 0, 0);

    this.expFog = new THREE.FogExp2(0x16293c, 0.0016);
    this.scene.fog = this.expFog;
    this.scene.background = new THREE.Color(0x0a1724);

    this.buildEnvironment();
    this.scene.add(this.beamsGroup, this.footprintGroup);
    this.buildShip();

    // 后处理：选择性 bloom（光束/灯芯/光斑发光）+ 暗角 + 色调映射
    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new BloomEffect({
      intensity: 1.15,
      luminanceThreshold: 0.32,
      luminanceSmoothing: 0.25,
      mipmapBlur: true,
    });
    const vignette = new VignetteEffect({ darkness: 0.28, offset: 0.32 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    composer.addPass(new EffectPass(this.camera, bloom, vignette, tone));
    this.composer = composer;

    this.bindPointer();
    this.syncAll(true);

    this.resizeObs = new ResizeObserver(() => this.onResize());
    this.resizeObs.observe(container);
    this.animate();
  }

  // ---------- 静态环境 ----------

  private buildEnvironment() {
    const hemi = new THREE.HemisphereLight(0xbcd6ee, 0x0a1822, 1.5);
    const dir = new THREE.DirectionalLight(0xfff2d8, 1.1);
    dir.position.set(-120, 200, 90);
    this.scene.add(hemi, dir);

    // 海面：细分大平面 + 注入顶点波浪（保持 MeshStandard 廉价）
    const waterGeo = new THREE.PlaneGeometry(2000, 2000, 96, 96);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0b2233'),
      roughness: 0.32,
      metalness: 0.55,
    });
    this.waterMat.onBeforeCompile = (shader) => {
      shader.uniforms.uWaveTime = { value: 0 };
      this.waterUniforms = shader.uniforms;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform float uWaveTime;\nvarying vec3 vWaveNormal;',
        )
        .replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
          {
            float w1 = sin(position.x * 0.05 + uWaveTime * 0.9) * 0.9
                     + sin(position.y * 0.07 - uWaveTime * 0.7) * 0.7
                     + sin((position.x + position.y) * 0.03 + uWaveTime * 0.5) * 0.5;
            float dx = cos(position.x * 0.05 + uWaveTime * 0.9) * 0.045
                     + cos((position.x + position.y) * 0.03 + uWaveTime * 0.5) * 0.015;
            float dy = cos(position.y * 0.07 - uWaveTime * 0.7) * 0.035
                     + cos((position.x + position.y) * 0.03 + uWaveTime * 0.5) * 0.015;
            float h = w1 * 0.55;
            objectNormal = normalize(vec3(-dx * 0.55, 1.0, -dy * 0.55));
            vWaveNormal = objectNormal;
          }`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          transformed.z += (sin(position.x * 0.05 + uWaveTime * 0.9) * 0.9
                     + sin(position.y * 0.07 - uWaveTime * 0.7) * 0.7
                     + sin((position.x + position.y) * 0.03 + uWaveTime * 0.5) * 0.5) * 0.55;`,
        );
    };
    const water = new THREE.Mesh(waterGeo, this.waterMat);
    water.rotation.x = -Math.PI / 2;
    this.scene.add(water);

    // 网格参考线（海里格）
    const grid = new THREE.GridHelper(800, 32, 0x2f5a78, 0x1d3a50);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    grid.position.y = 0.6;
    this.scene.add(grid);
  }

  private buildTower(lh: LighthouseConfig): LhView {
    const g = new THREE.Group();
    g.position.set(lh.x, 0, lh.z);
    g.userData.lhId = lh.id;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.85 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(lh.towerRadius * 1.25, lh.towerRadius * 1.5, 4, 14), bodyMat);
    base.position.y = 2;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(lh.towerRadius * 0.55, lh.towerRadius, Math.max(6, lh.height - 8), 14),
      bodyMat,
    );
    shaft.position.y = 4 + (lh.height - 8) / 2;
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(lh.towerRadius * 0.62, lh.towerRadius * 0.78, Math.max(2, lh.height * 0.16), 14),
      stripeMat,
    );
    stripe.position.y = lh.height * 0.55;
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(lh.towerRadius * 0.9, lh.towerRadius * 0.9, 3.2, 12), bodyMat);
    lantern.position.y = lh.height - 1.4;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(lh.towerRadius * 1.15, 2.4, 12), new THREE.MeshStandardMaterial({ color: 0x2c3e50 }));
    cap.position.y = lh.height + 1.4;

    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xfff4d6,
      emissive: new THREE.Color(0xffe9b0),
      emissiveIntensity: 2.4,
      roughness: 0.25,
    });
    const lens = new THREE.Mesh(new THREE.SphereGeometry(lh.towerRadius * 0.55, 16, 12), lensMat);
    lens.position.y = lh.height;

    g.add(base, shaft, stripe, lantern, cap, lens);
    this.scene.add(g);

    const selectRing = new THREE.Mesh(
      new THREE.RingGeometry(lh.towerRadius * 1.8, lh.towerRadius * 2.2, 36),
      new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
    );
    selectRing.rotation.x = -Math.PI / 2;
    selectRing.position.set(lh.x, 1.2, lh.z);
    selectRing.visible = false;
    this.scene.add(selectRing);

    const beam = new VolumetricBeam(lh);
    beam.syncConfig(lh);
    this.beamsGroup.add(beam.group);
    this.footprintGroup.add(beam.footprintGroup);

    return { beam, tower: g, lensMat, selectRing, config: lh };
  }

  private buildReef(reef: Reef): THREE.Mesh {
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: 0.95, flatShading: true });
    const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(reef.radius, 0), mat);
    mesh.position.set(reef.x, reef.radius * 0.15, reef.z);
    mesh.scale.y = 0.55;
    mesh.userData.reefId = reef.id;
    this.scene.add(mesh);
    return mesh;
  }

  private buildShip() {
    const g = new THREE.Group();
    this.shipHullMat = new THREE.MeshStandardMaterial({ color: 0xd9534f, roughness: 0.55, metalness: 0.15, emissive: 0x000000 });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(5, 2.4, 14), this.shipHullMat);
    hull.position.y = 1.4;
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 2.2, 4.5),
      new THREE.MeshStandardMaterial({ color: 0xf5f1e8, roughness: 0.6 }),
    );
    cabin.position.set(0, 3.4, -1.5);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 8), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
    mast.position.y = 6.5;
    g.add(hull, cabin, mast);
    g.userData.isShip = true;
    this.ship = g;
    this.scene.add(g);

    this.shipDragMarker = new THREE.Mesh(
      new THREE.RingGeometry(9, 10.5, 40),
      new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.shipDragMarker.rotation.x = -Math.PI / 2;
    this.shipDragMarker.position.y = 1.2;
    this.shipDragMarker.visible = false;
    this.scene.add(this.shipDragMarker);
  }

  // ---------- 指针拾取与拖拽 ----------

  private bindPointer() {
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private updatePointer(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown = (e: PointerEvent) => {
    this.updatePointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.ship, true);
    if (hits.length) {
      this.dragging = true;
      this.controls.enabled = false;
      this.renderer.domElement.style.cursor = 'grabbing';
      const ground = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.dragPlane, ground);
      this.dragOffset.set(this.ship.position.x - ground.x, 0, this.ship.position.z - ground.z);
      this.shipDragMarker.visible = true;
      this.shipDragMarker.position.set(this.ship.position.x, 1.2, this.ship.position.z);
    } else {
      // 点选灯塔 → 同步到参数台
      const towerHits = this.raycaster.intersectObjects([...this.lhViews.values()].map((v) => v.tower), true);
      if (towerHits.length) {
        let obj: THREE.Object3D | null = towerHits[0].object;
        while (obj && !obj.userData.lhId) obj = obj.parent;
        if (obj?.userData.lhId) useToolStore.getState().selectLighthouse(obj.userData.lhId as string);
      } else {
        useToolStore.getState().selectLighthouse(null);
      }
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    this.updatePointer(e);
    if (!this.dragging) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hover = this.raycaster.intersectObject(this.ship, true).length > 0;
      this.renderer.domElement.style.cursor = hover ? 'grab' : '';
      return;
    }
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const ground = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.dragPlane, ground)) return;
    const x = THREE.MathUtils.clamp(ground.x + this.dragOffset.x, -380, 380);
    const z = THREE.MathUtils.clamp(ground.z + this.dragOffset.z, -380, 380);
    // 船位变动 → store → recompute 联动重算所有灯的光斑与遮挡
    useToolStore.getState().setShip({ x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 });
  };

  private onPointerUp = () => {
    if (!this.dragging) return;
    this.dragging = false;
    this.controls.enabled = true;
    this.renderer.domElement.style.cursor = '';
    this.shipDragMarker.visible = false;
  };

  // ---------- 状态 → 场景 单向同步 ----------

  private syncAll(force = false) {
    const state = useToolStore.getState();
    const cfg = state.config;
    const cfgSig = JSON.stringify(cfg.lighthouses.map((l) => [l.id, l.x, l.z, l.height, l.towerRadius, l.beam]));
    const shipSig = JSON.stringify(cfg.ship);
    const envSig = JSON.stringify(cfg.environment);
    const flagsSig = `${state.showFootprints}|${state.lowResFar}|${state.mistEnabled}|${state.selectedLhId}`;

    if (force || cfgSig !== this.lastConfigSig) {
      this.syncLighthouses(cfg);
      this.syncReefs(cfg.reefs);
      this.lastConfigSig = cfgSig;
    }
    if (force || shipSig !== this.lastShipSig) {
      this.syncShip(cfg.ship);
      this.lastShipSig = shipSig;
    }
    if (force || envSig !== this.lastEnvSig) {
      this.syncEnvironment(cfg);
      this.lastEnvSig = envSig;
    }
    if (force || flagsSig !== this.lastFlagsSig) {
      this.applyFlags();
      this.lastFlagsSig = flagsSig;
    }
  }

  private syncLighthouses(cfg: SceneConfig) {
    const ids = new Set(cfg.lighthouses.map((l) => l.id));
    for (const [id, view] of this.lhViews) {
      if (!ids.has(id)) {
        this.scene.remove(view.tower, view.selectRing);
        this.beamsGroup.remove(view.beam.group);
        this.footprintGroup.remove(view.beam.footprintGroup);
        view.beam.dispose();
        this.lhViews.delete(id);
      }
    }
    for (const lh of cfg.lighthouses) {
      let view = this.lhViews.get(lh.id);
      if (!view) {
        view = this.buildTower(lh);
        this.lhViews.set(lh.id, view);
      }
      view.config = lh;
      view.tower.position.set(lh.x, 0, lh.z);
      view.selectRing.position.set(lh.x, 1.2, lh.z);
      view.beam.syncConfig(lh);
    }
  }

  private syncReefs(reefs: Reef[]) {
    const ids = new Set(reefs.map((r) => r.id));
    for (const [id, mesh] of this.reefMeshes) {
      if (!ids.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.reefMeshes.delete(id);
      }
    }
    for (const reef of reefs) {
      let mesh = this.reefMeshes.get(reef.id);
      if (!mesh) {
        mesh = this.buildReef(reef);
        this.reefMeshes.set(reef.id, mesh);
      }
      mesh.position.set(reef.x, reef.radius * 0.15, reef.z);
      mesh.scale.set(1, 0.55, 1);
    }
  }

  private syncShip(ship: ShipState) {
    this.ship.position.set(ship.x, 0, ship.z);
    this.ship.rotation.y = THREE.MathUtils.degToRad(ship.heading);
    this.ship.scale.set(ship.width / 5, 1, ship.length / 14);
    this.shipDragMarker.position.set(ship.x, 1.2, ship.z);
  }

  private syncEnvironment(cfg: SceneConfig) {
    const { fogDensity, ambient, seaColor } = cfg.environment;
    this.expFog.density = fogDensity;
    this.waterMat.color.set(seaColor);
    const hemi = this.scene.children.find((c) => c instanceof THREE.HemisphereLight) as THREE.HemisphereLight | undefined;
    if (hemi) hemi.intensity = 0.5 + ambient * 2.4;
  }

  private applyFlags() {
    const state = useToolStore.getState();
    for (const [id, view] of this.lhViews) {
      view.selectRing.visible = id === state.selectedLhId;
    }
  }

  // ---------- 每帧 ----------

  private animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    // info.autoReset=false：帧开头清零，整帧（含后处理各 pass）累计，帧外读取上一帧值
    this.renderer.info.reset();
    const t = this.clock.getElapsedTime();
    this.syncAll();

    // FPS 统计（1s 窗口）
    this._fpsFrames++;
    const now = performance.now();
    if (now - this._fpsLast >= 1000) {
      this._fps = Math.round((this._fpsFrames * 1000) / (now - this._fpsLast));
      this._fpsFrames = 0;
      this._fpsLast = now;
    }

    const state = useToolStore.getState();
    const { config, runtime } = state;
    const fogColor = this.expFog.color.clone();
    const fogDensity = state.mistEnabled ? config.environment.fogDensity : 0.00006;

    // 光束每帧：时间 uniform、雾、LOD、深度排序
    for (const lh of config.lighthouses) {
      const view = this.lhViews.get(lh.id);
      if (!view) continue;
      view.beam.update(t, this.camera.position, fogDensity, fogColor, state.mistEnabled ? 1 : 0, state.lowResFar, FAR_LOD_DISTANCE);
      const info = runtime.find((r) => r.id === lh.id);
      const flashOn = flashEnvelope(t, lh.beam) > 0.5;
      if (info) view.beam.setFootprint(info.spot, info.radius, state.showFootprints, flashOn);
      view.lensMat.emissiveIntensity = flashOn ? 2.6 : 0.15;
    }

    // 船被任一盏灯照亮 → 船身加色发光（遮挡联动的可视化反馈）
    const litByAny = runtime.some((r) => {
      const lhCfg = this.lhViews.get(r.id)?.config.beam;
      return r.shipLit && lhCfg !== undefined && flashEnvelope(t, lhCfg) > 0.5;
    });
    this.shipHullMat.emissive.set(litByAny ? 0x6b4a12 : 0x000000);
    this.shipHullMat.emissiveIntensity = litByAny ? 1.1 : 0;

    // 海面波浪时间推进
    if (this.waterUniforms) this.waterUniforms.uWaveTime.value = t;
    this.waterMat.roughness = 0.3 + Math.sin(t * 0.4) * 0.03;

    this.controls.update();
    this.composer.render();
  };

  // ---------- 测试 / 调试辅助 ----------

  /** 世界坐标 → 视口 CSS 像素（用于自动化拖拽定位） */
  worldToScreen(x: number, y: number, z: number): { x: number; y: number; visible: boolean } {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
      visible: v.z > -1 && v.z < 1,
    };
  }

  get debugStats() {
    const info = this.renderer.info;
    return {
      beams: this.lhViews.size,
      reefs: this.reefMeshes.size,
      fps: this._fps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
    };
  }
  private _fps = 0;
  private _fpsFrames = 0;
  private _fpsLast = performance.now();

  private onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    el.parentElement?.removeChild(el);
  }
}
