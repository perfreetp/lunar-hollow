<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '../store/useStore'
import type { SceneComponent } from '../types'

const store = useStore()
const collapsed = ref<Record<string, boolean>>({})

// 滑块值直接从材质 uniform 派生；依赖 fadeVersion，全局/分组/构件任一变更均刷新
const groupFade = computed<Record<string, number>>(() => {
  void store.fadeVersion.value
  const out: Record<string, number> = {}
  for (const g of store.groups.value) out[g.group] = Math.round(store.getGroupAverageFade(g.group))
  return out
})

const compFade = computed<Record<string, number>>(() => {
  void store.fadeVersion.value
  const out: Record<string, number> = {}
  for (const c of store.components.value) out[c.id] = Math.round(store.getComponentFade(c.id))
  return out
})

function onGroupFade(group: string, v: number): void {
  store.setGroupFade(group, v)
}

function onCompFade(comp: SceneComponent, v: number): void {
  store.setComponentFade(comp.id, v)
}

function toggle(group: string): void {
  collapsed.value[group] = !collapsed.value[group]
}

const texInputs = ref<Record<string, HTMLInputElement | null>>({})
const texTarget = ref<{ compId: string; kind: 'surface' | 'base' | 'fadeMask' } | null>(null)

function pickTexture(compId: string, kind: 'surface' | 'base' | 'fadeMask'): void {
  texTarget.value = { compId, kind }
  const key = `${compId}-${kind}`
  texInputs.value[key]?.click()
}

async function onTexPicked(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file && texTarget.value) {
    await store.bindTexture(texTarget.value.compId, texTarget.value.kind, file)
  }
  ;(e.target as HTMLInputElement).value = ''
  texTarget.value = null
}
</script>

<template>
  <aside class="component-panel panel">
    <h3 class="section-title">构件分组（{{ store.components.value.length }}）</h3>

    <div v-for="g in store.groups.value" :key="g.group" class="group-block">
      <div class="group-head" @click="toggle(g.group)">
        <span class="caret">{{ collapsed[g.group] ? '▸' : '▾' }}</span>
        <strong>{{ g.group }}</strong>
        <span class="count">{{ g.ids.length }}</span>
      </div>

      <div class="group-fade">
        <div class="slider-label">
          <span>组内批量褪色</span>
          <b>{{ groupFade[g.group] ?? 0 }}%</b>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          :value="groupFade[g.group] ?? 0"
          @input="onGroupFade(g.group, Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <div v-show="!collapsed[g.group]" class="comp-list">
        <div
          v-for="comp in store.components.value.filter((c) => c.group === g.group)"
          :key="comp.id"
          class="comp-item"
          :class="{ selected: store.state.selectedId === comp.id }"
          @click="store.selectComponent(store.state.selectedId === comp.id ? null : comp.id)"
        >
          <div class="comp-name" :title="comp.id">{{ comp.name }}</div>
          <div class="comp-fade" @click.stop>
            <input
              type="range"
              min="0"
              max="100"
              :value="compFade[comp.id] ?? 0"
              @input="onCompFade(comp, Number(($event.target as HTMLInputElement).value))"
            />
            <span>{{ compFade[comp.id] ?? 0 }}%</span>
          </div>
          <div class="tex-row" @click.stop>
            <button title="绑定表层颜料纹理" @click="pickTexture(comp.id, 'surface')">表层</button>
            <button title="绑定底层纹样纹理" @click="pickTexture(comp.id, 'base')">底层</button>
            <button title="绑定褪色遮罩纹理" @click="pickTexture(comp.id, 'fadeMask')">遮罩</button>
            <button title="清除该构件修复区域" @click="store.clearRestore(comp.id)">清修复</button>
          </div>
          <input
            :ref="(el) => (texInputs[`${comp.id}-surface`] = el as HTMLInputElement | null)"
            type="file"
            accept="image/*"
            hidden
            @change="onTexPicked"
          />
          <input
            :ref="(el) => (texInputs[`${comp.id}-base`] = el as HTMLInputElement | null)"
            type="file"
            accept="image/*"
            hidden
            @change="onTexPicked"
          />
          <input
            :ref="(el) => (texInputs[`${comp.id}-fadeMask`] = el as HTMLInputElement | null)"
            type="file"
            accept="image/*"
            hidden
            @change="onTexPicked"
          />
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.component-panel {
  width: 286px;
  flex-shrink: 0;
  padding: 14px;
  overflow-y: auto;
}

.group-block {
  margin-bottom: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--panel-2);
}

.group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  cursor: pointer;
  user-select: none;
  background: rgba(212, 168, 75, 0.08);
}

.group-head:hover {
  background: rgba(212, 168, 75, 0.15);
}

.caret {
  color: var(--accent);
  width: 10px;
}

.count {
  margin-left: auto;
  background: var(--border);
  border-radius: 99px;
  padding: 1px 8px;
  font-size: 11px;
  color: var(--text-dim);
}

.group-fade {
  padding: 8px 10px 4px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  color: var(--text-dim);
  font-size: 11.5px;
  margin-bottom: 2px;
}

.slider-label b {
  color: var(--accent-2);
}

.comp-list {
  padding: 4px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comp-item {
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 7px 8px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.18);
  transition: border-color 0.12s, background 0.12s;
}

.comp-item:hover {
  border-color: var(--border);
}

.comp-item.selected {
  border-color: var(--accent);
  background: rgba(212, 168, 75, 0.12);
}

.comp-name {
  font-size: 12.5px;
  margin-bottom: 4px;
}

.comp-fade {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comp-fade input {
  flex: 1;
  min-width: 0;
}

.comp-fade span {
  width: 38px;
  text-align: right;
  color: var(--text-dim);
  font-size: 11.5px;
}

.tex-row {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.tex-row button {
  padding: 2px 7px;
  font-size: 11px;
}
</style>
