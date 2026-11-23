import { describe, expect, it } from 'vitest'
import { sampleActor, type ActorSpec } from '../src/domain/model'
import { createDemoScenario } from '../src/domain/scenario'
import { validateScenario } from '../src/domain/io'

/**
 * Sweep every actor across the whole timeline and assert the sampled state is
 * always finite. NaNs here would propagate silently into Three.js transforms
 * (they serialise to `null` over CDP and can make a whole subtree vanish), so
 * this is the cheapest guard against authoring mistakes in route data.
 */
describe('pose sampling invariants', () => {
  const scenario = createDemoScenario()

  const sweep = (actors: ActorSpec[], step = 0.05): void => {
    for (const actor of actors) {
      for (let t = -2; t <= scenario.meta.duration + 2; t += step) {
        const pose = sampleActor(actor, t)
        expect(Number.isFinite(pose.x), `${actor.id} x at ${t}`).toBe(true)
        expect(Number.isFinite(pose.z), `${actor.id} z at ${t}`).toBe(true)
        expect(Number.isFinite(pose.yaw), `${actor.id} yaw at ${t}`).toBe(true)
        expect(Number.isFinite(pose.progress), `${actor.id} progress at ${t}`).toBe(true)
        expect(pose.progress).toBeGreaterThanOrEqual(0)
        expect(pose.progress).toBeLessThanOrEqual(1)
      }
    }
  }

  it('never produces non-finite poses for the demo scenario', () => {
    sweep(scenario.actors)
  })

  it('never produces non-finite poses for degenerate route data', () => {
    const degenerate: ActorSpec[] = [
      {
        id: 'zero-length',
        kind: 'fuelTruck',
        name: 'zero',
        stand: 'stand-a12',
        color: '#ffffff',
        segments: [{ start: 5, end: 10, nodes: [{ x: 0, z: 0 }, { x: 0, z: 0 }] }],
      },
      {
        id: 'single-node',
        kind: 'bus',
        name: 'single',
        stand: 'stand-a12',
        color: '#ffffff',
        segments: [{ start: 0, end: 3, nodes: [{ x: 4, z: 4 }] }],
      },
      {
        id: 'zero-span',
        kind: 'baggageCart',
        name: 'instant',
        stand: 'stand-a12',
        color: '#ffffff',
        segments: [{ start: 8, end: 8, nodes: [{ x: 1, z: 1 }, { x: 2, z: 2 }] }],
      },
      {
        id: 'static-crew',
        kind: 'groundCrew',
        name: 'static',
        stand: 'stand-a12',
        color: '#ffffff',
        role: '机务',
        anchor: { x: 3, z: 3 },
        yaw: 45,
      },
      {
        id: 'holds-only',
        kind: 'bus',
        name: 'holds',
        stand: 'stand-a12',
        color: '#ffffff',
        segments: [
          {
            start: 0,
            end: 6,
            nodes: [
              { x: 0, z: 0, hold: 3 },
              { x: 10, z: 0, hold: 3 },
            ],
          },
        ],
      },
    ]
    for (const actor of degenerate) {
      for (let t = -1; t <= 12; t += 0.05) {
        const pose = sampleActor(actor, t)
        expect(Number.isFinite(pose.x), `${actor.id} x at ${t}`).toBe(true)
        expect(Number.isFinite(pose.z), `${actor.id} z at ${t}`).toBe(true)
        expect(Number.isFinite(pose.yaw), `${actor.id} yaw at ${t}`).toBe(true)
      }
    }
  })

  it('keeps actors of each stand within that stand’s apron', () => {
    for (const actor of scenario.actors) {
      const stand = scenario.stands.find((s) => s.id === actor.stand)!
      for (let t = 0; t <= scenario.meta.duration; t += 1) {
        const pose = sampleActor(actor, t)
        const dist = Math.hypot(pose.x - stand.origin.x, pose.z - stand.origin.z)
        expect(dist, `${actor.id} at ${t}`).toBeLessThan(90)
      }
    }
  })

  it('yaw stays continuous across a full sweep', () => {
    for (const actor of scenario.actors) {
      if ((actor.segments?.length ?? 0) === 0) continue
      let prev = sampleActor(actor, 0).yaw
      for (let t = 0.05; t <= scenario.meta.duration; t += 0.05) {
        const yaw = sampleActor(actor, t).yaw
        let d = Math.abs(yaw - prev)
        if (d > Math.PI) d = Math.abs(d - Math.PI * 2)
        // A 0.05-minute step should never swing the heading more than ~30°.
        expect(d, `${actor.id} yaw jump at ${t}`).toBeLessThan(Math.PI / 6)
        prev = yaw
      }
    }
  })

  it('exported scenario survives validation unchanged', () => {
    const result = validateScenario(JSON.parse(JSON.stringify(scenario)))
    expect(result.ok).toBe(true)
    expect(result.scenario?.actors).toHaveLength(scenario.actors.length)
  })
})
