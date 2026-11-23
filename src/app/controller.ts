/**
 * Application controller: owns the map, the halo renderer and the state store,
 * and exposes the narrow API the Web Components bind to.
 */
import { Store } from '../ui/store.ts';
import { registerApi, API_READY_EVENT, type AppApi, type Toast } from '../ui/components/base.ts';
import { initialState, glowSettingsFrom, type AppState } from './state.ts';
import { CHART, SHIP_START } from '../model/chart-data.ts';
import { buildDepthModel, type DepthModel } from '../model/depth-field.ts';
import { createChartMap, type ChartMapHandle } from '../render/chart-map.ts';
import { ChartLabels } from '../render/chart-labels.ts';
import { ChartInk } from '../render/chart-ink.ts';
import { GlowRenderer, type LightView, type ShipState } from '../render/glow-renderer.ts';
import { atmosphereFor, type VisibilityGradeId } from '../core/atmosphere.ts';
import {
  formatBearing,
  haversineM,
  initialBearingDeg,
  normalizeBearing,
  type LngLat,
} from '../core/geo.ts';
import {
  buildRouteGeometry,
  computeRouteCoverage,
  headingAlongRoute,
  nearestLitAid,
  routePointAt,
  snapShipToRoute,
  type RouteGeometry,
  type RouteCoverage,
} from '../core/voyage.ts';
import { parseLightCharacter, sampleLightCharacter } from '../core/light-character.ts';
import { buildExport, serializeExport, type ExportFormat } from '../core/voyage-export.ts';
import { computeReach } from '../core/atmosphere.ts';

const APP_VERSION = '1.0.0';

export class App implements AppApi {
  private readonly store: Store<AppState>;
  private readonly depth: DepthModel;
  private mapHandle: ChartMapHandle | null = null;
  private readonly mapEl: HTMLElement;
  private labels: ChartLabels | null = null;
  private ink: ChartInk | null = null;
  /** Exposed for the diagnostics harness and console inspection. */
  renderer: GlowRenderer | null = null;
  private readonly route: RouteGeometry;
  private coverage: RouteCoverage | null = null;
  private toastItems: Toast[] = [];
  private toastSeq = 0;
  private readonly toastListeners = new Set<(toasts: readonly Toast[]) => void>();
  private ship: ShipState;
  private resizeTimer = 0;
  private puckEl: HTMLButtonElement | null = null;
  private cleanup: Array<() => void> = [];
  private readonly characters = new Map(
    CHART.aids.map((a) => [a.id, parseLightCharacter(a.characteristic)]),
  );
  private lastViews: readonly LightView[] = [];

  constructor() {
    this.depth = buildDepthModel();
    this.route = buildRouteGeometry(CHART.route, 45);
    const start = snapShipToRoute(this.route, SHIP_START);
    this.ship = {
      position: start.point.position,
      headingDeg: headingAlongRoute(this.route, start.point.alongM),
      alongM: start.point.alongM,
    };
    this.store = new Store<AppState>({
      ...initialState,
      ship: { ...this.ship, position: { ...this.ship.position } },
    });
    this.mapEl = document.getElementById('map') as HTMLElement;
    this.rebuildCoverage();
  }

  async boot(): Promise<void> {
    const glowCanvas = document.getElementById('glow') as HTMLCanvasElement;
    const inkCanvas = document.getElementById('ink') as HTMLCanvasElement;
    const container = document.getElementById('chart-shell') as HTMLElement;
    const labelLayer = document.getElementById('labels') as HTMLElement;

    this.mapHandle = await createChartMap({
      container: this.mapEl,
      chart: CHART,
      depth: this.depth,
      theme: this.store.get().mode,
    });

    this.labels = new ChartLabels({ map: this.mapHandle.map, container: labelLayer }, CHART);
    this.bindLabelEvents(labelLayer);

    this.ink = new ChartInk({
      map: this.mapHandle.map,
      canvas: inkCanvas,
      container,
      chart: CHART,
      depth: this.depth,
    });
    this.ink.setShip(this.ship);
    this.ink.setDarkness(this.darknessFor());
    this.ink.setShowSoundings(this.store.get().showSoundings);

    this.renderer = new GlowRenderer(
      {
        map: this.mapHandle.map,
        canvas: glowCanvas,
        container,
        onFrame: (stats) => this.onFrame(stats),
        onViews: (views) => this.onViews(views),
      },
      glowSettingsFrom(this.store.get()),
      this.ship,
    );
    if (this.coverage) this.renderer.setCoverage(this.coverage);
    this.renderer.setShip(this.ship);
    this.renderer.start();

    this.bindPuck(container);
    this.bindShipDrag(container);

    const map = this.mapHandle.map;
    const syncView = (): void => {
      this.store.set({ zoom: map.getZoom(), center: { lng: map.getCenter().lng, lat: map.getCenter().lat } });
      this.positionPuck();
    };
    map.on('move', syncView);
    map.on('zoom', syncView);
    map.on('moveend', syncView);
    syncView();

    const ro = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        this.renderer?.resize();
        this.ink?.resize();
        this.positionPuck();
      }, 60);
    });
    ro.observe(container);
    this.cleanup.push(() => ro.disconnect());

    const onResize = (): void => {
      this.renderer?.resize();
      this.ink?.resize();
      this.positionPuck();
    };
    window.addEventListener('resize', onResize);
    this.cleanup.push(() => window.removeEventListener('resize', onResize));

    registerApi(document.body, this);
    this.store.set({ mapReady: true, hydrated: true });
    document.dispatchEvent(new CustomEvent(API_READY_EVENT));
    this.positionPuck();
  }

  /* ---------------------------- AppApi surface ---------------------------- */

  getState(): AppState {
    return this.store.get();
  }

  subscribe(fn: (state: AppState) => void): () => void {
    return this.store.subscribe(fn);
  }

  setMode(mode: 'night' | 'day'): void {
    if (this.store.get().mode === mode) return;
    this.store.set({ mode });
    document.body.classList.toggle('theme-night', mode === 'night');
    document.body.classList.toggle('theme-day', mode === 'day');
    this.renderer?.setSettings(glowSettingsFrom(this.store.get()));
    this.ink?.setTheme(mode);
    this.ink?.setDarkness(this.darknessFor());
    void this.mapHandle?.setTheme(mode);
    this.rebuildCoverage();
    this.toast(mode === 'night' ? '夜间模式 · 光源对比已提升' : '昼间模式 · 海图提亮');
  }

  setVisibility(id: VisibilityGradeId): void {
    this.store.set({ visibility: id });
    this.renderer?.setSettings(glowSettingsFrom(this.store.get()));
    this.ink?.setDarkness(this.darknessFor());
    this.rebuildCoverage();
  }

  setScaleMode(mode: 'ground' | 'screen'): void {
    this.store.set({ scaleMode: mode });
    this.renderer?.setSettings(glowSettingsFrom(this.store.get()));
    this.toast(mode === 'ground' ? '光晕按地面尺度锁定 · 缩放时随海图收缩' : '光晕按屏幕尺度锁定 · 缩放时保持像素大小');
  }

  setEyeHeight(m: number): void {
    this.store.set({ eyeHeightM: m });
    this.renderer?.setSettings(glowSettingsFrom(this.store.get()));
    this.rebuildCoverage();
  }

  setQuality(q: 'auto' | 'high' | 'balanced'): void {
    this.store.set({ quality: q });
    this.renderer?.setSettings(glowSettingsFrom(this.store.get()));
  }

  setMotion(m: 'animated' | 'frozen'): void {
    this.store.set({ motion: m });
    this.renderer?.setSettings(glowSettingsFrom(this.store.get()));
  }

  toggleFlag(flag: 'showRoute' | 'showSectors' | 'showSoundings' | 'showGraticule'): void {
    const next = !this.store.get()[flag];
    this.store.set({ [flag]: next } as Partial<AppState>);
    this.renderer?.setSettings(glowSettingsFrom(this.store.get()));
    if (flag === 'showGraticule') {
      const map = this.mapHandle?.map;
      if (map) {
        for (const layer of ['graticule-minor', 'graticule-major']) {
          if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', next ? 'visible' : 'none');
        }
      }
    }
    if (flag === 'showSoundings') this.ink?.setShowSoundings(next);
  }

  selectAid(id: string | null): void {
    this.store.set({ selectedAidId: id });
    this.renderer?.setSelection(id);
    this.labels?.setSelected(id);
  }

  hoverAid(id: string | null): void {
    if (this.store.get().hoverAidId === id) return;
    this.store.set({ hoverAidId: id });
    this.renderer?.setHover(id);
    this.labels?.setHover(id);
  }

  focusAid(id: string): void {
    const aid = CHART.aids.find((a) => a.id === id);
    if (!aid || !this.mapHandle) return;
    this.mapHandle.map.easeTo({
      center: [aid.position.lng, aid.position.lat],
      zoom: Math.max(13.2, this.mapHandle.map.getZoom()),
      duration: 800,
    });
    this.selectAid(id);
  }

  focusRoute(): void {
    this.mapHandle?.focus(this.route.points.map((p) => p.position), 90);
  }

  nudgeShip(deltaM: number): void {
    this.moveShipTo(this.ship.alongM + deltaM);
  }

  setShipFromRoute(ratio: number): void {
    this.moveShipTo(this.route.totalM * Math.max(0, Math.min(1, ratio)));
  }

  openExport(): void {
    this.store.set({ exportOpen: true });
  }

  closeExport(): void {
    this.store.set({ exportOpen: false });
  }

  doExport(format: ExportFormat): ReturnType<typeof buildExport> {
    const state = this.store.get();
    const file = buildExport({
      chart: CHART,
      atmosphere: atmosphereFor(state.mode, state.visibility, state.eyeHeightM),
      route: CHART.route,
      ship: {
        position: this.ship.position,
        headingDeg: this.ship.headingDeg,
        alongM: this.ship.alongM,
      },
      visibilityGrade: state.visibility,
      mode: state.mode,
      generatedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
    });
    void serializeExport(file, format);
    return file;
  }

  toast(text: string): void {
    const toastEl = document.querySelector('np-toast') as (HTMLElement & { show?: (t: string) => void }) | null;
    if (toastEl && typeof toastEl.show === 'function') {
      toastEl.show(text);
      return;
    }
    const item: Toast = { id: ++this.toastSeq, text };
    this.toastItems = [...this.toastItems.slice(-2), item];
    for (const l of this.toastListeners) l(this.toastItems);
    window.setTimeout(() => {
      this.toastItems = this.toastItems.filter((i) => i.id !== item.id);
      for (const l of this.toastListeners) l(this.toastItems);
    }, 2400);
  }

  toasts(): readonly Toast[] {
    return this.toastItems;
  }

  subscribeToasts(fn: (toasts: readonly Toast[]) => void): () => void {
    this.toastListeners.add(fn);
    fn(this.toastItems);
    return () => {
      this.toastListeners.delete(fn);
    };
  }

  lightViews(): readonly LightView[] {
    return this.lastViews;
  }

  envelopes(): Map<string, number> {
    return this.renderer?.envelopes() ?? new Map();
  }

  shipInfo(): ReturnType<AppApi['shipInfo']> {
    const state = this.store.get();
    const atm = atmosphereFor(state.mode, state.visibility, state.eyeHeightM);
    const litId = this.renderer?.lastStats?.nearestId ?? null;
    const lit = litId ? CHART.aids.find((a) => a.id === litId) : undefined;
    const target =
      lit ?? nearestLitAid(this.ship.position, CHART.aids, atm, this.envelopes()) ?? CHART.aids[0];
    const distanceM = haversineM(this.ship.position, target.position);
    const bearing = initialBearingDeg(this.ship.position, target.position);
    return {
      position: this.ship.position,
      headingDeg: this.ship.headingDeg,
      alongM: this.ship.alongM,
      distanceToNearestM: distanceM,
      nearestId: target.id,
      nearestBearing: formatBearing(bearing),
      nearestName: target.name,
    };
  }

  aidById(id: string) {
    return CHART.aids.find((a) => a.id === id);
  }

  litLengthM(): number {
    return this.renderer?.lastStats?.litLengthM ?? 0;
  }

  envelopeOf(id: string): number {
    const ch = this.characters.get(id);
    if (!ch || !this.renderer) return 0;
    return sampleLightCharacter(ch, this.renderer.phaseTimeFor(id)).intensity;
  }

  /**
   * Phase state for the inspector's timing strip, read from the same clock the
   * halos use. Reading a different clock here made the strip disagree with the
   * lamp it describes.
   */
  timingSample(id: string) {
    const ch = this.characters.get(id);
    if (!ch || !this.renderer) return null;
    const sample = sampleLightCharacter(ch, this.renderer.phaseTimeFor(id));
    return {
      fraction: sample.periodFraction,
      phases: ch.phases.map((p) => ({ on: p.on, durationS: p.durationS, color: p.color })),
      periodS: ch.periodS,
    };
  }

  reachOf(id: string) {
    const aid = CHART.aids.find((a) => a.id === id);
    if (!aid) return null;
    const state = this.store.get();
    return computeReach(
      aid.intensityCd,
      aid.focalHeightM,
      atmosphereFor(state.mode, state.visibility, state.eyeHeightM),
    );
  }

  /* ------------------------------- internals ------------------------------ */

  /** Night wash strength: deeper in night mode, deeper still in poor visibility. */
  private darknessFor(): number {
    const state = this.store.get();
    if (state.mode !== 'night') return 0;
    return atmosphereFor(state.mode, state.visibility, state.eyeHeightM).darkness;
  }

  private bindLabelEvents(layer: HTMLElement): void {
    const onClick = (ev: Event): void => {
      const target = (ev.target as HTMLElement).closest<HTMLElement>('.aid-marker');
      if (!target) return;
      const id = target.dataset.aid;
      if (id) this.selectAid(id === this.store.get().selectedAidId ? null : id);
    };
    const onOver = (ev: Event): void => {
      const target = (ev.target as HTMLElement).closest<HTMLElement>('.aid-marker');
      this.hoverAid(target?.dataset.aid ?? null);
    };
    const onOut = (ev: Event): void => {
      const related = (ev as PointerEvent).relatedTarget as HTMLElement | null;
      if (!related?.closest('.aid-marker')) this.hoverAid(null);
    };
    layer.addEventListener('click', onClick);
    layer.addEventListener('pointerover', onOver);
    layer.addEventListener('pointerout', onOut);
    this.cleanup.push(() => {
      layer.removeEventListener('click', onClick);
      layer.removeEventListener('pointerover', onOver);
      layer.removeEventListener('pointerout', onOut);
    });
  }

  private bindPuck(container: HTMLElement): void {
    const puck = document.getElementById('ship-puck') as HTMLButtonElement | null;
    if (!puck) return;
    this.puckEl = puck;
    const map = this.mapHandle!.map;

    let dragging = false;
    let pointerId = -1;

    const applyPoint = (clientX: number, clientY: number): void => {
      const rect = container.getBoundingClientRect();
      const pt = map.unproject([clientX - rect.left, clientY - rect.top]);
      this.applyShipPosition({ lng: pt.lng, lat: pt.lat });
      this.positionPuck();
    };

    const onDown = (ev: PointerEvent): void => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      dragging = true;
      pointerId = ev.pointerId;
      puck.setPointerCapture(ev.pointerId);
      puck.classList.add('is-dragging');
      applyPoint(ev.clientX, ev.clientY);
    };
    const onMove = (ev: PointerEvent): void => {
      if (!dragging || ev.pointerId !== pointerId) return;
      ev.preventDefault();
      applyPoint(ev.clientX, ev.clientY);
    };
    const onUp = (ev: PointerEvent): void => {
      if (ev.pointerId !== pointerId) return;
      dragging = false;
      puck.classList.remove('is-dragging');
      if (puck.hasPointerCapture(ev.pointerId)) puck.releasePointerCapture(ev.pointerId);
      this.toast('船位已更新 · 照明航段重算');
    };
    const onKey = (ev: KeyboardEvent): void => {
      const step = ev.shiftKey ? 600 : 180;
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowRight') {
        ev.preventDefault();
        this.nudgeShip(step);
        this.positionPuck();
      } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowLeft') {
        ev.preventDefault();
        this.nudgeShip(-step);
        this.positionPuck();
      }
    };

    puck.addEventListener('pointerdown', onDown);
    puck.addEventListener('pointermove', onMove);
    puck.addEventListener('pointerup', onUp);
    puck.addEventListener('pointercancel', onUp);
    puck.addEventListener('keydown', onKey);
    this.cleanup.push(() => {
      puck.removeEventListener('pointerdown', onDown);
      puck.removeEventListener('pointermove', onMove);
      puck.removeEventListener('pointerup', onUp);
      puck.removeEventListener('pointercancel', onUp);
      puck.removeEventListener('keydown', onKey);
    });
  }

  /** Drag anywhere on open water to move the ship (MapLibre-safe). */
  private bindShipDrag(container: HTMLElement): void {
    const map = this.mapHandle!.map;
    let dragging = false;
    const apply = (ev: PointerEvent): void => {
      const rect = container.getBoundingClientRect();
      const pt = map.unproject([ev.clientX - rect.left, ev.clientY - rect.top]);
      this.applyShipPosition({ lng: pt.lng, lat: pt.lat });
      this.positionPuck();
    };
    // Alt/Option-drag on the chart repositions the vessel without disturbing
    // normal pan/zoom gestures.
    const onDown = (ev: PointerEvent): void => {
      if (ev.button !== 0 || !(ev.altKey || ev.metaKey)) return;
      dragging = true;
      ev.preventDefault();
      apply(ev);
    };
    const onMove = (ev: PointerEvent): void => {
      if (!dragging) return;
      apply(ev);
    };
    const onUp = (): void => {
      if (!dragging) return;
      dragging = false;
      this.toast('船位已更新');
    };
    map.getCanvasContainer().addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    this.cleanup.push(() => {
      map.getCanvasContainer().removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    });
  }

  private applyShipPosition(p: LngLat): void {
    const snapped = snapShipToRoute(this.route, p);
    const heading = headingAlongRoute(this.route, snapped.point.alongM);
    this.ship = { position: snapped.point.position, headingDeg: heading, alongM: snapped.point.alongM };
    this.renderer?.setShip(this.ship);
    this.ink?.setShip(this.ship);
    this.store.set({
      ship: { position: { ...this.ship.position }, headingDeg: heading, alongM: snapped.point.alongM },
    });
    this.rebuildCoverage();
  }

  private moveShipTo(alongM: number): void {
    const point = routePointAt(this.route, alongM);
    const heading = headingAlongRoute(this.route, point.alongM);
    this.ship = { position: point.position, headingDeg: heading, alongM: point.alongM };
    this.renderer?.setShip(this.ship);
    this.ink?.setShip(this.ship);
    this.store.set({ ship: { position: { ...point.position }, headingDeg: heading, alongM: point.alongM } });
    this.rebuildCoverage();
  }

  private positionPuck(): void {
    if (!this.puckEl || !this.mapHandle) return;
    const p = this.mapHandle.map.project([this.ship.position.lng, this.ship.position.lat]);
    this.puckEl.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${this.ship.headingDeg}deg)`;
  }

  private rebuildCoverage(): void {
    const state = this.store.get();
    const atm = atmosphereFor(state.mode, state.visibility, state.eyeHeightM);
    this.coverage = computeRouteCoverage(this.route, CHART.aids, atm, { isLand: this.depth.isLand });
    this.renderer?.setCoverage(this.coverage);
  }

  private onFrame(stats: {
    fps: number;
    frameMs: number;
    drawCount: number;
    overlapPairs: number;
    maxSuppression: number;
    quality: number;
    litLengthM: number;
    nearestId: string | null;
  }): void {
    this.store.set({
      diagnostics: {
        fps: stats.fps,
        frameMs: stats.frameMs,
        drawCount: stats.drawCount,
        overlapPairs: stats.overlapPairs,
        maxSuppression: stats.maxSuppression,
        quality: stats.quality,
        litLengthM: stats.litLengthM,
        nearestId: stats.nearestId,
      },
    });
  }

  private onViews(views: readonly LightView[]): void {
    this.lastViews = views;
    const nearestId = this.renderer?.lastStats?.nearestId ?? null;
    this.labels?.updateLights(views, nearestId, this.store.get().mode);
    const side = document.querySelector('np-sidepanel') as
      | (HTMLElement & { updateLights?: (v: readonly LightView[], n: string | null) => void })
      | null;
    side?.updateLights?.(views, nearestId);
    const insp = document.querySelector('np-inspector') as
      | (HTMLElement & { updateViews?: (v: readonly LightView[]) => void })
      | null;
    insp?.updateViews?.(views);
  }

  destroy(): void {
    this.renderer?.stop();
    this.mapHandle?.destroy();
    for (const fn of this.cleanup) fn();
    this.cleanup = [];
  }
}

void normalizeBearing;
