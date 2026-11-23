<template>
  <div class="export-page" v-if="store.result">
    <div class="col">
      <div class="panel">
        <h3>仿真概要</h3>
        <div class="stat"><span>仿真完成</span><b :class="store.result.completed ? 'ok' : 'danger'">{{ store.result.completed ? '是' : '否(达到时长上限)' }}</b></div>
        <div class="stat"><span>总时长</span><b>{{ fmtDur(store.result.duration) }}</b></div>
        <div class="stat"><span>闸次数</span><b>{{ store.result.batches.length }}</b></div>
        <div class="stat"><span>船舶数</span><b>{{ store.result.ships.length }}</b></div>
        <div class="stat"><span>碰撞次数</span><b :class="{ danger: store.result.collisions > 0 }">{{ store.result.collisions }}</b></div>
        <div class="stat"><span>轨迹帧数</span><b>{{ store.result.frameCount }} 帧 @ {{ store.result.recordDt }}s</b></div>
        <div class="stat"><span>平均过闸时间</span><b>{{ avgTransit }}</b></div>
      </div>

      <div class="panel">
        <h3>导出</h3>
        <p class="hint">导出内容:场景配置、船舶参数、闸次划分、事件日志与全部轨迹帧(时间、水位、闸门角度、每船位置/速度/状态)。</p>
        <div class="btns">
          <button @click="exportJson">导出轨迹 JSON</button>
          <button class="ghost" @click="exportEventsJson">仅导出事件 JSON</button>
        </div>
        <p class="hint">数据已保存在浏览器(localStorage + IndexedDB),刷新页面后自动恢复。</p>
        <button class="danger" @click="clearAll">清除本地数据</button>
      </div>

      <div class="panel">
        <h3>事件日志({{ store.result.events.length }} 条)</h3>
        <div class="events scroll">
          <div v-for="(e, i) in store.result.events" :key="i" class="event" :class="e.type">
            <span class="t">{{ fmt(e.t) }}</span><span>{{ e.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="col">
      <div class="panel">
        <h3>各船过闸时间</h3>
        <table class="data">
          <thead><tr><th>船名</th><th>闸次</th><th>进闸</th><th>停靠</th><th>出闸</th><th>完成</th><th>耗时</th></tr></thead>
          <tbody>
            <tr v-for="row in shipRows" :key="row.id">
              <td>{{ row.name }}</td>
              <td>{{ row.batch }}</td>
              <td>{{ fmt(row.enter) }}</td>
              <td>{{ fmt(row.dock) }}</td>
              <td>{{ fmt(row.exit) }}</td>
              <td>{{ fmt(row.done) }}</td>
              <td>{{ row.done >= 0 && row.enter >= 0 ? fmtDur(row.done - row.enter) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="empty panel" v-else>
    <h3>暂无仿真数据</h3>
    <p>请先到「过闸流程控制」运行仿真。</p>
    <button @click="$router.push('/control')">前往流程控制</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { store, clearAllLocalData } from '../store';
import { downloadJson } from '../utils/download';

interface ShipRow { id: string; name: string; batch: number; enter: number; dock: number; exit: number; done: number }

const shipRows = computed<ShipRow[]>(() => {
  const r = store.result;
  if (!r) return [];
  return r.ships.map((s, i) => {
    const row: ShipRow = { id: s.id, name: s.name, batch: -1, enter: -1, dock: -1, exit: -1, done: -1 };
    r.batches.forEach((b, bi) => { if (b.includes(i)) row.batch = bi + 1; });
    for (const e of r.events) {
      if (e.shipId !== s.id) continue;
      if (e.type === 'release' && row.enter < 0) row.enter = e.t;
      else if (e.type === 'dock' && row.dock < 0) row.dock = e.t;
      else if (e.type === 'exit' && row.exit < 0) row.exit = e.t;
      else if (e.type === 'done' && row.done < 0) row.done = e.t;
    }
    return row;
  });
});

const avgTransit = computed(() => {
  const rows = shipRows.value.filter((r) => r.enter >= 0 && r.done >= 0);
  if (!rows.length) return '—';
  const avg = rows.reduce((a, r) => a + (r.done - r.enter), 0) / rows.length;
  return fmtDur(avg);
});

function exportJson() {
  const r = store.result!;
  const rounded = new Array<number>(r.data.length);
  for (let i = 0; i < r.data.length; i++) rounded[i] = Math.round(r.data[i] * 1000) / 1000;
  downloadJson(`ship-lock-trajectory-${stamp()}.json`, {
    meta: {
      exportedAt: new Date().toISOString(),
      createdAt: r.createdAt,
      duration: r.duration,
      recordDt: r.recordDt,
      frameCount: r.frameCount,
      stride: r.stride,
      frameFields: ['t', 'water', 'upGateDeg', 'downGateDeg', 'phase'],
      shipFields: ['x', 'z', 'v', 'state'],
      shipStates: ['queued', 'entering', 'docked', 'exiting', 'done'],
      phases: ['idle', 'prepare', 'open_entry', 'enter', 'close_entry', 'adjust', 'open_exit', 'exit', 'close_exit', 'done'],
      collisions: r.collisions,
      completed: r.completed,
    },
    config: r.config,
    ships: r.ships,
    batches: r.batches,
    events: r.events,
    frames: rounded,
  });
}

function exportEventsJson() {
  const r = store.result!;
  downloadJson(`ship-lock-events-${stamp()}.json`, {
    exportedAt: new Date().toISOString(),
    config: r.config,
    events: r.events,
  });
}

async function clearAll() {
  await clearAllLocalData();
  location.reload();
}

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function fmt(t: number) {
  if (t < 0) return '—';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function fmtDur(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.round(t % 60);
  return `${m}分${String(s).padStart(2, '0')}秒`;
}
</script>

<style scoped>
.export-page { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
.col { display: flex; flex-direction: column; gap: 12px; }
.stat { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
.stat span { color: var(--muted); }
.stat b.ok { color: var(--ok); }
.stat b.danger { color: var(--danger); }
.hint { color: var(--muted); font-size: 12.5px; }
.btns { display: flex; gap: 8px; margin-bottom: 8px; }
.events { max-height: 260px; display: flex; flex-direction: column; gap: 2px; }
.event { font-size: 12.5px; display: flex; gap: 8px; }
.event .t { color: var(--muted); font-variant-numeric: tabular-nums; flex: none; }
.event.collision { color: var(--danger); }
.event.phase { color: #8be89b; }
.empty { max-width: 420px; margin: 60px auto; text-align: center; }
.empty p { color: var(--muted); }
</style>
