import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EnvMode, FloorPlan, Lamp, LampType, SchemeFile, Vec3 } from './types';
import {
  ambientFor,
  averageFloorIlluminance,
  CCTS,
  computeUGR,
  energyEstimate,
  glareGrade,
  GRADE_LABELS,
  HEAT_GRADIENT_CSS,
  illuminanceAt,
  LAMP_SPECS,
  lampPower,
  LOW_E_THRESHOLD,
} from './photometry';
import { normalizePlan, SAMPLE_LAMPS, SAMPLE_PLAN } from './samplePlan';
import { RoomScene, type SceneCallbacks } from './three/RoomScene';

const GRADE_COLORS = ['', '#27ae60', '#7fb800', '#f1c40f', '#e67e22', '#e74c3c'];
const LAMP_TYPES: LampType[] = ['ceiling', 'wall', 'night'];

export default function App() {
  const [floorPlan, setFloorPlan] = useState<FloorPlan>(SAMPLE_PLAN);
  const [lamps, setLamps] = useState<Lamp[]>(SAMPLE_LAMPS);
  const [mode, setMode] = useState<EnvMode>('day');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placing, setPlacing] = useState<LampType | null>(null);
  const [pick, setPick] = useState<{ point: Vec3; normal: Vec3 } | null>(null);
  const [view, setView] = useState<{ eye: Vec3; dir: Vec3 }>({
    eye: [8, 7, 9],
    dir: [-0.5, -0.5, -0.7],
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RoomScene | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ------------------------- 场景回调（只创建一次） ------------------------- */
  const callbacks = useRef<SceneCallbacks>({
    onLampPlace: (type, pos, normal) => {
      const lamp: Lamp = {
        id: crypto.randomUUID(),
        type,
        position: pos,
        normal,
        cctIndex: 0,
        powerIndex: 1,
      };
      setLamps((ls) => [...ls, lamp]);
      setSelectedId(lamp.id);
    },
    onLampMove: (id, pos, normal) => {
      setLamps((ls) => ls.map((l) => (l.id === id ? { ...l, position: pos, normal } : l)));
    },
    onLampSelect: (id) => setSelectedId(id),
    onPick: (point, normal) => setPick({ point, normal }),
    onView: (eye, dir) => setView({ eye, dir }),
  });

  useEffect(() => {
    const scene = new RoomScene(containerRef.current!, callbacks.current);
    sceneRef.current = scene;
    scene.setFloorPlan(floorPlan);
    scene.syncLamps(lamps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => scene.dispose();
  }, []);

  useEffect(() => {
    sceneRef.current?.setFloorPlan(floorPlan);
  }, [floorPlan]);
  useEffect(() => {
    sceneRef.current?.syncLamps(lamps);
  }, [lamps]);
  useEffect(() => {
    sceneRef.current?.setMode(mode);
  }, [mode]);
  useEffect(() => {
    sceneRef.current?.setPlacing(placing);
  }, [placing]);
  useEffect(() => {
    sceneRef.current?.setSelected(selectedId);
  }, [selectedId, lamps]);

  /* ------------------------- 派生数据（同步重算） ------------------------- */
  const ambient = ambientFor(mode);
  const avgE = useMemo(
    () => averageFloorIlluminance(floorPlan, lamps, ambient),
    [floorPlan, lamps, ambient],
  );
  const ugr = useMemo(() => {
    const lb = (avgE * 0.5) / Math.PI;
    return computeUGR(lamps, view.eye, view.dir, lb);
  }, [lamps, view, avgE]);
  const grade = glareGrade(ugr);
  const energy = useMemo(() => energyEstimate(lamps), [lamps]);
  const pickE = useMemo(
    () =>
      pick
        ? illuminanceAt(
            pick.point[0], pick.point[1], pick.point[2],
            pick.normal[0], pick.normal[1], pick.normal[2],
            lamps, ambient,
          )
        : null,
    [pick, lamps, ambient],
  );

  const selected = lamps.find((l) => l.id === selectedId) ?? null;

  const updateLamp = (id: string, patch: Partial<Lamp>) =>
    setLamps((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const deleteLamp = (id: string) => {
    setLamps((ls) => ls.filter((l) => l.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  };

  // Esc 取消放置 / 选择；Delete 删除选中灯具
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlacing(null);
        setSelectedId(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        deleteLamp(selectedId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  /* ------------------------------ 导入 / 导出 ------------------------------ */
  const exportScheme = useCallback(() => {
    const scheme: SchemeFile = {
      app: 'senior-light-renderer',
      version: 1,
      savedAt: new Date().toISOString(),
      floorPlan,
      mode,
      lamps,
    };
    const blob = new Blob([JSON.stringify(scheme, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `适老照明方案-${floorPlan.name ?? '未命名'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [floorPlan, mode, lamps]);

  const importFile = useCallback(async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (data && data.app === 'senior-light-renderer') {
        // 完整方案文件
        const plan = normalizePlan(data.floorPlan);
        setFloorPlan(plan);
        setLamps(Array.isArray(data.lamps) ? data.lamps : []);
        setMode(data.mode === 'night' ? 'night' : 'day');
        setSelectedId(null);
        setPick(null);
      } else if (data && Array.isArray(data.outline)) {
        // 纯户型文件
        setFloorPlan(normalizePlan(data));
        setLamps([]);
        setSelectedId(null);
        setPick(null);
      } else {
        window.alert('无法识别的文件：需要方案文件或含 outline 的户型文件');
      }
    } catch (err) {
      window.alert(`导入失败：${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  /* --------------------------------- UI --------------------------------- */
  return (
    <div className="app">
      <aside className="panel">
        <h1>适老光环境渲染器</h1>

        <section>
          <h2>户型</h2>
          <div className="row">
            <button onClick={() => fileRef.current?.click()}>导入户型 / 方案</button>
            <button onClick={exportScheme}>导出方案</button>
          </div>
          <div className="row">
            <button
              className="ghost"
              onClick={() => {
                setFloorPlan(SAMPLE_PLAN);
                setLamps(SAMPLE_LAMPS);
              }}
            >
              载入示例
            </button>
            <button className="ghost" onClick={() => setLamps([])}>
              清空灯具
            </button>
          </div>
          <p className="meta">
            {floorPlan.name ?? '未命名'} · 层高 {floorPlan.height.toFixed(1)}m · {floorPlan.outline.length} 边
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = '';
            }}
          />
        </section>

        <section>
          <h2>环境光预设</h2>
          <div className="segmented">
            <button className={mode === 'day' ? 'active' : ''} onClick={() => setMode('day')}>
              ☀ 白天
            </button>
            <button className={mode === 'night' ? 'active' : ''} onClick={() => setMode('night')}>
              ☾ 夜间
            </button>
          </div>
          <p className="meta">夜间模式自动压低环境光，并突出夜灯路径。</p>
        </section>

        <section>
          <h2>放置灯具</h2>
          <div className="palette">
            {LAMP_TYPES.map((t) => (
              <button
                key={t}
                className={placing === t ? 'active' : ''}
                onClick={() => setPlacing((p) => (p === t ? null : t))}
              >
                {LAMP_SPECS[t].label}
              </button>
            ))}
          </div>
          <p className="meta">
            {placing
              ? `正在放置「${LAMP_SPECS[placing].label}」：在${placing === 'wall' ? '墙面' : '地面'}上点击放置，可连续放置，Esc 结束。`
              : '点击上方按钮后在房间内放置；拖动已有灯具可移动位置。'}
          </p>
        </section>

        {selected && (
          <section className="selected">
            <h2>选中：{LAMP_SPECS[selected.type].label}</h2>
            <label>色温（3 档）</label>
            <div className="segmented">
              {CCTS.map((cct, i) => (
                <button
                  key={cct}
                  className={selected.cctIndex === i ? 'active' : ''}
                  onClick={() => updateLamp(selected.id, { cctIndex: i })}
                >
                  {cct}K
                </button>
              ))}
            </div>
            <label>功率（2 档）</label>
            <div className="segmented">
              {LAMP_SPECS[selected.type].powers.map((p, i) => (
                <button
                  key={p}
                  className={selected.powerIndex === i ? 'active' : ''}
                  onClick={() => updateLamp(selected.id, { powerIndex: i })}
                >
                  {i === 0 ? '低' : '高'} · {p}W
                </button>
              ))}
            </div>
            <button className="danger" onClick={() => deleteLamp(selected.id)}>
              删除灯具
            </button>
          </section>
        )}

        <section>
          <h2>实时计算</h2>
          <dl className="stats">
            <dt>灯具数量</dt>
            <dd>{lamps.length} 个</dd>
            <dt>总功率 / 能耗</dt>
            <dd>
              {energy.totalW.toFixed(1)} W · {energy.kwhDay.toFixed(2)} kWh/天 ·{' '}
              {energy.kwhMonth.toFixed(1)} kWh/月
            </dd>
            <dt>地面平均照度</dt>
            <dd className={avgE < LOW_E_THRESHOLD ? 'warn' : ''}>{avgE.toFixed(0)} lx</dd>
            <dt>统一眩光值 UGR</dt>
            <dd>
              {ugr.toFixed(1)}{' '}
              <span className="grade" style={{ background: GRADE_COLORS[grade] }}>
                {GRADE_LABELS[grade]}
              </span>
            </dd>
            <dt>点击点照度</dt>
            <dd>
              {pick && pickE !== null ? (
                <>
                  <span className={pickE < LOW_E_THRESHOLD ? 'warn' : ''}>{pickE.toFixed(0)} lx</span>
                  <span className="meta">
                    {' '}
                    @({pick.point[0].toFixed(2)}, {pick.point[1].toFixed(2)}, {pick.point[2].toFixed(2)})
                    {pickE < LOW_E_THRESHOLD ? ' · 低于 150lx 适老建议值' : ''}
                  </span>
                </>
              ) : (
                <span className="meta">点击地面 / 墙面读取</span>
              )}
            </dd>
          </dl>
        </section>

        <section>
          <h2>照度图例</h2>
          <div className="legend" style={{ background: HEAT_GRADIENT_CSS }} />
          <div className="legend-ticks">
            <span>0</span>
            <span style={{ left: '11%' }}>1</span>
            <span style={{ left: '39%' }}>10</span>
            <span style={{ left: '63%' }}>50</span>
            <span style={{ left: '81%' }}>150</span>
            <span style={{ right: 0 }}>500 lx</span>
          </div>
          <p className="meta">
            <span className="hatch-demo" /> 斜线区域 = 照度低于 {LOW_E_THRESHOLD}lx
          </p>
        </section>
      </aside>

      <div className="viewport" ref={containerRef}>
        <div className="hint">
          左键拖动旋转 · 滚轮缩放 · 右键平移 · 拖动灯具移动 · 点击表面读照度
        </div>
      </div>
    </div>
  );
}
