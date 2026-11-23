import { NpElement } from './base.ts';
import { CHART } from '../../model/chart-data.ts';
import {
  describeLightCharacter,
  formatPeriod,
  parseLightCharacter,
  sampleLightCharacter,
  LIGHT_COLOR_NAMES,
  type LightCharacter,
} from '../../core/light-character.ts';
import {
  bearingToCompass,
  formatDistance,
  formatLatDms,
  formatLngDms,
  haversineM,
  initialBearingDeg,
  normalizeBearing,
} from '../../core/geo.ts';
import { visibilityGrade } from '../../core/atmosphere.ts';
import { lightColorHex as LIGHT_COLOR_HEX } from '../../core/voyage.ts';
import { escapeHtml } from '../store.ts';
import type { Aid } from '../../model/types.ts';
import type { LightView } from '../../render/glow-renderer.ts';

const KIND_LABEL: Record<string, string> = {
  lighthouse: '灯塔 LIGHTHOUSE',
  beacon: '灯桩 BEACON',
  buoy: '灯浮 BUOY',
  'wreck-buoy': '沉船标 WRECK',
};

export class NpInspector extends NpElement {
  private aid: Aid | null = null;
  private character: LightCharacter | null = null;
  private cursorEl: HTMLElement | null = null;
  private swatchEl: HTMLElement | null = null;
  private litLabelEl: HTMLElement | null = null;
  private lastView: LightView | null = null;
  private raf = 0;
  /**
   * Unsubscribers scoped to the currently rendered panel. `render()` runs on
   * every selection change; registering those listeners through the element's
   * page-lifetime `track()` list would grow it without bound across a long
   * watch, so they are collected here and released on each re-render.
   */
  private renderUnsubs: Array<() => void> = [];

  protected setup(): void {
    if (!this.api) return;
    this.classList.remove('is-open');
    this.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && this.api?.getState().selectedAidId) {
        ev.stopPropagation();
        this.api.selectAid(null);
      }
    });
    this.track(
      this.api.subscribe((state) => {
        this.classList.toggle('is-open', Boolean(state.selectedAidId));
        if (state.selectedAidId !== this.aid?.id) this.render(state.selectedAidId);
      }),
    );
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  protected teardown(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.releaseRenderListeners();
  }

  private releaseRenderListeners(): void {
    for (const un of this.renderUnsubs) un();
    this.renderUnsubs = [];
  }

  private loop(): void {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.aid || !this.character || !this.cursorEl || !this.api) return;
    if (!this.api.getState().selectedAidId) return;
    // Read the phase from the same clock the halos use; the strip must describe
    // the lamp as it is actually painted, including the motion freeze.
    const timing = this.api.timingSample(this.aid.id);
    if (!timing) return;
    const sample = sampleLightCharacter(this.character, timing.fraction * timing.periodS);
    this.cursorEl.style.left = `${(timing.fraction * 100).toFixed(2)}%`;
    this.swatchEl?.style.setProperty('--swatch-lit', sample.intensity.toFixed(3));
    if (this.litLabelEl) {
      this.litLabelEl.textContent = sample.on ? '明亮' : '熄灭';
      this.litLabelEl.style.color = sample.on ? 'var(--cyan)' : 'var(--ink-3)';
    }
  }

  /** React to the renderer's 8 Hz view push for live geometry readouts. */
  updateViews(views: readonly LightView[]): void {
    if (!this.aid) return;
    this.lastView = views.find((v) => v.aid.id === this.aid?.id) ?? null;
    this.refreshLive();
  }

  private refreshLive(): void {
    if (!this.aid || !this.api) return;
    const aid = this.aid;
    const state = this.api.getState();
    const info = this.api.shipInfo();
    const reach = this.api.reachOf(aid.id);
    const set = (key: string, value: string, clsName?: string): void => {
      for (const el of this.qa<HTMLElement>(`[data-live="${key}"]`)) {
        if (el.textContent !== value) el.textContent = value;
        if (clsName !== undefined) el.className = clsName;
      }
    };
    const bearing = normalizeBearing(initialBearingDeg(info.position, aid.position));
    const distanceM = haversineM(info.position, aid.position);
    set('bearing', `${String(Math.round(bearing) % 360).padStart(3, '0')}° ${bearingToCompass(bearing)}`);
    set('distance', formatDistance(distanceM));
    if (reach) {
      set('luminous', `${(reach.luminousRangeM / 1852).toFixed(1)} nm`);
      set('geo', `${(reach.geographicRangeM / 1852).toFixed(1)} nm`);
      set('range', `${(reach.visibleRangeM / 1852).toFixed(1)} nm`);
      set('energy', reach.energy.toFixed(2));
      const inRange = distanceM <= reach.visibleRangeM;
      const pill = this.q<HTMLElement>('[data-live="range-pill"]');
      if (pill) {
        pill.className = `pill ${inRange ? 'ok' : 'bad'}`;
      }
      const pillLabel = this.q<HTMLElement>('[data-live="range-label"]');
      if (pillLabel) pillLabel.textContent = inRange ? '在光程内' : '超出光程';
    }
    if (this.lastView) {
      set('radius', `${Math.round(this.lastView.radiusPx)} px`);
      set('ground', `${Math.round(this.lastView.groundRadiusM)} m`);
      set('live-env', this.lastView.envelope.toFixed(2));
    }
    const needle = this.q<SVGLineElement>('[data-dial-needle]');
    if (needle) {
      const rad = ((bearing - 90) * Math.PI) / 180;
      needle.setAttribute('x2', String(37 + Math.cos(rad) * 25));
      needle.setAttribute('y2', String(37 + Math.sin(rad) * 25));
    }
    const vis = visibilityGrade(state.visibility);
    set('vis', `${vis.label} · ${vis.short}`);
    set('eye', `${state.eyeHeightM.toFixed(1)} m`);
    set('mode', state.mode === 'night' ? '夜间' : '昼间');
  }

  private render(id: string | null): void {
    if (!this.api) return;
    this.releaseRenderListeners();
    if (!id) {
      this.aid = null;
      this.character = null;
      this.innerHTML = '';
      return;
    }
    const aid = CHART.aids.find((a) => a.id === id);
    if (!aid) return;
    this.aid = aid;
    const character = parseLightCharacter(aid.characteristic);
    this.character = character;
    const colorName = character.colors.map((c) => LIGHT_COLOR_NAMES[c]).join('/');
    const period = formatPeriod(character.periodS);
    const litRatio =
      character.phases.filter((p) => p.on).reduce((s, p) => s + p.durationS, 0) / character.periodS;

    this.innerHTML = `
      <div class="panel">
        <div class="insp-head">
          <button type="button" class="insp-close" aria-label="关闭详情">×</button>
          <div class="insp-kind">
            <span class="kind-tag ${aid.kind}">${KIND_LABEL[aid.kind] ?? aid.kind}</span>
            <span class="eyebrow">${escapeHtml(aid.id)}</span>
          </div>
          <h2 class="insp-title">${escapeHtml(aid.name)}</h2>
          <div class="insp-en">${escapeHtml(aid.en)}</div>
        </div>
        <div class="insp-body">
          <div class="char-panel">
            <div class="char-swatch" style="--swatch:${LIGHT_COLOR_HEX(aid.color)};--swatch-lit:0"></div>
            <div class="char-text">
              <span class="char-code">${escapeHtml(aid.characteristic)}</span>
              <span class="char-desc" data-lit-label>熄灭</span>
              <span class="char-desc">${escapeHtml(describeLightCharacter(character))}</span>
            </div>
          </div>

          <div class="timing">
            <div class="timing-strip" data-timing>
              ${character.phases
                .map((p, i) => {
                  const from = character.phases.slice(0, i).reduce((s, q) => s + q.durationS, 0);
                  const left = (from / character.periodS) * 100;
                  const width = (p.durationS / character.periodS) * 100;
                  return `<span class="timing-phase ${p.on ? '' : 'off'}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%;--phase-color:${LIGHT_COLOR_HEX(p.color)}"></span>`;
                })
                .join('')}
              <span class="timing-cursor" data-cursor></span>
            </div>
            <div class="timing-meta">
              <span>0s</span>
              <span>明 ${(litRatio * 100).toFixed(0)}% · 周期 ${period}</span>
              <span>${period}</span>
            </div>
          </div>

          <div class="bearing-block">
            <svg class="dial" viewBox="0 0 74 74" aria-hidden="true">
              <circle class="ring" cx="37" cy="37" r="30" />
              ${Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
                const r1 = i % 3 === 0 ? 24 : 27;
                return `<line class="tick" x1="${(37 + Math.cos(a) * r1).toFixed(1)}" y1="${(37 + Math.sin(a) * r1).toFixed(1)}" x2="${(37 + Math.cos(a) * 30).toFixed(1)}" y2="${(37 + Math.sin(a) * 30).toFixed(1)}" />`;
              }).join('')}
              <text class="north" x="37" y="10" text-anchor="middle">N</text>
              <line class="needle" data-dial-needle x1="37" y1="37" x2="37" y2="12" />
              <circle cx="37" cy="37" r="2" fill="var(--cyan)" />
            </svg>
            <div class="bearing-read">
              <span class="bearing-big" data-live="bearing">—</span>
              <span class="bearing-small">自船位真方位</span>
              <span class="pill ok" data-live="range-pill">
                <span data-live="range-label">—</span>
              </span>
            </div>
          </div>

          <dl class="kv">
            <dt>灯质</dt><dd>${escapeHtml(character.raw)}</dd>
            <dt>颜色</dt><dd>${escapeHtml(colorName)}</dd>
            <dt>周期</dt><dd>${period}</dd>
            <dt>光强</dt><dd>${aid.intensityCd.toLocaleString('en-US')} cd</dd>
            <dt>灯高 / 塔高</dt><dd>${aid.focalHeightM} m / ${aid.towerHeightM} m</dd>
            <dt>图注射程</dt><dd>${aid.nominalRangeNm} nm</dd>
            <dt>大目光程</dt><dd class="hi" data-live="luminous">—</dd>
            <dt>地理视距</dt><dd data-live="geo">—</dd>
            <dt>可见光程</dt><dd class="hi" data-live="range">—</dd>
          </dl>

          <dl class="kv">
            <dt>方位</dt><dd data-live="bearing">—</dd>
            <dt>距离</dt><dd data-live="distance">—</dd>
            <dt>光晕地面半径</dt><dd data-live="ground">—</dd>
            <dt>光晕屏幕半径</dt><dd data-live="radius">—</dd>
            <dt>叠加能量</dt><dd data-live="energy">—</dd>
            <dt>瞬时亮度</dt><dd data-live="live-env">—</dd>
          </dl>

          <dl class="kv">
            <dt>大气</dt><dd data-live="mode">—</dd>
            <dt>能见度</dt><dd data-live="vis">—</dd>
            <dt>眼高</dt><dd data-live="eye">—</dd>
            <dt>位置</dt><dd>${formatLatDms(aid.position.lat)}<br/>${formatLngDms(aid.position.lng)}</dd>
          </dl>

          <dl class="kv">
            <dt>构造</dt><dd>${escapeHtml(aid.structure)}</dd>
            <dt>标志</dt><dd>${escapeHtml(aid.mark)}</dd>
            ${
              aid.sector
                ? `<dt>扇区</dt><dd>${String(aid.sector.fromDeg).padStart(3, '0')}°–${String(aid.sector.toDeg).padStart(3, '0')}°</dd>`
                : ''
            }
          </dl>

          <div class="insp-note">${escapeHtml(CHART.notes[0])}</div>
        </div>
      </div>`;

    this.cursorEl = this.q('[data-cursor]');
    this.swatchEl = this.q('.char-swatch');
    this.litLabelEl = this.q('[data-lit-label]');
    this.lastView = null;

    const close = this.q<HTMLButtonElement>('.insp-close');
    if (close) {
      const handler = (): void => this.api?.selectAid(null);
      close.addEventListener('click', handler);
      this.renderUnsubs.push(() => close.removeEventListener('click', handler));
    }
    this.refreshLive();
  }
}

customElements.define('np-inspector', NpInspector);
