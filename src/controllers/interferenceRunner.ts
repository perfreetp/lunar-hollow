// 开度变化后防抖重算干涉
import { createEffect, on } from 'solid-js';
import { angle, setChecking, setInterference } from '../store';
import { checkInterference } from '../manifoldService';

let timer: ReturnType<typeof setTimeout> | null = null;
let seq = 0;

export function startInterferenceRunner() {
  createEffect(
    on(angle, (deg) => {
      if (timer) clearTimeout(timer);
      setChecking(true);
      const mySeq = ++seq;
      timer = setTimeout(async () => {
        try {
          const report = await checkInterference(deg);
          if (mySeq === seq) setInterference(report);
        } catch (e) {
          console.error('干涉检查失败', e);
        } finally {
          if (mySeq === seq) setChecking(false);
        }
      }, 180);
    }),
  );
}

/** 立即重算一次(供手动触发) */
export async function recheckNow(): Promise<void> {
  if (timer) clearTimeout(timer);
  const mySeq = ++seq;
  setChecking(true);
  try {
    const report = await checkInterference(angle());
    if (mySeq === seq) setInterference(report);
  } finally {
    if (mySeq === seq) setChecking(false);
  }
}
