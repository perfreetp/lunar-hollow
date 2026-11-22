import { useSyncExternalStore } from 'react';
import { computeWheelContacts } from '../physics/contacts';
import { G, ROPE_DEFAULTS, TENSION_GEARS } from '../physics/config';
import { RopeModel, type RopeModelInput } from '../physics/ropeModel';
import type {
  Cabin,
  SolveDirtyKind,
  SolverStats,
  Support,
  Vec3,
  WheelContact,
  WheelGroup,
} from '../physics/types';

let idSeq = 0;
const nextId = (prefix: string) => `${prefix}-${++idSeq}`;

/**
 * 按自由悬垂绳形布置初始轮组（自举）。
 * 轮组是单向接触的托索轮：轮面放在绳表面正下方，保持 0.5mm 轻微压陷，
 * 使初始场景即处于接触状态且不超阈值，抬轮即可看到压陷量上升与报警。
 * 轮位不进入绳节点，因此轮的摆放不改变绳形，一次参考求解即可定位。
 */
function placeInitialWheels(a: Support, b: Support): WheelGroup[] {
  const probe = new RopeModel();
  const baseInput = {
    supportA: a,
    supportB: b,
    wheels: [] as WheelGroup[],
    cabin: {
      t: 0.35,
      payloadKg: ROPE_DEFAULTS.defaultPayload,
      deadWeightKg: ROPE_DEFAULTS.cabinDeadWeight,
    },
    horizontalTension: TENSION_GEARS[2].H,
    linearDensity: ROPE_DEFAULTS.linearDensity,
    ropeRadius: ROPE_DEFAULTS.radius,
  };
  probe.solve(baseInput, 'all');

  const count = 6;
  const list: WheelGroup[] = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const x = a.position.x + (b.position.x - a.position.x) * t;
    // 用接触求解器同款的最近点查询，保证与正式接触计算几何一致
    const nearest = probe.closestPoint({ x, y: 0, z: 0 });
    list.push({
      id: nextId('wheel'),
      name: `轮组 ${i}`,
      position: {
        x: nearest.point.x,
        // 留 5mm 初始间隙：初始场景为干净的未接触安全态（绿色），
        // 用户向上拖轮使间隙归零后才产生压陷，超过阈值即报警
        y: nearest.point.y - (ROPE_DEFAULTS.wheelRadius + ROPE_DEFAULTS.radius) - 0.005,
        z: nearest.point.z,
      },
      radius: ROPE_DEFAULTS.wheelRadius,
      enabled: true,
    });
  }
  return list;
}

export interface AppState {
  supportA: Support;
  supportB: Support;
  wheels: WheelGroup[];
  cabin: Cabin;
  gearIndex: number;
  indentThresholdMm: number;
  ropeRadius: number;
  linearDensity: number;
  cameraMode: 'orbit' | 'follow';
  contacts: WheelContact[];
  stats: SolverStats;
  /** 每次状态变更递增，3D 场景据此做增量更新 */
  revision: number;
  /** 最近一次变更来源 */
  lastReason: SolveDirtyKind;
}

function makeInitialState(): AppState {
  const supportA: Support = {
    id: 'support-A',
    name: '支架 A（驱动机房侧）',
    position: { x: 0, y: 18, z: 0 },
  };
  const supportB: Support = {
    id: 'support-B',
    name: '支架 B（迂回轮侧）',
    position: { x: 300, y: 26, z: 0 },
  };
  return {
    supportA,
    supportB,
    wheels: placeInitialWheels(supportA, supportB),
    cabin: {
      t: 0.35,
      payloadKg: ROPE_DEFAULTS.defaultPayload,
      deadWeightKg: ROPE_DEFAULTS.cabinDeadWeight,
    },
    gearIndex: 2,
    indentThresholdMm: ROPE_DEFAULTS.defaultIndentThresholdMm,
    ropeRadius: ROPE_DEFAULTS.radius,
    linearDensity: ROPE_DEFAULTS.linearDensity,
    cameraMode: 'orbit',
    contacts: [],
    stats: {
      spanCount: 0,
      iterations: 0,
      maxChordArcError: 0,
      totalLength: 0,
      ringCount: 0,
      solveMs: 0,
      geometryMs: 0,
    },
    revision: 0,
    lastReason: 'all',
  };
}

type Listener = () => void;

class RopewayStore {
  state: AppState = makeInitialState();
  readonly model = new RopeModel();
  private listeners = new Set<Listener>();

  constructor() {
    this.runSolve('all');
  }

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): AppState => this.state;

  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  private buildInput(): RopeModelInput {
    return {
      supportA: this.state.supportA,
      supportB: this.state.supportB,
      wheels: this.state.wheels,
      cabin: this.state.cabin,
      horizontalTension: TENSION_GEARS[this.state.gearIndex].H,
      linearDensity: this.state.linearDensity,
      ropeRadius: this.state.ropeRadius,
    };
  }

  /** 物理求解 + 接触点重算，一次状态更新内同步完成（同帧链路起点） */
  runSolve(reason: SolveDirtyKind): void {
    const input = this.buildInput();
    this.model.solve(input, reason);
    const contacts = computeWheelContacts(
      this.model,
      input.wheels,
      this.state.ropeRadius,
      this.state.indentThresholdMm,
    );
    this.state = {
      ...this.state,
      contacts,
      lastReason: reason,
      revision: this.state.revision + 1,
      stats: {
        spanCount: this.model.spans.length,
        iterations: this.model.iterations,
        maxChordArcError: this.model.maxChordArcError,
        totalLength: this.model.totalLength,
        ringCount: this.model.ringCount,
        solveMs: this.model.lastSolveMs,
        geometryMs: this.state.stats.geometryMs,
      },
    };
    this.emit();
  }

  /** 高频性能数据（非响应式，UI 以固定频率轮询，避免通知风暴） */
  perf = { geometryMs: 0 };

  /** 供 3D 几何层回填几何耗时（不触发 React 更新） */
  reportGeometryMs(ms: number): void {
    this.perf.geometryMs = ms;
  }

  setDeadWeight(kg: number): void {
    this.state = {
      ...this.state,
      cabin: { ...this.state.cabin, deadWeightKg: Math.max(0, kg) },
    };
    this.runSolve('cabin');
  }

  // ---------- 修改动作 ----------

  setSupportPosition(id: 'support-A' | 'support-B', pos: Partial<Vec3>): void {
    const key = id === 'support-A' ? 'supportA' : 'supportB';
    this.state = {
      ...this.state,
      [key]: { ...this.state[key], position: { ...this.state[key].position, ...pos } },
    };
    this.runSolve('support');
  }

  setGear(index: number): void {
    this.state = { ...this.state, gearIndex: Math.min(4, Math.max(0, index)) };
    // 张力变化：全部接触点重算（reason=all，所有跨签名含 H 自动失效）
    this.runSolve('all');
  }

  setPayload(kg: number): void {
    this.state = {
      ...this.state,
      cabin: { ...this.state.cabin, payloadKg: Math.max(0, kg) },
    };
    this.runSolve('cabin');
  }

  setCabinT(t: number): void {
    this.state = {
      ...this.state,
      cabin: { ...this.state.cabin, t: Math.min(0.999, Math.max(0.001, t)) },
    };
    // 车厢移动：只有相邻两跨签名失效
    this.runSolve('cabin');
  }

  setWheelPosition(id: string, pos: Partial<Vec3>): void {
    this.state = {
      ...this.state,
      wheels: this.state.wheels.map((w) =>
        w.id === id ? { ...w, position: { ...w.position, ...pos } } : w,
      ),
    };
    this.runSolve('wheel');
  }

  setWheelRadius(id: string, radius: number): void {
    this.state = {
      ...this.state,
      wheels: this.state.wheels.map((w) =>
        w.id === id ? { ...w, radius: Math.max(0.05, radius) } : w,
      ),
    };
    this.runSolve('wheel');
  }

  setWheelEnabled(id: string, enabled: boolean): void {
    this.state = {
      ...this.state,
      wheels: this.state.wheels.map((w) => (w.id === id ? { ...w, enabled } : w)),
    };
    this.runSolve('wheel');
  }

  /**
   * 把轮面贴到当前绳形上。
   * @param indentMm 目标压陷量（mm）：0 = 刚好接触，正值 = 压入绳表面
   */
  snapWheelToRope(id: string, indentMm = 0): void {
    const wheel = this.state.wheels.find((w) => w.id === id);
    if (!wheel) return;
    // 轮位水平坐标保持不变，求当前绳形在该水平位置的最近点
    const nearest = this.model.closestPoint({
      x: wheel.position.x,
      y: wheel.position.y,
      z: wheel.position.z,
    });
    const indentM = indentMm / 1000;
    // 轮心高度 = 绳中线高度 − (R轮 + R绳) + 目标压陷量
    const y = nearest.point.y - (wheel.radius + this.state.ropeRadius) + indentM;
    this.setWheelPosition(id, { x: nearest.point.x, y, z: nearest.point.z });
  }

  addWheel(): boolean {
    if (this.state.wheels.length >= 12) return false;
    const t = 0.5;
    const a = this.state.supportA.position;
    const b = this.state.supportB.position;
    const wheel: WheelGroup = {
      id: nextId('wheel'),
      name: `轮组 ${this.state.wheels.length + 1}`,
      position: {
        x: a.x + (b.x - a.x) * t,
        y: (a.y + b.y) * 0.5 - 4,
        z: a.z + (b.z - a.z) * t,
      },
      radius: ROPE_DEFAULTS.wheelRadius,
      enabled: true,
    };
    this.state = { ...this.state, wheels: [...this.state.wheels, wheel] };
    this.runSolve('wheel');
    return true;
  }

  removeWheel(id: string): void {
    this.state = { ...this.state, wheels: this.state.wheels.filter((w) => w.id !== id) };
    this.runSolve('wheel');
  }

  setIndentThreshold(mm: number): void {
    this.state = { ...this.state, indentThresholdMm: Math.max(0, mm) };
    this.runSolve('all');
  }

  setCameraMode(mode: 'orbit' | 'follow'): void {
    this.state = { ...this.state, cameraMode: mode };
    this.emit();
  }

  resetAll(): void {
    idSeq = 0;
    this.state = makeInitialState();
    this.model.clearCache();
    this.runSolve('all');
  }

  /** 导出当前绳形数据为 JSON 文件 */
  exportRopeData(): void {
    const s = this.state;
    const m = this.model;
    const centerline: { x: number; y: number; z: number; arc: number; span: number }[] = [];
    let globalArc = 0;
    for (const span of m.spans) {
      for (const ring of span.rings) {
        centerline.push({
          x: +ring.pos.x.toFixed(4),
          y: +ring.pos.y.toFixed(4),
          z: +ring.pos.z.toFixed(4),
          arc: +(globalArc + ring.arc).toFixed(4),
          span: span.index,
        });
      }
      globalArc += span.cat.length;
    }
    const payload = {
      meta: {
        exportedAt: new Date().toISOString(),
        unit: 'SI (m, N, kg)',
        solver: 'segmented-catenary / bisection cabin equilibrium',
      },
      parameters: {
        supportA: s.supportA,
        supportB: s.supportB,
        gear: TENSION_GEARS[s.gearIndex],
        horizontalTensionN: TENSION_GEARS[s.gearIndex].H,
        cabin: s.cabin,
        cabinLoadN: (s.cabin.payloadKg + s.cabin.deadWeightKg) * G,
        rope: { radius: s.ropeRadius, linearDensity: s.linearDensity, weightPerMeterN: s.linearDensity * G },
        indentThresholdMm: s.indentThresholdMm,
      },
      spans: m.spans.map((sp) => ({
        index: sp.index,
        from: sp.nodeA.id,
        to: sp.nodeB.id,
        horizontalLength: +sp.dx.toFixed(4),
        verticalDifference: +sp.dy.toFixed(4),
        arcLength: +sp.cat.length.toFixed(4),
        endTension: {
          V0_N: +sp.cat.V0.toFixed(1),
          V1_N: +sp.cat.V1.toFixed(1),
          H_N: TENSION_GEARS[s.gearIndex].H,
          T0_N: +Math.hypot(sp.cat.V0, TENSION_GEARS[s.gearIndex].H).toFixed(1),
          T1_N: +Math.hypot(sp.cat.V1, TENSION_GEARS[s.gearIndex].H).toFixed(1),
        },
        rings: sp.rings.length,
        chordArcError: +sp.chordArcError.toExponential(3),
      })),
      wheelContacts: s.contacts.map((c) => ({
        wheelId: c.wheelId,
        point: c.point,
        indentationMm: +(c.indentation * 1000).toFixed(3),
        distanceMm: +(c.distance * 1000).toFixed(3),
        overThreshold: c.overThreshold,
        spanIndex: c.spanIndex,
      })),
      centerline,
      stats: s.stats,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ropeway-rope-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const store = new RopewayStore();

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.state),
  );
}
