import { runSimulation } from './model';
import { VERT_COUNT } from './layout';
import type { SimRequest, SimResponse } from './protocol';

function maxOf(a: Float32Array): number {
  let m = 0;
  for (let i = 0; i < a.length; i++) if (a[i] > m) m = a[i];
  return m;
}

/**
 * Simulation worker. Recomputes the resting head and every strike frame stack
 * whenever the tension level, material, size or strike list changes, so the
 * main thread never blocks. Big buffers are transferred, never copied.
 */
self.onmessage = (ev: MessageEvent<SimRequest>) => {
  const msg = ev.data;
  if (msg.type !== 'simulate') return;
  try {
    const r = runSimulation(msg.config, msg.strikes);
    const transfers: Transferable[] = [
      r.base.positions.buffer,
      r.base.baseY.buffer,
      r.disp.buffer,
      r.glow.buffer,
      r.times.buffer,
      r.frameMaxDisp.buffer,
      r.frameMaxStress.buffer,
    ];
    for (const a of r.perStrikeDisp) transfers.push(a.buffer);
    for (const a of r.perStrikeGlow) transfers.push(a.buffer);

    const res: SimResponse = {
      type: 'result',
      reqId: msg.reqId,
      config: msg.config,
      basePositions: r.base.positions,
      baseY: r.base.baseY,
      disp: r.disp,
      glow: r.glow,
      maxGlow: maxOf(r.glow),
      perStrikeDisp: r.perStrikeDisp,
      perStrikeGlow: r.perStrikeGlow,
      strikeIds: r.strikeIds,
      times: r.times,
      frameCount: r.times.length,
      vertexCount: VERT_COUNT,
      frameMaxDisp: r.frameMaxDisp,
      frameMaxStress: r.frameMaxStress,
      peakFrame: r.peakFrame,
      peakStressMpa: r.peakStressMpa,
      peakStressRho: r.peakStressRho,
      maxDeltaStress: r.maxDeltaStress,
      metrics: r.metrics,
      headInfo: {
        tension: r.base.tension,
        f0: r.base.f0,
        crownMm: r.base.crownMm,
        wrinkleMm: r.base.wrinkleMm,
        aMm: r.base.aMm,
        rimRadiusMm: r.base.rimRadiusMm,
        depthMm: r.base.depthMm,
        preStressMpa: r.base.preStressMpa,
        waveSpeed: r.base.waveSpeed,
      },
      computeMs: r.computeMs,
    };
    (self as unknown as Worker).postMessage(res, transfers);
  } catch (err) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      reqId: msg.reqId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
