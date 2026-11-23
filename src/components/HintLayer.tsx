import { useApp } from '../store';

/** First-run hint over the 3D view. */
export function HintLayer({ visible }: { visible: boolean }) {
  const tab = useApp((s) => s.tab);
  if (!visible) return null;
  return (
    <div className={`hint-layer ${tab === 'drum' ? 'is-soft' : ''}`}>
      <div className="hint-card">
        <div className="hint-ring">
          <span className="hint-pulse" />
          <span className="hint-pulse hint-pulse-2" />
          <span className="hint-cross" />
        </div>
        <div className="hint-text">
          <strong>点击鼓皮落槌</strong>
          <span>可连续点击多个位置,对比形变与应力分布</span>
        </div>
        <div className="hint-keys">
          <span><kbd>拖动</kbd> 旋转</span>
          <span><kbd>滚轮</kbd> 缩放</span>
          <span><kbd>空格</kbd> 播放</span>
        </div>
      </div>
    </div>
  );
}

/** Tiny decorative swirl in the corner of the app shell. */
export function Hemisphere() {
  return (
    <div className="hemisphere" aria-hidden>
      <svg viewBox="0 0 200 200">
        <defs>
          <radialGradient id="hg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffb454" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#ff7a45" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ff7a45" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#hg)" />
        <circle cx="100" cy="100" r="64" fill="none" stroke="#ffb454" strokeOpacity="0.25" strokeWidth="0.7" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="#ffb454" strokeOpacity="0.12" strokeWidth="0.6" strokeDasharray="2 7" />
      </svg>
    </div>
  );
}
