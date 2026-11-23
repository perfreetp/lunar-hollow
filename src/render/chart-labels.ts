/**
 * Chart-ink DOM label overlay.
 *
 * Labels live in a DOM layer rather than in a MapLibre symbol layer: no glyph
 * endpoint, crisp text at every zoom, and the light list can re-style itself
 * reactively without touching the style spec.
 */
import type { Map as MlMap } from 'maplibre-gl';
import { escapeHtml } from '../ui/store.ts';
import type { ChartData } from '../model/types.ts';
import type { LightView } from './glow-renderer.ts';
import { describeLightCharacter } from '../core/light-character.ts';

export interface LabelOverlayDeps {
  map: MlMap;
  container: HTMLElement;
}

interface MarkerElement {
  el: HTMLElement;
  lightId?: string;
}

export class ChartLabels {
  private readonly deps: LabelOverlayDeps;
  private readonly elements: MarkerElement[] = [];
  private readonly aidEls = new Map<string, HTMLElement>();
  private readonly placeEls: HTMLElement[] = [];
  private hoverId: string | null = null;
  private raf = 0;
  private dirty = true;

  constructor(deps: LabelOverlayDeps, chart: ChartData) {
    this.deps = deps;
    this.buildIslandLabels(chart);
    this.buildAidLabels(chart);
    const map = deps.map;
    // Only real camera changes move labels. The old `render` hook re-dirtied on
    // every MapLibre paint, which forced a DOM write pass per frame.
    const invalidate = (): void => this.invalidate();
    map.on('move', invalidate);
    map.on('zoom', invalidate);
    map.on('resize', invalidate);
    // The map has already finished its initial fit by the time this overlay is
    // constructed, so place every label once immediately.
    this.invalidate();
  }

  /** Schedule a single positional update; coalesces bursts of map events. */
  invalidate(): void {
    this.dirty = true;
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (): void => {
    this.raf = 0;
    if (!this.dirty) return;
    this.dirty = false;
    this.update();
  };

  private buildIslandLabels(chart: ChartData): void {
    const layer = this.deps.container;
    for (const island of chart.islands) {
      const el = document.createElement('div');
      el.className = 'chart-place';
      el.textContent = island.name;
      el.dataset.lng = String(island.position.lng);
      el.dataset.lat = String(island.position.lat);
      layer.appendChild(el);
      this.placeEls.push(el);
      this.elements.push({ el });
    }
    for (const note of [
      { lng: 122.102, lat: 30.088, text: '青龙水道', cls: 'water' },
      { lng: 122.193, lat: 30.094, text: '白礁深槽', cls: 'water' },
      { lng: 122.151, lat: 30.139, text: '青龙口', cls: 'channel' },
      { lng: 122.187, lat: 30.022, text: '南口水道', cls: 'channel' },
    ]) {
      const el = document.createElement('div');
      el.className = `chart-water-label ${note.cls}`;
      el.textContent = note.text;
      el.dataset.lng = String(note.lng);
      el.dataset.lat = String(note.lat);
      layer.appendChild(el);
      this.placeEls.push(el);
      this.elements.push({ el });
    }
  }

  private buildAidLabels(chart: ChartData): void {
    for (const aid of chart.aids) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `aid-marker aid-${aid.kind} rank-${aid.rank}`;
      el.dataset.aid = aid.id;
      el.dataset.lng = String(aid.position.lng);
      el.dataset.lat = String(aid.position.lat);
      el.innerHTML = `
        <span class="aid-glyph" aria-hidden="true"></span>
        <span class="aid-label">
          <span class="aid-name">${escapeHtml(aid.name)}</span>
          <span class="aid-sub">${escapeHtml(aid.characteristic)}</span>
        </span>`;
      el.setAttribute('aria-label', `${aid.name} ${aid.characteristic}`);
      this.deps.container.appendChild(el);
      this.aidEls.set(aid.id, el);
      this.elements.push({ el, lightId: aid.id });
    }
  }

  setSelected(id: string | null): void {
    for (const [aidId, el] of this.aidEls) el.classList.toggle('is-selected', aidId === id);
  }

  setHover(id: string | null): void {
    if (this.hoverId === id) return;
    this.hoverId = id;
    for (const [aidId, el] of this.aidEls) el.classList.toggle('is-hover', aidId === id);
  }

  /** Called on the same 8 Hz cadence as the renderer's view push. */
  updateLights(views: readonly LightView[], nearestId: string | null, theme: 'night' | 'day'): void {
    const dark = theme === 'night';
    for (const [id, el] of this.aidEls) {
      const v = views.find((vv) => vv.aid.id === id);
      if (!v) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        continue;
      }
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      el.style.setProperty('--lit', v.envelope.toFixed(3));
      el.classList.toggle('is-lit', v.envelope > 0.08);
      el.classList.toggle('is-nearest', id === nearestId);
      el.classList.toggle('is-clamped', v.clamped);
      const lightColor = v.color === 'W' ? (dark ? '#fff4d6' : '#e09900') : colorCss(v.color, dark);
      if (el.dataset.lightColor !== lightColor) {
        el.dataset.lightColor = lightColor;
        el.style.setProperty('--light-color', lightColor);
      }
      const sub = el.querySelector('.aid-sub') as HTMLElement | null;
      if (sub) {
        const text = `${v.aid.characteristic} · ${v.aid.focalHeightM} m`;
        if (sub.dataset.text !== text) {
          sub.dataset.text = text;
          sub.textContent = text;
        }
      }
      el.title = `${v.aid.name}\n${describeLightCharacter(v.character)}`;
    }
  }

  aidElement(id: string): HTMLElement | undefined {
    return this.aidEls.get(id);
  }

  private update(): void {
    const map = this.deps.map;
    const w = this.deps.container.clientWidth;
    const h = this.deps.container.clientHeight;
    const zoom = map.getZoom();
    const placeVisible = zoom > 10.4;
    for (const el of this.placeEls) {
      const lng = Number(el.dataset.lng);
      const lat = Number(el.dataset.lat);
      const p = map.project([lng, lat]);
      const visible = placeVisible && p.x > -60 && p.x < w + 60 && p.y > -40 && p.y < h + 40;
      el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
      el.style.opacity = visible ? '' : '0';
    }
    for (const el of this.aidEls.values()) {
      const lng = Number(el.dataset.lng);
      const lat = Number(el.dataset.lat);
      const p = map.project([lng, lat]);
      const visible = p.x > -40 && p.x < w + 40 && p.y > -40 && p.y < h + 40;
      el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
      if (!visible) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      }
    }
  }
}

function colorCss(color: string, dark: boolean): string {
  const table: Record<string, [string, string]> = {
    R: ['#ff5a4d', '#c22a20'],
    G: ['#6dff9e', '#0f7a3d'],
    Y: ['#ffcd78', '#a06a00'],
    Bu: ['#86bcff', '#1b5fa8'],
  };
  const entry = table[color] ?? table.W;
  return dark ? entry[0] : entry[1];
}
