/**
 * Aircraft silhouettes built procedurally from primitives.
 *
 * Convention: nose at -Z, tail at +Z (nose-in stand); +Y up; total length runs
 * from the nose tip to the tail cone. Geometry is batched per material, so a
 * whole airframe costs ~7 draw calls.
 *
 * Vertical layout (all relative to ground y=0):
 *   fuselage axis   y = R + 0.35          (belly ~0.35 m off the ground)
 *   wing plane      y = axis - 0.55R      (low-wing airliner)
 *   engine axis     y = wing  - 0.62R     (nacelle hangs under the wing)
 *   fin             from the fuselage top up to finHeight
 */

import * as THREE from 'three'
import { createBatch, GLASS, LIGHT_GREEN, LIGHT_RED, PRIM, part, standard } from './primitives'

export interface AircraftModel {
  group: THREE.Group
  length: number
  wingspan: number
  /** Red anti-collision beacon on the fin; blinks with the clock. */
  beacon: THREE.Mesh
  navRed: THREE.Mesh
  navGreen: THREE.Mesh
}

export interface AircraftOptions {
  type: string
  length: number
  wingspan: number
  livery: string
}

const ACCENT = '#1e5aa8'

/** Vertical fin height scales with aircraft length. */
const finHeight = (length: number): number => Math.max(2.2, length * 0.062)

const beaconMat = (): THREE.MeshStandardMaterial =>
  standard('#ff3b30', { emissive: '#ff2d20', emissiveIntensity: 2.4, roughness: 0.3 })

export function buildAircraft(opts: AircraftOptions): AircraftModel {
  const { length: L, wingspan } = opts
  const R = Math.max(1.75, L * 0.052)
  const axis = R + 0.35
  const barrelLen = L * 0.62
  const wingY = axis - R * 0.55
  const finH = finHeight(L)
  const halfSpan = wingspan / 2
  const chord = L * 0.155

  const shell = standard(opts.livery, { roughness: 0.32, metalness: 0.35 })
  const wingMat = standard('#c3cad4', { roughness: 0.45, metalness: 0.55 })
  const intake = standard('#0d1116', { roughness: 0.35, metalness: 0.6 })
  const cheat = standard(ACCENT, { roughness: 0.4, metalness: 0.1 })
  const trim = standard('#8d97a3', { roughness: 0.35, metalness: 0.7 })
  const strut = standard('#c9ced6', { roughness: 0.3, metalness: 0.85 })
  const tyre = standard('#15171b', { roughness: 0.95, metalness: 0.02 })

  const batch = createBatch()
  const add = batch.add

  /* ---- fuselage ---------------------------------------------------- */
  // Barrel.
  add(PRIM.cyl, shell, {
    scale: [R * 2, barrelLen, R * 2],
    rot: [Math.PI / 2, 0, 0],
    pos: [0, axis, 0],
  })
  // Nose dome.
  add(PRIM.sphere, shell, {
    scale: [R * 2, R * 2, L * 0.15],
    pos: [0, axis, -barrelLen / 2 - L * 0.025],
  })
  // Tail cone: cone apex points +Z, so rotate the default +Y apex to +Z.
  add(PRIM.cone, shell, {
    scale: [R * 1.6, L * 0.26, R * 1.6],
    rot: [Math.PI / 2, 0, 0],
    pos: [0, axis + R * 0.35, barrelLen / 2 + L * 0.1],
  })
  // Belly fairing.
  add(PRIM.box, shell, {
    scale: [R * 1.4, R * 0.5, barrelLen * 0.85],
    pos: [0, axis - R * 0.62, 0],
  })

  /* ---- livery + glazing -------------------------------------------- */
  add(PRIM.box, cheat, {
    scale: [R * 2.04, R * 0.22, barrelLen * 0.95],
    pos: [0, axis + R * 0.05, 0],
  })
  // Cockpit.
  add(PRIM.sphere, GLASS, {
    scale: [R * 1.35, R * 0.55, R * 1.15],
    pos: [0, axis + R * 0.45, -barrelLen / 2 - L * 0.01],
  })
  // Cabin windows.
  for (const side of [-1, 1]) {
    add(PRIM.box, GLASS, {
      scale: [0.06, R * 0.16, barrelLen * 0.78],
      pos: [side * R * 0.99, axis + R * 0.26, 0.4],
    })
  }

  /* ---- wings ------------------------------------------------------- */
  const rootZ = barrelLen * 0.05
  const dihedral = 0.085
  const inboard = halfSpan * 0.52
  const outboard = halfSpan - inboard
  for (const side of [-1, 1]) {
    // Inboard panel: thickest chord, running from the fuselage outward.
    add(PRIM.box, wingMat, {
      scale: [inboard, 0.34, chord],
      pos: [side * inboard * 0.5, wingY, rootZ],
      rot: [0, 0, -side * dihedral],
    })
    // Outboard panel: narrower chord, swept back slightly, rises with dihedral.
    const outY = wingY + inboard * Math.tan(dihedral)
    add(PRIM.box, wingMat, {
      scale: [outboard, 0.26, chord * 0.7],
      pos: [side * (inboard + outboard * 0.5), outY, rootZ + chord * 0.22],
      rot: [0, 0, -side * dihedral],
    })
    // Winglet: a slim fin at the tip, canted up.
    add(PRIM.box, wingMat, {
      scale: [0.14, 1.5, chord * 0.45],
      pos: [
        side * (halfSpan - 0.05),
        outY + 0.7,
        rootZ + chord * 0.26,
      ],
      rot: [0, 0, -side * 0.12],
    })
  }

  /* ---- engines ----------------------------------------------------- */
  const nacelleR = R * 0.42
  const engineY = wingY - R * 0.62
  const engineZ = rootZ - chord * 0.15
  for (const side of [-1, 1]) {
    const x = side * wingspan * 0.18
    // Nacelle.
    add(PRIM.cyl, shell, {
      scale: [nacelleR * 2, nacelleR * 2.6, nacelleR * 2],
      rot: [Math.PI / 2, 0, 0],
      pos: [x, engineY, engineZ],
    })
    // Intake lip.
    add(PRIM.cyl, intake, {
      scale: [nacelleR * 1.86, nacelleR * 0.3, nacelleR * 1.86],
      rot: [Math.PI / 2, 0, 0],
      pos: [x, engineY, engineZ - nacelleR * 1.28],
    })
    // Pylon connecting nacelle to the wing.
    add(PRIM.box, trim, {
      scale: [nacelleR * 0.36, wingY - engineY + nacelleR * 0.4, nacelleR * 1.5],
      pos: [x, (wingY + engineY) / 2 + nacelleR * 0.15, engineZ + nacelleR * 0.2],
    })
  }

  /* ---- empennage --------------------------------------------------- */
  const finZ = barrelLen / 2 + L * 0.16
  // Vertical fin, swept back via a slight X rotation.
  add(PRIM.box, shell, {
    scale: [0.28, finH, L * 0.15],
    pos: [0, axis + R * 0.55 + finH / 2, finZ],
    rot: [-0.22, 0, 0],
  })
  // Dorsal fillet blending into the fin.
  add(PRIM.box, shell, {
    scale: [0.32, finH * 0.36, L * 0.09],
    pos: [0, axis + R * 0.6 + finH * 0.16, finZ - L * 0.08],
    rot: [-0.62, 0, 0],
  })
  // Horizontal stabilizers.
  for (const side of [-1, 1]) {
    add(PRIM.box, shell, {
      scale: [L * 0.13, 0.18, L * 0.075],
      pos: [side * L * 0.06, axis + R * 0.5, finZ + L * 0.008],
      rot: [0, side * 0.18, 0],
    })
  }

  /* ---- landing gear ------------------------------------------------ */
  const gear: Array<[number, number, number]> = [
    // x, z, wheel radius
    [0, -barrelLen * 0.38, 0.38],
    [-R * 0.62, barrelLen * 0.1, 0.56],
    [R * 0.62, barrelLen * 0.1, 0.56],
    [-R * 0.62, barrelLen * 0.2, 0.56],
    [R * 0.62, barrelLen * 0.2, 0.56],
  ]
  for (const [x, z, r] of gear) {
    add(PRIM.cyl, strut, { scale: [0.15, axis - R - 0.1, 0.15], pos: [x, axis - R * 0.55, z] })
    add(PRIM.cyl, tyre, {
      scale: [r * 2, 0.28, r * 2],
      rot: [0, 0, Math.PI / 2],
      pos: [x, r, z],
    })
  }

  const group = batch.build(`aircraft:${opts.type}`)

  // Navigation lights: separate meshes because the beacon blinks.
  const beacon = part(PRIM.sphere, beaconMat(), {
    scale: [0.6, 0.6, 0.6],
    pos: [0, axis + R * 0.55 + finH + 0.25, finZ - L * 0.02],
    castShadow: false,
  })
  group.add(beacon)

  const navRed = part(PRIM.sphere, LIGHT_RED, {
    scale: [0.5, 0.5, 0.5],
    pos: [-halfSpan - 0.05, wingY + inboard * Math.tan(dihedral), rootZ + chord * 0.22],
    castShadow: false,
  })
  group.add(navRed)

  const navGreen = part(PRIM.sphere, LIGHT_GREEN, {
    scale: [0.5, 0.5, 0.5],
    pos: [halfSpan + 0.05, wingY + inboard * Math.tan(dihedral), rootZ + chord * 0.22],
    castShadow: false,
  })
  group.add(navGreen)

  return { group, length: L, wingspan, beacon, navRed, navGreen }
}
