import { NpElement } from './base.ts';
import { CHART } from '../../model/chart-data.ts';
import { formatDistance, formatLatDms, formatLngDms, bearingToCompass } from '../../core/geo.ts';
import { visibilityGrade } from '../../core/atmosphere.ts';
import { escapeHtml } from '../store.ts';

export class NpStatusbar extends NpElement {
  protected setup(): void {
    if (!this.api) return;
    this.innerHTML = `
      <div class="bar">
        <span class="status-item">
          <span class="live-dot" data-live-dot></span>
          <span class="v" data-field="clock">00:00:00</span>
        </span>
        <span class="status-item">
          <span class="k">船位</span>
          <span class="v" data-field="pos">—</span>
        </span>
        <span class="status-item">
          <span class="k">航向</span>
          <span class="v" data-field="hdg">—</span>
        </span>
        <span class="status-item">
          <span class="k">航段</span>
          <span class="v" data-field="leg">—</span>
        </span>
        <span class="status-item">
          <span class="k">最近灯标</span>
          <span class="v" data-field="nearest">—</span>
        </span>
        <span class="status-item optional">
          <span class="k">方位</span>
          <span class="v" data-field="bearing">—</span>
        </span>
        <span class="status-item optional">
          <span class="k">照亮航段</span>
          <span class="v" data-field="lit">—</span>
        </span>
        <span class="status-item optional">
          <span class="k">可见度</span>
          <span class="v" data-field="vis">—</span>
        </span>
        <span class="status-spacer"></span>
        <span class="status-item optional">
          <span class="k">帧</span>
          <span class="v" data-field="frame">—</span>
        </span>
        <span class="status-item">
          <span class="k">海图</span>
          <span class="v">${escapeHtml(CHART.id)} · ${escapeHtml(CHART.edition)}</span>
        </span>
      </div>`;

    this.track(
      this.api.subscribe((state) => {
        const info = this.api?.shipInfo();
        const set = (key: string, value: string, clsName?: string): void => {
          const el = this.q<HTMLElement>(`[data-field="${key}"]`);
          if (!el) return;
          if (el.textContent !== value) el.textContent = value;
          if (clsName !== undefined) el.className = `v ${clsName}`;
        };
        if (info) {
          set('pos', `${formatLatDms(info.position.lat, 0)} ${formatLngDms(info.position.lng, 0)}`);
          set('hdg', `${Math.round(info.headingDeg).toString().padStart(3, '0')}° ${bearingToCompass(info.headingDeg)}`);
          set('leg', `${(info.alongM / 1852).toFixed(2)} nm`);
          set('nearest', info.nearestName || '—');
          set('bearing', info.nearestId ? info.nearestBearing : '—');
          set('lit', formatDistance(state.diagnostics.litLengthM));
        }
        set('vis', `${visibilityGrade(state.visibility).label} · ${visibilityGrade(state.visibility).short}`);
        const frameText = state.diagnostics.fps > 0 ? `${Math.round(state.diagnostics.fps)} fps · ${state.diagnostics.frameMs.toFixed(1)} ms` : '—';
        set(
          'frame',
          frameText,
          state.diagnostics.fps > 0 && state.diagnostics.fps < 40 ? 'warn' : state.diagnostics.fps >= 50 ? 'good' : undefined,
        );
        const dot = this.q<HTMLElement>('[data-live-dot]');
        if (dot) dot.classList.toggle('paused', state.motion === 'frozen');
      }),
    );

    const tick = (): void => {
      const el = this.q<HTMLElement>('[data-field="clock"]');
      if (el) {
        const now = new Date();
        el.textContent = now.toTimeString().slice(0, 8);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    this.track(() => window.clearInterval(timer));
  }
}

customElements.define('np-statusbar', NpStatusbar);
