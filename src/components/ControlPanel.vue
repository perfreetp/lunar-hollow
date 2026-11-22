<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AssemblyNode } from '../model/types'
import { selectionStore } from '../store/selection'
import { GROUP_NAMES } from '../model/materials'

const props = defineProps<{
  tree: AssemblyNode
  selectedNode: AssemblyNode | null
  factorOf: (id: string) => number
  globalDistance: number
  observeInfo: { part: string; connections: { id: string; label: string; markerType: string }[]; neighbors: number }
  markersVisible: boolean
}>()

const emit = defineEmits<{
  (e: 'set-factor', node: AssemblyNode, factor: number): void
  (e: 'set-global-distance', v: number): void
  (e: 'reset-all'): void
  (e: 'expand-all'): void
  (e: 'enter-observe', axis: 'x' | 'y' | 'z'): void
  (e: 'exit-observe'): void
  (e: 'set-observe-distance', v: number): void
  (e: 'toggle-labels', v: boolean): void
  (e: 'toggle-markers', v: boolean): void
  (e: 'export-state'): void
  (e: 'import-state'): void
}>()

/** 当前选中节点的展开因子（仅内部节点可调） */
const localFactor = ref(0)
watch(
  () => [props.selectedNode?.id, props.selectedNode ? props.factorOf(props.selectedNode.id) : 0],
  ([, f]) => {
    localFactor.value = (f as number) ?? 0
  },
  { immediate: true },
)

function onFactorInput(v: number): void {
  localFactor.value = v
  if (props.selectedNode && props.selectedNode.children.length) {
    emit('set-factor', props.selectedNode, v)
  }
}

const isInternal = computed(() => !!props.selectedNode?.children.length)
const isLeaf = computed(() => !!props.selectedNode && !props.selectedNode.children.length)

const groupName = computed(() => {
  let n = props.selectedNode
  while (n && !n.groupId) n = n.parent
  return n?.groupId ? GROUP_NAMES[n.groupId] : '—'
})

const partDef = computed(() => props.selectedNode?.part ?? null)

const observeAxis = ref<'x' | 'y' | 'z'>(selectionStore.observeAxis)
const observeDistance = ref(selectionStore.observeDistance)

watch(observeAxis, (a) => {
  selectionStore.observeAxis = a
  if (selectionStore.observeId) emit('enter-observe', a)
})
watch(observeDistance, (d) => {
  selectionStore.observeDistance = d
  emit('set-observe-distance', d)
})

const markerTypeColor: Record<string, string> = {
  hole: '#37e0ff',
  shaft: '#ff9f43',
  snap: '#7bed9f',
  bolt: '#ff6b81',
}
const markerTypeName: Record<string, string> = {
  hole: '孔位',
  shaft: '轴位',
  snap: '卡扣',
  bolt: '螺接',
}

function onExport(): void {
  emit('export-state')
}
function onImport(): void {
  emit('import-state')
}

const labelsOn = ref(selectionStore.labelsVisible)
watch(labelsOn, (v) => emit('toggle-labels', v))
const markersOn = ref(props.markersVisible)
watch(markersOn, (v) => emit('toggle-markers', v))

const quickLevels = [0.25, 0.5, 0.75, 1]
</script>

<template>
  <div class="pane pane-panel">
    <div class="pane-title">功能面板</div>
    <div class="panel-scroll">
      <!-- 拆解模块 -->
      <section class="section">
        <h3>逐级拆解 <span class="hint">仅重算当前级子树</span></h3>
        <div class="slider-row">
          <label>平移距离</label>
          <input
            type="range"
            min="0.2"
            max="2.2"
            step="0.05"
            :value="globalDistance"
            @input="emit('set-global-distance', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="val">{{ globalDistance.toFixed(2) }}</span>
        </div>
        <template v-if="selectedNode && isInternal">
          <div class="slider-row">
            <label>展开因子</label>
            <input type="range" min="0" max="1" step="0.01" v-model.number="localFactor" @input="onFactorInput(Number(($event.target as HTMLInputElement).value))" />
            <span class="val">{{ Math.round(localFactor * 100) }}%</span>
          </div>
          <div class="btn-row" style="margin-top: 8px">
            <button
              v-for="lv in quickLevels"
              :key="lv"
              class="btn"
              @click="onFactorInput(lv)"
            >{{ Math.round(lv * 100) }}%</button>
          </div>
        </template>
        <p v-else-if="!selectedNode" style="color: var(--fg-2); margin: 6px 0 0; font-size: 12px">
          在左侧树或模型上选择一个装配体后，可逐级调节其展开程度。
        </p>
        <p v-else style="color: var(--fg-2); margin: 6px 0 0; font-size: 12px">
          当前选中的是单个零件，请选择其父装配体进行逐级展开。
        </p>
        <div class="btn-row" style="margin-top: 10px">
          <button class="btn primary" @click="emit('expand-all')">逐级全展开</button>
          <button class="btn danger" @click="emit('reset-all')">一键回装复位</button>
        </div>
      </section>

      <!-- 观察模块 -->
      <section class="section">
        <h3>单件观察 <span class="hint">沿轴拉出 + 连接点</span></h3>
        <template v-if="isLeaf">
          <div class="axis-tabs">
            <button v-for="a in (['x', 'y', 'z'] as const)" :key="a" :class="{ active: observeAxis === a }" @click="observeAxis = a">
              {{ a === 'x' ? 'X 轴' : a === 'y' ? 'Y 轴' : 'Z 轴' }}
            </button>
          </div>
          <div class="slider-row">
            <label>拉出距离</label>
            <input type="range" min="0" max="2" step="0.02" v-model.number="observeDistance" />
            <span class="val">{{ observeDistance.toFixed(2) }}</span>
          </div>
          <div class="btn-row">
            <button class="btn primary" @click="emit('enter-observe', observeAxis)">拉出查看</button>
            <button class="btn" @click="emit('exit-observe')">放回原位</button>
          </div>
          <ul v-if="observeInfo.connections.length" class="cp-list">
            <li v-for="cp in observeInfo.connections" :key="cp.id">
              <span class="cp-dot" :style="{ background: markerTypeColor[cp.markerType] }"></span>
              <span>{{ cp.label }}</span>
              <span style="flex: 1"></span>
              <span style="color: var(--fg-2); font-size: 11px">{{ markerTypeName[cp.markerType] }}</span>
            </li>
          </ul>
          <p v-else style="color: var(--fg-2); font-size: 12px; margin: 8px 0 0">该零件未定义连接点。</p>
          <p v-if="observeInfo.neighbors" style="color: var(--fg-2); font-size: 11px; margin: 8px 0 0">
            同层相邻零件 {{ observeInfo.neighbors }} 个，虚线表示装配关系。
          </p>
        </template>
        <p v-else style="color: var(--fg-2); margin: 0; font-size: 12px">
          选择一个具体零件后，可沿 X/Y/Z 轴单独拉出查看。
        </p>
      </section>

      <!-- 标签模块 -->
      <section class="section">
        <h3>标注设置</h3>
        <div class="switch-row">
          <span>关键零件名称标注</span>
          <label class="switch">
            <input type="checkbox" v-model="labelsOn" />
            <span class="track"></span>
          </label>
        </div>
        <div class="switch-row">
          <span>连接点 / 装配关系标记</span>
          <label class="switch">
            <input type="checkbox" v-model="markersOn" />
            <span class="track"></span>
          </label>
        </div>
        <p style="color: var(--fg-2); font-size: 11px; margin: 8px 0 0">
          标注随零件位置实时联动，密集区域自动避让不重叠。
        </p>
      </section>

      <!-- 零件信息 -->
      <section class="section">
        <h3>选中对象</h3>
        <dl v-if="selectedNode" class="info-kv">
          <dt>名称</dt>
          <dd>{{ selectedNode.name }}</dd>
          <dt>层级 id</dt>
          <dd style="word-break: break-all">{{ selectedNode.id }}</dd>
          <dt>所属分组</dt>
          <dd>{{ groupName }}</dd>
          <dt>层级深度</dt>
          <dd>第 {{ selectedNode.depth }} 级</dd>
          <dt>下级零件</dt>
          <dd>{{ selectedNode.userData.leafCount ?? (partDef ? 1 : 0) }} 个</dd>
          <template v-if="partDef">
            <dt>拆解方向</dt>
            <dd>({{ partDef.explodeDir.map((n) => n.toFixed(1)).join(', ') }})</dd>
            <dt>单级步距</dt>
            <dd>{{ partDef.explodeStep.toFixed(2) }}</dd>
            <dt>连接点数</dt>
            <dd>{{ partDef.connections.length }}</dd>
          </template>
        </dl>
        <p v-else style="color: var(--fg-2); margin: 0; font-size: 12px">未选中任何对象。</p>
      </section>

      <!-- 导出模块 -->
      <section class="section">
        <h3>状态导出 / 导入</h3>
        <div class="btn-row">
          <button class="btn primary" @click="onExport">导出拆解状态</button>
          <button class="btn" @click="onImport">导入并复原</button>
        </div>
        <p style="color: var(--fg-2); font-size: 11px; margin: 8px 0 0">
          JSON 文件记录各级展开因子、全局距离、单件观察状态及每个零件的位移与世界坐标。
        </p>
      </section>
    </div>
  </div>
</template>
