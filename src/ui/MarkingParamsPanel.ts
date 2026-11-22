import { formatNum, sharedCss, sliderRow } from './styles.js';
import { DEFAULT_BUILD_OPTIONS, type MarkingBuildOptions } from '../core/types.js';

/**
 * <marking-params-panel>：标线真实尺寸参数。
 * 任一参数变化即全量重建；虚线段长/间隔独立可调。
 */
export class MarkingParamsPanel extends HTMLElement {
  private root: ShadowRoot;
  // 元素升级时序下 connectedCallback 可能先于构造赋值，给安全默认值
  private opts: MarkingBuildOptions = { ...DEFAULT_BUILD_OPTIONS };

  constructor(opts?: MarkingBuildOptions) {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    if (opts) this.opts = { ...opts };
  }

  connectedCallback(): void {
    this.render();
  }

  update(opts: MarkingBuildOptions): void {
    this.opts = { ...opts };
    this.render();
  }

  private render(): void {
    const o = this.opts;
    this.root.innerHTML = `
      <style>${sharedCss}</style>
      <div class="panel" style="padding:12px 14px">
        <p class="section-title">中线虚线参数</p>
        ${sliderRow('dashLength', '虚线段长', o.dashLength, 5, 100, 1, 'm')}
        ${sliderRow('gapLength', '虚线间隔', o.gapLength, 5, 100, 1, 'm')}
        ${sliderRow('centerlineWidth', '中线宽度', o.centerlineWidth, 0.15, 1.5, 0.05, 'm')}
        ${sliderRow('dashInset', '端部留白', o.dashInset, 0, 120, 1, 'm')}

        <div class="divider"></div>
        <p class="section-title">边线参数</p>
        ${sliderRow('edgeWidth', '边线宽度', o.edgeWidth, 0.15, 1.5, 0.05, 'm')}
        ${sliderRow('edgeInset', '边线内缩', o.edgeInset, 0, 3, 0.05, 'm')}

        <div class="divider"></div>
        <p class="section-title">入口标志</p>
        ${sliderRow('thresholdStripeWidth', '条带宽度', o.thresholdStripeWidth, 0.5, 4, 0.1, 'm')}
        ${sliderRow('thresholdStripeLength', '条带长度', o.thresholdStripeLength, 10, 60, 1, 'm')}
        ${sliderRow('thresholdGap', '条带间距', o.thresholdGap, 1.5, 8, 0.1, 'm')}

        <div class="divider"></div>
        <p class="section-title">接地带标志</p>
        ${sliderRow('touchdownBarWidth', '矩形宽度', o.touchdownBarWidth, 1, 6, 0.1, 'm')}
        ${sliderRow('touchdownBarLength', '矩形长度', o.touchdownBarLength, 10, 45, 0.5, 'm')}
        ${sliderRow('touchdownPairSpacing', '组间距', o.touchdownPairSpacing, 75, 300, 5, 'm')}
        ${sliderRow('touchdownPairGap', '距中线净空', o.touchdownPairGap, 1.5, 9, 0.1, 'm')}

        <div class="divider"></div>
        <p class="section-title">跑道号码</p>
        ${sliderRow('designationHeight', '字符高度', o.designationHeight, 9, 27, 0.5, 'm')}
        ${sliderRow('designationInset', '号码内移', o.designationInset, 18, 120, 1, 'm')}

        <div class="divider"></div>
        <p class="section-title">LOD 简化阈值（缩放级别）</p>
        ${sliderRow('lodFullBelow', '完整→简化', o.lodFullBelow, 12, 17, 0.25)}
        ${sliderRow('lodSimplifyBelow', '简化→合并线', o.lodSimplifyBelow, 9, 14, 0.25)}
        <p style="margin:6px 0 0;color:var(--text-dim);font-size:11px;line-height:1.5">
          放大显示真实宽度；远处标线按最小屏幕像素保持可见，再远合并为简化线。
        </p>
      </div>`;

    this.root.querySelectorAll<HTMLInputElement>('input[type=range]').forEach((el) => {
      el.addEventListener('input', () => {
        const key = el.dataset.key as keyof MarkingBuildOptions;
        const v = parseFloat(el.value);
        (this.opts as unknown as Record<string, number>)[key] = v;
        const valEl = this.root.getElementById(`val-${key}`);
        if (valEl) {
          const unit = el.closest('.row')?.querySelector('label')?.textContent?.includes('级别')
            ? ''
            : valEl.textContent.replace(/[\d.\-]+/, '');
          valEl.textContent = `${formatNum(v)}${unit}`;
        }
        this.dispatchEvent(
          new CustomEvent('options-change', {
            detail: { patch: { [key]: v } },
            bubbles: true,
            composed: true
          })
        );
      });
    });
  }
}

customElements.define('marking-params-panel', MarkingParamsPanel);
