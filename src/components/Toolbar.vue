<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '../store/useStore'
import { formatTime } from '../utils'

const store = useStore()
const modelInput = ref<HTMLInputElement | null>(null)
const configInput = ref<HTMLInputElement | null>(null)
const showProjects = ref(false)
const projectName = ref('')

async function onModelPick(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await store.importModel(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function onConfigPick(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await store.importConfig(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function saveProject(): Promise<void> {
  await store.saveNamedProject(projectName.value.trim() || `彩画项目 ${new Date().toLocaleString('zh-CN')}`)
  projectName.value = ''
  await store.refreshProjectList()
}
</script>

<template>
  <header class="toolbar panel">
    <div class="brand">
      <span class="brand-mark">彩</span>
      <div class="brand-text">
        <strong>古建彩画褪色模拟与修复预览</strong>
        <small>Caihua Fade Studio · 分层混合 / 局部修复 / 配置分享</small>
      </div>
    </div>

    <div class="tool-group">
      <button :class="{ active: store.state.tool === 'orbit' }" @click="store.setTool('orbit')" title="轨道控制（旋转/缩放/平移）">
        ◎ 轨道
      </button>
      <button :class="{ active: store.state.tool === 'brush' }" @click="store.setTool('brush')" title="修复笔刷（快捷键 B）">
        ✎ 修复笔刷
      </button>
    </div>

    <div class="tool-group">
      <button @click="modelInput?.click()">📦 导入模型</button>
      <button @click="configInput?.click()">↥ 导入配置</button>
      <button @click="store.exportConfig()">↧ 导出配置</button>
      <button class="primary" @click="store.exportScreenshot()">📷 导出截图</button>
    </div>

    <div class="tool-group project-box">
      <button @click="showProjects = !showProjects">🗂 本地项目</button>
      <div v-if="showProjects" class="project-pop panel" @mouseleave="showProjects = false">
        <div class="save-row">
          <input v-model="projectName" type="text" placeholder="项目名称（可选）" @keyup.enter="saveProject" />
          <button class="primary" @click="saveProject">保存</button>
        </div>
        <p class="pop-hint">项目与缩略图存储于浏览器 IndexedDB，并每 1.5 秒自动保存当前状态</p>
        <div v-if="!store.state.projects.length" class="empty">暂无已保存项目</div>
        <div v-for="p in store.state.projects" :key="p.key" class="project-item">
          <img v-if="p.thumbnail" :src="p.thumbnail" alt="缩略图" />
          <div class="project-meta">
            <strong>{{ p.name }}</strong>
            <small>{{ formatTime(p.savedAt) }} · {{ p.components.length }} 构件</small>
            <div class="project-actions">
              <button @click="store.openProject(p.key); showProjects = false">打开</button>
              <button @click="store.deleteProject(p.key)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <input ref="modelInput" type="file" accept=".glb,.gltf" hidden @change="onModelPick" />
    <input ref="configInput" type="file" accept=".json" hidden @change="onConfigPick" />
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 10px 10px 0;
  padding: 8px 14px;
  border-radius: 10px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: linear-gradient(145deg, #c0564a, #8e352c);
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: 700;
  color: #f6e6c3;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.brand-text small {
  color: var(--text-dim);
  font-size: 11px;
}

.tool-group {
  display: flex;
  gap: 6px;
  padding-left: 14px;
  border-left: 1px solid var(--border);
  position: relative;
}

.project-box {
  margin-left: auto;
}

.project-pop {
  position: absolute;
  top: 42px;
  right: 0;
  width: 330px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 12px;
  z-index: 100;
}

.save-row {
  display: flex;
  gap: 6px;
}

.save-row input {
  flex: 1;
  min-width: 0;
}

.pop-hint {
  color: var(--text-dim);
  font-size: 11px;
  margin: 8px 0;
  line-height: 1.5;
}

.empty {
  color: var(--text-dim);
  text-align: center;
  padding: 16px 0;
}

.project-item {
  display: flex;
  gap: 10px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  background: var(--panel-2);
}

.project-item img {
  width: 84px;
  height: 52px;
  object-fit: cover;
  border-radius: 5px;
  border: 1px solid var(--border);
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.project-meta small {
  color: var(--text-dim);
}

.project-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.project-actions button {
  padding: 3px 10px;
  font-size: 11.5px;
}
</style>
