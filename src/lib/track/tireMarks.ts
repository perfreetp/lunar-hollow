import { Scene } from '@babylonjs/core/scene.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Constants } from '@babylonjs/core/Engines/constants.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import type { Centerline } from './centerline.js';
import { buildRibbon } from './geometry.js';
import { TRACK_DIMS } from './geometry.js';

const TEX_SPAN = 240; // 贴花贴图沿弧长覆盖的米数(环形重复)
const TEX_W = 1024;
const TEX_H = 128;
const CELLS = 1024; // 弧长方向强度栅格
const MAX_ALPHA = 0.82;
/** 两条轮迹相对中心线的横向偏移(米) */
const WHEEL_OFFSETS = [-0.95, 0.95];

/**
 * 轮胎痕迹叠加贴图层:
 * - 一条略高于路面的全环 ribbon,材质为黑色半透明、alpha 取自动态贴图;
 * - 强度按弧长栅格累积,行驶经过的位置逐帧加深,贴图按 10Hz 重绘;
 * - UV.u 与路面一样以米为单位,贴花随曲面均匀分布,不产生拉伸。
 */
export class TireMarkLayer {
  readonly texture: DynamicTexture;
  private readonly material: StandardMaterial;
  private readonly lanes: Float32Array[];
  private readonly cellMeters: number;
  private dirty = false;
  private accumTime = 0;
  /** 相机附近的平均强度,供 UI 显示 */
  averageIntensity = 0;

  constructor(
    scene: Scene,
    private readonly center: Centerline
  ) {
    const L = center.totalLength;
    this.cellMeters = L / CELLS;
    this.lanes = WHEEL_OFFSETS.map(() => new Float32Array(CELLS));

    // 贴花 ribbon:与路面同宽,抬升 0.035m 防止 z-fighting
    const cols = [-1, -0.5, 0, 0.5, 1].map((t) => ({
      offset: t * TRACK_DIMS.roadHalfWidth,
      lift: 0.035
    }));
    const ribbon = buildRibbon(scene, center, {
      name: 'tireMarkDecal',
      columns: cols,
      startIndex: 0,
      endIndex: center.frames.length - 1,
      closed: true,
      uScale: 1 / TEX_SPAN
    });

    this.texture = new DynamicTexture('tireMarkTex', { width: TEX_W, height: TEX_H }, scene, false);
    this.clearTexture();
    this.texture.wrapU = Constants.TEXTURE_WRAP_ADDRESSMODE;
    this.texture.wrapV = Constants.TEXTURE_WRAP_ADDRESSMODE;

    this.material = new StandardMaterial('tireMarkMat', scene);
    this.material.diffuseTexture = this.texture;
    this.material.useAlphaFromDiffuseTexture = true;
    this.material.diffuseColor = Color3.Black();
    this.material.emissiveColor = Color3.Black();
    this.material.specularColor = Color3.Black();
    this.material.disableLighting = true;
    this.material.alphaMode = Constants.ALPHA_COMBINE;
    this.material.zOffset = -2;
    ribbon.material = this.material;
  }

  private clearTexture() {
    const ctx = this.texture.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, TEX_W, TEX_H);
    this.texture.update(false);
  }

  /** 车辆以弧长 s 经过时,在两条轮迹上累积橡胶痕迹 */
  deposit(s: number, dt: number, speed01: number) {
    const L = this.center.totalLength;
    const cell = Math.floor(((s % L) + L) % L / this.cellMeters) % CELLS;
    // 速度越快、时间越久,沉积越多(带轻微随机避免机械均匀)
    const amount = Math.min(MAX_ALPHA, dt * (0.05 + 0.1 * speed01));
    for (const lane of this.lanes) {
      lane[cell] = Math.min(MAX_ALPHA, lane[cell] + amount);
      // 相邻栅格轻微扩散,形成连续胎印
      lane[(cell + 1) % CELLS] = Math.min(MAX_ALPHA, lane[(cell + 1) % CELLS] + amount * 0.35);
    }
    this.dirty = true;
  }

  /** 清空全部轮胎痕迹 */
  reset() {
    for (const lane of this.lanes) lane.fill(0);
    this.clearTexture();
    this.averageIntensity = 0;
    this.dirty = false;
  }

  private paint() {
    const ctx = this.texture.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, TEX_W, TEX_H);
    const pxPerCell = TEX_W / CELLS;
    const brushW = Math.max(2, pxPerCell * 2.2);
    const halfRoad = TRACK_DIMS.roadHalfWidth;

    this.lanes.forEach((lane, li) => {
      // 横向:偏移 -> v 坐标,胎印宽度约 0.55m
      const vCenter = (WHEEL_OFFSETS[li] / halfRoad + 1) / 2;
      const y = (1 - vCenter) * TEX_H;
      const brushH = (0.55 / (halfRoad * 2)) * TEX_H;
      for (let i = 0; i < CELLS; i++) {
        const a = lane[i];
        if (a < 0.01) continue;
        ctx.fillStyle = `rgba(15,15,15,${a.toFixed(3)})`;
        ctx.fillRect(i * pxPerCell - brushW / 2, y - brushH / 2, brushW, brushH);
      }
    });
    this.texture.update(false);
  }

  /** 每帧驱动:节流重绘并计算相机附近平均强度 */
  update(dt: number, cameraS: number) {
    if (!this.dirty) return;
    this.accumTime += dt;
    if (this.accumTime < 0.1) return;
    this.accumTime = 0;
    this.paint();
    this.dirty = false;

    const L = this.center.totalLength;
    const cell = Math.floor(((cameraS % L) + L) % L / this.cellMeters) % CELLS;
    let sum = 0;
    const window = 25;
    for (let i = -window; i <= window; i++) {
      const idx = (cell + i + CELLS) % CELLS;
      sum += this.lanes[0][idx] + this.lanes[1][idx];
    }
    this.averageIntensity = Math.min(1, sum / (2 * (2 * window + 1) * MAX_ALPHA));
  }
}
