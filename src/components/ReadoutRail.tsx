import { useApp } from '../store';
import { FRAME_TIMES, TIME_DILATION, VIEW_DURATION } from '../sim/model';
import { levelLabel } from '../sim/types';

/** Floating readout rail shown on the right of the 3D view. */
export function ReadoutRail() {
  const sim = useApp((s) => s.sim);
  const playhead = useApp((s) => s.playhead);
  const config = useApp((s) => s.config);
  const solo = useApp((s) => s.solo);
  const selectedId = useApp((s) => s.selectedStrikeId);
  const strikes = useApp((s) => s.strikes);

  if (!sim) {
    return (
      <aside className="rail">
        <div className="rail-block">
          <div className="rail-title">计算中</div>
          <div className="rail-note">正在生成鼓皮网格与形变帧…</div>
        </div>
      </aside>
    );
  }

  const activeIdx = Math.max(0, sim.strikeIds.indexOf(selectedId ?? ''));
  const metrics = sim.metrics[activeIdx];
  const frame = nearestFrameIndex(playhead);
  const dispMm = sim.frameMaxDisp[frame] * 1;
  const stressNow = sim.frameMaxStress[frame];

  return (
    <aside className="rail">
      <div className="rail-block">
        <div className="rail-title">当前帧</div>
        <div className="rail-big">
          {playhead.toFixed(2)}
          <span className="rail-unit">s 视图</span>
        </div>
        <div className="rail-note">
          振动慢放 {TIME_DILATION}× · 共 {VIEW_DURATION.toFixed(2)} s,包络已压缩便于观察
        </div>
        <div className="rail-meter">
          <div
            className="rail-meter-fill"
            style={{ width: `${Math.min(100, (dispMm / Math.max(0.001, sim.frameMaxDisp[sim.peakFrame])) * 100)}%` }}
          />
        </div>
        <div className="rail-row">
          <span>当前形变</span>
          <strong>{dispMm.toFixed(2)} mm</strong>
        </div>
        <div className="rail-row">
          <span>当前应力增幅</span>
          <strong>{stressNow.toFixed(1)} MPa</strong>
        </div>
      </div>

      {metrics && (
        <div className="rail-block">
          <div className="rail-title">
            敲击参数
            <span
              className="rail-chip"
              style={{ background: strikes.find((s) => s.id === selectedId)?.color ?? '#ffb454' }}
            >{solo ? '单敲听诊' : '叠加'}</span>
          </div>
          <div className="rail-kv"><span>打击点</span><strong>ρ {metrics.strikeRho.toFixed(2)} · {(metrics.strikeTheta * 180 / Math.PI).toFixed(0)}°</strong></div>
          <div className="rail-kv"><span>力度 / 硬度</span><strong>{(metrics.strength * 100).toFixed(0)}% / {(metrics.hardness * 100).toFixed(0)}%</strong></div>
          <div className="rail-kv"><span>凹陷深度</span><strong>{metrics.dentMm.toFixed(2)} mm</strong></div>
          <div className="rail-kv"><span>触面半径</span><strong>{metrics.contactRadiusMm.toFixed(1)} mm</strong></div>
          <div className="rail-kv"><span>单敲峰值应力</span><strong className="hot">{metrics.peakStressMpa.toFixed(1)} MPa</strong></div>
          <div className="rail-kv"><span>应力集中半径</span><strong>ρ {metrics.peakStressRho.toFixed(2)}</strong></div>
        </div>
      )}

      <div className="rail-block">
        <div className="rail-title">鼓皮状态</div>
        <div className="rail-kv"><span>预张应力</span><strong>{sim.headInfo.preStressMpa.toFixed(1)} MPa</strong></div>
        <div className="rail-kv"><span>中央隆起</span><strong>{sim.headInfo.crownMm.toFixed(2)} mm</strong></div>
        <div className="rail-kv"><span>张力档</span><strong>{config.tensionLevel} · {levelLabel(config.tensionLevel)}</strong></div>
        <div className="rail-kv"><span>波速</span><strong>{sim.headInfo.waveSpeed.toFixed(1)} m/s</strong></div>
        <div className="rail-kv"><span>基频</span><strong>{sim.headInfo.f0.toFixed(0)} Hz</strong></div>
      </div>
    </aside>
  );
}

function nearestFrameIndex(t: number): number {
  let lo = 0;
  let hi = FRAME_TIMES.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (FRAME_TIMES[mid] <= t) lo = mid;
    else hi = mid;
  }
  return Math.abs(FRAME_TIMES[lo] - t) <= Math.abs(FRAME_TIMES[hi] - t) ? lo : hi;
}
