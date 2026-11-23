import type { VisibilityGradeId } from '../../core/atmosphere.ts';
import type { ScaleMode } from '../../render/glow-renderer.ts';
import type { ExportFormat } from '../../core/voyage-export.ts';
import type { ThemeMode } from '../../app/state.ts';

export interface Toast {
  id: number;
  text: string;
}

/**
 * The components talk to the app through this narrow interface so they stay
 * independent of the map/canvas controller's implementation.
 */
export interface AppApi {
  getState(): import('../../app/state.ts').AppState;
  subscribe(fn: (state: import('../../app/state.ts').AppState) => void): () => void;
  setMode(mode: ThemeMode): void;
  setVisibility(id: VisibilityGradeId): void;
  setScaleMode(mode: ScaleMode): void;
  setEyeHeight(m: number): void;
  setQuality(q: 'auto' | 'high' | 'balanced'): void;
  setMotion(m: 'animated' | 'frozen'): void;
  toggleFlag(flag: 'showRoute' | 'showSectors' | 'showSoundings' | 'showGraticule'): void;
  selectAid(id: string | null): void;
  hoverAid(id: string | null): void;
  focusAid(id: string): void;
  focusRoute(): void;
  nudgeShip(deltaM: number): void;
  setShipFromRoute(ratio: number): void;
  openExport(): void;
  closeExport(): void;
  doExport(format: ExportFormat): import('../../core/voyage-export.ts').ExportedFile;
  toast(text: string): void;
  toasts(): readonly Toast[];
  subscribeToasts(fn: (toasts: readonly Toast[]) => void): () => void;
  lightViews(): readonly import('../../render/glow-renderer.ts').LightView[];
  envelopes(): Map<string, number>;
  shipInfo(): {
    position: { lng: number; lat: number };
    headingDeg: number;
    alongM: number;
    distanceToNearestM: number;
    nearestId: string | null;
    nearestBearing: string;
    nearestName: string;
  };
  aidById(id: string): import('../../model/types.ts').Aid | undefined;
  litLengthM(): number;
  envelopeOf(id: string): number;
  timingSample(id: string): {
    fraction: number;
    phases: Array<{ on: boolean; durationS: number; color: string }>;
    periodS: number;
  } | null;
  reachOf(id: string): import('../../core/atmosphere.ts').LightReach | null;
  /** Phase state for the inspector strip, read from the renderer's clock. */
}

const registry = new WeakMap<EventTarget, AppApi>();

export function registerApi(target: EventTarget, api: AppApi): void {
  registry.set(target, api);
}

export function apiOf(target: EventTarget): AppApi | null {
  return registry.get(target) ?? null;
}

/** Walk up to the nearest element that has an API registered. */
export function findApi(node: Element | null): AppApi | null {
  let cur: Element | null = node;
  while (cur) {
    const api = registry.get(cur);
    if (api) return api;
    cur = cur.parentElement;
  }
  return null;
}

export const API_READY_EVENT = 'np:api-ready';

/** Base class for the app's Web Components. */
export class NpElement extends HTMLElement {
  protected api: AppApi | null = null;
  private unsubs: Array<() => void> = [];
  private mounted = false;
  private onReady = (): void => {
    if (this.mounted) return;
    this.api = findApi(this) ?? apiOf(document.body);
    if (this.api) this.boot();
  };

  connectedCallback(): void {
    this.api = findApi(this) ?? apiOf(document.body);
    if (this.api) {
      this.boot();
      return;
    }
    document.addEventListener(API_READY_EVENT, this.onReady);
    // Fallback for the case where the API is registered before this element
    // upgraded but after the event was dispatched.
    requestAnimationFrame(() => this.onReady());
  }

  disconnectedCallback(): void {
    document.removeEventListener(API_READY_EVENT, this.onReady);
    this.unmount();
  }

  /** Allow the host to force a re-bind after a late API registration. */
  rebind(): void {
    this.unmount();
    this.onReady();
  }

  private boot(): void {
    if (this.mounted || !this.api) return;
    this.mounted = true;
    this.setup();
  }

  private unmount(): void {
    for (const un of this.unsubs) un();
    this.unsubs = [];
    if (this.mounted) this.teardown();
    this.mounted = false;
  }

  protected track(fn: () => void): void {
    this.unsubs.push(fn);
  }

  protected on<K extends keyof HTMLElementEventMap>(
    el: EventTarget,
    type: K,
    handler: (ev: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    el.addEventListener(type, handler as EventListener, options);
    this.unsubs.push(() => el.removeEventListener(type, handler as EventListener, options));
  }

  protected q<T extends Element>(sel: string): T | null {
    return this.querySelector<T>(sel);
  }

  protected qa<T extends Element>(sel: string): T[] {
    return Array.from(this.querySelectorAll<T>(sel));
  }

  /** Subclasses: build DOM, bind events, subscribe. */
  protected setup(): void {}
  protected teardown(): void {}
}

export function fmt(v: number, digits = 1): string {
  return v.toFixed(digits);
}

export function cls(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
