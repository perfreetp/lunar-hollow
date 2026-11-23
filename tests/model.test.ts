import { describe, expect, it } from 'vitest'
import {
  actorWindows,
  buildSegmentSchedule,
  currentSegmentIndex,
  makeRng,
  sampleActor,
  sampleSegment,
  totalWindow,
  type ActorSpec,
  type RouteSegment,
} from '../src/domain/model'
import { createDemoScenario } from '../src/domain/scenario'
import {
  buildExport,
  serializeExport,
  validateScenario,
  isVehicleKind,
} from '../src/domain/io'
import { formatClock, parseClock } from '../src/domain/clock'

describe('sampleSegment', () => {
  const seg: RouteSegment = {
    start: 10,
    end: 20,
    nodes: [
      { x: 0, z: 0 },
      { x: 10, z: 0, hold: 4 },
      { x: 10, z: 10 },
    ],
  }

  it('returns null outside the segment window', () => {
    expect(sampleSegment(seg, 9.99)).toBeNull()
    expect(sampleSegment(seg, 20.01)).toBeNull()
  })

  it('starts at the first node and ends at the last', () => {
    const a = sampleSegment(seg, 10)
    const b = sampleSegment(seg, 20)
    expect(a?.x).toBeCloseTo(0)
    expect(a?.z).toBeCloseTo(0)
    expect(b?.x).toBeCloseTo(10)
    expect(b?.z).toBeCloseTo(10)
  })

  it('honours the hold: position is constant through the dwell window', () => {
    const sched = buildSegmentSchedule(seg)
    const hold = sched.holds[0]
    expect(hold).toBeDefined()
    expect(hold.t1 - hold.t0).toBeCloseTo(4, 5)
    const mid = (hold.t0 + hold.t1) / 2
    const p = sampleSegment(seg, mid)
    expect(p?.x).toBeCloseTo(10)
    expect(p?.z).toBeCloseTo(0)
  })

  it('is deterministic and continuous (no jumps)', () => {
    let prev = sampleSegment(seg, 10)!
    for (let t = 10.05; t <= 20; t += 0.05) {
      const cur = sampleSegment(seg, t)!
      const jump = Math.hypot(cur.x - prev.x, cur.z - prev.z)
      // 10m leg spread across ~3 minutes → well under 0.5m per 0.05min.
      expect(jump).toBeLessThan(0.5)
      prev = cur
    }
  })

  it('aligns yaw with the direction of travel', () => {
    const p = sampleSegment(seg, 11)!
    // Moving +X with +Z forward convention → yaw = atan2(dx, dz) = PI/2.
    expect(p.yaw).toBeCloseTo(Math.PI / 2, 2)
  })

  it('degrades gracefully for a single-node (parked) segment', () => {
    const parked: RouteSegment = { start: 0, end: 30, nodes: [{ x: 5, z: 5 }] }
    for (const t of [0, 15, 30]) {
      const p = sampleSegment(parked, t)
      expect(p?.x).toBe(5)
      expect(p?.z).toBe(5)
    }
  })

  it('eases heading across a 180° turnaround hold instead of snapping', () => {
    // A monitor walking a line and turning round: two holds at opposite ends
    // with no measurable travel time between them.
    const turnaround: RouteSegment = {
      start: 0,
      end: 20,
      nodes: [
        { x: 0, z: 0, hold: 6 },
        { x: 0, z: 10, hold: 6 },
      ],
    }
    let prev = sampleSegment(turnaround, 0)!.yaw
    let maxStep = 0
    for (let t = 0.02; t <= 20; t += 0.02) {
      const yaw = sampleSegment(turnaround, t)!.yaw
      let d = Math.abs(yaw - prev)
      if (d > Math.PI) d = Math.abs(d - Math.PI * 2)
      maxStep = Math.max(maxStep, d)
      prev = yaw
    }
    expect(maxStep).toBeLessThan(0.2)
  })

  it('never flips heading instantly when a route doubles back', () => {
    const back: RouteSegment = {
      start: 0,
      end: 10,
      nodes: [
        { x: 0, z: 0 },
        { x: 0, z: 20, hold: 1 },
        { x: 0, z: 0 },
      ],
    }
    let prev = sampleSegment(back, 0)!.yaw
    let maxStep = 0
    for (let t = 0.01; t <= 10; t += 0.01) {
      const yaw = sampleSegment(back, t)!.yaw
      let d = Math.abs(yaw - prev)
      if (d > Math.PI) d = Math.abs(d - Math.PI * 2)
      maxStep = Math.max(maxStep, d)
      prev = yaw
    }
    expect(maxStep).toBeLessThan(0.25)
    // And it really does come back: ends pointing roughly opposite the start.
    const startYaw = sampleSegment(back, 0)!.yaw
    const endYaw = sampleSegment(back, 10)!.yaw
    let total = Math.abs(endYaw - startYaw)
    if (total > Math.PI) total = Math.abs(total - Math.PI * 2)
    expect(total).toBeGreaterThan(2.5)
  })

  it('eases heading between task segments across the idle gap', () => {
    const actor: ActorSpec = {
      id: 'seam',
      kind: 'bus',
      name: 'B',
      stand: 's',
      color: '#fff',
      segments: [
        // Drives north (+Z): yaw 0.
        { start: 0, end: 5, nodes: [{ x: 0, z: 0 }, { x: 0, z: 20 }] },
        // Drives south (-Z) later: yaw π.
        { start: 15, end: 20, nodes: [{ x: 0, z: 20 }, { x: 0, z: 0 }] },
      ],
    }
    let prev = sampleActor(actor, 0).yaw
    let maxStep = 0
    for (let t = 0.02; t <= 20; t += 0.02) {
      const yaw = sampleActor(actor, t).yaw
      let d = Math.abs(yaw - prev)
      if (d > Math.PI) d = Math.abs(d - Math.PI * 2)
      maxStep = Math.max(maxStep, d)
      prev = yaw
    }
    expect(maxStep).toBeLessThan(0.15)
    expect(Math.abs(sampleActor(actor, 17).yaw)).toBeGreaterThan(2.5)
  })

  it('compresses holds when they exceed the window', () => {
    const overrun: RouteSegment = {
      start: 0,
      end: 2,
      nodes: [
        { x: 0, z: 0, hold: 10 },
        { x: 5, z: 0, hold: 10 },
      ],
    }
    // Should not throw and still end at the final node.
    const end = sampleSegment(overrun, 2)
    expect(end?.x).toBeCloseTo(5, 4)
  })
})

describe('sampleActor', () => {
  const actor: ActorSpec = {
    id: 'a',
    kind: 'fuelTruck',
    name: 'T',
    stand: 's',
    color: '#fff',
    segments: [
      { start: 0, end: 10, nodes: [{ x: 0, z: 0 }, { x: 10, z: 0 }] },
      { start: 20, end: 30, nodes: [{ x: 10, z: 0 }, { x: 0, z: 0 }] },
    ],
  }

  it('reports the segment owning t', () => {
    expect(currentSegmentIndex(actor, 5)).toBe(0)
    expect(currentSegmentIndex(actor, 25)).toBe(1)
    expect(currentSegmentIndex(actor, -1)).toBe(-1)
  })

  it('rests between tasks and after the last', () => {
    const gap = sampleActor(actor, 15)
    expect(gap.active).toBe(false)
    expect(gap.x).toBeCloseTo(10)
    const after = sampleActor(actor, 40)
    expect(after.active).toBe(false)
    expect(after.x).toBeCloseTo(0)
  })

  it('pins yaw when `facing` is set', () => {
    const pinned: ActorSpec = { ...actor, facing: 90 }
    const pose = sampleActor(pinned, 5)
    expect(pose.yaw).toBeCloseTo(Math.PI / 2)
    expect(pose.x).toBeGreaterThan(0)
  })

  it('exposes the whole working window', () => {
    expect(totalWindow(actor)).toEqual({ start: 0, end: 30 })
    expect(actorWindows(actor)).toHaveLength(2)
  })

  it('hides crew outside its shift', () => {
    const crew: ActorSpec = {
      ...actor,
      kind: 'groundCrew',
      role: '机务',
      segments: [{ start: 10, end: 20, nodes: [{ x: 0, z: 0 }] }],
    }
    expect(sampleActor(crew, 0).visible).toBe(false)
    expect(sampleActor(crew, 15).visible).toBe(true)
  })
})

describe('demo scenario', () => {
  const scenario = createDemoScenario()

  it('is deterministic', () => {
    expect(JSON.stringify(createDemoScenario())).toBe(JSON.stringify(scenario))
  })

  it('has three stands and more than 20 movable actors', () => {
    expect(scenario.stands).toHaveLength(3)
    expect(scenario.actors.length).toBeGreaterThanOrEqual(24)
    const moving = scenario.actors.filter((a) => (a.segments?.length ?? 0) > 0)
    expect(moving.length).toBeGreaterThanOrEqual(20)
    // At least one actor has a multi-leg choreography.
    expect(scenario.actors.some((a) => (a.segments?.length ?? 0) > 1)).toBe(true)
  })

  it('keeps every segment inside the timeline', () => {
    for (const actor of scenario.actors) {
      for (const seg of actor.segments ?? []) {
        expect(seg.start).toBeGreaterThanOrEqual(0)
        expect(seg.end).toBeLessThanOrEqual(scenario.meta.duration)
      }
    }
  })

  it('places actors of the right stand near that stand origin', () => {
    for (const actor of scenario.actors) {
      const stand = scenario.stands.find((s) => s.id === actor.stand)!
      const pose = sampleActor(actor, 5)
      const dist = Math.hypot(pose.x - stand.origin.x, pose.z - stand.origin.z)
      expect(dist).toBeLessThan(90)
    }
  })

  it('keeps vehicles on defined ground (non-zero footprint kinds only)', () => {
    const vehicles = scenario.actors.filter((a) => isVehicleKind(a.kind))
    expect(vehicles.length).toBeGreaterThanOrEqual(12)
  })
})

describe('import / export round trip', () => {
  const scenario = createDemoScenario()

  it('exports and re-imports identically', () => {
    const payload = serializeExport(buildExport(scenario, {
      minute: 12.5,
      standId: 'stand-a14',
      viewMode: 'orthographic',
      camera: { position: [1, 2, 3], target: [0, 0, 0] },
    }))
    const result = validateScenario(JSON.parse(payload))
    expect(result.ok).toBe(true)
    expect(result.scenario).toEqual(scenario)
    expect(result.view?.minute).toBe(12.5)
    expect(result.view?.viewMode).toBe('orthographic')
  })

  it('accepts a bare scenario object', () => {
    const result = validateScenario(JSON.parse(JSON.stringify(scenario)))
    expect(result.ok).toBe(true)
    expect(result.view).toBeUndefined()
  })

  it('rejects malformed data with readable errors', () => {
    const broken = {
      scenario: {
        meta: { name: 'x', startsAt: '2026-11-23T06:30:00', duration: 60 },
        stands: [{ id: 's', label: 'S', origin: { x: 0, z: 0 }, heading: 0, aircraftType: 'A', aircraftLength: 30, aircraftWingspan: 30, flight: 'F' }],
        actors: [{ id: 'a', kind: 'rocket', name: 'X', stand: 's', color: '#fff' }],
      },
    }
    const result = validateScenario(broken)
    expect(result.ok).toBe(false)
    expect(result.errors.join()).toContain('rocket')
  })

  it('flags unknown stand references', () => {
    const broken = JSON.parse(JSON.stringify(scenario))
    broken.actors[0].stand = 'nowhere'
    const result = validateScenario(broken)
    expect(result.ok).toBe(false)
    expect(result.errors.join()).toContain('nowhere')
  })

  it('clamps an out-of-range stored minute and warns', () => {
    const payload = buildExport(scenario, {
      minute: 999,
      standId: 'all',
      viewMode: 'perspective',
      camera: { position: [0, 10, 10], target: [0, 0, 0] },
    })
    const result = validateScenario(JSON.parse(serializeExport(payload)))
    expect(result.view?.minute).toBe(scenario.meta.duration)
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})

describe('clock helpers', () => {
  it('formats an offset against the scenario start', () => {
    expect(formatClock('2026-11-23T06:30:00', 0)).toBe('06:30')
    expect(formatClock('2026-11-23T06:30:00', 45)).toBe('07:15')
    expect(formatClock('2026-11-23T06:30:00', 90)).toBe('08:00')
  })

  it('parses HH:MM and rejects garbage', () => {
    expect(parseClock('06:30')).toBe(390)
    expect(parseClock('6:05')).toBe(365)
    expect(parseClock('25:00')).toBeNull()
    expect(parseClock('nope')).toBeNull()
  })
})

describe('rng', () => {
  it('is reproducible and in [0,1)', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    for (let i = 0; i < 100; i++) {
      const v = a()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      expect(v).toBe(b())
    }
  })
})
