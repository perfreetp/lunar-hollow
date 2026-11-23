// 全局状态:开度、姿态库、干涉结果,localStorage 持久化
import { createSignal, createEffect } from 'solid-js';
import { ANGLE_MAX, ANGLE_MIN } from './config';
import type { InterferenceReport } from './manifoldService';

export interface Pose {
  id: string;
  name: string;
  angle: number;
  createdAt: string;
}

const LS_POSES = 'miterGate.poses.v1';
const LS_ANGLE = 'miterGate.angle.v1';

function loadPoses(): Pose[] {
  try {
    const raw = localStorage.getItem(LS_POSES);
    if (raw) return JSON.parse(raw) as Pose[];
    // URL 参数播种(便于分享/演示):?poses=0,45,90 或 ?poses=检修:30,全开:90
    const q = new URLSearchParams(window.location.search).get('poses');
    if (q) {
      const seeded: Pose[] = [];
      for (const part of q.split(',')) {
        const [name, num] = part.includes(':') ? part.split(':') : [`姿态 ${part}°`, part];
        const a = Number(num);
        if (Number.isFinite(a)) {
          seeded.push({
            id: `p_seed_${seeded.length}`,
            name,
            angle: Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, a)),
            createdAt: new Date().toISOString(),
          });
        }
      }
      return seeded;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function loadAngle(): number {
  try {
    // URL 参数优先(便于分享指定开度的链接)
    const q = Number(new URLSearchParams(window.location.search).get('angle'));
    if (Number.isFinite(q) && q !== 0) return Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, q));
    const v = Number(localStorage.getItem(LS_ANGLE));
    if (Number.isFinite(v)) return Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, v));
  } catch {
    /* ignore */
  }
  return 0;
}

/** 当前开度(度) */
export const [angle, setAngleRaw] = createSignal(loadAngle());
export function setAngle(deg: number) {
  setAngleRaw(Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, deg)));
}

/** 保存的姿态 */
export const [poses, setPoses] = createSignal<Pose[]>(loadPoses());

export function savePose(name: string, poseAngle: number): Pose {
  const pose: Pose = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || `姿态 ${poses().length + 1}`,
    angle: Math.round(poseAngle * 10) / 10,
    createdAt: new Date().toISOString(),
  };
  setPoses([...poses(), pose]);
  return pose;
}

export function deletePose(id: string) {
  setPoses(poses().filter((p) => p.id !== id));
}

export function renamePose(id: string, name: string) {
  setPoses(poses().map((p) => (p.id === id ? { ...p, name } : p)));
}

/** 干涉检查结果 */
export const [interference, setInterference] = createSignal<InterferenceReport | null>(null);
/** 是否正在重算 */
export const [checking, setChecking] = createSignal(false);
/** 是否在 3D 视图中高亮干涉区域 */
export const [showHighlights, setShowHighlights] = createSignal(true);
/** 是否显示关键点标注 */
export const [showLabels, setShowLabels] = createSignal(true);

createEffect(() => {
  try {
    localStorage.setItem(LS_ANGLE, String(angle()));
  } catch {
    /* ignore */
  }
});

createEffect(() => {
  try {
    localStorage.setItem(LS_POSES, JSON.stringify(poses()));
  } catch {
    /* ignore */
  }
});
