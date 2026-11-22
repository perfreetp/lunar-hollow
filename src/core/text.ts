/**
 * 跑道号码矢量字形：块状无衬线字体，笔画在局部米坐标系下加厚为填充四边形。
 * 字模网格 6 宽 × 10 高，支持数字 0–9 与后缀 L / C / R / W。
 */
import type { LocalPoint } from './types.js';
import type { LocalFrame } from './geo.js';

/** 一条笔画（网格坐标折线，单段或多段） */
type Stroke = [number, number, number, number];

const A: Stroke = [0, 10, 6, 10]; // 顶
const B: Stroke = [6, 5, 6, 10]; // 右上
const C: Stroke = [6, 0, 6, 5]; // 右下
const D: Stroke = [0, 0, 6, 0]; // 底
const E: Stroke = [0, 0, 0, 5]; // 左下
const F: Stroke = [0, 5, 0, 10]; // 左上
const G: Stroke = [0, 5, 6, 5]; // 中

const GLYPHS: Record<string, Stroke[]> = {
  '0': [A, B, C, D, E, F],
  '1': [B, C],
  '2': [A, B, G, E, D],
  '3': [A, B, G, C, D],
  '4': [F, G, B, C],
  '5': [A, F, G, C, D],
  '6': [A, F, G, E, C, D],
  '7': [A, B, C],
  '8': [A, B, C, D, E, F, G],
  '9': [A, B, C, D, F, G],
  L: [F, E, D],
  C: [A, F, E, D],
  R: [A, F, B, G, C, [6, 5, 0, 0]],
  W: [
    [0, 10, 1.5, 0],
    [1.5, 0, 3, 5],
    [3, 5, 4.5, 0],
    [4.5, 0, 6, 10]
  ]
};

export function isGlyphSupported(ch: string): boolean {
  return ch in GLYPHS;
}

/** 任意角度笔画加厚为四边形（z 按坡面赋值） */
function strokeToQuad(
  frame: LocalFrame,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  halfWidth: number
): LocalPoint[] {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1e-9;
  const nx = (-dy / len) * halfWidth;
  const ny = (dx / len) * halfWidth;
  const z = (x: number) => x * frame.slope;
  const p = (x: number, y: number): LocalPoint => ({ x, y, z: z(x) });
  return [
    p(ax + nx, ay + ny),
    p(bx + nx, by + ny),
    p(bx - nx, by - ny),
    p(ax - nx, ay - ny)
  ];
}

export interface PlacedGlyph {
  char: string;
  quads: LocalPoint[][];
}

/**
 * 放置一个号码/后缀字符。
 * @param originX 字符底边（网格 y=0）对应的局部 x
 * @param centerY 字符横向中心对应的局部 y
 * @param scale 网格单位 -> 米（= 字高 / 10）
 * @param dir +1 = 字符顶部朝向 +x（0 号端）；-1 = 朝向 -x（1 号端），整体旋转 180°
 */
export function placeGlyph(
  frame: LocalFrame,
  char: string,
  originX: number,
  centerY: number,
  scale: number,
  dir: 1 | -1,
  strokeHalfWidth: number
): PlacedGlyph {
  const strokes = GLYPHS[char] ?? [];
  const quads = strokes.map(([gax, gay, gbx, gby]) => {
    // 网格 -> 米（先缩放平移到字符中心，再按 dir 旋转 180°）
    const map = (gx: number, gy: number): [number, number] => {
      const lx = (gx - 3) * scale;
      const ly = gy * scale;
      return [originX + dir * ly, centerY - dir * lx];
    };
    const [ax, ay] = map(gax, gay);
    const [bx, by] = map(gbx, gby);
    return strokeToQuad(frame, ax, ay, bx, by, strokeHalfWidth);
  });
  return { char, quads };
}

/** 一组字符（如 "36L"）的总宽度（网格单位） */
export function textWidthGrid(text: string): number {
  let w = 0;
  for (const ch of text) {
    if (!(ch in GLYPHS)) continue;
    w += 7; // 字形宽 6 + 间距 1
  }
  return Math.max(0, w - 1);
}

/**
 * 放置整组号码，返回每个字符的四边形；整组相对中线居中。
 * @param baseX 组底边所在 x（近端阈值内移后的位置）
 * @param dir +1 朝 +x 排列，-1 朝 -x 排列
 */
export function placeDesignationText(
  frame: LocalFrame,
  text: string,
  baseX: number,
  scale: number,
  dir: 1 | -1,
  strokeHalfWidth: number
): PlacedGlyph[] {
  const totalW = textWidthGrid(text) * scale;
  const result: PlacedGlyph[] = [];
  let cursor = -totalW / 2; // 横向（局部 y）游标
  for (const char of text) {
    if (!(char in GLYPHS)) continue;
    const centerY = cursor + 3 * scale;
    result.push(placeGlyph(frame, char, baseX, centerY, scale, dir, strokeHalfWidth));
    cursor += 7 * scale;
  }
  return result;
}

/** 跑道方位角 -> 跑道号码（1–36） */
export function bearingToDesignation(bearing: number): number {
  const rounded = Math.round(((bearing % 360) + 360) % 360 / 10);
  return ((rounded - 1 + 36) % 36) + 1;
}
