/**
 * gearMath.js —— 齿轮传动纯函数核心（无 three.js 依赖，可单测）
 *
 * 坐标约定：
 *  - 模数 m = 1（世界单位），分度圆半径 r = z/2
 *  - 布局使用网格坐标（1 格 = 0.5 世界单位），因此两个正确啮合齿轮的
 *    网格中心距恰好等于 z_i + z_j，世界中心距 = (z_i+z_j)/2 = r_i+r_j
 *  - 角度单位弧度，正方向 = 逆时针（与 three.js rotation.z 一致）
 *
 * 无穿透原理：
 *  外啮合滚动约束  z_j·θ_j + z_i·θ_i ≡ C (mod 2π)
 *  建边时按父轮当前相位，在接触方向把从动轮的齿槽对准主动轮最近的齿，
 *  之后按 ω_j = -(z_i/z_j)·ω_i 传动，接触点处齿/槽相对相位恒定，
 *  几何上再预留 8% 齿厚侧隙 + 径向顶隙，保证任何时刻不穿透。
 */

export const MODULE = 1;
export const GRID = 0.5;                    // 每格世界单位
export const MESH_TOL = 0.18;               // 啮合带容差（世界单位）
export const NEAR_TOL = 0.65;               // 接近但未啮合的提示带宽
export const OVERLAP_RATIO = 0.55;          // 判定同轴/重叠的半径比例
export const MAX_LAYERS = 4;

/* ---------- 基础几何 ---------- */

export const pitchRadius = (teeth) => (teeth * MODULE) / 2;
export const tipRadius = (teeth) => pitchRadius(teeth) + MODULE;
export const rootRadius = (teeth) => Math.max(0.4, pitchRadius(teeth) - 1.25 * MODULE);
export const gridToWorld = (v) => v * GRID;

export function gearWorldPos(gear) {
  return { x: gridToWorld(gear.gridX), y: gridToWorld(gear.gridY) };
}

export function pairDistance(a, b) {
  const pa = gearWorldPos(a);
  const pb = gearWorldPos(b);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

/** 把任意角度规范到 (-π, π] */
export function wrapToPi(a) {
  let x = a % (Math.PI * 2);
  if (x <= -Math.PI) x += Math.PI * 2;
  if (x > Math.PI) x -= Math.PI * 2;
  return x;
}

export function mod2pi(a) {
  const x = a % (Math.PI * 2);
  return x < 0 ? x + Math.PI * 2 : x;
}

/* ---------- 啮合关系判定 ---------- */

/**
 * 评估两个齿轮的几何关系
 * @returns {{state:'mesh'|'gap'|'tight'|'overlap'|'far', delta:number, distance:number, beta:number}}
 *   delta > 0 表示间隙偏大，< 0 表示偏紧
 */
export function evaluatePair(a, b) {
  const distance = pairDistance(a, b);
  const beta = Math.atan2(
    gridToWorld(b.gridY - a.gridY),
    gridToWorld(b.gridX - a.gridX)
  );
  const ideal = pitchRadius(a.teeth) + pitchRadius(b.teeth);
  const delta = distance - ideal;
  const minTip = Math.min(tipRadius(a.teeth), tipRadius(b.teeth));

  let state;
  const bodyTouch = tipRadius(a.teeth) + tipRadius(b.teeth) - 0.5 * MODULE;
  if (Math.abs(delta) <= MESH_TOL) {
    state = 'mesh';
  } else if (distance < bodyTouch && delta < 0) {
    // 实体轮盘相交且不在啮合带：需要分层避免穿插
    state = distance < minTip * OVERLAP_RATIO || distance < 0.25 ? 'overlap' : 'tight';
    // 进一步：若已深入对方轮体（中心距小于任一方齿顶+齿根），视为重叠占位
    if (distance < tipRadius(a.teeth) + rootRadius(b.teeth) - MODULE ||
        distance < tipRadius(b.teeth) + rootRadius(a.teeth) - MODULE) {
      state = 'overlap';
    }
  } else if (delta < 0) {
    state = 'tight';
  } else if (delta <= NEAR_TOL) {
    state = 'gap';
  } else {
    state = 'far';
  }
  return { state, delta, distance, beta, ideal };
}

/**
 * 外啮合：由父轮相位求子轮相位（齿槽对准父轮最近齿）
 * @returns {{theta:number, invariant:number}}
 */
export function meshChildAngle(thetaParent, zParent, zChild, beta) {
  // 父轮在接触方向上距最近齿中心的相位误差
  const deltaI = wrapToPi(zParent * (thetaParent - beta));
  // 滚动弧长匹配：子轮齿槽中心对齐该齿，侧隙由几何齿厚预留
  const pj = Math.PI - (zParent / zChild) * deltaI;
  const theta = beta + pj / zChild;
  const invariant = mod2pi(zChild * theta + zParent * thetaParent);
  return { theta, invariant };
}

/** 传动比：子轮相对父轮的有符号转速比（外啮合反向） */
export const speedRatio = (zParent, zChild) => -zParent / zChild;

/* ---------- 深度分层（处理前后遮挡） ---------- */

/**
 * 啮合齿轮必须同层；重叠（非啮合）齿轮必须异层。
 * BFS 建立啮合连通分量 + 贪心着色。
 * @returns {{layers:Map<string,number>, layerConflicts:Array}}
 */
export function assignLayers(gears, meshPairs, overlapPairs, driverId = null) {
  const layers = new Map();
  const byId = new Map(gears.map((g) => [g.id, g]));
  const adjMesh = new Map(gears.map((g) => [g.id, []]));
  for (const [a, b] of meshPairs) {
    adjMesh.get(a).push(b);
    adjMesh.get(b).push(a);
  }
  const overlapSet = new Set(overlapPairs.map(([a, b]) => (a < b ? `${a}|${b}` : `${b}|${a}`)));

  const layerConflicts = [];
  const components = [];

  for (const start of gears) {
    if (layers.has(start.id)) continue;
    const comp = [];
    const queue = [start.id];
    layers.set(start.id, 0);
    while (queue.length) {
      const id = queue.shift();
      comp.push(id);
      for (const nb of adjMesh.get(id)) {
        if (!layers.has(nb)) {
          layers.set(nb, layers.get(id)); // 啮合件同层
          queue.push(nb);
        }
      }
    }
    components.push(comp);
  }

  // 分量级约束着色：啮合件同分量；重叠分量必须异层。
  // 主动轮所在分量锚定第 0 层（视觉基准），其余分量按重叠约束贪心取最低可用层。
  const compOf = new Map();
  components.forEach((comp, ci) => comp.forEach((id) => compOf.set(id, ci)));
  const driverComp = driverId ? compOf.get(driverId) : 0;
  const compLayer = new Map();
  compLayer.set(driverComp ?? 0, 0);

  // 分量约束图（重叠边），多轮 BFS 着色，已着色邻居越少越先处理
  const remaining = new Set(components.map((_, ci) => ci));
  remaining.delete(driverComp ?? 0);
  while (remaining.size) {
    let pickCi = null;
    let bestColored = -1;
    for (const ci of remaining) {
      let colored = 0;
      for (const [a, b] of overlapPairs) {
        const ca = compOf.get(a);
        const cb = compOf.get(b);
        if ((ca === ci || cb === ci) && compLayer.has(ca === ci ? cb : ca)) colored++;
      }
      if (colored > bestColored) { bestColored = colored; pickCi = ci; }
    }
    if (pickCi === null) pickCi = remaining.values().next().value;

    const forbidden = new Set();
    for (const [a, b] of overlapPairs) {
      const ca = compOf.get(a);
      const cb = compOf.get(b);
      if (ca === pickCi && compLayer.has(cb)) forbidden.add(compLayer.get(cb));
      else if (cb === pickCi && compLayer.has(ca)) forbidden.add(compLayer.get(ca));
    }
    let layer = 0;
    while (forbidden.has(layer)) layer++;
    compLayer.set(pickCi, layer);
    remaining.delete(pickCi);
  }

  for (const [a, b] of overlapPairs) {
    const la = compLayer.get(compOf.get(a));
    const lb = compLayer.get(compOf.get(b));
    if (la === lb) {
      layerConflicts.push({ a, b, key: a < b ? `${a}|${b}` : `${b}|${a}` });
    }
  }

  // 写回每个齿轮
  for (const g of gears) layers.set(g.id, compLayer.get(compOf.get(g.id)) ?? 0);
  const maxLayer = Math.max(0, ...layers.values());
  return { layers, layerConflicts, maxLayer, overlapSet };
}

/* ---------- 全链重算 ---------- */

/**
 * 结构变更后一次性完成：啮合判定 → 分层 → 从主动轮 BFS 重算
 * 所有齿轮的基准相位、有符号转速比、方向与连接状态。
 * 纯函数，O(n²) 对数 + O(n) 传播。
 */
export function recompute(gears, driverId, prevSnapshot = null) {
  const meshPairs = [];
  const overlapPairs = [];
  const edges = [];
  const issues = [];

  for (let i = 0; i < gears.length; i++) {
    for (let j = i + 1; j < gears.length; j++) {
      const a = gears[i];
      const b = gears[j];
      const ev = evaluatePair(a, b);
      if (ev.state === 'mesh') {
        meshPairs.push([a.id, b.id]);
        edges.push({ a: a.id, b: b.id, ...ev });
      } else if (ev.state === 'overlap') {
        overlapPairs.push([a.id, b.id]);
        issues.push({
          level: 'error',
          type: 'overlap',
          ids: [a.id, b.id],
          msg: `${a.label} 与 ${b.label} 轴心重叠/穿插，请移开或删除其中一个`
        });
      } else if (ev.state === 'gap') {
        issues.push({
          level: 'warn',
          type: 'gap',
          ids: [a.id, b.id],
          msg: `${a.label} 与 ${b.label} 间隙 ${ev.delta.toFixed(2)} 超过阈值 ±${MESH_TOL}，未啮合（靠近 ${Math.ceil(ev.delta / GRID)} 格可啮合）`
        });
      } else if (ev.state === 'tight') {
        issues.push({
          level: 'warn',
          type: 'tight',
          ids: [a.id, b.id],
          msg: `${a.label} 与 ${b.label} 中心距过紧（${(-ev.delta).toFixed(2)}），齿顶会干涉，请拉开 ${Math.ceil(-ev.delta / GRID)} 格`
        });
      }
    }
  }

  const { layers, layerConflicts, maxLayer, overlapSet } = assignLayers(gears, meshPairs, overlapPairs, driverId);
  for (const c of layerConflicts) {
    const ga = gears.find((g) => g.id === c.a);
    const gb = gears.find((g) => g.id === c.b);
    issues.push({
      level: 'error',
      type: 'layer',
      ids: [c.a, c.b],
      msg: `${ga?.label ?? c.a} 与 ${gb?.label ?? c.b} 几何重叠且无法分配独立层（最多 ${MAX_LAYERS} 层）`
    });
  }
  if (maxLayer >= MAX_LAYERS) {
    issues.push({
      level: 'warn',
      type: 'layer',
      ids: [],
      msg: `深度已达 ${maxLayer + 1} 层，超过建议的 ${MAX_LAYERS} 层，遮挡关系可能不直观`
    });
  }

  // 邻接表（仅啮合边）
  const adj = new Map(gears.map((g) => [g.id, []]));
  const edgeByPair = new Map();
  for (const e of edges) {
    adj.get(e.a).push(e.b);
    adj.get(e.b).push(e.a);
    edgeByPair.set(`${e.a}|${e.b}`, e);
    edgeByPair.set(`${e.b}|${e.a}`, e);
  }

  // BFS：基准相位 + 有符号转速比
  const baseAngles = new Map();
  const ratios = new Map();
  const direction = new Map();
  const connected = new Set();
  const byId = new Map(gears.map((g) => [g.id, g]));

  if (driverId && byId.has(driverId)) {
    baseAngles.set(driverId, 0); // 主动轮基准相位归零
    ratios.set(driverId, 1);
    direction.set(driverId, 1);
    connected.add(driverId);
    const queue = [driverId];
    while (queue.length) {
      const pid = queue.shift();
      const parent = byId.get(pid);
      for (const cid of adj.get(pid)) {
        if (connected.has(cid)) continue;
        const child = byId.get(cid);
        const e = edgeByPair.get(`${pid}|${cid}`);
        const beta = pid === e.a ? e.beta : e.beta + Math.PI;
        const { theta, invariant } = meshChildAngle(
          baseAngles.get(pid),
          parent.teeth,
          child.teeth,
          beta
        );
        e.invariant = invariant;
        baseAngles.set(cid, theta);
        const r = ratios.get(pid) * speedRatio(parent.teeth, child.teeth);
        ratios.set(cid, r);
        direction.set(cid, r >= 0 ? 1 : -1);
        connected.add(cid);
        queue.push(cid);
      }
    }
  }

  // 未接入传动链的齿轮
  for (const g of gears) {
    if (!connected.has(g.id)) {
      baseAngles.set(g.id, 0);
      ratios.set(g.id, 0);
      direction.set(g.id, 0);
      if (g.id !== driverId) {
        issues.push({
          level: 'info',
          type: 'disconnected',
          ids: [g.id],
          msg: `${g.label} 未接入以主动轮为起点的传动链，播放时保持静止`
        });
      }
    }
  }

  if (!driverId && gears.length) {
    issues.push({ level: 'warn', type: 'driver', ids: [], msg: '尚未指定主动轮（发条驱动轮）' });
  }

  return {
    edges,
    layers,
    baseAngles,
    ratios,
    direction,
    connected,
    issues,
    overlapSet
  };
}

/**
 * 播放帧角度：θ(t) = θ0 + ratio · driverTurns · 2π
 * ratio 已含外啮合符号，整链一次乘法完成，保证同帧同步。
 */
export function frameAngle(baseAngle, ratio, driverTurns) {
  return baseAngle + ratio * driverTurns * Math.PI * 2;
}
