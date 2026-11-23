/**
 * Chart-ink canvas: soundings, route waypoint pips, ship heading ray.
 *
 * Drawn on its own canvas between the MapLibre canvas and the halo canvas.
 * Text is real canvas text rather than a MapLibre symbol layer, so no glyph
 * endpoint is needed and the numerals stay crisp at chart scale. Redraws only
 * on map move or ship change, never per animation frame.
 */
import type { Map as MlMap } from 'maplibre-gl';
import { formatSounding } from './chart-raster.ts';
import { SOUNDING_POINTS } from '../model/chart-data.ts';
import type { ChartData } from '../model/types.ts';
import type { ShipState } from './glow-renderer.ts';
import { bearingToCompass } from '../core/geo.ts';
import type { DepthModel } from '../model/depth-field.ts';

export interface ChartInkDeps {
  map: MlMap;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  chart: ChartData;
  depth: DepthModel;
}

interface SoundingPoint {
  lng: number;
  lat: number;
  depth: number;
}

export class ChartInk {
  private readonly deps: ChartInkDeps;
  private readonly ctx: CanvasRenderingContext2D;
  private soundings: SoundingPoint[] = [];
  private width = 1;
  private height = 1;
  private dpr = 1;
  private raf = 0;
  private ship: ShipState | null = null;
  private theme: 'night' | 'day' = 'night';
  private showSoundings = true;
  private shipScreen = { x: 0, y: 0, visible: false };
  private darkness = 0;

  constructor(deps: ChartInkDeps) {
    this.deps = deps;
    const ctx = deps.canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.computeSoundingCache();
    this.resize();
    this.tick = this.tick.bind(this);
    const map = deps.map;
    map.on('move', () => this.schedule());
    map.on('resize', () => {
      this.resize();
      this.schedule();
    });
  }

  setTheme(theme: 'night' | 'day'): void {
    this.theme = theme;
    this.schedule();
  }

  /**
   * Night wash: multiply-darken the chart toward a cool deep blue and add a
   * soft vignette so the halos above it gain contrast. Uses two gradients and
   * one fill, so it costs one composite over the chart area.
   */
  private paintNightWash(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const d = this.darkness;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const linear = ctx.createLinearGradient(0, 0, 0, h);
    linear.addColorStop(0, `rgba(38, 66, 88, ${(0.55 * d).toFixed(3)})`);
    linear.addColorStop(0.45, `rgba(20, 44, 62, ${(0.42 * d).toFixed(3)})`);
    linear.addColorStop(1, `rgba(14, 32, 48, ${(0.6 * d).toFixed(3)})`);
    ctx.fillStyle = linear;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    const cx = w * 0.46;
    const cy = h * 0.44;
    const r = Math.hypot(w, h) * 0.62;
    const radial = ctx.createRadialGradient(cx, cy, r * 0.28, cx, cy, r);
    radial.addColorStop(0, 'rgba(2, 8, 12, 0)');
    radial.addColorStop(0.72, `rgba(2, 8, 12, ${(0.3 * d).toFixed(3)})`);
    radial.addColorStop(1, `rgba(1, 5, 8, ${(0.72 * d).toFixed(3)})`);
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /**
   * 0..1 night dimming. Drawn inside this canvas rather than as a DOM overlay
   * so the chart keeps one fewer full-screen compositing layer.
   */
  setDarkness(value: number): void {
    this.darkness = Math.max(0, Math.min(1, value));
    this.schedule();
  }

  setShowSoundings(show: boolean): void {
    this.showSoundings = show;
    this.schedule();
  }

  setShip(ship: ShipState): void {
    this.ship = ship;
    this.schedule();
  }

  get shipScreenPosition(): { x: number; y: number; visible: boolean } {
    return this.shipScreen;
  }

  resize(): void {
    const rect = this.deps.container.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.deps.canvas.width = Math.round(this.width * this.dpr);
    this.deps.canvas.height = Math.round(this.height * this.dpr);
    this.deps.canvas.style.width = `${this.width}px`;
    this.deps.canvas.style.height = `${this.height}px`;
  }

  private computeSoundingCache(): void {
    const out: SoundingPoint[] = [];
    for (const p of SOUNDING_POINTS) {
      const depth = this.deps.depth.sample(p);
      if (depth < 0) continue;
      out.push({ lng: p.lng, lat: p.lat, depth });
    }
    this.soundings = out;
  }

  private schedule(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick(): void {
    this.raf = 0;
    this.render();
  }

  private render(): void {
    const ctx = this.ctx;
    const map = this.deps.map;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const zoom = map.getZoom();
    const night = this.theme === 'night';

    if (this.darkness > 0.01) this.paintNightWash();

    // --- soundings ---------------------------------------------------------
    if (this.showSoundings) {
      const faint = night ? 'rgba(146, 194, 200, 0.46)' : 'rgba(66, 96, 100, 0.62)';
      const strong = night ? 'rgba(186, 228, 232, 0.68)' : 'rgba(38, 66, 70, 0.82)';
      const shallow = night ? 'rgba(255, 206, 138, 0.8)' : 'rgba(150, 92, 12, 0.92)';
      const every = zoom > 14 ? 1 : zoom > 12.6 ? 2 : zoom > 11.6 ? 3 : 4;
      ctx.font = `${zoom > 13.4 ? 9.5 : 8.5}px 'IBM Plex Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const s of this.soundings) {
        const key = Math.abs(
          Math.round(s.lng * 7333) * 31 + Math.round(s.lat * 7333),
        ) % every;
        if (key !== 0) continue;
        const p = map.project([s.lng, s.lat]);
        if (p.x < -18 || p.x > this.width + 18 || p.y < -18 || p.y > this.height + 18) continue;
        ctx.fillStyle = s.depth < 2 ? shallow : s.depth < 5 ? strong : faint;
        ctx.fillText(formatSounding(s.depth), p.x, p.y);
      }
    }

    // --- route waypoint pips ----------------------------------------------
    const wps = this.deps.chart.route.waypoints;
    ctx.font = "8px 'IBM Plex Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < wps.length; i++) {
      const p = map.project([wps[i].position.lng, wps[i].position.lat]);
      if (p.x < -30 || p.x > this.width + 30 || p.y < -30 || p.y > this.height + 30) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = night ? 'rgba(196, 230, 232, 0.5)' : 'rgba(48, 84, 88, 0.6)';
      ctx.fill();
      ctx.fillStyle = night ? 'rgba(170, 208, 212, 0.5)' : 'rgba(60, 92, 96, 0.6)';
      ctx.fillText(`WP${i}`, p.x, p.y - 6);
    }

    // --- ship heading ray --------------------------------------------------
    if (this.ship) {
      const p = map.project([this.ship.position.lng, this.ship.position.lat]);
      this.shipScreen = {
        x: p.x,
        y: p.y,
        visible: p.x > -40 && p.x < this.width + 40 && p.y > -40 && p.y < this.height + 40,
      };
      if (this.shipScreen.visible) {
        const rad = ((this.ship.headingDeg - 90) * Math.PI) / 180;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(rad);
        const grad = ctx.createLinearGradient(16, 0, 140, 0);
        grad.addColorStop(0, night ? 'rgba(200, 244, 246, 0.42)' : 'rgba(30, 96, 104, 0.46)');
        grad.addColorStop(1, night ? 'rgba(200, 244, 246, 0)' : 'rgba(30, 96, 104, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.1;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(140, 0);
        ctx.stroke();
        ctx.restore();

        ctx.font = "9px 'IBM Plex Mono', monospace";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = night ? 'rgba(196, 238, 240, 0.72)' : 'rgba(22, 78, 86, 0.85)';
        const text = `${String(Math.round(this.ship.headingDeg) % 360).padStart(3, '0')}° ${bearingToCompass(this.ship.headingDeg)}`;
        ctx.fillText(text, p.x + 20, p.y + 17);
      }
    }
  }
}
