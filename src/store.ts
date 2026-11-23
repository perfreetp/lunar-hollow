// 全局状态:配置、仿真结果、回放控制。配置变更自动持久化到浏览器。
import { reactive, watch, markRaw } from 'vue';
import type { LockConfig, ShipConfig, SimResult } from './sim/types';
import { simulate } from './sim/simulate';
import { loadPersistedConfig, loadPersistedShips, persistConfig, idbPut, idbGet, idbDelete } from './utils/persist';

const RESULT_KEY = 'last-result';

export function defaultConfig(): LockConfig {
  return {
    chamberLength: 180,
    chamberWidth: 23,
    approachLength: 1000,
    approachWidth: 45,
    upstreamLevel: 12,
    downstreamLevel: 4,
    waterRate: 0.05,
    gateMaxAngle: 90,
    gateStepAngle: 5,
    gateStepInterval: 1,
    direction: 'down',
    berthGap: 8,
    queueGap: 15,
    endMargin: 10,
    cruiseSpeedCap: 2.5,
  };
}

/** 确定性伪随机,保证默认 20 艘船每次生成一致 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateShips(count = 20): ShipConfig[] {
  const rnd = mulberry32(20261123);
  const ships: ShipConfig[] = [];
  for (let i = 0; i < count; i++) {
    ships.push({
      id: `ship-${i + 1}`,
      name: `船舶 ${String(i + 1).padStart(2, '0')}`,
      length: Math.round((45 + rnd() * 30) * 10) / 10,
      width: Math.round((8 + rnd() * 5) * 10) / 10,
      order: i + 1,
      speed: Math.round((1.5 + rnd() * 1.5) * 100) / 100,
      draft: Math.round((2 + rnd() * 1.5) * 100) / 100,
    });
  }
  return ships;
}

interface Store {
  config: LockConfig;
  ships: ShipConfig[];
  result: SimResult | null;
  time: number;
  playing: boolean;
  speed: number;
  fps: number;
  engineLabel: string;
  configVersion: number; // 自增触发场景重建
  running: boolean;
}

export const store = reactive<Store>({
  config: loadPersistedConfig(defaultConfig()),
  ships: loadPersistedShips(generateShips(20)),
  result: null,
  time: 0,
  playing: false,
  speed: 1,
  fps: 0,
  engineLabel: '',
  configVersion: 0,
  running: false,
});

// ---- 配置持久化(防抖)----
let persistTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => [store.config, store.ships],
  () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistConfig(store.config, store.ships);
      store.configVersion++;
    }, 300);
  },
  { deep: true },
);

// ---- 仿真 ----
export function runSimulation() {
  store.running = true;
  // 让出一帧给 UI 刷新"仿真中"状态
  setTimeout(() => {
    const res = simulate(store.config, store.ships);
    store.result = markRaw(res);
    store.time = 0;
    store.playing = true;
    store.running = false;
    void persistResult(res);
  }, 30);
}

export function resetSimulation() {
  store.result = null;
  store.time = 0;
  store.playing = false;
  void idbDelete(RESULT_KEY);
}

interface PersistedResult extends Omit<SimResult, 'data'> {
  data: ArrayBuffer;
}

async function persistResult(res: SimResult) {
  const p: PersistedResult = { ...res, data: res.data.buffer.slice(0) as ArrayBuffer };
  await idbPut(RESULT_KEY, p);
}

export async function restoreResult() {
  const p = await idbGet<PersistedResult>(RESULT_KEY);
  if (!p || !p.data) return;
  try {
    const res: SimResult = { ...p, data: new Float32Array(p.data) };
    store.result = markRaw(res);
    store.time = 0;
  } catch {
    /* 数据损坏则忽略 */
  }
}

export async function clearAllLocalData() {
  resetSimulation();
  localStorage.removeItem('sls.config.v1');
  localStorage.removeItem('sls.ships.v1');
}
