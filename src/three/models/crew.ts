/**
 * Ground crew figures.
 *
 * Low-poly figures: helmet, high-visibility vest, and a small direction arrow
 * at the feet so heading is legible from a top-down view. The role itself is
 * drawn by a troika text label above the figure (see labels.ts).
 */

import * as THREE from 'three'
import type { CrewRole } from '../../domain/model'
import { createBatch, PRIM, standard } from './primitives'

export interface CrewModel {
  group: THREE.Group
  /** Height of the head, where the label anchor sits. */
  headY: number
  vest: THREE.MeshStandardMaterial
}

const VEST_COLORS: Record<CrewRole, string> = {
  机务: '#34d399',
  加油: '#fbbf24',
  行李: '#a78bfa',
  摆渡: '#60a5fa',
  客舱: '#f472b6',
  航食: '#fb923c',
  清水: '#22d3ee',
  污水: '#a3e635',
  牵引: '#f87171',
  监护: '#e879f9',
}

const SKIN = standard('#d8a77a', { roughness: 0.72, metalness: 0 })
const TROUSERS = standard('#243044', { roughness: 0.85, metalness: 0.02 })
const BOOTS = standard('#111418', { roughness: 0.9, metalness: 0.05 })

export function crewVestColor(role: CrewRole): string {
  return VEST_COLORS[role] ?? '#34d399'
}

export function buildCrew(role: CrewRole): CrewModel {
  const vestColor = crewVestColor(role)
  const vest = standard(vestColor, {
    roughness: 0.55,
    metalness: 0.05,
    emissive: vestColor,
    emissiveIntensity: 0.12,
  })
  const helmetColor = role === '监护' ? '#f472b6' : '#f8fafc'
  const helmet = standard(helmetColor, { roughness: 0.35, metalness: 0.1 })
  const band = standard('#e2e8f0', { roughness: 0.3, metalness: 0.5 })
  const marker = standard(vestColor, {
    emissive: vestColor,
    emissiveIntensity: 0.3,
    roughness: 0.6,
  })

  const batch = createBatch()
  const add = batch.add

  // Legs + boots.
  for (const side of [-1, 1]) {
    add(PRIM.cyl, TROUSERS, { scale: [0.19, 0.78, 0.19], pos: [side * 0.13, 0.62, 0] })
    add(PRIM.box, BOOTS, { scale: [0.22, 0.14, 0.34], pos: [side * 0.13, 0.07, 0.05] })
  }

  // Hips, torso, vest, reflective bands.
  add(PRIM.box, TROUSERS, { scale: [0.44, 0.22, 0.27], pos: [0, 1.02, 0] })
  add(PRIM.box, vest, { scale: [0.5, 0.52, 0.3], pos: [0, 1.38, 0] })
  for (const y of [1.24, 1.5]) {
    add(PRIM.box, band, { scale: [0.52, 0.055, 0.32], pos: [0, y, 0] })
  }

  // Arms + hands.
  for (const side of [-1, 1]) {
    add(PRIM.cyl, vest, {
      scale: [0.15, 0.5, 0.15],
      pos: [side * 0.33, 1.36, 0],
      rot: [0, 0, side * 0.12],
    })
    add(PRIM.sphere, SKIN, { scale: [0.15, 0.15, 0.15], pos: [side * 0.37, 1.08, 0] })
  }

  // Head + helmet + brim.
  add(PRIM.sphere, SKIN, { scale: [0.27, 0.3, 0.27], pos: [0, 1.78, 0] })
  add(PRIM.sphere, helmet, { scale: [0.32, 0.26, 0.32], pos: [0, 1.87, -0.01] })
  add(PRIM.box, helmet, { scale: [0.34, 0.05, 0.12], pos: [0, 1.83, 0.16] })

  // Ground marker: facing wedge + ring so the figure reads from above.
  add(PRIM.cone, marker, {
    scale: [0.42, 0.34, 0.42],
    rot: [Math.PI / 2, 0, 0],
    pos: [0, 0.035, 0.52],
  })
  add(PRIM.torus, marker, {
    scale: [0.95, 0.95, 0.6],
    rot: [Math.PI / 2, 0, 0],
    pos: [0, 0.03, 0],
  })

  const g = batch.build(`crew:${role}`)
  return { group: g, headY: 2.15, vest }
}
