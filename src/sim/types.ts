// 仿真数据模型与共享类型

export interface LockConfig {
  chamberLength: number;   // 闸室长度 m
  chamberWidth: number;    // 闸室宽度 m
  approachLength: number;  // 单侧引航道长度 m
  approachWidth: number;   // 引航道宽度 m
  upstreamLevel: number;   // 上游水位 m
  downstreamLevel: number; // 下游水位 m
  waterRate: number;       // 水位升降速率 m/s
  gateMaxAngle: number;    // 闸门最大开度(度)
  gateStepAngle: number;   // 每档位角度(度)
  gateStepInterval: number;// 每档位耗时 s
  direction: 'down' | 'up';// 过闸方向:下行(上游->下游) / 上行
  berthGap: number;        // 闸室内泊船间距 m
  queueGap: number;        // 排队间距 m
  endMargin: number;       // 泊船距闸门安全距离 m
  cruiseSpeedCap: number;  // 闸区限速 m/s
}

export interface ShipConfig {
  id: string;
  name: string;
  length: number;  // 船长 m
  width: number;   // 船宽 m
  order: number;   // 进闸顺序(1 最先)
  speed: number;   // 初始/巡航速度 m/s
  draft: number;   // 吃水 m
}

export type EventType =
  | 'phase' | 'release' | 'dock' | 'exit' | 'done'
  | 'gate' | 'water' | 'collision' | 'warn';

export interface SimEvent {
  t: number;
  type: EventType;
  message: string;
  shipId?: string;
}

export interface SimResult {
  version: 1;
  config: LockConfig;
  ships: ShipConfig[];      // 已按 order 排序
  batches: number[][];      // 每个闸次包含的船舶下标(按排序后数组)
  recordDt: number;         // 帧记录间隔 s
  duration: number;         // 仿真总时长 s
  frameCount: number;
  stride: number;           // 每帧浮点数个数 = 5 + 4*N
  data: Float32Array;       // [t, water, upGate, downGate, phase, (x,z,v,state)*N]
  events: SimEvent[];
  collisions: number;
  completed: boolean;
  createdAt: string;
}

/** 帧头字段下标 */
export const H_T = 0;
export const H_WATER = 1;
export const H_UP_GATE = 2;
export const H_DOWN_GATE = 3;
export const H_PHASE = 4;
export const HEADER = 5;
/** 每船字段:x, z, v, state */
export const SHIP_STRIDE = 4;
