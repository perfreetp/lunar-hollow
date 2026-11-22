import { useToolStore } from '../store';
import { MAX_LIGHTS } from '../types';
import { Field, SectionTitle, SliderRow } from './controls';

/** 模块一：灯塔参数台 —— 灯高、灯质周期、光强档位、色温、闪光相位等录入 */
export function LighthousePanel() {
  const config = useToolStore((s) => s.config);
  const selectedId = useToolStore((s) => s.selectedLhId);
  const { selectLighthouse, addLighthouse, removeLighthouse, duplicateLighthouse, updateLighthouse, updateBeam } =
    useToolStore();

  const lh = config.lighthouses.find((l) => l.id === selectedId) ?? config.lighthouses[0];

  return (
    <div className="panel">
      <SectionTitle
        extra={
          <button className="btn btn-primary" disabled={config.lighthouses.length >= MAX_LIGHTS} onClick={addLighthouse}>
            + 新增灯塔
          </button>
        }
      >
        灯塔参数台
      </SectionTitle>

      <div className="lh-list">
        {config.lighthouses.map((l) => (
          <div
            key={l.id}
            className={`lh-chip ${l.id === lh?.id ? 'active' : ''}`}
            onClick={() => selectLighthouse(l.id)}
          >
            <span className="lh-chip-name">{l.name}</span>
            <span className="lh-chip-meta">
              {l.height}m · {l.beam.intensity}档 · {l.beam.colorTemp}K
            </span>
          </div>
        ))}
        {config.lighthouses.length === 0 && <p className="empty-tip">暂无灯塔，点击右上角新增。</p>}
      </div>

      {lh && (
        <div className="param-form">
          <Field label="灯塔名称">
            <input value={lh.name} onChange={(e) => updateLighthouse(lh.id, { name: e.target.value })} />
          </Field>

          <div className="form-grid-2">
            <Field label="坐标 X (m)">
              <input
                type="number"
                value={lh.x}
                step={5}
                onChange={(e) => updateLighthouse(lh.id, { x: Number(e.target.value) })}
              />
            </Field>
            <Field label="坐标 Z (m)">
              <input
                type="number"
                value={lh.z}
                step={5}
                onChange={(e) => updateLighthouse(lh.id, { z: Number(e.target.value) })}
              />
            </Field>
          </div>

          <SliderRow
            label="灯高"
            hint="灯芯距水面高度（米）"
            value={lh.height}
            min={8}
            max={120}
            step={0.5}
            unit="m"
            onChange={(v) => updateLighthouse(lh.id, { height: v })}
          />
          <SliderRow
            label="塔身半径"
            hint="作为遮挡体参与他灯遮挡计算"
            value={lh.towerRadius}
            min={1}
            max={10}
            step={0.5}
            unit="m"
            onChange={(v) => updateLighthouse(lh.id, { towerRadius: v })}
          />

          <div className="sub-title">灯质与光源</div>

          <SliderRow
            label="灯质周期"
            hint="一个完整闪光循环的时长"
            value={lh.beam.period}
            min={0.5}
            max={20}
            step={0.5}
            unit="s"
            onChange={(v) => updateBeam(lh.id, { period: v })}
          />
          <SliderRow
            label="闪光相位"
            hint="多灯叠加时错开闪光的时间偏移"
            value={lh.beam.phase}
            min={0}
            max={20}
            step={0.1}
            unit="s"
            onChange={(v) => updateBeam(lh.id, { phase: v })}
          />
          <SliderRow
            label="亮灯占空比"
            hint="一个周期内亮灯时间比例"
            value={lh.beam.duty}
            min={0.05}
            max={1}
            step={0.05}
            onChange={(v) => updateBeam(lh.id, { duty: v })}
          />
          <SliderRow
            label="光强档位"
            hint="档位决定光程（80–420m）与光柱亮度"
            value={lh.beam.intensity}
            min={1}
            max={10}
            step={1}
            unit="档"
            onChange={(v) => updateBeam(lh.id, { intensity: v })}
          />
          <SliderRow
            label="色温"
            hint="1800K 暖黄 → 8000K 冷白"
            value={lh.beam.colorTemp}
            min={1800}
            max={8000}
            step={100}
            unit="K"
            onChange={(v) => updateBeam(lh.id, { colorTemp: v })}
          />
          <div className="kelvin-strip" aria-label="色温预览">
            {[2000, 3000, 4200, 5600, 7500].map((k) => (
              <button
                key={k}
                className={lh.beam.colorTemp === k ? 'active' : ''}
                style={{ background: kelvinSwatch(k) }}
                onClick={() => updateBeam(lh.id, { colorTemp: k })}
                title={`${k}K`}
              />
            ))}
          </div>

          <div className="form-actions">
            <button className="btn" onClick={() => duplicateLighthouse(lh.id)}>
              复制此灯
            </button>
            <button className="btn btn-danger" onClick={() => removeLighthouse(lh.id)}>
              删除灯塔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 色温色块（sRGB 近似，仅供 UI 预览，渲染端用 kelvinToLinearRGB） */
function kelvinSwatch(kelvin: number): string {
  const t = kelvin / 100;
  let r = 255,
    g = 255,
    b = 255;
  if (t <= 66) {
    g = Math.max(0, Math.min(255, 99.47 * Math.log(t) - 161.12));
    b = t <= 19 ? 0 : Math.max(0, Math.min(255, 138.52 * Math.log(t - 10) - 305.04));
  } else {
    r = Math.max(0, Math.min(255, 329.7 * Math.pow(t - 60, -0.133)));
    g = Math.max(0, Math.min(255, 288.12 * Math.pow(t - 60, -0.0755)));
  }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
