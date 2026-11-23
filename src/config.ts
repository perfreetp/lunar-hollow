// 全局几何与机构配置(单位:米,角度:度)
// 坐标系:X = 河道横向(左右岸),Y = 竖直向上,Z = 河道纵向(-Z 为上游)

export const DEG = Math.PI / 180;

/** 半孔宽(墙面到中心线距离) */
export const HALF_SPAN = 12;
/** 门扇关闭时中缝点的上游偏移(人字拱度) */
export const MITER_OFFSET = 2;
/** 门扇尺寸 */
export const LEAF = {
  length: Math.hypot(HALF_SPAN, MITER_OFFSET), // 门叶长度
  thickness: 0.8,
  height: 8.0,
};
/** 关闭状态门叶方向角(xz 平面,atan2(z,x)) */
export const CLOSED_ANGLE = Math.atan2(-MITER_OFFSET, HALF_SPAN);

/** 闸室墙 */
export const WALL = {
  thickness: 3, // x 方向厚度
  height: 8.0,
  zMin: -20,
  zMax: 20,
};
/** 门龛(墙壁内供门扇开启后藏入的凹槽) */
export const RECESS = {
  depthIntoChamber: 0.5, // 凹槽越过墙面伸入闸室的量
  zMin: -15,
  zMax: 0.8, // 需覆盖支铰下游侧,门叶根部扫掠区域
  yMin: -0.5,
  yMax: 8.5,
};

/** 模拟障碍块(闸室壁凸起/遗留物),用于演示干涉 */
export const OBSTACLE = {
  cx: -10.2,
  cz: -7.5,
  sx: 1.6,
  sy: 2.5,
  sz: 2.0,
};

/** 连杆在门叶上的铰点(距支铰沿门叶方向) */
export const ROD_ATTACH_R = 4.0;
/** 铰点支架(门顶到连杆平面的立柱,局部坐标) */
export const BRACKET = { size: 0.3, yBottom: 7.5, yTop: 8.6 };
/** 连杆长度(固定) */
export const ROD_LENGTH = 3.0;
/** 连杆/活塞机构所在高度(门顶上方) */
export const LINK_Y = 8.5;
/** 启闭机(液压缸)参数 */
export const CYLINDER = {
  barrelLen: 4.0,
  barrelRadius: 0.35,
  rodRadius: 0.16,
  linkRodRadius: 0.15,
  /** 缸筒尾部到安装支点的距离 */
  tailLen: 1.2,
};
/** 支铰 */
export const HINGE = { radius: 0.5, height: 8.4 };

export interface SideConfig {
  id: 'L' | 'R';
  name: string;
  /** 支铰位置 */
  hinge: [number, number, number];
  /** 关闭时门叶方向角(弧度,xz 平面 atan2(z,x)) */
  closedAngle: number;
  /** 开启方向符号:开度 θ 增大时方向角的变化符号 */
  openSign: 1 | -1;
  /** 启闭机支座点 A */
  cylAnchor: [number, number, number];
  /** 液压缸轴线单位向量(指向活塞杆伸出方向) */
  cylDir: [number, number, number];
}

// 左岸:支铰在 x=-12;启闭机支座在左墙顶内缘下游侧,缸轴方向角 280°
// (该布置下活塞行程随开度单调增加,0 → 1.85m)
const CYL_DIR_L: [number, number, number] = [Math.cos(280 * DEG), 0, Math.sin(280 * DEG)];

export const SIDES: SideConfig[] = [
  {
    id: 'L',
    name: '左岸',
    hinge: [-HALF_SPAN, 0, 0],
    closedAngle: CLOSED_ANGLE,
    openSign: -1,
    cylAnchor: [-HALF_SPAN, LINK_Y, 6],
    cylDir: CYL_DIR_L,
  },
  {
    id: 'R',
    name: '右岸',
    hinge: [HALF_SPAN, 0, 0],
    closedAngle: Math.atan2(-MITER_OFFSET, -HALF_SPAN),
    openSign: 1,
    cylAnchor: [HALF_SPAN, LINK_Y, 6],
    cylDir: [-CYL_DIR_L[0], 0, CYL_DIR_L[2]],
  },
];

export const ANGLE_MIN = 0;
export const ANGLE_MAX = 90;
/** 开度档位 */
export const ANGLE_PRESETS = [0, 15, 30, 45, 60, 75, 90];
/** 干涉判定体积阈值(m³),低于此值视为接触/噪声 */
export const INTERFERENCE_VOLUME_EPS = 1e-4;
