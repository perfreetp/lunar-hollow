import { createSignal } from 'solid-js';
import { config } from '../store';
import {
  exportConfig,
  importConfig,
  resetConfig,
  setGrid,
  setSpacing,
  spacingBounds,
} from '../store';

export default function Toolbar() {
  const fileInput = () => document.getElementById('import-file') as HTMLInputElement | null;
  const [message, setMessage] = createSignal<string | null>(null);
  let flashTimer: ReturnType<typeof setTimeout> | null = null;

  function flash(text: string) {
    setMessage(text);
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => setMessage(null), 2600);
  }

  async function handleFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await importConfig(file);
      flash('配置导入成功，层叠设置已恢复');
    } catch (err) {
      flash(`导入失败：${err instanceof Error ? err.message : '未知错误'}`);
    }
    input.value = '';
  }

  return (
    <header class="toolbar">
      <div class="brand">
        <span class="brand-dot" />
        <h1>玻璃幕墙层叠光学预览</h1>
      </div>

      <div class="tool-group">
        <label class="tool-field">
          网格
          <input
            type="number"
            min={1}
            max={40}
            value={config.cols}
            onChange={(e) => setGrid(Number(e.currentTarget.value), config.rows)}
          />
          ×
          <input
            type="number"
            min={1}
            max={40}
            value={config.rows}
            onChange={(e) => setGrid(config.cols, Number(e.currentTarget.value))}
          />
        </label>

        <label class="tool-field">
          层间距
          <input
            type="range"
            min={spacingBounds.min}
            max={spacingBounds.max}
            step={0.005}
            value={config.spacing}
            onInput={(e) => setSpacing(Number(e.currentTarget.value))}
          />
          <span class="field-value">{(config.spacing * 1000).toFixed(0)}mm</span>
        </label>
      </div>

      <div class="tool-group">
        <button class="btn primary" onClick={() => exportConfig()}>
          导出配置
        </button>
        <button class="btn" onClick={() => fileInput()?.click()}>
          导入配置
        </button>
        <button
          class="btn danger"
          onClick={() => {
            resetConfig();
            flash('已恢复默认四十层配置');
          }}
        >
          重置
        </button>
        <input id="import-file" type="file" accept="application/json,.json" hidden onChange={handleFile} />
      </div>

      {message() && <div class="flash-toast">{message()}</div>}
    </header>
  );
}
