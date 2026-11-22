import type { RunwayConfig } from './types';

/** 示例：模拟一条 3200m × 45m、带 1.2% 纵向坡度的跑道 */
export function demoRunways(): RunwayConfig[] {
  return [
    {
      id: 'RWY-17/35',
      origin: { lng: 121.795, lat: 31.135 },
      length: 3200,
      width: 45,
      bearing: 173,
      slopePct: 1.2,
      suffix0: '',
      suffix1: ''
    }
  ];
}

/**
 * 压测场景：网格铺开的多条跑道（不同方位/坡度/尺寸），合计两万以上标线要素，
 * 用于验证拖动/缩放流畅度。跑道间距数公里，避免全部挤在同一视野。
 */
export function stressRunways(): RunwayConfig[] {
  const list: RunwayConfig[] = [];
  const baseLng = 120.0;
  const baseLat = 31.0;
  // 14 列 × 9 行 = 126 条；列间距约 0.028° 经度(~2.7km)，行间距 0.022° 纬度(~2.4km)
  const COLS = 14;
  const ROWS = 9;
  const presets = [
    { len: 3800, wid: 60 },
    { len: 3400, wid: 45 },
    { len: 2800, wid: 38 },
    { len: 4000, wid: 60 },
    { len: 3000, wid: 45 }
  ];
  let n = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const p = presets[(row * COLS + col) % presets.length];
      const bearing = (row % 4) * 45 + (col % 3) * 7; // 多朝向
      const slope = ((row + col) % 3 - 1) * 0.8; // -0.8 / 0 / +0.8
      const suffix = col % 2 === 0 ? 'L' : 'R';
      list.push({
        id: `STRESS-${String(++n).padStart(3, '0')}`,
        origin: {
          lng: baseLng + col * 0.028 + (row % 2) * 0.008,
          lat: baseLat + row * 0.022
        },
        length: p.len,
        width: p.wid,
        bearing: bearing % 360,
        slopePct: slope,
        suffix0: suffix,
        suffix1: suffix === 'L' ? 'R' : 'L'
      });
    }
  }
  return list;
}
