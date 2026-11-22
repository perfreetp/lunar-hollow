import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import { HitSurface } from '../core/types';
import { fanTriangulate } from '../core/projection';
import type { TintedPatch } from '../core/facade';

export interface PatchBuildResult {
  meshes: Mesh[];
  dispose: () => void;
}

/**
 * 把光斑多边形构建为贴在地面/墙面上的加法混合光片。
 *
 * 每个室内面合并为一个 mesh（顶点色携带各束光的强度与镀膜色偏），
 * 光斑重叠处在加法混合下自然变亮，符合多束阳光能量叠加。
 * 光片沿面法线抬升 1cm，避免与地面 z-fighting。
 */
export function buildPatchMeshes(scene: Scene, patches: TintedPatch[]): PatchBuildResult {
  const meshes: Mesh[] = [];
  const materials: StandardMaterial[] = [];
  const surfaces: HitSurface[] = [HitSurface.Floor, HitSurface.BackWall, HitSurface.SideWall];

  for (const surface of surfaces) {
    const group = patches.filter((p) => p.surface === surface);
    if (group.length === 0) continue;

    const positions: number[] = [];
    const colors: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    let base = 0;

    for (const patch of group) {
      const lifted = patch.points.map((p) => lift(p, surface));
      const n = normalOf(surface);
      for (const p of lifted) {
        positions.push(p.x, p.y, p.z);
        // 顶点 RGB = 镀膜色偏（无镀膜为白）；强度放进顶点 alpha，
        // 由材质不透明度控制，避免加法混合在重叠处过曝
        colors.push(
          clamp01(patch.tint[0]),
          clamp01(patch.tint[1]),
          clamp01(patch.tint[2]),
          clamp01(patch.effectiveTransmittance),
        );
        normals.push(n[0], n[1], n[2]);
      }
      const tri = fanTriangulate(patch.points.length);
      for (const idx of tri) indices.push(base + idx);
      base += patch.points.length;
    }

    const mesh = new Mesh(`light-patches-${surface}`, scene);
    const vd = new VertexData();
    vd.positions = positions;
    vd.colors = colors;
    vd.normals = normals;
    vd.indices = indices;
    vd.applyToMesh(mesh, false);
    mesh.isPickable = false;
    mesh.hasVertexAlpha = true;

    const mat = new StandardMaterial(`patch-mat-${surface}`, scene);
    // 暖阳光色温的自发光；顶点 RGB 调制镀膜色偏，顶点 alpha 调制光束强度
    mat.emissiveColor = new Color3(1.0, 0.9, 0.68);
    mat.disableLighting = true;
    // 普通透明度混合：重叠光斑通过交叠面积体现，不会瞬间叠加成纯白
    mat.alphaMode = 2; // Engine.ALPHA_COMBINE
    mat.backFaceCulling = false;
    mat.disableDepthWrite = false; // 光斑贴实体面，正常参与深度
    mesh.material = mat;

    meshes.push(mesh);
    materials.push(mat);
  }

  return {
    meshes,
    dispose: () => {
      for (const m of materials) m.dispose();
      for (const m of meshes) m.dispose();
    },
  };
}

function lift(p: { x: number; y: number; z: number }, surface: HitSurface) {
  switch (surface) {
    case HitSurface.Floor:
      return { x: p.x, y: p.y + 0.012, z: p.z };
    case HitSurface.BackWall:
      return { x: p.x, y: p.y, z: p.z - 0.012 };
    case HitSurface.SideWall:
      // 侧墙有 ±x 两面，统一向室内（朝 x=0）偏移
      return { x: p.x > 0 ? p.x - 0.012 : p.x + 0.012, y: p.y, z: p.z };
  }
}

function normalOf(surface: HitSurface): [number, number, number] {
  switch (surface) {
    case HitSurface.Floor:
      return [0, 1, 0];
    case HitSurface.BackWall:
      return [0, 0, -1];
    case HitSurface.SideWall:
      // 侧墙分处 ±x，背面剔除已关，法线占位即可
      return [1, 0, 0];
  }
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
