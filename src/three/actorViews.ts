/**
 * Actor views: one scene graph per actor, plus its translucent ghost hull,
 * text label and selection ring.
 *
 * The view owns no timing state. `applyPose()` is idempotent, so the
 * controller can call it for every actor on every scrub tick: models are built
 * once and scrubbing only writes transforms and a few material uniforms.
 *
 * ---- Translucency / occlusion contract ---------------------------------
 * Solid models are opaque (depth write on), so aircraft, vehicles and crew
 * occlude each other correctly by depth.
 *
 * Ghost hulls are translucent and must never fight the depth buffer:
 *   - `depthWrite: false`  → a ghost never hides anything behind it;
 *   - `depthTest: true`    → a solid model in front of a ghost still hides it,
 *                            because the opaque pass already filled depth;
 *   - two passes per hull  → BackSide (renderOrder 10) draws before FrontSide
 *                            (11), so the hull's own far and near faces blend
 *                            in the correct order no matter where the camera is;
 *   - `renderOrder` >= 10 keeps every ghost after the opaque scene and after
 *     the flat ground markings (order 1), while labels sit at 20+.
 * Ghosts are also depth-sorted back-to-front among themselves by assigning a
 * renderOrder band derived from camera distance each frame.
 */

import * as THREE from 'three'
import type { ActorSpec, ActorPose, CrewRole, StandSpec } from '../domain/model'
import { buildAircraft, type AircraftModel } from './models/aircraft'
import { buildCrew, crewVestColor, type CrewModel } from './models/crew'
import { buildVehicle, type VehicleModel } from './models/vehicles'
import { hullMaterial, PRIM } from './models/primitives'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { createLabel, type LabelHandle } from './labels'

export interface ActorView {
  spec: ActorSpec
  root: THREE.Group
  model: THREE.Group
  label: LabelHandle | null
  ghost: THREE.Group
  ghostBack: THREE.Mesh[]
  ghostFront: THREE.Mesh[]
  ghostLines: THREE.LineSegments[]
  ring: THREE.Mesh
  /** Meshes used for picking (solid model only). */
  pickTargets: THREE.Object3D[]
  /** Structural size in meters, for label height and ring radius. */
  span: number
  vehicle?: VehicleModel
  aircraft?: AircraftModel
  crew?: CrewModel
}

const RING_GEO = new THREE.RingGeometry(0.82, 1, 56)
RING_GEO.rotateX(-Math.PI / 2)

interface HullShape {
  pos: [number, number, number]
  scale: [number, number, number]
  rot?: [number, number, number]
}

function hullShapes(spec: ActorSpec): HullShape[] {
  switch (spec.kind) {
    case 'fuelTruck':
      return [
        { pos: [0, 1.85, 0.6], scale: [2.6, 2.5, 6.0] },
        { pos: [0, 1.6, 3.45], scale: [2.5, 1.75, 2.2] },
      ]
    case 'bus':
      return [{ pos: [0, 2.0, 0], scale: [2.55, 2.5, 11.5] }]
    case 'baggageTractor':
      return [{ pos: [0, 1.2, 0], scale: [1.7, 1.7, 4.6] }]
    case 'baggageCart':
      return [{ pos: [0, 0.75, 0], scale: [1.5, 1.1, 3.0] }]
    default:
      return []
  }
}

function buildGhostHull(spec: ActorSpec): {
  group: THREE.Group
  back: THREE.Mesh[]
  front: THREE.Mesh[]
  lines: THREE.LineSegments[]
} {
  const group = new THREE.Group()
  group.name = `ghost:${spec.id}`
  group.visible = false
  const back: THREE.Mesh[] = []
  const front: THREE.Mesh[] = []
  const lines: THREE.LineSegments[] = []

  const shapes = hullShapes(spec)
  if (shapes.length === 0) return { group, back, front, lines }

  // Merge every hull box for one side into a single geometry: two draws per
  // vehicle instead of 2×shapes, which matters when 15 vehicles each carry a
  // ghost.
  const bake = (side: THREE.Side): THREE.BufferGeometry | null => {
    const parts: THREE.BufferGeometry[] = []
    for (const s of shapes) {
      const g = PRIM.box.clone().toNonIndexed()
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(...s.pos),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(...(s.rot ?? [0, 0, 0]))),
        new THREE.Vector3(...s.scale),
      )
      g.applyMatrix4(m)
      parts.push(g)
    }
    const merged = parts.length === 1 ? parts[0] : mergeGeometries(parts, false)
    parts.forEach((g) => g.dispose())
    void side
    return merged
  }

  for (const [side, opacity] of [
    [THREE.BackSide, 0.15],
    [THREE.FrontSide, 0.12],
  ] as Array<[THREE.Side, number]>) {
    const geo = bake(side)
    if (!geo) continue
    const mesh = new THREE.Mesh(geo, hullMaterial(spec.color, side, opacity))
    mesh.renderOrder = side === THREE.BackSide ? 10 : 11
    mesh.userData.ghost = true
    mesh.castShadow = false
    mesh.receiveShadow = false
    group.add(mesh)
    if (side === THREE.BackSide) back.push(mesh)
    else front.push(mesh)
  }

  // One LineSegments for every hull edge.
  const lineParts: THREE.BufferGeometry[] = []
  for (const s of shapes) {
    const edges = new THREE.EdgesGeometry(PRIM.box)
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...s.pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(s.rot ?? [0, 0, 0]))),
      new THREE.Vector3(...s.scale),
    )
    edges.applyMatrix4(m)
    lineParts.push(edges)
  }
  const lineGeo =
    lineParts.length === 1 ? lineParts[0] : mergeGeometries(lineParts, false)
  lineParts.forEach((g) => g.dispose())
  if (lineGeo) {
    const lineMat = new THREE.LineBasicMaterial({
      color: spec.color,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    })
    const seg = new THREE.LineSegments(lineGeo, lineMat)
    seg.renderOrder = 12
    group.add(seg)
    lines.push(seg)
  }

  return { group, back, front, lines }
}

export function buildActorView(spec: ActorSpec, stand?: StandSpec): ActorView {
  const root = new THREE.Group()
  root.name = `actor:${spec.id}`
  root.userData.actorId = spec.id

  let vehicle: VehicleModel | undefined
  let aircraft: AircraftModel | undefined
  let crew: CrewModel | undefined
  let model: THREE.Group
  let span = 3

  if (spec.kind === 'aircraft') {
    aircraft = buildAircraft({
      type: stand?.aircraftType ?? 'A320',
      length: stand?.aircraftLength ?? 37.6,
      wingspan: stand?.aircraftWingspan ?? 35.8,
      livery: spec.color,
    })
    model = aircraft.group
    span = aircraft.length
  } else if (spec.kind === 'groundCrew') {
    crew = buildCrew((spec.role ?? '机务') as CrewRole)
    model = crew.group
    span = 2.2
  } else {
    vehicle = buildVehicle(spec.kind, spec.color)
    model = vehicle.group
    span = vehicle.footprint.length
  }

  const pickTargets: THREE.Object3D[] = []
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.userData.actorId = spec.id
      pickTargets.push(child)
    }
  })
  root.add(model)

  // Selection / hover ring on the apron floor.
  const ring = new THREE.Mesh(
    RING_GEO,
    new THREE.MeshBasicMaterial({
      color: '#fbbf24',
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  )
  ring.scale.setScalar(Math.max(1.4, span * 0.42))
  ring.position.y = 0.07
  ring.visible = false
  ring.renderOrder = 4
  root.add(ring)

  const ghost = buildGhostHull(spec)
  root.add(ghost.group)

  let label: LabelHandle | null = null
  if (spec.kind === 'groundCrew') {
    const role = (spec.role ?? '机务') as CrewRole
    label = createLabel({
      id: `${spec.id}:label`,
      text: role,
      color: '#06121f',
      x: 0,
      y: 2.85,
      z: 0,
      fontSize: 0.58,
      chip: crewVestColor(role),
    })
    // NOTE: the label is added to the scene, not to `root`, so it can be
    // billboarded independently of the actor's yaw. The controller positions
    // it from the pose every frame.
  }

  return {
    spec,
    root,
    model,
    label,
    ghost: ghost.group,
    ghostBack: ghost.back,
    ghostFront: ghost.front,
    ghostLines: ghost.lines,
    ring,
    pickTargets,
    span,
    vehicle,
    aircraft,
    crew,
  }
}

export interface PoseOptions {
  selected: boolean
  hovered: boolean
  /** Wall-clock seconds, used only for cosmetic cycles. */
  seconds: number
}

/**
 * Write a pose onto the view. Cheap: a handful of transform writes plus two
 * uniform updates. Called for every actor on every scrub tick.
 *
 * Note: crew labels are positioned and billboarded by the scene controller,
 * because they live at scene level rather than under the actor root.
 */
export function applyPose(view: ActorView, pose: ActorPose, opts: PoseOptions): void {
  const { root } = view
  root.position.set(pose.x, 0, pose.z)
  root.rotation.y = pose.yaw
  root.visible = pose.visible

  // --- cosmetic cycles (never affect position) -----------------------
  if (view.aircraft) {
    const blink = Math.sin(opts.seconds * Math.PI * 1.6) > 0.4 ? 1 : 0
    const mat = view.aircraft.beacon.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 1.0 + blink * 2.0
  }
  if (view.vehicle?.beacon) {
    view.vehicle.beacon.visible = pose.active && Math.sin(opts.seconds * Math.PI * 4) > 0
  }
  if (view.crew) {
    const walking = pose.active && !pose.parked
    view.model.position.y = walking
      ? Math.abs(Math.sin(opts.seconds * Math.PI * 5)) * 0.07
      : 0
    view.model.rotation.z = walking ? Math.sin(opts.seconds * Math.PI * 5) * 0.05 : 0
  }

  // --- selection ring -------------------------------------------------
  view.ring.visible = opts.selected || opts.hovered
  if (view.ring.visible) {
    const mat = view.ring.material as THREE.MeshBasicMaterial
    mat.color.set(opts.selected ? '#fbbf24' : '#93c5fd')
    mat.opacity = pose.active ? 0.95 : 0.45
  }

  // --- label ----------------------------------------------------------
  if (view.label) {
    view.label.setVisible(pose.visible)
    view.label.setOpacity(pose.visible ? (pose.active ? 1 : 0.6) : 0)
    view.label.setHighlight(opts.selected)
  }
}

/**
 * Show or hide a view's ghost hull and set its opacity. The caller is
 * responsible for having positioned `view.ghost` (it lives under the actor
 * root, so it usually needs a local offset).
 */
export function setGhost(
  view: ActorView,
  visible: boolean,
  opacity: number,
  depthBias = 0,
): void {
  view.ghost.visible = visible
  if (!visible) return

  for (const m of view.ghostBack) {
    ;(m.material as THREE.MeshBasicMaterial).opacity = 0.15 * opacity
    m.renderOrder = 10 + depthBias * 2
  }
  for (const m of view.ghostFront) {
    ;(m.material as THREE.MeshBasicMaterial).opacity = 0.12 * opacity
    m.renderOrder = 11 + depthBias * 2
  }
  for (const l of view.ghostLines) {
    ;(l.material as THREE.LineBasicMaterial).opacity = 0.55 * opacity
    l.renderOrder = 12 + depthBias * 2
  }
}
/**
 * Release per-view resources. Primitive geometries and materials are shared
 * via caches, so only the bespoke per-view geometry (ghost edges) is disposed.
 */
export function disposeActorView(view: ActorView): void {
  view.label?.dispose()
  for (const line of view.ghostLines) line.geometry.dispose()
  view.root.removeFromParent()
}
