import { useMemo } from 'react';
import { useApp } from '../store';
import { FRAME_TIMES, TIME_DILATION, VIEW_DURATION } from '../sim/model';
import { PanelHead } from './DrumPanel';
import { STRESS_STOPS } from '../three/headGeometry';

/** Module 3: playback, scrub, exaggeration, colour mode, and the decay curve. */
export function AnimPanel() {
  const sim = useApp((s) => s.sim);
  const playing = useApp((s) => s.playing);
  const loop = useApp((s) => s.loop);
  const speed = useApp((s) => s.speed);
  const playhead = useApp((s) => s.playhead);
  const exaggeration = useApp((s) => s.exaggeration);
  const colorMode = useApp((s) => s.colorMode);
  const showWireframe = useApp((s) => s.showWireframe);
  const togglePlay = useApp((s) => s.togglePlay);
  const restart = useApp((s) => s.restart);
  const seek = useApp((s) => s.seek);
  const setSpeed = useApp((s) => s.setSpeed);
  const setLoop = useApp((s) => s.setLoop);
  const setExaggeration = useApp((s) => s.setExaggeration);
  const setColorMode = useApp((s) => s.setColorMode);
  const setShowWireframe = useApp((s) => s.setShowWireframe);
  const selectedId = useApp((s) => s.selectedStrikeId);
  const strikes = useApp((s) => s.strikes);

  const activeIdx = sim ? Math.max(0, sim.strikeIds.indexOf(selectedId ?? '')) : 0;
  const seriesDisp = sim?.frameMaxDisp ?? null;
  const seriesStress = sim?.frameMaxStress ?? null;

  const peakDisp = useMemo(() => (seriesDisp ? Math.max(...seriesDisp, 0.001) : 1), [seriesDisp]);
  const maxStress = useMemo(() => (seriesStress ? Math.max(...seriesStress, 0.001) : 1), [seriesStress]);

  const activeColor = strikes.find((s) => s.id === selectedId)?.color ?? '#ffb454';

  return (
    <div className="deck-grid deck-grid-anim">
      <section className="panel panel-play">
        <PanelHead index="06" title="回放控制" sub="PLAYBACK" />
        <div className="transport">
          <button className="icon-btn" onClick={restart} title="从头回放 (R)">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 5v14M20 5l-11 7 11 7z" fill="currentColor" /></svg>
          </button>
          <button className="icon-btn icon-btn-main" onClick={togglePlay} title="播放/暂停 (空格)">
            {playing ? (
              <svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5l12 7-12 7z" fill="currentColor" /></svg>
            )}
          </button>
          <button className={`icon-btn ${loop ? 'is-on' : ''}`} onClick={() => setLoop(!loop)} title="循环">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 11V9a4 4 0 014-4h9l-3-3M20 13v2a4 4 0 01-4 4H7l3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="speed-group">
            {[0.25, 0.5, 1].map((sp) => (
              <button
                key={sp}
                className={`speed-btn ${speed === sp ? 'is-on' : ''}`}
                onClick={() => setSpeed(sp)}
              >{sp}×</button>
            ))}
          </div>
          <div className="time-readout">
            <strong>{playhead.toFixed(2)}</strong>
            <span>/ {VIEW_DURATION.toFixed(2)} s</span>
          </div>
        </div>

        <div className="scrub-wrap">
          <DecayChart
            disp={seriesDisp}
            stress={seriesStress}
            peakDisp={peakDisp}
            maxStress={maxStress}
            playhead={playhead}
            accent={activeColor}
            onSeek={seek}
          />
        </div>

        <input
          className="slider scrub"
          type="range"
          min={0}
          max={VIEW_DURATION}
          step={0.001}
          value={Math.min(VIEW_DURATION, playhead)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="播放进度"
        />
        <div className="scrub-legend">
          <span><i className="lg lg-disp" /> 形变峰值</span>
          <span><i className="lg lg-stress" /> 应力峰值</span>
          <span className="scrub-note">视图时间 · 振动慢放 {TIME_DILATION}×</span>
        </div>
      </section>

      <section className="panel panel-view">
        <PanelHead index="07" title="视图与着色" sub="VIEW &amp; SHADING" />
        <div className="seg">
          {([
            ['stress', '应力着色'],
            ['displacement', '位移着色'],
            ['plain', '素色鼓皮'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              className={`seg-btn ${colorMode === id ? 'is-on' : ''}`}
              onClick={() => setColorMode(id)}
            >{label}</button>
          ))}
        </div>

        <div className="field">
          <div className="field-label">
            形变放大
            <span className="field-value">{exaggeration.toFixed(1)}×</span>
          </div>
          <input
            className="slider"
            type="range"
            min={2}
            max={40}
            step={0.5}
            value={exaggeration}
            onChange={(e) => setExaggeration(Number(e.target.value))}
          />
          <div className="field-scale"><span>2×</span><span>20×</span><span>40× 夸张</span></div>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={showWireframe}
            onChange={(e) => setShowWireframe(e.target.checked)}
          />
          <span>显示网格线框(随应力着色)</span>
        </label>

        <div className="legend">
          <div className="legend-head">动态应力色标(高于静息张力)</div>
          <div className="legend-bar" style={{ background: gradientCss() }} />
          <div className="legend-scale">
            <span>静息</span>
            <span>{sim ? `+${(sim.maxDeltaStress * 0.5).toFixed(1)}` : ''}</span>
            <span className="hot">{sim ? `+${sim.maxDeltaStress.toFixed(1)} MPa` : '0 MPa'}</span>
          </div>
        </div>

        <div className="panel-foot">
          <span className="kbd-hint">空格 播放 · ← → 逐帧 · Esc 取消选中</span>
        </div>
      </section>

      <section className="panel panel-compare">
        <PanelHead index="08" title="多槌对照" sub="STRIKE COMPARISON" />
        {!sim || sim.metrics.length === 0 ? (
          <div className="empty-note">添加敲击后,这里会列出每一槌的形变与应力峰值。</div>
        ) : (
          <table className="cmp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>位置</th>
                <th>峰值形变</th>
                <th>峰值应力</th>
                <th>单敲延音</th>
              </tr>
            </thead>
            <tbody>
              {sim.metrics.map((m, i) => {
                const s = strikes[i];
                return (
                  <tr key={s?.id ?? i} className={i === activeIdx ? 'is-on' : ''}>
                    <td><span className="cmp-dot" style={{ background: s?.color ?? '#fff' }} />{i + 1}</td>
                    <td>ρ{m.strikeRho.toFixed(2)} · {(m.strikeTheta * 180 / Math.PI).toFixed(0)}°</td>
                    <td>{m.peakDispMm.toFixed(2)} mm</td>
                    <td className="hot">{m.peakStressMpa.toFixed(1)} MPa <span className="cmp-sub">+{m.deltaStressMpa.toFixed(1)}</span></td>
                    <td>{m.sustainSec.toFixed(2)} s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="panel-note">
          多次敲击在场内线性叠加;应力场按叠加后的形变重新求解,
          因此两个波峰相遇处会出现更高的应力集中。
        </p>
      </section>
    </div>
  );
}

function gradientCss(): string {
  const stops = STRESS_STOPS.map(([t, c]) => `${c} ${(t * 100).toFixed(0)}%`);
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

interface ChartProps {
  disp: Float32Array | null;
  stress: Float32Array | null;
  peakDisp: number;
  maxStress: number;
  playhead: number;
  accent: string;
  onSeek: (t: number) => void;
}

/**
 * Envelope chart drawn in view time on a compressed x-axis so the dense
 * impact cluster and the long decay tail are both readable.
 */
function DecayChart({ disp, stress, peakDisp, maxStress, playhead, accent, onSeek }: ChartProps) {
  const W = 620;
  const H = 118;
  const n = FRAME_TIMES.length;

  const toX = (t: number) => {
    const u = Math.sqrt(Math.min(1, Math.max(0, t / VIEW_DURATION)));
    return u * W;
  };
  const dispPath = useMemo(() => buildPath(disp, peakDisp, toX, H), [disp, peakDisp]);
  const stressPath = useMemo(() => buildPath(stress, maxStress, toX, H), [stress, maxStress]);
  const playX = toX(playhead);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const u = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(u * u * VIEW_DURATION);
  };

  return (
    <svg
      className="decay-chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      onClick={handleClick}
      role="presentation"
    >
      <defs>
        <linearGradient id="accentFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.42" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="stressLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffb454" />
          <stop offset="45%" stopColor="#ff7a45" />
          <stop offset="100%" stopColor="#e8442b" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((u) => (
        <line key={u} x1={u * W} y1={0} x2={u * W} y2={H} className="chart-grid" />
      ))}
      <line x1={0} y1={H - 0.5} x2={W} y2={H - 0.5} className="chart-axis" />
      {dispPath.fill && <path d={dispPath.fill} fill="url(#accentFill)" />}
      {dispPath.line && <path d={dispPath.line} className="chart-disp" stroke={accent} />}
      {stressPath.line && <path d={stressPath.line} className="chart-stress" stroke="url(#stressLine)" />}
      <line x1={playX} y1={0} x2={playX} y2={H} className="chart-cursor" />
      <circle cx={playX} cy={4} r={3.2} fill={accent} />
    </svg>
  );

  function buildPath(series: Float32Array | null, max: number, x: (t: number) => number, h: number) {
    if (!series) return { line: '', fill: '' };
    let d = '';
    let area = '';
    for (let i = 0; i < n; i++) {
      const xv = x(FRAME_TIMES[i]);
      const yv = h - 4 - (Math.min(1, series[i] / max) * (h - 14));
      d += `${i === 0 ? 'M' : 'L'}${xv.toFixed(1)},${yv.toFixed(1)}`;
      area += `${i === 0 ? `M${xv.toFixed(1)},${h - 2}L` : 'L'}${xv.toFixed(1)},${yv.toFixed(1)}`;
    }
    area += `L${x(FRAME_TIMES[n - 1]).toFixed(1)},${h - 2}Z`;
    return { line: d, fill: area };
  }
}
