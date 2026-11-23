import { NpElement } from './base.ts';
import type { VisibilityGradeId } from '../../core/atmosphere.ts';
import { VISIBILITY_GRADES } from '../../core/atmosphere.ts';

const VIS_LABELS: Record<VisibilityGradeId, string> = {
  clear: '晴朗',
  good: '良好',
  moderate: '中等',
  poor: '能见度差',
  fog: '浓雾',
};

export class NpTopbar extends NpElement {
  protected setup(): void {
    if (!this.api) return;
    this.innerHTML = `
      <div class="bar">
        <div class="brand">
          <span class="brand-mark">NP·02</span>
          <div>
            <div class="brand-title">夜航灯标</div>
          </div>
          <span class="brand-sub">BAIJIAO PASSAGE · CHART 18402</span>
        </div>

        <div class="bar-spacer"></div>

        <div class="bar-group group-mode" role="group" aria-label="昼夜模式">
          <div class="seg" data-seg="mode">
            <button type="button" data-mode="night">夜航</button>
            <button type="button" data-mode="day">昼间</button>
          </div>
        </div>

        <div class="bar-group group-vis" role="group" aria-label="能见度档位">
          <div class="seg" data-seg="visibility">
            ${VISIBILITY_GRADES.map(
              (g) =>
                `<button type="button" data-vis="${g.id}" title="${g.label} · ${g.short}">${g.short}</button>`,
            ).join('')}
          </div>
        </div>

        <div class="bar-group group-stats">
          <div class="stat-chip">
            <span class="k">FPS</span>
            <span class="v" data-stat="fps">—</span>
          </div>
          <div class="stat-chip">
            <span class="k">光晕</span>
            <span class="v" data-stat="draw">—</span>
          </div>
          <div class="stat-chip">
            <span class="k">叠压</span>
            <span class="v" data-stat="overlap">—</span>
          </div>
        </div>

        <div class="bar-group group-export">
          <button type="button" class="btn primary" data-action="export">
            <span class="glyph">⇩</span>导出航段
          </button>
        </div>
      </div>`;

    this.track(
      this.api.subscribe((state) => {
        for (const b of this.qa<HTMLButtonElement>('[data-mode]')) {
          b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode));
        }
        for (const b of this.qa<HTMLButtonElement>('[data-vis]')) {
          b.setAttribute('aria-pressed', String(b.dataset.vis === state.visibility));
        }
        const fps = this.q<HTMLElement>('[data-stat="fps"]');
        if (fps) {
          fps.textContent = state.diagnostics.fps > 0 ? `${Math.round(state.diagnostics.fps)}` : '—';
          fps.classList.toggle('good', state.diagnostics.fps >= 50);
          fps.classList.toggle('warn', state.diagnostics.fps > 0 && state.diagnostics.fps < 40);
        }
        const draw = this.q<HTMLElement>('[data-stat="draw"]');
        if (draw) draw.textContent = `${state.diagnostics.drawCount}`;
        const overlap = this.q<HTMLElement>('[data-stat="overlap"]');
        if (overlap) {
          overlap.textContent = `${state.diagnostics.overlapPairs}`;
          overlap.classList.toggle('warn', state.diagnostics.maxSuppression > 1.2);
        }
      }),
    );

    this.on(this, 'click', (ev) => {
      const target = ev.target as HTMLElement;
      const modeBtn = target.closest<HTMLButtonElement>('[data-mode]');
      if (modeBtn) {
        this.api?.setMode(modeBtn.dataset.mode === 'day' ? 'day' : 'night');
        return;
      }
      const visBtn = target.closest<HTMLButtonElement>('[data-vis]');
      if (visBtn) {
        this.api?.setVisibility(visBtn.dataset.vis as VisibilityGradeId);
        this.api?.toast(`能见度 ${VIS_LABELS[visBtn.dataset.vis as VisibilityGradeId]}`);
        return;
      }
      if (target.closest('[data-action="export"]')) this.api?.openExport();
    });
  }
}

customElements.define('np-topbar', NpTopbar);
