import { useState } from 'react';
import { useApp } from '../store';
import { MAX_STRIKES } from '../sim/types';
import { PanelHead } from './DrumPanel';

/** Module 2: tension + strike tool, plus the strike comparison list. */
export function StrikePanel({ onPickFromMap }: { onPickFromMap?: (rho: number, theta: number) => void }) {
  const config = useApp((s) => s.config);
  const nudgeTension = useApp((s) => s.nudgeTension);
  const setTension = useApp((s) => s.setTension);
  const strikes = useApp((s) => s.strikes);
  const selectedId = useApp((s) => s.selectedStrikeId);
  const selectStrike = useApp((s) => s.selectStrike);
  const removeStrike = useApp((s) => s.removeStrike);
  const toolStrength = useApp((s) => s.toolStrength);
  const toolHardness = useApp((s) => s.toolHardness);
  const setToolStrength = useApp((s) => s.setToolStrength);
  const setToolHardness = useApp((s) => s.setToolHardness);
  const solo = useApp((s) => s.solo);
  const setSolo = useApp((s) => s.setSolo);
  const sim = useApp((s) => s.sim);
  const [hover, setHover] = useState<{ rho: number; theta: number } | null>(null);

  const selected = strikes.find((s) => s.id === selectedId) ?? strikes[strikes.length - 1] ?? null;
  const activeMetrics = sim && selected
    ? sim.metrics[sim.strikeIds.indexOf(selected.id)]
    : null;
  const selIdx = selected ? strikes.indexOf(selected) : -1;
  const maxPeak = sim ? Math.max(...sim.metrics.map((m) => m.deltaStressMpa), 1) : 1;

  return (
    <div className="deck-grid deck-grid-strike">
      <section className="panel">
        <PanelHead index="04" title="张力微调" sub="TENSION TRIM" />
        <div className="trim-row">
          <button className="round-btn" onClick={() => nudgeTension(-1)} aria-label="放松一档">−</button>
          <div className="trim-mid">
            <div className="trim-value">{config.tensionLevel} <span>/ 6</span></div>
            <div className="trim-hint">档位越高,张力越大</div>
          </div>
          <button className="round-btn" onClick={() => nudgeTension(1)} aria-label="收紧一档">+</button>
        </div>
        <div className="trim-track">
          {[1, 2, 3, 4, 5, 6].map((lv) => (
            <button
              key={lv}
              className={`trim-node ${lv <= config.tensionLevel ? 'is-filled' : ''} ${lv === config.tensionLevel ? 'is-on' : ''}`}
              onClick={() => setTension(lv)}
              aria-label={`张力档 ${lv}`}
            />
          ))}
        </div>

        <div className="field">
          <div className="field-label">
            力度
            <span className="field-value">{(toolStrength * 100).toFixed(0)}%</span>
          </div>
          <input
            className="slider"
            type="range"
            min={0.15}
            max={1}
            step={0.01}
            value={toolStrength}
            onChange={(e) => setToolStrength(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <div className="field-label">
            鼓棒硬度
            <span className="field-value">{(toolHardness * 100).toFixed(0)}%</span>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={toolHardness}
            onChange={(e) => setToolHardness(Number(e.target.value))}
          />
          <div className="field-scale"><span>软毡</span><span>中等</span><span>硬头</span></div>
        </div>
        <p className="panel-note">
          在三维鼓皮上点击即可落槌;选中的敲击会被力度与硬度滑杆实时改写。
          按住并拖动是旋转视角,不会误触发敲击。
        </p>
        <div className="panel-foot">
          <button
            className={`toggle-btn ${solo ? 'is-on' : ''}`}
            onClick={() => setSolo(!solo)}
            disabled={strikes.length === 0}
          >
            {solo ? '单敲视图' : '叠加全部'}
          </button>
          {strikes.length > 1 && !solo && (
            <span className="foot-hint">开启单敲视图可隔离每一槌</span>
          )}
          <button className="ghost-btn" onClick={() => onPickFromMap?.(0.28, 2.1)} disabled={strikes.length >= MAX_STRIKES}>
            随机落点
          </button>
        </div>
      </section>

      <section className="panel panel-strikes">
        <PanelHead index="05" title="敲击对比" sub={`STRIKE SET · ${strikes.length}/${MAX_STRIKES}`} />
        {strikes.length === 0 ? (
          <div className="empty-note">
            还没有敲击。点击三维视图中的鼓皮落槌,可连续添加多个位置对比形变差异。
          </div>
        ) : (
          <div className="strike-list">
            {strikes.map((s, i) => {
              const m = sim?.metrics[i];
              const isOn = s.id === selected?.id;
              return (
                <div
                  key={s.id}
                  className={`strike-row ${isOn ? 'is-on' : ''}`}
                  onMouseEnter={() => setHover({ rho: s.rho, theta: s.theta })}
                  onMouseLeave={() => setHover(null)}
                >
                  <button className="strike-main" onClick={() => selectStrike(s.id)}>
                    <span className="strike-dot" style={{ background: s.color, boxShadow: `0 0 12px ${s.color}` }} />
                    <span className="strike-idx">{String(i + 1).padStart(2, '0')}</span>
                    <span className="strike-geo">
                      ρ {s.rho.toFixed(2)} · {(s.theta * 180 / Math.PI).toFixed(0)}°
                    </span>
                    <span className="strike-force">
                      {(s.strength * 100).toFixed(0)}% / {(s.hardness * 100).toFixed(0)}%
                    </span>
                    {m && (
                      <span className="strike-stress">
                        <span className="strike-stress-bar">
                          <span
                            className="strike-stress-fill"
                            style={{ width: `${(m.deltaStressMpa / maxPeak) * 100}%` }}
                          />
                        </span>
                        +{m.deltaStressMpa.toFixed(1)} MPa
                      </span>
                    )}
                  </button>
                  <button
                    className="strike-del"
                    onClick={() => removeStrike(s.id)}
                    aria-label="移除"
                  >×</button>
                </div>
              );
            })}
          </div>
        )}

        {selected && (
          <div className="strike-detail">
            <div className="strike-detail-head">
              <span className="strike-detail-swatch" style={{ background: selected.color }} />
              选中:第 {selIdx + 1} 槌
            </div>
            <div className="detail-grid">
              <Detail label="形变峰值" value={activeMetrics ? `${activeMetrics.peakDispMm.toFixed(2)} mm` : '—'} />
              <Detail label="应力峰值" value={activeMetrics ? `${activeMetrics.peakStressMpa.toFixed(1)} MPa` : '—'} hot />
              <Detail label="凹陷深度" value={activeMetrics ? `${activeMetrics.dentMm.toFixed(2)} mm` : '—'} />
              <Detail label="延音 (−20 dB)" value={activeMetrics ? `${activeMetrics.sustainSec.toFixed(2)} s` : '—'} />
            </div>
          </div>
        )}
        {hover && (
          <div className="hover-readout">
            悬停: ρ {hover.rho.toFixed(2)} · {(hover.theta * 180 / Math.PI).toFixed(0)}°
          </div>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="detail">
      <div className="detail-label">{label}</div>
      <div className={`detail-value ${hot ? 'hot' : ''}`}>{value}</div>
    </div>
  );
}
