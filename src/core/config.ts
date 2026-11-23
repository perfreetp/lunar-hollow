import type {
  AssemblyState,
  LabConfig,
  PartKind,
  SuspensionDims,
  TravelSettings,
  ValidationMessage,
} from './model';
import {
  DEFAULT_DIMS,
  DEFAULT_TRAVEL,
  PART_PREREQUISITES,
  SOCKET_BY_ID,
  SOCKETS,
  sanitizeLayerOrder,
} from './rigSpec';
import { clamp, roundTo } from './math';

/* ------------------------------------------------------------------ *
 * Config serialisation.
 *
 * The exported file is a self-describing JSON document. `signature` is a
 * deterministic checksum over the geometry payload so two people can tell at a
 * glance whether they are looking at the same rig.
 * ------------------------------------------------------------------ */

export const CONFIG_FORMAT = 'rc-suspension-lab';
export const CONFIG_VERSION = 1;

const DIM_RANGES: Record<keyof SuspensionDims, [number, number]> = {
  lowerArmLength: [40, 160],
  upperArmLength: [30, 150],
  tieRodLength: [50, 190],
  kingpinLength: [30, 110],
  lowerStaticAngleDeg: [-12, 40],
  hubOffset: [-20, 60],
  hubHeight: [-10, 70],
  steerArmLateral: [-40, 50],
  steerArmLongitudinal: [-90, 30],
  wheelRadius: [30, 110],
  wheelWidth: [18, 90],
};

const TRAVEL_RANGES: Record<keyof TravelSettings, [number, number]> = {
  up: [0, 90],
  down: [0, 90],
  preload: [0, 40],
  rackTravel: [-40, 40],
};

export function signConfig(payload: {
  dims: SuspensionDims;
  travel: TravelSettings;
  assembly: AssemblyState;
}): string {
  const parts: string[] = [];
  const dimKeys = Object.keys(DEFAULT_DIMS).sort() as (keyof SuspensionDims)[];
  for (const k of dimKeys) parts.push(`${k}=${roundTo(payload.dims[k] ?? DEFAULT_DIMS[k], 3)}`);
  const travelKeys = Object.keys(DEFAULT_TRAVEL).sort() as (keyof TravelSettings)[];
  for (const k of travelKeys) parts.push(`t.${k}=${roundTo(payload.travel[k] ?? 0, 3)}`);
  const parts2 = [...payload.assembly.order].sort().join(',');
  parts.push(`order=${parts2}`);
  for (const part of ['lowerArm', 'upperArm', 'knuckle', 'tieRod'] as PartKind[]) {
    const c = payload.assembly.connections[part];
    parts.push(`c.${part}=${c ? `${c.socket}:${roundTo(c.dropDeviation, 2)}:${c.forced ? 1 : 0}` : '-'}`);
  }
  // FNV-1a 32-bit, rendered in base 36 — short, stable, human-compareable.
  let hash = 0x811c9dc5;
  const text = parts.join('|');
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `rcs-${hash.toString(36).padStart(7, '0')}`;
}

export function serializeConfig(config: LabConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

export function makeConfig(input: {
  dims: SuspensionDims;
  travel: TravelSettings;
  assembly: AssemblyState;
  layerOrder: readonly string[];
  title?: string;
  note?: string;
  now?: Date;
}): LabConfig {
  const dims = normalizeDims(input.dims);
  const travel = normalizeTravel(input.travel);
  const assembly = normalizeAssembly(input.assembly);
  const exportedAt = (input.now ?? new Date()).toISOString();
  return {
    format: CONFIG_FORMAT,
    version: CONFIG_VERSION,
    units: 'mm',
    exportedAt,
    dims,
    travel,
    assembly,
    render: { layerOrder: sanitizeLayerOrder(input.layerOrder) },
    meta: {
      title: input.title ?? 'RC 悬挂姿态配置',
      note: input.note ?? '',
      signature: signConfig({ dims, travel, assembly }),
    },
  };
}

export function normalizeDims(input: Partial<SuspensionDims> | undefined): SuspensionDims {
  const out = { ...DEFAULT_DIMS };
  if (!input) return out;
  for (const k of Object.keys(DIM_RANGES) as (keyof SuspensionDims)[]) {
    const v = Number(input[k]);
    if (Number.isFinite(v)) {
      const [lo, hi] = DIM_RANGES[k];
      out[k] = roundTo(clamp(v, lo, hi), 3);
    }
  }
  return out;
}

export function normalizeTravel(input: Partial<TravelSettings> | undefined): TravelSettings {
  const out = { ...DEFAULT_TRAVEL };
  if (!input) return out;
  for (const k of Object.keys(TRAVEL_RANGES) as (keyof TravelSettings)[]) {
    const v = Number(input[k]);
    if (Number.isFinite(v)) {
      const [lo, hi] = TRAVEL_RANGES[k];
      out[k] = roundTo(clamp(v, lo, hi), 3);
    }
  }
  return out;
}

export function normalizeAssembly(input: Partial<AssemblyState> | undefined): AssemblyState {
  const tolerance = Number(input?.toleranceMm);
  const tol = Number.isFinite(tolerance) ? clamp(tolerance, 0.5, 40) : 9;
  const order: PartKind[] = [];
  const connections: AssemblyState['connections'] = {};
  const rawOrder = Array.isArray(input?.order) ? input!.order : [];
  const allowed: PartKind[] = ['lowerArm', 'upperArm', 'knuckle', 'tieRod'];
  for (const part of rawOrder) {
    if (!allowed.includes(part) || order.includes(part)) continue;
    const conn = input?.connections?.[part];
    if (!conn) continue;
    const socket = SOCKET_BY_ID.get(conn.socket);
    if (!socket || socket.accepts !== part) continue;
    order.push(part);
    connections[part] = {
      part,
      socket: conn.socket,
      dropDeviation: roundTo(clamp(Number(conn.dropDeviation) || 0, 0, 500), 2),
      forced: Boolean(conn.forced),
      pinnedAt: Number(conn.pinnedAt) || 0,
    };
  }
  return { order, connections, toleranceMm: roundTo(tol, 2) };
}

export interface ParseResult {
  ok: boolean;
  config?: LabConfig;
  messages: ValidationMessage[];
}

export function parseConfig(text: string): ParseResult {
  const messages: ValidationMessage[] = [];
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    return {
      ok: false,
      messages: [{ level: 'error', code: 'json', message: `JSON 解析失败：${(err as Error).message}` }],
    };
  }
  if (!raw || typeof raw !== 'object') {
    return { ok: false, messages: [{ level: 'error', code: 'shape', message: '配置文件根节点必须是对象' }] };
  }
  if (raw.format !== CONFIG_FORMAT) {
    messages.push({
      level: 'warn',
      code: 'format',
      message: `未知格式标记 "${String(raw.format)}"，按本工具格式尝试读取`,
    });
  }
  if (Number(raw.version) > CONFIG_VERSION) {
    messages.push({
      level: 'warn',
      code: 'version',
      message: `文件版本 v${raw.version} 高于当前支持的 v${CONFIG_VERSION}，未知字段会被忽略`,
    });
  }
  const dims = normalizeDims(raw.dims);
  const travel = normalizeTravel(raw.travel);
  const assembly = normalizeAssembly(raw.assembly);
  const layerOrder = sanitizeLayerOrder(raw.render?.layerOrder);

  if (!raw.dims) messages.push({ level: 'warn', code: 'dims', message: '缺少尺寸数据，已使用默认值' });
  if (!raw.travel) messages.push({ level: 'warn', code: 'travel', message: '缺少行程参数，已使用默认值' });

  const missing = assembly.order.length < SOCKETS.length;
  if (missing) {
    messages.push({
      level: 'warn',
      code: 'assembly',
      message: `装配不完整（${assembly.order.length}/4），导入后需要补齐零件`,
    });
  }
  for (const part of assembly.order) {
    const conn = assembly.connections[part];
    if (conn && conn.dropDeviation > assembly.toleranceMm && !conn.forced) {
      messages.push({
        level: 'warn',
        code: 'deviation',
        message: `${part} 的连接偏差 ${conn.dropDeviation.toFixed(1)} mm 超过阈值 ${assembly.toleranceMm} mm`,
      });
    }
  }
  for (const part of assembly.order) {
    const missingPrereq = PART_PREREQUISITES[part].filter((p) => !assembly.order.includes(p));
    if (missingPrereq.length) {
      messages.push({
        level: 'warn',
        code: 'prereq',
        message: `${part} 缺少前置零件：${missingPrereq.join(', ')}`,
      });
    }
  }

  const config: LabConfig = {
    format: CONFIG_FORMAT,
    version: CONFIG_VERSION,
    units: 'mm',
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    dims,
    travel,
    assembly,
    render: { layerOrder },
    meta: {
      title: typeof raw.meta?.title === 'string' ? raw.meta.title : 'RC 悬挂姿态配置',
      note: typeof raw.meta?.note === 'string' ? raw.meta.note : '',
      signature: typeof raw.meta?.signature === 'string' ? raw.meta.signature : '',
    },
  };
  const expected = signConfig(config);
  if (config.meta.signature && config.meta.signature !== expected) {
    messages.push({
      level: 'warn',
      code: 'signature',
      message: `签名不匹配（文件 ${config.meta.signature}，重算 ${expected}），内容可能被修改过`,
    });
  }
  if (!config.meta.signature) config.meta.signature = expected;

  return { ok: true, config, messages };
}

/** Stable file name from the title + signature. */
export function configFileName(config: LabConfig, ext = 'rcs.json'): string {
  const slug = (config.meta.title || 'rc-suspension')
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'rc-suspension';
  return `${slug}-${config.meta.signature || 'unsigned'}.${ext}`;
}

export function summarizeConfig(config: LabConfig): { label: string; value: string }[] {
  return [
    { label: '下摆臂', value: `${config.dims.lowerArmLength.toFixed(1)} mm` },
    { label: '上摆臂', value: `${config.dims.upperArmLength.toFixed(1)} mm` },
    { label: '拉杆', value: `${config.dims.tieRodLength.toFixed(1)} mm` },
    { label: '主销', value: `${config.dims.kingpinLength.toFixed(1)} mm` },
    { label: '上行程', value: `${config.travel.up.toFixed(0)} mm` },
    { label: '下行程', value: `${config.travel.down.toFixed(0)} mm` },
    { label: '预压量', value: `${config.travel.preload.toFixed(1)} mm` },
    { label: '齿条行程', value: `${config.travel.rackTravel.toFixed(1)} mm` },
  ];
}
