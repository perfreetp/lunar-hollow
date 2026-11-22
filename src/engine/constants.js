// 积木规格与基础常量 —— 单位:世界单位(mm 风格),网格凸点间距 STUD_PITCH
export const STUD_PITCH = 20;
export const PLATE_HEIGHT = 8;
export const BRICK_HEIGHT = PLATE_HEIGHT * 3; // 砖 = 3 板高
export const STUD_RADIUS = 6;
export const STUD_HEIGHT = 4;
export const BASE_PLATE_SIZE = 32; // 32 x 32 凸点拼装台

// 零件库:常见规格积木(w/d 为凸点数,h 为板高单位)
export const BLOCK_CATALOG = [
  { id: 'plate-1x1', label: '板 1×1', w: 1, d: 1, h: 1, category: '板' },
  { id: 'plate-1x2', label: '板 1×2', w: 2, d: 1, h: 1, category: '板' },
  { id: 'plate-2x2', label: '板 2×2', w: 2, d: 2, h: 1, category: '板' },
  { id: 'plate-2x4', label: '板 2×4', w: 4, d: 2, h: 1, category: '板' },
  { id: 'plate-4x4', label: '板 4×4', w: 4, d: 4, h: 1, category: '板' },
  { id: 'plate-6x12', label: '板 6×12', w: 12, d: 6, h: 1, category: '板' },
  { id: 'brick-1x1', label: '砖 1×1', w: 1, d: 1, h: 3, category: '砖' },
  { id: 'brick-1x2', label: '砖 1×2', w: 2, d: 1, h: 3, category: '砖' },
  { id: 'brick-1x4', label: '砖 1×4', w: 4, d: 1, h: 3, category: '砖' },
  { id: 'brick-2x2', label: '砖 2×2', w: 2, d: 2, h: 3, category: '砖' },
  { id: 'brick-2x4', label: '砖 2×4', w: 4, d: 2, h: 3, category: '砖' },
];

export const COLOR_CATALOG = [
  { id: 'red', label: '红', color: 0xd32f2f, transparent: false },
  { id: 'blue', label: '蓝', color: 0x1e88e5, transparent: false },
  { id: 'yellow', label: '黄', color: 0xfdd835, transparent: false },
  { id: 'green', label: '绿', color: 0x43a047, transparent: false },
  { id: 'gray', label: '灰', color: 0x78909c, transparent: false },
  { id: 'white', label: '白', color: 0xf0f0f0, transparent: false },
  { id: 'black', label: '黑', color: 0x263238, transparent: false },
  { id: 't-blue', label: '透蓝', color: 0x4fc3f7, transparent: true, opacity: 0.45 },
  { id: 't-red', label: '透红', color: 0xef5350, transparent: true, opacity: 0.45 },
  { id: 't-clear', label: '透明', color: 0xe0f7fa, transparent: true, opacity: 0.32 },
];

const TYPE_MAP = new Map(BLOCK_CATALOG.map((t) => [t.id, t]));
const COLOR_MAP = new Map(COLOR_CATALOG.map((c) => [c.id, c]));

export function getBlockType(typeId) {
  return TYPE_MAP.get(typeId);
}

export function getColor(colorId) {
  return COLOR_MAP.get(colorId);
}

let nextId = 1;
export function createBlock(typeId, colorId, x = 0, y = 0, z = 0, rot = 0) {
  const type = getBlockType(typeId);
  if (!type) throw new Error(`未知积木类型: ${typeId}`);
  if (!getColor(colorId)) throw new Error(`未知颜色: ${colorId}`);
  return {
    id: `b${nextId++}`,
    typeId,
    colorId,
    x, // 网格锚点(占用 footprint 的最小角),凸点单位
    y,
    z, // 板高层
    rot: ((rot % 4) + 4) % 4,
  };
}

export function resetIdCounter(start = 1) {
  nextId = start;
}

// 旋转后的占用尺寸(凸点数)
export function footprintSize(type, rot) {
  const swap = rot % 2 === 1;
  return swap ? { w: type.d, d: type.w } : { w: type.w, d: type.d };
}

// 积木占用的全部网格单元(整数凸点坐标)
export function footprintCells(block) {
  const type = getBlockType(block.typeId);
  const { w, d } = footprintSize(type, block.rot);
  const cells = [];
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < d; dy++) {
      cells.push({ gx: block.x + dx, gy: block.y + dy });
    }
  }
  return cells;
}

// 垂直方向占用区间(板高层,半开区间)
export function verticalInterval(block) {
  const type = getBlockType(block.typeId);
  return { z0: block.z, z1: block.z + type.h };
}

// 网格坐标 -> 世界坐标(积木中心)
export function gridToWorld(block) {
  const type = getBlockType(block.typeId);
  const { w, d } = footprintSize(type, block.rot);
  return {
    x: (block.x + w / 2) * STUD_PITCH - (BASE_PLATE_SIZE * STUD_PITCH) / 2,
    y: (block.z + 0.5) * PLATE_HEIGHT,
    z: (block.y + d / 2) * STUD_PITCH - (BASE_PLATE_SIZE * STUD_PITCH) / 2,
  };
}

// 拼装台左上角对应的世界原点(用于射线平面交点反算网格锚点)
export const PLATE_WORLD_HALF = (BASE_PLATE_SIZE * STUD_PITCH) / 2;
