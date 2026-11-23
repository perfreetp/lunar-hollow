import { useApp } from '../store';
import {
  MATERIALS, FINISHES, DRUM_SIZES, TENSION_LEVELS, tensionFor, levelLabel,
  type MaterialId, type FinishId,
} from '../sim/types';

/** Module 1: shell dimensions, head material and finish. */
export function DrumPanel({ onPickFromMap }: { onPickFromMap?: (rho: number, theta: number) => void }) {
  const config = useApp((s) => s.config);
  const setDiameter = useApp((s) => s.setDiameter);
  const setDepth = useApp((s) => s.setDepth);
  const setMaterial = useApp((s) => s.setMaterial);
  const setFinish = useApp((s) => s.setFinish);
  const setTension = useApp((s) => s.setTension);
  const clearStrikes = useApp((s) => s.clearStrikes);
  const sim = useApp((s) => s.sim);

  return (
    <div className="deck-grid deck-grid-drum">
      <section className="panel">
        <PanelHead index="01" title="鼓体尺寸" sub="SHELL SIZE" />
        <div className="field">
          <div className="field-label">
            直径
            <span className="field-value">{config.diameterIn}"</span>
          </div>
          <div className="chips">
            {DRUM_SIZES.map((d) => (
              <button
                key={d}
                className={`chip ${config.diameterIn === d ? 'is-on' : ''}`}
                onClick={() => setDiameter(d)}
              >
                {d}"
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <div className="field-label">
            腔深
            <span className="field-value">{config.depthIn.toFixed(1)}"</span>
          </div>
          <input
            className="slider"
            type="range"
            min={3}
            max={12}
            step={0.5}
            value={config.depthIn}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
          <div className="field-scale"><span>3" 军鼓</span><span>8" 中线</span><span>12" 落地</span></div>
        </div>
        <div className="field">
          <div className="field-label">鼓腔饰面</div>
          <div className="swatches">
            {(Object.keys(FINISHES) as FinishId[]).map((f) => (
              <button
                key={f}
                className={`swatch ${config.finishId === f ? 'is-on' : ''}`}
                onClick={() => setFinish(f)}
                title={FINISHES[f].name}
              >
                <span className="swatch-dot" style={{ background: FINISHES[f].color }} />
                {FINISHES[f].name}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-foot">
          <button className="ghost-btn" onClick={clearStrikes} disabled={!sim}>
            清空全部敲击
          </button>
          <button className="ghost-btn" onClick={() => onPickFromMap?.(0.62, 0.8)}>
            示例打击点
          </button>
        </div>
      </section>

      <section className="panel">
        <PanelHead index="02" title="鼓皮材质" sub="HEAD MATERIAL" />
        <div className="mat-grid">
          {(Object.keys(MATERIALS) as MaterialId[]).map((id) => {
            const m = MATERIALS[id];
            return (
              <button
                key={id}
                className={`mat-card ${config.materialId === id ? 'is-on' : ''}`}
                onClick={() => setMaterial(id)}
              >
                <span className="mat-swatch" style={{ background: m.headColor }} />
                <span className="mat-body">
                  <span className="mat-name">{m.name}</span>
                  <span className="mat-en">{m.en}</span>
                  <span className="mat-blurb">{m.blurb}</span>
                  <span className="mat-spec">
                    {m.thicknessMm.toFixed(2)} mm · {m.tensionMin}–{m.tensionMax} N/m
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel panel-tension">
        <PanelHead index="03" title="张力档位" sub="TENSION LEVEL" />
        <div className="tension-dial">
          <div className="tension-num">
            {config.tensionLevel}
            <span className="tension-num-total">/ {TENSION_LEVELS}</span>
          </div>
          <div className="tension-meta">
            <div className="tension-name">{levelLabel(config.tensionLevel)}</div>
            <div className="tension-value">{tensionFor(config.materialId, config.tensionLevel).toFixed(0)} N/m</div>
          </div>
        </div>
        <div className="tension-steps">
          {Array.from({ length: TENSION_LEVELS }, (_, i) => i + 1).map((lv) => (
            <button
              key={lv}
              className={`tension-step ${config.tensionLevel === lv ? 'is-on' : ''}`}
              onClick={() => setTension(lv)}
              aria-label={`张力档 ${lv}`}
            >
              <span className="tension-bar" style={{ height: `${24 + lv * 9}%` }} />
              <span className="tension-lv">{lv}</span>
            </button>
          ))}
        </div>
        <p className="panel-note">
          每调一档,鼓皮预张网格与全部形变帧都会在 Worker 中重算;
          张力越高,中央隆起越低,基频越高,同样力度下的凹陷越浅。
        </p>
      </section>
    </div>
  );
}

export function PanelHead({ index, title, sub }: { index: string; title: string; sub: string }) {
  return (
    <div className="panel-head">
      <span className="panel-index">{index}</span>
      <div className="panel-titles">
        <h2 className="panel-title">{title}</h2>
        <span className="panel-sub">{sub}</span>
      </div>
    </div>
  );
}
