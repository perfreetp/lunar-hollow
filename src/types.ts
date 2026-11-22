export type BarType = 'straight' | 'lshape' | 'folding';
export type ViewMode = 'normal' | 'mirror';

/** 一根扶手的可序列化描述（导出 / 导入的基本单元） */
export interface BarSpec {
  id: string;
  type: BarType;
  /** 所依附墙面网格名 */
  wallName: string;
  /** 墙面贴合点（世界坐标，位于墙面上） */
  point: [number, number, number];
  /** 墙面外法线（世界坐标） */
  normal: [number, number, number];
  /** 墙面局部水平坐标：沿墙面水平轴、相对墙面中心的偏移（米） */
  u: number;
  /** 离地高度（米，扶手轴线） */
  height: number;
  /** 扶手长度（米，0.4 ~ 1.2） */
  length: number;
  /** 折叠角度（度，仅折叠型；0 = 水平使用，90 = 贴墙收纳） */
  foldAngle: number;
  /** L 型是否水平镜像 */
  flipped?: boolean;
}

export interface LayoutFile {
  app: string;
  version: number;
  camera: { position: number[]; target: number[] };
  mode: ViewMode;
  outline: boolean;
  bars: BarSpec[];
}
