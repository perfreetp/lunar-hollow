/**
 * GearScene.js —— three.js 场景
 *
 * 职责：
 *  - 正交相机 + 网格底板 + 灯光阴影
 *  - 齿轮实例化与差异更新（齿数变了才重建几何）
 *  - 深度分层：啮合件同层、重叠件异层，z 轴错开并加衬套/轴杆表达前后遮挡
 *  - 每帧从 store 快照读取全链角度，同步写入 rotation（整链同帧更新）
 *  - 射线拾取 + 网格吸附拖拽
 */
import * as THREE from 'three';
import { GRID, gearWorldPos } from './gearMath.js';
import { buildGearMesh, buildHub, buildAxle } from './gearGeometry.js';
import { frameAngles } from './store.js';

const GEAR_DEPTH = 0.9;
const LAYER_GAP = 1.7;          // 相邻层 z 间距，大于齿厚保证前后不穿插
const BOARD_Z = -3.2;

const COLORS = [0xd98e3b, 0x4f86c6, 0x5fa65a, 0xb65b6b, 0x8e6fc0, 0xc9a227];

export class GearScene {
  constructor(container, { onSelect, onMove, onDropLibrary } = {}) {
    this.container = container;
    this.cb = { onSelect, onMove, onDropLibrary };
    this.items = new Map();     // id -> {group, gear, hub, mesh, z, colorIdx}
    this.colorIdx = 0;
    this.disposed = false;

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1d2430);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    this.camera.position.set(0, -6, 34);
    this.camera.lookAt(0, 0, 0);

    const amb = new THREE.AmbientLight(0xffffff, 0.55);
    const key = new THREE.DirectionalLight(0xfff2dd, 1.1);
    key.position.set(12, -14, 26);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -40;
    key.shadow.camera.right = 40;
    key.shadow.camera.top = 40;
    key.shadow.camera.bottom = -40;
    const fill = new THREE.DirectionalLight(0x88aaff, 0.35);
    fill.position.set(-16, 10, 18);
    this.scene.add(amb, key, fill);

    // 底板
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 90),
      new THREE.MeshStandardMaterial({ color: 0x26303f, roughness: 0.95 })
    );
    board.position.z = BOARD_Z;
    board.receiveShadow = true;
    this.scene.add(board);
    this.board = board;

    this.grid = new THREE.GridHelper(120, 120, 0x3d4c63, 0x2e3a4d);
    this.grid.rotation.x = Math.PI / 2;
    this.grid.position.z = BOARD_Z + 0.01;
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.5;
    this.scene.add(this.grid);

    this.axleLayer = new THREE.Group();
    this.gearLayer = new THREE.Group();
    this.scene.add(this.axleLayer, this.gearLayer);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.drag = null; // {id, offsetX, offsetY}

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: new URLSearchParams(globalThis.location?.search ?? '').has('capture')
    });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this._onDown = this._handleDown.bind(this);
    this._onMove = this._handleMove.bind(this);
    this._onUp = this._handleUp.bind(this);
    this._onResize = this._resize.bind(this);
    this._onDrop = this._handleDrop.bind(this);
    this._onDragOver = (e) => e.preventDefault();
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this._onDown);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    el.addEventListener('drop', this._onDrop);
    el.addEventListener('dragover', this._onDragOver);
    window.addEventListener('resize', this._onResize);

    this._resize();
    this._loop = this._tick.bind(this);
    this.renderer.setAnimationLoop(this._loop);
  }

  /* ---------- 视口 ---------- */
  _resize() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    const aspect = w / h;
    const viewH = 46;
    this.camera.left = (-viewH * aspect) / 2;
    this.camera.right = (viewH * aspect) / 2;
    this.camera.top = viewH / 2;
    this.camera.bottom = -viewH / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /* ---------- 状态同步（store 订阅时调用） ---------- */
  sync(state) {
    this.state = state;
    const ids = new Set(state.gears.map((g) => g.id));

    // 删除
    for (const [id, item] of this.items) {
      if (!ids.has(id)) {
        this.gearLayer.remove(item.group);
        item.mesh.geometry.dispose();
        this.items.delete(id);
      }
    }

    // 新增 / 更新
    for (const g of state.gears) {
      let item = this.items.get(g.id);
      const layer = state.snapshot.layers.get(g.id) ?? 0;
      const z = layer * LAYER_GAP;
      if (!item) {
        item = this._createItem(g, z);
        this.items.set(g.id, item);
        this.gearLayer.add(item.group);
      } else if (item.teeth !== g.teeth) {
        this._rebuildGeometry(item, g);
      }
      item.teeth = g.teeth;
      item.layer = layer;
      const p = gearWorldPos(g);
      item.group.position.set(p.x, p.y, z);
      item.hub.position.z = GEAR_DEPTH / 2 + 0.12;
      this._applyHighlight(item, state, g);
    }

    this._rebuildAxles(state);
  }

  _createItem(gear, z) {
    const color = COLORS[this.colorIdx++ % COLORS.length];
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.35
    });
    const mesh = buildGearMesh(gear.teeth, GEAR_DEPTH, mat);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x9aa7b8, roughness: 0.3, metalness: 0.7 });
    const hub = buildHub(gear.teeth, GEAR_DEPTH, hubMat);
    const group = new THREE.Group();
    group.add(mesh, hub);
    group.__gearId = gear.id;
    const p = gearWorldPos(gear);
    group.position.set(p.x, p.y, z);
    return { group, mesh, hub, mat, color, teeth: gear.teeth, layer: 0 };
  }

  _rebuildGeometry(item, gear) {
    const old = item.mesh;
    item.group.remove(old);
    old.geometry.dispose();
    item.mesh = buildGearMesh(gear.teeth, GEAR_DEPTH, item.mat);
    item.group.add(item.mesh);
  }

  _applyHighlight(item, state, gear) {
    const isSelected = state.selectedId === gear.id;
    const isDriver = state.driverId === gear.id;
    if (isSelected) {
      item.mat.emissive = new THREE.Color(0x3a5fa8);
      item.mat.emissiveIntensity = 0.55;
    } else if (isDriver) {
      item.mat.emissive = new THREE.Color(0x8a5a12);
      item.mat.emissiveIntensity = 0.45;
    } else {
      item.mat.emissive = new THREE.Color(0x000000);
      item.mat.emissiveIntensity = 0;
    }
  }

  /** 轴杆：每个齿轮位置一根，贯穿到底板上方，表达轴心与前后穿插 */
  _rebuildAxles(state) {
    while (this.axleLayer.children.length) {
      const c = this.axleLayer.children.pop();
      c.geometry.dispose();
    }
    const mat = new THREE.MeshStandardMaterial({ color: 0xc7d2e0, roughness: 0.25, metalness: 0.85 });
    const maxLayer = state.snapshot.layers
      ? Math.max(0, ...[...state.snapshot.layers.values()])
      : 0;
    const topZ = (maxLayer + 1) * LAYER_GAP;
    for (const g of state.gears) {
      const axle = buildAxle(topZ - BOARD_Z, mat);
      const p = gearWorldPos(g);
      axle.position.set(p.x, p.y, (topZ + BOARD_Z) / 2);
      this.axleLayer.add(axle);
    }
  }

  /* ---------- 每帧：整链角度同步写入 ---------- */
  _tick() {
    if (this.disposed || !this.state) return;
    const angles = frameAngles(this.state);
    for (const [id, item] of this.items) {
      const a = angles.get(id);
      if (a !== undefined) item.group.rotation.z = a;
    }
    this.renderer.render(this.scene, this.camera);
  }

  /* ---------- 拾取与拖拽 ---------- */
  _toWorld(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.board, false);
    return hit[0] ? hit[0].point : null;
  }

  _pickGear(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const groups = [...this.items.values()].map((i) => i.group);
    const hits = this.raycaster.intersectObjects(groups, true);
    if (!hits.length) return null;
    let obj = hits[0].object;
    while (obj && obj.__gearId === undefined) obj = obj.parent;
    return obj ? obj.__gearId : null;
  }

  _handleDown(e) {
    const id = this._pickGear(e);
    if (!id) {
      this.cb.onSelect?.(null);
      return;
    }
    this.cb.onSelect?.(id);
    const p = this._toWorld(e);
    const item = this.items.get(id);
    if (p && item) {
      this.drag = {
        id,
        offsetX: p.x - item.group.position.x,
        offsetY: p.y - item.group.position.y
      };
    }
  }

  _handleMove(e) {
    if (!this.drag) return;
    const p = this._toWorld(e);
    if (!p) return;
    const gx = Math.round((p.x - this.drag.offsetX) / GRID);
    const gy = Math.round((p.y - this.drag.offsetY) / GRID);
    this.cb.onMove?.(this.drag.id, gx, gy);
  }

  _handleUp() {
    this.drag = null;
  }

  /** 从齿轮库拖放到画布：落点吸附网格 */
  _handleDrop(e) {
    e.preventDefault();
    const teeth = Number(e.dataTransfer.getData('text/gear-teeth'));
    if (!teeth) return;
    const p = this._toWorld(e);
    if (!p) return;
    const gx = Math.round(p.x / GRID);
    const gy = Math.round(p.y / GRID);
    this.cb.onDropLibrary?.(teeth, gx, gy);
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this._onDown);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    el.removeEventListener('drop', this._onDrop);
    el.removeEventListener('dragover', this._onDragOver);
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    el.remove();
  }
}
