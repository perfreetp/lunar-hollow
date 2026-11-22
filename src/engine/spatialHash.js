// 空间哈希:以凸点网格为键,支持 120+ 积木时的 O(1) 邻域查询
import { footprintCells, verticalInterval } from './constants.js';

const key = (gx, gy) => gx * 65536 + gy;

export class SpatialHash {
  constructor() {
    this.cells = new Map(); // "gx,gy" -> Map(blockId -> block)
  }

  clear() {
    this.cells.clear();
  }

  add(block) {
    const { z0, z1 } = verticalInterval(block);
    for (const { gx, gy } of footprintCells(block)) {
      const k = key(gx, gy);
      let bucket = this.cells.get(k);
      if (!bucket) {
        bucket = new Map();
        this.cells.set(k, bucket);
      }
      bucket.set(block.id, block);
    }
    block._z0 = z0;
    block._z1 = z1;
  }

  // 查询与给定网格单元集合重叠(水平方向)的其它积木
  queryCells(cells, excludeId) {
    const hits = new Map();
    for (const { gx, gy } of cells) {
      const bucket = this.cells.get(key(gx, gy));
      if (!bucket) continue;
      for (const [id, block] of bucket) {
        if (id !== excludeId) hits.set(id, block);
      }
    }
    return [...hits.values()];
  }

  // 查询 footprint 及其四邻一圈内的积木(含侧面相邻但不共享单元的块)
  queryNeighborhood(cells, excludeId) {
    const hits = new Map();
    for (const { gx, gy } of cells) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const bucket = this.cells.get(key(gx + dx, gy + dy));
          if (!bucket) continue;
          for (const [id, block] of bucket) {
            if (id !== excludeId) hits.set(id, block);
          }
        }
      }
    }
    return [...hits.values()];
  }

  // 查询单个凸点位置、指定层上的积木(用于支撑判断)
  queryPoint(gx, gy) {
    const bucket = this.cells.get(key(gx, gy));
    return bucket ? [...bucket.values()] : [];
  }
}
