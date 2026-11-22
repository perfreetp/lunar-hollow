import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { FresnelParameters } from '@babylonjs/core/Materials/fresnelParameters';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Scene } from '@babylonjs/core/scene';
import { GlassType, type GlassCell, type ProjectConfig } from '../core/types';
import { cellRect } from '../core/grid';
import { bodyTransmittance, effectiveCellTransmittance, COATING_TINTS } from '../core/optics';
import { createFritTexture } from './maskTexture';

export interface GlassMeshRecord {
  mesh: Mesh;
  cellIndex: number;
  layer: number;
}

export interface GlassBuildResult {
  records: GlassMeshRecord[];
  /** 按 cellIndex 缓存的材质，重建分格类型时整体丢弃 */
  dispose: () => void;
}

/**
 * 每格一块独立半透明 mesh + 独立 Standard 材质。
 *
 * 混合正确性的关键设置：
 * - needAlphaBlending=true、disableDepthWrite=true：玻璃只参与透明队列，
 *   不写深度，避免玻璃片互相把自己裁掉（前后穿插）；
 * - Babylon 透明队列按到相机距离逐格排序后混合，双层幕墙的前后顺序
 *   与视线方向无关地保持正确；
 * - 双面几何：从室内外两侧看都渲染；
 * - 多层颜色累积由 alpha 乘积在混合方程中自然完成（见 core/optics 乘积模型）。
 */
export function buildGlass(scene: Scene, config: ProjectConfig): GlassBuildResult {
  const records: GlassMeshRecord[] = [];
  const materials: StandardMaterial[] = [];
  const fritTextures = new Map<string, ReturnType<typeof createFritTexture>>();
  const { grid } = config;
  const layerOffsets = config.doubleLayer ? [0, config.layerGap] : [0];

  for (let i = 0; i < config.cells.length; i++) {
    const cell = config.cells[i];
    const rect = cellRect(grid, i);
    const width = rect.x1 - rect.x0 - grid.barWidth;
    const height = rect.y1 - rect.y0 - grid.barWidth;
    const cx = (rect.x0 + rect.x1) / 2;
    const cy = (rect.y0 + rect.y1) / 2;

    for (let layer = 0; layer < layerOffsets.length; layer++) {
      const z = layerOffsets[layer];
      const mesh = new Mesh(`glass-cell-${i}-l${layer}`, scene);
      const geo = planeGeometry(width, height);
      geo.applyToMesh(mesh, false);
      mesh.position = new Vector3(cx, cy, z);
      mesh.metadata = { cellIndex: i, layer, kind: 'glass' };

      const mat = makeMaterial(scene, cell, i, layer, width, height, fritTextures);
      mesh.material = mat;
      materials.push(mat);

      mesh.alphaIndex = i; // 同距离时的稳定排序兜底
      mesh.hasVertexAlpha = false;
      mesh.isPickable = true;
      mesh.alwaysSelectAsActiveMesh = true;
      records.push({ mesh, cellIndex: i, layer });
    }
  }

  return {
    records,
    dispose: () => {
      for (const m of materials) m.dispose();
      for (const t of fritTextures.values()) t.dispose();
      for (const r of records) r.mesh.dispose();
    },
  };
}

/** 在 z=0 平面内、以原点为中心的双面平面几何（位置由 mesh.position 给出） */
function planeGeometry(width: number, height: number): VertexData {
  const hx = width / 2;
  const hy = height / 2;
  const positions = [-hx, -hy, 0, hx, -hy, 0, hx, hy, 0, -hx, hy, 0];
  const uvs = [0, 0, 1, 0, 1, 1, 0, 1];
  // 双面：正向 + 反向两组三角形
  const indices = [0, 1, 2, 0, 2, 3, 2, 1, 0, 3, 2, 0];
  const normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
  const vd = new VertexData();
  vd.positions = positions;
  vd.uvs = uvs;
  vd.indices = indices;
  vd.normals = normals;
  return vd;
}

function makeMaterial(
  scene: Scene,
  cell: GlassCell,
  cellIndex: number,
  layer: number,
  cellWidth: number,
  cellHeight: number,
  fritCache: Map<string, ReturnType<typeof createFritTexture>>,
): StandardMaterial {
  const mat = new StandardMaterial(`glass-mat-${cellIndex}-l${layer}`, scene);
  const eff = effectiveCellTransmittance(cell);
  mat.alphaMode = 2; // Engine.ALPHA_COMBINE
  mat.disableDepthWrite = true;
  mat.backFaceCulling = false; // 双面可见
  mat.specularPower = 64;

  // 菲涅尔边缘反射：正视通透、斜视出现天空色高光，呈现真实玻璃观感
  const fresnel = new FresnelParameters();
  fresnel.isEnabled = true;
  fresnel.power = 4;
  fresnel.bias = 0.05;
  fresnel.leftColor = new Color3(0.02, 0.03, 0.04);
  fresnel.rightColor = new Color3(0.32, 0.42, 0.52);

  if (cell.type === GlassType.Coated) {
    // 镀膜玻璃：基础不透明度随透射率反向变化，反射更强且带色偏
    const tint = COATING_TINTS[cell.tint].rgb;
    mat.alpha = Math.max(0.18, Math.min(0.85, 1 - bodyTransmittance(cell) * 0.55));
    mat.diffuseColor = new Color3(tint[0] * 0.55, tint[1] * 0.55, tint[2] * 0.55);
    mat.specularColor = new Color3(
      Math.min(1, 0.4 + tint[0] * 0.5),
      Math.min(1, 0.4 + tint[1] * 0.5),
      Math.min(1, 0.4 + tint[2] * 0.5),
    );
    // 边缘菲涅尔高光带上镀膜反射色偏
    fresnel.rightColor = new Color3(
      0.22 + tint[0] * 0.32,
      0.22 + tint[1] * 0.32,
      0.22 + tint[2] * 0.32,
    );
    mat.emissiveFresnelParameters = fresnel;
  } else if (cell.type === GlassType.Fritted) {
    // 彩釉：基础 alpha 拉满，由不透明度贴图把玻璃区压黑通透、釉面区保留实体
    mat.alpha = 1;
    mat.diffuseColor = new Color3(0.86, 0.83, 0.76);
    mat.specularColor = new Color3(0.12, 0.12, 0.12);
    mat.specularPower = 32;
    mat.emissiveFresnelParameters = fresnel;
    applyFritTexture(mat, cell, cellWidth, cellHeight, fritCache, scene);
  } else {
    // 透明玻璃：不透明度映射有效透射，整体偏通透
    mat.alpha = Math.max(0.12, eff);
    const g = 0.92;
    mat.diffuseColor = new Color3(g, g, g);
    mat.specularColor = new Color3(0.2, 0.22, 0.25);
    mat.emissiveFresnelParameters = fresnel;
  }

  return mat;
}

function applyFritTexture(
  mat: StandardMaterial,
  cell: GlassCell,
  cellWidth: number,
  cellHeight: number,
  fritCache: Map<string, ReturnType<typeof createFritTexture>>,
  scene: Scene,
): void {
  const key = `${cell.frit.pattern}-${cell.frit.coverage}-${cell.frit.scale}-${cellWidth}-${cellHeight}`;
  let tex = fritCache.get(key);
  if (!tex) {
    tex = createFritTexture(scene, cell.frit, cellWidth, cellHeight);
    fritCache.set(key, tex);
  }
  // 灰度遮罩：白=釉面不透明，黑=玻璃通透；getAlphaFromRGB 用亮度作 alpha
  mat.opacityTexture = tex;
}
