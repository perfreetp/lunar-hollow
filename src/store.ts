import { createStore, produce } from 'solid-js/store';
import type { ExportedConfig, LayerConfig, WallConfig } from './types';
import {
  GEAR_MAX,
  GEAR_MIN,
  SPACING_MAX,
  SPACING_MIN,
  STORAGE_KEY,
  THICKNESS_MAX,
  THICKNESS_MIN,
  clamp,
  clampGear,
  createDefaultConfig,
  validateConfig,
} from './optics';

/**
 * 全局幕墙状态。SolidJS store 驱动 UI 面板；
 * 3D 渲染器通过 subscribe() 订阅变更（细粒度重建/更新，不整场景重建）。
 */
/** SolidJS store 句柄，组件中直接响应式读取（只读使用，修改走 action） */
export const [config, setConfig] = createStore<WallConfig>(loadInitial());

type Listener = (reason: ChangeReason) => void;
type ChangeReason =
  | 'layer-optics'
  | 'layer-geometry'
  | 'layer-enabled'
  | 'wall-geometry'
  | 'replace'
  | 'reset';

const listeners = new Set<Listener>();

function loadInitial(): WallConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ExportedConfig;
      const valid = validateConfig(parsed?.config);
      if (valid) return valid;
    }
  } catch {
    // 存储损坏时回退默认配置
  }
  return createDefaultConfig();
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persist() {
  if (persistTimer) clearTimeout(persistTimer);
  // 高频拖动时合并写入，避免每帧刷 localStorage
  persistTimer = setTimeout(() => {
    try {
      const payload: ExportedConfig = {
        format: 'curtain-wall-optics',
        version: 1,
        exportedAt: new Date().toISOString(),
        config: snapshot(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 配额或隐私模式失败时静默，不阻塞交互
    }
  }, 200);
}

function notify(reason: ChangeReason) {
  persist();
  for (const fn of listeners) fn(reason);
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 深拷贝当前配置（用于导出） */
export function snapshot(): WallConfig {
  return JSON.parse(JSON.stringify(config)) as WallConfig;
}

export function getConfig(): WallConfig {
  return config;
}

/* ---------------- 单层调节（右侧面板） ---------------- */

export function setTransmissionGear(layerId: number, gear: number) {
  setConfig(
    'layers',
    layerId,
    produce((l: LayerConfig) => {
      l.transmissionGear = clampGear(gear);
    }),
  );
  notify('layer-optics');
}

export function setCoatingGear(layerId: number, gear: number) {
  setConfig(
    'layers',
    layerId,
    produce((l: LayerConfig) => {
      l.coatingGear = clampGear(gear);
    }),
  );
  notify('layer-optics');
}

export function setLayerEnabled(layerId: number, enabled: boolean) {
  setConfig('layers', layerId, 'enabled', enabled);
  notify('layer-enabled');
}

export function setLayerThickness(layerId: number, thickness: number) {
  setConfig(
    'layers',
    layerId,
    produce((l: LayerConfig) => {
      l.thickness = clamp(thickness, THICKNESS_MIN, THICKNESS_MAX);
    }),
  );
  notify('layer-geometry');
}

/** 批量设置所有层的间距（间距是幕墙级参数） */
export function setSpacing(spacing: number) {
  setConfig('spacing', clamp(spacing, SPACING_MIN, SPACING_MAX));
  notify('wall-geometry');
}

/* ---------------- 网格 / 幕墙级调节 ---------------- */

export function setGrid(cols: number, rows: number) {
  setConfig(
    produce((c: WallConfig) => {
      c.cols = clamp(Math.round(cols), 1, 40);
      c.rows = clamp(Math.round(rows), 1, 40);
    }),
  );
  notify('wall-geometry');
}

/* ---------------- 整配置替换 / 重置 / 导入导出 ---------------- */

export function replaceConfig(next: WallConfig) {
  setConfig(JSON.parse(JSON.stringify(next)) as WallConfig);
  notify('replace');
}

export function resetConfig() {
  setConfig(JSON.parse(JSON.stringify(createDefaultConfig())) as WallConfig);
  notify('reset');
}

/** 导出为 JSON 文件并触发浏览器下载 */
export function exportConfig(): void {
  const payload: ExportedConfig = {
    format: 'curtain-wall-optics',
    version: 1,
    exportedAt: new Date().toISOString(),
    config: snapshot(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `curtain-wall-optics-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 从 File（用户选择的导出文件）导入并恢复层叠设置，失败返回错误信息 */
export async function importConfig(file: File): Promise<void> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('文件不是合法 JSON');
  }
  const candidate =
    parsed && typeof parsed === 'object' && 'config' in parsed
      ? (parsed as ExportedConfig).config
      : parsed;
  const valid = validateConfig(candidate);
  if (!valid) {
    throw new Error('配置结构校验失败：层数、档位或几何字段不合法');
  }
  replaceConfig(valid);
}

export const gearBounds = { min: GEAR_MIN, max: GEAR_MAX };
export const thicknessBounds = { min: THICKNESS_MIN, max: THICKNESS_MAX };
export const spacingBounds = { min: SPACING_MIN, max: SPACING_MAX };
