<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { Matrix, PointerEventTypes, Vector3 } from '@babylonjs/core';
import type { Engine, Scene } from '@babylonjs/core';
import { createStudio, type StudioHandle } from '../render/studio';
import { RigRenderer } from '../render/rigRenderer';
import { useLabStore } from '../stores/lab';
import { evaluateClearance, evaluateOcclusion, wheelShapeOf } from '../core/collision';
import { CHASSIS_BOXES, PART_INFO, SOCKETS, RIG, shockCollider } from '../core/rigSpec';
import type { ClearanceReport, Contact, PartKind, Pose, ProbeGroup } from '../core/model';
import { clamp, distance as dist3, type Vec3 } from '../core/math';

const SNAP_RADIUS_PX = 78;

const store = useLabStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const hostRef = ref<HTMLDivElement | null>(null);

const studio = shallowRef<StudioHandle | null>(null);
const renderer = shallowRef<RigRenderer | null>(null);
const clearance = ref<ClearanceReport>({ chassis: 0, shock: 0, contacts: [], minDepth: 0, touching: [] });
const ready = ref(false);
const errorText = ref<string | null>(null);
const draggingArm = ref(false);

let frameNo = 0;
let lastFrameTime = 0;
const frameMsSamples: number[] = [];
let solveMs = 0;
let collisionMs = 0;
let occlusionMs = 0;
let solves = 0;
let armDragPlane: { origin: Vector3; normal: Vector3 } | null = null;

const toVec = (p: Vec3) => new Vector3(p.x, p.y, p.z);
const distance = (a: Vec3, b: Vec3) => dist3(a, b);

/* ------------------------------------------------------------------ *
 * Screen projection: world (mm) -> CSS pixels inside the canvas.
 * ------------------------------------------------------------------ */

function projectToScreen(p: Vec3): { x: number; y: number } | null {
  const s = studio.value;
  const canvas = canvasRef.value;
  if (!s || !canvas) return null;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return null;
  const projected = Vector3.Project(
    toVec({ x: p.x, y: p.y + (renderer.value?.getBodyOffset() ?? 0), z: p.z }),
    Matrix.IdentityReadOnly,
    s.scene.getTransformMatrix(),
    s.camera.viewport.toGlobal(w, h),
  );
  return { x: projected.x, y: projected.y };
}

/* ------------------------------------------------------------------ *
 * Scene lifecycle + per-frame solve.
 * ------------------------------------------------------------------ */

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  try {
    const s = createStudio(canvas);
    studio.value = s;
    const r = new RigRenderer(s.scene);
    renderer.value = r;
    r.registerChassis(s.chassisMeshes.all, s.chassisMeshes.root);
    r.applyLayerOrder(store.render.layerOrder);
    const shadowList = s.shadow.getShadowMap();
    if (shadowList) shadowList.renderList = [...r.shadowCasterMeshes()];
    wirePointer(s);
    startLoop(s, r);
    // Dev/test hook: lets the smoke test aim at real screen-space geometry.
    (window as unknown as { __lab?: unknown }).__lab = {
      project: projectToScreen,
      // Aim at the tread, not the hub: the wheel is an open shell, so the exact
      // centre of the tyre is literally a hole for the picking ray.
      wheelScreen: () => {
        const p = store.pose;
        const up = p.wheelUp;
        const r = store.dims.wheelRadius * 0.72;
        return projectToScreen({
          x: p.wheelCenter.x + up.x * r,
          y: p.wheelCenter.y + up.y * r,
          z: p.wheelCenter.z + up.z * r,
        });
      },
      lbjScreen: () => projectToScreen(store.pose.lbj),
      pose: () => store.pose,
      occlusion: () => store.occlusion,
      clearance: () => clearance.value,
      beginLibraryDrag,
      store,
      rigRef: store.rigRef,
      scene: s.scene,
      renderer: r,
    };
    ready.value = true;
  } catch (err) {
    errorText.value = String((err as Error)?.message ?? err);
    console.error(err);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onLibraryPointerMove);
  window.removeEventListener('pointerup', onLibraryPointerUp);
  studio.value?.dispose();
  studio.value = null;
});

function startLoop(s: StudioHandle, r: RigRenderer) {
  s.engine.runRenderLoop(() => {
    const t0 = performance.now();
    frameNo += 1;
    try {
      // 1) Re-solve the entire linkage chain for this frame.
      const pose = store.recomputePose();
      solves += 1;
      const t1 = performance.now();

      // 2) Penetration / clearance against chassis + shock.
      const wheel = wheelShapeOf(pose, store.dims);
      const shock = shockCollider(pose.shock.top, pose.shock.lower);
      const report = evaluateClearance({
        wheel,
        colliders: [...CHASSIS_BOXES, shock],
        extraProbes: knuckleProbes(pose),
      });
      const t2 = performance.now();

      // 3) Occlusion rays from the eye to the wheel + shock samples. The camera
      // is in world space; the colliders are in rig space, so undo the body
      // offset (see setBodyOffset below).
      const cam = s.camera.globalPosition;
      const bodyY = -(pose.travel + store.rigRef.preloadLift);
      const occ = evaluateOcclusion({
        camera: { x: cam.x, y: cam.y - bodyY, z: cam.z },
        wheel,
        shock,
        chassis: CHASSIS_BOXES,
        frame: frameNo,
        quality: draggingArm.value ? 0.7 : 1,
      });
      const t3 = performance.now();

      clearance.value = report;
      store.setClearance(report);
      store.setOcclusion(occ);

      // Ground the wheel: the body rises/falls with travel instead of the tyre
      // sinking through the floor. Preload already lifted the design pose, so the
      // offset includes it — otherwise the tyre floats above the floor.
      r.setBodyOffset(bodyY);
      r.update({
        dims: store.dims,
        render: store.render,
        pose,
        contacts: report.contacts,
        occlusion: occ,
        previewTravel: store.previewTravel,
        visibleParts: store.visible,
      });
      r.applyLayerOrder(store.render.layerOrder);
      r.setChassisVisible(store.visible.chassis !== false);
      r.highlightContacts(report.contacts);
      r.setGhost(
        store.dragState.part,
        store.dragState.part ? (store.dragState.slotId ? SOCKETS.find((x) => x.id === store.dragState.slotId)?.anchor ?? null : PART_INFO[store.dragState.part].anchor) : null,
        store.dragState.snap,
      );

      solveMs = t1 - t0;
      collisionMs = t2 - t1;
      occlusionMs = t3 - t2;

      const now = performance.now();
      const dt = now - (lastFrameTime || now - 16.67);
      lastFrameTime = now;
      frameMsSamples.push(dt);
      if (frameMsSamples.length > 45) frameMsSamples.shift();
      const avg = frameMsSamples.reduce((a, b) => a + b, 0) / Math.max(1, frameMsSamples.length);
      store.setDiagnostics({
        fps: Math.round(s.engine.getFps() * 10) / 10,
        frameMs: Math.round(avg * 100) / 100,
        solveMs: Math.round(solveMs * 1000) / 1000,
        collisionMs: Math.round(collisionMs * 1000) / 1000,
        occlusionMs: Math.round(occlusionMs * 1000) / 1000,
        solves,
        frame: frameNo,
        activeMeshes: s.scene.getActiveMeshes().length,
        drawCalls: drawCallCount(s.engine),
        perFrameSolve: true,
      });
    } catch (err) {
      console.error('frame error', err);
      errorText.value = String((err as Error)?.message ?? err);
    }
    s.scene.render();
  });
}

function drawCallCount(e: Engine): number {
  const anyE = e as unknown as { _drawCalls?: { current?: number }; _drawCallsPerFrame?: number };
  if (anyE._drawCalls && typeof anyE._drawCalls.current === 'number') return anyE._drawCalls.current;
  if (typeof anyE._drawCallsPerFrame === 'number') return anyE._drawCallsPerFrame;
  return 0;
}

/** Sample points on the knuckle so it participates in the clearance check too. */
function knuckleProbes(pose: Pose): { group: ProbeGroup; points: Vec3[] }[] {
  const kp = pose.kingpin;
  const len = Math.hypot(kp.x, kp.y, kp.z) || 1;
  const points: Vec3[] = [];
  for (const f of [0.18, 0.4, 0.62, 0.86]) {
    const base = {
      x: pose.lbj.x + kp.x * f,
      y: pose.lbj.y + kp.y * f,
      z: pose.lbj.z + kp.z * f,
    };
    points.push(base);
    points.push({ x: base.x + 11, y: base.y, z: 7 });
    points.push({ x: base.x + 11, y: base.y, z: -7 });
    points.push({ x: base.x - 9, y: base.y, z: 0 });
  }
  void len;
  return [{ group: 'knuckle', points }];
}

/* ------------------------------------------------------------------ *
 * 3D pointer: grab the wheel / lower arm and swing the arm.
 * ------------------------------------------------------------------ */

function wirePointer(s: StudioHandle) {
  s.scene.onPointerObservable.add((info) => {
    const evt = info.event as PointerEvent;
    if (store.dragState.active) return;
    if (info.type === PointerEventTypes.POINTERDOWN) {
      const hit = s.scene.pick(s.scene.pointerX, s.scene.pointerY, (m) => {
        const md = m.metadata as { draggable?: boolean } | undefined;
        return Boolean(md && md.draggable);
      });
      if (hit?.hit) {
        draggingArm.value = true;
        s.camera.detachControl();
        beginArmDrag(evt);
        evt.preventDefault?.();
      }
    } else if (info.type === PointerEventTypes.POINTERUP) {
      if (!draggingArm.value) return;
      draggingArm.value = false;
      s.camera.attachControl(canvasRef.value!, true);
      store.releaseArm();
    } else if (info.type === PointerEventTypes.POINTERMOVE) {
      if (!draggingArm.value) return;
      moveArmDrag(evt);
    }
  });
}

let dragAnchor = 0;

/**
 * Arm convention: armDir(θ) = (cos θ, −sin θ), so the arm's *world* angle is
 * −θ. Dragging the wheel therefore changes θ by minus the change in the
 * pointer's world angle around the pivot — anchoring on the grab point keeps
 * the arm under the cursor instead of snapping to it.
 */
function beginArmDrag(_evt: PointerEvent) {
  store.releaseArm();
  const pose = store.pose;
  const theta0 = (pose.lowerAngleDeg * Math.PI) / 180;
  const pointer = pointerOnArmPlane(_evt);
  if (pointer) {
    const worldAngle = Math.atan2(pointer.y - RIG.lowerPivot.y, pointer.x - RIG.lowerPivot.x);
    dragAnchor = theta0 + worldAngle;
  } else {
    dragAnchor = theta0;
  }
  store.setArmAngle(pose.lowerAngleDeg);
}

function pointerOnArmPlane(evt: { clientX: number; clientY: number }): Vec3 | null {
  const s = studio.value;
  const canvas = canvasRef.value;
  if (!s || !canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const ray = s.scene.createPickingRay(evt.clientX - rect.left, evt.clientY - rect.top, null, s.camera);
  const normal = new Vector3(0, 0, 1);
  if (!armDragPlane) {
    armDragPlane = { origin: new Vector3(RIG.lowerPivot.x, RIG.lowerPivot.y, 0), normal };
  }
  const denom = Vector3.Dot(ray.direction, normal);
  if (Math.abs(denom) < 1e-6) return null;
  const t = Vector3.Dot(armDragPlane.origin.subtract(ray.origin), normal) / denom;
  if (t <= 0) return null;
  const hit = ray.origin.add(ray.direction.scale(t));
  // Rig space has the body offset baked into the render transform; undo it.
  return { x: hit.x, y: hit.y - (renderer.value?.getBodyOffset() ?? 0), z: 0 };
}

function moveArmDrag(evt: PointerEvent) {
  const p = pointerOnArmPlane(evt);
  if (!p) return;
  const worldAngle = Math.atan2(p.y - RIG.lowerPivot.y, p.x - RIG.lowerPivot.x);
  const theta = dragAnchor - worldAngle;
  store.setArmAngle(clamp((theta * 180) / Math.PI, -40, 40));
}

/* ------------------------------------------------------------------ *
 * Library drag & drop: pointer tracking + nearest-socket snapping.
 * ------------------------------------------------------------------ */

function beginLibraryDrag(part: PartKind, evt: PointerEvent) {
  if (!store.canInstall(part)) {
    const missing = PART_INFO[part];
    store.pushMessage({
      level: 'warn',
      code: 'prereq',
      message: `无法安装 ${missing.label}：请先完成前置零件`,
    });
    return;
  }
  store.dragState.active = true;
  store.dragState.part = part;
  store.dragState.pointer = { x: evt.clientX, y: evt.clientY };
  store.dragState.snap = false;
  store.dragState.slotId = null;
  store.dragState.slotScreen = null;
  store.dragState.deviation = 0;
  store.dragState.pixelDistance = Infinity;
  window.addEventListener('pointermove', onLibraryPointerMove);
  window.addEventListener('pointerup', onLibraryPointerUp);
}

function onLibraryPointerMove(evt: PointerEvent) {
  const ds = store.dragState;
  if (!ds.active || !ds.part) return;
  ds.pointer = { x: evt.clientX, y: evt.clientY };
  const canvas = canvasRef.value;
  const s = studio.value;
  if (!canvas || !s) return;
  const rect = canvas.getBoundingClientRect();
  const inside =
    evt.clientX >= rect.left && evt.clientX <= rect.right && evt.clientY >= rect.top && evt.clientY <= rect.bottom;
  const socket = SOCKETS.find((sc) => sc.accepts === ds.part);
  if (!socket || !inside) {
    ds.snap = false;
    ds.slotId = null;
    ds.slotScreen = null;
    ds.pixelDistance = Infinity;
    return;
  }
  const screen = projectToScreen(socket.anchor);
  if (!screen) return;
  const px = evt.clientX - rect.left;
  const py = evt.clientY - rect.top;
  const dPx = Math.hypot(px - screen.x, py - screen.y);
  ds.slotScreen = screen;
  ds.pixelDistance = dPx;
  ds.snap = dPx <= SNAP_RADIUS_PX;
  ds.slotId = ds.snap ? socket.id : null;

  // Convert the pointer miss into physical millimetres at the socket's depth.
  const cam = s.camera.globalPosition;
  const camDist = Math.hypot(cam.x - socket.anchor.x, cam.y - socket.anchor.y, cam.z - socket.anchor.z);
  const worldPerPixel = (2 * camDist * Math.tan(s.camera.fov / 2)) / Math.max(1, rect.height);
  ds.deviation = Math.max(0, dPx * worldPerPixel - 0.5);
}

function onLibraryPointerUp(evt: PointerEvent) {
  window.removeEventListener('pointermove', onLibraryPointerMove);
  window.removeEventListener('pointerup', onLibraryPointerUp);
  const ds = store.dragState;
  if (!ds.active || !ds.part) {
    ds.active = false;
    ds.part = null;
    return;
  }
  const part = ds.part;
  const deviation = ds.deviation;
  if (ds.slotId) {
    const over = deviation > store.assembly.toleranceMm;
    if (over && !store.forceAttach) {
      store.pushMessage({
        level: 'error',
        code: 'reject',
        message: `${PART_INFO[part].label} 偏差 ${deviation.toFixed(1)} mm 超过阈值 ${store.assembly.toleranceMm} mm，已拒绝安装（可开启“强制固定”）`,
      });
    } else {
      store.attachPart(part, deviation, over);
    }
  } else if (isOverCanvas(evt)) {
    store.pushMessage({
      level: 'warn',
      code: 'miss',
      message: `${PART_INFO[part].label} 未吸附到轴位，已弹回零件库`,
    });
  }
  ds.active = false;
  ds.part = null;
  ds.snap = false;
  ds.slotId = null;
  ds.slotScreen = null;
  ds.pixelDistance = Infinity;
}

function isOverCanvas(evt: { clientX: number; clientY: number }): boolean {
  const canvas = canvasRef.value;
  if (!canvas) return false;
  const r = canvas.getBoundingClientRect();
  return evt.clientX >= r.left && evt.clientX <= r.right && evt.clientY >= r.top && evt.clientY <= r.bottom;
}

/* ------------------------------------------------------------------ *
 * HUD.
 * ------------------------------------------------------------------ */

const ghostStyle = computed(() => {
  const ds = store.dragState;
  if (!ds.active) return { display: 'none' as const };
  const canvas = canvasRef.value;
  let left = ds.pointer.x;
  let top = ds.pointer.y;
  if (canvas && ds.slotScreen && ds.snap) {
    const rect = canvas.getBoundingClientRect();
    left = rect.left + ds.slotScreen.x;
    top = rect.top + ds.slotScreen.y;
  }
  return { left: `${left}px`, top: `${top}px`, transform: 'translate(-50%, -50%)', display: 'block' as const };
});

const ghostLabel = computed(() => {
  const part = store.dragState.part;
  if (!part) return '';
  const dev = store.dragState.deviation;
  const over = dev > store.assembly.toleranceMm;
  const snapText = store.dragState.snap ? '吸附' : '自由';
  return `${PART_INFO[part].label} · ${snapText} · ${dev.toFixed(1)} mm${over ? ' ⚠' : ''}`;
});

const ghostTone = computed(() => {
  const ds = store.dragState;
  if (!ds.snap) return '#94a3b8';
  return ds.deviation > store.assembly.toleranceMm ? '#f56565' : '#68d391';
});

const socketOverlay = computed(() => {
  if (!store.dragState.part) return [];
  const out: { id: string; label: string; x: number; y: number; active: boolean; tone: string }[] = [];
  for (const sc of SOCKETS) {
    if (sc.accepts !== store.dragState.part) continue;
    const p = projectToScreen(sc.anchor);
    if (!p) continue;
    out.push({
      id: sc.id,
      label: sc.label,
      x: p.x,
      y: p.y,
      active: store.dragState.slotId === sc.id,
      tone: store.dragState.slotId === sc.id ? ghostTone.value : '#7dd3fc',
    });
  }
  return out;
});

const pose = computed(() => store.pose);
const issues = computed(() => pose.value.issues);

const issueText: Record<string, string> = {
  clamped: '已到行程限位',
  'upper-unreachable': '上摆臂无法闭合（超出可达范围）',
  'tie-unreachable': '拉杆无法到达齿条端',
  'non-finite': '求解出现非有限值',
  'preload-exceeds-droop': '预压吃掉了上行程',
};

const clearanceRows = computed(() => [
  { label: '轮毂 ↔ 车架', value: clearance.value.chassis },
  { label: '轮毂 ↔ 避震器', value: clearance.value.shock },
]);

const contactRows = computed<Contact[]>(() => clearance.value.contacts.slice(0, 3));

watch(
  () => store.forceAttach,
  (v) => {
    if (!v) return;
    store.pushMessage({
      level: 'warn',
      code: 'force',
      message: '强制固定已开启：超阈值连接会被保留并标红',
    });
  },
);

defineExpose({ beginLibraryDrag });
</script>

<template>
  <div ref="hostRef" class="viewport" :class="{ 'is-dragging': draggingArm }">
    <canvas ref="canvasRef" class="viewport-canvas" data-testid="rig-canvas" />

    <div class="viewport-hud" data-testid="pose-hud">
      <div class="hud-title">实时姿态</div>
      <div class="hud-line">
        <span class="hud-key">前束</span>
        <span class="hud-val" data-testid="hud-toe">{{ pose.toeDeg.toFixed(2) }}°</span>
      </div>
      <div class="hud-line">
        <span class="hud-key">外倾</span>
        <span class="hud-val" data-testid="hud-camber">{{ pose.camberDeg.toFixed(2) }}°</span>
      </div>
      <div class="hud-line">
        <span class="hud-key">半轮距</span>
        <span class="hud-val">{{ pose.halfTrack.toFixed(1) }} mm</span>
      </div>
      <div class="hud-line">
        <span class="hud-key">行程</span>
        <span class="hud-val" data-testid="hud-travel">{{ pose.travel.toFixed(1) }} mm</span>
      </div>
      <div class="hud-line sub">
        <span class="hud-key">下摆臂角</span>
        <span class="hud-val">{{ pose.lowerAngleDeg.toFixed(2) }}°</span>
      </div>
      <div class="hud-line sub">
        <span class="hud-key">主销长</span>
        <span class="hud-val">{{ distance(pose.lbj, pose.ubj).toFixed(1) }} mm</span>
      </div>
      <div class="hud-line sub">
        <span class="hud-key">磨胎半径</span>
        <span class="hud-val">{{ pose.scrubRadius.toFixed(1) }} mm</span>
      </div>
    </div>

    <div class="viewport-legend">
      <span
        v-for="s in socketOverlay"
        :key="s.id"
        class="socket-chip"
        :class="{ active: s.active }"
        :style="{ left: s.x + 'px', top: s.y + 'px', color: s.tone, borderColor: s.tone }"
      >
        {{ s.label }}
      </span>
    </div>

    <div class="drag-ghost" :style="ghostStyle" data-testid="drag-ghost">
      <span class="drag-ghost-dot" :style="{ borderColor: ghostTone, background: ghostTone + '33' }" />
      <span class="drag-ghost-label" :style="{ color: ghostTone, borderColor: ghostTone }">{{ ghostLabel }}</span>
    </div>

    <div class="viewport-corner">
      <button
        class="mini"
        :class="{ on: store.forceAttach }"
        data-testid="toggle-force"
        @click="store.forceAttach = !store.forceAttach"
      >
        强制固定 {{ store.forceAttach ? '开' : '关' }}
      </button>
      <button class="mini" :class="{ on: store.render.showSockets }" @click="store.setRender('showSockets', !store.render.showSockets)">
        轴位标记
      </button>
      <button
        class="mini"
        :class="{ on: store.render.showOcclusionProbes }"
        data-testid="toggle-probes"
        @click="store.setRender('showOcclusionProbes', !store.render.showOcclusionProbes)"
      >
        遮挡探针
      </button>
      <button
        class="mini"
        :class="{ on: store.render.showContactMarkers }"
        @click="store.setRender('showContactMarkers', !store.render.showContactMarkers)"
      >
        穿插标记
      </button>
    </div>

    <div class="viewport-stats">
      <span class="stat" :class="{ warn: issues.length > 0 }" data-testid="chain-status">
        <i class="dot" /> {{ issues.length ? issueText[issues[0]] ?? issues[0] : '链路闭合正常' }}
      </span>
      <span class="stat mono" data-testid="perf">{{ store.diagnostics?.fps ?? 0 }} fps · 解算 {{ store.diagnostics?.solveMs ?? 0 }} ms</span>
      <span class="stat mono">遮挡 {{ ((store.occlusion?.ratio ?? 0) * 100).toFixed(0) }}%</span>
    </div>

    <div v-if="!ready && !errorText" class="viewport-loading">正在初始化渲染引擎…</div>
    <div v-if="errorText" class="viewport-error">
      <strong>渲染初始化失败</strong>
      <pre>{{ errorText }}</pre>
    </div>

    <div class="viewport-tip">拖动轮毂或下摆臂即可摆臂预览 · 滚轮缩放 · 右键平移</div>

    <div class="clearance-badges">
      <span v-for="row in clearanceRows" :key="row.label" class="clearance-badge" :class="{ bad: row.value < 0 }">
        {{ row.label }}
        <b>{{ row.value >= 0 ? row.value.toFixed(1) + ' mm' : '穿插 ' + (-row.value).toFixed(1) + ' mm' }}</b>
      </span>
      <span v-for="c in contactRows" :key="c.target + c.probe" class="clearance-badge bad" data-testid="contact-badge">
        {{ c.probe === 'wheel' ? '轮毂' : c.probe === 'knuckle' ? '转向节' : c.probe }} ↔ {{ c.targetLabel }}
        <b>穿插 {{ c.depth.toFixed(1) }} mm</b>
      </span>
    </div>
  </div>
</template>
