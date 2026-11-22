// 碰撞检测与凸点咬合分析(纯逻辑,不依赖 three.js)
import { footprintCells, verticalInterval } from './constants.js';
import { SpatialHash } from './spatialHash.js';

/**
 * 计算单个积木相对场景中其它积木的碰撞与咬合
 * @returns {{ collisions: Array, biteFaces: number, biteStuds: number, unsupported: boolean }}
 */
export function analyzeBlock(block, hash, { checkSupport = true } = {}) {
  const cells = footprintCells(block);
  const cellSet = new Set(cells.map((c) => `${c.gx},${c.gy}`));
  // 邻域扩展一圈,保证侧面相邻(不共享网格单元)的块也能被检出
  const neighbors = hash.queryNeighborhood(cells, block.id);
  const collisions = [];
  let biteStuds = 0; // 上下层咬合的凸点数
  let bottomBite = false; // 底面与下层咬合
  let topBite = false; // 顶面与上层咬合
  const sideDirSet = new Set(); // 侧面接触方向 0/1/2/3
  let sideFaces = 0; // 侧面贴合的凸点边数

  const zMine = verticalInterval(block);

  for (const other of neighbors) {
    const zOther = verticalInterval(other);
    const otherCells = footprintCells(other);
    const otherCellSet = new Set(otherCells.map((c) => `${c.gx},${c.gy}`));
    const overlapCells = otherCells.filter((c) => cellSet.has(`${c.gx},${c.gy}`));

    // 1) 水平 footprint 重叠 + 垂直区间相交 => 实体碰撞
    if (overlapCells.length > 0 && zMine.z0 < zOther.z1 && zOther.z0 < zMine.z1) {
      collisions.push({
        blockId: other.id,
        cells: overlapCells,
      });
      continue; // 已实体碰撞的不再计咬合
    }

    // 2) 凸点咬合:垂直方向恰好贴合(下层顶面 == 上层底面)
    if (overlapCells.length > 0) {
      if (zOther.z1 === zMine.z0) {
        biteStuds += overlapCells.length;
        bottomBite = true;
      } else if (zMine.z1 === zOther.z0) {
        biteStuds += overlapCells.length;
        topBite = true;
      }
    }

    // 3) 侧面贴合:垂直区间有交集且水平方向四邻相接
    if (zMine.z0 < zOther.z1 && zOther.z0 < zMine.z1) {
      const around = [
        { dir: 0, dx: 1, dy: 0 },
        { dir: 1, dx: -1, dy: 0 },
        { dir: 2, dx: 0, dy: 1 },
        { dir: 3, dx: 0, dy: -1 },
      ];
      for (const c of cells) {
        for (const a of around) {
          if (otherCellSet.has(`${c.gx + a.dx},${c.gy + a.dy}`)) {
            sideFaces += 1;
            sideDirSet.add(a.dir);
          }
        }
      }
    }
  }

  // 4) 悬空检测:z>0 时每个 footprint 单元正下方(z0-1 层)都应有积木
  let unsupported = false;
  if (checkSupport && block.z > 0) {
    unsupported = cells.some((c) => {
      const below = hash.queryPoint(c.gx, c.gy);
      return !below.some(
        (b) => b.id !== block.id && verticalInterval(b).z1 === block.z
      );
    });
  }

  // 咬合面数量:顶/底面各计 1 面,侧面按接触方向数计面(最多 4)
  const biteFaces =
    (bottomBite ? 1 : 0) + (topBite ? 1 : 0) + sideDirSet.size;

  return {
    collisions,
    biteStuds,
    sideFaces,
    biteFaces,
    unsupported,
  };
}

/**
 * 全量分析(导入/打开方案时使用)
 * @returns {Map<blockId, result>}
 */
export function analyzeAll(blocks) {
  const hash = new SpatialHash();
  for (const b of blocks) hash.add(b);
  const results = new Map();
  for (const b of blocks) {
    results.set(b.id, analyzeBlock(b, hash));
  }
  return { hash, results };
}

/**
 * 收集所有碰撞涉及的凸点单元(用于红色高亮)
 */
export function collectConflictCells(results) {
  const set = new Set();
  for (const result of results.values()) {
    for (const col of result.collisions) {
      for (const c of col.cells) set.add(`${c.gx},${c.gy}`);
    }
  }
  return set;
}
