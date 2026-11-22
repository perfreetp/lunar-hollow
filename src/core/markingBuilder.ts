/**
 * 标线生成器：把跑道参数转换为局部坐标系下的标线要素（真实尺寸）。
 * 所有要素共用同一局部坐标系与坡面高程函数，因此不同标线段在阈值接缝处天然对齐。
 */
import { createFrame, lineAlongX, rectToQuad, type LocalFrame } from './geo';
import { bearingToDesignation, placeDesignationText } from './text';
import type {
  LODLevel,
  MarkingBuildOptions,
  MarkingFeature,
  MarkingType,
  RunwayConfig
} from './types';

/** LOD 级别常量 */
const LOD_FULL = 0; // 完整真实几何
const LOD_MEDIUM = 1; // 中距简化
const LOD_SIMPLE = 2; // 远距合并线

export interface BuilderResult {
  features: MarkingFeature[];
  /** 0 号端 / 1 号端号码文本（含后缀） */
  designation0: string;
  designation1: string;
}

export class MarkingBuilder {
  private nextId = 1;
  private frame: LocalFrame;
  private readonly opts: MarkingBuildOptions;
  private readonly runway: RunwayConfig;

  constructor(runway: RunwayConfig, opts: MarkingBuildOptions) {
    this.runway = runway;
    this.opts = opts;
    this.frame = createFrame(runway);
  }

  private id(): number {
    return this.nextId++;
  }

  private line(type: MarkingType, local: ReturnType<typeof lineAlongX>, width: number, lodMax: number,
    meta?: Record<string, number | string>): MarkingFeature {
    return {
      id: this.id(),
      type,
      runwayId: this.runway.id,
      local,
      width,
      kind: 'line',
      lodMax,
      meta
    };
  }

  private quad(type: MarkingType, local: ReturnType<typeof rectToQuad>,
    lodMax: number, meta?: Record<string, number | string>): MarkingFeature {
    return {
      id: this.id(),
      type,
      runwayId: this.runway.id,
      local,
      width: 0,
      kind: 'quad',
      lodMax,
      meta
    };
  }

  /** 中线：带留白的虚线 + 远距合并的连续线（同要素族，LOD 切换无缝） */
  private buildCenterline(): MarkingFeature[] {
    const { length } = this.runway;
    const o = this.opts;
    const out: MarkingFeature[] = [];
    let x = o.dashInset;
    let dashIndex = 0;
    while (x + o.dashLength <= length - o.dashInset + 1e-6) {
      const x1 = Math.min(x + o.dashLength, length - o.dashInset);
      out.push(
        this.line(
          'centerline',
          lineAlongX(this.frame, 0, x, x1),
          o.centerlineWidth,
          LOD_MEDIUM,
          { segment: dashIndex }
        )
      );
      x += o.dashLength + o.gapLength;
      dashIndex++;
    }
    // LOD2：整条连续中线（贴合坡面取多采样点）
    out.push(
      this.line(
        'centerline',
        lineAlongX(this.frame, 0, o.dashInset, length - o.dashInset, 64),
        o.centerlineWidth,
        LOD_SIMPLE,
        { simplified: 1 }
      )
    );
    return out;
  }

  /** 边线：两条连续实线（贴坡），LOD2 保留 */
  private buildEdge(): MarkingFeature[] {
    const { length, width } = this.runway;
    const o = this.opts;
    const y = width / 2 - o.edgeInset;
    const samples = Math.max(8, Math.ceil(length / 50));
    const lod = LOD_SIMPLE;
    return [
      this.line('edge', lineAlongX(this.frame, y, 0, length, samples), o.edgeWidth, lod, { side: 1 }),
      this.line('edge', lineAlongX(this.frame, -y, 0, length, samples), o.edgeWidth, lod, { side: -1 })
    ];
  }

  /** 入口标志：两端各一组纵向条带，数量按 FAA 规则随跑道宽度确定 */
  private buildThreshold(): MarkingFeature[] {
    const { length, width } = this.runway;
    const o = this.opts;
    const out: MarkingFeature[] = [];
    const stripes = o.thresholdStripes > 0 ? o.thresholdStripes : autoStripeCount(width);
    const span = (stripes - 1) * o.thresholdGap;
    for (const end of [0, 1] as const) {
      const dir = end === 0 ? 1 : -1;
      const base = end === 0 ? o.thresholdInset : length - o.thresholdInset;
      for (let i = 0; i < stripes; i++) {
        const cy = -span / 2 + i * o.thresholdGap;
        const y0 = cy - o.thresholdStripeWidth / 2;
        const y1 = cy + o.thresholdStripeWidth / 2;
        const x0 = base;
        const x1 = base + dir * o.thresholdStripeLength;
        const [xa, xb] = x0 < x1 ? [x0, x1] : [x1, x0];
        out.push(
          this.quad('threshold', rectToQuad(this.frame, xa, xb, y0, y1), LOD_MEDIUM, {
            end,
            stripe: i
          })
        );
      }
    }
    return out;
  }

  /** 接地带标志：中线两侧成对的纵向矩形组，两端对称布设 */
  private buildTouchdown(): MarkingFeature[] {
    const { length } = this.runway;
    const o = this.opts;
    const out: MarkingFeature[] = [];
    const half = length / 2;
    for (const end of [0, 1] as const) {
      const dir = end === 0 ? 1 : -1;
      const first = end === 0 ? o.touchdownInset : length - o.touchdownInset;
      let pair = 0;
      while (true) {
        const center = first + dir * pair * o.touchdownPairSpacing;
        // 越过中点即停，保证两端对称不错位
        if ((end === 0 && center >= half) || (end === 1 && center <= half)) break;
        const x0 = center - o.touchdownBarLength / 2;
        const x1 = center + o.touchdownBarLength / 2;
        const yInner = o.touchdownPairGap;
        const yOuter = o.touchdownPairGap + o.touchdownBarWidth;
        for (const side of [1, -1] as const) {
          const [ya, yb] = side === 1 ? [yInner, yOuter] : [-yOuter, -yInner];
          out.push(
            this.quad('touchdown', rectToQuad(this.frame, x0, x1, ya, yb), LOD_FULL, {
              end,
              pair,
              side
            })
          );
        }
        pair++;
      }
    }
    return out;
  }

  /** 跑道号码：按方位自动生成，字符为真实尺寸矢量多边形，朝向来机方向 */
  private buildDesignation(designation0: string, designation1: string): MarkingFeature[] {
    const { length } = this.runway;
    const o = this.opts;
    const out: MarkingFeature[] = [];
    const scale = o.designationHeight / 10;
    const halfStroke = scale * 0.9; // 笔画宽约 1.8 网格单位
    const groups: Array<{ text: string; baseX: number; dir: 1 | -1; end: 0 | 1 }> = [
      { text: designation0, baseX: o.designationInset, dir: 1, end: 0 },
      { text: designation1, baseX: length - o.designationInset, dir: -1, end: 1 }
    ];
    for (const g of groups) {
      const glyphs = placeDesignationText(this.frame, g.text, g.baseX, scale, g.dir, halfStroke);
      glyphs.forEach((glyph, gi) => {
        glyph.quads.forEach((quad, si) => {
          out.push(
            this.quad('designation', quad, LOD_MEDIUM, {
              end: g.end,
              char: glyph.char,
              glyph: gi,
              stroke: si
            })
          );
        });
      });
    }
    return out;
  }

  build(): BuilderResult {
    const d0 = bearingToDesignation(this.runway.bearing);
    const d1 = bearingToDesignation(this.runway.bearing + 180);
    const suffix = (s?: string) => (s && s !== 'W' ? s : s === 'W' ? 'W' : '');
    const designation0 = `${String(d0).padStart(2, '0')}${suffix(this.runway.suffix0)}`;
    const designation1 = `${String(d1).padStart(2, '0')}${suffix(this.runway.suffix1)}`;
    const features = [
      ...this.buildCenterline(),
      ...this.buildEdge(),
      ...this.buildThreshold(),
      ...this.buildTouchdown(),
      ...this.buildDesignation(designation0, designation1)
    ];
    return { features, designation0, designation1 };
  }
}

/** FAA 规则：跑道宽度决定入口标志条带数 */
function autoStripeCount(width: number): number {
  if (width >= 45) return 16;
  if (width >= 35) return 12;
  if (width >= 30) return 10;
  if (width >= 23) return 8;
  return 6;
}

export function buildRunwayMarkings(
  runway: RunwayConfig,
  opts: MarkingBuildOptions
): BuilderResult {
  return new MarkingBuilder(runway, opts).build();
}
