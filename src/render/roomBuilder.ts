import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { ProjectConfig } from '../core/types';

export interface RoomMeshes {
  root: Mesh;
  floor: Mesh;
  backWall: Mesh;
  sideWalls: Mesh[];
  frames: Mesh[];
}

function mat(name: string, scene: Scene, color: Color3, roughness = 0.9): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.specularColor = new Color3(0.05, 0.05, 0.05);
  m.roughness = roughness;
  return m;
}

/** 室内壳体：地面、后墙、两面侧墙（无顶棚，方便俯视室内光斑）+ 幕墙框条 */
export function buildRoom(scene: Scene, config: ProjectConfig): RoomMeshes {
  const { grid, room } = config;
  const root = new Mesh('room-root', scene);
  const floorMat = mat('floor-mat', scene, new Color3(0.62, 0.58, 0.52));
  const wallMat = mat('wall-mat', scene, new Color3(0.82, 0.8, 0.76));
  const frameMat = mat('frame-mat', scene, new Color3(0.12, 0.13, 0.15), 0.5);
  frameMat.specularColor = new Color3(0.3, 0.3, 0.3);

  const floor = MeshBuilder.CreateGround(
    'floor',
    { width: room.halfWidth * 2, height: room.depth, subdivisions: 1, updatable: false },
    scene,
  );
  floor.position = new Vector3(0, 0, room.depth / 2);
  floor.material = floorMat;
  floor.parent = root;

  const backWall = MeshBuilder.CreateBox(
    'back-wall',
    { width: room.halfWidth * 2, height: grid.height, depth: 0.2 },
    scene,
  );
  backWall.position = new Vector3(0, grid.height / 2, room.depth + 0.1);
  backWall.material = wallMat;
  backWall.parent = root;

  const sideWalls: Mesh[] = [];
  for (const sign of [-1, 1]) {
    const side = MeshBuilder.CreateBox(
      `side-wall-${sign}`,
      { width: 0.2, height: grid.height, depth: room.depth },
      scene,
    );
    side.position = new Vector3(sign * (room.halfWidth + 0.1), grid.height / 2, room.depth / 2);
    side.material = wallMat;
    side.parent = root;
    sideWalls.push(side);
  }

  // 幕墙框条：竖梃 + 横梃，沿分格线布置；双层幕墙时两层各一套
  const frames: Mesh[] = [];
  const layerOffsets = config.doubleLayer ? [0, config.layerGap] : [0];
  for (const z of layerOffsets) {
    const cw = grid.width / grid.cols;
    const ch = grid.height / grid.rows;
    for (let c = 0; c <= grid.cols; c++) {
      const mullion = MeshBuilder.CreateBox(
        `mullion-${z}-${c}`,
        { width: grid.barWidth, height: grid.height + grid.barWidth, depth: grid.barWidth * 1.4 },
        scene,
      );
      mullion.position = new Vector3(-grid.width / 2 + c * cw, grid.height / 2, z);
      mullion.material = frameMat;
      mullion.parent = root;
      frames.push(mullion);
    }
    for (let r = 0; r <= grid.rows; r++) {
      const transom = MeshBuilder.CreateBox(
        `transom-${z}-${r}`,
        { width: grid.width + grid.barWidth, height: grid.barWidth, depth: grid.barWidth * 1.4 },
        scene,
      );
      transom.position = new Vector3(0, r * ch, z);
      transom.material = frameMat;
      transom.parent = root;
      frames.push(transom);
    }
  }

  return { root, floor, backWall, sideWalls, frames };
}
