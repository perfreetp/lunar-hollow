import type { FloorPlan, Lamp } from './types';

/** 内置示例户型：L 形客厅 + 卧室，含门、窗与一段玻璃隔断 */
export const SAMPLE_PLAN: FloorPlan = {
  name: '示例户型 · L 形两居',
  height: 2.7,
  outline: [
    [0, 0],
    [6.4, 0],
    [6.4, 3.2],
    [4.2, 3.2],
    [4.2, 5.2],
    [0, 5.2],
  ],
  doors: [{ wall: 4, offset: 1.6, width: 0.9, height: 2.1 }],
  windows: [
    { wall: 0, offset: 2.2, width: 1.8, sill: 0.9, height: 1.5 },
    { wall: 1, offset: 0.9, width: 1.2, sill: 0.9, height: 1.5 },
  ],
  glassPartitions: [{ from: [3.0, 1.7], to: [5.2, 1.7], height: 2.2 }],
};

/** 示例灯具（便于首次打开即有效果） */
export const SAMPLE_LAMPS: Lamp[] = [
  { id: 'demo-c1', type: 'ceiling', position: [2.2, 2.64, 1.1], normal: [0, -1, 0], cctIndex: 1, powerIndex: 1 },
  { id: 'demo-c2', type: 'ceiling', position: [2.1, 2.64, 4.3], normal: [0, -1, 0], cctIndex: 0, powerIndex: 0 },
  { id: 'demo-w1', type: 'wall', position: [0.07, 1.8, 2.6], normal: [1, 0, 0], cctIndex: 0, powerIndex: 1 },
  { id: 'demo-n1', type: 'night', position: [3.6, 0.28, 4.9], normal: [0, 1, 0], cctIndex: 0, powerIndex: 0 },
  { id: 'demo-n2', type: 'night', position: [0.4, 0.28, 4.9], normal: [0, 1, 0], cctIndex: 0, powerIndex: 0 },
];

/** 校验并补全户型字段；非法时抛出错误 */
export function normalizePlan(raw: unknown): FloorPlan {
  const p = raw as FloorPlan;
  if (!p || !Array.isArray(p.outline) || p.outline.length < 3) {
    throw new Error('户型文件缺少有效的 outline（至少 3 个顶点）');
  }
  for (const pt of p.outline) {
    if (!Array.isArray(pt) || pt.length !== 2 || !isFinite(pt[0]) || !isFinite(pt[1])) {
      throw new Error('outline 顶点格式应为 [x, z] 数值数组');
    }
  }
  return {
    name: typeof p.name === 'string' ? p.name : '导入户型',
    outline: p.outline.map(([x, z]) => [Number(x), Number(z)]),
    height: isFinite(p.height) && p.height > 1.5 && p.height < 6 ? Number(p.height) : 2.7,
    doors: Array.isArray(p.doors) ? p.doors : [],
    windows: Array.isArray(p.windows) ? p.windows : [],
    glassPartitions: Array.isArray(p.glassPartitions) ? p.glassPartitions : [],
  };
}
