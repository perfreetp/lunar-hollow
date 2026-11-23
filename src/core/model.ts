import type { Vec3 } from './math';

/* ------------------------------------------------------------------ *
 * Domain model for the suspension corner rig.
 * All lengths are millimetres, angles in degrees unless the name says Rad.
 * ------------------------------------------------------------------ */

export type PartKind = 'lowerArm' | 'upperArm' | 'knuckle' | 'tieRod';

export const PART_KINDS: PartKind[] = ['lowerArm', 'upperArm', 'knuckle', 'tieRod'];

export type SocketId = 'lowerPivot' | 'upperPivot' | 'knuckleSeat' | 'rackEnd';

export interface SocketSpec {
  id: SocketId;
  part: PartKind;
  label: string;
  hint: string;
  /** Anchor used for screen-space snapping + deviation measurement. */
  anchor: Vec3;
  /** Pivot axis direction for A-arms (unit); null for ball-seat sockets. */
  axis: Vec3 | null;
  /** Half-length of the pivot bracket, used to draw the axis extent. */
  halfSpan: number;
  accepts: PartKind;
}

export interface AssemblyConnection {
  part: PartKind;
  socket: SocketId;
  /** 3D miss distance (mm) at the moment the part was dropped. */
  dropDeviation: number;
  /** Pin the part to the socket even though deviation is above tolerance. */
  forced: boolean;
  pinnedAt: number;
}

export interface AssemblyState {
  order: PartKind[];
  connections: Partial<Record<PartKind, AssemblyConnection>>;
  toleranceMm: number;
}

export interface TravelSettings {
  /** upward wheel travel from the design static pose (mm) */
  up: number;
  /** downward travel from the design static pose (mm) */
  down: number;
  /** shock preload (mm of spring free length) */
  preload: number;
  /** steering rack travel (mm, + = to the right / outboard) */
  rackTravel: number;
}

export interface SuspensionDims {
  lowerArmLength: number;
  upperArmLength: number;
  tieRodLength: number;
  kingpinLength: number;
  lowerStaticAngleDeg: number;
  hubOffset: number;
  hubHeight: number;
  steerArmLateral: number;
  steerArmLongitudinal: number;
  wheelRadius: number;
  wheelWidth: number;
}

export type LayerId = 'chassis' | 'shock' | 'wheel';

export const LAYER_IDS: LayerId[] = ['chassis', 'shock', 'wheel'];

export const LAYER_LABELS: Record<LayerId, string> = {
  chassis: '车架',
  shock: '避震器',
  wheel: '轮毂',
};

export const LAYER_TONES: Record<LayerId, string> = {
  chassis: '#9aa8b8',
  shock: '#ffb347',
  wheel: '#5fd0c4',
};

export type RenderMode = 'opaque' | 'xray';

export interface RenderSettings {
  /** back → front draw order */
  layerOrder: LayerId[];
  mode: RenderMode;
  showOcclusionProbes: boolean;
  showContactMarkers: boolean;
  showSockets: boolean;
  showGrid: boolean;
  autoSpin: boolean;
}

export interface CameraView {
  alpha: number;
  beta: number;
  radius: number;
}

export interface LabConfig {
  format: 'rc-suspension-lab';
  version: 1;
  units: 'mm';
  exportedAt: string;
  dims: SuspensionDims;
  travel: TravelSettings;
  assembly: AssemblyState;
  render: Pick<RenderSettings, 'layerOrder'>;
  meta: {
    title: string;
    note: string;
    signature: string;
  };
}

/* ---------------- solver output ---------------- */

export type PoseIssue =
  | 'clamped'
  | 'upper-unreachable'
  | 'tie-unreachable'
  | 'non-finite'
  | 'preload-exceeds-droop';

export interface ShockState {
  top: Vec3;
  lower: Vec3;
  length: number;
  motionRatio: number;
  compression: number;
  freeLength: number;
  wheelRate: number;
}

export interface Pose {
  /** travel requested by the UI (mm relative to the design pose) */
  requestedTravel: number;
  /** travel the chain actually reached (mm) */
  travel: number;
  lowerAngleDeg: number;
  upperAngleDeg: number;
  steerDeg: number;
  lbj: Vec3;
  ubj: Vec3;
  kingpin: Vec3;
  tieOuter: Vec3;
  rackEnd: Vec3;
  wheelCenter: Vec3;
  wheelAxis: Vec3;
  wheelForward: Vec3;
  wheelUp: Vec3;
  wheelQuat: { x: number; y: number; z: number; w: number };
  camberDeg: number;
  toeDeg: number;
  halfTrack: number;
  scrubRadius: number;
  rideHeight: number;
  shock: ShockState;
  issues: PoseIssue[];
  residualKingpin: number;
  residualTieRod: number;
  /** residual of the tie-rod constraint at the static pose, mm */
  residualStatic: number;
}

export interface TravelCurveSample {
  lowerAngleDeg: number;
  travel: number;
  camberDeg: number;
  toeDeg: number;
  halfTrack: number;
  shockLength: number;
  valid: boolean;
}

export interface TravelCurve {
  samples: TravelCurveSample[];
  minTravel: number;
  maxTravel: number;
  staticTravel: number;
  effective: { up: number; down: number; preloadShift: number };
  issues: PoseIssue[];
}

/* ---------------- collision / occlusion ---------------- */

export interface BoxCollider {
  id: string;
  label: string;
  kind: 'chassis';
  center: Vec3;
  half: Vec3;
  /** Rotation about Z (deg), used to fan arch segments into an arc. */
  rotZ?: number;
}

export interface CapsuleCollider {
  id: string;
  label: string;
  kind: 'shock';
  a: Vec3;
  b: Vec3;
  radius: number;
}

export type StaticCollider = BoxCollider | CapsuleCollider;

export type ProbeGroup = 'wheel' | 'knuckle';

export interface Contact {
  probe: ProbeGroup;
  target: string;
  targetLabel: string;
  targetLayer: LayerId;
  depth: number;
  point: Vec3;
}

export interface ClearanceReport {
  chassis: number;
  shock: number;
  contacts: Contact[];
  minDepth: number;
  touching: string[];
}

export interface OcclusionBuckets {
  total: number;
  hidden: number;
}

export interface OcclusionReport {
  /** which layer is hidden from the camera by another layer */
  byGroup: Record<LayerId, OcclusionBuckets>;
  points: { layer: LayerId; position: Vec3; hidden: boolean }[];
  camera: Vec3;
  ratio: number;
  frame: number;
}

/* ---------------- diagnostics ---------------- */

export interface FrameDiagnostics {
  fps: number;
  frameMs: number;
  solveMs: number;
  collisionMs: number;
  occlusionMs: number;
  solves: number;
  frame: number;
  activeMeshes: number;
  drawCalls: number;
  perFrameSolve: boolean;
}

export interface ValidationMessage {
  level: 'info' | 'warn' | 'error';
  code: string;
  message: string;
}
