import { sharedCss } from './styles.js';

/**
 * <tool-bar>：导入/导出标线文件、载入示例、万级要素压测场景
 */
export class ToolBar extends HTMLElement {
  private root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.root.innerHTML = `
      <style>${sharedCss}
        .bar { display:flex; gap:8px; padding:10px 14px; align-items:center; }
        .title { font-weight:700; font-size:14px; margin-right:8px; white-space:nowrap; }
        .dot { color: var(--accent); }
        input[type=file] { display:none; }
      </style>
      <div class="bar panel">
        <span class="title">跑道标志线渲染器 <span class="dot">●</span></span>
        <button id="btn-demo">示例跑道</button>
        <button id="btn-stress">压测场景（万级标线）</button>
        <button id="btn-clear" class="ghost">清空</button>
        <span style="flex:1"></span>
        <button id="btn-export">导出标线文件</button>
        <button id="btn-import" class="ghost">导入标线文件</button>
        <input type="file" id="file-input" accept=".json,application/json">
      </div>`;

    const fire = (name: string, detail?: unknown) =>
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));

    this.root.getElementById('btn-demo')!.addEventListener('click', () => fire('load-demo'));
    this.root.getElementById('btn-stress')!.addEventListener('click', () => fire('load-stress'));
    this.root.getElementById('btn-clear')!.addEventListener('click', () => fire('clear-all'));
    this.root.getElementById('btn-export')!.addEventListener('click', () => fire('export-file'));
    this.root.getElementById('btn-import')!.addEventListener('click', () => {
      this.root.getElementById('file-input')!.click();
    });
    this.root.getElementById('file-input')!.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) fire('import-file', { file });
      input.value = '';
    });
  }
}

customElements.define('tool-bar', ToolBar);
