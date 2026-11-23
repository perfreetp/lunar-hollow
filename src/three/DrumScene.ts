import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import {
  VERT_COUNT, SEG, RINGS, vertexIndex, wrapJ, computeGridNormals,
} from '../sim/layout';
import { MATERIALS, FINISHES, type DrumConfig, type ColorMode } from '../sim/types';
import { makeHeadGeometryData, stressColor, srgbToLinear } from './headGeometry';

THREE.Mesh.prototype.raycast = acceleratedRaycast;

export interface PickResult {
  rho: number;
  theta: number;
  x: number;
  y: number;
  z: number;
}

export interface RendererCallbacks {
  onPick: (hit: PickResult) => void;
  onHover: (hit: PickResult | null) => void;
}

export interface SceneStats {
  fps: number;
  raycasts: number;
  bvhBuilds: number;
  drawCalls: number;
  triangles: number;
}

export interface StrikeMarkerData {
  id: string;
  rho: number;
  theta: number;
  color: string;
  selected: boolean;
  strength: number;
  hardness: number;
}

/**
 * The 3D view. Owns the drum, the deformable head mesh, the stress shading,
 * the strike markers and the BVH ray-pick against the *deformed* surface.
 */
export class DrumScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;

  private container: HTMLElement;
  private callbacks: RendererCallbacks;

  private headMesh!: THREE.Mesh;
  private headGeom!: THREE.BufferGeometry;
  private headPos: Float32Array = new Float32Array(VERT_COUNT * 3);
  private headNrm: Float32Array = new Float32Array(VERT_COUNT * 3);
  private headCol: Float32Array = new Float32Array(VERT_COUNT * 3);
  private headMat!: THREE.MeshPhysicalMaterial;

  private wireMesh!: THREE.LineSegments;
  private wirePairIndices!: Uint32Array;
  private wirePos!: Float32Array;
  private wireCol!: Float32Array;

  private basePositions: Float32Array | null = null;
  private frameCache: Float32Array | null = null;
  private glowCache: Float32Array | null = null;

  private shellMat: THREE.MeshStandardMaterial;
  private shellMesh: THREE.Mesh | null = null;
  private hoopMesh: THREE.Mesh | null = null;
  private bearingRing: THREE.Mesh | null = null;
  private lugGroup = new THREE.Group();
  private rimMat: THREE.MeshStandardMaterial;

  private markerGroup = new THREE.Group();
  private markers = new Map<string, MarkerObj>();

  private hoverGroup = new THREE.Group();
  private hoverRing: THREE.Mesh;

  private bvh: MeshBVH | null = null;
  private bvhDirty = true;
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private pointerDownAt: { x: number; y: number } | null = null;

  private exaggeration = 9;
  private colorMode: ColorMode = 'stress';
  private wireVisible = true;
  private soloMode = false;
  private soloId: string | null = null;
  private perStrike = new Map<string, { disp: Float32Array; glow: Float32Array; glowMax: number }>();

  private currentFrame = 0;
  private currentTime = 0;
  private headRadiusMm = 177.8;

  private raf = 0;
  private disposed = false;
  private lastT = 0;
  private fpsAccum = 0;
  private fpsFrames = 0;
  private fps = 0;
  private raycastCount = 0;
  private bvhBuilds = 0;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private cameraTween = 0;
  private cameraFrom = new THREE.Vector3();
  private cameraTo = new THREE.Vector3();
  private targetFrom = new THREE.Vector3();
  private targetTo = new THREE.Vector3();

  constructor(container: HTMLElement, callbacks: RendererCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.68;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    const el = this.renderer.domElement;
    el.style.display = 'block';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.touchAction = 'none';
    container.appendChild(el);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(37, 1, 1, 8000);
    this.camera.position.set(0, 250, 330);

    this.controls = new OrbitControls(this.camera, el);
    this.controls.target.set(0, 8, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.085;
    this.controls.minDistance = 90;
    this.controls.maxDistance = 1500;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 0.85;
    this.controls.panSpeed = 0.7;

    // ---- lighting ---------------------------------------------------
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new RoomEnvironment();
    this.envRT = pmrem.fromScene(envScene, 0.045);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 0.26;
    pmrem.dispose();
    envScene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });

    const key = new THREE.DirectionalLight(0xfff2e2, 1.05);
    key.position.set(190, 420, 230);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 120;
    key.shadow.camera.far = 1100;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.5;
    const sc = key.shadow.camera as THREE.OrthographicCamera;
    sc.left = -280;
    sc.right = 280;
    sc.top = 280;
    sc.bottom = -280;
    sc.updateProjectionMatrix();
    this.scene.add(key);
    this.scene.add(key.target);

    const rimLight = new THREE.DirectionalLight(0x92b8ff, 0.6);
    rimLight.position.set(-240, 130, -260);
    this.scene.add(rimLight);

    const fill = new THREE.HemisphereLight(0xd3e2ff, 0x201a14, 0.26);
    this.scene.add(fill);

    const warm = new THREE.PointLight(0xffb066, 150, 900, 2);
    warm.position.set(-180, -60, 150);
    this.scene.add(warm);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1600, 64),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.32, transparent: true, depthWrite: false }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -170;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(2200, 44, 0x33405a, 0x1d2431);
    const gm = grid.material as THREE.Material;
    gm.transparent = true;
    gm.opacity = 0.42;
    grid.position.y = -169.4;
    this.scene.add(grid);

    // ---- head -------------------------------------------------------
    const data = makeHeadGeometryData();
    this.headPos = data.positions;
    this.headNrm = data.normals;
    this.headCol = data.colors;
    this.headGeom = new THREE.BufferGeometry();
    this.headGeom.setAttribute('position', new THREE.BufferAttribute(this.headPos, 3));
    this.headGeom.setAttribute('normal', new THREE.BufferAttribute(this.headNrm, 3));
    this.headGeom.setAttribute('color', new THREE.BufferAttribute(this.headCol, 3));
    this.headGeom.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2));
    this.headGeom.setIndex(new THREE.BufferAttribute(data.index, 1));
    this.headGeom.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 400);
    this.headGeom.boundingBox = new THREE.Box3(
      new THREE.Vector3(-300, -60, -300), new THREE.Vector3(300, 60, 300),
    );

    this.headMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.68,
      metalness: 0.0,
      clearcoat: 0.06,
      clearcoatRoughness: 0.7,
      sheen: 0.18,
      sheenRoughness: 0.85,
      sheenColor: new THREE.Color(0xfff4e4),
      side: THREE.DoubleSide,
      envMapIntensity: 0.9,
    });
    this.headMesh = new THREE.Mesh(this.headGeom, this.headMat);
    this.headMesh.castShadow = true;
    this.headMesh.receiveShadow = true;
    this.headMesh.frustumCulled = false;
    this.headMesh.name = 'head';
    this.scene.add(this.headMesh);

    // ---- wire overlay ----------------------------------------------
    const wire = this.buildWireEdges();
    this.wirePairIndices = new Uint32Array(wire.rings.length + wire.segs.length);
    this.wirePairIndices.set(wire.rings, 0);
    this.wirePairIndices.set(wire.segs, wire.rings.length);
    const nPairs = this.wirePairIndices.length;
    this.wirePos = new Float32Array(nPairs * 6);
    this.wireCol = new Float32Array(nPairs * 6);
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.BufferAttribute(this.wirePos, 3));
    wg.setAttribute('color', new THREE.BufferAttribute(this.wireCol, 3));
    wg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 400);
    const wm = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.wireMesh = new THREE.LineSegments(wg, wm);
    this.wireMesh.frustumCulled = false;
    this.wireMesh.renderOrder = 5;
    this.scene.add(this.wireMesh);

    // ---- shell ------------------------------------------------------
    this.shellMat = new THREE.MeshStandardMaterial({
      color: 0x4a2c1e, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide,
    });
    this.rimMat = new THREE.MeshStandardMaterial({ color: 0x3a2419, roughness: 0.55, metalness: 0.06 });
    this.scene.add(this.lugGroup);

    // ---- markers ----------------------------------------------------
    this.scene.add(this.markerGroup);
    this.hoverGroup.visible = false;
    this.scene.add(this.hoverGroup);
    const hg = new THREE.RingGeometry(3.2, 5.0, 36);
    this.hoverRing = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({
      color: 0xffcf7a, transparent: true, opacity: 0.85,
      side: THREE.DoubleSide, depthTest: false, depthWrite: false,
    }));
    this.hoverRing.renderOrder = 900;
    this.hoverGroup.add(this.hoverRing);

    this.bindEvents();
    this.resize();
    this.raf = requestAnimationFrame(this.loop);
  }

  /* ---------------------------------------------------------------- */

  /**
   * Sparse grid overlay: every third ring and every third segment. Drawing
   * every triangle edge turns the head into moiré noise.
   */
  private buildWireEdges(): { rings: Uint32Array; segs: Uint32Array } {
    const rings: number[] = [];
    const segs: number[] = [];
    const ringStep = 3;
    const segStep = 4;
    for (let r = 0; r <= RINGS; r += ringStep) {
      if (r === 0) continue;
      for (let j = 0; j < SEG; j++) rings.push(vertexIndex(r, j), vertexIndex(r, j + 1));
    }
    for (let r = 1; r <= RINGS; r++) {
      if (r % ringStep !== 0 && r !== RINGS) continue;
      for (let j = 0; j < SEG; j += segStep) segs.push(vertexIndex(r, j), vertexIndex(r + 1, j));
    }
    return { rings: new Uint32Array(rings), segs: new Uint32Array(segs) };
  }

  private bindEvents(): void {
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerleave', this.onPointerLeave);
    el.addEventListener('pointercancel', this.onPointerLeave);
    window.addEventListener('resize', this.resize);
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.pointerDownAt = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const start = this.pointerDownAt;
    this.pointerDownAt = null;
    if (!start) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7) return;
    const hit = this.pick(e);
    if (hit) this.callbacks.onPick(hit);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.pointerDownAt) {
      this.hoverGroup.visible = false;
      return;
    }
    const hit = this.pick(e);
    if (hit) {
      this.hoverGroup.visible = true;
      this.hoverGroup.position.set(hit.x, hit.y + 1.6, hit.z);
      this.hoverRing.quaternion.copy(this.camera.quaternion);
      this.hoverRing.scale.setScalar(1 + 0.1 * Math.sin(performance.now() * 0.005));
    } else {
      this.hoverGroup.visible = false;
    }
    this.callbacks.onHover(hit);
  };

  private onPointerLeave = () => {
    this.pointerDownAt = null;
    this.hoverGroup.visible = false;
    this.callbacks.onHover(null);
  };

  pick(e: PointerEvent): PickResult | null {
    if (!this.basePositions) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    this.pointerNdc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.ensureBVH();
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    this.raycaster.firstHitOnly = true;
    this.raycastCount += 1;
    const hits = this.raycaster.intersectObject(this.headMesh, false);
    if (!hits.length) return null;
    const p = hits[0].point;
    const aMm = this.headRadiusMm;
    const rho = Math.hypot(p.x, p.z) / aMm;
    if (rho > 1.0) return null;
    return {
      rho: Math.min(0.985, Math.max(0.02, rho)),
      theta: Math.atan2(p.z, p.x),
      x: p.x,
      y: p.y,
      z: p.z,
    };
  }

  /**
   * BVH for picking. Built once per head topology, then refitted to the
   * current deformed vertex positions - a refit is ~1 ms, a rebuild ~20 ms,
   * and the pick has to stay accurate on the deformed surface.
   */
  private ensureBVH(): void {
    if (!this.headGeom.attributes.position) return;
    if (!this.bvh) {
      this.bvh = new MeshBVH(this.headGeom, { maxDepth: 40, targetLeafSize: 14 });
      this.headGeom.boundsTree = this.bvh;
      this.bvhDirty = false;
      this.bvhBuilds += 1;
      return;
    }
    if (!this.bvhDirty) return;
    this.headGeom.computeBoundingSphere();
    this.bvh.refit();
    this.bvhDirty = false;
    this.bvhBuilds += 1;
  }

  /* ---------------------------------------------------------------- */

  /** New resting geometry (tension / size / material changed). */
  setHead(basePositions: Float32Array, config: DrumConfig): void {
    this.basePositions = basePositions;
    this.headRadiusMm = config.diameterIn * 25.4 / 2;
    this.frameCache = null;
    this.perStrike.clear();
    this.buildShell(config);
    this.resetCamera(config);
    this.applyFrame(0, 0);
  }

  /** New frame stack for the current tension setting. */
  setFrames(
    disp: Float32Array,
    frameCount: number,
    glow: Float32Array,
    maxGlow: number,
    perStrike: Array<{ id: string; disp: Float32Array; glow: Float32Array }>,
  ): void {
    this.frameCache = disp;
    this.glowCache = glow;
    this.maxGlow = Math.max(0.5, maxGlow);
    this.frameCount = frameCount;
    this.perStrike.clear();
    for (const p of perStrike) {
      let gm = 0.5;
      for (let i = 0; i < p.glow.length; i++) if (p.glow[i] > gm) gm = p.glow[i];
      this.perStrike.set(p.id, { disp: p.disp, glow: p.glow, glowMax: gm });
    }
    this.applyFrame(this.currentFrame, this.currentTime);
  }

  private maxGlow = 1;
  private activeGlowMax = 1;
  private frameCount = 0;

  setStrikes(markers: StrikeMarkerData[]): void {
    const seen = new Set<string>();
    for (const m of markers) {
      seen.add(m.id);
      let mk = this.markers.get(m.id);
      if (!mk) {
        mk = this.createMarker();
        mk.group.scale.setScalar(this.markerScale);
        this.markers.set(m.id, mk);
        this.markerGroup.add(mk.group);
      }
      const color = new THREE.Color(m.color);
      mk.color = color;
      (mk.ring.material as THREE.MeshBasicMaterial).color.copy(color);
      (mk.dot.material as THREE.MeshBasicMaterial).color.copy(color);
      (mk.stem.material as THREE.LineBasicMaterial).color.copy(color);
      (mk.outer.material as THREE.MeshBasicMaterial).color.copy(color);
      mk.rho = m.rho;
      mk.theta = m.theta;
      mk.selected = m.selected;
      const sx = Math.cos(m.theta) * m.rho * this.headRadiusMm;
      const sz = Math.sin(m.theta) * m.rho * this.headRadiusMm;
      mk.group.position.set(sx, 0, sz);
      mk.ring.scale.setScalar(m.selected ? 1.28 : 1.0);
      (mk.outer.material as THREE.MeshBasicMaterial).opacity = m.selected ? 0.55 : 0.22;
      mk.selected = m.selected;
    }
    for (const [id, mk] of this.markers) {
      if (seen.has(id)) continue;
      this.markerGroup.remove(mk.group);
      mk.group.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      this.markers.delete(id);
    }
    this.applyFrame(this.currentFrame, this.currentTime);
  }

  private createMarker(): MarkerObj {
    const group = new THREE.Group();
    const mk = (opacity: number) => new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity,
      side: THREE.DoubleSide, depthTest: false, depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(6.2, 8.6, 44), mk(0.98));
    ring.rotation.x = -Math.PI / 2;
    ring.renderOrder = 960;
    group.add(ring);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(2.7, 24), mk(0.98));
    dot.rotation.x = -Math.PI / 2;
    dot.renderOrder = 961;
    group.add(dot);
    const outer = new THREE.Mesh(new THREE.RingGeometry(12.4, 13.3, 44), mk(0.24));
    outer.rotation.x = -Math.PI / 2;
    outer.renderOrder = 959;
    group.add(outer);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const stem = new THREE.Line(sg, new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false,
    }));
    stem.renderOrder = 958;
    group.add(stem);
    return {
      group, ring, dot, outer, stem,
      color: new THREE.Color(0xffffff), rho: 0, theta: 0, selected: false,
    };
  }

  private buildShell(config: DrumConfig): void {
    const finish = FINISHES[config.finishId];
    const diamMm = config.diameterIn * 25.4;
    const depthMm = config.depthIn * 25.4;
    const R = diamMm / 2 + 2.6;

    this.shellMat.color.set(finish.color);
    this.shellMat.roughness = finish.roughness;
    this.shellMat.metalness = finish.metalness;
    this.rimMat.color.set(finish.color);
    this.rimMat.roughness = Math.min(0.9, finish.roughness * 1.15);
    this.rimMat.metalness = finish.metalness;

    if (!this.shellMesh) {
      this.shellMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.shellMat);
      this.shellMesh.receiveShadow = true;
      this.shellMesh.castShadow = true;
      this.scene.add(this.shellMesh);
    }
    const prof: THREE.Vector2[] = [];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      // slight flare at the bottom, then a soft chamfer
      const rr = R * (1 + 0.016 * u * u);
      prof.push(new THREE.Vector2(rr, -depthMm * u));
    }
    this.shellMesh.geometry.dispose();
    this.shellMesh.geometry = new THREE.LatheGeometry(prof, 108);
    this.shellMesh.geometry.computeVertexNormals();

    if (!this.rimMesh) {
      this.rimMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.rimMat);
      this.rimMesh.castShadow = true;
      this.rimMesh.receiveShadow = true;
      this.scene.add(this.rimMesh);
    }
    this.rimMesh.geometry.dispose();
    this.rimMesh.geometry = new THREE.TorusGeometry(R - 0.4, 5.2, 14, 108);
    this.rimMesh.rotation.x = Math.PI / 2;
    this.rimMesh.position.y = -2.6;

    // chrome bearing-edge ring under the head
    if (!this.hoopMesh) {
      this.hoopMesh = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshStandardMaterial({ color: 0xb9c2cd, roughness: 0.26, metalness: 0.92 }),
      );
      this.hoopMesh.castShadow = true;
      this.scene.add(this.hoopMesh);
    }
    this.hoopMesh.geometry.dispose();
    this.hoopMesh.geometry = new THREE.TorusGeometry(R - 1.1, 2.4, 12, 108);
    this.hoopMesh.rotation.x = Math.PI / 2;
    this.hoopMesh.position.y = -0.9;

    if (!this.bearingRing) {
      this.bearingRing = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshStandardMaterial({ color: 0xc9d1da, roughness: 0.35, metalness: 0.8 }),
      );
      this.bearingRing.receiveShadow = true;
      this.scene.add(this.bearingRing);
    }
    this.bearingRing.geometry.dispose();
    this.bearingRing.geometry = new THREE.CylinderGeometry(R - 0.7, R - 0.7, 1.4, 108, 1, true);
    this.bearingRing.position.y = -1.6;

    // lugs + rods
    while (this.lugGroup.children.length) {
      const c = this.lugGroup.children.pop()!;
      this.lugGroup.remove(c);
      c.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
    }
    const chrome = new THREE.MeshStandardMaterial({ color: 0xcdd5df, roughness: 0.22, metalness: 0.96 });
    const lugMat = new THREE.MeshStandardMaterial({ color: 0xb7bfc9, roughness: 0.3, metalness: 0.9 });
    const lugCount = 8;
    for (let i = 0; i < lugCount; i++) {
      const th = (i / lugCount) * Math.PI * 2;
      const x = Math.cos(th) * (R + 4.2);
      const z = Math.sin(th) * (R + 4.2);
      const lug = new THREE.Mesh(new THREE.CapsuleGeometry(3.6, depthMm * 0.38, 3, 10), lugMat);
      lug.position.set(x, -depthMm * 0.38, z);
      lug.rotation.y = -th;
      lug.castShadow = true;
      this.lugGroup.add(lug);

      const nut = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 2.8, 10), chrome);
      nut.position.set(x, 1.6, z);
      nut.castShadow = true;
      this.lugGroup.add(nut);
    }

    this.scene.fog = new THREE.Fog(0x0c0f15, diamMm * 4.5, diamMm * 14);

    // Markers keep a constant on-screen footprint relative to the head.
    const markerScale = diamMm / (14 * 25.4);
    for (const [, mk] of this.markers) mk.group.scale.setScalar(markerScale);
    this.markerScale = markerScale;
  }

  private rimMesh: THREE.Mesh | null = null;
  private markerScale = 1;

  private resetCamera(config: DrumConfig): void {
    const d = config.diameterIn * 25.4;
    this.cameraFrom.copy(this.camera.position);
    this.targetFrom.copy(this.controls.target);
    this.cameraTo.set(d * 0.5, d * 1.55 + 150, d * 1.85 + 175);
    this.targetTo.set(0, 6, 0);
    this.cameraTween = 1;
    this.controls.minDistance = d * 0.5;
    this.controls.maxDistance = d * 4.6 + 460;
  }

  /* ---------------------------------------------------------------- */

  setExaggeration(v: number): void {
    if (this.exaggeration === v) return;
    this.exaggeration = v;
  }

  setColorMode(m: ColorMode): void {
    if (this.colorMode === m) return;
    this.colorMode = m;
  }

  setWireVisible(v: boolean): void {
    this.wireVisible = v;
    this.wireMesh.visible = v;
  }

  setSolo(active: boolean, id: string | null): void {
    this.soloMode = active;
    this.soloId = id;
  }

  /* ---------------------------------------------------------------- */

  private headBaseColor: [number, number, number] = [0.9, 0.86, 0.78];

  setHeadMaterial(config: DrumConfig): void {
    const mat = MATERIALS[config.materialId];
    const c = new THREE.Color(mat.headColor);
    this.headBaseColor = [c.r, c.g, c.b];
    this.headMat.roughness = mat.headRoughness;
    this.headMat.clearcoat = mat.headClearcoat;
    this.headMat.sheen = mat.headSheen;
    this.headMat.needsUpdate = true;
  }

  // Frame state
  applyFrame(frame: number, time: number): void {
    if (!this.basePositions) return;
    const V = VERT_COUNT;
    const f = Math.max(0, Math.min(Math.max(0, this.frameCount - 1), frame | 0));
    this.currentFrame = f;
    this.currentTime = time;

    let disp = this.frameCache;
    let glow = this.glowCache;
    this.activeGlowMax = this.maxGlow;
    if (this.soloMode && this.soloId) {
      const p = this.perStrike.get(this.soloId);
      if (p) {
        disp = p.disp;
        glow = p.glow;
        this.activeGlowMax = p.glowMax;
      }
    }
    const base = this.basePositions;
    const exag = this.exaggeration;
    const pos = this.headPos;
    const off = f * V;

    if (disp) {
      for (let v = 0; v < V; v++) {
        pos[v * 3] = base[v * 3];
        pos[v * 3 + 1] = base[v * 3 + 1] + disp[off + v] * exag;
        pos[v * 3 + 2] = base[v * 3 + 2];
      }
    } else {
      for (let i = 0; i < pos.length; i++) pos[i] = base[i];
    }
    this.headGeom.attributes.position.needsUpdate = true;

    computeGridNormals(this.headPos, this.headNrm);
    this.headGeom.attributes.normal.needsUpdate = true;

    this.paintColors(f, glow, disp);
    this.headGeom.attributes.color.needsUpdate = true;

    this.updateMarkers(f, disp);
    this.updateWire(f, glow);
    this.bvhDirty = true;
  }

  private paintColors(f: number, glow: Float32Array | null, disp: Float32Array | null): void {
    const V = VERT_COUNT;
    const col = this.headCol;
    const off = f * V;
    if (this.colorMode === 'plain' || !disp) {
      const b = this.headBaseColor;
      for (let v = 0; v < V; v++) {
        col[v * 3] = b[0];
        col[v * 3 + 1] = b[1];
        col[v * 3 + 2] = b[2];
      }
      return;
    }
    if (this.colorMode === 'displacement') {
      let scale = 1e-3;
      for (let v = 0; v < V; v++) {
        const a = Math.abs(disp[off + v]);
        if (a > scale) scale = a;
      }
      const inv = 1 / scale;
      const b0 = this.headBaseColor;
      for (let v = 0; v < V; v++) {
        const d = disp[off + v];
        const t = Math.pow(Math.min(1, Math.abs(d) * inv), 0.8);
        // signed: cool blue for downward motion, warm amber for upward, and
        // the resting head keeps its own tone so the sign of motion reads.
        let r: number;
        let g: number;
        let b: number;
        if (d < 0) {
          r = 0.1 + 0.18 * (1 - t);
          g = 0.3 + 0.5 * t;
          b = 0.62 + 0.33 * t;
        } else {
          r = 0.88 + 0.1 * t;
          g = 0.4 + 0.55 * t;
          b = 0.16 + 0.5 * t;
        }
        col[v * 3] = b0[0] * (1 - t) + srgbToLinear(r) * t;
        col[v * 3 + 1] = b0[1] * (1 - t) + srgbToLinear(g) * t;
        col[v * 3 + 2] = b0[2] * (1 - t) + srgbToLinear(b) * t;
      }
      return;
    }
    // stress: colour the smoothed dynamic rise above the resting field, so
    // the pre-tension (which is everywhere) does not wash the head out and
    // local concentrations still read at a glance.
    if (!glow) return;
    const inv = 1 / (this.activeGlowMax || 1);
    const b = this.headBaseColor;
    const rgb: [number, number, number] = [0, 0, 0];
    for (let v = 0; v < V; v++) {
      // Tint the cream head with the stress ramp, driven by the smoothed
      // dynamic rise over the resting field. Quiet skin stays cream; the
      // broad wave field shows as cool bands and the concentrations run up
      // the ramp into amber, red and white hot.
      const g = Math.min(1, Math.max(0, glow[off + v] * inv));
      const gg = Math.pow(g, 0.62);
      const t = smoothstep(0.1, 0.9, gg);
      stressColor(t, rgb);
      const w = smoothstep(0.04, 0.3, gg);
      col[v * 3] = b[0] * (1 - w) + srgbToLinear(rgb[0]) * w;
      col[v * 3 + 1] = b[1] * (1 - w) + srgbToLinear(rgb[1]) * w;
      col[v * 3 + 2] = b[2] * (1 - w) + srgbToLinear(rgb[2]) * w;
    }
  }

  private updateMarkers(f: number, disp: Float32Array | null): void {
    const V = VERT_COUNT;
    const base = this.basePositions;
    if (!base) return;
    const exag = this.exaggeration;
    for (const [, mk] of this.markers) {
      const ring = Math.max(1, Math.min(RINGS, Math.round(mk.rho * RINGS)));
      const j = wrapJ(Math.round((mk.theta / (Math.PI * 2)) * SEG));
      const vi = vertexIndex(ring, j);
      const d = disp ? disp[f * V + vi] : 0;
      const y = base[vi * 3 + 1] + d * exag + 0.9;
      mk.group.position.set(base[vi * 3], y, base[vi * 3 + 2]);
      // Rings lie on the (nearly flat) head surface, like a target drawn on
      // the skin rather than a badge floating in front of it.
      mk.ring.rotation.set(-Math.PI / 2, 0, 0);
      mk.dot.rotation.set(-Math.PI / 2, 0, 0);
      mk.outer.rotation.set(-Math.PI / 2, 0, 0);
      const sp = mk.stem.geometry.attributes.position.array as Float32Array;
      sp[0] = base[vi * 3];
      sp[1] = y + 0.4;
      sp[2] = base[vi * 3 + 2];
      sp[3] = base[vi * 3];
      sp[4] = y + 26;
      sp[5] = base[vi * 3 + 2];
      mk.stem.geometry.attributes.position.needsUpdate = true;
    }
  }

  private updateWire(f: number, glow: Float32Array | null): void {
    if (!this.wireVisible) return;
    const pairs = this.wirePairIndices;
    const pos = this.wirePos;
    const col = this.wireCol;
    const self = this.headPos;
    const V = VERT_COUNT;
    const off = f * V;
    const inv = 1 / (this.activeGlowMax || 1);
    for (let p = 0, n = pairs.length / 2; p < n; p++) {
      const a = pairs[p * 2];
      const b = pairs[p * 2 + 1];
      const o = p * 6;
      pos[o] = self[a * 3];
      pos[o + 1] = self[a * 3 + 1] + 0.5;
      pos[o + 2] = self[a * 3 + 2];
      pos[o + 3] = self[b * 3];
      pos[o + 4] = self[b * 3 + 1] + 0.5;
      pos[o + 5] = self[b * 3 + 2];
      let t = 0;
      if (glow) t = Math.pow(Math.min(1, Math.max(0, glow[off + a] * inv * 1.6)), 0.5);
      // cool = dim slate, hot = bright amber
      col[o] = 0.1 + 0.55 * t;
      col[o + 1] = 0.14 + 0.3 * t * t;
      col[o + 2] = 0.22 * (1 - t);
      col[o + 3] = col[o];
      col[o + 4] = col[o + 1];
      col[o + 5] = col[o + 2];
    }
    this.wireMesh.geometry.attributes.position.needsUpdate = true;
    this.wireMesh.geometry.attributes.color.needsUpdate = true;
  }

  /* ---------------------------------------------------------------- */

  private loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = this.lastT ? Math.min(0.08, (now - this.lastT) / 1000) : 0.016;
    this.lastT = now;

    if (this.cameraTween > 0) {
      this.cameraTween = Math.max(0, this.cameraTween - dt * 0.9);
      const k = 1 - Math.pow(this.cameraTween, 2.4);
      this.camera.position.lerpVectors(this.cameraFrom, this.cameraTo, k);
      this.controls.target.lerpVectors(this.targetFrom, this.targetTo, k);
    }

    this.controls.update();
    if (this.hoverGroup.visible) {
      this.hoverRing.scale.setScalar(1 + 0.08 * Math.sin(now * 0.005));
      this.hoverRing.quaternion.copy(this.camera.quaternion);
    }
    this.renderer.render(this.scene, this.camera);

    this.fpsAccum += dt;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.5) {
      this.fps = this.fpsFrames / this.fpsAccum;
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }
  };

  stats(): SceneStats {
    return {
      fps: this.fps,
      raycasts: this.raycastCount,
      bvhBuilds: this.bvhBuilds,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
    };
  }

  resize = () => {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerleave', this.onPointerLeave);
    el.removeEventListener('pointercancel', this.onPointerLeave);
    window.removeEventListener('resize', this.resize);
    this.controls.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.LineSegments) {
        o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else (m as THREE.Material).dispose();
      }
    });
    this.envRT?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a || 1e-6)));
  return t * t * (3 - 2 * t);
}

interface MarkerObj {
  group: THREE.Group;
  ring: THREE.Mesh;
  dot: THREE.Mesh;
  outer: THREE.Mesh;
  stem: THREE.Line;
  color: THREE.Color;
  rho: number;
  theta: number;
  selected: boolean;
}

