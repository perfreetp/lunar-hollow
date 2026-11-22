import { describe, expect, it } from 'vitest';
import { createFrame, localToLngLat, lngLatToLocal, flatDistance, geoDistance3D } from '../src/core/geo.js';
import { bearingToDesignation, placeDesignationText, textWidthGrid } from '../src/core/text.js';
import { buildRunwayMarkings } from '../src/core/markingBuilder.js';
import { measureMarkingDistance, measureAcrossFrames } from '../src/core/measure.js';
import {
  exportMarkingFile,
  importMarkingFile,
  RunwayFeatureSet
} from '../src/core/featureSource.js';
import { DEFAULT_BUILD_OPTIONS, type RunwayConfig } from '../src/core/types.js';
import { stressRunways } from '../src/core/scenarios.js';

const runway: RunwayConfig = {
  id: 'T1',
  origin: { lng: 120, lat: 31 },
  length: 3200,
  width: 45,
  bearing: 90,
  slopePct: 1.5,
  suffix0: 'L',
  suffix1: 'R'
};

describe('局部投影正反算', () => {
  it('局部坐标往返经纬度保持一致', () => {
    const frame = createFrame(runway);
    const p = { x: 1234.5, y: -12.75, z: 0 };
    const g = localToLngLat(frame, p);
    const back = lngLatToLocal(frame, g);
    expect(back.x).toBeCloseTo(p.x, 6);
    expect(back.y).toBeCloseTo(p.y, 6);
  });

  it('纵向坡度写入高程 z = x * slope', () => {
    const frame = createFrame(runway);
    const g = localToLngLat(frame, { x: 1000, y: 0, z: 1000 * 0.015 });
    expect(g.alt).toBeCloseTo(15, 9);
  });

  it('投影方位正确：正北跑道 +x 朝纬度增大、+y 朝西（经度减小）', () => {
    const north: RunwayConfig = {
      ...runway,
      bearing: 0,
      origin: { lng: 120, lat: 31 }
    };
    const frame = createFrame(north);
    const along = localToLngLat(frame, { x: 1000, y: 0, z: 0 });
    expect(along.lat).toBeGreaterThan(31);
    expect(along.lng).toBeCloseTo(120, 9);
    const left = localToLngLat(frame, { x: 0, y: 500, z: 0 });
    expect(left.lng).toBeLessThan(120);
    expect(left.lat).toBeCloseTo(31, 9);
    // 逆变换一致
    const back = lngLatToLocal(frame, along);
    expect(back.x).toBeCloseTo(1000, 6);
    expect(back.y).toBeCloseTo(0, 6);
  });

  it('正东跑道 +x 朝经度增大方向', () => {
    const east: RunwayConfig = { ...runway, bearing: 90, origin: { lng: 120, lat: 31 } };
    const frame = createFrame(east);
    const g = localToLngLat(frame, { x: 1000, y: 0, z: 0 });
    expect(g.lng).toBeGreaterThan(120);
    expect(g.lat).toBeCloseTo(31, 9);
  });

  it('边线两条 y 坐标距中心为半宽减内缩', () => {
    const { features } = buildRunwayMarkings(runway, DEFAULT_BUILD_OPTIONS);
    const edges = features.filter((f) => f.type === 'edge');
    expect(edges).toHaveLength(2);
    const expected = runway.width / 2 - DEFAULT_BUILD_OPTIONS.edgeInset;
    for (const e of edges) {
      expect(Math.abs(e.local[0].y)).toBeCloseTo(expected, 9);
    }
  });
});

describe('标线生成', () => {
  it('中线虚线段长与间隔可调，且只落在留白区间内', () => {
    const opts = { ...DEFAULT_BUILD_OPTIONS, dashLength: 40, gapLength: 25, dashInset: 50 };
    const { features } = buildRunwayMarkings(runway, opts);
    const dashes = features.filter(
      (f) => f.type === 'centerline' && f.kind === 'line' && f.meta?.simplified !== 1
    );
    expect(dashes.length).toBeGreaterThan(0);
    for (const d of dashes) {
      const x0 = d.local[0].x;
      const x1 = d.local[d.local.length - 1].x;
      expect(x1 - x0).toBeCloseTo(40, 6);
      expect(x0).toBeGreaterThanOrEqual(50 - 1e-6);
      expect(x1).toBeLessThanOrEqual(runway.length - 50 + 1e-6);
    }
    // 相邻虚线间距 = 段长 + 间隔
    const first = dashes[0].local;
    const second = dashes[1].local;
    expect(second[0].x - first[first.length - 1].x).toBeCloseTo(25, 6);
  });

  it('五类标线全部生成且 LOD 级别合法（0/1/2）', () => {
    const { features } = buildRunwayMarkings(runway, DEFAULT_BUILD_OPTIONS);
    const types = new Set(features.map((f) => f.type));
    expect(types.size).toBe(5);
    for (const f of features) {
      expect([0, 1, 2]).toContain(f.lodMax);
    }
  });

  it('远距 LOD2 中线为单条连续合并线', () => {
    const { features } = buildRunwayMarkings(runway, DEFAULT_BUILD_OPTIONS);
    const simple = features.filter((f) => f.type === 'centerline' && f.lodMax === 2);
    expect(simple).toHaveLength(1);
    expect(flatDistance(simple[0].local[0], simple[0].local.at(-1)!)).toBeGreaterThan(
      runway.length - 2 * DEFAULT_BUILD_OPTIONS.dashInset - 1
    );
  });

  it('入口标志两端对称、条带数量按宽度自动', () => {
    const { features } = buildRunwayMarkings(runway, DEFAULT_BUILD_OPTIONS);
    const th = features.filter((f) => f.type === 'threshold');
    // 45m 宽 -> 16 条/端
    expect(th).toHaveLength(32);
    const end0 = th.filter((f) => f.meta?.end === 0);
    const end1 = th.filter((f) => f.meta?.end === 1);
    expect(end0).toHaveLength(16);
    expect(end1).toHaveLength(16);
  });

  it('接缝对齐：阈值处号码/入口/接地带均基于同一 x 基准', () => {
    const o = DEFAULT_BUILD_OPTIONS;
    const { features } = buildRunwayMarkings(runway, o);
    const td0 = features.find((f) => f.type === 'touchdown' && f.meta?.end === 0 && f.meta?.pair === 0)!;
    const center0 = (td0.local[0].x + td0.local[2].x) / 2;
    expect(center0).toBeCloseTo(o.touchdownInset, 6);
    const th0 = features.find((f) => f.type === 'threshold' && f.meta?.end === 0)!;
    expect(th0.local[0].x).toBeCloseTo(o.thresholdInset, 6);
  });
});

describe('跑道号码', () => {
  it('方位角换算跑道号码（360 -> 36, 173 -> 17, 353 -> 35）', () => {
    expect(bearingToDesignation(360)).toBe(36);
    expect(bearingToDesignation(0)).toBe(36);
    expect(bearingToDesignation(173)).toBe(17);
    expect(bearingToDesignation(353)).toBe(35);
    expect(bearingToDesignation(94)).toBe(9);
  });

  it('号码字形生成真实尺寸四边形，朝向随 dir 翻转', () => {
    const frame = createFrame(runway);
    const g1 = placeDesignationText(frame, '35L', 100, 1.8, 1, 1.6);
    const g2 = placeDesignationText(frame, '35L', 100, 1.8, -1, 1.6);
    expect(g1).toHaveLength(3);
    expect(g1[0].quads.length).toBeGreaterThan(0);
    // 反向放置时四边形 x 分布对称到 baseX 另一侧
    const xs1 = g1.flatMap((g) => g.quads.flatMap((q) => q.map((p) => p.x)));
    const xs2 = g2.flatMap((g) => g.quads.flatMap((q) => q.map((p) => p.x)));
    expect(Math.max(...xs1) - 100).toBeCloseTo(100 - Math.min(...xs2), 6);
  });

  it('字宽网格估算为正且随字符数增长', () => {
    expect(textWidthGrid('35')).toBeGreaterThan(0);
    expect(textWidthGrid('35L')).toBeGreaterThan(textWidthGrid('35'));
  });
});

describe('间距测量', () => {
  it('两条边线的间距读数等于跑道可用净宽', () => {
    const frame = createFrame(runway);
    const { features } = buildRunwayMarkings(runway, DEFAULT_BUILD_OPTIONS);
    const edges = features.filter((f) => f.type === 'edge');
    const r = measureMarkingDistance(frame, edges[0], edges[1]);
    const expected = runway.width - 2 * DEFAULT_BUILD_OPTIONS.edgeInset - DEFAULT_BUILD_OPTIONS.edgeWidth;
    expect(r.distance).toBeCloseTo(expected, 6);
  });

  it('测量结果含坡面高程差', () => {
    const frame = createFrame(runway);
    const { features } = buildRunwayMarkings(runway, DEFAULT_BUILD_OPTIONS);
    const dashes = features.filter(
      (f) =>
        f.type === 'centerline' &&
        (f.meta?.segment === 0 || f.meta?.segment === 1) &&
        f.meta?.simplified !== 1
    );
    const r = measureMarkingDistance(frame, dashes[0], dashes[1]);
    expect(r.distance).toBeGreaterThan(0);
    expect(r.pointA.z).not.toBe(r.pointB.z);
  });

  it('跨跑道测量返回正的地理距离', () => {
    const rwB: RunwayConfig = {
      ...runway,
      id: 'T2',
      origin: { lng: 121, lat: 31.0 },
      bearing: 90
    };
    const frameA = createFrame(runway);
    const frameB = createFrame(rwB);
    const fA = buildRunwayMarkings(runway, DEFAULT_BUILD_OPTIONS).features.find(
      (f) => f.type === 'edge'
    )!;
    const fB = buildRunwayMarkings(rwB, DEFAULT_BUILD_OPTIONS).features.find(
      (f) => f.type === 'edge'
    )!;
    const r = measureAcrossFrames(frameA, fA, frameB, fB);
    // 原点经度相差 1°（同纬度约 96.5km），最近点不小于该量级的一半
    expect(r.distance).toBeGreaterThan(40000);
    expect(r.geoA.lng).not.toBe(r.geoB.lng);
    // 读数与直接大圆距离一致（采样误差 < 5%）
    const direct = geoDistance3D(r.geoA, r.geoB);
    expect(Math.abs(direct - r.distance)).toBeLessThan(direct * 0.05 + 1);
  });
});

describe('压测场景规模', () => {
  it('压测数据合计生成数万条标线要素', () => {
    const runways = stressRunways();
    expect(runways.length).toBeGreaterThanOrEqual(40);
    let total = 0;
    for (const rw of runways) {
      total += buildRunwayMarkings(rw, DEFAULT_BUILD_OPTIONS).features.length;
    }
    expect(total).toBeGreaterThan(20000);
  });
});

describe('导出与重新载入', () => {
  it('导出文件含每个要素的三维坐标与类型，重载后几何一致', () => {
    const set = new RunwayFeatureSet(runway);
    const built = buildRunwayMarkings(runway, DEFAULT_BUILD_OPTIONS);
    set.setFeatures(built.features);
    const file = exportMarkingFile([set], DEFAULT_BUILD_OPTIONS, {
      centerline: true,
      edge: true,
      threshold: true,
      touchdown: true,
      designation: true
    });
    expect(file.format).toBe('runway-markings-v1');
    expect(file.features.length).toBe(built.features.length);
    for (const ef of file.features) {
      expect(ef.markingType).toBeTruthy();
      const coords = ef.geometry.type === 'LineString' ? ef.geometry.coordinates : ef.geometry.coordinates[0];
      expect(coords[0]).toHaveLength(3);
    }

    const restored = importMarkingFile(file);
    expect(restored.sets).toHaveLength(1);
    const orig = built.features;
    const back = restored.sets[0].features;
    expect(back.length).toBe(orig.length);
    // 重载后局部坐标（反投影）与原始几何一致
    for (let i = 0; i < orig.length; i++) {
      expect(back[i].id).toBe(orig[i].id);
      expect(back[i].type).toBe(orig[i].type);
      expect(back[i].local.length).toBe(orig[i].local.length);
      for (let j = 0; j < orig[i].local.length; j++) {
        expect(back[i].local[j].x).toBeCloseTo(orig[i].local[j].x, 5);
        expect(back[i].local[j].y).toBeCloseTo(orig[i].local[j].y, 5);
      }
    }
  });

  it('拒绝错误格式标识', () => {
    expect(() => importMarkingFile({ format: 'wrong' } as never)).toThrow();
  });
});
