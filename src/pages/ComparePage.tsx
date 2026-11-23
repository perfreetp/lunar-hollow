// 页面 4:姿态对比 — 两个保存姿态的幻影叠加与读数对比
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js';
import Viewport, { type ViewportApi } from '../components/Viewport';
import { solveKinematics } from '../kinematics';
import { poses, setAngle, deletePose, savePose } from '../store';
import { exportScreenshot } from '../controllers/exporters';

export default function ComparePage() {
  let api: ViewportApi | null = null;
  const [selA, setSelA] = createSignal<string>('');
  const [selB, setSelB] = createSignal<string>('');

  // 默认选中前两个姿态
  createEffect(() => {
    const ps = poses();
    if (ps.length >= 2 && !selA() && !selB()) {
      setSelA(ps[0].id);
      setSelB(ps[1].id);
      setAngle(ps[0].angle);
    }
  });

  const loadExamples = () => {
    for (const [name, a] of [['关闭', 0], ['半开', 45], ['全开', 90]] as const) {
      savePose(name, a);
    }
  };

  const poseA = createMemo(() => poses().find((p) => p.id === selA()) ?? null);
  const poseB = createMemo(() => poses().find((p) => p.id === selB()) ?? null);

  // 主视图显示姿态 A(选中时同步全局开度),幻影显示姿态 B
  const applyA = (id: string) => {
    setSelA(id);
    const p = poses().find((x) => x.id === id);
    if (p) setAngle(p.angle);
  };

  const rows = createMemo(() => {
    const a = poseA();
    const b = poseB();
    if (!a || !b) return null;
    const ka = solveKinematics(a.angle);
    const kb = solveKinematics(b.angle);
    return ka.sides.map((sa, i) => {
      const sb = kb.sides[i];
      return {
        side: sa.side.name,
        hingeA: sa.hingeRotationDeg,
        hingeB: sb.hingeRotationDeg,
        strokeA: sa.stroke,
        strokeB: sb.stroke,
        extA: sa.rodExtension,
        extB: sb.rodExtension,
      };
    });
  });

  return (
    <div class="page">
      <div class="page-main">
        <Viewport apiRef={(a) => (api = a)} ghostAngle={poseB()?.angle ?? null} />
        <div class="compare-legend">
          <span class="swatch solid" /> 姿态 A(实体){poseA() ? `:${poseA()!.name} ${poseA()!.angle}°` : ''}
          <span class="swatch ghost" /> 姿态 B(幻影){poseB() ? `:${poseB()!.name} ${poseB()!.angle}°` : ''}
        </div>
      </div>
      <aside class="page-side">
        <h2>姿态对比</h2>
        <Show when={poses().length >= 2} fallback={
          <div>
            <p class="dim">请先在「开度控制」页保存至少两个姿态。</p>
            <button class="btn" onClick={loadExamples}>载入示例姿态(0° / 45° / 90°)</button>
          </div>
        }>
          <div class="select-row">
            <label>姿态 A</label>
            <select value={selA()} onChange={(e) => applyA(e.currentTarget.value)}>
              <option value="">选择…</option>
              <For each={poses()}>{(p) => <option value={p.id}>{p.name}({p.angle}°)</option>}</For>
            </select>
          </div>
          <div class="select-row">
            <label>姿态 B</label>
            <select value={selB()} onChange={(e) => setSelB(e.currentTarget.value)}>
              <option value="">选择…</option>
              <For each={poses()}>{(p) => <option value={p.id}>{p.name}({p.angle}°)</option>}</For>
            </select>
          </div>

          <Show when={rows()}>
            <table class="hit-table">
              <thead>
                <tr>
                  <th>读数</th>
                  <th>A</th>
                  <th>B</th>
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                <For each={rows()}>
                  {(r) => (
                    <>
                      <tr>
                        <td>{r.side}支铰转角°</td>
                        <td>{r.hingeA.toFixed(1)}</td>
                        <td>{r.hingeB.toFixed(1)}</td>
                        <td>{(r.hingeB - r.hingeA).toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td>{r.side}活塞行程 m</td>
                        <td>{r.strokeA.toFixed(3)}</td>
                        <td>{r.strokeB.toFixed(3)}</td>
                        <td>{(r.strokeB - r.strokeA).toFixed(3)}</td>
                      </tr>
                      <tr>
                        <td>{r.side}杆伸出 m</td>
                        <td>{r.extA.toFixed(3)}</td>
                        <td>{r.extB.toFixed(3)}</td>
                        <td>{(r.extB - r.extA).toFixed(3)}</td>
                      </tr>
                    </>
                  )}
                </For>
              </tbody>
            </table>
            <button class="btn" onClick={() => api && exportScreenshot(api.capture(), 'compare')}>
              导出对比截图
            </button>
          </Show>
        </Show>

        <h3>姿态库</h3>
        <ul class="pose-list">
          <For each={poses()} fallback={<li class="dim">暂无保存的姿态</li>}>
            {(p) => (
              <li>
                <span>{p.name}</span>
                <span class="dim">{p.angle.toFixed(1)}°</span>
                <button class="link danger" onClick={() => deletePose(p.id)}>
                  删除
                </button>
              </li>
            )}
          </For>
        </ul>
      </aside>
    </div>
  );
}
