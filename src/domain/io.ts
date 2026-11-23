/**
 * Scenario import / export.
 *
 * The export file is a superset of the scenario: it carries the playhead and
 * view preferences so "导入回放" restores the session, not just the data.
 * Imports accept either the wrapper or a bare Scenario, and are validated
 * before anything touches the store.
 */

import type {
  ActorKind,
  ActorSpec,
  PathNode,
  RouteSegment,
  Scenario,
  StandSpec,
} from './model'

export const EXPORT_FORMAT = 'apron-sequence' as const
export const EXPORT_VERSION = 1 as const

export interface ViewSnapshot {
  /** Playhead position in minutes. */
  minute: number
  /** Active stand filter, or 'all'. */
  standId: string
  viewMode: 'perspective' | 'orthographic'
  camera: {
    position: [number, number, number]
    target: [number, number, number]
    fov?: number
    zoom?: number
  }
}

export interface AnimationExport {
  format: typeof EXPORT_FORMAT
  version: typeof EXPORT_VERSION
  exportedAt: string
  scenario: Scenario
  view?: ViewSnapshot
}

const ACTOR_KINDS: ActorKind[] = [
  'aircraft',
  'fuelTruck',
  'bus',
  'baggageTractor',
  'baggageCart',
  'groundCrew',
]

const VEHICLE_ACTOR_KINDS: ActorKind[] = [
  'fuelTruck',
  'bus',
  'baggageTractor',
  'baggageCart',
]

export function isVehicleKind(kind: ActorKind): boolean {
  return VEHICLE_ACTOR_KINDS.includes(kind)
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  scenario?: Scenario
  view?: ViewSnapshot
}

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v)

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

function readNode(raw: unknown, path: string, errors: string[]): PathNode | null {
  if (!isRecord(raw)) {
    errors.push(`${path}: 路径点必须是对象`)
    return null
  }
  if (!isFiniteNumber(raw.x) || !isFiniteNumber(raw.z)) {
    errors.push(`${path}: 缺少有效的 x / z 坐标`)
    return null
  }
  if (raw.hold !== undefined && (!isFiniteNumber(raw.hold) || raw.hold < 0)) {
    errors.push(`${path}: hold 必须是非负数字`)
    return null
  }
  return { x: raw.x, z: raw.z, hold: raw.hold as number | undefined }
}

function readSegment(raw: unknown, path: string, errors: string[]): RouteSegment | null {
  if (!isRecord(raw)) {
    errors.push(`${path}: 任务段必须是对象`)
    return null
  }
  if (!isFiniteNumber(raw.start) || !isFiniteNumber(raw.end)) {
    errors.push(`${path}: 任务段缺少 start / end`)
    return null
  }
  if (raw.end < raw.start) {
    errors.push(`${path}: 任务段 end(${raw.end}) 早于 start(${raw.start})`)
    return null
  }
  if (!Array.isArray(raw.nodes) || raw.nodes.length === 0) {
    errors.push(`${path}: 任务段至少需要一个路径点`)
    return null
  }
  const nodes: PathNode[] = []
  raw.nodes.forEach((n, i) => {
    const node = readNode(n, `${path}.nodes[${i}]`, errors)
    if (node) nodes.push(node)
  })
  if (nodes.length !== raw.nodes.length) return null
  return {
    start: raw.start,
    end: raw.end,
    label: typeof raw.label === 'string' ? raw.label : undefined,
    nodes,
  }
}

function readActor(
  raw: unknown,
  path: string,
  standIds: Set<string>,
  errors: string[],
): ActorSpec | null {
  if (!isRecord(raw)) {
    errors.push(`${path}: 作业对象必须是对象`)
    return null
  }
  const { id, kind, name, stand, color } = raw
  if (typeof id !== 'string' || !id) {
    errors.push(`${path}: 缺少 id`)
    return null
  }
  if (typeof kind !== 'string' || !ACTOR_KINDS.includes(kind as ActorKind)) {
    errors.push(`${path}: 未知的作业类型 "${String(kind)}"`)
    return null
  }
  if (typeof name !== 'string' || !name) {
    errors.push(`${path}: 缺少 name`)
    return null
  }
  if (typeof stand !== 'string' || !standIds.has(stand)) {
    errors.push(`${path}: 引用了不存在的机位 "${String(stand)}"`)
    return null
  }
  if (typeof color !== 'string' || !/^#[0-9a-fA-F]{3,8}$/.test(color)) {
    errors.push(`${path}: color 必须是 #RRGGBB 形式的颜色`)
    return null
  }
  if (raw.facing !== undefined && !isFiniteNumber(raw.facing)) {
    errors.push(`${path}: facing 必须是数字（角度）`)
    return null
  }
  if (raw.anchor !== undefined) {
    const a = raw.anchor
    if (!isRecord(a) || !isFiniteNumber(a.x) || !isFiniteNumber(a.z)) {
      errors.push(`${path}: anchor 必须是 {x,z}`)
      return null
    }
  }

  const actorKind = kind as ActorKind
  const segments: RouteSegment[] = []
  if (raw.segments !== undefined) {
    if (!Array.isArray(raw.segments)) {
      errors.push(`${path}: segments 必须是数组`)
      return null
    }
    raw.segments.forEach((s, i) => {
      const seg = readSegment(s, `${path}.segments[${i}]`, errors)
      if (seg) segments.push(seg)
    })
  }

  if (segments.length === 0 && actorKind !== 'groundCrew' && !raw.anchor) {
    errors.push(`${path}: 非人员对象需要任务段或 anchor`)
    return null
  }
  if (actorKind === 'groundCrew' && segments.length === 0 && !raw.anchor) {
    errors.push(`${path}: 人员需要任务段或固定岗位 anchor`)
    return null
  }

  return {
    id,
    kind: actorKind,
    name,
    stand,
    color,
    role: typeof raw.role === 'string' ? (raw.role as ActorSpec['role']) : undefined,
    yaw: isFiniteNumber(raw.yaw) ? raw.yaw : undefined,
    facing: isFiniteNumber(raw.facing) ? raw.facing : undefined,
    anchor: raw.anchor
      ? { x: (raw.anchor as { x: number }).x, z: (raw.anchor as { z: number }).z }
      : undefined,
    segments,
  }
}

function readStand(raw: unknown, path: string, errors: string[]): StandSpec | null {
  if (!isRecord(raw)) {
    errors.push(`${path}: 机位必须是对象`)
    return null
  }
  const strings: Array<[string, unknown]> = [
    ['id', raw.id],
    ['label', raw.label],
    ['aircraftType', raw.aircraftType],
    ['flight', raw.flight],
  ]
  for (const [key, value] of strings) {
    if (typeof value !== 'string' || !value) {
      errors.push(`${path}: 缺少 ${key}`)
      return null
    }
  }
  if (!isRecord(raw.origin) || !isFiniteNumber(raw.origin.x) || !isFiniteNumber(raw.origin.z)) {
    errors.push(`${path}: origin 必须是 {x,z}`)
    return null
  }
  for (const key of ['heading', 'aircraftLength', 'aircraftWingspan'] as const) {
    if (!isFiniteNumber(raw[key])) {
      errors.push(`${path}: ${key} 必须是数字`)
      return null
    }
  }
  const dimensions = raw as { aircraftLength: number; aircraftWingspan: number }
  if (dimensions.aircraftLength <= 0 || dimensions.aircraftWingspan <= 0) {
    errors.push(`${path}: 飞机尺寸必须为正`)
    return null
  }
  return {
    id: raw.id as string,
    label: raw.label as string,
    origin: { x: raw.origin.x, z: raw.origin.z },
    heading: raw.heading as number,
    aircraftType: raw.aircraftType as string,
    aircraftLength: raw.aircraftLength as number,
    aircraftWingspan: raw.aircraftWingspan as number,
    flight: raw.flight as string,
  }
}

function readView(raw: unknown, duration: number, warnings: string[]): ViewSnapshot | undefined {
  if (!isRecord(raw)) return undefined
  const minute = isFiniteNumber(raw.minute) ? raw.minute : 0
  if (minute < 0 || minute > duration) {
    warnings.push('导入的播放位置超出现有时间轴，已截断到有效范围')
  }
  const camera = isRecord(raw.camera) ? raw.camera : null
  const vec3 = (v: unknown, fallback: [number, number, number]): [number, number, number] => {
    if (Array.isArray(v) && v.length === 3 && v.every(isFiniteNumber)) {
      return [v[0], v[1], v[2]]
    }
    return fallback
  }
  return {
    minute: Math.min(Math.max(minute, 0), duration),
    standId: typeof raw.standId === 'string' ? raw.standId : 'all',
    viewMode: raw.viewMode === 'orthographic' ? 'orthographic' : 'perspective',
    camera: camera
      ? {
          position: vec3(camera.position, [120, 150, 210]),
          target: vec3(camera.target, [0, 0, 0]),
          fov: isFiniteNumber(camera.fov) ? camera.fov : undefined,
          zoom: isFiniteNumber(camera.zoom) ? camera.zoom : undefined,
        }
      : { position: [120, 150, 210], target: [0, 0, 0] },
  }
}

export function validateScenario(raw: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isRecord(raw)) {
    return { ok: false, errors: ['文件内容不是 JSON 对象'], warnings }
  }

  let scenarioRaw: unknown = raw
  let viewRaw: unknown = undefined

  if (raw.format === EXPORT_FORMAT) {
    viewRaw = raw.view
    scenarioRaw = raw.scenario
  } else if (raw.scenario && isRecord(raw.scenario)) {
    viewRaw = raw.view
    scenarioRaw = raw.scenario
  }

  if (!isRecord(scenarioRaw)) {
    return { ok: false, errors: ['缺少 scenario 数据'], warnings }
  }
  const s = scenarioRaw

  if (s.version !== undefined && s.version !== 1) {
    errors.push(`不支持的版本号 ${String(s.version)}`)
  }
  if (!isRecord(s.meta)) {
    errors.push('缺少 meta 元信息')
    return { ok: false, errors, warnings }
  }
  const { name, startsAt } = s.meta
  const duration = isFiniteNumber(s.meta.duration) ? s.meta.duration : 0
  if (typeof name !== 'string') errors.push('meta.name 必须是字符串')
  if (typeof startsAt !== 'string' || Number.isNaN(Date.parse(startsAt))) {
    errors.push('meta.startsAt 必须是有效的 ISO 时间')
  }
  if (duration <= 0) {
    errors.push('meta.duration 必须是正数（分钟）')
  }
  if (errors.length) return { ok: false, errors, warnings }

  const stands: StandSpec[] = []
  if (!Array.isArray(s.stands) || s.stands.length === 0) {
    errors.push('stands 至少需要一个机位')
    return { ok: false, errors, warnings }
  }
  s.stands.forEach((stand, i) => {
    const parsed = readStand(stand, `stands[${i}]`, errors)
    if (parsed) stands.push(parsed)
  })
  const ids = new Set<string>()
  for (const stand of stands) {
    if (ids.has(stand.id)) errors.push(`机位 id 重复：${stand.id}`)
    ids.add(stand.id)
  }

  const actors: ActorSpec[] = []
  if (!Array.isArray(s.actors) || s.actors.length === 0) {
    errors.push('actors 至少需要一个作业对象')
  } else {
    s.actors.forEach((actor, i) => {
      const parsed = readActor(actor, `actors[${i}]`, ids, errors)
      if (parsed) actors.push(parsed)
    })
  }

  const actorIds = new Set<string>()
  for (const actor of actors) {
    if (actorIds.has(actor.id)) errors.push(`作业对象 id 重复：${actor.id}`)
    actorIds.add(actor.id)
    for (const seg of actor.segments ?? []) {
      if (seg.start < 0 || seg.end > duration + 1e-6) {
        warnings.push(
          `${actor.name}: 任务段 ${seg.start}-${seg.end} 超出时间轴 0-${duration}`,
        )
      }
    }
  }

  if (errors.length) return { ok: false, errors, warnings }

  const scenario: Scenario = {
    version: 1,
    meta: { name: name as string, startsAt: startsAt as string, duration },
    stands,
    actors,
  }
  const view = readView(viewRaw, duration, warnings)
  return { ok: true, errors, warnings, scenario, view }
}

export function buildExport(
  scenario: Scenario,
  view: ViewSnapshot | undefined,
  now: Date = new Date(),
): AnimationExport {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    scenario,
    view,
  }
}

export function serializeExport(payload: AnimationExport): string {
  return JSON.stringify(payload, null, 2)
}
