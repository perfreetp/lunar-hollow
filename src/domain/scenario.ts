/**
 * Draft scenario builder.
 *
 * Produces a deterministic three-stand turnaround schedule used as the
 * out-of-the-box demo. Route nodes are authored in each stand's local frame
 * (origin = aircraft centroid, nose toward -Z) and converted to world space.
 */

import {
  deg2rad,
  type ActorSpec,
  type CrewRole,
  type PathNode,
  type RouteSegment,
  type Scenario,
  type StandSpec,
  type Vec2,
} from './model'

interface LocalNode {
  x: number
  z: number
  hold?: number
}

const STAND_SPACING = 78

const AIRCRAFT_TYPES = [
  { type: 'A320neo', length: 37.6, wingspan: 35.8, code: 'A320' },
  { type: 'B737-800', length: 39.5, wingspan: 35.9, code: 'B738' },
  { type: 'A321neo', length: 44.5, wingspan: 35.8, code: 'A321' },
]

const STANDS: Array<{
  label: string
  flight: string
  heading: number
  typeIndex: number
  startOffset: number
}> = [
  { label: 'A12', flight: 'MU2351', heading: -6, typeIndex: 0, startOffset: 0 },
  { label: 'A14', flight: 'CA1835', heading: 0, typeIndex: 1, startOffset: 7 },
  { label: 'A16', flight: 'CZ3108', heading: 5, typeIndex: 2, startOffset: 15 },
]

const COLORS = {
  aircraft: '#d9e3f0',
  fuel: '#e0a12c',
  bus: '#3f9bf5',
  baggage: '#8b5cf6',
  cart: '#a78bfa',
  crew: '#34d399',
  supervisor: '#f472b6',
}

function rotateToWorld(stand: StandSpec, p: Vec2): Vec2 {
  const h = deg2rad(stand.heading)
  const c = Math.cos(h)
  const s = Math.sin(h)
  return {
    x: stand.origin.x + p.x * c + p.z * s,
    z: stand.origin.z - p.x * s + p.z * c,
  }
}

function localNodes(stand: StandSpec, nodes: LocalNode[]): PathNode[] {
  return nodes.map((n) => {
    const w = rotateToWorld(stand, { x: n.x, z: n.z })
    return { x: w.x, z: w.z, hold: n.hold }
  })
}

interface ActorPlan {
  key: string
  kind: ActorSpec['kind']
  name: string
  role?: CrewRole
  color: string
  /** Static figure: stands at this local point facing the stand heading. */
  postLocal?: Vec2
  routes: Array<{ start: number; end: number; label: string; nodes: LocalNode[] }>
}

/** Build the task chain for one stand, shifted by `offset` minutes. */
function planStand(stand: StandSpec, offset: number): ActorSpec[] {
  const A = (key: string, p: Omit<ActorPlan, 'key'>): ActorPlan => ({ key, ...p })

  const plans: ActorPlan[] = [
    A('aircraft', {
      kind: 'aircraft',
      name: `${stand.flight} 机位占用`,
      color: COLORS.aircraft,
      postLocal: { x: 0, z: 0 },
      routes: [
        {
          start: offset + 2,
          end: offset + 56,
          label: '过站保障窗口',
          nodes: [{ x: 0, z: 0 }],
        },
      ],
    }),
    A('fuel', {
      kind: 'fuelTruck',
      name: '加油车 02',
      color: COLORS.fuel,
      routes: [
        {
          start: offset + 6,
          end: offset + 27,
          label: '靠机加油',
          nodes: [
            { x: 30, z: 34 },
            { x: 19, z: 23 },
            { x: 10.5, z: 7, hold: 6.5 },
            { x: 19, z: 23 },
            { x: 30, z: 34 },
          ],
        },
        {
          start: offset + 33,
          end: offset + 45,
          label: '油车转场',
          nodes: [
            { x: 30, z: 34 },
            { x: 58, z: 40 },
            { x: 70, z: 40, hold: 3 },
          ],
        },
      ],
    }),
    A('bus', {
      kind: 'bus',
      name: '摆渡车 01',
      color: COLORS.bus,
      routes: [
        {
          start: offset + 11,
          end: offset + 31,
          label: '旅客登机摆渡',
          nodes: [
            { x: -40, z: 40 },
            { x: -22, z: 24 },
            { x: -10.5, z: 9, hold: 6 },
            { x: -22, z: 24 },
            { x: -40, z: 40 },
          ],
        },
      ],
    }),
    A('tug', {
      kind: 'baggageTractor',
      name: '行李牵引车 03',
      color: COLORS.baggage,
      routes: [
        {
          start: offset + 5,
          end: offset + 25,
          label: '卸机行李转运',
          nodes: [
            { x: 24, z: 47 },
            { x: 15, z: 32 },
            { x: 8, z: 25, hold: 5 },
            { x: 15, z: 32 },
            { x: 24, z: 47 },
          ],
        },
      ],
    }),
    A('cart1', {
      kind: 'baggageCart',
      name: '行李拖斗 01',
      color: COLORS.cart,
      routes: [
        {
          start: offset + 7,
          end: offset + 24,
          label: '装机行李待运',
          nodes: [
            { x: 16, z: 49 },
            { x: 10, z: 34 },
            { x: 4, z: 27, hold: 6 },
            { x: 10, z: 34 },
            { x: 16, z: 49 },
          ],
        },
      ],
    }),
    A('cart2', {
      kind: 'baggageCart',
      name: '行李拖斗 02',
      color: COLORS.cart,
      routes: [
        {
          start: offset + 9,
          end: offset + 23,
          label: '卸机行李待运',
          nodes: [
            { x: 19, z: 50 },
            { x: 13, z: 35 },
            { x: 2, z: 28, hold: 5 },
            { x: 13, z: 35 },
            { x: 19, z: 50 },
          ],
        },
      ],
    }),
    A('mech', {
      kind: 'groundCrew',
      name: '机务 王工',
      role: '机务',
      color: COLORS.crew,
      routes: [
        {
          start: offset + 0,
          end: offset + 52,
          label: '机务放行检查',
          nodes: [
            { x: -8, z: -30, hold: 3 },
            { x: -5, z: -25, hold: 10 },
            { x: 7, z: -20, hold: 6 },
            { x: 10, z: 4, hold: 8 },
            { x: -6, z: 22, hold: 6 },
            { x: -8, z: -30, hold: 4 },
          ],
        },
      ],
    }),
    A('fuelman', {
      kind: 'groundCrew',
      name: '加油员 李工',
      role: '加油',
      color: COLORS.crew,
      routes: [
        {
          start: offset + 8,
          end: offset + 25,
          label: '监控加油作业',
          nodes: [
            { x: 15, z: 15, hold: 3 },
            { x: 13.5, z: 10, hold: 8 },
            { x: 15, z: 15, hold: 2 },
          ],
        },
      ],
    }),
    A('bagman', {
      kind: 'groundCrew',
      name: '行李员 赵工',
      role: '行李',
      color: COLORS.crew,
      routes: [
        {
          start: offset + 6,
          end: offset + 24,
          label: '货舱装卸监装',
          nodes: [
            { x: 12, z: 34, hold: 3 },
            { x: 7, z: 28, hold: 9 },
            { x: 12, z: 34, hold: 2 },
          ],
        },
      ],
    }),
    A('cabin', {
      kind: 'groundCrew',
      name: '客舱 陈姐',
      role: '客舱',
      color: COLORS.crew,
      routes: [
        {
          start: offset + 12,
          end: offset + 30,
          label: '客舱清洁',
          nodes: [
            { x: -14, z: 2, hold: 2 },
            { x: -8, z: 1, hold: 11 },
            { x: -14, z: 2, hold: 2 },
          ],
        },
      ],
    }),
    A('watch', {
      kind: 'groundCrew',
      name: '监护 周工',
      role: '监护',
      color: COLORS.supervisor,
      routes: [
        {
          start: offset + 1,
          end: offset + 55,
          label: '机位安全监护',
          nodes: [
            { x: 26, z: -20, hold: 24 },
            { x: 26, z: -8, hold: 8 },
            { x: 26, z: -20, hold: 22 },
          ],
        },
      ],
    }),
    A('push', {
      kind: 'groundCrew',
      name: '牵引 孙工',
      role: '牵引',
      color: COLORS.crew,
      routes: [
        {
          start: offset + 48,
          end: offset + 56,
          label: '推出前准备',
          nodes: [
            { x: 0, z: -34, hold: 3 },
            { x: -3, z: -27, hold: 4 },
          ],
        },
      ],
    }),
  ]

  return plans.map((plan) => {
    const segments: RouteSegment[] = plan.routes.map((r) => ({
      start: r.start,
      end: r.end,
      label: r.label,
      nodes: localNodes(stand, r.nodes),
    }))

    const actor: ActorSpec = {
      id: `${stand.id}:${plan.key}`,
      kind: plan.kind,
      name: plan.name,
      stand: stand.id,
      color: plan.color,
      role: plan.role,
      segments,
    }

    if (plan.postLocal) {
      actor.anchor = rotateToWorld(stand, plan.postLocal)
      actor.facing = stand.heading
    }
    return actor
  })
}

export function createDemoScenario(): Scenario {
  const stands: StandSpec[] = STANDS.map((s, i) => {
    const t = AIRCRAFT_TYPES[s.typeIndex]
    return {
      id: `stand-${s.label.toLowerCase()}`,
      label: s.label,
      origin: { x: (i - 1) * STAND_SPACING, z: 0 },
      heading: s.heading,
      aircraftType: t.type,
      aircraftLength: t.length,
      aircraftWingspan: t.wingspan,
      flight: s.flight,
    }
  })

  const actors: ActorSpec[] = []
  STANDS.forEach((s, i) => {
    actors.push(...planStand(stands[i], s.startOffset))
  })

  return {
    version: 1,
    meta: {
      name: '早高峰机坪保障 A12 / A14 / A16',
      startsAt: '2026-11-23T06:30:00',
      duration: 90,
    },
    stands,
    actors,
  }
}
