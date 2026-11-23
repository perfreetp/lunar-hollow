// 确定性过闸仿真内核:固定步长推进,全程记录轨迹帧,支持任意时刻回放。
// 坐标约定(仿真规范坐标):z 轴沿航道,船舶一律向 +z 方向行驶;
// 进闸侧在 -z,出闸侧在 +z。上行过闸时在记录帧里把 z 取反映射到真实坐标。

import type { LockConfig, ShipConfig, SimEvent, SimResult, EventType } from './types';
import { HEADER, SHIP_STRIDE } from './types';

export const SIM_DT = 0.1;        // 仿真步长 s
export const RECORD_DT = 0.5;     // 轨迹记录间隔 s
export const MAX_SIM_TIME = 4 * 3600;
const ACCEL = 0.2;                // 纵向加/减速度上限 m/s^2
const DECEL = 0.15;               // 靠泊制动减速度 m/s^2
const LATERAL_SPEED = 0.4;        // 横向移船速度上限 m/s
const CREEP = 0.25;               // 靠泊蠕行速度 m/s

export const PHASE_NAMES = [
  '空闲', '闸室水位准备', '开启进闸闸门', '船舶进闸', '关闭进闸闸门',
  '闸室水位调整', '开启出闸闸门', '船舶出闸', '关闭出闸闸门', '仿真完成',
];
export const SHIP_STATE_NAMES = ['排队待闸', '进闸中', '停靠闸室', '出闸中', '已过闸'];

interface ShipRT {
  cfg: ShipConfig;
  x: number; z: number; v: number;
  state: number; // 0排队 1进闸 2停靠 3出闸 4完成
  berthX: number; berthZ: number;
}

export function sortedShips(ships: ShipConfig[]): ShipConfig[] {
  return [...ships].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** 把船舶按闸室可用长度划分为若干闸次,返回排序后下标分组 */
export function computeBatches(config: LockConfig, sorted: ShipConfig[]): number[][] {
  const usable = config.chamberLength - 2 * config.endMargin;
  const batches: number[][] = [];
  let cur: number[] = [];
  let len = 0;
  sorted.forEach((s, i) => {
    const add = (cur.length ? config.berthGap : 0) + s.length;
    if (cur.length && len + add > usable) {
      batches.push(cur);
      cur = [];
      len = 0;
    }
    const add2 = (cur.length ? config.berthGap : 0) + s.length;
    cur.push(i);
    len += add2;
  });
  if (cur.length) batches.push(cur);
  return batches;
}

/** 排队泊位布局(规范坐标,进闸侧 -z),双列并排,队列长度减半 */
export function queueLayout(config: LockConfig, sorted: ShipConfig[]): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = new Array(sorted.length);
  const laneOf = (w: number) => Math.min(8, Math.max(0, config.approachWidth / 2 - w / 2 - 1.5));
  // 队首与闸门之间预留并线距离:出列船需先摆脱并排船再移到中线进闸
  let cursor = -(config.chamberLength / 2 + 130);
  for (let i = 0; i < sorted.length; i += 2) {
    const a = sorted[i];
    const b = i + 1 < sorted.length ? sorted[i + 1] : null;
    const laneA = laneOf(a.width);
    const laneB = b ? laneOf(b.width) : 0;
    if (laneA >= 1 && (!b || laneB >= 1)) {
      // 双列并排
      out[i] = { x: -laneA, z: cursor - a.length / 2 };
      if (b) out[i + 1] = { x: laneB, z: cursor - b.length / 2 };
      cursor -= Math.max(a.length, b ? b.length : 0) + config.queueGap;
    } else {
      // 航道太窄,退化为单列
      out[i] = { x: 0, z: cursor - a.length / 2 };
      cursor -= a.length + config.queueGap;
      if (b) {
        out[i + 1] = { x: 0, z: cursor - b.length / 2 };
        cursor -= b.length + config.queueGap;
      }
    }
  }
  return out;
}

/** 闸室内停靠泊位:先到的船停最靠出闸端 */
function berthLayout(config: LockConfig, sorted: ShipConfig[], batch: number[]): { x: number; z: number }[] {
  const exitZ = config.chamberLength / 2;
  let cursor = exitZ - config.endMargin;
  return batch.map((i) => {
    const s = sorted[i];
    const z = cursor - s.length / 2;
    cursor = z - s.length / 2 - config.berthGap;
    return { x: 0, z };
  });
}

function moveToward(v: number, target: number, maxDelta: number): number {
  if (v < target) return Math.min(v + maxDelta, target);
  if (v > target) return Math.max(v - maxDelta, target);
  return v;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export function simulate(config: LockConfig, shipCfgs: ShipConfig[]): SimResult {
  const sorted = sortedShips(shipCfgs);
  const N = sorted.length;
  const batches = computeBatches(config, sorted);
  const dirSign = config.direction === 'up' ? -1 : 1;
  const fromLevel = config.direction === 'up' ? config.downstreamLevel : config.upstreamLevel;
  const toLevel = config.direction === 'up' ? config.upstreamLevel : config.downstreamLevel;
  const L2 = config.chamberLength / 2;
  const maxGate = Math.max(1, config.gateMaxAngle);
  const stepInterval = Math.max(0.05, config.gateStepInterval);

  const events: SimEvent[] = [];
  const lastEvt = new Map<string, number>();
  const emit = (t: number, type: EventType, message: string, shipId?: string, throttleKey?: string): boolean => {
    if (throttleKey) {
      const last = lastEvt.get(throttleKey) ?? -1e9;
      if (t - last < 1.5) return false;
      lastEvt.set(throttleKey, t);
    }
    events.push({ t: round2(t), type, message, shipId });
    return true;
  };

  // 初始状态:全部船舶在引航道排队
  const queuePos = queueLayout(config, sorted);
  const ships: ShipRT[] = sorted.map((cfg, i) => ({
    cfg, x: queuePos[i].x, z: queuePos[i].z, v: 0, state: 0, berthX: 0, berthZ: 0,
  }));
  batches.forEach((b) => {
    const berths = berthLayout(config, sorted, b);
    b.forEach((si, k) => {
      ships[si].berthZ = berths[k].z;
      ships[si].berthX = berths[k].x;
    });
  });

  let water = fromLevel;
  let waterTarget = fromLevel;
  let entryGate = 0, exitGate = 0;
  let entryGateTarget = 0, exitGateTarget = 0;
  let entryGateTimer = 0, exitGateTimer = 0;
  let phase = 1;
  let batchIdx = 0;
  let collisions = 0;
  let t = 0;

  const stride = HEADER + SHIP_STRIDE * N;
  const maxFrames = Math.ceil(MAX_SIM_TIME / RECORD_DT) + 2;
  let data = new Float32Array(maxFrames * stride);
  let frameCount = 0;
  let recTimer = RECORD_DT; // 立即记录首帧

  const record = () => {
    const o = frameCount * stride;
    data[o] = t;
    data[o + 1] = water;
    // 记录真实坐标系下的上/下闸门角度
    data[o + 2] = config.direction === 'up' ? exitGate : entryGate;
    data[o + 3] = config.direction === 'up' ? entryGate : exitGate;
    data[o + 4] = phase;
    for (let i = 0; i < N; i++) {
      const s = ships[i];
      data[o + HEADER + SHIP_STRIDE * i] = s.x;
      data[o + HEADER + SHIP_STRIDE * i + 1] = s.z * dirSign;
      data[o + HEADER + SHIP_STRIDE * i + 2] = s.v;
      data[o + HEADER + SHIP_STRIDE * i + 3] = s.state;
    }
    frameCount++;
  };

  const setPhase = (p: number) => {
    phase = p;
    emit(t, 'phase', `第 ${batchIdx + 1}/${batches.length} 闸次 · ${PHASE_NAMES[p]}`);
  };
  emit(0, 'phase', `第 1/${batches.length} 闸次 · ${PHASE_NAMES[1]}`);

  const batchShips = (bi: number) => batches[bi].map((i) => ships[i]);

  // 可用半宽(含闸门开度限制)
  const halfWidthAt = (z: number) => {
    if (z < -L2 - 0.5 || z > L2 + 0.5) return config.approachWidth / 2 - 0.3;
    if (z > -L2 + 0.5 && z < L2 - 0.5) return config.chamberWidth / 2 - 0.3;
    const gate = z < 0 ? entryGate : exitGate;
    const open = gate / maxGate;
    return Math.max(0.8, (config.chamberWidth / 2 - 0.5) * open);
  };

  // 跟船限速:前方安全距离内限速
  const followCap = (s: ShipRT, vDes: number) => {
    let cap = vDes;
    for (const o of ships) {
      if (o === s || o.state === 4) continue;
      const dz = o.z - s.z;
      if (dz <= 0) continue;
      if (Math.abs(o.x - s.x) >= (o.cfg.width + s.cfg.width) / 2 * 0.9) continue;
      const gap = dz - (o.cfg.length + s.cfg.length) / 2;
      if (gap < 8) cap = Math.min(cap, Math.max(0, o.v + (gap - 3) * 0.4));
    }
    return cap;
  };

  // 横向移动目标:旁侧有船并行时保持当前车道,避免横向逼近
  const lateralTarget = (s: ShipRT, desired: number) => {
    for (const o of ships) {
      if (o === s || o.state === 4) continue;
      if (Math.abs(o.z - s.z) < (o.cfg.length + s.cfg.length) / 2 + 6) return s.x;
    }
    return desired;
  };

  while (phase !== 9 && t < MAX_SIM_TIME) {
    t += SIM_DT;

    // ---- 闸门按角度档位步进 ----
    entryGateTimer += SIM_DT;
    while (entryGateTimer >= stepInterval && entryGate !== entryGateTarget) {
      entryGateTimer -= stepInterval;
      entryGate = moveToward(entryGate, entryGateTarget, config.gateStepAngle);
    }
    exitGateTimer += SIM_DT;
    while (exitGateTimer >= stepInterval && exitGate !== exitGateTarget) {
      exitGateTimer -= stepInterval;
      exitGate = moveToward(exitGate, exitGateTarget, config.gateStepAngle);
    }

    // ---- 水位按速率升降 ----
    const prevWater = water;
    water = moveToward(water, waterTarget, config.waterRate * SIM_DT);
    if (water !== prevWater && water === waterTarget) {
      emit(t, 'water', `水位到达 ${water.toFixed(2)} m`);
    }

    // ---- 阶段机 ----
    switch (phase) {
      case 1: // 水位准备(调至进闸侧水位)
        if (water === waterTarget) {
          entryGateTarget = maxGate;
          setPhase(2);
          emit(t, 'gate', '进闸闸门开启中');
        }
        break;
      case 2: // 等待进闸闸门全开
        if (entryGate >= maxGate) setPhase(3);
        break;
      case 3: { // 船舶依次进闸
        const bs = batchShips(batchIdx);
        for (let k = 0; k < bs.length; k++) {
          const s = bs[k];
          if (s.state === 0) {
            const prev = k > 0 ? bs[k - 1] : null;
            const clear = !prev || prev.state >= 2 || prev.z - prev.cfg.length / 2 > -L2 + 8;
            if (clear) {
              s.state = 1;
              s.v = Math.min(s.cfg.speed, config.cruiseSpeedCap);
              emit(t, 'release', `${s.cfg.name} 开始进闸`, s.cfg.id);
            }
            break;
          }
        }
        if (bs.every((s) => s.state === 2)) {
          entryGateTarget = 0;
          setPhase(4);
          emit(t, 'gate', '进闸闸门关闭中');
        }
        break;
      }
      case 4: // 等待进闸闸门关闭
        if (entryGate <= 0) {
          waterTarget = toLevel;
          setPhase(5);
          emit(t, 'water', `闸室水位调整:${water.toFixed(2)} → ${toLevel.toFixed(2)} m`);
        }
        break;
      case 5: // 水位调整
        if (water === waterTarget) {
          exitGateTarget = maxGate;
          setPhase(6);
          emit(t, 'gate', '出闸闸门开启中');
        }
        break;
      case 6: // 等待出闸闸门全开
        if (exitGate >= maxGate) setPhase(7);
        break;
      case 7: { // 船舶依次出闸
        const bs = batchShips(batchIdx);
        for (let k = 0; k < bs.length; k++) {
          const s = bs[k];
          if (s.state === 2) {
            const prev = k > 0 ? bs[k - 1] : null;
            const clear = !prev || prev.state === 4 || prev.z - prev.cfg.length / 2 > L2 + 10;
            if (clear) {
              s.state = 3;
              emit(t, 'exit', `${s.cfg.name} 开始出闸`, s.cfg.id);
            }
            break;
          }
        }
        if (bs.every((s) => s.state === 4)) {
          exitGateTarget = 0;
          setPhase(8);
          emit(t, 'gate', '出闸闸门关闭中');
        }
        break;
      }
      case 8: // 等待出闸闸门关闭,进入下一闸次或结束
        if (exitGate <= 0) {
          if (batchIdx < batches.length - 1) {
            batchIdx++;
            waterTarget = fromLevel;
            setPhase(1);
          } else {
            setPhase(9);
          }
        }
        break;
    }

    // ---- 船舶运动 ----
    for (const s of ships) {
      if (s.state === 1) { // 进闸:驶向泊位
        const dist = s.berthZ - s.z;
        let vDes = Math.min(
          s.cfg.speed,
          config.cruiseSpeedCap,
          Math.max(Math.sqrt(2 * DECEL * Math.max(dist, 0)), CREEP),
        );
        vDes = followCap(s, vDes);
        s.v = moveToward(s.v, vDes, ACCEL * SIM_DT);
        let zNew = s.z + s.v * SIM_DT;
        if (zNew >= s.berthZ) {
          zNew = s.berthZ;
          if (s.v <= 0.6) {
            s.state = 2;
            s.v = 0;
            emit(t, 'dock', `${s.cfg.name} 停靠到位`, s.cfg.id);
          }
        }
        s.z = zNew;
        s.x = moveToward(s.x, lateralTarget(s, s.berthX), LATERAL_SPEED * SIM_DT);
      } else if (s.state === 3) { // 出闸:驶离闸区
        let vDes = Math.min(s.cfg.speed, config.cruiseSpeedCap * 1.2);
        vDes = followCap(s, vDes);
        s.v = moveToward(s.v, vDes, ACCEL * SIM_DT);
        s.z += s.v * SIM_DT;
        s.x = moveToward(s.x, lateralTarget(s, 0), LATERAL_SPEED * SIM_DT * 0.5);
        if (s.z - s.cfg.length / 2 > L2 + config.approachLength) {
          s.state = 4;
          s.v = 0;
          emit(t, 'done', `${s.cfg.name} 完成过闸`, s.cfg.id);
        }
      }
    }

    // ---- 碰撞检测:闸门 ----
    for (const s of ships) {
      if (s.state !== 1 && s.state !== 3) continue;
      const half = s.cfg.length / 2;
      for (const g of [-L2, L2]) {
        const gateAngle = g < 0 ? entryGate : exitGate;
        if (s.z - half < g - 0.05 && s.z + half > g + 0.05 && gateAngle < 0.95 * maxGate) {
          s.z = g - half - 0.3;
          s.v = 0;
          if (emit(t, 'collision', `${s.cfg.name} 与闸门发生碰撞,紧急停车`, s.cfg.id, `gate-${s.cfg.id}`)) collisions++;
        }
      }
    }

    // ---- 碰撞检测:墙壁 ----
    for (const s of ships) {
      if (s.state === 4) continue;
      const hw = halfWidthAt(s.z);
      const over = Math.abs(s.x) + s.cfg.width / 2 - hw;
      if (over > 0) {
        s.x = Math.sign(s.x) * (hw - s.cfg.width / 2);
        s.v = Math.min(s.v, 0.3);
        if (emit(t, 'collision', `${s.cfg.name} 与闸室墙/导航墙碰撞,减速避让`, s.cfg.id, `wall-${s.cfg.id}`)) collisions++;
      }
    }

    // ---- 碰撞检测:船-船 ----
    for (let i = 0; i < N; i++) {
      const a = ships[i];
      if (a.state === 4) continue;
      for (let j = i + 1; j < N; j++) {
        const b = ships[j];
        if (b.state === 4) continue;
        if (Math.abs(a.x - b.x) >= (a.cfg.width + b.cfg.width) / 2 + 0.2) continue;
        if (Math.abs(a.z - b.z) >= (a.cfg.length + b.cfg.length) / 2 + 0.2) continue;
        // 追尾 resolution:后船(规范坐标 z 较小者)后退并让速;静止船不被推挤
        const rear = a.z < b.z ? a : b;
        const front = rear === a ? b : a;
        const overlap = (a.cfg.length + b.cfg.length) / 2 + 0.2 - Math.abs(a.z - b.z);
        if (rear.state === 1 || rear.state === 3) rear.z -= overlap;
        rear.v = Math.min(rear.v, front.v);
        if (emit(t, 'collision', `${rear.cfg.name} 与 ${front.cfg.name} 距离过近发生碰撞,减速`, rear.cfg.id, `pair-${i}-${j}`)) collisions++;
      }
    }

    // ---- 记录帧 ----
    recTimer += SIM_DT;
    if (recTimer >= RECORD_DT - 1e-9) {
      recTimer -= RECORD_DT;
      record();
    }
  }

  record();
  data = data.slice(0, frameCount * stride);

  return {
    version: 1,
    config: { ...config },
    ships: sorted.map((s) => ({ ...s })),
    batches,
    recordDt: RECORD_DT,
    duration: round2(t),
    frameCount,
    stride,
    data,
    events,
    collisions,
    completed: phase === 9,
    createdAt: new Date().toISOString(),
  };
}

/** 轨迹采样器:按时间线性插值,供回放/渲染使用(复用内存,零分配) */
export class Sampler {
  header = new Float32Array(HEADER);
  ships: Float32Array;
  private result: SimResult;

  constructor(result: SimResult) {
    this.result = result;
    this.ships = new Float32Array(SHIP_STRIDE * result.ships.length);
  }

  sample(t: number): { header: Float32Array; ships: Float32Array } {
    const r = this.result;
    const clamped = Math.max(0, Math.min(t, r.duration));
    const pos = clamped / r.recordDt;
    let i0 = Math.floor(pos);
    let i1 = Math.min(i0 + 1, r.frameCount - 1);
    if (i0 >= r.frameCount - 1) i0 = r.frameCount - 1;
    const alpha = i0 === i1 ? 0 : pos - i0;
    const s = r.stride;
    const d = r.data;
    const o0 = i0 * s;
    const o1 = i1 * s;
    for (let k = 0; k < HEADER; k++) {
      this.header[k] = d[o0 + k] + (d[o1 + k] - d[o0 + k]) * alpha;
    }
    const n = this.ships.length;
    for (let k = 0; k < n; k++) {
      // 状态字段取较近帧,其余线性插值
      if (k % SHIP_STRIDE === 3) {
        this.ships[k] = alpha < 0.5 ? d[o0 + HEADER + k] : d[o1 + HEADER + k];
      } else {
        this.ships[k] = d[o0 + HEADER + k] + (d[o1 + HEADER + k] - d[o0 + HEADER + k]) * alpha;
      }
    }
    return { header: this.header, ships: this.ships };
  }
}

/** 配置校验,返回告警/错误信息列表 */
export function validateConfig(config: LockConfig, ships: ShipConfig[]): string[] {
  const msgs: string[] = [];
  const sorted = sortedShips(ships);
  const usable = config.chamberLength - 2 * config.endMargin;
  if (usable <= 0) msgs.push('闸室可用长度不足(端部安全距离过大)');
  for (const s of sorted) {
    if (s.length > usable) msgs.push(`${s.name} 船长 ${s.length}m 超过闸室可用长度 ${usable}m`);
    if (s.width > config.chamberWidth - 1) msgs.push(`${s.name} 船宽 ${s.width}m 超过闸室可用宽度`);
    if (s.width > config.approachWidth - 1) msgs.push(`${s.name} 船宽超过引航道可用宽度`);
    if (s.speed <= 0) msgs.push(`${s.name} 初始速度必须大于 0`);
  }
  const orders = sorted.map((s) => s.order);
  if (new Set(orders).size !== orders.length) msgs.push('进闸顺序存在重复编号');
  const q = queueLayout(config, sorted);
  if (q.length && -q[q.length - 1].z > config.chamberLength / 2 + config.approachLength) {
    msgs.push('排队船队超出引航道长度,建议增大排队间距以外的疏解方案');
  }
  if (config.waterRate <= 0) msgs.push('水位升降速率必须大于 0');
  if (config.gateStepAngle <= 0 || config.gateStepAngle > config.gateMaxAngle) {
    msgs.push('闸门档位角度应在 (0, 最大开度] 之间');
  }
  return msgs;
}
