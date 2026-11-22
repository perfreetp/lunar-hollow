import { createSignal, createEffect, onMount, onCleanup, Show, For } from 'solid-js';
import { state } from './state';
import { Engine } from './three/engine';
import { typeNameOf, MIN_LEN, MAX_LEN, MIN_H, MAX_H } from './three/bars';
import type { BarSpec, BarType } from './types';

const PALETTE: { type: BarType; name: string; desc: string }[] = [
  { type: 'straight', name: '一字型扶手', desc: '水平直杆，两端固定' },
  { type: 'lshape', name: 'L 型扶手', desc: '水平 + 竖向组合，可翻转' },
  { type: 'folding', name: '折叠型扶手', desc: '可上翻收纳，节省空间' },
];

export default function App() {
  let viewportRef!: HTMLDivElement;
  let labelRef!: HTMLDivElement;
  let fileModel!: HTMLInputElement;
  let fileLayout!: HTMLInputElement;
  let engine!: Engine;

  const [ready, setReady] = createSignal(false);
  const [sel, setSel] = createSignal<BarSpec | null>(null);
  const [toast, setToast] = createSignal('');

  onMount(() => {
    engine = new Engine(viewportRef, labelRef);
    setReady(true);
  });
  onCleanup(() => engine?.dispose());

  // 选中项或任意参数变化时刷新检查面板
  createEffect(() => {
    state.specVersion;
    state.selectedId;
    if (!ready()) return;
    setSel(state.selectedId ? engine.getSpec(state.selectedId) : null);
  });

  let toastTimer = 0;
  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => setToast(''), 3200);
  };

  const doExport = () => {
    const blob = new Blob([engine.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grabbar-layout.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出布置文件（含墙面坐标、尺寸与视角）');
  };

  const onLayoutFile = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const res = engine.importJSON(await f.text());
    showToast(res.message);
    input.value = '';
  };

  const onModelFile = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    showToast(await engine.loadModel(f));
    input.value = '';
  };

  return (
    <div class="app">
      <header>
        <span class="title">卫浴扶手布置渲染器</span>
        <div class="seg">
          <button
            classList={{ active: state.mode === 'normal' }}
            onClick={() => engine.setMode('normal')}
          >
            普通视图
          </button>
          <button
            classList={{ active: state.mode === 'mirror' }}
            onClick={() => engine.setMode('mirror')}
          >
            镜面预览
          </button>
        </div>
        <label class="chk">
          <input
            type="checkbox"
            checked={state.outline}
            onChange={(e) => engine.setOutline(e.currentTarget.checked)}
          />
          轮廓描边
        </label>
        <span class="sep" />
        <button onClick={() => fileModel.click()}>载入模型 (GLB)</button>
        <button
          onClick={() => {
            engine.resetScene();
            showToast('已恢复默认浴室场景');
          }}
        >
          恢复默认场景
        </button>
        <span class="sep" />
        <button onClick={doExport}>导出布置</button>
        <button onClick={() => fileLayout.click()}>导入布置</button>
        <button onClick={() => engine.clearBars()}>清空扶手</button>
        <span class="scene-info">{state.sceneInfo}</span>
        <input
          ref={fileModel}
          type="file"
          accept=".glb,.gltf"
          style="display:none"
          onChange={onModelFile}
        />
        <input
          ref={fileLayout}
          type="file"
          accept=".json"
          style="display:none"
          onChange={onLayoutFile}
        />
      </header>

      <div class="main">
        <aside class="palette">
          <div class="palette-title">扶手库（拖到墙面）</div>
          <For each={PALETTE}>
            {(p) => (
              <div
                class="palette-item"
                onPointerDown={(e) => {
                  e.preventDefault();
                  engine.beginPaletteDrag(p.type);
                }}
              >
                <div class="palette-name">{p.name}</div>
                <div class="palette-desc">{p.desc}</div>
              </div>
            )}
          </For>
          <div class="palette-count">已放置 {state.bars.length} 根</div>
        </aside>

        <div class="viewport" ref={viewportRef}>
          <div class="labels" ref={labelRef} />
          <div class="hint">
            从左侧拖扶手到墙面放置 · 拖动扶手沿墙移动 · 点击选中 · Delete 删除
            {state.mode === 'mirror' ? ' · 镜面模式下可直接在镜中拖动扶手' : ''}
          </div>
          <Show when={toast()}>
            <div class="toast">{toast()}</div>
          </Show>
        </div>

        <Show when={sel()}>
          {(s) => (
            <aside class="inspector">
              <div class="insp-title">{typeNameOf(s().type)}扶手</div>
              <div class="row">墙面：{s().wallName || '—'}</div>
              <div class="row">墙面坐标 u：{(s().u * 100).toFixed(0)} cm</div>
              <label>
                长度 {(s().length * 100).toFixed(0)} cm（40–120）
                <input
                  type="range"
                  min={MIN_LEN * 100}
                  max={MAX_LEN * 100}
                  step="1"
                  value={s().length * 100}
                  onInput={(e) =>
                    engine.updateBarSpec(s().id, { length: +e.currentTarget.value / 100 })
                  }
                />
              </label>
              <label>
                离地高度 {(s().height * 100).toFixed(0)} cm
                <input
                  type="range"
                  min={MIN_H * 100}
                  max={MAX_H * 100}
                  step="1"
                  value={s().height * 100}
                  onInput={(e) =>
                    engine.updateBarSpec(s().id, { height: +e.currentTarget.value / 100 })
                  }
                />
              </label>
              <Show when={s().type === 'folding'}>
                <label>
                  折叠角度 {s().foldAngle.toFixed(0)}°（0° 水平 / 90° 贴墙）
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="1"
                    value={s().foldAngle}
                    onInput={(e) =>
                      engine.updateBarSpec(s().id, { foldAngle: +e.currentTarget.value })
                    }
                  />
                </label>
              </Show>
              <Show when={s().type === 'lshape'}>
                <button onClick={() => engine.flipBar(s().id)}>水平翻转</button>
              </Show>
              <button class="danger" onClick={() => engine.deleteBar(s().id)}>
                删除扶手
              </button>
            </aside>
          )}
        </Show>
      </div>
    </div>
  );
}
