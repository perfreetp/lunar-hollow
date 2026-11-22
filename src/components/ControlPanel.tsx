import { TENSION_GEARS } from '../physics/config';
import { store, useAppState } from '../state/store';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function NumberField({
  label,
  value,
  unit,
  step = 1,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="field-input">
        <input
          type="number"
          value={Number(value.toFixed(3))}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <em>{unit}</em>
      </span>
    </label>
  );
}

export function ControlPanel() {
  const supportA = useAppState((s) => s.supportA);
  const supportB = useAppState((s) => s.supportB);
  const gearIndex = useAppState((s) => s.gearIndex);
  const cabin = useAppState((s) => s.cabin);
  const wheels = useAppState((s) => s.wheels);
  const threshold = useAppState((s) => s.indentThresholdMm);
  const cameraMode = useAppState((s) => s.cameraMode);

  return (
    <aside className="panel">
      <div className="panel-header">
        <h2>索道钢丝绳仿真</h2>
        <p>分段悬链线 · 实时求解渲染</p>
      </div>

      <Section title="端部支架坐标（可在画布中拖动）">
        {([
          ['support-A', supportA],
          ['support-B', supportB],
        ] as const).map(([id, sup]) => (
          <div key={id} className="coord-block">
            <strong>{sup.name}</strong>
            <div className="coord-grid">
              {(['x', 'y', 'z'] as const).map((axis) => (
                <label key={axis}>
                  {axis.toUpperCase()}
                  <input
                    type="number"
                    value={Number(sup.position[axis].toFixed(2))}
                    step={axis === 'y' ? 0.5 : 1}
                    onChange={(e) =>
                      store.setSupportPosition(id, { [axis]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title={`初始张力档位（当前 H = ${(TENSION_GEARS[gearIndex].H / 1000).toFixed(0)} kN）`}>
        <div className="gear-row">
          {TENSION_GEARS.map((g, i) => (
            <button
              key={g.label}
              className={i === gearIndex ? 'gear active' : 'gear'}
              onClick={() => store.setGear(i)}
              title={`水平张力 ${g.H / 1000} kN，切换后全部接触点重算`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </Section>

      <Section title="车厢（可在画布中沿线路拖动）">
        <NumberField
          label="单厢载荷"
          value={cabin.payloadKg}
          unit="kg"
          step={50}
          min={0}
          max={5000}
          onChange={(v) => store.setPayload(v)}
        />
        <NumberField label="车厢自重" value={cabin.deadWeightKg} unit="kg" step={50} onChange={(v) => {
          store.setDeadWeight(v);
        }} />
        <label className="field">
          <span>沿线位置 t</span>
          <span className="field-input">
            <input
              type="range"
              min={0.001}
              max={0.999}
              step={0.001}
              value={cabin.t}
              onChange={(e) => store.setCabinT(Number(e.target.value))}
            />
            <em>{cabin.t.toFixed(3)}</em>
          </span>
        </label>
      </Section>

      <Section title={`轮组（${wheels.length}/12，拖轮心调整位置）`}>
        <div className="wheel-toolbar">
          <button disabled={wheels.length >= 12} onClick={() => store.addWheel()}>
            + 添加轮组
          </button>
        </div>
        <div className="wheel-list">
          {wheels.map((w, i) => (
            <WheelRow key={w.id} id={w.id} index={i} />
          ))}
        </div>
      </Section>

      <Section title="接触报警">
        <NumberField
          label="压陷量阈值"
          value={threshold}
          unit="mm"
          step={0.1}
          min={0}
          onChange={(v) => store.setIndentThreshold(v)}
        />
      </Section>

      <Section title="相机">
        <div className="gear-row">
          <button
            className={cameraMode === 'orbit' ? 'gear active wide' : 'gear wide'}
            onClick={() => store.setCameraMode('orbit')}
          >
            自由环绕
          </button>
          <button
            className={cameraMode === 'follow' ? 'gear active wide' : 'gear wide'}
            onClick={() => store.setCameraMode('follow')}
          >
            沿线跟随
          </button>
        </div>
      </Section>

      <div className="panel-actions">
        <button className="primary" onClick={() => store.exportRopeData()}>
          导出绳形数据 (JSON)
        </button>
        <button onClick={() => store.resetAll()}>重置场景</button>
      </div>
    </aside>
  );
}

function WheelRow({ id, index }: { id: string; index: number }) {
  const wheel = useAppState((s) => s.wheels.find((w) => w.id === id)!);
  const contact = useAppState((s) => s.contacts.find((c) => c.wheelId === id) ?? null);
  const threshold = useAppState((s) => s.indentThresholdMm);

  return (
    <div className={`wheel-row ${contact?.overThreshold ? 'alarm' : ''}`}>
      <div className="wheel-row-head">
        <label className="switch">
          <input
            type="checkbox"
            checked={wheel.enabled}
            onChange={(e) => store.setWheelEnabled(id, e.target.checked)}
          />
          <span>#{index + 1}</span>
        </label>
        <span className="wheel-actions">
          <button className="mini" title="轮面刚好接触绳表面" onClick={() => store.snapWheelToRope(id, 0)}>
            贴绳
          </button>
          <button className="mini alarm-btn" title="压入绳表面 3mm（应超 2mm 阈值报警）" onClick={() => store.snapWheelToRope(id, 3)}>
            压入3mm
          </button>
          <button className="mini" onClick={() => store.removeWheel(id)}>
            删除
          </button>
        </span>
      </div>
      {wheel.enabled && (
        <>
          <div className="coord-grid small">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <label key={axis}>
                {axis.toUpperCase()}
                <input
                  type="number"
                  value={Number(wheel.position[axis].toFixed(2))}
                  step={0.25}
                  onChange={(e) =>
                    store.setWheelPosition(id, { [axis]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          <label className="field compact">
            <span>轮半径</span>
            <span className="field-input">
              <input
                type="number"
                value={wheel.radius}
                step={0.01}
                min={0.05}
                onChange={(e) => store.setWheelRadius(id, Number(e.target.value))}
              />
              <em>m</em>
            </span>
          </label>
          <div className="indent-line">
            {contact && contact.contacting ? (
              <>
                <span>压陷量</span>
                <strong className={contact.overThreshold ? 'red' : 'green'}>
                  {(contact.indentation * 1000).toFixed(2)} mm
                </strong>
                {contact.overThreshold && <em className="red">超阈值 {threshold}mm</em>}
              </>
            ) : (
              <span className="muted">未接触（间隙 {(contact ? (-contact.indentation * 1000).toFixed(1) : '—')} mm）</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
