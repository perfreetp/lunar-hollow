// Babylon.js 三维场景:闸室、上下游引航道、人字闸门、水位与船舶。
// 优先 WebGPU 引擎,不支持时自动降级 WebGL。

import {
  Engine, WebGPUEngine, Scene, ArcRotateCamera, Vector3,
  HemisphericLight, DirectionalLight, MeshBuilder, StandardMaterial,
  Color3, Color4, Mesh, TransformNode,
} from '@babylonjs/core';
import type { LockConfig, ShipConfig } from '../sim/types';
import { HEADER, SHIP_STRIDE, H_WATER, H_UP_GATE, H_DOWN_GATE } from '../sim/types';
import { queueLayout, sortedShips } from '../sim/simulate';

const D2R = Math.PI / 180;

interface ShipNode {
  root: TransformNode;
  hullH: number;
  draft: number;
}

export class LockScene {
  engine: Engine | WebGPUEngine;
  scene: Scene;
  camera: ArcRotateCamera;
  engineLabel = '';

  private config!: LockConfig;
  private shipsMeta: ShipConfig[] = [];
  private dirSign = 1;
  private shipNodes: ShipNode[] = [];
  private gatePivots: TransformNode[] = []; // [upL, upR, downL, downR]
  private chamberWater: Mesh | null = null;
  private floorY = 0;
  private built = false;

  static async create(canvas: HTMLCanvasElement): Promise<LockScene> {
    let engine: Engine | WebGPUEngine | null = null;
    let label = '';
    try {
      const gpu = (navigator as Navigator & { gpu?: unknown }).gpu;
      if (gpu && (await WebGPUEngine.IsSupportedAsync)) {
        const e = new WebGPUEngine(canvas, { antialias: true, stencil: true });
        await e.initAsync();
        engine = e;
        label = 'WebGPU';
      }
    } catch {
      engine = null;
    }
    if (!engine) {
      engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true });
      label = 'WebGL2';
    }
    return new LockScene(engine, label);
  }

  private constructor(engine: Engine | WebGPUEngine, label: string) {
    this.engine = engine;
    this.engineLabel = label;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.07, 0.09, 0.12, 1);

    this.camera = new ArcRotateCamera('cam', -Math.PI / 2, 0.95, 400, new Vector3(0, 0, 0), this.scene);
    this.camera.attachControl(true);
    this.camera.wheelPrecision = 3;
    this.camera.lowerRadiusLimit = 30;
    this.camera.upperRadiusLimit = 2500;
    this.camera.maxZ = 5000;

    const hemi = new HemisphericLight('hemi', new Vector3(0.2, 1, 0.1), this.scene);
    hemi.intensity = 0.75;
    hemi.groundColor = new Color3(0.25, 0.28, 0.3);
    const dir = new DirectionalLight('dir', new Vector3(-0.4, -1, 0.5), this.scene);
    dir.intensity = 0.8;
  }

  private mat(name: string, color: Color3, alpha = 1): StandardMaterial {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = color;
    m.specularColor = new Color3(0.1, 0.1, 0.1);
    m.alpha = alpha;
    return m;
  }

  /** 按当前配置重建全部静态景物与船舶网格 */
  build(config: LockConfig, ships: ShipConfig[]) {
    if (this.built) {
      for (const m of [...this.scene.meshes]) m.dispose();
      for (const t of [...this.scene.transformNodes]) t.dispose();
      for (const mt of [...this.scene.materials]) mt.dispose();
      this.shipNodes = [];
      this.gatePivots = [];
      this.chamberWater = null;
    }
    this.built = true;
    this.config = { ...config };
    this.shipsMeta = sortedShips(ships);
    this.dirSign = config.direction === 'up' ? -1 : 1;

    const L = config.chamberLength;
    const W = config.chamberWidth;
    const L2 = L / 2;
    const appL = config.approachLength;
    const appW = config.approachWidth;
    const maxLevel = Math.max(config.upstreamLevel, config.downstreamLevel);
    const minLevel = Math.min(config.upstreamLevel, config.downstreamLevel);
    this.floorY = minLevel - 4;
    const floorY = this.floorY;

    const concrete = this.mat('concrete', new Color3(0.55, 0.56, 0.58));
    const concreteDark = this.mat('concreteDark', new Color3(0.4, 0.42, 0.45));
    const groundMat = this.mat('ground', new Color3(0.22, 0.3, 0.22));
    const waterMat = this.mat('water', new Color3(0.12, 0.4, 0.6), 0.6);
    waterMat.emissiveColor = new Color3(0.02, 0.08, 0.12);
    const gateMat = this.mat('gate', new Color3(0.75, 0.3, 0.15));

    // 地面
    const totalL = L + 2 * appL + 200;
    const ground = MeshBuilder.CreateGround('ground', { width: appW * 4, height: totalL }, this.scene);
    ground.position.y = floorY - 0.05;
    ground.material = groundMat;

    // 闸室底板
    const floor = MeshBuilder.CreateBox('chamberFloor', { width: W + 8, height: 0.5, depth: L + 8 }, this.scene);
    floor.position.y = floorY - 0.25;
    floor.material = concreteDark;

    // 闸室侧墙
    const wallH = maxLevel + 3 - floorY;
    for (const side of [-1, 1]) {
      const wall = MeshBuilder.CreateBox(`wall${side}`, { width: 2, height: wallH, depth: L + 4 }, this.scene);
      wall.position.set(side * (W / 2 + 1), floorY + wallH / 2, 0);
      wall.material = concrete;
    }

    // 引航道导航墙
    for (const zSide of [-1, 1]) {
      const level = zSide < 0 ? config.upstreamLevel : config.downstreamLevel;
      const h = level + 1.5 - floorY;
      for (const xSide of [-1, 1]) {
        const wall = MeshBuilder.CreateBox(`appWall${zSide}_${xSide}`, { width: 1.5, height: h, depth: appL }, this.scene);
        wall.position.set(xSide * (appW / 2 + 0.75), floorY + h / 2, zSide * (L2 + appL / 2));
        wall.material = concrete;
      }
    }

    // 上下游引航道水体
    const mkWater = (name: string, level: number, zCenter: number) => {
      const h = Math.max(0.2, level - floorY);
      const w = MeshBuilder.CreateBox(name, { width: appW, height: h, depth: appL }, this.scene);
      w.position.set(0, floorY + h / 2, zCenter);
      w.material = waterMat;
    };
    mkWater('waterUp', config.upstreamLevel, -(L2 + appL / 2));
    mkWater('waterDown', config.downstreamLevel, L2 + appL / 2);

    // 闸室水体(高度随水位动态变化)
    this.chamberWater = MeshBuilder.CreateBox('waterChamber', { width: W, height: 1, depth: L }, this.scene);
    this.chamberWater.material = waterMat;

    // 人字闸门:上下闸首各两扇,绕门枢旋转
    const leafLen = W / 2;
    const gateH = maxLevel + 2 - floorY;
    const mkGate = (gateZ: number, tag: string) => {
      for (const side of [-1, 1]) {
        const pivot = new TransformNode(`gatePivot_${tag}_${side}`, this.scene);
        pivot.position.set(side * (W / 2), 0, gateZ);
        const leaf = MeshBuilder.CreateBox(`gateLeaf_${tag}_${side}`, { width: leafLen, height: gateH, depth: 1.2 }, this.scene);
        leaf.position.set(-side * leafLen / 2, floorY + gateH / 2, 0);
        leaf.material = gateMat;
        leaf.parent = pivot;
        this.gatePivots.push(pivot);
      }
    };
    mkGate(-L2, 'up');
    mkGate(L2, 'down');
    // gatePivots 顺序: [up左(-x), up右(+x), down左, down右]

    // 船舶
    const palette = [
      0.0, 0.06, 0.12, 0.18, 0.25, 0.32, 0.4, 0.48, 0.55, 0.62,
      0.7, 0.78, 0.85, 0.92, 0.03, 0.15, 0.3, 0.5, 0.66, 0.8,
    ];
    this.shipsMeta.forEach((meta, i) => {
      const hue = palette[i % palette.length];
      const color = Color3.FromHSV(hue * 360, 0.55, 0.85);
      const hullMat = this.mat(`hull${i}`, color);
      const hullH = meta.draft * 1.6 + 0.8;
      const root = new TransformNode(`ship_${meta.id}`, this.scene);
      const hull = MeshBuilder.CreateBox(`hull_${meta.id}`, { width: meta.width, height: hullH, depth: meta.length }, this.scene);
      hull.material = hullMat;
      hull.parent = root;
      const cabin = MeshBuilder.CreateBox(`cabin_${meta.id}`, {
        width: meta.width * 0.6, height: 1.4, depth: Math.max(2, meta.length * 0.12),
      }, this.scene);
      cabin.position.set(0, hullH / 2 + 0.7, -meta.length * 0.32);
      cabin.material = this.mat(`cabin${i}`, new Color3(0.9, 0.9, 0.88));
      cabin.parent = root;
      if (this.dirSign < 0) root.rotation.y = Math.PI;
      this.shipNodes.push({ root, hullH, draft: meta.draft });
    });

    // 相机视野覆盖整个闸区
    this.camera.radius = Math.min(2400, totalL * 0.42);
    this.camera.target = new Vector3(0, minLevel, 0);

    this.applyPreview();
  }

  private zoneWater(z: number, chamberWater: number): number {
    const L2 = this.config.chamberLength / 2;
    if (z < -L2) return this.config.upstreamLevel;
    if (z > L2) return this.config.downstreamLevel;
    return chamberWater;
  }

  private placeShip(i: number, x: number, z: number, chamberWater: number) {
    const node = this.shipNodes[i];
    if (!node) return;
    const water = this.zoneWater(z, chamberWater);
    node.root.position.set(x, water - node.draft + node.hullH / 2, z);
  }

  private setGates(upDeg: number, downDeg: number) {
    const [upL, upR, dnL, dnR] = this.gatePivots;
    if (!upL) return;
    // 门叶向闸室外侧(上下游)收拢
    upL.rotation.y = upDeg * D2R;
    upR.rotation.y = -upDeg * D2R;
    dnL.rotation.y = -downDeg * D2R;
    dnR.rotation.y = downDeg * D2R;
  }

  private setChamberWater(level: number) {
    if (!this.chamberWater) return;
    const h = Math.max(0.2, level - this.floorY);
    this.chamberWater.scaling.y = h;
    this.chamberWater.position.y = this.floorY + h / 2;
  }

  /** 应用一帧采样数据(回放/直播) */
  applyFrame(header: Float32Array, ships: Float32Array) {
    if (!this.built) return;
    const water = header[H_WATER];
    this.setChamberWater(water);
    this.setGates(header[H_UP_GATE], header[H_DOWN_GATE]);
    const n = Math.min(this.shipNodes.length, ships.length / SHIP_STRIDE);
    for (let i = 0; i < n; i++) {
      const x = ships[i * SHIP_STRIDE];
      const z = ships[i * SHIP_STRIDE + 1];
      this.placeShip(i, x, z, water);
    }
  }

  /** 初始预览:船舶位于排队泊位,闸门关闭,闸室为进闸侧水位 */
  applyPreview() {
    if (!this.built) return;
    const fromLevel = this.dirSign === 1 ? this.config.upstreamLevel : this.config.downstreamLevel;
    const q = queueLayout(this.config, this.shipsMeta);
    this.setChamberWater(fromLevel);
    this.setGates(0, 0);
    q.forEach((p, i) => this.placeShip(i, p.x, p.z * this.dirSign, fromLevel));
  }

  render() {
    this.scene.render();
  }

  dispose() {
    this.scene.dispose();
    this.engine.dispose();
  }
}
