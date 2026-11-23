import type { DrumConfig, StrikeSpec } from './types';
import type { StrikeMetrics } from './model';

export interface SimRequest {
  type: 'simulate';
  reqId: number;
  config: DrumConfig;
  strikes: StrikeSpec[];
}

export interface HeadInfo {
  tension: number;
  f0: number;
  crownMm: number;
  wrinkleMm: number;
  aMm: number;
  rimRadiusMm: number;
  depthMm: number;
  preStressMpa: number;
  waveSpeed: number;
}

export interface SimResponse {
  type: 'result';
  reqId: number;
  config: DrumConfig;
  /** mm, xyz per vertex, resting tensioned head (interleaved). */
  basePositions: Float32Array;
  baseY: Float32Array;
  /** FRAME_COUNT * VERT_COUNT, mm. */
  disp: Float32Array;
  /** FRAME_COUNT * VERT_COUNT, smoothed stress rise used for shading. */
  glow: Float32Array;
  /** Largest smoothed stress rise anywhere (MPa). */
  maxGlow: number;
  perStrikeDisp: Float32Array[];
  perStrikeGlow: Float32Array[];
  strikeIds: string[];
  times: Float32Array;
  frameCount: number;
  vertexCount: number;
  frameMaxDisp: Float32Array;
  frameMaxStress: Float32Array;
  peakFrame: number;
  peakStressMpa: number;
  peakStressRho: number;
  maxDeltaStress: number;
  metrics: StrikeMetrics[];
  headInfo: HeadInfo;
  computeMs: number;
}

export interface SimError {
  type: 'error';
  reqId: number;
  message: string;
}

export type FromWorker = SimResponse | SimError;
