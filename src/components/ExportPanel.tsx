import { useRef, useState } from 'react';
import { useApp } from '../store';
import { PanelHead } from './DrumPanel';
import { MATERIALS, FINISHES, TENSION_LEVELS, tensionFor, levelLabel, type ExportBundle } from '../sim/types';

/** Module 4: export / import the whole setup as one file. */
export function ExportPanel() {
  const config = useApp((s) => s.config);
  const strikes = useApp((s) => s.strikes);
  const makeBundle = useApp((s) => s.makeBundle);
  const applyBundle = useApp((s) => s.applyBundle);
  const resetAll = useApp((s) => s.resetAll);
  const exaggeration = useApp((s) => s.exaggeration);
  const colorMode = useApp((s) => s.colorMode);
  const speed = useApp((s) => s.speed);
  const selectedStrikeId = useApp((s) => s.selectedStrikeId);
  const sim = useApp((s) => s.sim);
  const [toast, setToast] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [showJson, setShowJson] = useState(false);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const bundle: ExportBundle = {
    kind: 'drumhead-tension-lab',
    version: 1,
    savedAt: new Date().toISOString(),
    config,
    strikes: strikes.map(({ id, ...rest }) => ({ id, ...rest })),
    view: { exaggeration, colorMode, playbackSpeed: speed, activeStrikeId: selectedStrikeId },
  };
  const json = JSON.stringify(bundle, null, 2);

  const download = () => {
    const blob = new Blob([JSON.stringify(makeBundle(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `drumhead-${config.diameterIn}in-${config.materialId}-T${config.tensionLevel}-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash('已导出配置文件');
  };

  const readFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ExportBundle;
      if (!parsed || parsed.kind !== 'drumhead-tension-lab') {
        flash('不是本工具的配置文件');
        return;
      }
      applyBundle(parsed);
      flash(`已导入 ${parsed.strikes?.length ?? 0} 个敲击配置`);
    } catch {
      flash('文件解析失败');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      flash('配置 JSON 已复制');
    } catch {
      flash('复制失败,请手动选择文本');
    }
  };

  return (
    <div className="deck-grid deck-grid-io">
      <section className="panel">
        <PanelHead index="09" title="配置摘要" sub="PRESET SUMMARY" />
        <div className="summary-grid">
          <SummaryRow label="鼓体" value={`${config.diameterIn}" × ${config.depthIn.toFixed(1)}"`} />
          <SummaryRow label="饰面" value={FINISHES[config.finishId].name} />
          <SummaryRow label="鼓皮" value={MATERIALS[config.materialId].name} />
          <SummaryRow
            label="张力"
            value={`${config.tensionLevel}/${TENSION_LEVELS} · ${tensionFor(config.materialId, config.tensionLevel).toFixed(0)} N/m`}
          />
          <SummaryRow label="张力档位" value={levelLabel(config.tensionLevel)} />
          <SummaryRow label="敲击数量" value={`${strikes.length} 处`} />
          <SummaryRow label="基频" value={sim ? `${sim.headInfo.f0.toFixed(0)} Hz` : '—'} />
          <SummaryRow label="峰值应力" value={sim ? `${sim.peakStressMpa.toFixed(1)} MPa` : '—'} hot />
        </div>
        {strikes.length > 0 && (
          <div className="summary-strikes">
            {strikes.map((s, i) => (
              <span key={s.id} className="summary-chip" style={{ borderColor: s.color, color: s.color }}>
                {i + 1} · ρ{s.rho.toFixed(2)}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <PanelHead index="10" title="导出 / 导入" sub="FILE I/O" />
        <div className="io-actions">
          <button className="primary-btn" onClick={download}>
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 20h16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
            导出配置文件
          </button>
          <button className="ghost-btn" onClick={() => fileRef.current?.click()}>
            导入配置文件
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readFile(f);
              e.currentTarget.value = '';
            }}
          />
        </div>

        <div
          className={`drop-zone ${dragging ? 'is-drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void readFile(f);
          }}
        >
          <span className="drop-icon">↓</span>
          <span>拖入导出的 .json 文件即可还原全部鼓体参数与敲击配置</span>
        </div>

        <div className="panel-foot">
          <button className="ghost-btn" onClick={() => setShowJson(!showJson)}>
            {showJson ? '收起 JSON' : '查看 JSON'}
          </button>
          <button className="ghost-btn" onClick={copy}>复制 JSON</button>
          <button className="danger-btn" onClick={() => { resetAll(); flash('已恢复默认');}}>重置全部</button>
        </div>

        {showJson && (
          <pre className="json-view">{json}</pre>
        )}
      </section>

      <section className="panel panel-about">
        <PanelHead index="11" title="模型说明" sub="ABOUT THE MODEL" />
        <ul className="about-list">
          <li><b>预张网格</b>:张力 N/m 换算成膜面波速与基频,中央隆起随张力下降而抬升;最松档位出现边缘皱褶。</li>
          <li><b>敲击形变</b>:圆膜模态(Bessel 驻波,29 阶)以落点与触面尺寸加权叠加,再叠加触面凹陷,得到逐帧位移。</li>
          <li><b>应力场</b>:预张应力 + 本地波面斜率的膜应变 + 曲率的弯曲应变,以及落槌瞬间的接触压力;越靠近波峰与边缘越集中;色标显示的是高于静息张力的动态增量。</li>
          <li><b>慢放</b>:真实鼓皮振动在数百赫兹,动画以 1/34 的时间尺度回放,物理数值仍按真实频率与阻尼给出。</li>
          <li><b>重算</b>:张力换档、材质、尺寸或敲击改动都会在 Worker 中重算全部帧,主线程只负责播放。</li>
        </ul>
        {toast && <div className="toast">{toast}</div>}
      </section>
    </div>
  );
}

function SummaryRow({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="summary-row">
      <span className="summary-label">{label}</span>
      <span className={`summary-value ${hot ? 'hot' : ''}`}>{value}</span>
    </div>
  );
}
