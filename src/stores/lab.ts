import { defineStore } from 'pinia';
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import type {
  AssemblyState,
  FrameDiagnostics,
  LabConfig,
  LayerId,
  OcclusionReport,
  PartKind,
  Pose,
  RenderSettings,
  SuspensionDims,
  TravelCurve,
  TravelSettings,
  ValidationMessage,
} from '../core/model';
import { LAYER_IDS } from '../core/model';
import type { ClearanceReport } from '../core/model';
import {
  DEFAULT_DIMS,
  DIM_META,
  DEFAULT_LAYER_ORDER,
  DEFAULT_RENDER,
  DEFAULT_TOLERANCE_MM,
  DEFAULT_TRAVEL,
  PART_INFO,
  PART_PREREQUISITES,
  PRESETS,
  SOCKETS,
  sanitizeLayerOrder,
} from '../core/rigSpec';
import {
  buildRigRef,
  computeTravelCurve,
  newSolveCache,
  solvePose,
  thetaForTravel,
  type RigRef,
  type SolveCache,
} from '../core/kinematics';
import {
  normalizeAssembly,
  normalizeDims,
  normalizeTravel,
  parseConfig,
  makeConfig,
  signConfig,
} from '../core/config';
import { clamp, roundTo } from '../core/math';

export interface DragState {
  active: boolean;
  part: PartKind | null;
  pointer: { x: number; y: number };
  slotId: string | null;
  slotScreen: { x: number; y: number } | null;
  snap: boolean;
  deviation: number;
  /** CSS px distance to the nearest accepting socket */
  pixelDistance: number;
}

export const useLabStore = defineStore('lab', () => {
  /* ----------------------------- state ----------------------------- */
  const dims = reactive<SuspensionDims>({ ...DEFAULT_DIMS });
  const travel = reactive<TravelSettings>({ ...DEFAULT_TRAVEL });
  const assembly = reactive<AssemblyState>({
    order: ['lowerArm', 'upperArm', 'knuckle', 'tieRod'],
    connections: {},
    toleranceMm: DEFAULT_TOLERANCE_MM,
  });
  for (const part of assembly.order) {
    const socket = PART_INFO[part].socket;
    assembly.connections[part] = {
      part,
      socket,
      dropDeviation: 0,
      forced: false,
      pinnedAt: 0,
    };
  }
  const render = reactive<RenderSettings>({
    ...DEFAULT_RENDER,
    layerOrder: [...DEFAULT_LAYER_ORDER],
  });
  const visible = reactive<Record<string, boolean>>({
    lowerArm: true,
    upperArm: true,
    knuckle: true,
    tieRod: true,
    wheel: true,
    shock: true,
  });

  const previewTravel = ref(0);
  const pinArm = ref(false);
  const armAngleDeg = ref<number | null>(null);
  const forceAttach = ref(false);
  const meta = reactive({ title: 'RC 悬挂姿态配置', note: '' });
  const messages = ref<ValidationMessage[]>([]);
  const diagnostics = shallowRef<FrameDiagnostics | null>(null);
  const occlusion = shallowRef<OcclusionReport | null>(null);
  const clearance = shallowRef<ClearanceReport>({
    chassis: 999,
    shock: 999,
    contacts: [],
    minDepth: 0,
    touching: [],
  });
  const dragState = reactive<DragState>({
    active: false,
    part: null,
    pointer: { x: 0, y: 0 },
    slotId: null,
    slotScreen: null,
    snap: false,
    deviation: 0,
    pixelDistance: Infinity,
  });
  const runtimeFlags = reactive({ fps: 0, dragging: false, cameraMoving: false });
  const lastExportAt = ref<string | null>(null);

  /* --------------------------- derived ---------------------------- */
  const rigRef = computed<RigRef>(() => buildRigRef({ ...dims }, { ...travel }));

  const curve = computed<TravelCurve>(() => {
    // Recompute whenever any geometry or travel input changes.
    const r = rigRef.value;
    void dims.lowerArmLength;
    void dims.upperArmLength;
    void dims.tieRodLength;
    void dims.kingpinLength;
    void dims.lowerStaticAngleDeg;
    void dims.steerArmLateral;
    void dims.steerArmLongitudinal;
    void dims.wheelRadius;
    void dims.wheelWidth;
    return computeTravelCurve(r, 81);
  });

  const cache: SolveCache = newSolveCache();
  const pose = shallowRef<Pose>(
    solvePose(buildRigRef({ ...DEFAULT_DIMS }, { ...DEFAULT_TRAVEL }), { travelRel: 0 }, cache),
  );

  /**
   * Solve the chain. The render loop calls this once per frame — that is what
   * makes the whole linkage re-solve every frame while the arm is dragged.
   */
  function recomputePose(): Pose {
    const r = rigRef.value;
    const next =
      pinArm.value && armAngleDeg.value !== null
        ? solvePose(r, { theta: (armAngleDeg.value * Math.PI) / 180 }, cache)
        : solvePose(r, { travelRel: previewTravel.value }, cache);
    pose.value = next;
    return next;
  }

  watch(
    () => [dims.lowerArmLength, dims.upperArmLength, dims.tieRodLength, dims.kingpinLength,
      dims.lowerStaticAngleDeg, dims.hubOffset, dims.hubHeight, dims.wheelRadius,
      dims.wheelWidth, dims.steerArmLateral, dims.steerArmLongitudinal,
      travel.up, travel.down, travel.preload, travel.rackTravel, previewTravel.value,
      pinArm.value, armAngleDeg.value],
    () => recomputePose(),
    { flush: 'sync' },
  );

  const installed = computed<Set<PartKind>>(() => new Set(assembly.order));
  const isInstalled = (part: PartKind) => installed.value.has(part);
  const nextSocket = computed(() => {
    for (const part of ['lowerArm', 'upperArm', 'knuckle', 'tieRod'] as PartKind[]) {
      if (!installed.value.has(part)) return SOCKETS.find((s) => s.accepts === part) ?? null;
    }
    return null;
  });
  const canInstall = (part: PartKind) =>
    PART_PREREQUISITES[part].every((p) => installed.value.has(p)) && !installed.value.has(part);

  const assemblyComplete = computed(() => installed.value.size === 4);

  const connectionIssues = computed(() => {
    const out: { part: PartKind; level: 'ok' | 'warn'; message: string }[] = [];
    for (const part of assembly.order) {
      const conn = assembly.connections[part];
      if (!conn) continue;
      const over = conn.dropDeviation > assembly.toleranceMm;
      out.push({
        part,
        level: over && !conn.forced ? 'warn' : 'ok',
        message: over
          ? conn.forced
            ? `偏差 ${conn.dropDeviation.toFixed(1)} mm · 已强制固定`
            : `偏差 ${conn.dropDeviation.toFixed(1)} mm · 超过阈值 ${assembly.toleranceMm} mm`
          : `偏差 ${conn.dropDeviation.toFixed(1)} mm`,
      });
    }
    return out;
  });

  const signature = computed(() =>
    signConfig({ dims: { ...dims }, travel: { ...travel }, assembly: toPlainAssembly() }),
  );

  const travelBounds = computed(() => ({
    min: -rigRef.value.limitDown,
    max: rigRef.value.limitUp,
    bump: rigRef.value.availableBump,
    droop: rigRef.value.availableDroop,
    preloadShift: rigRef.value.preloadLift,
  }));

  /* ---------------------------- actions ---------------------------- */

  function toPlainAssembly(): AssemblyState {
    return {
      order: [...assembly.order],
      toleranceMm: assembly.toleranceMm,
      connections: Object.fromEntries(
        Object.entries(assembly.connections).map(([k, v]) => [k, v ? { ...v } : v]),
      ) as AssemblyState['connections'],
    };
  }

  const DIM_LIMITS = new Map(DIM_META.map((m) => [m.key, m] as const));

  function setDim(key: keyof SuspensionDims, value: number) {
    const v = Number(value);
    if (!Number.isFinite(v)) return;
    // Clamp against that dimension's own UI range. A single global range would
    // silently destroy signed offsets such as the steering-arm position.
    const meta = DIM_LIMITS.get(key);
    dims[key] = roundTo(meta ? clamp(v, meta.min, meta.max) : v, 2);
  }

  function setTravel(key: keyof TravelSettings, value: number) {
    const v = Number(value);
    if (!Number.isFinite(v)) return;
    travel[key] = roundTo(clamp(v, -60, 120), 2);
    previewTravel.value = clamp(previewTravel.value, -rigRef.value.availableDroop, rigRef.value.availableBump);
  }

  function setPreviewTravel(value: number) {
    // The usable range is what is left after preload has eaten its share of the
    // bump travel, so the slider can never ask for a pose the chain cannot reach.
    const max = Math.max(0.5, rigRef.value.availableBump);
    const min = -Math.max(0.5, rigRef.value.availableDroop);
    previewTravel.value = roundTo(clamp(value, min, max), 2);
    pinArm.value = false;
    armAngleDeg.value = null;
  }

  function setArmAngle(degValue: number | null) {
    if (degValue === null) {
      pinArm.value = false;
      armAngleDeg.value = null;
      return;
    }
    pinArm.value = true;
    armAngleDeg.value = roundTo(degValue, 3);
  }

  function armAngleFromTravel(): number {
    const r = rigRef.value;
    return (thetaForTravel(r, r.preloadLift + previewTravel.value).theta * 180) / Math.PI;
  }

  function releaseArm() {
    if (pinArm.value && armAngleDeg.value !== null) {
      // Convert the pinned angle into an equivalent travel so the slider agrees.
      const r = rigRef.value;
      previewTravel.value = roundTo(pose.value.travel, 2);
      pinArm.value = false;
      armAngleDeg.value = null;
      void r;
    }
  }

  function stepTravel(delta: number) {
    setPreviewTravel(previewTravel.value + delta);
  }

  function attachPart(part: PartKind, deviation: number, forced: boolean): ValidationMessage {
    const socket = PART_INFO[part].socket;
    assembly.order = [...assembly.order.filter((p) => p !== part), part];
    // Keep canonical order so the chain reads correctly.
    const canonical: PartKind[] = ['lowerArm', 'upperArm', 'knuckle', 'tieRod'];
    assembly.order.sort((a, b) => canonical.indexOf(a) - canonical.indexOf(b));
    assembly.connections[part] = {
      part,
      socket,
      dropDeviation: roundTo(deviation, 2),
      forced,
      pinnedAt: Date.now(),
    };
    const over = deviation > assembly.toleranceMm;
    const msg: ValidationMessage = over && !forced
      ? {
          level: 'warn',
          code: 'deviation',
          message: `${PART_INFO[part].label} 落点偏差 ${deviation.toFixed(1)} mm，超过阈值 ${assembly.toleranceMm} mm`,
        }
      : {
          level: 'info',
          code: 'attach',
          message: `${PART_INFO[part].label} 已吸附到 ${socket}（偏差 ${deviation.toFixed(1)} mm）`,
        };
    messages.value = [msg, ...messages.value].slice(0, 6);
    return msg;
  }

  function detachPart(part: PartKind) {
    // Removing a part also removes everything that depends on it.
    const dependents = (['lowerArm', 'upperArm', 'knuckle', 'tieRod'] as PartKind[]).filter(
      (p) => PART_PREREQUISITES[p].includes(part) && installed.value.has(p),
    );
    const toRemove = new Set<PartKind>([part, ...dependents]);
    assembly.order = assembly.order.filter((p) => !toRemove.has(p));
    for (const p of toRemove) delete assembly.connections[p];
    const msg: ValidationMessage = {
      level: 'info',
      code: 'detach',
      message: `已拆下 ${[...toRemove].map((p) => PART_INFO[p].label).join('、')}`,
    };
    messages.value = [msg, ...messages.value].slice(0, 6);
  }

  function resetAssembly() {
    const fresh = normalizeAssembly({
      order: ['lowerArm', 'upperArm', 'knuckle', 'tieRod'],
      toleranceMm: assembly.toleranceMm,
      connections: {
        lowerArm: { part: 'lowerArm', socket: 'lowerPivot', dropDeviation: 0, forced: false, pinnedAt: 0 },
        upperArm: { part: 'upperArm', socket: 'upperPivot', dropDeviation: 0, forced: false, pinnedAt: 0 },
        knuckle: { part: 'knuckle', socket: 'knuckleSeat', dropDeviation: 0, forced: false, pinnedAt: 0 },
        tieRod: { part: 'tieRod', socket: 'rackEnd', dropDeviation: 0, forced: false, pinnedAt: 0 },
      },
    });
    assembly.order = fresh.order;
    assembly.connections = fresh.connections;
  }

  function clearAssembly() {
    assembly.order = [];
    assembly.connections = {};
    const msg: ValidationMessage = {
      level: 'info',
      code: 'clear',
      message: '零件库已清空，请从左侧重新拖入零件',
    };
    messages.value = [msg, ...messages.value].slice(0, 6);
  }

  function setTolerance(mm: number) {
    assembly.toleranceMm = roundTo(clamp(mm, 0.5, 40), 1);
  }

  function applyDims(partial: Partial<SuspensionDims>) {
    for (const [k, v] of Object.entries(partial)) {
      if (typeof v === 'number') setDim(k as keyof SuspensionDims, v);
    }
  }

  function applyTravel(partial: Partial<TravelSettings>) {
    for (const [k, v] of Object.entries(partial)) {
      if (typeof v === 'number') setTravel(k as keyof TravelSettings, v);
    }
  }

  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    applyDims({ ...DEFAULT_DIMS, ...preset.dims });
    applyTravel({ ...DEFAULT_TRAVEL, ...preset.travel });
    previewTravel.value = 0;
    pinArm.value = false;
    armAngleDeg.value = null;
  }

  function reorderLayers(next: LayerId[]) {
    render.layerOrder = sanitizeLayerOrder(next);
  }

  function moveLayer(layer: LayerId, dir: -1 | 1) {
    const order = [...render.layerOrder];
    const i = order.indexOf(layer);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    render.layerOrder = order;
  }

  function setRender<K extends keyof RenderSettings>(key: K, value: RenderSettings[K]) {
    render[key] = value;
  }

  function setVisible(part: string, on: boolean) {
    visible[part] = on;
  }

  function pushMessage(msg: ValidationMessage) {
    messages.value = [msg, ...messages.value].slice(0, 8);
  }

  function clearMessages() {
    messages.value = [];
  }

  /* --------------------------- config io --------------------------- */

  function buildConfig(): LabConfig {
    return makeConfig({
      dims: { ...dims },
      travel: { ...travel },
      assembly: toPlainAssembly(),
      layerOrder: render.layerOrder,
      title: meta.title,
      note: meta.note,
    });
  }

  function markExported(config: LabConfig) {
    lastExportAt.value = config.exportedAt;
  }

  function importConfigText(text: string): boolean {
    const result = parseConfig(text);
    messages.value = result.messages.length ? result.messages.slice(0, 8) : messages.value;
    if (!result.ok || !result.config) return false;
    const c = result.config;
    Object.assign(dims, normalizeDims(c.dims));
    Object.assign(travel, normalizeTravel(c.travel));
    const asm = normalizeAssembly(c.assembly);
    assembly.order = asm.order;
    assembly.connections = asm.connections;
    assembly.toleranceMm = asm.toleranceMm;
    render.layerOrder = sanitizeLayerOrder(c.render.layerOrder);
    meta.title = c.meta.title;
    meta.note = c.meta.note;
    previewTravel.value = 0;
    pinArm.value = false;
    armAngleDeg.value = null;
    pushMessage({
      level: 'info',
      code: 'import',
      message: `已导入配置 ${c.meta.signature || ''}（${asm.order.length}/4 个零件）`,
    });
    return true;
  }

  function resetAll() {
    Object.assign(dims, DEFAULT_DIMS);
    Object.assign(travel, DEFAULT_TRAVEL);
    assembly.toleranceMm = DEFAULT_TOLERANCE_MM;
    resetAssembly();
    render.layerOrder = [...DEFAULT_LAYER_ORDER];
    render.mode = 'opaque';
    previewTravel.value = 0;
    pinArm.value = false;
    armAngleDeg.value = null;
    meta.title = 'RC 悬挂姿态配置';
    meta.note = '';
  }

  /* -------------------------- diagnostics -------------------------- */

  function setDiagnostics(d: FrameDiagnostics | null) {
    diagnostics.value = d;
    if (d) runtimeFlags.fps = d.fps;
  }

  function setOcclusion(o: OcclusionReport | null) {
    occlusion.value = o;
  }

  function setClearance(c: ClearanceReport) {
    clearance.value = c;
  }

  const contactList = computed(() => clearance.value.contacts);

  const contactText = computed(() => {
    const c = clearance.value;
    const fmt = (v: number) => (v >= 0 ? `${v.toFixed(1)} mm` : `穿插 ${(-v).toFixed(1)} mm`);
    return { chassis: fmt(c.chassis), shock: fmt(c.shock) };
  });

  const staticAngle = computed(() => {
    const r = rigRef.value;
    return (thetaForTravel(r, r.preloadLift).theta * 180) / Math.PI;
  });

  watch(
    () => [travel.up, travel.down, travel.preload],
    () => {
      const bump = Math.max(0.5, rigRef.value.availableBump);
      const droop = Math.max(0.5, rigRef.value.availableDroop);
      previewTravel.value = clamp(previewTravel.value, -droop, bump);
    },
  );

  return {
    // state
    dims,
    travel,
    assembly,
    render,
    visible,
    previewTravel,
    pinArm,
    armAngleDeg,
    forceAttach,
    meta,
    messages,
    diagnostics,
    occlusion,
    dragState,
    runtimeFlags,
    lastExportAt,
    // derived
    rigRef,
    pose,
    curve,
    installed,
    isInstalled,
    canInstall,
    nextSocket,
    assemblyComplete,
    connectionIssues,
    signature,
    travelBounds,
    staticAngle,
    // actions
    setDim,
    setTravel,
    setPreviewTravel,
    setArmAngle,
    armAngleFromTravel,
    releaseArm,
    stepTravel,
    attachPart,
    detachPart,
    resetAssembly,
    clearAssembly,
    setTolerance,
    applyDims,
    applyTravel,
    applyPreset,
    reorderLayers,
    moveLayer,
    setRender,
    setVisible,
    pushMessage,
    clearMessages,
    buildConfig,
    markExported,
    importConfigText,
    resetAll,
    setDiagnostics,
    setOcclusion,
    clearance,
    setClearance,
    contactList,
    contactText,
    recomputePose,
    toPlainAssembly,
  };
});

export type LabStore = ReturnType<typeof useLabStore>;
