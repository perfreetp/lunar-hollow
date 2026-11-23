import './styles/app.css';
import './ui/components/topbar.ts';
import './ui/components/sidepanel.ts';
import './ui/components/inspector.ts';
import './ui/components/statusbar.ts';
import './ui/components/export-dialog.ts';
import './ui/components/toast.ts';
import { App } from './app/controller.ts';
import { SOUNDING_POINTS } from './model/chart-data.ts';

async function main(): Promise<void> {
  const app = new App();
  const container = document.getElementById('chart-shell');
  if (container) {
    container.classList.add('is-booting');
  }

  // The app element must exist before the components boot, so the API is
  // registered first and the map/raster load behind a single boot state.
  await app.boot();
  if (container) container.classList.remove('is-booting');

  document.body.dataset.ready = 'true';
  const dbg = document.getElementById('boot-status');
  if (dbg) dbg.remove();

  // Optional deep-link: ?a=aid id focuses that light on load.
  const params = new URLSearchParams(location.search);
  const focus = params.get('aid');
  if (focus) app.focusAid(focus);
  const mode = params.get('mode');
  if (mode === 'day' || mode === 'night') app.setMode(mode);

  (window as unknown as { np?: unknown }).np = {
    app,
    soundings: SOUNDING_POINTS.length,
    version: '1.0.0',
  };
}

main().catch((err) => {
  console.error(err);
  const pre = document.createElement('pre');
  pre.style.cssText =
    'position:fixed;inset:auto 16px 16px;color:#ff8f80;background:#120608;border:1px solid #50222a;padding:12px;font:12px monospace;z-index:99;white-space:pre-wrap';
  pre.textContent = `启动失败: ${String(err?.message ?? err)}`;
  document.body.appendChild(pre);
});
