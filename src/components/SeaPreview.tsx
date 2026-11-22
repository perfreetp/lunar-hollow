import { useEffect, useRef } from 'react';
import { useToolStore } from '../store';
import { SceneManager } from '../three/SceneManager';
import { Field, SectionTitle, SliderRow } from './controls';

/** 模块三：海域预览 —— 三维视口 + 船体/礁石/雾况控制 + 联动状态总览 */
export function SeaPreview() {
  const mountRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<SceneManager | null>(null);

  const config = useToolStore((s) => s.config);
  const runtime = useToolStore((s) => s.runtime);
  const { setShip, setEnvironment, addReef, removeReef, updateReef, toggle, lowResFar, showFootprints, mistEnabled } =
    useToolStore();

  useEffect(() => {
    if (!mountRef.current || managerRef.current) return;
    managerRef.current = new SceneManager(mountRef.current);
    // 调试钩子：供自动化冒烟测试读取（不影响生产逻辑）
    (window as unknown as { __LH_TOOL__?: unknown }).__LH_TOOL__ = managerRef.current;
    return () => {
      managerRef.current?.dispose();
      managerRef.current = null;
    };
  }, []);

  const litCount = runtime.filter((r) => r.shipLit).length;

  return (
    <div className="panel sea-panel">
      <SectionTitle
        extra={
          <div className="viewport-toggles">
            <Toggle label="薄雾" on={mistEnabled} onClick={() => toggle('mistEnabled')} />
            <Toggle label="远灯低分辨率" on={lowResFar} onClick={() => toggle('lowResFar')} />
            <Toggle label="光斑标记" on={showFootprints} onClick={() => toggle('showFootprints')} />
          </div>
        }
      >
        海域预览
      </SectionTitle>

      <div className="viewport" ref={mountRef}>
        <div className="viewport-hud">
          <span>
            船位 X {config.ship.x.toFixed(1)} / Z {config.ship.z.toFixed(1)}（m）
          </span>
          <span className={litCount > 0 ? 'hud-lit' : 'hud-dark'}>
            {litCount}/{config.lighthouses.length} 盏灯照亮船体
          </span>
        </div>
        <div className="viewport-hint">左键拖船移动 · 空白处拖动旋转视角 · 滚轮缩放 · 点击塔体选中</div>
      </div>

      <div className="param-form compact">
        <div className="sub-title">船体（可直接在视口拖动）</div>
        <div className="form-grid-2">
          <SliderRow label="X" value={config.ship.x} min={-380} max={380} step={1} unit="m" onChange={(v) => setShip({ x: v })} />
          <SliderRow label="Z" value={config.ship.z} min={-380} max={380} step={1} unit="m" onChange={(v) => setShip({ z: v })} />
        </div>
        <SliderRow label="船首朝向" value={config.ship.heading} min={0} max={360} step={1} unit="°" onChange={(v) => setShip({ heading: v })} />
        <div className="form-grid-2">
          <SliderRow label="船长" value={config.ship.length} min={6} max={40} step={1} unit="m" onChange={(v) => setShip({ length: v })} />
          <SliderRow label="船宽" value={config.ship.width} min={2} max={14} step={0.5} unit="m" onChange={(v) => setShip({ width: v })} />
        </div>

        <div className="sub-title">近岸雾况</div>
        <SliderRow
          label="薄雾浓度"
          value={config.environment.fogDensity}
          min={0.0002}
          max={0.006}
          step={0.0001}
          onChange={(v) => setEnvironment({ fogDensity: v })}
        />
        <SliderRow label="环境光" value={config.environment.ambient} min={0.05} max={1} step={0.05} onChange={(v) => setEnvironment({ ambient: v })} />
        <Field label="海水颜色">
          <input type="color" value={config.environment.seaColor} onChange={(e) => setEnvironment({ seaColor: e.target.value })} />
        </Field>

        <div className="sub-title">
          礁石（遮挡体）
          <button className="btn btn-small" onClick={addReef}>
            + 添加
          </button>
        </div>
        <div className="reef-list">
          {config.reefs.map((r) => (
            <div key={r.id} className="reef-row">
              <span>
                礁 ({r.x.toFixed(0)}, {r.z.toFixed(0)})
              </span>
              <input
                type="number"
                value={r.radius}
                min={2}
                max={25}
                step={1}
                onChange={(e) => updateReef(r.id, { radius: Number(e.target.value) })}
              />
              <i>m</i>
              <button className="btn btn-small btn-danger" onClick={() => removeReef(r.id)}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="sub-title">各灯联动状态（随船位实时刷新）</div>
        <div className="runtime-table">
          {runtime.map((r) => (
            <div key={r.id} className={`runtime-row ${r.shipLit ? 'lit' : ''}`}>
              <span className="rt-name">{r.name}</span>
              <span className="rt-spot">
                光斑({r.spot.x.toFixed(0)}, {r.spot.z.toFixed(0)}) · R{r.radius.toFixed(0)}m
              </span>
              <span className="rt-state">{r.shipLit ? '● 照亮' : '○ 遮挡/束外'}</span>
            </div>
          ))}
          {runtime.length === 0 && <p className="empty-tip">暂无灯塔数据。</p>}
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}
