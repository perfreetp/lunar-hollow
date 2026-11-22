<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { AssemblyNode } from '../model/types'
import { ancestorPath, walkTree } from '../model/tree'
import { selectionStore, setSelectedId } from '../store/selection'
import TreeItem from './TreeItem.vue'

const props = defineProps<{
  tree: AssemblyNode
  factorOf: (id: string) => number
  onFocus: (node: AssemblyNode) => void
}>()

const emit = defineEmits<{ (e: 'select', node: AssemblyNode): void }>()

const expanded = ref<Set<string>>(new Set(['car', 'g-body', 'g-chassis', 'g-motor', 'g-gears', 'g-suspension', 'g-wheels']))
const search = ref('')
const scrollEl = ref<HTMLElement | null>(null)
const rowRefs = new Map<string, HTMLElement>()

function toggle(id: string): void {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function select(node: AssemblyNode): void {
  setSelectedId(node.id)
  // 选中内部节点时自动展开一层
  if (node.children.length && !expanded.value.has(node.id)) toggle(node.id)
  emit('select', node)
}

function expandAll(): void {
  const next = new Set<string>()
  walkTree(props.tree, (n) => {
    if (n.children.length) next.add(n.id)
  })
  expanded.value = next
}

function collapseAll(): void {
  expanded.value = new Set(['car'])
}

/** 搜索过滤：命中节点及其祖先都可见 */
function matchFilter(node: AssemblyNode): boolean {
  const q = search.value.trim().toLowerCase()
  if (!q) return true
  if (node.name.toLowerCase().includes(q) || node.id.toLowerCase().includes(q)) return true
  let found = false
  walkTree(node, (n) => {
    if (n.name.toLowerCase().includes(q)) {
      found = true
      return false
    }
  })
  return found
}

// 3D 拾取选中 -> 树展开祖先路径并滚动定位（双向同步的反向链路）
watch(
  () => selectionStore.selectedId,
  async (id) => {
    if (!id) return
    const stack = [props.tree]
    let target: AssemblyNode | null = null
    while (stack.length) {
      const n = stack.pop()!
      if (n.id === id) {
        target = n
        break
      }
      stack.push(...n.children)
    }
    if (!target) return
    const next = new Set(expanded.value)
    for (const a of ancestorPath(target)) {
      if (a.children.length) next.add(a.id)
    }
    expanded.value = next
    await nextTick()
    const el = scrollEl.value?.querySelector<HTMLElement>(`[data-row-id="${id}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  },
)

function setRowRef(el: HTMLElement | null, id: string): void {
  if (el) rowRefs.set(id, el)
}
defineExpose({ setRowRef })
</script>

<template>
  <div class="pane pane-tree">
    <div class="pane-title">装配层级</div>
    <div style="padding: 8px 10px; flex: none">
      <input v-model="search" class="tree-search" placeholder="搜索零件 / 装配体…" />
    </div>
    <div class="tree-toolbar">
      <button class="btn" @click="expandAll">全部展开</button>
      <button class="btn" @click="collapseAll">全部折叠</button>
    </div>
    <div ref="scrollEl" class="tree-scroll">
      <div :ref="(el) => setRowRef(el as HTMLElement, tree.id)" :data-row-id="tree.id">
        <TreeItem
          :node="tree"
          :expanded="expanded"
          :factor-of="factorOf"
          :on-toggle="toggle"
          :on-select="select"
          :on-focus="onFocus"
          :match-filter="matchFilter"
        />
      </div>
    </div>
  </div>
</template>
