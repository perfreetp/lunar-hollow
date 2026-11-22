import { useEffect, useState } from 'react';
import { useAppState, store } from '../state/store';
import { TENSION_GEARS } from '../physics/config';

/** 画布底部实时指标条 */
export function StatsBar() {
  const stats = useAppState((s) => s.stats);
  const reason = useAppState((s) => s.lastReason);
  const gearIndex = useAppState((s) => s.gearIndex);
  const contacts = useAppState((s) => s.contacts);
  const alarms = contacts.filter((c) => c.overThreshold).length;

  // 几何耗时为高频非响应式数据，4Hz 轮询即可（人眼足够、不拖慢拖拽帧）
  const [geometryMs, setGeometryMs] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setGeometryMs(store.perf.geometryMs), 250);
    return () => window.clearInterval(id);
  }, []);

  // 误差很小时 ppm 会显示 0.0，改以科学计数法呈现原始比值
  const errText = stats.maxChordArcError > 0 ? stats.maxChordArcError.toExponential(1) : '0';
  const errOk = stats.maxChordArcError < 1e-3;

  return (
    <div className="stats-bar">
      <Stat label="跨数" value={String(stats.spanCount)} />
      <Stat label="中线环段" value={String(stats.ringCount)} />
      <Stat label="总弧长" value={`${stats.totalLength.toFixed(2)} m`} />
      <Stat label="张力 H" value={`${(TENSION_GEARS[gearIndex].H / 1000).toFixed(0)} kN`} />
      <Stat label="平衡迭代" value={`${stats.iterations} 次`} />
      <Stat
        label="最大弦弧误差"
        value={errText}
        tone={errOk ? 'ok' : 'bad'}
        hint={errOk ? '要求 < 1e-3（千分之一）' : '超差!'}
      />
      <Stat label="求解" value={`${stats.solveMs.toFixed(2)} ms`} />
      <Stat label="几何" value={`${geometryMs.toFixed(2)} ms`} />
      <Stat
        label="接触报警"
        value={`${alarms}/${contacts.length}`}
        tone={alarms > 0 ? 'bad' : 'ok'}
      />
      <Stat label="更新来源" value={reasonLabel(reason)} />
    </div>
  );
}

function reasonLabel(r: string): string {
  switch (r) {
    case 'cabin':
      return '车厢（局部重算）';
    case 'support':
      return '支架';
    case 'wheel':
      return '轮组';
    default:
      return '全绳重算';
  }
}

function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'bad';
  hint?: string;
}) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${tone ?? ''}`} title={hint}>
        {value}
      </span>
    </div>
  );
}
