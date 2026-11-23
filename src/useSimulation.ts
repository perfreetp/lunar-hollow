import { useEffect, useRef } from 'react';
import { useApp } from './store';
import type { SimResponse } from './sim/protocol';

type WorkerMessage = SimResponse | { type: 'error'; reqId: number; message: string };

/**
 * Runs the simulation in a worker. Changing the physical configuration
 * (size, depth, material, tension) or any strike re-runs the whole recompute.
 * Requests are debounced and the latest request always wins, so dragging a
 * slider does not queue up stale work.
 */
export function useSimulation(): void {
  const workerRef = useRef<Worker | null>(null);
  const reqRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const w = new Worker(new URL('./sim/worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = w;

    w.onmessage = (ev: MessageEvent<WorkerMessage>) => {
      const msg = ev.data;
      if (msg.type === 'error') {
        if (msg.reqId === reqRef.current) useApp.getState().setSimStatus('error', msg.message);
        return;
      }
      if (msg.reqId !== reqRef.current) return;
      useApp.getState().setSim(msg);
      if (useApp.getState().playhead > msg.times[msg.times.length - 1]) {
        useApp.getState().seek(0);
      }
    };
    w.onerror = (err) => {
      useApp.getState().setSimStatus('error', err.message || '模拟线程出错');
    };

    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // One subscription drives every recompute: physical parameters and strike
  // edits both land in the same debounced request.
  useEffect(() => {
    let first = true;
    const fire = () => {
      const w = workerRef.current;
      if (!w) return;
      reqRef.current += 1;
      const st = useApp.getState();
      st.setSimStatus('computing');
      w.postMessage({
        type: 'simulate',
        reqId: reqRef.current,
        config: st.config,
        strikes: st.strikes.map((s) => ({
          id: s.id,
          rho: s.rho,
          theta: s.theta,
          strength: s.strength,
          hardness: s.hardness,
        })),
      });
    };

    const schedule = () => {
      if (first) {
        // the very first request should not wait
        first = false;
        fire();
        return;
      }
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(fire, 45);
    };

    schedule();
    const unsub = useApp.subscribe((state, prev) => {
      const physChanged =
        state.config !== prev.config;
      const strikeChanged = state.strikes !== prev.strikes;
      if (physChanged || strikeChanged) schedule();
    });

    return () => {
      unsub();
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);
}
