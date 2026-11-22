import { writable } from 'svelte/store';

/** 全局漫游状态:供 Svelte 面板与 Babylon 引擎双向同步 */
export type CameraMode = 'cruise' | 'free';
export type ChunkState = 'idle' | 'loading' | 'ready';

export interface ChunkInfo {
  id: number;
  state: ChunkState;
  lod: number;
  /** 分块中心弧长(米) */
  centerS: number;
}

export interface RoamState {
  ready: boolean;
  /** 总长度 / 分块数 */
  totalLength: number;
  chunkCount: number;
  /** 当前弧长位置(米) */
  s: number;
  /** 当前路段 1..8 */
  segment: number;
  /** 相机模式 */
  mode: CameraMode;
  /** 速度档位 1..5 */
  speedGear: number;
  /** 实际速度 m/s */
  speed: number;
  /** 航向角(弧度,世界 XZ 平面) */
  heading: number;
  /** 已行驶距离(米) */
  odometer: number;
  /** 轮胎痕迹整体强度 0..1 */
  tireIntensity: number;
  /** 各分块实时状态(小地图与加载模块共用) */
  chunks: ChunkInfo[];
  /** 加载中的分块数量 */
  loadingCount: number;
  fps: number;
}

export const SPEED_GEARS = [10, 25, 50, 80, 120] as const; // km/h
export const STREAM_RADIUS = 300; // 米
export const LOD_BOUNDARIES = [120, 220, STREAM_RADIUS] as const;

export function createRoamState(): RoamState {
  return {
    ready: false,
    totalLength: 0,
    chunkCount: 0,
    s: 0,
    segment: 1,
    mode: 'cruise',
    speedGear: 2,
    speed: 0,
    heading: 0,
    odometer: 0,
    tireIntensity: 0,
    chunks: [],
    loadingCount: 0,
    fps: 0
  };
}

/** Svelte store:引擎写入,UI 订阅 */
export const roamStore = writable<RoamState>(createRoamState());

/** 速度档位 -> m/s */
export function gearToSpeed(gear: number): number {
  return SPEED_GEARS[Math.min(4, Math.max(0, gear - 1))] / 3.6;
}
