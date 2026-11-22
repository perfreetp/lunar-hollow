import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { SunConfig } from './types';

/**
 * 太阳几何。
 *
 * 坐标系约定：
 * - 幕墙位于 z = 0 平面，室内在 +z 一侧；
 * - x 沿幕墙水平向右，y 竖直向上；
 * - 时角 h=0（正午）时太阳在幕墙法线方向，h>0 偏向 +x（下午）。
 *
 * 高度角 a：太阳方向与水平面的夹角。
 * 太阳方向向量（指向太阳）：
 *   水平分量长度 cos(a)，竖直分量 sin(a)，
 *   水平分量在 x/z 上按时角展开。
 */
export function sunDirection(sun: SunConfig): Vector3 {
  const h = (sun.hourAngleDeg * Math.PI) / 180;
  const a = (sun.altitudeDeg * Math.PI) / 180;
  const horiz = Math.cos(a);
  return new Vector3(
    horiz * Math.sin(h),
    Math.sin(a),
    // 太阳在室外（-z 侧），正午正对幕墙
    -horiz * Math.cos(h),
  ).normalize();
}

/**
 * 光线传播方向（与太阳方向相反），即从幕墙射入室内的方向。
 */
export function lightRayDirection(sun: SunConfig): Vector3 {
  return sunDirection(sun).scale(-1);
}

/** 太阳高度角是否低到阳光几乎平射（<=2° 视为贴地，不产生室内光斑） */
export function isSunGrazing(sun: SunConfig): boolean {
  return sun.altitudeDeg <= 2;
}
