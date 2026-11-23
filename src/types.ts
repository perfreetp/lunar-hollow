/**
 * 幕墙光学配置类型定义
 * 数据完全保存在浏览器 localStorage 中，通过导出 JSON 文件进行分享。
 */

/** 单层玻璃的配置项 */
export interface LayerConfig {
  /** 层序号（从 0 开始，沿幕墙深度方向排列） */
  id: number;
  /** 是否启用（关闭后该层不参与渲染与透射统计） */
  enabled: boolean;
  /** 透射率档位 1-5（5 = 最透明） */
  transmissionGear: number;
  /** 镀膜反射档位 1-5（5 = 镀膜最强、反射最高） */
  coatingGear: number;
  /** 玻璃厚度（世界单位，米） */
  thickness: number;
}

/** 整块幕墙的配置 */
export interface WallConfig {
  /** 玻璃层数（固定默认 40 层） */
  layerCount: number;
  /** 水平方向玻璃板数量 */
  cols: number;
  /** 垂直方向玻璃板数量 */
  rows: number;
  /** 相邻两层玻璃的间距（世界单位，米） */
  spacing: number;
  /** 单层玻璃高度（用于换算幕墙整体高度） */
  panelHeight: number;
  /** 单层玻璃宽度 */
  panelWidth: number;
  /** 层配置列表 */
  layers: LayerConfig[];
}

/** 导出文件的封装格式（带版本号，便于后续兼容导入） */
export interface ExportedConfig {
  format: 'curtain-wall-optics';
  version: 1;
  exportedAt: string;
  config: WallConfig;
}

/** 每帧性能与视线统计（由渲染器回传给 UI） */
export interface FrameStats {
  /** 当前视线实际穿过的玻璃层数（BVH 射线求交结果） */
  hitCount: number;
  /** 可见层数（启用且未被剔除） */
  visibleCount: number;
  /** 视线方向上各层透射率连乘得到的总透射估算（0-1） */
  totalTransmission: number;
  /** 视线与幕墙法线的夹角（度），用于解释镀膜反射随视角变化 */
  incidenceDeg: number;
  /** 被前层遮挡而在该视角下光学上可忽略（透射贡献低于阈值）的层数 */
  clippedLayers: number;
  /** 排序 + 求交的帧耗时（毫秒，EMA 平滑值） */
  frameCostMs: number;
  /** 本帧排序过程中发生的相邻交换次数（增量排序工作量指标） */
  sortSwaps: number;
  /** 射线是否命中幕墙 */
  onWall: boolean;
}
