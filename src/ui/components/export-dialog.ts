import { NpElement } from './base.ts';
import type { ExportFormat } from '../../core/voyage-export.ts';
import {
  exportFileName,
  serializeExport,
  type ExportedFile,
} from '../../core/voyage-export.ts';

const FORMATS: Array<{ id: ExportFormat; name: string; desc: string }> = [
  { id: 'json', name: 'JSON', desc: '完整航段配置：船位、灯标光程、大气参数' },
  { id: 'geojson', name: 'GeoJSON', desc: '航路点与灯标点位，可直接导入 GIS' },
  { id: 'briefing', name: '简报 TXT', desc: '可打印的航行简报，锚定灯质与方位' },
];

export class NpExportDialog extends NpElement {
  private format: ExportFormat = 'json';
  private lastFile: ExportedFile | null = null;

  protected setup(): void {
    if (!this.api) return;
    this.innerHTML = '';
    this.track(
      this.api.subscribe((state) => {
        const open = state.exportOpen;
        this.classList.toggle('is-open', open);
        if (open && !this.querySelector('.dialog')) this.paint();
      }),
    );

    this.on(document, 'keydown', (ev) => {
      if (ev.key === 'Escape' && this.classList.contains('is-open')) {
        this.api?.closeExport();
      }
    });
  }

  private paint(): void {
    this.innerHTML = `
      <div class="dialog-scrim" data-close></div>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <div class="dialog-head">
          <h2 id="export-title">导出航段配置</h2>
          <p>当前船位、昼夜与能见度档位会一并写入文件；灯标光程按同一大气模型求解。</p>
        </div>
        <div class="dialog-body">
          <div class="format-grid" role="group" aria-label="导出格式">
            ${FORMATS.map(
              (f) => `
              <button type="button" class="format-card" data-format="${f.id}" aria-pressed="${f.id === this.format}">
                <b>${f.name}</b>
                <small>${f.desc}</small>
              </button>`,
            ).join('')}
          </div>
          <pre class="preview" data-preview></pre>
        </div>
        <div class="dialog-foot">
          <span class="fname" data-fname></span>
          <button type="button" class="btn ghost" data-copy>复制</button>
          <button type="button" class="btn ghost" data-close>取消</button>
          <button type="button" class="btn primary" data-download>下载文件</button>
        </div>
      </div>`;

    this.on(this, 'click', (ev) => {
      const target = ev.target as HTMLElement;
      if (target.closest('[data-close]')) {
        this.api?.closeExport();
        return;
      }
      const fmt = target.closest<HTMLButtonElement>('[data-format]');
      if (fmt) {
        this.format = fmt.dataset.format as ExportFormat;
        for (const b of this.qa<HTMLButtonElement>('[data-format]')) {
          b.setAttribute('aria-pressed', String(b.dataset.format === this.format));
        }
        this.refresh();
        return;
      }
      if (target.closest('[data-download]')) {
        this.download();
        return;
      }
      if (target.closest('[data-copy]')) {
        void this.copy();
      }
    });

    this.refresh();
  }

  private refresh(): void {
    if (!this.api) return;
    // Regenerate on format change so the JSON/GeoJSON text reflects the mode.
    this.lastFile = this.api.doExport(this.format);
    const serialized = serializeExport(this.lastFile, this.format);
    const preview = this.q<HTMLElement>('[data-preview]');
    if (preview) preview.textContent = serialized.text.slice(0, 2600);
    const name = this.q<HTMLElement>('[data-fname]');
    if (name) name.textContent = exportFileName(this.lastFile, this.format);
  }

  private download(): void {
    if (!this.api) return;
    const file = this.lastFile ?? this.api.doExport(this.format);
    const serialized = serializeExport(file, this.format);
    const name = exportFileName(file, this.format);
    const blob = new Blob([serialized.text], { type: `${serialized.mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    this.api.toast(`已导出 ${name}`);
    this.api.closeExport();
  }

  private async copy(): Promise<void> {
    if (!this.api) return;
    const file = this.lastFile ?? this.api.doExport(this.format);
    const serialized = serializeExport(file, this.format);
    try {
      await navigator.clipboard.writeText(serialized.text);
      this.api.toast('配置已复制到剪贴板');
    } catch {
      this.api.toast('剪贴板不可用，请使用下载');
    }
  }
}

customElements.define('np-export-dialog', NpExportDialog);
