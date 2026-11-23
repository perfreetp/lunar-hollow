import { NpElement } from './base.ts';
import { CHART } from '../../model/chart-data.ts';
import { formatDistance, haversineM } from '../../core/geo.ts';
import { describeLightCharacter, parseLightCharacter } from '../../core/light-character.ts';
import { lightColorHex as LIGHT_COLOR_HEX } from '../../core/voyage.ts';
import type { AppState } from '../../app/state.ts';
import type { LightView } from '../../render/glow-renderer.ts';
import { escapeHtml } from '../store.ts';
import { DEPTH_BANDS } from '../../model/depth-field.ts';

export class NpSidepanel extends NpElement {
  private rowRefs = new Map<string, { row: HTMLButtonElement; dot: HTMLElement; dist: HTMLElement; name: HTMLElement }>();

  protected setup(): void {
    if (!this.api) return;
    const characters = new Map(
      CHART.aids.map((a) => [a.id, describeLightCharacter(parseLightCharacter(a.characteristic))]),
    );

    this.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <h2>灯标名录</h2>
          <span class="count">${CHART.aids.length} 座 · ${CHART.id}</span>
        </div>
        <div class="panel-scroll">
          <div class="section">
            <div class="aid-list" role="listbox" aria-label="灯标列表">
              ${CHART.aids
                .map(
                  (aid) => `
                <button type="button" class="aid-row" data-aid="${aid.id}" role="option" aria-selected="false">
                  <span class="aid-dot" style="--dot-color:${LIGHT_COLOR_HEX(aid.color)}"></span>
                  <span class="nm">
                    <b>${escapeHtml(aid.name)}</b>
                    <small>${escapeHtml(aid.characteristic)} · ${escapeHtml(characters.get(aid.id) ?? '')}</small>
                  </span>
                  <span class="dist" data-dist>—</span>
                </button>`,
                )
                .join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="label">大气与光晕</span>
            </div>
            <div class="field">
              <div class="field-head">
                <label for="eye-height">眼高 EYE HEIGHT</label>
                <output data-out="eye">9.5 m</output>
              </div>
              <input id="eye-height" type="range" min="2" max="30" step="0.5" value="9.5" data-input="eye" />
            </div>
            <div class="field">
              <div class="field-head">
                <label>光晕尺度 SCALE</label>
              </div>
              <div class="seg" data-seg="scale">
                <button type="button" data-scale="ground">地面尺度</button>
                <button type="button" data-scale="screen">屏幕尺度</button>
              </div>
            </div>
            <div class="field">
              <div class="field-head">
                <label>灯质驱动 MOTION</label>
              </div>
              <div class="seg" data-seg="motion">
                <button type="button" data-motion="animated">闪烁</button>
                <button type="button" data-motion="frozen">定格</button>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="label">图层</span>
            </div>
            <label class="toggle-row">照明航段<code class="eyebrow">ROUTE</code>
              <input type="checkbox" data-flag="showRoute" checked />
            </label>
            <label class="toggle-row">指向扇区<code class="eyebrow">SECTOR</code>
              <input type="checkbox" data-flag="showSectors" checked />
            </label>
            <label class="toggle-row">水深注记<code class="eyebrow">SOUNDINGS</code>
              <input type="checkbox" data-flag="showSoundings" checked />
            </label>
            <label class="toggle-row">经纬网<code class="eyebrow">GRATICULE</code>
              <input type="checkbox" data-flag="showGraticule" checked />
            </label>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="label">水深色阶 · DEPTH</span>
            </div>
            <div class="legend-scale" aria-hidden="true">
              ${DEPTH_BANDS.map((b) => `<span class="${b.key}"></span>`).join('')}
            </div>
            <div class="legend-ticks">
              <span>0</span><span>2</span><span>5</span><span>10</span><span>15</span><span>20+ m</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="label">航段</span>
              <button type="button" class="btn ghost" data-action="focus-route">全览</button>
            </div>
            <dl class="kv">
              <dt>航段</dt><dd>${escapeHtml(CHART.route.name)}</dd>
              <dt>航路点</dt><dd>${CHART.route.waypoints.length}</dd>
              <dt>计划航速</dt><dd>${CHART.route.sogKn.toFixed(1)} kn</dd>
              <dt>吃水</dt><dd>${CHART.route.draftM.toFixed(1)} m</dd>
            </dl>
            <button type="button" class="btn primary panel-export" data-action="export">
              <span class="glyph">⇩</span>导出航段配置
            </button>
          </div>
        </div>
      </div>`;

    // Cache row refs.
    for (const row of this.qa<HTMLButtonElement>('.aid-row')) {
      const id = row.dataset.aid as string;
      this.rowRefs.set(id, {
        row,
        dot: row.querySelector('.aid-dot') as HTMLElement,
        dist: row.querySelector('[data-dist]') as HTMLElement,
        name: row.querySelector('b') as HTMLElement,
      });
    }

    this.track(
      this.api.subscribe((state) => {
        this.applyState(state);
      }),
    );

    this.track(
      this.api.subscribeToasts(() => {
        /* the toast component owns rendering */
      }),
    );

    this.on(this, 'click', (ev) => {
      const target = ev.target as HTMLElement;
      const row = target.closest<HTMLButtonElement>('.aid-row');
      if (row) {
        const id = row.dataset.aid as string;
        const current = this.api?.getState().selectedAidId;
        this.api?.selectAid(current === id ? null : id);
        return;
      }
      const scale = target.closest<HTMLButtonElement>('[data-scale]');
      if (scale) {
        this.api?.setScaleMode(scale.dataset.scale === 'screen' ? 'screen' : 'ground');
        return;
      }
      const motion = target.closest<HTMLButtonElement>('[data-motion]');
      if (motion) {
        this.api?.setMotion(motion.dataset.motion === 'frozen' ? 'frozen' : 'animated');
        return;
      }
      if (target.closest('[data-action="focus-route"]')) this.api?.focusRoute();
      if (target.closest('[data-action="export"]')) this.api?.openExport();
    });

    this.on(this, 'pointerover', (ev) => {
      const row = (ev.target as HTMLElement).closest<HTMLButtonElement>('.aid-row');
      if (row) this.api?.hoverAid(row.dataset.aid as string);
    });
    this.on(this, 'pointerleave', () => this.api?.hoverAid(null));

    const eye = this.q<HTMLInputElement>('[data-input="eye"]');
    if (eye) {
      const sync = (): void => {
        const v = Number(eye.value);
        const pct = ((v - 2) / 28) * 100;
        eye.style.setProperty('--fill', `${pct}%`);
        this.api?.setEyeHeight(v);
      };
      this.on(eye, 'input', sync);
      sync();
    }

    for (const cb of this.qa<HTMLInputElement>('[data-flag]')) {
      this.on(cb, 'change', () => {
        const flag = cb.dataset.flag as 'showRoute' | 'showSectors' | 'showSoundings' | 'showGraticule';
        if (cb.checked !== this.api?.getState()[flag]) this.api?.toggleFlag(flag);
      });
    }
  }

  /** Called by the app at 8 Hz with fresh per-light values. */
  updateLights(views: readonly LightView[], nearestId: string | null): void {
    if (!this.api) return;
    const state = this.api.getState();
    const dark = state.mode === 'night';
    const byId = new Map(views.map((v) => [v.aid.id, v]));
    const ship = this.api.shipInfo().position;
    const entries = CHART.aids
      .map((aid) => ({ aid, view: byId.get(aid.id), distanceM: haversineM(ship, aid.position) }))
      .sort((a, b) => a.distanceM - b.distanceM);

    for (const { aid, view, distanceM } of entries) {
      const refs = this.rowRefs.get(aid.id);
      if (!refs) continue;
      const env = view?.envelope ?? 0;
      refs.dot.style.setProperty('--dot-lit', env.toFixed(3));
      refs.dot.classList.toggle('is-dark', env < 0.06);
      refs.dot.style.setProperty(
        '--dot-color',
        aid.color === 'W' ? (dark ? '#fff4d6' : '#d98c00') : LIGHT_COLOR_HEX(aid.color),
      );
      refs.dist.textContent = formatDistance(distanceM);
      refs.row.classList.toggle('is-nearest', aid.id === nearestId);
    }
  }

  private applyState(state: AppState): void {
    for (const b of this.qa<HTMLButtonElement>('[data-scale]')) {
      b.setAttribute('aria-pressed', String(b.dataset.scale === state.scaleMode));
    }
    for (const b of this.qa<HTMLButtonElement>('[data-motion]')) {
      b.setAttribute('aria-pressed', String(b.dataset.motion === state.motion));
    }
    const eye = this.q<HTMLElement>('[data-out="eye"]');
    if (eye) eye.textContent = `${state.eyeHeightM.toFixed(1)} m`;
    const eyeInput = this.q<HTMLInputElement>('[data-input="eye"]');
    if (eyeInput && Number(eyeInput.value) !== state.eyeHeightM) {
      eyeInput.value = String(state.eyeHeightM);
      eyeInput.style.setProperty('--fill', `${((state.eyeHeightM - 2) / 28) * 100}%`);
    }
    for (const cb of this.qa<HTMLInputElement>('[data-flag]')) {
      const flag = cb.dataset.flag as 'showRoute' | 'showSectors' | 'showSoundings' | 'showGraticule';
      cb.checked = state[flag];
    }
    for (const [id, refs] of this.rowRefs) {
      const selected = state.selectedAidId === id;
      refs.row.classList.toggle('is-selected', selected);
      refs.row.setAttribute('aria-selected', String(selected));
    }
    const count = this.q<HTMLElement>('.panel-head .count');
    if (count) count.textContent = `${CHART.aids.length} 座 · ${CHART.id}`;
  }
}

customElements.define('np-sidepanel', NpSidepanel);
