// 页面 2:开度控制 — 滑块、档位、姿态保存
import { For } from 'solid-js';
import Viewport from '../components/Viewport';
import ReadoutPanel from '../components/ReadoutPanel';
import { ANGLE_MAX, ANGLE_MIN, ANGLE_PRESETS } from '../config';
import { angle, setAngle, savePose, poses, deletePose } from '../store';

export default function ControlPage() {
  let nameInput!: HTMLInputElement;

  const onSave = () => {
    savePose(nameInput.value, angle());
    nameInput.value = '';
  };

  return (
    <div class="page">
      <div class="page-main">
        <Viewport />
      </div>
      <aside class="page-side">
        <h2>开度控制</h2>
        <div class="angle-display">{angle().toFixed(1)}°</div>
        <input
          class="angle-slider"
          type="range"
          min={ANGLE_MIN}
          max={ANGLE_MAX}
          step={0.1}
          value={angle()}
          onInput={(e) => setAngle(Number(e.currentTarget.value))}
        />
        <div class="preset-row">
          <For each={ANGLE_PRESETS}>
            {(p) => (
              <button class="btn small" classList={{ active: Math.abs(angle() - p) < 0.05 }} onClick={() => setAngle(p)}>
                {p}°
              </button>
            )}
          </For>
        </div>
        <div class="num-row">
          <input
            type="number"
            min={ANGLE_MIN}
            max={ANGLE_MAX}
            step={0.5}
            value={angle()}
            onChange={(e) => setAngle(Number(e.currentTarget.value))}
          />
          <span>°(0 = 关闭,90 = 全开)</span>
        </div>

        <h3>保存姿态</h3>
        <div class="save-row">
          <input ref={nameInput} type="text" placeholder={`姿态名称(默认:姿态 ${poses().length + 1})`} />
          <button class="btn" onClick={onSave}>
            保存当前
          </button>
        </div>
        <ul class="pose-list">
          <For each={poses()} fallback={<li class="dim">暂无保存的姿态</li>}>
            {(p) => (
              <li>
                <button class="link" onClick={() => setAngle(p.angle)} title="切换到该姿态">
                  {p.name}
                </button>
                <span class="dim">{p.angle.toFixed(1)}°</span>
                <button class="link danger" onClick={() => deletePose(p.id)}>
                  删除
                </button>
              </li>
            )}
          </For>
        </ul>

        <h3>实时读数</h3>
        <ReadoutPanel />
      </aside>
    </div>
  );
}
