/**
 * Ground support equipment: fuel truck, passenger bus, baggage tractor and
 * baggage cart. All face +Z with the nose at +Z/2.
 *
 * Static geometry is accumulated through `createBatch()`, so each vehicle
 * costs one draw call per material (3-5) instead of one per part (~25). Only
 * the warning beacon stays a separate mesh, because it blinks.
 */

import * as THREE from 'three'
import type { VehicleKind } from '../../domain/model'
import {
  BEACON,
  createBatch,
  GLASS,
  METAL,
  PRIM,
  part,
  standard,
  TYRE,
} from './primitives'

export interface VehicleModel {
  group: THREE.Group
  kind: VehicleKind
  /** Local-space bounding box, in model units. */
  footprint: { width: number; height: number; length: number }
  /** Height of the roof, useful for placing labels. */
  roofY: number
  beacon?: THREE.Mesh
}

const decal = (color: string): THREE.MeshStandardMaterial =>
  standard(color, { roughness: 0.42, metalness: 0.2 })

const HAZARD = standard('#f2c230', { roughness: 0.6 })
const WHITE = standard('#e8edf3', { roughness: 0.4, metalness: 0.25 })
const CHROME = standard('#c7ccd4', { roughness: 0.35, metalness: 0.8 })
const CHARCOAL = standard('#22262c', { roughness: 0.85 })
const DARK_TRIM = standard('#39404a', { roughness: 0.7 })

/** Add a wheel at (x, z) with the given tyre radius. */
function addWheels(
  batch: ReturnType<typeof createBatch>,
  W: number,
  axles: Array<[number, number, number]>,
): void {
  for (const [z, r, width] of axles) {
    for (const side of [-1, 1]) {
      batch.add(PRIM.cyl, TYRE, {
        scale: [r * 2, width, r * 2],
        rot: [0, 0, Math.PI / 2],
        pos: [side * (W / 2 - 0.04), r, z],
      })
    }
  }
}

export function buildFuelTruck(color: string): VehicleModel {
  const batch = createBatch()
  const body = decal(color)
  const L = 9.4
  const W = 2.6
  const tankLen = 5.4
  const tankR = 1.28

  // Chassis + cab + windscreens.
  batch.add(PRIM.box, METAL, { scale: [W, 0.28, L * 0.92], pos: [0, 0.7, 0] })
  batch.add(PRIM.box, WHITE, { scale: [W * 0.96, 1.7, 2.1], pos: [0, 1.55, L / 2 - 1.35] })
  batch.add(PRIM.box, GLASS, { scale: [W * 0.9, 0.72, 0.08], pos: [0, 1.95, L / 2 - 0.28] })
  for (const side of [-1, 1]) {
    batch.add(PRIM.box, GLASS, {
      scale: [0.06, 0.62, 0.9],
      pos: [side * W * 0.485, 1.95, L / 2 - 1.2],
    })
  }

  // Tank barrel + domed ends.
  batch.add(PRIM.cyl, body, {
    scale: [tankR * 2, tankLen, tankR * 2],
    rot: [Math.PI / 2, 0, 0],
    pos: [0, 1.9, 0.7],
  })
  for (const zEnd of [-1, 1]) {
    batch.add(PRIM.sphere, body, {
      scale: [tankR * 2, tankR * 2, tankR * 0.5],
      pos: [0, 1.9, 0.7 + (zEnd * tankLen) / 2],
    })
  }

  // Tank bands + hazard stripe + rear hose reel + bumper.
  for (const z of [-1.6, 0, 1.6]) {
    batch.add(PRIM.torus, CHROME, {
      scale: [tankR * 2.12, tankR * 2.12, 2.2],
      pos: [0, 1.9, z + 0.7],
    })
  }
  batch.add(PRIM.box, HAZARD, { scale: [W * 1.02, 0.24, tankLen * 0.9], pos: [0, 1.02, 0.7] })
  batch.add(PRIM.cyl, METAL, {
    scale: [0.5, 0.9, 0.5],
    rot: [0, 0, Math.PI / 2],
    pos: [0, 0.95, -L / 2 + 0.3],
  })
  batch.add(PRIM.box, DARK_TRIM, { scale: [W, 0.32, 0.28], pos: [0, 0.55, L / 2 - 0.15] })

  addWheels(batch, W, [
    [L / 2 - 1.9, 0.62, 0.42],
    [-L / 2 + 1.5, 0.62, 0.42],
    [-L / 2 + 2.9, 0.62, 0.42],
  ])

  const group = batch.build('fuelTruck')
  const beacon = part(PRIM.box, BEACON, {
    scale: [0.3, 0.22, 0.3],
    pos: [0, 2.45, L / 2 - 1.5],
    castShadow: false,
  })
  group.add(beacon)

  return {
    group,
    kind: 'fuelTruck',
    footprint: { width: W, height: 2.9, length: L },
    roofY: 2.45,
    beacon,
  }
}

export function buildBus(color: string): VehicleModel {
  const batch = createBatch()
  const body = decal(color)
  const L = 11.5
  const W = 2.55

  batch.add(PRIM.box, METAL, { scale: [W, 0.28, L * 0.92], pos: [0, 0.8, 0] })
  batch.add(PRIM.box, body, { scale: [W, 2.3, L], pos: [0, 2.0, 0] })
  batch.add(PRIM.box, body, { scale: [W * 0.94, 0.5, L * 0.96], pos: [0, 3.32, 0] })

  batch.add(PRIM.box, GLASS, { scale: [W * 0.92, 1.0, 0.1], pos: [0, 2.42, L / 2 - 0.02] })
  for (const side of [-1, 1]) {
    batch.add(PRIM.box, GLASS, {
      scale: [0.07, 0.95, L * 0.78],
      pos: [side * (W / 2 + 0.005), 2.46, -L * 0.03],
    })
  }
  batch.add(PRIM.box, GLASS, { scale: [0.06, 1.5, 1.1], pos: [W / 2 + 0.01, 1.85, L / 2 - 2.2] })
  batch.add(PRIM.box, WHITE, { scale: [W * 1.01, 0.22, L * 0.99], pos: [0, 0.98, 0] })

  addWheels(batch, W, [
    [L / 2 - 2.1, 0.62, 0.44],
    [-L / 2 + 2.2, 0.62, 0.44],
    [-L / 2 + 3.6, 0.62, 0.44],
  ])

  const group = batch.build('bus')
  return { group, kind: 'bus', footprint: { width: W, height: 3.6, length: L }, roofY: 3.3 }
}

export function buildBaggageTractor(color: string): VehicleModel {
  const batch = createBatch()
  const body = decal(color)
  const L = 4.6
  const W = 1.7

  batch.add(PRIM.box, METAL, { scale: [W, 0.28, L * 0.92], pos: [0, 0.55, 0] })
  batch.add(PRIM.box, body, { scale: [W * 0.9, 0.7, 1.5], pos: [0, 1.0, L / 2 - 0.9] })
  batch.add(PRIM.box, body, { scale: [W * 0.92, 0.35, 1.1], pos: [0, 0.78, -0.1] })
  batch.add(PRIM.box, CHARCOAL, { scale: [0.55, 0.65, 0.2], pos: [0, 1.22, -0.55] })

  // Canopy posts + roof.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      batch.add(PRIM.cyl, METAL, { scale: [0.08, 1.5, 0.08], pos: [sx * W * 0.4, 1.65, sz * 0.6] })
    }
  }
  batch.add(PRIM.box, body, { scale: [W * 0.98, 0.12, 1.5], pos: [0, 2.4, 0] })

  // Tow hitch.
  batch.add(PRIM.cyl, METAL, {
    scale: [0.1, 0.9, 0.1],
    rot: [Math.PI / 2, 0, 0],
    pos: [0, 0.62, -L / 2 - 0.35],
  })

  addWheels(batch, W, [
    [L / 2 - 1.0, 0.42, 0.3],
    [-L / 2 + 0.95, 0.42, 0.3],
  ])

  const group = batch.build('baggageTractor')
  const beacon = part(PRIM.box, BEACON, {
    scale: [0.22, 0.18, 0.22],
    pos: [0, 2.55, 0.4],
    castShadow: false,
  })
  group.add(beacon)

  return {
    group,
    kind: 'baggageTractor',
    footprint: { width: W, height: 2.6, length: L },
    roofY: 2.5,
    beacon,
  }
}

/** Baggage cart: a low flatbed with side rails, towed behind a tractor. */
export function buildBaggageCart(color: string): VehicleModel {
  const batch = createBatch()
  const deck = decal(color)
  const L = 2.9
  const W = 1.5

  batch.add(PRIM.box, METAL, { scale: [W * 0.86, 0.16, L], pos: [0, 0.55, 0] })
  batch.add(PRIM.box, deck, { scale: [W, 0.08, L], pos: [0, 0.66, 0] })

  for (const side of [-1, 1]) {
    for (const y of [0.95, 1.25]) {
      batch.add(PRIM.box, METAL, { scale: [0.06, 0.06, L], pos: [side * W * 0.48, y, 0] })
    }
    for (const z of [-L / 2, -L / 6, L / 6, L / 2]) {
      batch.add(PRIM.box, METAL, { scale: [0.06, 0.65, 0.06], pos: [side * W * 0.48, 0.95, z] })
    }
  }
  for (const z of [-1, 1]) {
    batch.add(PRIM.box, METAL, { scale: [W, 0.06, 0.06], pos: [0, 1.25, (z * L) / 2] })
  }
  batch.add(PRIM.cyl, METAL, {
    scale: [0.09, 1.3, 0.09],
    rot: [Math.PI / 2, 0, 0],
    pos: [0, 0.5, -L / 2 - 0.6],
  })

  addWheels(batch, W, [
    [-L / 2 + 0.55, 0.34, 0.22],
    [L / 2 - 0.55, 0.34, 0.22],
  ])

  const group = batch.build('baggageCart')
  return {
    group,
    kind: 'baggageCart',
    footprint: { width: W, height: 1.3, length: L },
    roofY: 1.25,
  }
}

export function buildVehicle(kind: VehicleKind, color: string): VehicleModel {
  switch (kind) {
    case 'fuelTruck':
      return buildFuelTruck(color)
    case 'bus':
      return buildBus(color)
    case 'baggageTractor':
      return buildBaggageTractor(color)
    case 'baggageCart':
      return buildBaggageCart(color)
  }
}
