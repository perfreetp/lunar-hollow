import type { VisibilityGradeId } from '../core/atmosphere.ts';
import type { LngLat } from '../core/geo.ts';
import type { GlowSettings, ScaleMode } from '../render/glow-renderer.ts';

export type ThemeMode = 'night' | 'day';

export interface GlowDiagnostics {
  fps: number;
  frameMs: number;
  drawCount: number;
  overlapPairs: number;
  maxSuppression: number;
  quality: number;
  litLengthM: number;
  nearestId: string | null;
}

export interface AppState {
  mode: ThemeMode;
  visibility: VisibilityGradeId;
  scaleMode: ScaleMode;
  eyeHeightM: number;
  quality: GlowSettings['quality'];
  motion: GlowSettings['motion'];
  showRoute: boolean;
  showSectors: boolean;
  showSoundings: boolean;
  showGraticule: boolean;
  selectedAidId: string | null;
  hoverAidId: string | null;
  ship: { position: LngLat; headingDeg: number; alongM: number };
  diagnostics: GlowDiagnostics;
  zoom: number;
  center: LngLat;
  mapReady: boolean;
  exportOpen: boolean;
  hydrated: boolean;
}

export const INITIAL_SHIP = { lng: 122.1672, lat: 30.0728 };

export const initialState: AppState = {
  mode: 'night',
  visibility: 'clear',
  scaleMode: 'ground',
  eyeHeightM: 9.5,
  quality: 'auto',
  motion: 'animated',
  showRoute: true,
  showSectors: true,
  showSoundings: true,
  showGraticule: true,
  selectedAidId: null,
  hoverAidId: null,
  ship: { position: { lng: INITIAL_SHIP.lng, lat: INITIAL_SHIP.lat }, headingDeg: 350, alongM: 0 },
  diagnostics: {
    fps: 0,
    frameMs: 16,
    drawCount: 0,
    overlapPairs: 0,
    maxSuppression: 0,
    quality: 1,
    litLengthM: 0,
    nearestId: null,
  },
  zoom: 11.6,
  center: { lng: 122.158, lat: 30.079 },
  mapReady: false,
  exportOpen: false,
  hydrated: false,
};

export function glowSettingsFrom(state: AppState): GlowSettings {
  return {
    mode: state.mode,
    visibility: state.visibility,
    scaleMode: state.scaleMode,
    eyeHeightM: state.eyeHeightM,
    showRoute: state.showRoute,
    showSectors: state.showSectors,
    motion: state.motion,
    quality: state.quality,
  };
}
