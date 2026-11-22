// 拼装台场景管理:渲染、拾取、拖拽吸附、碰撞高亮、透明深度排序
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  STUD_PITCH,
  PLATE_HEIGHT,
  BASE_PLATE_SIZE,
  PLATE_WORLD_HALF,
  getBlockType,
  getColor,
  footprintCells,
  footprintSize,
  gridToWorld,
} from '../engine/constants.js';
import { SpatialHash } from '../engine/spatialHash.js';
import { analyzeBlock } from '../engine/collision.js';
import { snapToGrid } from '../engine/snapping.js';
import { getBlockGeometry, getMaterial, EDGE_MATERIALS } from './geometry.js';

const DRAG_LIFT = 6; // 拖拽时抬升高度
const NDC = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const planeHit = new THREE.Vector3();

export class SceneManager {
  constructor(container, { onStats, onSelect, onDrop } = {}) {
    this.container = container;
    this.onStats = onStats ?? (() => {});
    this.onSelect = onSelect ?? (() => {});
    this.onDrop = onDrop ?? (() => {});

    this.blocks = [];
    this.hash = new SpatialHash();
    this.blockMeshes = new Map(); // blockId -> { group, mesh, edge, block }
    this._transparentEntries = []; // 透明块缓存,供逐帧深度排序
    this.conflictMarkers = new Map(); // key -> mesh
    this.selectedId = null;
    this.warnIds = new Set();
    this.snapThreshold = 1;
    this.minBiteFaces = 1;
    this.drag = null;

    this._initRenderer();
    this._initScene();
    this._initBasePlate();
    this._initInteraction();

    this._tick = this._tick.bind(this);
    this.renderer.setAnimationLoop(this._tick);
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1f26);
    this.scene.fog = new THREE.Fog(0x1a1f26, 900, 1900);

    this.camera = new THREE.PerspectiveCamera(
      50,
      this.container.clientWidth / this.container.clientHeight,
      1,
      4000
    );
    this.camera.position.set(380, 340, 460);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minDistance = 120;
    this.controls.maxDistance = 1200;
    this.controls.target.set(0, 10, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x33404d, 0.85);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.6);
    dir.position.set(320, 520, 240);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    const s = PLATE_WORLD_HALF * 1.25;
    dir.shadow.camera.left = -s;
    dir.shadow.camera.right = s;
    dir.shadow.camera.top = s;
    dir.shadow.camera.bottom = -s;
    dir.shadow.camera.far = 1400;
    this.scene.add(dir);
  }

  _initBasePlate() {
    const size = BASE_PLATE_SIZE * STUD_PITCH;
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(size, PLATE_HEIGHT, size),
      new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 })
    );
    plate.position.y = -PLATE_HEIGHT / 2;
    plate.receiveShadow = true;
    this.scene.add(plate);

    // 台面凸点(InstancedMesh,固定成本不随积木数增长)
    const studGeo = new THREE.CylinderGeometry(
      6,
      6,
      3,
      12
    );
    const studMat = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.7 });
    const n = BASE_PLATE_SIZE;
    const studs = new THREE.InstancedMesh(studGeo, studMat, n * n);
    const m = new THREE.Matrix4();
    let k = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        m.setPosition(
          -PLATE_WORLD_HALF + (i + 0.5) * STUD_PITCH,
          1.5,
          -PLATE_WORLD_HALF + (j + 0.5) * STUD_PITCH
        );
        studs.setMatrixAt(k++, m);
      }
    }
    studs.receiveShadow = true;
    this.scene.add(studs);

    const grid = new THREE.GridHelper(size, n, 0x66bb6a, 0x4a5c50);
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    grid.position.y = 0.05;
    this.scene.add(grid);
  }

  // ---------- 积木增删 ----------

  addBlock(block) {
    this.blocks.push(block);
    this.hash.add(block);
    this._createMesh(block);
    this.refreshAnalysis();
  }

  removeBlock(blockId) {
    const idx = this.blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const [block] = this.blocks.splice(idx, 1);
    this._disposeMesh(blockId);
    this.rebuildHash();
    if (this.selectedId === blockId) this.setSelected(null);
    this.refreshAnalysis();
    return block;
  }

  clearBlocks() {
    for (const id of [...this.blockMeshes.keys()]) this._disposeMesh(id);
    this.blocks = [];
    this.rebuildHash();
    this.setSelected(null);
    this.refreshAnalysis();
  }

  // 批量加载(导入方案/压力测试):一次性建哈希,避免逐块重复分析
  loadBlocks(blocks) {
    for (const id of [...this.blockMeshes.keys()]) this._disposeMesh(id);
    this.blocks = [...blocks];
    this.setSelected(null);
    this.rebuildHash();
    for (const b of this.blocks) this._createMesh(b);
    this.refreshAnalysis();
  }

  getBlocks() {
    return this.blocks;
  }

  _createMesh(block) {
    const type = getBlockType(block.typeId);
    const colorDef = getColor(block.colorId);
    const { geometry, edges } = getBlockGeometry(type);
    const material = getMaterial(colorDef);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = !colorDef.transparent;
    mesh.receiveShadow = true;
    mesh.userData.blockId = block.id;

    const edge = new THREE.LineSegments(edges, EDGE_MATERIALS.select);
    edge.visible = false;

    const group = new THREE.Group();
    group.add(mesh);
    group.add(edge);
    this.scene.add(group);

    this.blockMeshes.set(block.id, { group, mesh, edge, block });
    if (colorDef.transparent) this._transparentEntries.push({ group, mesh, edge, block });
    this._applyTransform(block);
  }

  _disposeMesh(blockId) {
    const entry = this.blockMeshes.get(blockId);
    if (!entry) return;
    this.scene.remove(entry.group);
    this.blockMeshes.delete(blockId);
    this._transparentEntries = this._transparentEntries.filter((e) => e !== entry);
  }

  _applyTransform(block) {
    const entry = this.blockMeshes.get(block.id);
    if (!entry) return;
    const world = gridToWorld(block);
    entry.group.position.set(world.x, world.y, world.z);
    entry.group.rotation.y = (-block.rot * Math.PI) / 2;
  }

  rebuildHash() {
    this.hash = new SpatialHash();
    for (const b of this.blocks) this.hash.add(b);
  }

  // ---------- 碰撞分析与高亮 ----------

  refreshAnalysis() {
    this.conflictIds = new Set();
    const conflictsByCell = new Map(); // "gx,gy,z" -> z(下层顶面)
    const perBlock = new Map();

    for (const block of this.blocks) {
      const result = analyzeBlock(block, this.hash);
      perBlock.set(block.id, result);
      if (result.collisions.length > 0) this.conflictIds.add(block.id);

      for (const col of result.collisions) {
        const other = this.blocks.find((b) => b.id === col.blockId);
        const lowerZ = Math.min(block.z, other.z);
        for (const c of col.cells) {
          conflictsByCell.set(`${c.gx},${c.gy},${lowerZ}`, { ...c, z: lowerZ });
        }
      }
    }

    this.analysis = perBlock;
    this._updateEdgeStates();
    this._updateConflictMarkers(conflictsByCell);
    this.onStats(this._buildStats(perBlock));
    return perBlock;
  }

  _updateEdgeStates() {
    for (const [id, entry] of this.blockMeshes) {
      let edgeMat = null;
      if (this.conflictIds?.has(id)) edgeMat = EDGE_MATERIALS.conflict;
      else if (id === this.selectedId) edgeMat = EDGE_MATERIALS.select;
      else if (this.warnIds.has(id)) edgeMat = EDGE_MATERIALS.warn;
      if (edgeMat) {
        entry.edge.material = edgeMat;
        entry.edge.visible = true;
      } else {
        entry.edge.visible = false;
      }
    }
  }

  _updateConflictMarkers(cellMap) {
    const alive = new Set();
    for (const [key, cell] of cellMap) {
      alive.add(key);
      let marker = this.conflictMarkers.get(key);
      if (!marker) {
        const geo = new THREE.CylinderGeometry(STUD_PITCH * 0.42, STUD_PITCH * 0.42, 2.4, 20);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xff1744,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        });
        marker = new THREE.Mesh(geo, mat);
        marker.renderOrder = 20;
        this.scene.add(marker);
        this.conflictMarkers.set(key, marker);
      }
      marker.position.set(
        -PLATE_WORLD_HALF + (cell.gx + 0.5) * STUD_PITCH,
        cell.z * PLATE_HEIGHT + 1.2,
        -PLATE_WORLD_HALF + (cell.gy + 0.5) * STUD_PITCH
      );
    }
    for (const [key, marker] of this.conflictMarkers) {
      if (!alive.has(key)) {
        this.scene.remove(marker);
        marker.geometry.dispose();
        marker.material.dispose();
        this.conflictMarkers.delete(key);
      }
    }
  }

  _buildStats(perBlock) {
    let conflictBlocks = 0;
    let weakBlocks = 0;
    let unsupported = 0;
    let totalBite = 0;
    for (const [id, r] of perBlock) {
      if (r.collisions.length > 0) conflictBlocks++;
      if (r.unsupported) unsupported++;
      totalBite += r.biteStuds;
      if (r.biteFaces < this.minBiteFaces && this.blocks.find((b) => b.id === id)) {
        weakBlocks++;
      }
    }
    return {
      total: this.blocks.length,
      conflictBlocks,
      unsupported,
      weakBlocks,
      totalBiteStuds: totalBite / 2, // 每个咬合被上下两块各计一次
    };
  }

  setMinBiteFaces(n) {
    this.minBiteFaces = n;
    this.refreshAnalysis();
  }

  setWarnIds(ids) {
    this.warnIds = new Set(ids);
    this._updateEdgeStates();
  }

  setSelected(blockId) {
    this.selectedId = blockId;
    this._updateEdgeStates();
    this.onSelect(blockId ? this.blockMeshes.get(blockId)?.block ?? null : null);
  }

  setSnapThreshold(v) {
    this.snapThreshold = v;
  }

  rotateSelected() {
    if (!this.selectedId) return;
    const block = this.blockMeshes.get(this.selectedId)?.block;
    if (!block) return;
    block.rot = (block.rot + 1) % 4;
    // 旋转后若越界则回退
    const { w, d } = footprintSize(getBlockType(block.typeId), block.rot);
    if (block.x + w > BASE_PLATE_SIZE || block.y + d > BASE_PLATE_SIZE) {
      block.rot = (block.rot + 3) % 4;
      return false;
    }
    this._applyTransform(block);
    this.refreshAnalysis();
    return true;
  }

  // ---------- 拾取与拖拽 ----------

  _initInteraction() {
    const dom = this.renderer.domElement;
    this._pointerDown = (e) => this._handleDown(e);
    this._pointerMove = (e) => this._handleMove(e);
    this._pointerUp = (e) => this._handleUp(e);
    dom.addEventListener('pointerdown', this._pointerDown);
    window.addEventListener('pointermove', this._pointerMove);
    window.addEventListener('pointerup', this._pointerUp);
  }

  _setNDC(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    NDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    NDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(NDC, this.camera);
  }

  // 射线与积木所在高度的水平平面求交(拖动高层积木时落点不偏移)
  _platePoint(e, y = 0) {
    this._setNDC(e);
    dragPlane.constant = -y;
    if (!raycaster.ray.intersectPlane(dragPlane, planeHit)) return null;
    return {
      x: (planeHit.x + PLATE_WORLD_HALF) / STUD_PITCH,
      y: (planeHit.z + PLATE_WORLD_HALF) / STUD_PITCH,
    };
  }

  _pickBlock(e) {
    this._setNDC(e);
    const meshes = [...this.blockMeshes.values()].map((en) => en.mesh);
    const hits = raycaster.intersectObjects(meshes, false);
    return hits.length > 0 ? hits[0].object.userData.blockId : null;
  }

  _handleDown(e) {
    if (e.button !== 0) return;
    const id = this._pickBlock(e);
    if (!id) {
      this.setSelected(null);
      return;
    }
    const entry = this.blockMeshes.get(id);
    const block = entry.block;
    this.setSelected(id);
    this.drag = {
      block,
      entry,
      startX: block.x,
      startY: block.y,
      startZ: block.z,
      moved: false,
      ghostValid: false,
      dragY: block.z * PLATE_HEIGHT,
      lastSnap: null,
      lastStatEmit: 0,
    };
    // 拖拽期间禁用轨道控制,避免与旋转视角冲突
    this.controls.enabled = false;
    entry.group.position.y += DRAG_LIFT;
  }

  _handleMove(e) {
    const drag = this.drag;
    if (!drag) return;
    const pos = this._platePoint(e, drag.dragY);
    if (!pos) return;
    drag.moved = true;

    const snap = snapToGrid(pos, drag.block, this.snapThreshold);
    if (!snap) {
      drag.ghostValid = false;
      return;
    }
    drag.ghostValid = true;

    // 仍在同一吸附格内:无需重建哈希重算
    if (drag.lastSnap && snap.x === drag.lastSnap.x && snap.y === drag.lastSnap.y) {
      return;
    }
    drag.lastSnap = { x: snap.x, y: snap.y };

    // 增量:把拖拽块移出哈希,仅对其候选位置做一次邻域碰撞查询
    this.blocks = this.blocks.filter((b) => b.id !== drag.block.id);
    this.hash = new SpatialHash();
    for (const b of this.blocks) this.hash.add(b);

    drag.block.x = snap.x;
    drag.block.y = snap.y;
    const result = analyzeBlock(drag.block, this.hash);
    drag.result = result;

    // 恢复完整集合(保持同一对象引用)
    this.blocks.push(drag.block);

    this._applyTransform(drag.block);
    drag.entry.group.position.y = gridToWorld(drag.block).y + DRAG_LIFT;

    this._applyDragHighlights(drag.block, result);

    // 统计回调节流到约 10Hz,避免每帧触发 React 重渲染
    const now = performance.now();
    if (now - drag.lastStatEmit > 100) {
      drag.lastStatEmit = now;
      this._emitDragStats(drag.block, result);
    }
  }

  // 拖拽中只重算受影响积木:拖拽块 + 当前邻域块 + 上一帧邻域块(离开邻域者需清除过期冲突)
  _applyDragHighlights(block, result) {
    const fullHash = new SpatialHash();
    for (const b of this.blocks) fullHash.add(b);

    const affectedIds = new Set([block.id]);
    for (const c of result.collisions) affectedIds.add(c.blockId);
    for (const nb of fullHash.queryNeighborhood(footprintCells(block), block.id)) {
      affectedIds.add(nb.id);
    }
    // 上一帧的邻域块这一帧可能已脱离,必须重算以解除其冲突标记
    for (const id of this._prevDragAffected ?? []) affectedIds.add(id);
    this._prevDragAffected = [...affectedIds];

    for (const id of affectedIds) {
      if (id === block.id) {
        this.analysis.set(id, result);
        continue;
      }
      const b = this.blocks.find((x) => x.id === id);
      if (b) this.analysis.set(id, analyzeBlock(b, fullHash));
    }

    // 重建冲突集合与标记
    this.conflictIds = new Set();
    const cellMap = new Map();
    for (const [id, r] of this.analysis) {
      if (r.collisions.length > 0) this.conflictIds.add(id);
      const self = this.blocks.find((b) => b.id === id);
      for (const col of r.collisions) {
        const other = this.blocks.find((b) => b.id === col.blockId);
        if (!self || !other) continue;
        const lowerZ = Math.min(self.z, other.z);
        for (const cell of col.cells) {
          cellMap.set(`${cell.gx},${cell.gy},${lowerZ}`, { ...cell, z: lowerZ });
        }
      }
    }
    this._updateConflictMarkers(cellMap);
    this._updateEdgeStates();
  }

  _emitDragStats(block, result) {
    // 用当前增量分析结果拼出统计,避免全量重算
    let conflictBlocks = 0;
    let unsupported = 0;
    let totalBite = 0;
    let weakBlocks = 0;
    for (const [id, r] of this.analysis) {
      if (r.collisions.length > 0) conflictBlocks++;
      if (r.unsupported) unsupported++;
      totalBite += r.biteStuds;
      if (r.biteFaces < this.minBiteFaces) weakBlocks++;
    }
    this.onStats({
      total: this.blocks.length,
      conflictBlocks,
      unsupported,
      weakBlocks,
      totalBiteStuds: totalBite / 2,
    });
  }

  _handleUp() {
    const drag = this.drag;
    if (!drag) return;
    this.controls.enabled = true;

    if (!drag.moved || !drag.ghostValid) {
      // 未移动或未吸附 -> 回位
      drag.block.x = drag.startX;
      drag.block.y = drag.startY;
      drag.block.z = drag.startZ;
      this._applyTransform(drag.block);
    }
    drag.lastSnap = null;
    this._prevDragAffected = null;
    this.drag = null;
    this.rebuildHash();
    this.refreshAnalysis(); // 松手后做一次权威全量分析
    this.onDrop(drag.block, drag.moved && drag.ghostValid);
  }

  /**
   * 从零件库外部拖入:由 React 侧的 HTML5 拖拽落点转换
   * @returns 放置的网格坐标与碰撞结果,供调用方决定是否创建积木
   */
  previewLibraryDrop(typeId, colorId, clientX, clientY) {
    const fakeEvent = { clientX, clientY };
    const pos = this._platePoint(fakeEvent);
    if (!pos) return null;
    const tempBlock = { id: '__preview__', typeId, colorId, x: 0, y: 0, z: 0, rot: 0 };
    const snap = snapToGrid(pos, tempBlock, 99);
    if (!snap) return null;
    tempBlock.x = snap.x;
    tempBlock.y = snap.y;
    // 堆叠:找最高支撑
    const cells = footprintCells(tempBlock);
    let topZ = 0;
    for (const c of cells) {
      for (const b of this.hash.queryPoint(c.gx, c.gy)) {
        if (b._z1 > topZ) topZ = b._z1;
      }
    }
    tempBlock.z = topZ;
    const result = analyzeBlock(tempBlock, this.hash);
    return { block: tempBlock, result };
  }

  // ---------- 渲染循环与透明排序 ----------

  _tick() {
    this.controls.update();

    // 透明积木按相机深度排序(远 -> 近),保证咬合处遮挡正确;
    // 不透明积木走正常深度缓冲,视角旋转时遮挡天然正确。
    // 仅在存在透明块时排序,避免 140 块场景的无谓遍历。
    if (this._transparentEntries.length > 0) {
      const transparent = this._transparentEntries;
      transparent.sort((a, b) => {
        const da = a.group.position.distanceToSquared(this.camera.position);
        const db = b.group.position.distanceToSquared(this.camera.position);
        return db - da;
      });
      for (let i = 0; i < transparent.length; i++) {
        const entry = transparent[i];
        entry.mesh.renderOrder = 10 + i;
        entry.edge.renderOrder = 10 + i;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  _resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  resetView() {
    this.camera.position.set(380, 340, 460);
    this.controls.target.set(0, 10, 0);
    this.controls.update();
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this._onResize);
    this.renderer.domElement.removeEventListener('pointerdown', this._pointerDown);
    window.removeEventListener('pointermove', this._pointerMove);
    window.removeEventListener('pointerup', this._pointerUp);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
