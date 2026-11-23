<template>
  <div class="config-page">
    <div class="left">
      <SceneView />
    </div>
    <div class="right scroll">
      <div class="panel">
        <h3>闸室与引航道</h3>
        <label class="field">闸室长度 (m)<input type="number" v-model.number="store.config.chamberLength" min="50" step="10" /></label>
        <label class="field">闸室宽度 (m)<input type="number" v-model.number="store.config.chamberWidth" min="10" step="1" /></label>
        <label class="field">引航道长度 (m)<input type="number" v-model.number="store.config.approachLength" min="100" step="50" /></label>
        <label class="field">引航道宽度 (m)<input type="number" v-model.number="store.config.approachWidth" min="15" step="5" /></label>
        <label class="field">过闸方向
          <select v-model="store.config.direction">
            <option value="down">下行(上游 → 下游)</option>
            <option value="up">上行(下游 → 上游)</option>
          </select>
        </label>
      </div>

      <div class="panel">
        <h3>水位与闸门</h3>
        <label class="field">上游水位 (m)<input type="number" v-model.number="store.config.upstreamLevel" step="0.5" /></label>
        <label class="field">下游水位 (m)<input type="number" v-model.number="store.config.downstreamLevel" step="0.5" /></label>
        <label class="field">水位升降速率 (m/s)<input type="number" v-model.number="store.config.waterRate" min="0.01" step="0.01" /></label>
        <label class="field">闸门最大开度 (°)<input type="number" v-model.number="store.config.gateMaxAngle" min="30" max="90" step="5" /></label>
        <label class="field">档位角度 (°/档)<input type="number" v-model.number="store.config.gateStepAngle" min="1" step="1" /></label>
        <label class="field">档位耗时 (s/档)<input type="number" v-model.number="store.config.gateStepInterval" min="0.1" step="0.1" /></label>
      </div>

      <div class="panel">
        <h3>运行参数</h3>
        <label class="field">闸区限速 (m/s)<input type="number" v-model.number="store.config.cruiseSpeedCap" min="0.5" step="0.1" /></label>
        <label class="field">泊船间距 (m)<input type="number" v-model.number="store.config.berthGap" min="2" step="1" /></label>
        <label class="field">排队间距 (m)<input type="number" v-model.number="store.config.queueGap" min="5" step="5" /></label>
        <label class="field">距闸门安全距离 (m)<input type="number" v-model.number="store.config.endMargin" min="5" step="1" /></label>
      </div>

      <div class="panel">
        <h3>
          船舶列表(共 {{ store.ships.length }} 艘)
          <span class="actions">
            <button class="ghost" @click="addShip">添加船舶</button>
            <button class="ghost" @click="regen">生成 20 艘示例</button>
          </span>
        </h3>
        <div class="ship-table scroll">
          <table class="data">
            <thead>
              <tr><th>船名</th><th>船长m</th><th>船宽m</th><th>顺序</th><th>速度m/s</th><th>吃水m</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in store.ships" :key="s.id">
                <td><input class="name" type="text" v-model="s.name" /></td>
                <td><input type="number" v-model.number="s.length" min="10" step="1" /></td>
                <td><input type="number" v-model.number="s.width" min="3" step="0.5" /></td>
                <td><input type="number" v-model.number="s.order" min="1" step="1" /></td>
                <td><input type="number" v-model.number="s.speed" min="0.5" step="0.1" /></td>
                <td><input type="number" v-model.number="s.draft" min="0.5" step="0.1" /></td>
                <td><button class="ghost mini" @click="store.ships.splice(i, 1)">删</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel" v-if="warnings.length">
        <h3>配置校验</h3>
        <div v-for="(w, i) in warnings" :key="i" class="warn-line">⚠ {{ w }}</div>
      </div>

      <div class="panel go">
        <button :disabled="store.running" @click="go">开始仿真 →</button>
        <span class="hint">配置自动保存在浏览器中</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import SceneView from '../components/SceneView.vue';
import { store, runSimulation, generateShips } from '../store';
import { validateConfig } from '../sim/simulate';

const router = useRouter();
const warnings = computed(() => validateConfig(store.config, store.ships));

function addShip() {
  const n = store.ships.length + 1;
  store.ships.push({
    id: `ship-${Date.now() % 100000}`,
    name: `船舶 ${String(n).padStart(2, '0')}`,
    length: 60, width: 11, order: n, speed: 2, draft: 2.5,
  });
}

function regen() {
  store.ships = generateShips(20);
}

function go() {
  runSimulation();
  router.push('/control');
}
</script>

<style scoped>
.config-page {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 12px;
  height: 100%;
}
.left { min-height: 0; }
.right { display: flex; flex-direction: column; gap: 10px; padding-right: 2px; }
.actions { float: right; display: flex; gap: 6px; }
.actions button { padding: 3px 10px; font-size: 12px; }
.ship-table { max-height: 300px; }
button.mini { padding: 1px 7px; font-size: 11px; }
.warn-line { color: var(--warn); font-size: 12.5px; margin-bottom: 4px; }
.go { display: flex; align-items: center; gap: 12px; }
.hint { font-size: 12px; color: var(--muted); }
</style>
