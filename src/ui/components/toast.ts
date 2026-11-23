import { NpElement } from './base.ts';

interface Item {
  id: number;
  text: string;
  timer: number;
}

export class NpToast extends NpElement {
  private items: Item[] = [];
  private seq = 0;

  protected setup(): void {
    if (!this.api) return;
    this.setAttribute('role', 'status');
    this.setAttribute('aria-live', 'polite');
    this.track(
      this.api.subscribeToasts((list) => {
        this.render(list as unknown as Item[]);
      }),
    );
  }

  show(text: string): void {
    const item: Item = { id: ++this.seq, text, timer: 0 };
    this.items = [...this.items.slice(-2), item];
    this.paint();
    window.setTimeout(() => {
      this.items = this.items.filter((i) => i.id !== item.id);
      this.paint();
    }, 2600);
  }

  private render(list: Item[]): void {
    this.items = list;
    this.paint();
  }

  private paint(): void {
    this.innerHTML = this.items.map((i) => `<div class="toast" data-toast="${i.id}"><span class="dot"></span>${i.text}</div>`).join('');
  }
}

customElements.define('np-toast', NpToast);
