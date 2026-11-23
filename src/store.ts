import { create } from 'zustand';
import {
  MATERIALS, TENSION_LEVELS, MAX_STRIKES, STRIKE_COLORS,
  defaultConfig, type DrumConfig, type StrikeSpec, type MaterialId, type FinishId,
  type ColorMode, type ExportBundle,
} from './sim/types';
import type { SimResponse } from './sim/protocol';

export type TabId = 'drum' | 'strike' | 'anim' | 'io';

export interface StrikeEntry extends StrikeSpec {
  color: string;
}

interface AppState {
  config: DrumConfig;
  strikes: StrikeEntry[];
  selectedStrikeId: string | null;
  toolStrength: number;
  toolHardness: number;

  tab: TabId;
  playing: boolean;
  loop: boolean;
  speed: number;
  playhead: number; // view time in seconds
  exaggeration: number;
  colorMode: ColorMode;
  showWireframe: boolean;
  solo: boolean;

  sim: SimResponse | null;
  simStatus: 'idle' | 'computing' | 'ready' | 'error';
  simError: string | null;
  recomputeCount: number;
  lastComputeMs: number;

  setTab: (t: TabId) => void;
  setDiameter: (d: number) => void;
  setDepth: (d: number) => void;
  setMaterial: (m: MaterialId) => void;
  setFinish: (f: FinishId) => void;
  setTension: (level: number) => void;
  nudgeTension: (dir: number) => void;

  addStrike: (rho: number, theta: number) => void;
  removeStrike: (id: string) => void;
  clearStrikes: () => void;
  selectStrike: (id: string | null) => void;
  updateStrike: (id: string, patch: Partial<StrikeSpec>) => void;
  setToolStrength: (v: number) => void;
  setToolHardness: (v: number) => void;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  restart: () => void;
  seek: (t: number) => void;
  setSpeed: (s: number) => void;
  setLoop: (b: boolean) => void;
  setExaggeration: (v: number) => void;
  setColorMode: (m: ColorMode) => void;
  setShowWireframe: (b: boolean) => void;
  setSolo: (b: boolean) => void;

  setSim: (r: SimResponse) => void;
  setSimStatus: (s: AppState['simStatus'], err?: string | null) => void;
  applyBundle: (b: ExportBundle) => void;
  resetAll: () => void;
  makeBundle: () => ExportBundle;
}

let strikeSeq = 0;

function nextStrikeId(): string {
  strikeSeq += 1;
  return `s${strikeSeq}`;
}

export function strikeColor(index: number): string {
  return STRIKE_COLORS[index % STRIKE_COLORS.length];
}

export const useApp = create<AppState>((set, get) => ({
  config: defaultConfig(),
  strikes: [],
  selectedStrikeId: null,
  toolStrength: 0.72,
  toolHardness: 0.45,

  tab: 'drum',
  playing: false,
  loop: true,
  speed: 1,
  playhead: 0,
  exaggeration: 9,
  colorMode: 'stress',
  showWireframe: true,
  solo: false,

  sim: null,
  simStatus: 'idle',
  simError: null,
  recomputeCount: 0,
  lastComputeMs: 0,

  setTab: (tab) => set({ tab }),

  setDiameter: (diameterIn) => set((s) => ({
    config: { ...s.config, diameterIn },
  })),
  setDepth: (depthIn) => set((s) => ({ config: { ...s.config, depthIn } })),
  setMaterial: (materialId) => set((s) => ({ config: { ...s.config, materialId } })),
  setFinish: (finishId) => set((s) => ({ config: { ...s.config, finishId } })),
  setTension: (tensionLevel) => set((s) => ({
    config: { ...s.config, tensionLevel: Math.max(1, Math.min(TENSION_LEVELS, tensionLevel)) },
    playhead: 0,
    playing: s.strikes.length > 0 ? true : s.playing,
  })),
  nudgeTension: (dir) => get().setTension(get().config.tensionLevel + dir),

  addStrike: (rho, theta) => set((s) => {
    if (s.strikes.length >= MAX_STRIKES) {
      return {
        selectedStrikeId: s.strikes[s.strikes.length - 1]?.id ?? null,
        simError: `最多对比 ${MAX_STRIKES} 个敲击位置,请先移除一个`,
      };
    }
    const entry: StrikeEntry = {
      id: nextStrikeId(),
      rho: Math.max(0.02, Math.min(0.985, rho)),
      theta: ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
      strength: Math.round(s.toolStrength * 100) / 100,
      hardness: Math.round(s.toolHardness * 100) / 100,
      color: strikeColor(s.strikes.length),
    };
    return {
      strikes: [...s.strikes, entry],
      selectedStrikeId: entry.id,
      playhead: 0,
      playing: true,
      loop: true,
      simError: null,
      tab: s.tab === 'drum' ? 'anim' : s.tab,
    };
  }),
  removeStrike: (id) => set((s) => {
    const strikes = s.strikes.filter((x) => x.id !== id);
    return {
      strikes,
      selectedStrikeId: s.selectedStrikeId === id ? (strikes[strikes.length - 1]?.id ?? null) : s.selectedStrikeId,
    };
  }),
  clearStrikes: () => set({ strikes: [], selectedStrikeId: null, playing: false, playhead: 0 }),
  selectStrike: (id) => set({ selectedStrikeId: id }),
  updateStrike: (id, patch) => set((s) => ({
    strikes: s.strikes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  })),
  setToolStrength: (v) => set((s) => {
    const sel = s.strikes.find((x) => x.id === s.selectedStrikeId);
    return {
      toolStrength: v,
      strikes: sel ? s.strikes.map((x) => (x.id === sel.id ? { ...x, strength: v } : x)) : s.strikes,
    };
  }),
  setToolHardness: (v) => set((s) => {
    const sel = s.strikes.find((x) => x.id === s.selectedStrikeId);
    return {
      toolHardness: v,
      strikes: sel ? s.strikes.map((x) => (x.id === sel.id ? { ...x, hardness: v } : x)) : s.strikes,
    };
  }),

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  restart: () => set({ playhead: 0, playing: true }),
  seek: (t) => set({ playhead: Math.max(0, t) }),
  setSpeed: (speed) => set({ speed }),
  setLoop: (loop) => set({ loop }),
  setExaggeration: (exaggeration) => set({ exaggeration }),
  setColorMode: (colorMode) => set({ colorMode }),
  setShowWireframe: (showWireframe) => set({ showWireframe }),
  setSolo: (solo) => set((s) => {
    // Solo needs a target: default to the selected strike, else the newest.
    if (!solo) return { solo: false };
    const id = s.selectedStrikeId ?? s.strikes[s.strikes.length - 1]?.id ?? null;
    return { solo: true, selectedStrikeId: id };
  }),

  setSim: (sim) => set((s) => ({
    sim,
    simStatus: 'ready',
    simError: null,
    recomputeCount: s.recomputeCount + 1,
    lastComputeMs: sim.computeMs,
  })),
  setSimStatus: (simStatus, simError = null) => set({ simStatus, simError }),

  applyBundle: (bundle) => {
    const cfg = bundle.config;
    set({
      config: {
        ...cfg,
        diameterIn: Math.max(8, Math.min(24, cfg.diameterIn)),
        depthIn: Math.max(3, Math.min(12, cfg.depthIn)),
        tensionLevel: Math.max(1, Math.min(TENSION_LEVELS, Math.round(cfg.tensionLevel))),
        materialId: MATERIALS[cfg.materialId] ? cfg.materialId : 'coated',
      },
      strikes: bundle.strikes.slice(0, MAX_STRIKES).map((s, i) => ({
        id: nextStrikeId(),
        rho: Math.max(0.02, Math.min(0.985, s.rho)),
        theta: s.theta,
        strength: Math.max(0.05, Math.min(1, s.strength)),
        hardness: Math.max(0, Math.min(1, s.hardness)),
        color: strikeColor(i),
      })),
      selectedStrikeId: null,
      exaggeration: bundle.view?.exaggeration ?? 9,
      colorMode: bundle.view?.colorMode ?? 'stress',
      speed: bundle.view?.playbackSpeed ?? 1,
      playhead: 0,
      playing: false,
      loop: true,
      simError: null,
    });
    set((s) => ({ selectedStrikeId: s.strikes[0]?.id ?? null }));
  },

  resetAll: () => set({
    config: defaultConfig(),
    strikes: [],
    selectedStrikeId: null,
    playhead: 0,
    playing: false,
    exaggeration: 9,
    colorMode: 'stress',
    speed: 1,
    loop: true,
    solo: false,
    simError: null,
  }),

  makeBundle: () => {
    const s = get();
    return {
      kind: 'drumhead-tension-lab',
      version: 1,
      savedAt: new Date().toISOString(),
      config: s.config,
      strikes: s.strikes.map(({ id, ...rest }) => ({ id, ...rest })),
      view: {
        exaggeration: s.exaggeration,
        colorMode: s.colorMode,
        playbackSpeed: s.speed,
        activeStrikeId: s.selectedStrikeId,
      },
    };
  },
}));

export function useSelectedStrike(): StrikeEntry | null {
  const strikes = useApp((s) => s.strikes);
  const id = useApp((s) => s.selectedStrikeId);
  return strikes.find((x) => x.id === id) ?? strikes[strikes.length - 1] ?? null;
}
