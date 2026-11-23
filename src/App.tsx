// 应用外壳:hash 路由 + 导航
import { createSignal, onMount, onCleanup, Show, type Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import ModelPage from './pages/ModelPage';
import ControlPage from './pages/ControlPage';
import InterferencePage from './pages/InterferencePage';
import ComparePage from './pages/ComparePage';
import { startInterferenceRunner } from './controllers/interferenceRunner';
import { checking, interference } from './store';

const ROUTES: { hash: string; label: string; page: Component }[] = [
  { hash: '#/model', label: '机构模型', page: ModelPage },
  { hash: '#/control', label: '开度控制', page: ControlPage },
  { hash: '#/interference', label: '干涉检查', page: InterferencePage },
  { hash: '#/compare', label: '姿态对比', page: ComparePage },
];

function currentHash(): string {
  const h = window.location.hash;
  return ROUTES.some((r) => r.hash === h) ? h : '#/model';
}

export default function App() {
  const [hash, setHash] = createSignal(currentHash());
  const onHash = () => setHash(currentHash());
  onMount(() => {
    window.addEventListener('hashchange', onHash);
    startInterferenceRunner();
  });
  onCleanup(() => window.removeEventListener('hashchange', onHash));

  const active = () => ROUTES.find((r) => r.hash === hash()) ?? ROUTES[0];

  return (
    <div class="app">
      <header class="topbar">
        <div class="title">
          船闸人字门启闭机构 · 运动仿真与干涉检查
          <Show when={checking()}>
            <span class="badge">重算中…</span>
          </Show>
          <Show when={!checking() && (interference()?.hits.length ?? 0) > 0}>
            <span class="badge bad">干涉 {interference()!.hits.length}</span>
          </Show>
        </div>
        <nav>
          {ROUTES.map((r) => (
            <a href={r.hash} classList={{ active: r.hash === hash() }}>
              {r.label}
            </a>
          ))}
        </nav>
      </header>
      <main>
        <Dynamic component={active().page} />
      </main>
    </div>
  );
}
