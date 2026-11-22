/**
 * 悬链线数学工具（单位：米、牛、千克）
 *
 * 单跨悬链线，水平张力分量 H 恒定。取局部坐标 x∈[0,dx]，
 * 令 c = H / (q g)，曲线为 y(x) = c·cosh((x-x0)/c) + b 的形式。
 *
 * 求解目标：给定两端点水平距离 dx、高差 dy、水平张力 H、单位长度重量 w=qg，
 * 求端斜率参数，使曲线过两端点。
 */

export interface CatenarySpan {
  /** 水平张力分量 H (N) */
  H: number;
  /** 单位长度重量 w = q·g (N/m) */
  w: number;
  /** 水平投影长度 (m) */
  dx: number;
  /** 右端点相对左端点的高差 dy = y1 - y0 (m) */
  dy: number;
  /** c = H/w (m) */
  c: number;
  /** 左端参数 uL = -dx/(2c) + s */
  uR: number;
  uL: number;
  /** 左端竖向张力分量 V0 (N)，向上为正（V = w·c·sinh(u)） */
  V0: number;
  /** 右端竖向张力分量 V1 (N) */
  V1: number;
  /** 弧长 (m) */
  length: number;
  /** 左端点（局部原点，外部组装时平移/旋转到 3D） */
  x0: number;
  y0: number;
}

/** asinh，兼容写法 */
function asinh(x: number): number {
  return Math.asinh ? Math.asinh(x) : Math.log(x + Math.sqrt(x * x + 1));
}

/**
 * 解析求解单跨悬链线。
 * 原理：由 dy = c·(cosh(uR)-cosh(uL))，dx = c·(uR-uL)，
 * 令 s=(uR+uL)/2、d=dx/(2c)，可得 sinh(s) = dy / (2c·sinh(d))，
 * 因此 s = asinh(dy / (2c·sinh(d)))，无需求根器，单步闭合解。
 */
export function solveCatenary(
  dx: number,
  dy: number,
  H: number,
  w: number,
  x0 = 0,
  y0 = 0,
): CatenarySpan {
  const c = H / w;
  let uL: number;
  let uR: number;
  let length: number;

  if (dx < 1e-9) {
    // 退化：两点水平重合，视为竖直线
    uL = 0;
    uR = 0;
    length = Math.abs(dy);
  } else {
    const d = dx / (2 * c);
    const s = asinh(dy / (2 * c * Math.sinh(d)));
    uL = -d + s;
    uR = d + s;
    length = c * (Math.sinh(uR) - Math.sinh(uL));
  }

  const V0 = w * c * Math.sinh(uL);
  const V1 = w * c * Math.sinh(uR);

  return { H, w, dx, dy, c, uL, uR, V0, V1, length, x0, y0 };
}

/** 局部 x 处的 y（相对左端点，y 轴向上） */
export function catY(span: CatenarySpan, x: number): number {
  if (span.dx < 1e-9) return (x / 1e-9) * span.dy; // 退化分支（一般不会被调用）
  const u = span.uL + x / span.c;
  return span.c * (Math.cosh(u) - Math.cosh(span.uL));
}

/** 局部 x 处切线斜率 dy/dx = sinh(u) */
export function catSlope(span: CatenarySpan, x: number): number {
  const u = span.uL + x / span.c;
  return Math.sinh(u);
}

/**
 * 弧长参数 s（距左端）→ 局部 x。
 * 由 s = c·(sinh(u)-sinh(uL)) 反解：u = asinh(sinh(uL) + s/c)。
 */
export function catXAtArc(span: CatenarySpan, s: number): number {
  if (span.dx < 1e-9) return 0;
  const u = asinh(Math.sinh(span.uL) + s / span.c);
  return span.c * (u - span.uL);
}

/** 局部 x 处的累计弧长 */
export function catArcAtX(span: CatenarySpan, x: number): number {
  const u = span.uL + x / span.c;
  return span.c * (Math.sinh(u) - Math.sinh(span.uL));
}

/** 局部 x 处单位切向量（2D，x 向沿水平投影方向） */
export function catTangent(span: CatenarySpan, x: number): [number, number] {
  const sh = catSlope(span, x);
  const inv = 1 / Math.sqrt(1 + sh * sh);
  return [inv, sh * inv];
}

/** 曲率 κ = w·H / (H²+V²)^(3/2) 的局部 x 版本：κ = 1/(c·cosh³(u)) */
export function catCurvature(span: CatenarySpan, x: number): number {
  const u = span.uL + x / span.c;
  const ch = Math.cosh(u);
  return 1 / (span.c * ch * ch * ch);
}
