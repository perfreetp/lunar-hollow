// 路径求解：栅格膨胀 + A* + 视线拉直 + 转弯圆弧拟合
import type { Plan, Pt, WheelchairParams } from './types'
import { colliderSegments, planColliders, type Seg } from './geometry'

const CELL = 0.1

interface Grid {
  ox: number
  oz: number
  w: number
  h: number
  blocked: Uint8Array
}

// ---- 线段空间哈希，用于快速净距查询 ----
export class SegIndex {
  private buckets = new Map<string, Seg[]>()
  private cell = 2
  constructor(private segs: Seg[]) {
    segs.forEach((s, i) => {
      const minX = Math.floor(Math.min(s.x1, s.x2) / this.cell)
      const maxX = Math.floor(Math.max(s.x1, s.x2) / this.cell)
      const minZ = Math.floor(Math.min(s.z1, s.z2) / this.cell)
      const maxZ = Math.floor(Math.max(s.z1, s.z2) / this.cell)
      for (let gx = minX; gx <= maxX; gx++)
        for (let gz = minZ; gz <= maxZ; gz++) {
          const k = gx + ',' + gz
          let arr = this.buckets.get(k)
          if (!arr) this.buckets.set(k, (arr = []))
          arr.push(this.segs[i])
        }
    })
  }
  /** 点到所有线段的最近距离（超过 maxDist 可提前返回） */
  dist(x: number, z: number, maxDist = 3): number {
    const gx = Math.floor(x / this.cell)
    const gz = Math.floor(z / this.cell)
    const r = Math.ceil(maxDist / this.cell)
    let best = maxDist
    for (let ix = gx - r; ix <= gx + r; ix++)
      for (let iz = gz - r; iz <= gz + r; iz++) {
        const arr = this.buckets.get(ix + ',' + iz)
        if (!arr) continue
        for (const s of arr) {
          const d = segDist(x, z, s)
          if (d < best) best = d
        }
      }
    return best
  }
}

function segDist(px: number, pz: number, s: Seg): number {
  const dx = s.x2 - s.x1
  const dz = s.z2 - s.z1
  const l2 = dx * dx + dz * dz
  let t = l2 > 0 ? ((px - s.x1) * dx + (pz - s.z1) * dz) / l2 : 0
  t = Math.max(0, Math.min(1, t))
  const cx = s.x1 + t * dx
  const cz = s.z1 + t * dz
  return Math.hypot(px - cx, pz - cz)
}

function buildGrid(plan: Plan, segs: Seg[], inflate: number): Grid {
  const { x1, z1, x2, z2 } = plan.bounds
  const ox = x1 - 1
  const oz = z1 - 1
  const w = Math.ceil((x2 - x1 + 2) / CELL)
  const h = Math.ceil((z2 - z1 + 2) / CELL)
  const blocked = new Uint8Array(w * h)
  const r = inflate
  const rc = Math.ceil(r / CELL)
  for (const s of segs) {
    const minGX = Math.max(0, Math.floor((Math.min(s.x1, s.x2) - r - ox) / CELL))
    const maxGX = Math.min(w - 1, Math.ceil((Math.max(s.x1, s.x2) + r - ox) / CELL))
    const minGZ = Math.max(0, Math.floor((Math.min(s.z1, s.z2) - r - oz) / CELL))
    const maxGZ = Math.min(h - 1, Math.ceil((Math.max(s.z1, s.z2) + r - oz) / CELL))
    for (let gz = minGZ; gz <= maxGZ; gz++)
      for (let gx = minGX; gx <= maxGX; gx++) {
        const idx = gz * w + gx
        if (blocked[idx]) continue
        if (segDist(ox + gx * CELL, oz + gz * CELL, s) < r) blocked[idx] = 1
      }
  }
  void rc
  return { ox, oz, w, h, blocked }
}

// ---- A*（二叉堆） ----
function astar(grid: Grid, sx: number, sz: number, ex: number, ez: number): Pt[] | null {
  const { w, h, blocked, ox, oz } = grid
  const toCell = (x: number, z: number): [number, number] => [
    Math.round((x - ox) / CELL),
    Math.round((z - oz) / CELL),
  ]
  let [scx, scz] = toCell(sx, sz)
  let [ecx, ecz] = toCell(ex, ez)
  const clamp = (v: number, m: number) => Math.max(0, Math.min(m - 1, v))
  scx = clamp(scx, w); scz = clamp(scz, h); ecx = clamp(ecx, w); ecz = clamp(ecz, h)
  // 起终点落在障碍上时，向外螺旋找最近自由格
  const free = (cx: number, cz: number): [number, number] => {
    if (!blocked[cz * w + cx]) return [cx, cz]
    for (let r = 1; r < 40; r++)
      for (let dz = -r; dz <= r; dz++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue
          const nx = cx + dx
          const nz = cz + dz
          if (nx >= 0 && nx < w && nz >= 0 && nz < h && !blocked[nz * w + nx]) return [nx, nz]
        }
    return [cx, cz]
  }
  ;[scx, scz] = free(scx, scz)
  ;[ecx, ecz] = free(ecx, ecz)

  const start = scz * w + scx
  const goal = ecz * w + ecx
  const g = new Float32Array(w * h).fill(Infinity)
  const parent = new Int32Array(w * h).fill(-1)
  const closed = new Uint8Array(w * h)
  g[start] = 0
  // 堆：[f, idx]
  const heapF: number[] = []
  const heapI: number[] = []
  const push = (f: number, i: number) => {
    heapF.push(f); heapI.push(i)
    let c = heapF.length - 1
    while (c > 0) {
      const p = (c - 1) >> 1
      if (heapF[p] <= heapF[c]) break
      ;[heapF[p], heapF[c]] = [heapF[c], heapF[p]]
      ;[heapI[p], heapI[c]] = [heapI[c], heapI[p]]
      c = p
    }
  }
  const pop = (): number => {
    const top = heapI[0]
    const lastF = heapF.pop()!
    const lastI = heapI.pop()!
    if (heapF.length) {
      heapF[0] = lastF; heapI[0] = lastI
      let c = 0
      for (;;) {
        let m = c
        const l = 2 * c + 1
        const r = l + 1
        if (l < heapF.length && heapF[l] < heapF[m]) m = l
        if (r < heapF.length && heapF[r] < heapF[m]) m = r
        if (m === c) break
        ;[heapF[m], heapF[c]] = [heapF[c], heapF[m]]
        ;[heapI[m], heapI[c]] = [heapI[c], heapI[m]]
        c = m
      }
    }
    return top
  }
  const hx = (i: number) => {
    const dx = Math.abs((i % w) - ecx)
    const dz = Math.abs(((i / w) | 0) - ecz)
    return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz)
  }
  push(hx(start), start)
  const DIRS = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
  ]
  while (heapF.length) {
    const cur = pop()
    if (cur === goal) {
      const pts: Pt[] = []
      let i = cur
      while (i !== -1) {
        pts.push({ x: ox + (i % w) * CELL, z: oz + ((i / w) | 0) * CELL })
        i = parent[i]
      }
      pts.reverse()
      pts[0] = { x: sx, z: sz }
      pts[pts.length - 1] = { x: ex, z: ez }
      return pts
    }
    if (closed[cur]) continue
    closed[cur] = 1
    const cx = cur % w
    const cz = (cur / w) | 0
    for (const [dx, dz, cost] of DIRS) {
      const nx = cx + dx
      const nz = cz + dz
      if (nx < 0 || nx >= w || nz < 0 || nz >= h) continue
      const ni = nz * w + nx
      if (blocked[ni] || closed[ni]) continue
      // 禁止穿对角
      if (dx !== 0 && dz !== 0 && (blocked[cz * w + nx] || blocked[nz * w + cx])) continue
      const ng = g[cur] + cost
      if (ng < g[ni]) {
        g[ni] = ng
        parent[ni] = cur
        push(ng + hx(ni), ni)
      }
    }
  }
  return null
}

// ---- 视线拉直（净距随位置自适应：门洞附近用基本净距，其余留转弯余量） ----
type ClearFn = (p: Pt) => number

function losClear(idx: SegIndex, a: Pt, b: Pt, clearAt: ClearFn): boolean {
  const len = Math.hypot(b.x - a.x, b.z - a.z)
  const n = Math.max(1, Math.ceil(len / 0.1))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
    if (idx.dist(p.x, p.z, clearAt(p)) < clearAt(p)) return false
  }
  return true
}

function smooth(pts: Pt[], idx: SegIndex, clearAt: ClearFn): Pt[] {
  if (pts.length <= 2) return pts
  const out: Pt[] = [pts[0]]
  let i = 0
  while (i < pts.length - 1) {
    let j = pts.length - 1
    while (j > i + 1 && !losClear(idx, pts[i], pts[j], clearAt)) j--
    out.push(pts[j])
    i = j
  }
  return out
}

// ---- 坡道侧缘虚拟路缘：防止路径从坡道侧面翻越（侧缘跌落是真实隐患） ----
function rampEdgeSegments(plan: Plan): Seg[] {
  const segs: Seg[] = []
  for (const r of plan.ramps) {
    const nx = -r.dirZ
    const nz = r.dirX // 横向
    const ex = (r.dirX * r.length) / 2
    const ez = (r.dirZ * r.length) / 2
    for (const sgn of [1, -1]) {
      const ox = nx * (r.width / 2) * sgn
      const oz = nz * (r.width / 2) * sgn
      segs.push({
        x1: r.cx - ex + ox,
        z1: r.cz - ez + oz,
        x2: r.cx + ex + ox,
        z2: r.cz + ez + oz,
      })
    }
  }
  return segs
}

// ---- 门洞正交穿越点：保证路径垂直穿过门洞，净宽测量才准确 ----
interface Pin {
  rawIndex: number // 穿越发生在 raw[rawIndex-1] -> raw[rawIndex] 之间
  pinIn: Pt
  pinOut: Pt
}

function findDoorPins(plan: Plan, raw: Pt[]): Pin[] {
  const pins: Pin[] = []
  for (const d of plan.doors) {
    const w = plan.walls.find((x) => x.id === d.wallId)
    if (!w) continue
    const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1)
    const ux = (w.x2 - w.x1) / len
    const uz = (w.z2 - w.z1) / len
    const cx = w.x1 + ux * d.offset
    const cz = w.z1 + uz * d.offset
    const nx = -uz
    const nz = ux // 墙法向
    for (let i = 1; i < raw.length; i++) {
      const a = raw[i - 1]
      const b = raw[i]
      // 线段 a->b 与门洞中心线（过 c 沿 û）求交
      const dx = b.x - a.x
      const dz = b.z - a.z
      const denom = dx * uz - dz * ux
      if (Math.abs(denom) < 1e-9) continue
      const t = ((cx - a.x) * uz - (cz - a.z) * ux) / denom
      if (t < 0 || t > 1) continue
      const s = (a.x + dx * t - cx) * ux + (a.z + dz * t - cz) * uz
      if (Math.abs(s) > d.width / 2) continue
      // 法向取穿越方向（用穿越段矢量判断，避免端点恰好落在墙中线上时符号为零）
      const side = Math.sign((b.x - a.x) * nx + (b.z - a.z) * nz) || 1
      pins.push({
        rawIndex: i,
        pinIn: { x: cx - nx * side * 0.75, z: cz - nz * side * 0.75 },
        pinOut: { x: cx + nx * side * 0.75, z: cz + nz * side * 0.75 },
      })
      break // 每扇门只取第一次穿越
    }
  }
  pins.sort((p, q) => p.rawIndex - q.rawIndex)
  return pins
}

/** 按门洞穿越点把 raw 分段，段内视线拉直，段间强制正交穿门。返回路径与门点集合 */
function smoothWithPins(raw: Pt[], pins: Pin[], idx: SegIndex, clearAt: ClearFn): { pts: Pt[]; pinSet: Set<Pt> } {
  const pinSet = new Set<Pt>()
  if (pins.length === 0) return { pts: smooth(raw, idx, clearAt), pinSet }
  const out: Pt[] = []
  let prev = 0
  for (const pin of pins) {
    pinSet.add(pin.pinIn).add(pin.pinOut)
    const chunk = raw.slice(prev, pin.rawIndex)
    if (out.length) chunk[0] = out[out.length - 1] // 上一段的 pinOut
    chunk.push(pin.pinIn)
    const sm = smooth(chunk, idx, clearAt)
    for (let i = out.length ? 1 : 0; i < sm.length; i++) out.push(sm[i])
    out.push(pin.pinOut)
    prev = pin.rawIndex
  }
  const tail = raw.slice(prev)
  if (out.length) tail[0] = out[out.length - 1]
  const sm = smooth(tail, idx, clearAt)
  for (let i = out.length ? 1 : 0; i < sm.length; i++) out.push(sm[i])
  return { pts: out, pinSet }
}

/** 清理过近与近共线的角点（保留门穿越点），为转弯圆弧留出腿长 */
function simplify(pts: Pt[], keep: Set<Pt>, idx: SegIndex, clearAt: ClearFn): Pt[] {
  if (pts.length < 3) return pts
  const out: Pt[] = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]
    if (keep.has(p)) {
      out.push(p)
      continue
    }
    const prev = out[out.length - 1]
    const next = pts[i + 1]
    const d = Math.hypot(p.x - prev.x, p.z - prev.z)
    if (d < 0.6 && losClear(idx, prev, next, clearAt)) continue
    const l2 = Math.hypot(next.x - p.x, next.z - p.z)
    if (d > 1e-6 && l2 > 1e-6) {
      const dot = ((p.x - prev.x) * (next.x - p.x) + (p.z - prev.z) * (next.z - p.z)) / (d * l2)
      if (dot > Math.cos(0.12) && losClear(idx, prev, next, clearAt)) continue
    }
    out.push(p)
  }
  out.push(pts[pts.length - 1])
  return out
}

/** 角点聚类：间距过近的连续角点（绕同一凸角的 S 形摆动）合并为质心角点，为转弯圆弧腾出腿长 */
function clusterCorners(pts: Pt[], keep: Set<Pt>, idx: SegIndex, clearAt: ClearFn): Pt[] {
  if (pts.length < 3) return pts
  const out: Pt[] = [pts[0]]
  let i = 1
  while (i < pts.length - 1) {
    if (keep.has(pts[i])) {
      out.push(pts[i])
      i++
      continue
    }
    const cluster: Pt[] = []
    let j = i
    while (
      j < pts.length - 1 &&
      !keep.has(pts[j]) &&
      (cluster.length === 0 ||
        (Math.hypot(pts[j].x - cluster[cluster.length - 1].x, pts[j].z - cluster[cluster.length - 1].z) < 1.2 &&
          Math.hypot(pts[j].x - cluster[0].x, pts[j].z - cluster[0].z) < 2.0))
    ) {
      cluster.push(pts[j])
      j++
    }
    if (cluster.length === 1) {
      out.push(cluster[0])
      i = j
      continue
    }
    const c = {
      x: cluster.reduce((s, p) => s + p.x, 0) / cluster.length,
      z: cluster.reduce((s, p) => s + p.z, 0) / cluster.length,
    }
    const prev = out[out.length - 1]
    const next = pts[j]
    // 候选位置：质心 + 沿整体外角平分线外移（凸角旁质心可能贴障碍物太近）
    const u1 = norm(cluster[0].x - prev.x, cluster[0].z - prev.z)
    const u2 = norm(next.x - cluster[cluster.length - 1].x, next.z - cluster[cluster.length - 1].z)
    const bl = Math.hypot(u1.x - u2.x, u1.z - u2.z) || 1
    const B = { x: (u1.x - u2.x) / bl, z: (u1.z - u2.z) / bl }
    let merged: Pt | null = null
    for (const shift of [0, 0.4, 0.8, 1.2, 1.6]) {
      const vv = shift === 0 ? c : { x: c.x + B.x * shift, z: c.z + B.z * shift }
      if (losClear(idx, prev, vv, clearAt) && losClear(idx, vv, next, clearAt)) {
        merged = vv
        break
      }
    }
    if (merged) out.push(merged)
    else out.push(...cluster)
    i = j
  }
  out.push(pts[pts.length - 1])
  return out
}

// ---- 转弯圆弧拟合 ----
export interface TurnIssue {
  x: number
  z: number
  radius: number
}

/** 点是否位于坡道侧缘外的跌落危险区（侧缘高度 > 0.03m 时不可穿越） */
function nearRampCliff(plan: Plan, p: Pt): boolean {
  for (const r of plan.ramps) {
    const dx = p.x - r.cx
    const dz = p.z - r.cz
    const u = dx * r.dirX + dz * r.dirZ
    const v = -dx * r.dirZ + dz * r.dirX
    const av = Math.abs(v)
    if (av > r.width / 2 && av < r.width / 2 + 0.6 && Math.abs(u) <= r.length / 2) {
      const h = ((u + r.length / 2) / r.length) * r.rise
      if (h > 0.03) return true
    }
  }
  return false
}

function fillet(
  pts: Pt[],
  idxFull: SegIndex, // 墙 + 虚拟路缘：腿净距检查
  idxWalls: SegIndex, // 仅真实墙体：圆弧检查（坡道口平地允许越过虚拟路缘）
  plan: Plan,
  clearance: number,
  radius: number,
  issues: TurnIssue[],
  exempt: Pt[] = []
): Pt[] {
  if (pts.length < 3) return pts
  const out: Pt[] = [pts[0]]
  const baseClear = () => clearance

  /** 在角点 vv 处尝试放置半径 r 的圆弧，成功返回圆弧点列 */
  const tryArc = (prev: Pt, vv: Pt, next: Pt, u1: Pt, u2: Pt, deflect: number, r: number): Pt[] | null => {
    const l1 = Math.hypot(vv.x - prev.x, vv.z - prev.z)
    const l2 = Math.hypot(next.x - vv.x, next.z - vv.z)
    const t = r * Math.tan(deflect / 2)
    if (t > l1 * 0.9 || t > l2 * 0.9) return null
    const p1 = { x: vv.x - u1.x * t, z: vv.z - u1.z * t }
    const p2 = { x: vv.x + u2.x * t, z: vv.z + u2.z * t }
    const n1 = { x: -u1.z, z: u1.x }
    const cA = { x: p1.x + n1.x * r, z: p1.z + n1.z * r }
    const cB = { x: p1.x - n1.x * r, z: p1.z - n1.z * r }
    const c = dist2(cA, p2) < dist2(cB, p2) ? cA : cB
    const a1 = Math.atan2(p1.z - c.z, p1.x - c.x)
    const a2 = Math.atan2(p2.z - c.z, p2.x - c.x)
    let da = a2 - a1
    while (da > Math.PI) da -= 2 * Math.PI
    while (da < -Math.PI) da += 2 * Math.PI
    const steps = Math.max(3, Math.ceil(Math.abs(da) / 0.15))
    const arc: Pt[] = []
    for (let k = 0; k <= steps; k++) {
      const a = a1 + (da * k) / steps
      const p = { x: c.x + r * Math.cos(a), z: c.z + r * Math.sin(a) }
      if (idxWalls.dist(p.x, p.z, clearance) < clearance || nearRampCliff(plan, p)) return null
      arc.push(p)
    }
    return arc
  }

  /** 在候选角点（原点 + 外移）中寻找可放下半径 radii 之一圆弧的方案 */
  const attempt = (prev: Pt, v: Pt, next: Pt, radii: number[]): Pt[] | null => {
    const u1o = norm(v.x - prev.x, v.z - prev.z)
    const u2o = norm(next.x - v.x, next.z - v.z)
    const bl = Math.hypot(u1o.x - u2o.x, u1o.z - u2o.z) || 1
    const B = { x: (u1o.x - u2o.x) / bl, z: (u1o.z - u2o.z) / bl } // 外角平分线（向开阔处）
    for (const shift of [0, 0.3, 0.6, 0.9, 1.2, 1.6]) {
      const vv = shift === 0 ? v : { x: v.x + B.x * shift, z: v.z + B.z * shift }
      const u1 = norm(vv.x - prev.x, vv.z - prev.z)
      const u2 = norm(next.x - vv.x, next.z - vv.z)
      const dot = Math.max(-1, Math.min(1, u1.x * u2.x + u1.z * u2.z))
      const deflect = Math.acos(dot) // 转向角：直行为 0，90° 转弯为 π/2
      if (deflect < 0.12) continue
      if (shift > 0) {
        // 外移后的两条腿都要满足净距
        if (!losClear(idxFull, prev, vv, baseClear) || !losClear(idxFull, vv, next, baseClear)) continue
      }
      for (const r of radii) {
        const arc = tryArc(prev, vv, next, u1, u2, deflect, r)
        if (arc) return arc
      }
    }
    return null
  }

  for (let i = 1; i < pts.length - 1; i++) {
    const v = pts[i]
    const next = pts[i + 1]
    // 门洞穿越段附近不做圆弧拟合（正交穿门段保持直线）
    if (exempt.some((e) => dist2(e, v) < 1.44)) {
      out.push(v)
      continue
    }
    const prev = out[out.length - 1]
    // 第一轮：尝试满足最小转弯半径的圆弧
    let arc = attempt(prev, v, next, [radius])
    if (!arc) {
      // 第二轮：放不下则说明此处转弯半径不足，记录卡点；改放较小圆弧保持路径可跟随
      const u1 = norm(v.x - prev.x, v.z - prev.z)
      const u2 = norm(next.x - v.x, next.z - v.z)
      const dot = Math.max(-1, Math.min(1, u1.x * u2.x + u1.z * u2.z))
      if (Math.acos(dot) >= 0.12) issues.push({ x: v.x, z: v.z, radius })
      arc = attempt(prev, v, next, [radius * 0.7, radius * 0.5, 0.3])
    }
    if (arc) for (const p of arc) out.push(p)
    else out.push(v)
  }
  out.push(pts[pts.length - 1])
  return out
}

function norm(x: number, z: number): Pt {
  const l = Math.hypot(x, z) || 1
  return { x: x / l, z: z / l }
}
function dist2(a: Pt, b: Pt): number {
  return (a.x - b.x) ** 2 + (a.z - b.z) ** 2
}

/** 按固定步长重采样 */
export function resample(pts: Pt[], step: number): Pt[] {
  if (pts.length < 2) return pts
  const out: Pt[] = [pts[0]]
  let carry = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const len = Math.hypot(b.x - a.x, b.z - a.z)
    let s = step - carry
    while (s <= len) {
      out.push({ x: a.x + ((b.x - a.x) * s) / len, z: a.z + ((b.z - a.z) * s) / len })
      s += step
    }
    carry = len - (s - step)
  }
  const last = pts[pts.length - 1]
  const tail = out[out.length - 1]
  if (Math.hypot(last.x - tail.x, last.z - tail.z) > 0.01) out.push(last)
  return out
}

export interface PathResult {
  /** 用于显示的平滑路径（含圆弧） */
  smooth: Pt[]
  /** 固定步长重采样点 */
  samples: Pt[]
  turnIssues: TurnIssue[]
}

export function findPath(plan: Plan, params: WheelchairParams, start: Pt, end: Pt): PathResult | null {
  const boxes = planColliders(plan)
  const wallSegs = colliderSegments(boxes)
  const segs = wallSegs.concat(rampEdgeSegments(plan))
  const idx = new SegIndex(segs)
  const idxWalls = new SegIndex(wallSegs) // 圆弧拟合只避真实墙体：坡道口平地上的转弯允许越过虚拟路缘
  const base = params.width / 2 + 0.02
  const grid = buildGrid(plan, segs, base)
  const raw = astar(grid, start.x, start.z, end.x, end.z)
  if (!raw) return null
  // 门中心：圆弧豁免区
  const doorCenters = plan.doors
    .map((d) => {
      const w = plan.walls.find((x) => x.id === d.wallId)
      if (!w) return null
      const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1)
      return { x: w.x1 + ((w.x2 - w.x1) / len) * d.offset, z: w.z1 + ((w.z2 - w.z1) / len) * d.offset }
    })
    .filter((p): p is Pt => p !== null)
  const baseClear = () => base
  const pins = findDoorPins(plan, raw)
  const { pts: smoothed, pinSet } = smoothWithPins(raw, pins, idx, baseClear)
  const simplified = simplify(smoothed, pinSet, idx, baseClear)
  const clustered = clusterCorners(simplified, pinSet, idx, baseClear)
  const issues: TurnIssue[] = []
  const filleted = fillet(clustered, idx, idxWalls, plan, base, params.turnRadius, issues, doorCenters)
  return { smooth: filleted, samples: resample(filleted, 0.25), turnIssues: issues }
}
