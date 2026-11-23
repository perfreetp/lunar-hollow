<template>
  <div class="app">
    <header class="topbar">
      <div class="title">船闸船舶过闸轨迹仿真</div>
      <nav class="nav">
        <RouterLink to="/config">场景与船舶配置</RouterLink>
        <RouterLink to="/control">过闸流程控制</RouterLink>
        <RouterLink to="/replay">时间轴回放</RouterLink>
        <RouterLink to="/export">仿真结果导出</RouterLink>
      </nav>
      <div class="meta">
        <span v-if="store.engineLabel" class="engine">{{ store.engineLabel }}</span>
        <span v-if="store.result" class="has-result">已仿真 {{ fmtDur(store.result.duration) }}</span>
      </div>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { store } from './store';

function fmtDur(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.round(t % 60);
  return `${m}分${String(s).padStart(2, '0')}秒`;
}
</script>

<style scoped>
.app { display: flex; flex-direction: column; height: 100vh; }
.topbar {
  display: flex; align-items: center; gap: 24px;
  padding: 0 16px; height: 48px; flex: none;
  background: #10151d; border-bottom: 1px solid #232c3a;
}
.title { font-weight: 600; color: #e8f0fa; white-space: nowrap; }
.nav { display: flex; gap: 4px; flex: 1; }
.nav a {
  color: #93a4bb; text-decoration: none; font-size: 14px;
  padding: 6px 12px; border-radius: 6px;
}
.nav a:hover { background: #1a2230; color: #cfe0f5; }
.nav a.router-link-active { background: #1f4e79; color: #fff; }
.meta { display: flex; gap: 8px; font-size: 12px; color: #7c8ea6; }
.engine { color: #9fd3ff; }
.has-result { color: #8be89b; }
.main { flex: 1; min-height: 0; padding: 12px; overflow: auto; }
</style>
