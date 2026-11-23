/**
 * Tiny observable store. Web Components subscribe; the controller mutates.
 */
export type Listener<T> = (state: T) => void;

export class Store<T extends object> {
  private state: T;
  private listeners = new Set<Listener<T>>();
  private scheduled = false;
  private pending: T | null = null;

  constructor(initial: T) {
    this.state = initial;
  }

  get(): T {
    return this.pending ?? this.state;
  }

  set(patch: Partial<T> | ((state: T) => Partial<T>)): void {
    const current = this.get();
    const next = typeof patch === 'function' ? patch(current) : patch;
    this.pending = { ...current, ...next };
    this.schedule();
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    listener(this.get());
    return () => this.listeners.delete(listener);
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      if (!this.pending) return;
      this.state = this.pending;
      this.pending = null;
      for (const l of this.listeners) l(this.state);
    });
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatPercent(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}
