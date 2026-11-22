import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBlock,
  footprintCells,
  BASE_PLATE_SIZE,
  resetIdCounter,
} from '../src/engine/constants.js';
import { SpatialHash } from '../src/engine/spatialHash.js';
import { analyzeBlock, analyzeAll, collectConflictCells } from '../src/engine/collision.js';
import { snapToGrid } from '../src/engine/snapping.js';

beforeEach(() => resetIdCounter(1));

describe('空间哈希', () => {
  it('按凸点单元索引并支持邻域查询', () => {
    const hash = new SpatialHash();
    const a = createBlock('plate-2x2', 'red', 0, 0, 0);
    const b = createBlock('plate-1x2', 'blue', 2, 0, 0);
    hash.add(a);
    hash.add(b);
    expect(hash.queryPoint(0, 0).map((x) => x.id)).toEqual([a.id]);
    expect(hash.queryCells(footprintCells(a), a.id).map((x) => x.id)).toEqual([]);
    expect(hash.queryCells([{ gx: 2, gy: 0 }], a.id).map((x) => x.id)).toEqual([b.id]);
  });
});

describe('碰撞检测', () => {
  it('同层 footprint 重叠判定为实体碰撞', () => {
    const hash = new SpatialHash();
    const a = createBlock('plate-2x2', 'red', 0, 0, 0);
    const b = createBlock('plate-2x2', 'blue', 1, 1, 0);
    hash.add(a);
    hash.add(b);
    const r = analyzeBlock(a, hash);
    expect(r.collisions).toHaveLength(1);
    expect(r.collisions[0].blockId).toBe(b.id);
    expect(r.collisions[0].cells).toContainEqual({ gx: 1, gy: 1 });
  });

  it('上下叠放不碰撞,记录凸点咬合', () => {
    const hash = new SpatialHash();
    const base = createBlock('plate-2x2', 'red', 0, 0, 0);
    const top = createBlock('plate-2x2', 'blue', 0, 0, 1);
    hash.add(base);
    hash.add(top);
    const r = analyzeBlock(top, hash);
    expect(r.collisions).toHaveLength(0);
    expect(r.biteStuds).toBe(4);
    expect(r.biteFaces).toBeGreaterThanOrEqual(1);
  });

  it('高度不同但垂直区间相交仍为碰撞', () => {
    const hash = new SpatialHash();
    // 砖高 3 板层,从 z=0 起占 0..3;另一块板从 z=2 起同 footprint
    const brick = createBlock('brick-2x2', 'red', 0, 0, 0);
    const plate = createBlock('plate-2x2', 'blue', 0, 0, 2);
    hash.add(brick);
    hash.add(plate);
    expect(analyzeBlock(plate, hash).collisions).toHaveLength(1);
  });

  it('侧面贴合计入侧面咬合方向', () => {
    const hash = new SpatialHash();
    const a = createBlock('brick-1x2', 'red', 0, 0, 0);
    const b = createBlock('brick-1x2', 'blue', 2, 0, 0);
    hash.add(a);
    hash.add(b);
    const r = analyzeBlock(a, hash);
    expect(r.collisions).toHaveLength(0);
    expect(r.sideFaces).toBe(1); // 1x2 沿 x 仅 1 格宽,接触面为 1 条边
    expect(r.biteFaces).toBe(1); // 仅一个侧面方向接触
  });

  it('悬空积木被标记 unsupported', () => {
    const hash = new SpatialHash();
    const support = createBlock('plate-2x2', 'red', 0, 0, 0);
    const floating = createBlock('plate-1x1', 'blue', 4, 4, 1);
    hash.add(support);
    hash.add(floating);
    expect(analyzeBlock(floating, hash).unsupported).toBe(true);
    expect(analyzeBlock(support, hash).unsupported).toBe(false);
  });

  it('全量分析能汇总全部冲突凸点', () => {
    const blocks = [
      createBlock('plate-2x2', 'red', 0, 0, 0),
      createBlock('plate-2x2', 'blue', 1, 0, 0),
      createBlock('plate-2x2', 'green', 3, 3, 0),
    ];
    const { results } = analyzeAll(blocks);
    const conflict = collectConflictCells(results);
    expect(conflict.size).toBe(2); // 1x2 重叠带
  });
});

describe('吸附', () => {
  it('阈值内吸附到最近凸点', () => {
    const block = createBlock('plate-2x2', 'red', 0, 0, 0);
    // 中心 1.55,锚点 raw = 0.55 -> 最近 1,距离 0.45 < 0.5
    const snap = snapToGrid({ x: 1.55, y: 1.5 }, block, 0.5);
    expect(snap).toEqual({ x: 1, y: 1 });
  });

  it('超过阈值不吸附', () => {
    const block = createBlock('plate-2x2', 'red', 0, 0, 0);
    // x=2.0 时锚点恰好整数(零偏差);y=2.9 锚点 1.9 偏差 0.1
    // 阈值 0.05 拒绝,阈值 0.2 接受
    expect(snapToGrid({ x: 2.0, y: 2.9 }, block, 0.05)).toBeNull();
    expect(snapToGrid({ x: 2.0, y: 2.9 }, block, 0.2)).toEqual({ x: 1, y: 2 });
  });

  it('吸附结果被约束在拼装台边界内', () => {
    const block = createBlock('plate-2x4', 'red', 0, 0, 0); // w=4
    const snap = snapToGrid(
      { x: BASE_PLATE_SIZE + 10, y: BASE_PLATE_SIZE + 10 },
      block,
      1
    );
    expect(snap.x).toBe(BASE_PLATE_SIZE - 4);
    expect(snap.y).toBe(BASE_PLATE_SIZE - 2);
  });

  it('旋转后 footprint 尺寸交换', () => {
    const block = createBlock('brick-1x4', 'red', 0, 0, 0, 1);
    const cells = footprintCells(block);
    expect(cells).toHaveLength(4);
    const xs = new Set(cells.map((c) => c.gx));
    const ys = new Set(cells.map((c) => c.gy));
    expect(xs.size).toBe(1);
    expect(ys.size).toBe(4);
  });
});

describe('序列化', () => {
  it('导出再导入保持位置与朝向,并包含咬合关系', async () => {
    const { serializePlan, deserializePlan } = await import(
      '../src/engine/serialization.js'
    );
    const blocks = [
      createBlock('plate-2x2', 'red', 0, 0, 0),
      createBlock('plate-2x2', 't-blue', 0, 0, 1),
      createBlock('brick-1x2', 'green', 2, 0, 0),
    ];
    const plan = serializePlan(blocks, { name: '测试方案' });
    expect(plan.format).toBe('block-assembly-plan');
    expect(plan.biteRelations).toHaveLength(3);
    expect(plan.blocks[1].rotation).toBe(0);

    const restored = deserializePlan(plan);
    expect(restored.blocks).toHaveLength(3);
    expect(restored.blocks[1].colorId).toBe('t-blue');
    expect(restored.blocks[0]).toMatchObject({ x: 0, y: 0, z: 0, rot: 0 });
  });

  it('拒绝格式不匹配的文件', async () => {
    const { deserializePlan } = await import('../src/engine/serialization.js');
    expect(() => deserializePlan({ format: 'other' })).toThrow();
  });
});
