/**
 * Domain model for apron ground-support sequencing.
 *
 * Times are integer **minutes** relative to the scenario start. Interpolation
 * happens on continuous minutes. Positions are meters on the apron plane:
 * +X east, +Z south, Y up. Every derived state is a pure function of `t`, so
 * scrubbing is deterministic and cheap (no accumulated simulation state).
 */

export type StandId = string

export type Vec2 = { x: number; z: number }

/** Every movable / labelled actor class in the scene. */
export type ActorKind =
  | 'aircraft'
  | 'fuelTruck'
  | 'bus'
  | 'baggageTractor'
  | 'baggageCart'
  | 'groundCrew'

export type VehicleKind = Extract<
  ActorKind,
  'fuelTruck' | 'bus' | 'baggageTractor' | 'baggageCart'
>

export type CrewRole =
  | '机务'
  | '加油'
  | '行李'
  | '摆渡'
  | '客舱'
  | '航食'
  | '清水'
  | '污水'
  | '牵引'
  | '监护'

/** Path control point. `hold` pauses (in minutes) at this waypoint. */
export interface PathNode {
  x: number
  z: number
  /** Dwell time at this node, in minutes. */
  hold?: number
}

/** A vehicle's task segment: a timed polyline belonging to one stand. */
export interface RouteSegment {
  /** Inclusive start minute. */
  start: number
  /** Inclusive end minute. */
  end: number
  /** Human-readable segment label ("靠机加油" etc.). */
  label?: string
  nodes: PathNode[]
}

export interface ActorSpec {
  id: string
  kind: ActorKind
  name: string
  /** Stand this actor belongs to. */
  stand: StandId
  /** Accent color used by the 3D model and the timeline chip. */
  color: string
  /** Ground crew job title; only for kind === 'groundCrew'. */
  role?: CrewRole
  /** Initial yaw in degrees, used when the actor never moves. */
  yaw?: number
  /** Fixed choreography heading in degrees; overrides path-derived yaw. */
  facing?: number
  /** Static position for non-moving actors (crew posts, parked aircraft). */
  anchor?: Vec2
  /** Sequential task segments. Empty for static actors. */
  segments?: RouteSegment[]
}

export interface StandSpec {
  id: StandId
  /** Display name, e.g. "A12". */
  label: string
  /** Stand origin on the apron plane. */
  origin: Vec2
  /** Yaw of the stand's nose-in axis in degrees (0 = aircraft faces +Z). */
  heading: number
  aircraftType: string
  aircraftLength: number
  aircraftWingspan: number
  /** Flight number displayed on the stand placard. */
  flight: string
}

export interface ScenarioMeta {
  name: string
  /** Absolute wall-clock start, ISO 8601. */
  startsAt: string
  /** Total duration in minutes; the timeline spans [0, duration]. */
  duration: number
}

export interface Scenario {
  version: 1
  meta: ScenarioMeta
  stands: StandSpec[]
  actors: ActorSpec[]
}

/* ------------------------------------------------------------------ */
/* Scalar helpers                                                      */
/* ------------------------------------------------------------------ */

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const smoothstep = (t: number): number => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

const TAU = Math.PI * 2

/** Shortest-arc angle interpolation in radians. */
export function angleLerp(a: number, b: number, t: number): number {
  let d = (b - a) % TAU
  if (d > Math.PI) d -= TAU
  if (d < -Math.PI) d += TAU
  return a + d * t
}

export function deg2rad(d: number): number {
  return (d * Math.PI) / 180
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** Heading (yaw around +Y) that points an object's +Z axis from a to b. */
export function headingTo(a: Vec2, b: Vec2): number {
  return Math.atan2(b.x - a.x, b.z - a.z)
}

/** Cumulative arc length at each node of a polyline. */
export function pathMetrics(nodes: PathNode[]): { cum: number[]; total: number } {
  const cum: number[] = [0]
  let total = 0
  for (let i = 1; i < nodes.length; i++) {
    total += Math.hypot(nodes[i].x - nodes[i - 1].x, nodes[i].z - nodes[i - 1].z)
    cum.push(total)
  }
  return { cum, total }
}

/* ------------------------------------------------------------------ */
/* Segment schedule: the heart of the scrubbing engine                 */
/* ------------------------------------------------------------------ */

interface LegSlot {
  /** Minutes when travel along this leg starts / ends. */
  t0: number
  t1: number
  from: PathNode
  to: PathNode
  heading: number
}

interface HoldSlot {
  t0: number
  t1: number
  node: PathNode
  heading: number
}

export interface SegmentSchedule {
  start: number
  end: number
  legs: LegSlot[]
  holds: HoldSlot[]
}

/** One entry of the unified timeline: either a travel leg or a dwell. */
interface Slot {
  kind: 'leg' | 'hold'
  t0: number
  t1: number
  /** Heading the object points along at the start of the slot. */
  heading: number
  from?: PathNode
  to?: PathNode
  node?: PathNode
}

interface ExtendedSchedule extends SegmentSchedule {
  /** Legs and holds merged, ordered by start time. */
  slots: Slot[]
}

const scheduleCache = new WeakMap<RouteSegment, ExtendedSchedule>()

/**
 * Turn a route segment into a timetable. Holds consume their stated minutes;
 * the remainder is split across legs proportional to arc length, so the route
 * always ends exactly at `seg.end`. If holds overrun the window they are
 * scaled down proportionally (keeps the end time honest for scrubbing).
 *
 * Holds between two legs take the arrival heading as their nominal heading and
 * let `sampleSegment` ease into/out of the neighbours; a hold at a route end
 * inherits the adjacent leg's heading so it never spins on the spot.
 */
export function buildSegmentSchedule(seg: RouteSegment): SegmentSchedule {
  return buildExtendedSchedule(seg)
}

function buildExtendedSchedule(seg: RouteSegment): ExtendedSchedule {
  const cached = scheduleCache.get(seg)
  if (cached) return cached

  const nodes = seg.nodes
  const start = seg.start
  const end = seg.end
  const span = Math.max(end - start, 0)

  if (nodes.length === 0) {
    const empty: ExtendedSchedule = { start, end, legs: [], holds: [], slots: [] }
    scheduleCache.set(seg, empty)
    return empty
  }

  const { cum, total } = pathMetrics(nodes)
  const holdsRaw = nodes.reduce((acc, n) => acc + Math.max(n.hold ?? 0, 0), 0)
  const holdsTotal = holdsRaw > span && holdsRaw > 0 ? span : holdsRaw
  const holdScale = holdsRaw > 0 ? holdsTotal / holdsRaw : 0
  const travelBudget = Math.max(span - holdsTotal, 0)

  const isDwellOnly = total <= 1e-6
  // With no distance at all, the "travel" budget is meaningless: treat the
  // whole window as a hold at the single location.
  const legs: LegSlot[] = []
  const holds: HoldSlot[] = []
  const slots: Slot[] = []
  let cursor = start

  const legHeading = (i: number): number => {
    if (nodes.length < 2) return 0
    const a = nodes[Math.min(Math.max(i, 0), nodes.length - 2)]
    const b = nodes[Math.min(Math.max(i + 1, 0), nodes.length - 1)]
    return headingTo(a, b)
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const holdDur = isDwellOnly && i === 0 ? span : Math.max(node.hold ?? 0, 0) * holdScale
    if (holdDur > 0) {
      const isLast = i === nodes.length - 1
      // Between legs, the object sits facing where it will depart; at the tail
      // it keeps facing the way it arrived.
      const heading = !isLast && nodes.length > 1 ? legHeading(i) : legHeading(Math.max(i - 1, 0))
      const hold: HoldSlot = { t0: cursor, t1: cursor + holdDur, node, heading }
      holds.push(hold)
      slots.push({ kind: 'hold', t0: hold.t0, t1: hold.t1, heading, node })
      cursor += holdDur
    }
    if (i === nodes.length - 1) break

    const legLen = cum[i + 1] - cum[i]
    const share = total > 0 ? legLen / total : 0
    const legDur = travelBudget * share
    if (legDur > 0) {
      const heading = legHeading(i)
      const leg: LegSlot = {
        t0: cursor,
        t1: cursor + legDur,
        from: node,
        to: nodes[i + 1],
        heading,
      }
      legs.push(leg)
      slots.push({
        kind: 'leg',
        t0: leg.t0,
        t1: leg.t1,
        heading,
        from: node,
        to: nodes[i + 1],
      })
      cursor += legDur
    }
  }

  const sched: ExtendedSchedule = { start, end, legs, holds, slots }
  scheduleCache.set(seg, sched)
  return sched
}

export interface SegmentSample {
  x: number
  z: number
  yaw: number
  /** 0..1 through the segment. */
  u: number
}

/**
 * Sample a route segment at absolute minute `t`.
 *
 * Yaw is aligned to the direction of travel and eased toward the *next* slot's
 * heading over the last third of each leg or hold, so a vehicle visibly turns
 * through a corner instead of snapping. Because every slot looks ahead to its
 * successor, arrival and departure yaw agree at every boundary and the heading
 * stays continuous across legs, holds and 180° turnarounds.
 */
export function sampleSegment(seg: RouteSegment, t: number): SegmentSample | null {
  if (t < seg.start || t > seg.end) return null
  const sched = buildExtendedSchedule(seg)
  const span = Math.max(seg.end - seg.start, 1e-9)
  const u = clamp((t - seg.start) / span, 0, 1)
  const { slots } = sched

  if (slots.length === 0) {
    return { x: seg.nodes[0]?.x ?? 0, z: seg.nodes[0]?.z ?? 0, yaw: 0, u }
  }

  /** Heading at progress f∈[0,1] through slot i, eased toward slot i+1. */
  const headingAt = (i: number, f: number): number => {
    const slot = slots[i]
    const next = slots[i + 1]
    if (!next) return slot.heading
    const blend = smoothstep((f - 0.62) / 0.38)
    return blend > 0 ? angleLerp(slot.heading, next.heading, blend) : slot.heading
  }

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    if (t <= slot.t1) {
      const f = slot.t1 > slot.t0 ? clamp((t - slot.t0) / (slot.t1 - slot.t0), 0, 1) : 1
      const yaw = headingAt(i, f)
      if (slot.kind === 'leg' && slot.from && slot.to) {
        return {
          x: lerp(slot.from.x, slot.to.x, f),
          z: lerp(slot.from.z, slot.to.z, f),
          yaw,
          u,
        }
      }
      const node = slot.node ?? slot.from ?? { x: 0, z: 0 }
      return { x: node.x, z: node.z, yaw, u }
    }
  }

  // After the final slot: rest at its end pose.
  const last = slots[slots.length - 1]
  const node = last.kind === 'leg' ? (last.to ?? last.from ?? { x: 0, z: 0 }) : (last.node ?? { x: 0, z: 0 })
  return { x: node.x, z: node.z, yaw: last.heading, u: 1 }
}

/* ------------------------------------------------------------------ */
/* Actor sampling                                                      */
/* ------------------------------------------------------------------ */

export interface SegmentWindow {
  start: number
  end: number
  label: string
}

export interface ActorPose {
  x: number
  z: number
  /** Yaw in radians, +Z forward convention. */
  yaw: number
  /** 0..1 fraction of the current task segment. */
  progress: number
  /** Whether the actor is mid-task at the requested time. */
  active: boolean
  /** Index of the segment owning this time, or -1 before the first task. */
  segmentIndex: number
  /** Whether the actor is visible at all (crew only works its shift). */
  visible: boolean
  /** Whether the actor is currently parked (between legs or idle). */
  parked: boolean
}

export function actorWindows(actor: ActorSpec): SegmentWindow[] {
  return (actor.segments ?? []).map((s, i) => ({
    start: s.start,
    end: s.end,
    label: s.label ?? `任务段 ${i + 1}`,
  }))
}

export function totalWindow(actor: ActorSpec): { start: number; end: number } | null {
  const segs = actor.segments ?? []
  if (segs.length === 0) return null
  let start = Infinity
  let end = -Infinity
  for (const s of segs) {
    if (s.start < start) start = s.start
    if (s.end > end) end = s.end
  }
  return { start, end }
}

/** Index of the segment containing `t`, or the last finished one, or -1. */
export function currentSegmentIndex(actor: ActorSpec, t: number): number {
  const segs = actor.segments ?? []
  let best = -1
  for (let i = 0; i < segs.length; i++) {
    if (t >= segs[i].start && t <= segs[i].end) return i
    if (t > segs[i].end) best = i
  }
  return best
}

/**
 * Full pose of an actor at minute `t`.
 *
 * Outside all segments the actor rests: at its staging node before the first
 * task, or at the end of the last finished task afterwards.
 */
export function sampleActor(actor: ActorSpec, t: number): ActorPose {
  const segs = actor.segments ?? []

  if (segs.length === 0) {
    const anchor = actor.anchor ?? { x: 0, z: 0 }
    return {
      x: anchor.x,
      z: anchor.z,
      yaw: deg2rad(actor.yaw ?? 0),
      progress: 0,
      active: false,
      segmentIndex: -1,
      visible: true,
      parked: true,
    }
  }

  const idx = currentSegmentIndex(actor, t)
  const win = totalWindow(actor)!

  /** Choreography override: yaw is pinned, position still follows the route. */
  const pinYaw = (sample: SegmentSample): SegmentSample =>
    actor.facing === undefined ? sample : { ...sample, yaw: deg2rad(actor.facing) }

  let sample: SegmentSample | null = null
  let active = false
  if (idx >= 0) {
    const seg = segs[idx]
    active = t >= seg.start && t <= seg.end
    sample = sampleSegment(seg, clamp(t, seg.start, seg.end))
  }

  if (!sample) {
    const first = segs[0]
    const n0 = first.nodes[0] ?? { x: 0, z: 0 }
    const n1 = first.nodes[1] ?? n0
    sample = pinYaw({ x: n0.x, z: n0.z, yaw: headingTo(n0, n1), u: 0 })
    return {
      x: sample.x,
      z: sample.z,
      yaw: sample.yaw,
      progress: 0,
      active: false,
      segmentIndex: -1,
      visible: actor.kind === 'groundCrew' ? t >= win.start - 3 : true,
      parked: true,
    }
  }

  sample = pinYaw(sample)

  const seg = idx >= 0 ? segs[idx] : segs[segs.length - 1]
  const span = Math.max(seg.end - seg.start, 1e-9)
  const progress = active ? clamp((t - seg.start) / span, 0, 1) : t > seg.end ? 1 : 0
  const sched = buildSegmentSchedule(seg)
  const inHold = sched.holds.some((h) => t >= h.t0 && t <= h.t1)
  const parked = !active || inHold || sched.legs.length === 0

  /**
   * Between task segments the vehicle is parked, but the next segment may
   * approach from another angle: rotating instantly at the seam looks like a
   * teleport. Ease the heading from the finished segment's final yaw to the
   * next segment's opening yaw across the idle gap.
   */
  let yaw = sample.yaw
  if (!active && idx + 1 < segs.length) {
    const next = segs[idx + 1]
    const gap = next.start - segs[idx].end
    if (gap > 1e-6) {
      const nextStart = sampleSegment(next, next.start)
      if (nextStart) {
        const f = smoothstep(clamp((t - segs[idx].end) / gap, 0, 1))
        yaw = angleLerp(yaw, pinYaw(nextStart).yaw, f)
      }
    }
  }

  return {
    x: sample.x,
    z: sample.z,
    yaw,
    progress,
    active,
    segmentIndex: idx,
    visible:
      actor.kind === 'groundCrew' ? t >= win.start - 3 && t <= win.end + 3 : true,
    parked,
  }
}
/* ------------------------------------------------------------------ */
/* Deterministic PRNG (stable draft scenarios across reloads)          */
/* ------------------------------------------------------------------ */

export function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let x = s
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}
