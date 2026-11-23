import type {
  AssemblyState,
  BoxCollider,
  CapsuleCollider,
  LayerId,
  PartKind,
  RenderSettings,
  SocketSpec,
  SuspensionDims,
  TravelSettings,
} from './model';
import { LAYER_IDS } from './model';
import { normalize, v3 } from './math';

/**
 * Fixed reference geometry of the rig (millimetres).
 *
 * Coordinate frame (right-handed):
 *   +X  outboard (right)
 *   +Y  up
 *   +Z  forward
 * The demo corner is the RIGHT front corner, so half-track runs along +X and
 * the ground plane sits at Y = 0.
 */
export const RIG = {
  /** Chassis-side lower A-arm pivot (fore-aft axle position). */
  lowerPivot: v3(58, 55, 0),
  /** Chassis-side upper A-arm pivot. */
  upperPivot: v3(72, 104, 0),
  /** Design-pose lower ball joint: where the knuckle socket anchor sits. */
  knuckleSeat: v3(152.818, 39.982, 0),
  /** Design-pose upper ball joint (upper-arm outboard eye). */
  upperSeat: v3(142.399, 99.071, 0),
  /** Inner tie-rod eye on the steering rack. */
  rackEnd: v3(66, 76, -36),
  /** Shock absorber upper eye on the tower. */
  shockTop: v3(76, 152, -30),
  /** A-arm pivot axis direction (fore-aft). */
  armAxis: v3(0, 0, 1),
  /** Shock lower eye sits this fraction along the lower arm. */
  shockArmFraction: 0.62,
  /** Offset of the shock lower eye from the lower-arm centre line. */
  shockLowerOffset: v3(0, 6, -16),
  /** Steering-arm height along the kingpin, as a fraction of its length. */
  steerArmFraction: 0.42,
  /**
   * Reference ground plane. The preview keeps the tyre on it and moves the body,
   * so this stays fixed while the rig root shifts by the travel.
   */
  groundY: 0,
  /** Bump-stop plane: the chain is not allowed past this wheel-centre height. */
  bumpStopY: 128,
  /** Half the wheel arch tube radius used for contact clearance scoring. */
  archRadius: 14,
} as const;

export const DEFAULT_DIMS: SuspensionDims = {
  lowerArmLength: 96,
  upperArmLength: 70.57,
  tieRodLength: 87.37,
  kingpinLength: 60,
  lowerStaticAngleDeg: 9,
  hubOffset: 10,
  hubHeight: 22,
  steerArmLateral: 4,
  steerArmLongitudinal: -30,
  wheelRadius: 62,
  wheelWidth: 44,
};

export const DEFAULT_TRAVEL: TravelSettings = {
  up: 26,
  down: 30,
  preload: 6,
  rackTravel: 0,
};

export const DEFAULT_LAYER_ORDER: LayerId[] = ['chassis', 'shock', 'wheel'];

export const DEFAULT_RENDER: RenderSettings = {
  layerOrder: [...DEFAULT_LAYER_ORDER],
  mode: 'opaque',
  showOcclusionProbes: false,
  showContactMarkers: true,
  showSockets: true,
  showGrid: true,
  autoSpin: false,
};

export const DEFAULT_TOLERANCE_MM = 9;
export const SNAP_PX = 70;

export const SOCKETS: SocketSpec[] = [
  {
    id: 'lowerPivot',
    part: 'lowerArm',
    label: '下摆臂轴位',
    hint: '把下摆臂拖到车身轴座',
    anchor: RIG.lowerPivot,
    axis: RIG.armAxis,
    halfSpan: 36,
    accepts: 'lowerArm',
  },
  {
    id: 'upperPivot',
    part: 'upperArm',
    label: '上摆臂轴位',
    hint: '把上摆臂拖到车身轴座',
    anchor: RIG.upperPivot,
    axis: RIG.armAxis,
    halfSpan: 30,
    accepts: 'upperArm',
  },
  {
    id: 'knuckleSeat',
    part: 'knuckle',
    label: '转向节座',
    hint: '把转向节拖到球头位',
    anchor: RIG.knuckleSeat,
    axis: null,
    halfSpan: 0,
    accepts: 'knuckle',
  },
  {
    id: 'rackEnd',
    part: 'tieRod',
    label: '齿条端',
    hint: '把拉杆拖到齿条球头',
    anchor: RIG.rackEnd,
    axis: null,
    halfSpan: 0,
    accepts: 'tieRod',
  },
];

export const SOCKET_BY_ID: ReadonlyMap<string, SocketSpec> = new Map(
  SOCKETS.map((s) => [s.id, s] as const),
);

export const PART_ORDER: PartKind[] = ['lowerArm', 'upperArm', 'knuckle', 'tieRod'];

/** Parts can only be installed once their supporting parts exist. */
export const PART_PREREQUISITES: Record<PartKind, PartKind[]> = {
  lowerArm: [],
  upperArm: ['lowerArm'],
  knuckle: ['lowerArm', 'upperArm'],
  tieRod: ['lowerArm', 'upperArm', 'knuckle'],
};

export interface PartInfo {
  label: string;
  english: string;
  blurb: string;
  tone: string;
  dimKey: keyof SuspensionDims;
  socket: SocketSpec['id'];
  anchor: { x: number; y: number; z: number };
}

export const PART_INFO: Record<PartKind, PartInfo> = {
  lowerArm: {
    label: '下摆臂',
    english: 'Lower A-Arm',
    blurb: '承载主簧，决定轮心高度与横向摆幅',
    tone: '#4fd1c5',
    dimKey: 'lowerArmLength',
    socket: 'lowerPivot',
    anchor: RIG.lowerPivot,
  },
  upperArm: {
    label: '上摆臂',
    english: 'Upper A-Arm',
    blurb: '与下摆臂一起约束主销内倾与外倾曲线',
    tone: '#63b3ed',
    dimKey: 'upperArmLength',
    socket: 'upperPivot',
    anchor: RIG.upperPivot,
  },
  knuckle: {
    label: '转向节',
    english: 'Knuckle',
    blurb: '连接上下球头与轮毂，承受侧向载荷',
    tone: '#f6ad55',
    dimKey: 'kingpinLength',
    socket: 'knuckleSeat',
    anchor: RIG.knuckleSeat,
  },
  tieRod: {
    label: '转向拉杆',
    english: 'Tie Rod',
    blurb: '把齿条位移传到转向臂，控制前束角',
    tone: '#b794f4',
    dimKey: 'tieRodLength',
    socket: 'rackEnd',
    anchor: RIG.rackEnd,
  },
};

export function initialAssembly(toleranceMm = DEFAULT_TOLERANCE_MM): AssemblyState {
  return {
    order: [...PART_ORDER],
    connections: {
      lowerArm: { part: 'lowerArm', socket: 'lowerPivot', dropDeviation: 0, forced: false, pinnedAt: 0 },
      upperArm: { part: 'upperArm', socket: 'upperPivot', dropDeviation: 0, forced: false, pinnedAt: 0 },
      knuckle: { part: 'knuckle', socket: 'knuckleSeat', dropDeviation: 0, forced: false, pinnedAt: 0 },
      tieRod: { part: 'tieRod', socket: 'rackEnd', dropDeviation: 0, forced: false, pinnedAt: 0 },
    },
    toleranceMm,
  };
}

/** Chassis colliders: the static geometry the moving corner can hit. */
export const CHASSIS_BOXES: BoxCollider[] = [
  {
    // Floor plate of the tub. Everything static lives inboard of the pivots.
    id: 'floor',
    label: '底板',
    kind: 'chassis',
    center: v3(44, 13, 0),
    half: v3(52, 6, 78),
  },
  {
    id: 'sideWallL',
    label: '左侧板',
    kind: 'chassis',
    center: v3(30, 78, 68),
    half: v3(36, 58, 4.5),
  },
  {
    id: 'sideWallR',
    label: '右侧板',
    kind: 'chassis',
    center: v3(30, 78, -68),
    half: v3(36, 58, 4.5),
  },
  {
    id: 'bulkhead',
    label: '前隔板',
    kind: 'chassis',
    center: v3(30, 78, 0),
    half: v3(5, 58, 62),
  },
  {
    id: 'tower',
    label: '避震塔',
    kind: 'chassis',
    center: v3(70, 132, -30),
    half: v3(15, 28, 12),
  },
  {
    // Underside of the arch roof: the surface the tyre rubs in deep bump.
    id: 'arch',
    label: '轮眉上沿',
    kind: 'chassis',
    center: v3(163, 158, 0),
    half: v3(62, 7, 28),
  },
];

/** Shock body/capsule is rebuilt every frame from the poses' two eyes. */
export function shockCollider(top: { x: number; y: number; z: number }, lower: { x: number; y: number; z: number }): CapsuleCollider {
  return {
    id: 'shock',
    label: '避震器',
    kind: 'shock',
    a: top,
    b: lower,
    radius: 11,
  };
}

export const DIM_META: {
  key: keyof SuspensionDims;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group: 'arm' | 'wheel';
}[] = [
  { key: 'lowerArmLength', label: '下摆臂长', unit: 'mm', min: 60, max: 132, step: 0.5, group: 'arm' },
  { key: 'upperArmLength', label: '上摆臂长', unit: 'mm', min: 48, max: 118, step: 0.5, group: 'arm' },
  { key: 'tieRodLength', label: '拉杆长', unit: 'mm', min: 70, max: 150, step: 0.5, group: 'arm' },
  { key: 'kingpinLength', label: '主销长', unit: 'mm', min: 42, max: 96, step: 0.5, group: 'arm' },
  { key: 'lowerStaticAngleDeg', label: '静态臂角', unit: '°', min: -2, max: 24, step: 0.5, group: 'arm' },
  { key: 'steerArmLateral', label: '转向臂横向', unit: 'mm', min: -20, max: 30, step: 0.5, group: 'arm' },
  { key: 'steerArmLongitudinal', label: '转向臂纵向', unit: 'mm', min: -70, max: 12, step: 0.5, group: 'arm' },
  { key: 'hubOffset', label: '轮心偏距', unit: 'mm', min: -6, max: 38, step: 0.5, group: 'wheel' },
  { key: 'hubHeight', label: '轮心高度', unit: 'mm', min: 8, max: 54, step: 0.5, group: 'wheel' },
  { key: 'wheelRadius', label: '轮胎半径', unit: 'mm', min: 44, max: 86, step: 0.5, group: 'wheel' },
  { key: 'wheelWidth', label: '轮胎宽度', unit: 'mm', min: 24, max: 70, step: 0.5, group: 'wheel' },
];

export const TRAVEL_META = {
  up: { label: '上行程', unit: 'mm', min: 4, max: 62, step: 1 },
  down: { label: '下行程', unit: 'mm', min: 4, max: 62, step: 1 },
  preload: { label: '预压量', unit: 'mm', min: 0, max: 30, step: 0.5 },
  rackTravel: { label: '齿条行程', unit: 'mm', min: -26, max: 26, step: 0.5 },
} as const;

export interface Preset {
  id: string;
  name: string;
  blurb: string;
  dims: Partial<SuspensionDims>;
  travel: Partial<TravelSettings>;
}

export const PRESETS: Preset[] = [
  {
    id: 'baseline',
    name: '出厂基准',
    blurb: '短行程越野基准，验证全链闭合',
    dims: { ...DEFAULT_DIMS },
    travel: { ...DEFAULT_TRAVEL },
  },
  {
    id: 'longtravel',
    name: '长行程',
    blurb: '加长摆臂 + 大行程，验证极限外倾',
    dims: {
      lowerArmLength: 112,
      upperArmLength: 84,
      tieRodLength: 102.8,
      kingpinLength: 62,
      lowerStaticAngleDeg: 12,
      hubOffset: 8,
      hubHeight: 24,
      steerArmLongitudinal: -38,
    },
    travel: { up: 46, down: 44, preload: 10, rackTravel: 0 },
  },
  {
    id: 'stance',
    name: '低趴姿态',
    blurb: '大预压 + 宽胎，压缩时轮眉穿插',
    dims: {
      lowerArmLength: 104,
      upperArmLength: 78,
      tieRodLength: 95.8,
      kingpinLength: 58,
      lowerStaticAngleDeg: 16,
      hubOffset: 14,
      hubHeight: 18,
      wheelRadius: 68,
      wheelWidth: 54,
      steerArmLongitudinal: -26,
    },
    travel: { up: 54, down: 22, preload: 18, rackTravel: 0 },
  },
];

export function sanitizeLayerOrder(order: readonly string[] | undefined): LayerId[] {
  const seen = new Set<LayerId>();
  const out: LayerId[] = [];
  for (const id of order ?? []) {
    if ((LAYER_IDS as readonly string[]).includes(id) && !seen.has(id as LayerId)) {
      seen.add(id as LayerId);
      out.push(id as LayerId);
    }
  }
  for (const id of LAYER_IDS) if (!seen.has(id)) out.push(id);
  return out;
}

/** Unit kingpin direction of the design pose, tilted by the KPI. */
export function designKingpinDirection(kpiDeg: number): { x: number; y: number; z: number } {
  const k = (kpiDeg * Math.PI) / 180;
  return normalize(v3(-Math.sin(k), Math.cos(k), 0));
}

export const DESIGN_KPI_DEG = 10;
