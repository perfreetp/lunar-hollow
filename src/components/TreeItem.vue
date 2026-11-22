<script setup lang="ts">
import { computed } from 'vue'
import type { AssemblyNode } from '../model/types'
import { GROUP_COLORS } from '../model/materials'
import { selectionStore } from '../store/selection'

const props = defineProps<{
  node: AssemblyNode
  expanded: Set<string>
  factorOf: (id: string) => number
  onToggle: (id: string) => void
  onSelect: (node: AssemblyNode) => void
  onFocus: (node: AssemblyNode) => void
  matchFilter: (node: AssemblyNode) => boolean
}>()

const isLeaf = computed(() => props.node.children.length === 0)
const isOpen = computed(() => props.expanded.has(props.node.id))
const isSelected = computed(() => selectionStore.selectedId === props.node.id)
const isHover = computed(() => selectionStore.hoverId === props.node.id)
const factor = computed(() => props.factorOf(props.node.id))
const color = computed(() => {
  let n: AssemblyNode | null = props.node
  while (n && !n.groupId) n = n.parent
  return n?.groupId ? `#${GROUP_COLORS[n.groupId].toString(16).padStart(6, '0')}` : '#5ec9ff'
})
const visible = computed(() => props.matchFilter(props.node))
</script>

<template>
  <div v-if="visible" class="tree-node">
    <div
      class="tree-row"
      :class="{ selected: isSelected, hover: isHover }"
      :style="{ paddingLeft: 8 + node.depth * 14 + 'px' }"
      :data-row-id="node.id"
      @click="onSelect(node)"
      @dblclick.stop="onFocus(node)"
      @mouseenter="selectionStore.hoverId = node.id"
      @mouseleave="selectionStore.hoverId = null"
    >
      <span class="twisty" :class="{ open: isOpen, leaf: isLeaf }" @click.stop="!isLeaf && onToggle(node.id)">▶</span>
      <span class="node-icon" :style="{ background: color }"></span>
      <span class="node-name">{{ node.name }}</span>
      <span v-if="factor > 0" class="factor-badge">{{ Math.round(factor * 100) }}%</span>
      <span v-else-if="!isLeaf" class="node-count">{{ node.userData.leafCount }}</span>
    </div>
    <div v-if="!isLeaf && isOpen">
      <TreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :expanded="expanded"
        :factor-of="factorOf"
        :on-toggle="onToggle"
        :on-select="onSelect"
        :on-focus="onFocus"
        :match-filter="matchFilter"
      />
    </div>
  </div>
</template>
