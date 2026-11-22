import { useToolStore } from '../store';
import { beamRange } from '../lib/beamMath';
import { SectionTitle, SliderRow } from './controls';

/** 模块二：光束编辑 —— 扇形张角、旋转俯仰、多灯叠加列表与实时光斑读数 */
export function BeamEditor() {
  const config = useToolStore((s) => s.config);
  const runtime = useToolStore((s) => s.runtime);
  const selectedId = useToolStore((s) => s.selectedLhId);
  const { selectLighthouse, updateBeam } = useToolStore();

  const lh = config.lighthouses.find((l) => l.id === selectedId) ?? config.lighthouses[0];
  const info = runtime.find((r) => r.id === lh?.id);

  return (
    <div className="panel">
      <SectionTitle>光束编辑</SectionTitle>

      <div className="sub-title">多灯叠加（同屏 {config.lighthouses.length} 盏）</div>
      <div className="beam-stack">
        {config.lighthouses.map((l, i) => {
          const rt = runtime.find((r) => r.id === l.id);
          return (
            <div
              key={l.id}
              className={`beam-stack-row ${l.id === lh?.id ? 'active' : ''}`}
              onClick={() => selectLighthouse(l.id)}
            >
              <span className="stack-index">{i + 1}</span>
              <span className="stack-name">{l.name}</span>
              <span className={`stack-lit ${rt?.shipLit ? 'lit' : ''}`}>
                {rt?.shipLit ? '照亮船' : '未照船'}
              </span>
            </div>
          );
        })}
        {config.lighthouses.length === 0 && <p className="empty-tip">暂无光束。</p>}
      </div>

      {lh && (
        <div className="param-form">
          <div className="sub-title">朝向（旋转 / 俯仰）</div>
          <SliderRow
            label="水平旋转角"
            hint="0°=正北，顺时针旋转"
            value={lh.beam.azimuth}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={(v) => updateBeam(lh.id, { azimuth: v })}
          />
          <SliderRow
            label="俯仰角"
            hint="正值向下俯照水面；过小可能不触水面"
            value={lh.beam.pitch}
            min={-10}
            max={75}
            step={0.5}
            unit="°"
            onChange={(v) => updateBeam(lh.id, { pitch: v })}
          />

          <div className="sub-title">扇形体积（张角）</div>
          <SliderRow
            label="光束水平张角"
            hint="扇形光柱的水平扇面角"
            value={lh.beam.horizontalAngle}
            min={2}
            max={90}
            step={1}
            unit="°"
            onChange={(v) => updateBeam(lh.id, { horizontalAngle: v })}
          />
          <SliderRow
            label="垂直发散角"
            hint="光锥垂直方向的发散范围"
            value={lh.beam.verticalAngle}
            min={1}
            max={45}
            step={0.5}
            unit="°"
            onChange={(v) => updateBeam(lh.id, { verticalAngle: v })}
          />

          <div className="sub-title">实时解算</div>
          <div className="readout-grid">
            <Readout label="有效光程" value={`${beamRange(lh.beam.intensity).toFixed(0)} m`} />
            <Readout
              label="水面照射半径"
              value={info && info.radius > 0 ? `${info.radius.toFixed(1)} m` : '未触水面'}
              accent={info && info.radius > 0}
            />
            <Readout
              label="光斑 X 坐标"
              value={info ? info.spot.x.toFixed(1) : '—'}
              unit="m"
            />
            <Readout
              label="光斑 Z 坐标"
              value={info ? info.spot.z.toFixed(1) : '—'}
              unit="m"
            />
            <Readout
              label="船-光斑距离"
              value={info?.shipDistance != null ? `${info.shipDistance.toFixed(1)} m` : '束外'}
            />
            <Readout
              label="船体状态"
              value={info?.shipLit ? '被照亮' : '遮挡/束外'}
              accent={info?.shipLit}
            />
          </div>
          <p className="tip-line">
            拖动海域中的船体，所有灯塔的光斑位置、照射半径与遮挡判定将在同一帧联动重算。
          </p>
        </div>
      )}
    </div>
  );
}

function Readout({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: boolean | null }) {
  return (
    <div className={`readout ${accent ? 'accent' : ''}`}>
      <span className="readout-label">{label}</span>
      <span className="readout-value">
        {value}
        {unit ? <i>{unit}</i> : null}
      </span>
    </div>
  );
}
