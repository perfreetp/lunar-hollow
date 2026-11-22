import { ControlPanel } from './components/ControlPanel';
import { RopeCanvas } from './components/RopeCanvas';
import { StatsBar } from './components/StatsBar';

export default function App() {
  return (
    <div className="app">
      <ControlPanel />
      <main className="viewport">
        <RopeCanvas />
        <StatsBar />
        <div className="hint">
          拖动支架头部 / 轮心调整高度与位置 · 拖动车厢沿线移动 · 鼠标拖拽环绕，滚轮缩放
        </div>
      </main>
    </div>
  );
}
