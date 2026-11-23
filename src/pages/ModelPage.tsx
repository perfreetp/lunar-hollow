// 页面 1:机构模型 — 三维模型总览、部件清单、关键点标注
import { Show } from 'solid-js';
import Viewport, { type ViewportApi } from '../components/Viewport';
import ReadoutPanel from '../components/ReadoutPanel';
import { checking, interference, showLabels, setShowLabels, showHighlights, setShowHighlights } from '../store';
import { exportScreenshot } from '../controllers/exporters';

const PARTS = [
  { name: '人字门门叶 ×2', desc: '绕支铰旋转,0° 关闭成拱 / 90° 全开藏入门龛' },
  { name: '支铰 ×2', desc: '门叶竖直转轴,固定于两侧闸墙' },
  { name: '连杆 ×2', desc: '两端铰接,连接活塞杆头与门叶铰点' },
  { name: '液压启闭机 ×2', desc: '缸筒铰装于墙顶支座,活塞杆随开度伸缩' },
  { name: '闸室墙 ×2', desc: '含门龛凹槽(manifold 布尔差集生成)' },
  { name: '闸室障碍块', desc: '模拟闸室壁凸起,用于演示干涉检测' },
];

export default function ModelPage() {
  let api: ViewportApi | null = null;
  return (
    <div class="page">
      <div class="page-main">
        <Viewport apiRef={(a) => (api = a)} />
      </div>
      <aside class="page-side">
        <h2>机构模型</h2>
        <div class="toggles">
          <label>
            <input type="checkbox" checked={showLabels()} onChange={(e) => setShowLabels(e.currentTarget.checked)} />
            关键点标注
          </label>
          <label>
            <input
              type="checkbox"
              checked={showHighlights()}
              onChange={(e) => setShowHighlights(e.currentTarget.checked)}
            />
            干涉高亮
          </label>
        </div>
        <h3>部件清单</h3>
        <ul class="part-list">
          {PARTS.map((p) => (
            <li>
              <b>{p.name}</b>
              <span>{p.desc}</span>
            </li>
          ))}
        </ul>
        <h3>实时读数</h3>
        <ReadoutPanel />
        <Show when={checking()}>
          <div class="status-line">干涉重算中…</div>
        </Show>
        <Show when={interference() && interference()!.hits.length > 0}>
          <div class="status-line warn">当前开度存在 {interference()!.hits.length} 处干涉</div>
        </Show>
        <button class="btn" onClick={() => api && exportScreenshot(api.capture())}>
          导出当前截图 PNG
        </button>
      </aside>
    </div>
  );
}
