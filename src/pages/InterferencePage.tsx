// 页面 3:干涉检查 — 碰撞部件对列表、高亮、报告导出
import { For, Show } from 'solid-js';
import Viewport, { type ViewportApi } from '../components/Viewport';
import { checking, interference, angle, showHighlights, setShowHighlights } from '../store';
import { recheckNow } from '../controllers/interferenceRunner';
import { exportInterferenceReport, exportScreenshot } from '../controllers/exporters';

export default function InterferencePage() {
  let api: ViewportApi | null = null;
  const report = () => interference();

  return (
    <div class="page">
      <div class="page-main">
        <Viewport apiRef={(a) => (api = a)} showHits={true} />
      </div>
      <aside class="page-side">
        <h2>干涉检查</h2>
        <div class="status-block" classList={{ bad: (report()?.hits.length ?? 0) > 0 }}>
          <Show
            when={!checking()}
            fallback={<span>正在重算(manifold-3d 布尔运算)…</span>}
          >
            <Show
              when={(report()?.hits.length ?? 0) > 0}
              fallback={<span class="ok">✓ 开度 {angle().toFixed(1)}° 下无干涉(检查 {report()?.checkedPairs ?? 0} 对)</span>}
            >
              <span class="bad-text">✗ 开度 {angle().toFixed(1)}° 下发现 {report()!.hits.length} 处干涉</span>
            </Show>
          </Show>
        </div>
        <div class="btn-row">
          <button class="btn" onClick={() => recheckNow()} disabled={checking()}>
            重新计算
          </button>
          <button class="btn" disabled={!report()} onClick={() => report() && exportInterferenceReport(report()!)}>
            导出报告 JSON
          </button>
          <button class="btn" onClick={() => api && exportScreenshot(api.capture(), 'interference')}>
            导出截图
          </button>
        </div>
        <label class="toggles">
          <input type="checkbox" checked={showHighlights()} onChange={(e) => setShowHighlights(e.currentTarget.checked)} />
          高亮干涉区域
        </label>

        <h3>碰撞部件对</h3>
        <table class="hit-table">
          <thead>
            <tr>
              <th>部件 A</th>
              <th>部件 B</th>
              <th>干涉体积 (m³)</th>
            </tr>
          </thead>
          <tbody>
            <For each={report()?.hits ?? []} fallback={
              <tr>
                <td colSpan="3" class="dim">无干涉</td>
              </tr>
            }>
              {(h) => (
                <tr>
                  <td>{h.a}</td>
                  <td>{h.b}</td>
                  <td>{h.volume.toFixed(4)}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <p class="dim note">
          说明:干涉检查在每次开度变化后自动重算;铰接相连的部件对(门叶-连杆、连杆-活塞杆、活塞杆-缸筒)按装配关系排除。
        </p>
      </aside>
    </div>
  );
}
