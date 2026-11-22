// 全局类型定义：场景配置、灯塔参数、光束参数等

export interface BeamConfig {
  azimuth: number; // 水平旋转角（度，0 = 正北，顺时针）
  pitch: number; // 俯仰角（度，正 = 向下俯照水面）
  horizontalAngle: number; // 光束水平张角（度，扇形角）
  verticalAngle: number; // 垂直发散角（度）
  colorTemp: number; // 色温 K（1800–8000）
  intensity: number; // 光强档位 1–10
  period: number; // 灯质周期（秒）
  phase: number; // 闪光相位（秒）
  duty: number; // 亮灯占空比 0.05–1
}

export interface LighthouseConfig {
  id: string;
  name: string;
  x: number;
  z: number;
  height: number; // 灯高（米，灯芯距水面）
  towerRadius: number; // 塔身半径（遮挡体）
  beam: BeamConfig;
}

export interface Reef {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface ShipState {
  x: number;
  z: number;
  heading: number; // 船首朝向（度）
  length: number;
  width: number;
}

export interface EnvironmentConfig {
  fogDensity: number; // 近岸薄雾浓度（指数雾密度）
  ambient: number; // 环境光 0–1
  seaColor: string;
}

export interface SceneConfig {
  version: 1;
  lighthouses: LighthouseConfig[];
  reefs: Reef[];
  ship: ShipState;
  environment: EnvironmentConfig;
}

// 单盏灯实时解算结果
export interface LightRuntimeInfo {
  id: string;
  name: string;
  /** 水面光斑中心（世界坐标） */
  spot: { x: number; z: number };
  /** 水面照射半径（光斑外接半径，米） */
  radius: number;
  /** 船是否被该灯照亮（未被遮挡且在束锥内） */
  shipLit: boolean;
  /** 船到光斑中心距离（米），不在束内时为 null */
  shipDistance: number | null;
}

export const MAX_LIGHTS = 20;
