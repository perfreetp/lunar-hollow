/**
 * store.js —— 应用状态机（Svelte writable）
 *
 * 关键约定：任何结构变更（增删/移动/改齿数/改主动轮）都走 commit()，
 * commit 内同步调用 recompute() 完成全链重算后才整体替换快照，
 * 因此渲染层每一帧拿到的状态都已经是重算后的最新结果——
 * “播放过程中调整传动比，下一帧前完成全链重算”由该同步提交保证。
 */
import { writable, get } from 'svelte/store';
import { recompute, frameAngle, MAX_LAYERS } from './gearMath.js';

export { get };

export const LIBRARY = [8, 10, 12, 16, 20, 24, 32];
export const MIN_TEETH = 8;
export const MAX_TEETH = 48;
export const MAX_WIND_TURNS = 20;

let seq = 1;
const newId = () => `gear-${seq++}`;

function makeGear(teeth, gridX = 0, gridY = 0) {
  return {
    id: newId(),
    label: `齿轮 ${seq - 1}`,
    teeth,
    gridX,
    gridY
  };
}

function initialState() {
  // 预置一组可直接播放的演示传动链：12 → 24 → 12
  const g1 = makeGear(12, -48, 0);
  const g2 = makeGear(24, -48 + 36, 0);
  const g3 = makeGear(12, -48 + 36 + 36, 0);
  const gears = [g1, g2, g3];
  const driverId = g1.id;
  const snap = recompute(gears, driverId);
  return {
    gears,
    driverId,
    selectedId: g1.id,
    snapshot: snap,
    // 播放状态
    playing: false,
    windTurns: 8,        // 发条总圈数（0–20）
    progress: 0,         // 当前播放进度 0..1
    speed: 1,            // 播放速率（圈/秒基准倍率）
    // 布局
    version: 1,
    dirty: false
  };
}

function commit(state, patch = {}) {
  const next = { ...state, ...patch, dirty: true };
  next.snapshot = recompute(next.gears, next.driverId);
  store.set(next);
  return next;
}

export const store = writable(initialState());

/* ---------- 齿轮装配 ---------- */

export function addGear(teeth, gridX, gridY) {
  const s = get(store);
  const g = makeGear(teeth, gridX, gridY);
  commit(s, { gears: [...s.gears, g], selectedId: g.id });
  return g.id;
}

export function moveGear(id, gridX, gridY) {
  const s = get(store);
  const gears = s.gears.map((g) => (g.id === id ? { ...g, gridX, gridY } : g));
  commit(s, { gears });
}

export function removeGear(id) {
  const s = get(store);
  const gears = s.gears.filter((g) => g.id !== id);
  const driverId = s.driverId === id ? (gears[0]?.id ?? null) : s.driverId;
  const selectedId = s.selectedId === id ? (gears[0]?.id ?? null) : s.selectedId;
  commit(s, { gears, driverId, selectedId });
}

export function selectGear(id) {
  store.update((s) => ({ ...s, selectedId: id }));
}

/**
 * 修改齿数：位置不变，啮合关系可能因此断开（由 recompute 重新判定并提示）。
 * 整条链的转速/相位在同一次 commit 内联动重算。
 */
export function setTeeth(id, teeth) {
  const s = get(store);
  const t = Math.max(MIN_TEETH, Math.min(MAX_TEETH, Math.round(teeth)));
  const gears = s.gears.map((g) => (g.id === id ? { ...g, teeth: t } : g));
  commit(s, { gears });
}

export function renameGear(id, label) {
  const s = get(store);
  const gears = s.gears.map((g) => (g.id === id ? { ...g, label } : g));
  commit(s, { gears });
}

/* ---------- 传动配置 ---------- */

export function setDriver(id) {
  const s = get(store);
  commit(s, { driverId: id });
}

/* ---------- 运动播放 ---------- */

export function setPlaying(playing) {
  store.update((s) => ({ ...s, playing }));
}

export function setWindTurns(turns) {
  const t = Math.max(0, Math.min(MAX_WIND_TURNS, Number(turns) || 0));
  store.update((s) => ({ ...s, windTurns: t }));
}

export function setProgress(p) {
  store.update((s) => ({ ...s, progress: Math.max(0, Math.min(1, p)) }));
}

export function setSpeed(v) {
  store.update((s) => ({ ...s, speed: v }));
}

export function resetPlayback() {
  store.update((s) => ({ ...s, progress: 0, playing: false }));
}

/** 渲染层每帧调用：按当前进度计算每个齿轮的世界角度（弧度） */
export function frameAngles(state) {
  const driverTurns = state.windTurns * state.progress;
  const out = new Map();
  for (const g of state.gears) {
    const base = state.snapshot.baseAngles.get(g.id) ?? 0;
    const ratio = state.snapshot.ratios.get(g.id) ?? 0;
    out.set(g.id, frameAngle(base, ratio, driverTurns));
  }
  return out;
}

/* ---------- 配置导出 / 导入 ---------- */

const SCHEMA = 'clockwork-studio-config';
const SCHEMA_VERSION = 1;

export function serializeConfig(state = get(store)) {
  return JSON.stringify(
    {
      schema: SCHEMA,
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      windTurns: state.windTurns,
      speed: state.speed,
      driverId: state.driverId,
      gears: state.gears.map((g) => ({
        id: g.id,
        label: g.label,
        teeth: g.teeth,
        gridX: g.gridX,
        gridY: g.gridY
      })),
      // 传动关系显式导出，便于其他工具/人工核对
      transmission: state.snapshot.edges.map((e) => ({
        a: e.a,
        b: e.b,
        ratio: -(state.gears.find((g) => g.id === e.a)?.teeth ?? 0) /
               (state.gears.find((g) => g.id === e.b)?.teeth ?? 1)
      }))
    },
    null,
    2
  );
}

export function downloadConfig() {
  const text = serializeConfig();
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clockwork-layout-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return text;
}

export class ConfigImportError extends Error {}

export function importConfig(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    throw new ConfigImportError('文件不是合法 JSON');
  }
  if (data.schema !== SCHEMA) throw new ConfigImportError('缺少 schema 标识，不是本工具的配置文件');
  if (!Array.isArray(data.gears)) throw new ConfigImportError('配置中没有 gears 数组');

  const gears = data.gears.map((g, i) => {
    const teeth = Math.max(MIN_TEETH, Math.min(MAX_TEETH, Math.round(Number(g.teeth) || 12)));
    return {
      id: typeof g.id === 'string' ? g.id : newId(),
      label: String(g.label ?? `齿轮 ${i + 1}`),
      teeth,
      gridX: Math.round(Number(g.gridX) || 0),
      gridY: Math.round(Number(g.gridY) || 0)
    };
  });

  const ids = new Set(gears.map((g) => g.id));
  let driverId = ids.has(data.driverId) ? data.driverId : (gears[0]?.id ?? null);

  // 保证后续 newId 不与导入 id 冲突
  let maxN = 0;
  for (const g of gears) {
    const m = /^gear-(\d+)$/.exec(g.id);
    if (m) maxN = Math.max(maxN, Number(m[1]));
  }
  seq = Math.max(seq, maxN + 1);

  const s = get(store);
  commit(s, {
    gears,
    driverId,
    selectedId: driverId,
    windTurns: Math.max(0, Math.min(MAX_WIND_TURNS, Number(data.windTurns) || 0)),
    speed: Number(data.speed) > 0 ? Number(data.speed) : 1,
    progress: 0,
    playing: false
  });
}

export { MAX_LAYERS };
