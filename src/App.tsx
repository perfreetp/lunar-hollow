import { useState } from 'react';
import { LighthousePanel } from './components/LighthousePanel';
import { BeamEditor } from './components/BeamEditor';
import { SeaPreview } from './components/SeaPreview';
import { ExportPanel } from './components/ExportPanel';
import { useToolStore } from './store';

type TabId = 'lighthouse' | 'beam' | 'sea' | 'export';

const TABS: { id: TabId; label: string; desc: string }[] = [
  { id: 'lighthouse', label: '灯塔参数台', desc: '灯高 / 灯质 / 光强 / 色温 / 相位' },
  { id: 'beam', label: '光束编辑', desc: '扇形体积 / 旋转俯仰 / 光斑读数' },
  { id: 'sea', label: '海域预览', desc: '拖船、礁石、雾况与遮挡联动' },
  { id: 'export', label: '导出', desc: 'JSON 配置下载与导入' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('sea');
  const lhCount = useToolStore((s) => s.config.lighthouses.length);
  const litCount = useToolStore((s) => s.runtime.filter((r) => r.shipLit).length);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <div>
            <h1>航标灯塔光束体积渲染工具</h1>
            <p>Volumetric Lighthouse Beam Workbench · three.js + postprocessing</p>
          </div>
        </div>
        <div className="header-stats">
          <span>同屏灯塔 <b>{lhCount}</b></span>
          <span className={litCount > 0 ? 'lit-badge' : ''}>照亮船体 <b>{litCount}</b></span>
        </div>
      </header>

      <div className="app-body">
        <nav className="tab-rail">
          {TABS.map((t) => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="tab-label">{t.label}</span>
              <span className="tab-desc">{t.desc}</span>
            </button>
          ))}
        </nav>

        <main className="tab-content">
          {tab === 'lighthouse' && <LighthousePanel />}
          {tab === 'beam' && <BeamEditor />}
          {tab === 'sea' && <SeaPreview />}
          {tab === 'export' && <ExportPanel />}
        </main>
      </div>
    </div>
  );
}
