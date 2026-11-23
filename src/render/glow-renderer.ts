/**
 * Canvas halo renderer.
 *
 * One full-screen 2D canvas sits above the MapLibre canvas. Each frame it:
 *   1. samples every light's characteristic for its on/off envelope,
 *   2. converts the light's ground-range footprint into screen pixels using the
 *      live map transform (or a fixed screen radius in screen mode),
 *   3. composes the draw order with overlap suppression (glow-compositor),
 *   4. paints pre-baked additive sprites, dim/far first, bright/near last.
 *
 * Sprite baking keeps per-frame work to a handful of drawImage calls. Halo
 * radii are derived from the map projection every frame, so the footprint is
 * tied to the chart's ground scale rather than to the canvas size.
 */
import type { Map as MlMap } from 'maplibre-gl';
import {
  atmosphereFor,
  glowGain,
  haloGroundRadiusM,
  type Atmosphere,
  type VisibilityGradeId,
} from '../core/atmosphere.ts';
import { clamp, haversineM, type LngLat } from '../core/geo.ts';
import {
  composeGlows,
  type GlowComposition,
  type GlowSource,
  type RGB,
} from '../core/glow-compositor.ts';
import {
  parseLightCharacter,
  sampleLightCharacter,
  type LightCharacter,
} from '../core/light-character.ts';
import { CHART } from '../model/chart-data.ts';
import type { Aid } from '../model/types.ts';
import { litRouteFrame, type LitRouteFrame, type RouteCoverage } from '../core/voyage.ts';

export type ScaleMode = 'ground' | 'screen';
export type Mode = 'night' | 'day';

export interface GlowSettings {
  mode: Mode;
  visibility: VisibilityGradeId;
  scaleMode: ScaleMode;
  eyeHeightM: number;
  showRoute: boolean;
  showSectors: boolean;
  motion: 'animated' | 'frozen';
  quality: 'auto' | 'high' | 'balanced';
}

export interface LightView {
  aid: Aid;
  character: LightCharacter;
  color: string;
  rgb: RGB;
  envelope: number;
  x: number;
  y: number;
  radiusPx: number;
  groundRadiusM: number;
  luminance: number;
  distanceM: number;
  onScreen: boolean;
  clamped: boolean;
  rank: number;
}

export interface GlowFrameStats {
  fps: number;
  frameMs: number;
  drawCount: number;
  overlapPairs: number;
  maxSuppression: number;
  quality: number;
  litLengthM: number;
  nearestId: string | null;
  litAidIds: string[];
}

export interface ShipState {
  position: LngLat;
  headingDeg: number;
  alongM: number;
}

export interface GlowRendererDeps {
  map: MlMap;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  onFrame?: (stats: GlowFrameStats) => void;
  onViews?: (views: LightView[]) => void;
}

export const LIGHT_COLOR_CSS: Record<string, string> = {
  W: '#fff4d6',
  R: '#ff5a4d',
  G: '#6dff9e',
  Y: '#ffcd78',
  Bu: '#86bcff',
};

const COLOR_RGB: Record<string, RGB> = {
  W: [255, 242, 216],
  R: [255, 96, 78],
  G: [124, 255, 158],
  Y: [255, 202, 104],
  Bu: [136, 186, 255],
};

const SPRITE_TEXELS = 384;
const CORE_TEXELS = 32;

/**
 * Halo alpha at normalised sprite radius.
 *
 * Two terms, both chosen so the painted halo *ends where it is drawn*:
 *   - a compact lamp core (the incandescent filament),
 *   - a glare shoulder that falls off roughly as r^-2.4 and reaches ~0.01 by
 *     the sprite edge.
 *
 * Earlier versions summed broad Gaussians, which left 0.15–0.3 alpha across
 * most of the disc. Additively stacked, that turns every overlap into flat grey
 * fog — the exact artefact the compositor is meant to prevent. A steep shoulder
 * keeps each lamp a discrete source of light.
 */
function haloAlpha(r: number): number {
  const x = Math.max(0, Math.min(1, r));
  // A lamp bloom has to satisfy two contradictory demands: be visible across
  // most of its stated radius, and not show a circular edge where it stops.
  //
  // The first is met by a broad exponential body; the second by multiplying
  // with `(1 - x²)^k`, which tapers continuously from the centre so there is no
  // step at any radius. An earlier version used a piecewise window that was
  // flat until 80% and then dropped, which drew exactly the disc edge it was
  // trying to hide.
  const core = 0.6 * Math.exp(-Math.pow(x / 0.035, 1.6));
  const body = 0.55 * Math.exp(-2.6 * x);
  const taper = Math.pow(Math.max(0, 1 - x * x), 1.15);
  return Math.min(1, (core + body) * taper);
}

/**
 * Deterministic hash-based dither in [-0.5, 0.5] LSB.
 *
 * A radial alpha ramp quantised to 8 bits draws visible contour rings wherever
 * a single alpha level spans more than a few pixels — which is most of a large
 * halo. Dithering the bake scatters those boundaries so the falloff reads as a
 * smooth gradient rather than a set of concentric steps.
 */
function ditherAt(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h & 0xffff) / 0xffff) - 0.5;
}

/**
 * Bake one additive halo sprite per lamp colour, pixel by pixel.
 *
 * Pixel-level baking (rather than a canvas radial gradient) is what lets the
 * dither follow the actual alpha value, which is the only way to keep a large,
 * low-alpha halo free of contour banding over a dark chart.
 */
function buildSprite(rgb: RGB): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_TEXELS;
  canvas.height = SPRITE_TEXELS;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  const img = ctx.createImageData(SPRITE_TEXELS, SPRITE_TEXELS);
  const data = img.data;
  const c = SPRITE_TEXELS / 2;
  const inv = 1 / c;
  for (let py = 0; py < SPRITE_TEXELS; py++) {
    const dy = (py + 0.5 - c) * inv;
    for (let px = 0; px < SPRITE_TEXELS; px++) {
      const dx = (px + 0.5 - c) * inv;
      const r = Math.min(1, Math.hypot(dx, dy));
      let a = haloAlpha(r) * 255;
      if (a > 0) a = Math.max(0, Math.min(255, a + ditherAt(px, py)));
      const i = (py * SPRITE_TEXELS + px) * 4;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      data[i + 3] = Math.round(a);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function buildCoreSprite(rgb: RGB): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CORE_TEXELS;
  canvas.height = CORE_TEXELS;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  const c = CORE_TEXELS / 2;
  const [r, g, b] = rgb;
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.16, `rgba(${r}, ${g}, ${b}, 0.96)`);
  grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.44)`);
  grad.addColorStop(0.72, `rgba(${r}, ${g}, ${b}, 0.1)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CORE_TEXELS, CORE_TEXELS);
  return canvas;
}

/** Fixed screen radius per light in screen-scale mode: bigger lights read bigger. */
function screenRadiusFor(aid: Aid): number {
  const rankBoost = aid.rank === 3 ? 1 : aid.rank === 2 ? 0.74 : 0.54;
  const intensity = clamp(Math.log10(Math.max(1, aid.intensityCd)) - 2.6, 0.2, 3.4);
  return (58 + 42 * intensity) * rankBoost;
}

function chooseQuality(setting: GlowSettings['quality'], frameMs: number): number {
  if (setting === 'high') return 1;
  if (setting === 'balanced') return 0.72;
  if (frameMs > 27) return 0.6;
  if (frameMs > 19) return 0.8;
  return 1;
}

export class GlowRenderer {
  private readonly deps: GlowRendererDeps;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly sprites = new Map<string, HTMLCanvasElement>();
  private readonly cores = new Map<string, HTMLCanvasElement>();
  private readonly characters: LightCharacter[] = [];
  private readonly aids: readonly Aid[];
  private settings: GlowSettings;
  private coverage: RouteCoverage | null = null;
  private epoch = performance.now();
  private raf = 0;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private lastFrameAt = 0;
  private frameMsAvg = 16;
  private qualityScale = 1;
  private fpsCounter = 0;
  private fpsWindowStart = 0;
  private fps = 0;
  private paused = false;
  private frozenAt = 3.2;
  private views: LightView[] = [];
  private composition: GlowComposition | null = null;
  private litFrame: LitRouteFrame | null = null;
  private routeScreen: Array<{ x: number; y: number }> = [];
  private routeCacheKey = '';
  private statsAt = 0;
  private stats: GlowFrameStats | null = null;
  private selectedId: string | null = null;
  private hoverId: string | null = null;
  private ship: ShipState;
  private shipScreen = { x: 0, y: 0, visible: false };

  constructor(deps: GlowRendererDeps, settings: GlowSettings, ship: ShipState) {
    this.deps = deps;
    const ctx = deps.canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.settings = settings;
    this.ship = ship;
    this.aids = CHART.aids;
    for (const aid of this.aids) {
      const character = parseLightCharacter(aid.characteristic);
      this.characters.push(character);
      for (const color of new Set<string>([aid.color, ...character.colors])) {
        if (!this.sprites.has(color)) {
          const rgb = COLOR_RGB[color] ?? COLOR_RGB.W;
          this.sprites.set(color, buildSprite(rgb));
          this.cores.set(color, buildCoreSprite(rgb));
        }
      }
    }
    this.resize();
    this.loop = this.loop.bind(this);
  }

  get atmosphere(): Atmosphere {
    return atmosphereFor(this.settings.mode, this.settings.visibility, this.settings.eyeHeightM);
  }

  get lightViews(): readonly LightView[] {
    return this.views;
  }

  get shipState(): ShipState {
    return this.ship;
  }

  get lastStats(): GlowFrameStats | null {
    return this.stats;
  }

  get lastComposition(): GlowComposition | null {
    return this.composition;
  }

  get lastLitFrame(): LitRouteFrame | null {
    return this.litFrame;
  }

  setSettings(next: GlowSettings): void {
    this.settings = next;
  }

  setShip(ship: ShipState): void {
    this.ship = ship;
  }

  setSelection(id: string | null): void {
    this.selectedId = id;
  }

  setHover(id: string | null): void {
    this.hoverId = id;
  }

  setCoverage(coverage: RouteCoverage): void {
    this.coverage = coverage;
    this.routeCacheKey = '';
  }

  /** The clock all light phases are evaluated against. */
  private clock(): number {
    return this.settings.motion === 'frozen' ? this.frozenAt : this.now();
  }

  /**
   * Phase time for one light.
   *
   * Each light is offset within its own period so the chart does not pulse in
   * unison. This offset is part of the model: the halo, the lit route and the
   * inspector's timing strip must all read through this method, or they
   * disagree about whether a given lamp is currently lit.
   */
  phaseTimeFor(id: string): number {
    const index = this.aids.findIndex((a) => a.id === id);
    return this.clock() + Math.max(0, index) * 0.37;
  }

  /** Current on/off envelope for every light, keyed by aid id. */
  envelopes(): Map<string, number> {
    const map = new Map<string, number>();
    for (let i = 0; i < this.aids.length; i++) {
      const aid = this.aids[i];
      map.set(aid.id, sampleLightCharacter(this.characters[i], this.phaseTimeFor(aid.id)).intensity);
    }
    return map;
  }

  start(): void {
    if (this.raf) return;
    this.epoch = performance.now();
    this.fpsWindowStart = this.epoch;
    this.lastFrameAt = 0;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  resize(): void {
    const rect = this.deps.container.getBoundingClientRect();
    // Soft additive light needs nowhere near native pixel density; capping the
    // ratio here is the single largest frame-time saving at 2x displays.
    this.dpr = Math.min(1.25, window.devicePixelRatio || 1);
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.deps.canvas.width = Math.round(this.width * this.dpr);
    this.deps.canvas.height = Math.round(this.height * this.dpr);
    this.deps.canvas.style.width = `${this.width}px`;
    this.deps.canvas.style.height = `${this.height}px`;
  }

  private now(): number {
    return (performance.now() - this.epoch) / 1000;
  }

  /** Ground metres per CSS pixel at the map's centre latitude. */
  private metersPerPixel(): number {
    const map = this.deps.map;
    const center = map.getCenter();
    const a = map.project([center.lng, center.lat]);
    const b = map.project([center.lng, center.lat + 0.01]);
    const dy = Math.abs(b.y - a.y);
    if (!Number.isFinite(dy) || dy < 1e-6) return 1;
    const metres = 0.01 * 110540;
    return metres / dy;
  }

  private loop(ts: number): void {
    this.raf = requestAnimationFrame(this.loop);
    if (this.paused) {
      this.lastFrameAt = ts;
      return;
    }
    if (this.lastFrameAt === 0) this.lastFrameAt = ts;
    const dt = Math.min(140, ts - this.lastFrameAt);
    this.lastFrameAt = ts;
    this.frameMsAvg = this.frameMsAvg * 0.9 + dt * 0.1;
    this.fpsCounter++;
    if (ts - this.fpsWindowStart >= 500) {
      this.fps = (this.fpsCounter * 1000) / (ts - this.fpsWindowStart);
      this.fpsCounter = 0;
      this.fpsWindowStart = ts;
    }
    this.qualityScale = chooseQuality(this.settings.quality, this.frameMsAvg);
    this.render(ts);
  }

  private buildViews(): LightView[] {
    const map = this.deps.map;
    const mpp = this.metersPerPixel();
    const atm = this.atmosphere;
    const gain = glowGain(atm);
    const views: LightView[] = [];
    const pad = 460;

    for (let i = 0; i < this.aids.length; i++) {
      const aid = this.aids[i];
      const sample = sampleLightCharacter(this.characters[i], this.phaseTimeFor(aid.id));
      const point = map.project([aid.position.lng, aid.position.lat]);
      const onScreen =
        point.x > -pad &&
        point.x < this.width + pad &&
        point.y > -pad &&
        point.y < this.height + pad;
      if (!onScreen) continue;

      const ground = haloGroundRadiusM(aid.intensityCd, aid.focalHeightM, atm);
      // The footprint is viewport-bounded: a halo much wider than a third of
      // the window stops reading as a light source and turns into a wash. The
      // bound sits above the largest working-zoom footprint, so in normal use
      // the radius is strictly ground-locked and only deep zooms clamp.
      const viewportCap = Math.min(this.width, this.height) * 0.46;
      const rawRadius = this.settings.scaleMode === 'screen' ? screenRadiusFor(aid) : ground / mpp;
      const radiusPx = clamp(rawRadius, 30, viewportCap);
      const color = sample.color;
      const luminance =
        clamp(
          (0.34 + 0.3 * (Math.log10(Math.max(1, aid.intensityCd)) - 3)) *
            (0.55 + 0.45 * clamp(atm.visNm / 12, 0.1, 1)),
          0.22,
          1.45,
        ) * gain;

      views.push({
        aid,
        character: this.characters[i],
        color,
        rgb: COLOR_RGB[color] ?? COLOR_RGB.W,
        envelope: sample.intensity,
        x: point.x,
        y: point.y,
        radiusPx,
        groundRadiusM: ground,
        luminance,
        distanceM: haversineM(this.ship.position, aid.position),
        onScreen,
        clamped: rawRadius < 30 || rawRadius > viewportCap,
        rank: aid.rank,
      });
    }
    return views;
  }

  private routeCache(): Array<{ x: number; y: number }> {
    if (!this.coverage) return [];
    const map = this.deps.map;
    const c = map.getCenter();
    const key = `${map.getZoom().toFixed(4)}|${c.lng.toFixed(5)}|${c.lat.toFixed(5)}|${this.width}x${this.height}`;
    if (key === this.routeCacheKey) return this.routeScreen;
    const points = this.coverage.route.points;
    const out: Array<{ x: number; y: number }> = new Array(points.length);
    for (let i = 0; i < points.length; i++) {
      const p = map.project([points[i].position.lng, points[i].position.lat]);
      out[i] = { x: p.x, y: p.y };
    }
    this.routeScreen = out;
    this.routeCacheKey = key;
    return out;
  }

  private render(ts: number): void {
    const ctx = this.ctx;
    if (ctx.canvas.width !== Math.round(this.width * this.dpr)) this.resize();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const atm = this.atmosphere;
    const views = this.buildViews();
    this.views = views;
    const viewById = new Map<string, LightView>();
    for (const v of views) viewById.set(v.aid.id, v);

    const shipPoint = this.deps.map.project([this.ship.position.lng, this.ship.position.lat]);
    this.shipScreen = {
      x: shipPoint.x,
      y: shipPoint.y,
      visible:
        shipPoint.x > -80 &&
        shipPoint.x < this.width + 80 &&
        shipPoint.y > -80 &&
        shipPoint.y < this.height + 80,
    };

    // --- illuminated route stretches, painted beneath the halos -------------
    let litFrame: LitRouteFrame | null = null;
    if (this.coverage) {
      // Every light's envelope, not just the on-screen ones: `views` is culled
      // to the viewport, and a lighthouse panned out of view still lights the
      // water it can reach. Building this map from `views` made the route go
      // dark whenever the illuminating lamp left the screen.
      const envMap = new Map<string, number>();
      const colorMap = new Map<string, string>();
      for (const aid of this.aids) {
        const sample = sampleLightCharacter(
          this.characters[this.aids.indexOf(aid)],
          this.phaseTimeFor(aid.id),
        );
        envMap.set(aid.id, sample.intensity);
        colorMap.set(aid.id, sample.color);
      }
      litFrame = litRouteFrame(this.coverage, envMap, colorMap);
      this.litFrame = litFrame;
      if (this.settings.showRoute) {
        const screen = this.routeCache();
        const beams = atm.mode === 'night' ? 0.85 : 0.3;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // One path per contiguous stretch of a single lamp. Butt caps on the
        // wide passes stop adjacent pieces from beading together.
        for (const run of litFrame.runs) {
          if (run.to <= run.from) continue;
          const rgb = COLOR_RGB[run.color] ?? COLOR_RGB.W;
          const alpha = clamp(run.lit, 0, 1) * beams;
          if (alpha < 0.02) continue;
          const stride = Math.max(1, Math.ceil((run.to - run.from) / 140));
          ctx.beginPath();
          let first = true;
          for (let i = run.from; i <= run.to; i += stride) {
            const p = screen[i];
            if (!p) continue;
            if (first) {
              ctx.moveTo(p.x, p.y);
              first = false;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }
          const tail = screen[run.to];
          if (tail && !first) ctx.lineTo(tail.x, tail.y);
          if (first) continue;
          ctx.lineCap = 'butt';
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(alpha * 0.055).toFixed(3)})`;
          ctx.lineWidth = 44;
          ctx.stroke();
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(alpha * 0.085).toFixed(3)})`;
          ctx.lineWidth = 19;
          ctx.stroke();
          ctx.lineCap = 'round';
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(alpha * 0.22).toFixed(3)})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // --- compose and paint halos ------------------------------------------
    const sources: GlowSource[] = views.map((v) => ({
      id: v.aid.id,
      x: v.x,
      y: v.y,
      radiusPx: v.radiusPx,
      intensityCd: v.aid.intensityCd,
      luminance: v.luminance,
      distanceM: v.distanceM,
      envelope: v.envelope,
      color: v.rgb,
      focalHeightM: v.aid.focalHeightM,
      visible: v.onScreen,
    }));
    const comp = composeGlows(sources, {
      suppressionStrength: this.settings.mode === 'night' ? 1.1 : 0.6,
      minGain: 0.14,
    });
    this.composition = comp;

    const scale = this.qualityScale;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const item of comp.items) {
      const v = viewById.get(item.source.id);
      if (!v) continue;
      const sprite = this.sprites.get(v.color) ?? this.sprites.get('W');
      if (!sprite) continue;
      const r = v.radiusPx;
      // Same candle power spread over a larger footprint is dimmer per pixel.
      // Without this, one wide-beam tower at high zoom paints a flat grey veil
      // across the whole chart.
      const spread = Math.pow(clamp(260 / Math.max(260, r), 0.35, 1), 0.75);
      const alpha = clamp(item.peakAlpha * (0.5 + 0.42 * v.luminance), 0, 1) * scale * spread;
      if (alpha < 0.006) continue;
      const size = r * 2;
      // Clip to the sprite's inscribed circle. The baked gradient already ends
      // at zero, but gradient interpolation can leave a few LSBs at the square
      // corners, which a very large halo renders as a visible rectangular seam.
      ctx.save();
      ctx.beginPath();
      ctx.arc(v.x, v.y, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, v.x - size / 2, v.y - size / 2, size, size);
      ctx.restore();
    }
    ctx.restore();

    // --- lamp cores: fixed screen size, always last ------------------------
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const item of comp.items) {
      const v = viewById.get(item.source.id);
      if (!v) continue;
      const core = this.cores.get(v.color) ?? this.cores.get('W');
      if (!core) continue;
      const size = (15 + v.luminance * 15) * (v.envelope > 0.01 ? 1 : 0.62);
      const alpha = clamp(item.peakAlpha * 1.2, 0, 1);
      if (alpha < 0.02) continue;
      ctx.globalAlpha = alpha;
      ctx.drawImage(core, v.x - size / 2, v.y - size / 2, size, size);
    }
    ctx.restore();

    // --- selection / hover ring and bearing line ---------------------------
    const focusId = this.hoverId ?? this.selectedId;
    if (focusId) {
      const v = viewById.get(focusId);
      if (v) {
        ctx.save();
        if (this.shipScreen.visible) {
          ctx.strokeStyle = `rgba(${v.rgb.join(',')}, 0.34)`;
          ctx.lineWidth = 0.9;
          ctx.setLineDash([2, 6]);
          ctx.beginPath();
          ctx.moveTo(this.shipScreen.x, this.shipScreen.y);
          ctx.lineTo(v.x, v.y);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(236, 252, 252, 0.42)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 7]);
        ctx.beginPath();
        ctx.arc(v.x, v.y, Math.max(17, v.radiusPx * 0.3), 0, Math.PI * 2);
        ctx.stroke();
        if (this.settings.showSectors && v.aid.sector) {
          const from = (v.aid.sector.fromDeg - 90) * (Math.PI / 180);
          const to = (v.aid.sector.toDeg - 90) * (Math.PI / 180);
          ctx.strokeStyle = `rgba(${v.rgb.join(',')}, 0.34)`;
          ctx.lineWidth = 1.1;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(v.x, v.y, Math.max(24, v.radiusPx * 0.34), from, to);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // --- ship position ring ------------------------------------------------
    if (this.shipScreen.visible) {
      const { x, y } = this.shipScreen;
      ctx.save();
      ctx.strokeStyle = 'rgba(240, 252, 250, 0.42)';
      ctx.lineWidth = 0.9;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(x, y, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Rolling stats at ~8 Hz so the panels do not re-render every frame.
    if (ts - this.statsAt > 125) {
      this.statsAt = ts;
      const litAidIds = litFrame
        ? Array.from(
            new Set(
              litFrame.segments
                .map((s) => s.aidId)
                .filter((id): id is string => Boolean(id)),
            ),
          )
        : [];
      this.stats = {
        fps: this.fps,
        frameMs: this.frameMsAvg,
        drawCount: comp.items.length,
        overlapPairs: comp.overlapPairs,
        maxSuppression: comp.maxSuppression,
        quality: this.qualityScale,
        litLengthM: this.settings.showRoute ? litFrame?.litLengthM ?? 0 : 0,
        nearestId: this.nearestLitId(views),
        litAidIds,
      };
      this.deps.onFrame?.(this.stats);
      this.deps.onViews?.(views);
    }
  }

  private nearestLitId(views: LightView[]): string | null {
    let best: { id: string; score: number } | null = null;
    for (const v of views) {
      if (v.envelope < 0.04) continue;
      const score = v.luminance * v.envelope * (1 + 1 / (1 + v.distanceM / 6000));
      if (!best || score > best.score) best = { id: v.aid.id, score };
    }
    return best?.id ?? null;
  }

  /** Hit-test lights at a screen position; returns the nearest within 24 px. */
  hitTest(x: number, y: number): LightView | null {
    let best: LightView | null = null;
    let bestD = 24;
    for (const v of this.views) {
      const d = Math.hypot(v.x - x, v.y - y);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best;
  }
}
