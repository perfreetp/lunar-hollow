import { CoatingTint, FritPattern, GlassType, type ProjectConfig } from './types';
import { defaultCells } from './grid';

/** 方案文件的封装头，导入时先校验 magic/version 再解析正文 */
export interface SchemeFile {
  magic: 'CURTAIN_WALL_SCHEME';
  version: 1;
  exportedAt: string;
  config: ProjectConfig;
}

export const SCHEME_MAGIC = 'CURTAIN_WALL_SCHEME';

export function defaultProject(): ProjectConfig {
  const grid = { cols: 8, rows: 6, width: 16, height: 9, barWidth: 0.12 };
  return {
    version: 1,
    name: '航站楼 T2 出发层幕墙方案',
    grid,
    sun: { hourAngleDeg: 30, altitudeDeg: 45 },
    room: { depth: 14, halfWidth: 10 },
    doubleLayer: false,
    layerGap: 0.6,
    cells: defaultCells(grid),
  };
}

export class SchemeValidationError extends Error {}

function isNum(v: unknown, lo: number, hi: number): boolean {
  return typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
}

function isInt(v: unknown, lo: number, hi: number): boolean {
  return typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
}

/**
 * 校验并归一化导入的 JSON。结构非法时抛 SchemeValidationError，
 * 保证渲染层拿到的配置永远完整、范围合法。
 */
export function validateConfig(raw: unknown): ProjectConfig {
  if (typeof raw !== 'object' || raw === null) throw new SchemeValidationError('方案不是对象');
  const r = raw as Record<string, unknown>;
  if (r.version !== 1) throw new SchemeValidationError(`不支持的方案版本: ${String(r.version)}`);
  if (typeof r.name !== 'string') throw new SchemeValidationError('缺少方案名称');

  const g = r.grid as Record<string, unknown> | undefined;
  if (!g) throw new SchemeValidationError('缺少 grid');
  const cols = g.cols;
  const rows = g.rows;
  const width = g.width;
  const height = g.height;
  const barWidth = g.barWidth;
  if (!isInt(cols, 1, 40) || !isInt(rows, 1, 40))
    throw new SchemeValidationError('grid.cols/rows 须为 1~40 的整数');
  if (!isNum(width, 1, 200) || !isNum(height, 1, 200))
    throw new SchemeValidationError('grid.width/height 范围非法');
  if (!isNum(barWidth, 0.01, 2)) throw new SchemeValidationError('barWidth 范围非法');

  const s = r.sun as Record<string, unknown> | undefined;
  if (!s || !isNum(s.hourAngleDeg, -180, 180) || !isNum(s.altitudeDeg, 1, 90))
    throw new SchemeValidationError('sun 参数非法');

  const rm = r.room as Record<string, unknown> | undefined;
  if (!rm || !isNum(rm.depth, 1, 200) || !isNum(rm.halfWidth, 1, 200))
    throw new SchemeValidationError('room 参数非法');

  if (typeof r.doubleLayer !== 'boolean' || !isNum(r.layerGap, 0.05, 5))
    throw new SchemeValidationError('双层参数非法');

  if (!Array.isArray(r.cells) || r.cells.length !== (cols as number) * (rows as number))
    throw new SchemeValidationError('cells 长度与分格数不一致');

  const cells = (r.cells as unknown[]).map((c, i) => validateCell(c, i));
  return {
    version: 1,
    name: r.name,
    grid: {
      cols: cols as number,
      rows: rows as number,
      width: width as number,
      height: height as number,
      barWidth: barWidth as number,
    },
    sun: { hourAngleDeg: s.hourAngleDeg as number, altitudeDeg: s.altitudeDeg as number },
    room: { depth: rm.depth as number, halfWidth: rm.halfWidth as number },
    doubleLayer: r.doubleLayer,
    layerGap: r.layerGap as number,
    cells,
  };
}

function validateCell(raw: unknown, index: number): ProjectConfig['cells'][number] {
  if (typeof raw !== 'object' || raw === null)
    throw new SchemeValidationError(`第 ${index} 格不是对象`);
  const c = raw as Record<string, unknown>;
  if (!Object.values(GlassType).includes(c.type as GlassType))
    throw new SchemeValidationError(`第 ${index} 格玻璃类型非法`);
  if (!isNum(c.transmittance, 0.1, 0.9))
    throw new SchemeValidationError(`第 ${index} 格透射率须在 0.1~0.9`);
  if (!Object.values(CoatingTint).includes(c.tint as CoatingTint))
    throw new SchemeValidationError(`第 ${index} 格镀膜色偏非法`);
  const f = c.frit as Record<string, unknown> | undefined;
  if (
    !f ||
    !Object.values(FritPattern).includes(f.pattern as FritPattern) ||
    !isNum(f.coverage, 0.1, 0.9) ||
    !isNum(f.scale, 0.02, 2)
  ) {
    throw new SchemeValidationError(`第 ${index} 格彩釉遮罩非法`);
  }
  return {
    type: c.type as GlassType,
    transmittance: c.transmittance as number,
    tint: c.tint as CoatingTint,
    frit: {
      pattern: f.pattern as FritPattern,
      coverage: f.coverage as number,
      scale: f.scale as number,
    },
  };
}

/** 导出：序列化为带文件头的 JSON 字符串 */
export function exportScheme(config: ProjectConfig, exportedAt: string): string {
  const file: SchemeFile = {
    magic: SCHEME_MAGIC,
    version: 1,
    exportedAt,
    // 深拷贝，避免把 Vue 代理直接序列化
    config: JSON.parse(JSON.stringify(config)),
  };
  return JSON.stringify(file, null, 2);
}

/** 导入：接受任意 JSON 文本，校验通过后返回完整配置 */
export function importScheme(text: string): ProjectConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SchemeValidationError('文件不是合法 JSON');
  }
  const f = parsed as Partial<SchemeFile> | undefined;
  if (!f || f.magic !== SCHEME_MAGIC)
    throw new SchemeValidationError('缺少方案文件标识，可能不是本工具导出的文件');
  return validateConfig(f.config);
}
