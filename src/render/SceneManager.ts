import { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import type { PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import type { ProjectConfig, CellReadout, GlareReadout } from '../core/types';
import { GlassType } from '../core/types';
import { buildLightPatches, layersForCell } from '../core/facade';
import { computeGlare, cellVisibleRatio } from '../core/glare';
import { sunDirection } from '../core/sun';
import { cellAt, cellRect } from '../core/grid';
import { openFraction } from '../core/fritMask';
import { buildRoom, type RoomMeshes } from './roomBuilder';
import { buildGlass, type GlassBuildResult } from './glassBuilder';
import { buildPatchMeshes, type PatchBuildResult } from './patchBuilder';

export interface SceneCallbacks {
  onHover: (readout: CellReadout | null) => void;
  onGlare: (readout: GlareReadout) => void;
}

/**
 * 渲染总装。对外只暴露 rebuild* 系列命令与 dispose，
 * Vue 侧把配置变更转成细粒度重建，纯计算全部在 core 层。
 */
export class SceneManager {
  readonly scene: Scene;
  private room: RoomMeshes | null = null;
  private glass: GlassBuildResult | null = null;
  private patches: PatchBuildResult | null = null;
  private highlight: Mesh;
  private sun: DirectionalLight;
  private callbacks: SceneCallbacks;
  private config: ProjectConfig;
  private pickHandler: (info: PointerInfo) => void;
  /** 最近一次重算的光斑多边形数量，供调试与自动化测试核对重算确实发生 */
  private lastPatchCount = 0;

  /** 调试/测试用：当前场景中的光斑多边形总数 */
  get debugPatchCount(): number {
    return this.lastPatchCount;
  }

  constructor(engine: AbstractEngine, config: ProjectConfig, callbacks: SceneCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.09, 0.11, 0.14, 1);
    this.scene = scene;

    // 相机：从室外斜前方看向幕墙中部，完整收入整面墙与部分室内
    const target = new Vector3(0, config.grid.height * 0.45, config.room.depth * 0.3);
    const camera = new ArcRotateCamera(
      'cam',
      -Math.PI / 2,
      Math.PI / 3.6,
      Math.max(config.grid.width * 1.5, config.room.depth * 1.6, config.grid.height * 2.6),
      target,
      scene,
    );
    camera.attachControl(engine.getRenderingCanvas(), true);
    camera.lowerRadiusLimit = 4;
    camera.upperRadiusLimit = 80;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.wheelDeltaPercentage = 0.01;
    camera.minZ = 0.05;
    // 限制水平转角，避免相机穿到后墙后方丢失幕墙
    camera.lowerAlphaLimit = -Math.PI;
    camera.upperAlphaLimit = 0;

    // 环境天光 + 与太阳方位绑定的平行光
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.7;
    hemi.diffuse = new Color3(0.85, 0.9, 1);
    hemi.groundColor = new Color3(0.35, 0.32, 0.28);

    this.sun = new DirectionalLight('sun', new Vector3(0, -1, 1), scene);
    this.sun.intensity = 1.1;
    this.sun.diffuse = new Color3(1, 0.95, 0.85);

    // 悬停高亮框（默认隐藏），定位到被指格
    this.highlight = MeshBuilder.CreateBox(
      'hover-highlight',
      { width: 1, height: 1, depth: 0.04 },
      scene,
    );
    const hlMat = new StandardMaterial('hl-mat', scene);
    hlMat.emissiveColor = new Color3(1, 0.72, 0.2);
    hlMat.alpha = 0.85;
    hlMat.disableLighting = true;
    this.highlight.material = hlMat;
    this.highlight.isPickable = false;
    this.highlight.setEnabled(false);

    this.pickHandler = (info) => this.handlePointer(info);
    scene.onPointerObservable.add(this.pickHandler, PointerEventTypes.POINTERMOVE);

    this.rebuildAll();
  }

  /** 全量重建：换网格/房间/双层结构时使用 */
  rebuildAll(): void {
    this.room?.root.dispose();
    this.glass?.dispose();
    this.patches?.dispose();
    this.room = buildRoom(this.scene, this.config);
    this.glass = buildGlass(this.scene, this.config);
    this.rebuildPatchesAndGlare();
    this.updateSun();
  }

  /** 仅重建玻璃：分格玻璃参数（类型/透射/色偏/彩釉）变化时使用，成本低 */
  rebuildGlass(): void {
    this.glass?.dispose();
    this.glass = buildGlass(this.scene, this.config);
    this.rebuildPatchesAndGlare();
  }

  /** 日照变化：只重算光斑几何与眩光读数，不动任何玻璃 mesh */
  rebuildSun(): void {
    this.updateSun();
    this.rebuildPatchesAndGlare();
  }

  /** 导入方案：替换配置并全量重建 */
  setConfig(config: ProjectConfig): void {
    this.config = config;
    this.rebuildAll();
  }

  /** 测试/调试用：仅替换日照参数并重算，可越过 UI 滑块下限覆盖贴地边界 */
  debugSetSun(hourAngleDeg: number, altitudeDeg: number): void {
    this.config.sun = { hourAngleDeg, altitudeDeg };
    this.rebuildSun();
  }

  /** 测试/调试用：近距离取景幕墙指定区域，核对玻璃与遮罩外观 */
  debugSetCamera(radius: number, alpha: number, beta: number, target: [number, number, number]): void {
    const cam = this.scene.cameras[0] as ArcRotateCamera;
    // 临时放宽限位，保证调试取景不被用户交互约束钳制
    cam.lowerBetaLimit = 0.05;
    cam.upperBetaLimit = Math.PI - 0.05;
    cam.lowerRadiusLimit = 1;
    cam.upperRadiusLimit = 200;
    // 先设目标（会反算球坐标），再覆盖 alpha/beta/radius 才能生效
    cam.setTarget(new Vector3(target[0], target[1], target[2]));
    cam.alpha = alpha;
    cam.beta = beta;
    cam.radius = radius;
  }

  private rebuildPatchesAndGlare(): void {
    this.patches?.dispose();
    const tinted = buildLightPatches(this.config);
    this.lastPatchCount = tinted.length;
    this.patches = buildPatchMeshes(this.scene, tinted);
    const glare = computeGlare(this.config.cells, this.config.grid, (i) =>
      layersForCell(this.config, i),
    );
    this.callbacks.onGlare(glare);
  }

  private updateSun(): void {
    // 平行光方向与 core 的光线传播方向保持一致（光往室内传播的方向）
    this.sun.direction = sunDirection(this.config.sun).scale(-1);
  }

  private handlePointer(info: PointerInfo): void {
    const pick = info.pickInfo;
    const picked = pick?.hit ? pick.pickedMesh : null;
    const meta = picked?.metadata as { cellIndex?: number; kind?: string } | undefined;
    if (!meta || meta.kind !== 'glass' || meta.cellIndex === undefined) {
      this.highlight.setEnabled(false);
      this.callbacks.onHover(null);
      return;
    }
    const index = meta.cellIndex;
    this.placeHighlight(index);
    this.callbacks.onHover(this.readoutFor(index));
  }

  private placeHighlight(index: number): void {
    const { grid } = this.config;
    const rect = cellRect(grid, index);
    this.highlight.position = new Vector3(
      (rect.x0 + rect.x1) / 2,
      (rect.y0 + rect.y1) / 2,
      (this.config.doubleLayer ? this.config.layerGap : 0) + 0.05,
    );
    this.highlight.scaling = new Vector3(
      rect.x1 - rect.x0 - grid.barWidth * 0.4,
      rect.y1 - rect.y0 - grid.barWidth * 0.4,
      1,
    );
    this.highlight.setEnabled(true);
  }

  private readoutFor(index: number): CellReadout {
    const { row, col } = cellAt(this.config.grid, index);
    const cell = this.config.cells[index];
    const layers = layersForCell(this.config, index);
    return {
      cellIndex: index,
      row,
      col,
      type: cell.type,
      transmittance: cell.transmittance,
      openFraction: cell.type === GlassType.Fritted ? openFraction(cell.frit) : 1,
      stackedVisibleRatio: cellVisibleRatio(cell, layers),
    };
  }

  dispose(): void {
    this.scene.onPointerObservable.removeCallback(this.pickHandler);
    this.glass?.dispose();
    this.patches?.dispose();
    this.scene.dispose();
  }
}
