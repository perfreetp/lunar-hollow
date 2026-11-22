import { create } from 'zustand';
import type {
  BeamConfig,
  EnvironmentConfig,
  LighthouseConfig,
  LightRuntimeInfo,
  Reef,
  SceneConfig,
  ShipState,
} from './types';
import { computeRuntimeInfo, uid } from './lib/beamMath';

function defaultBeam(over: Partial<BeamConfig> = {}): BeamConfig {
  return {
    azimuth: 0,
    pitch: 25,
    horizontalAngle: 18,
    verticalAngle: 8,
    colorTemp: 4200,
    intensity: 6,
    period: 5,
    phase: 0,
    duty: 0.55,
    ...over,
  };
}

function makeLighthouse(over: Partial<LighthouseConfig>): LighthouseConfig {
  return {
    id: uid('lh'),
    name: '灯塔',
    x: 0,
    z: 0,
    height: 35,
    towerRadius: 3,
    beam: defaultBeam(),
    ...over,
  };
}

export const defaultConfig = (): SceneConfig => ({
  version: 1,
  lighthouses: [
    makeLighthouse({ name: '北角灯', x: -90, z: -70, beam: defaultBeam({ azimuth: 135, pitch: 22, phase: 0 }) }),
    makeLighthouse({ name: '东礁灯', x: 110, z: -40, beam: defaultBeam({ azimuth: 200, pitch: 28, colorTemp: 3000, period: 6, phase: 2 }) }),
    makeLighthouse({ name: '南湾灯', x: 40, z: 120, beam: defaultBeam({ azimuth: 320, pitch: 18, horizontalAngle: 26, colorTemp: 5600, period: 4, phase: 1 }) }),
  ],
  reefs: [
    { id: uid('reef'), x: -20, z: 10, radius: 9 },
    { id: uid('reef'), x: 60, z: 40, radius: 7 },
    { id: uid('reef'), x: -70, z: 55, radius: 11 },
    { id: uid('reef'), x: 130, z: 80, radius: 8 },
  ],
  ship: { x: 0, z: 0, heading: 0, length: 14, width: 5 },
  environment: { fogDensity: 0.0011, ambient: 0.42, seaColor: '#103047' },
});

interface ToolState {
  config: SceneConfig;
  selectedLhId: string | null;
  runtime: LightRuntimeInfo[];
  /** 体积纹理降分辨率开关（远灯低分辨率加速） */
  lowResFar: boolean;
  /** 显示水面光斑/照射半径标记 */
  showFootprints: boolean;
  /** 雾化薄雾开关 */
  mistEnabled: boolean;

  selectLighthouse: (id: string | null) => void;
  addLighthouse: () => void;
  removeLighthouse: (id: string) => void;
  duplicateLighthouse: (id: string) => void;
  updateLighthouse: (id: string, patch: Partial<LighthouseConfig>) => void;
  updateBeam: (id: string, patch: Partial<BeamConfig>) => void;
  setShip: (patch: Partial<ShipState>) => void;
  setEnvironment: (patch: Partial<EnvironmentConfig>) => void;
  addReef: () => void;
  removeReef: (id: string) => void;
  updateReef: (id: string, patch: Partial<Reef>) => void;
  toggle: (key: 'lowResFar' | 'showFootprints' | 'mistEnabled') => void;
  importConfig: (cfg: SceneConfig) => void;
  /** 船位/灯参变动后联动重算所有灯的光斑与遮挡 */
  recompute: () => void;
}

export const useToolStore = create<ToolState>((set, get) => ({
  config: defaultConfig(),
  selectedLhId: null,
  runtime: [],
  lowResFar: true,
  showFootprints: true,
  mistEnabled: true,

  selectLighthouse: (id) => set({ selectedLhId: id }),

  addLighthouse: () => {
    // 黄金角环形分布，避免新增灯塔挤在一起
    const n = get().config.lighthouses.length;
    const angle = (n * 137.5 * Math.PI) / 180;
    const radius = 95 + (n % 4) * 32;
    const x = Math.round(Math.sin(angle) * radius);
    const z = Math.round(Math.cos(angle) * radius);
    const lh = makeLighthouse({
      name: `灯塔 ${n + 1}`,
      x,
      z,
      // 光束朝向海域中心
      beam: defaultBeam({
        azimuth: Math.round(((angle + Math.PI) * 180) / Math.PI) % 360,
        phase: Math.round(((n * 0.7) % 5) * 10) / 10,
      }),
    });
    set((s) => ({ config: { ...s.config, lighthouses: [...s.config.lighthouses, lh] }, selectedLhId: lh.id }));
    get().recompute();
  },

  removeLighthouse: (id) => {
    set((s) => ({
      config: { ...s.config, lighthouses: s.config.lighthouses.filter((l) => l.id !== id) },
      selectedLhId: s.selectedLhId === id ? null : s.selectedLhId,
    }));
    get().recompute();
  },

  duplicateLighthouse: (id) => {
    const src = get().config.lighthouses.find((l) => l.id === id);
    if (!src) return;
    const copy: LighthouseConfig = {
      ...structuredClone(src),
      id: uid('lh'),
      name: src.name + ' 副本',
      x: src.x + 20,
      z: src.z + 20,
    };
    set((s) => ({ config: { ...s.config, lighthouses: [...s.config.lighthouses, copy] }, selectedLhId: copy.id }));
    get().recompute();
  },

  updateLighthouse: (id, patch) => {
    set((s) => ({
      config: {
        ...s.config,
        lighthouses: s.config.lighthouses.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      },
    }));
    get().recompute();
  },

  updateBeam: (id, patch) => {
    set((s) => ({
      config: {
        ...s.config,
        lighthouses: s.config.lighthouses.map((l) => (l.id === id ? { ...l, beam: { ...l.beam, ...patch } } : l)),
      },
    }));
    get().recompute();
  },

  setShip: (patch) => {
    set((s) => ({ config: { ...s.config, ship: { ...s.config.ship, ...patch } } }));
    get().recompute();
  },

  setEnvironment: (patch) =>
    set((s) => ({ config: { ...s.config, environment: { ...s.config.environment, ...patch } } })),

  addReef: () => {
    const reef: Reef = {
      id: uid('reef'),
      x: Math.round(Math.random() * 160 - 80),
      z: Math.round(Math.random() * 160 - 80),
      radius: 6 + Math.round(Math.random() * 6),
    };
    set((s) => ({ config: { ...s.config, reefs: [...s.config.reefs, reef] } }));
    get().recompute();
  },

  removeReef: (id) => {
    set((s) => ({ config: { ...s.config, reefs: s.config.reefs.filter((r) => r.id !== id) } }));
    get().recompute();
  },

  updateReef: (id, patch) => {
    set((s) => ({
      config: { ...s.config, reefs: s.config.reefs.map((r) => (r.id === id ? { ...r, ...patch } : r)) },
    }));
    get().recompute();
  },

  toggle: (key) => set((s) => ({ ...s, [key]: !s[key] })),

  importConfig: (cfg) => {
    const valid: SceneConfig = {
      version: 1,
      lighthouses: Array.isArray(cfg?.lighthouses) ? cfg.lighthouses : [],
      reefs: Array.isArray(cfg?.reefs) ? cfg.reefs : [],
      ship: { ...defaultConfig().ship, ...(cfg?.ship ?? {}) },
      environment: { ...defaultConfig().environment, ...(cfg?.environment ?? {}) },
    };
    set({ config: valid, selectedLhId: valid.lighthouses[0]?.id ?? null });
    get().recompute();
  },

  recompute: () => {
    const { config } = get();
    set({ runtime: computeRuntimeInfo(config.lighthouses, config.reefs, config.ship) });
  },
}));

// 初始解算一次
useToolStore.getState().recompute();
