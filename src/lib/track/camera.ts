import { Scene } from '@babylonjs/core/scene.js';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { KeyboardEventTypes } from '@babylonjs/core/Events/keyboardEvents.js';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
import type { Centerline } from './centerline.js';
import { sampleAt, segmentAt } from './centerline.js';
import { gearToSpeed } from '../state/roam.js';
import type { CameraMode } from '../state/roam.js';

const CRUISE_HEIGHT = 2.2;
const LOOK_SPEED = 0.0035;
const FREE_ACCEL = 28; // 自由飞行加速度 m/s^2
const FREE_DAMP = 1.8;
const LATERAL_STEP = 0.8;
const MAX_LATERAL = 6.2;

export interface CameraFrame {
  s: number;
  segment: number;
  heading: number;
  speed: number;
  odometer: number;
  mode: CameraMode;
  position: Vector3;
  forward: Vector3;
}

/**
 * 漫游相机:
 * - cruise:沿中心线自动前进,速度 5 档;可横向变道、鼠标拖拽环视;
 * - free:  六自由度手动飞行,WASD/QE/Shift 加速,鼠标拖拽转向。
 */
export class RoamCamera {
  readonly camera: UniversalCamera;
  mode: CameraMode = 'cruise';
  speedGear = 2;
  /** 巡航模式下相对中心线的横向偏移(米) */
  lateralOffset = 0;
  /** 巡航模式下相对切线的偏航/俯仰环视角 */
  private lookYaw = 0;
  private lookPitch = 0;
  s = 0;
  odometer = 0;
  private readonly keys = new Set<string>();
  private freeVelocity = new Vector3(0, 0, 0);
  private dragging = false;

  constructor(
    scene: Scene,
    private readonly center: Centerline,
    canvas: HTMLCanvasElement
  ) {
    void canvas;
    this.camera = new UniversalCamera('roamCam', Vector3.Zero(), scene);
    this.camera.fov = (62 * Math.PI) / 180;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 2200;
    this.camera.inputs.clear(); // 全部输入自行处理,避免与 UI 冲突

    scene.onKeyboardObservable.add((kb) => {
      const key = kb.event.key.toLowerCase();
      if (kb.type === KeyboardEventTypes.KEYDOWN) {
        if (key === 'f') this.toggleMode();
        if (key === '1' || key === '2' || key === '3' || key === '4' || key === '5') {
          this.speedGear = Number(key);
        }
        this.keys.add(key);
        if (key === 'arrowleft' || key === 'arrowright' || key === ' ') kb.event.preventDefault();
      } else if (kb.type === KeyboardEventTypes.KEYUP) {
        this.keys.delete(key);
      }
    });

    scene.onPointerObservable.add((pe) => {
      if (pe.type === PointerEventTypes.POINTERDOWN && pe.event.button === 0) {
        this.dragging = true;
      } else if (pe.type === PointerEventTypes.POINTERUP) {
        this.dragging = false;
      } else if (pe.type === PointerEventTypes.POINTERMOVE && this.dragging) {
        const ev = pe.event as PointerEvent;
        this.lookYaw += ev.movementX * LOOK_SPEED;
        this.lookPitch = Math.max(
          -1.2,
          Math.min(1.2, this.lookPitch - ev.movementY * LOOK_SPEED)
        );
      }
    });

    this.jumpTo(0);
  }

  toggleMode() {
    if (this.mode === 'cruise') {
      // 进入自由飞行:保留当前位置与朝向作为初速度方向
      this.mode = 'free';
      this.freeVelocity = this.camera.getDirection(Vector3.Forward()).scale(
        gearToSpeed(this.speedGear)
      );
    } else {
      // 回到巡航:把当前位置投影回中心线
      const nearest = this.nearestS(this.camera.position);
      this.s = nearest;
      this.lateralOffset = 0;
      this.lookYaw = 0;
      this.lookPitch = 0;
      this.mode = 'cruise';
    }
  }

  setMode(mode: CameraMode) {
    if (mode !== this.mode) this.toggleMode();
  }

  /** 跳转到指定弧长(路段跳转、小地图点击共用) */
  jumpTo(s: number) {
    const L = this.center.totalLength;
    this.s = ((s % L) + L) % L;
    this.lookYaw = 0;
    this.lookPitch = 0;
    this.lateralOffset = 0;
    this.freeVelocity.set(0, 0, 0);
    const f = sampleAt(this.center, this.s);
    this.camera.position = f.position.add(f.normal.scale(CRUISE_HEIGHT));
    this.camera.setTarget(f.position.add(f.tangent.scale(10)).add(f.normal.scale(CRUISE_HEIGHT)));
  }

  private nearestS(point: Vector3): number {
    let best = 0;
    let bestD = Infinity;
    for (const frame of this.center.frames) {
      const d = Vector3.DistanceSquared(frame.position, point);
      if (d < bestD) {
        bestD = d;
        best = frame.s;
      }
    }
    return best;
  }

  private updateCruise(dt: number): number {
    if (this.keys.has('arrowleft')) this.lateralOffset = Math.max(-MAX_LATERAL, this.lateralOffset - LATERAL_STEP * dt * 4);
    if (this.keys.has('arrowright')) this.lateralOffset = Math.min(MAX_LATERAL, this.lateralOffset + LATERAL_STEP * dt * 4);

    const speed = gearToSpeed(this.speedGear) * (this.keys.has('shift') ? 1.5 : 1);
    const ds = speed * dt;
    this.s = (this.s + ds) % this.center.totalLength;
    this.odometer += ds;

    const f = sampleAt(this.center, this.s);
    const pos = f.position
      .add(f.binormal.scale(this.lateralOffset))
      .add(f.normal.scale(CRUISE_HEIGHT));
    this.camera.position = pos;

    // 在切线标架内叠加环视偏航/俯仰
    const baseYaw = Math.atan2(f.tangent.x, f.tangent.z);
    const yaw = baseYaw + this.lookYaw;
    const horiz = Math.cos(this.lookPitch);
    const forward = new Vector3(
      Math.sin(yaw) * horiz,
      Math.sin(this.lookPitch),
      Math.cos(yaw) * horiz
    );
    this.camera.setTarget(pos.add(forward));
    return speed;
  }

  private updateFree(dt: number): number {
    const fwd = this.camera.getDirection(Vector3.Forward());
    const up = this.camera.getDirection(Vector3.Up());
    const right = this.camera.getDirection(Vector3.Right());
    const accel = FREE_ACCEL * (this.keys.has('shift') ? 2.2 : 1);

    const thrust = new Vector3(0, 0, 0);
    if (this.keys.has('w')) thrust.addInPlace(fwd);
    if (this.keys.has('s')) thrust.subtractInPlace(fwd);
    if (this.keys.has('a')) thrust.subtractInPlace(right);
    if (this.keys.has('d')) thrust.addInPlace(right);
    if (this.keys.has('e') || this.keys.has(' ')) thrust.addInPlace(up);
    if (this.keys.has('q')) thrust.subtractInPlace(up);
    if (thrust.lengthSquared() > 0) {
      thrust.normalize().scaleInPlace(accel * dt);
      this.freeVelocity.addInPlace(thrust);
    }
    // 阻尼限速,上限为当前档位速度的 2 倍
    this.freeVelocity.scaleInPlace(Math.exp(-FREE_DAMP * dt));
    const maxV = gearToSpeed(this.speedGear) * 2;
    if (this.freeVelocity.length() > maxV) this.freeVelocity.scaleInPlace(maxV / this.freeVelocity.length());

    this.camera.position.addInPlace(this.freeVelocity.scale(dt));
    this.odometer += this.freeVelocity.length() * dt;
    this.s = this.nearestS(this.camera.position);
    return this.freeVelocity.length();
  }

  update(dt: number): CameraFrame {
    const speed = this.mode === 'cruise' ? this.updateCruise(dt) : this.updateFree(dt);
    const f = sampleAt(this.center, this.s);
    const heading = Math.atan2(f.tangent.x, f.tangent.z);
    return {
      s: this.s,
      segment: segmentAt(this.center, this.s) + 1,
      heading,
      speed,
      odometer: this.odometer,
      mode: this.mode,
      position: this.camera.position.clone(),
      forward: this.camera.getDirection(Vector3.Forward())
    };
  }

  /** 导出用姿态快照 */
  exportPose() {
    const p = this.camera.position;
    const d = this.camera.getDirection(Vector3.Forward());
    return {
      position: { x: round(p.x), y: round(p.y), z: round(p.z) },
      direction: { x: round(d.x), y: round(d.y), z: round(d.z) },
      arcLength: round(this.s),
      segment: segmentAt(this.center, this.s) + 1,
      mode: this.mode,
      speedGear: this.speedGear,
      lateralOffset: round(this.lateralOffset),
      lookYaw: round(this.lookYaw),
      lookPitch: round(this.lookPitch),
      odometer: round(this.odometer)
    };
  }
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
