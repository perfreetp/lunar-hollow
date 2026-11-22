/** Web Component 共享样式（Shadow DOM 内生效） */
export const sharedCss = `
:host {
  --panel-bg: rgba(18, 22, 28, 0.92);
  --panel-border: rgba(255, 255, 255, 0.12);
  --text: #e8ecf1;
  --text-dim: #9aa6b2;
  --accent: #4d9fff;
  --accent-weak: rgba(77, 159, 255, 0.18);
  --warn: #ffb020;
  --danger: #ff5d5d;
  --radius: 8px;
  font-size: 13px;
  color: var(--text);
  font-family: "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
  box-sizing: border-box;
}
* { box-sizing: border-box; }
.panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  backdrop-filter: blur(8px);
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-dim);
  text-transform: uppercase;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.row label { flex: 0 0 96px; color: var(--text-dim); }
.row .val { flex: 0 0 52px; text-align: right; font-variant-numeric: tabular-nums; color: var(--accent); }
input[type="range"] { flex: 1; min-width: 0; accent-color: var(--accent); }
input[type="number"], input[type="text"], select {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--panel-border);
  border-radius: 5px;
  color: var(--text);
  padding: 5px 8px;
  font-size: 12px;
  outline: none;
}
input:focus, select:focus { border-color: var(--accent); }
button {
  background: var(--accent-weak);
  border: 1px solid rgba(77,159,255,0.45);
  color: var(--text);
  border-radius: 5px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
button:hover { background: rgba(77,159,255,0.32); }
button.ghost { background: transparent; border-color: var(--panel-border); }
button.danger { border-color: rgba(255,93,93,0.5); background: rgba(255,93,93,0.14); }
button.active { background: var(--accent); border-color: var(--accent); color: #08131f; font-weight: 600; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
.switch { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.switch input { accent-color: var(--accent); width: 15px; height: 15px; }
.divider { height: 1px; background: var(--panel-border); margin: 10px 0; }
.tag {
  display: inline-block; padding: 1px 7px; border-radius: 99px;
  background: var(--accent-weak); color: var(--accent);
  font-size: 11px; font-variant-numeric: tabular-nums;
}
.scroll { overflow-y: auto; }
.scroll::-webkit-scrollbar { width: 8px; }
.scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
`;

/** 滑块行：标签 + range + 数值 */
export function sliderRow(
  key: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  unit = ''
): string {
  return `
  <div class="row">
    <label title="${label}">${label}</label>
    <input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${value}">
    <span class="val" id="val-${key}">${formatNum(value)}${unit}</span>
  </div>`;
}

export function formatNum(n: number): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

/** 数字输入行 */
export function numberRow(
  key: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  unit = ''
): string {
  return `
  <div class="row">
    <label>${label}</label>
    <input type="number" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${value}">
    <span class="val" style="flex:0 0 22px">${unit}</span>
  </div>`;
}
