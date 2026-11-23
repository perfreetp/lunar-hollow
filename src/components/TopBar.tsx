import { useApp } from '../store';
import { MATERIALS, TENSION_LEVELS, tensionFor, levelLabel } from '../sim/types';

export function TopBar() {
  const config = useApp((s) => s.config);
  const sim = useApp((s) => s.sim);
  const tab = useApp((s) => s.tab);
  const setTab = useApp((s) => s.setTab);
  const mat = MATERIALS[config.materialId];
  const T = tensionFor(config.materialId, config.tensionLevel);

  const tabs: Array<{ id: typeof tab; label: string; en: string }> = [
    { id: 'drum', label: '鼓体与鼓皮', en: 'SHELL' },
    { id: 'strike', label: '张力与敲击', en: 'STRIKE' },
    { id: 'anim', label: '形变动画', en: 'MOTION' },
    { id: 'io', label: '配置导出', en: 'EXPORT' },
  ];

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark" aria-hidden>
          <span className="brand-ring" />
          <span className="brand-ring brand-ring-2" />
          <span className="brand-core" />
        </div>
        <div className="brand-text">
          <div className="brand-title">鼓皮张力形变台</div>
          <div className="brand-sub">DRUMHEAD TENSION &amp; STRIKE LAB</div>
        </div>
      </div>

      <nav className="tabs" role="tablist" aria-label="模块">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-dot" />
            <span className="tab-label">{t.label}</span>
            <span className="tab-en">{t.en}</span>
          </button>
        ))}
      </nav>

      <div className="topstats">
        <Stat label="鼓皮" value={mat.name} />
        <Stat label="直径" value={`${config.diameterIn}"`} />
        <Stat
          label="张力"
          value={`${T.toFixed(0)} N/m`}
          hint={`${config.tensionLevel}/${TENSION_LEVELS} · ${levelLabel(config.tensionLevel)}`}
        />
        <Stat
          label="基频"
          value={sim ? `${sim.headInfo.f0.toFixed(0)} Hz` : '—'}
        />
        <Stat
          label="峰值应力"
          value={sim ? `${sim.peakStressMpa.toFixed(1)} MPa` : '—'}
          accent
        />
      </div>
    </header>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`stat ${accent ? 'is-accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
