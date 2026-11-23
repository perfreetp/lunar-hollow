import { useApp } from '../store';
import { DrumPanel } from './DrumPanel';
import { StrikePanel } from './StrikePanel';
import { AnimPanel } from './AnimPanel';
import { ExportPanel } from './ExportPanel';

export function LowerDeck({ onPickFromMap }: { onPickFromMap: (rho: number, theta: number) => void }) {
  const tab = useApp((s) => s.tab);
  return (
    <div className="deck">
      <div className="deck-head">
        <div className="deck-tabs-mini">
          <DeckTab id="drum" label="鼓体与鼓皮" n="01–03" />
          <DeckTab id="strike" label="张力与敲击" n="04–05" />
          <DeckTab id="anim" label="形变动画" n="06–08" />
          <DeckTab id="io" label="配置导出" n="09–11" />
        </div>
      </div>
      <div className="deck-body">
        {tab === 'drum' && <DrumPanel onPickFromMap={onPickFromMap} />}
        {tab === 'strike' && <StrikePanel onPickFromMap={onPickFromMap} />}
        {tab === 'anim' && <AnimPanel />}
        {tab === 'io' && <ExportPanel />}
      </div>
    </div>
  );
}

function DeckTab({ id, label, n }: { id: 'drum' | 'strike' | 'anim' | 'io'; label: string; n: string }) {
  const tab = useApp((s) => s.tab);
  const setTab = useApp((s) => s.setTab);
  return (
    <button
      className={`deck-tab ${tab === id ? 'is-on' : ''}`}
      onClick={() => setTab(id)}
    >
      <span className="deck-tab-n">{n}</span>
      <span className="deck-tab-label">{label}</span>
    </button>
  );
}
