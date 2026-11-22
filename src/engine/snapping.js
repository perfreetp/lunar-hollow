// 吸附逻辑:把自由拖拽位置吸附到最近凸点网格,支持阈值与边界约束
import { footprintSize, getBlockType, BASE_PLATE_SIZE } from './constants.js';

/**
 * 根据连续世界平面坐标(凸点单位)计算最近的合法网格锚点
 * @param pos 拖拽点(凸点单位,浮点)
 * @param block 候选积木(取其类型与旋转决定 footprint)
 * @param threshold 吸附阈值(凸点单位),超过则不吸附,返回 null
 */
export function snapToGrid(pos, block, threshold) {
  const type = getBlockType(block.typeId);
  const { w, d } = footprintSize(type, block.rot);

  // 锚点 = 拖拽中心减去 footprint 一半,再取整
  const rawX = pos.x - w / 2;
  const rawY = pos.y - d / 2;
  const candX = Math.round(rawX);
  const candY = Math.round(rawY);

  // 用与半整数的距离表达偏差,规避 2.0000000000000004 类浮点误差
  const distX = Math.abs(rawX - candX);
  const distY = Math.abs(rawY - candY);
  const eps = 1e-9;

  if (distX > threshold + eps || distY > threshold + eps) return null;

  // 边界约束:整个 footprint 必须落在拼装台内
  const clampedX = Math.max(0, Math.min(BASE_PLATE_SIZE - w, candX));
  const clampedY = Math.max(0, Math.min(BASE_PLATE_SIZE - d, candY));
  return { x: clampedX, y: clampedY };
}
