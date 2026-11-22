import { ModelLoader } from '../src/model/ModelLoader'
import { ExplodeEngine } from '../src/three/ExplodeEngine'
import { walkTree } from '../src/model/tree'

const model = await new ModelLoader().loadProgrammatic()
const engine = new ExplodeEngine(model)
engine.recomputeAll()

// 1. 全量重算耗时
const t0 = performance.now()
for (let i = 0; i < 100; i++) engine.recomputeAll()
const recomputeMs = (performance.now() - t0) / 100
console.log(`全量重算（316 零件）平均耗时: ${recomputeMs.toFixed(3)} ms`)

// 2. 单子树重算耗时（模拟逐级展开某一级）
const internal: string[] = []
walkTree(model.tree, (n) => {
  if (n.children.length) internal.push(n.id)
})
const { findNode } = await import('../src/model/tree')
const chassis = findNode(model.tree, 'g-chassis')!
const t1 = performance.now()
for (let i = 0; i < 100; i++) {
  engine.setFactor(chassis, (i % 100) / 100)
  engine.update(0.016)
}
const subtreeMs = (performance.now() - t1) / 100
console.log(`单级展开（底盘 92 零件子树）平均耗时: ${subtreeMs.toFixed(3)} ms`)

// 3. 每帧 update 开销（含 316 零件 lerp + 位置写入）
engine.expandAll(1)
const t2 = performance.now()
for (let i = 0; i < 300; i++) engine.update(0.016)
const frameMs = (performance.now() - t2) / 300
console.log(`每帧 update（316 零件动画中）平均耗时: ${frameMs.toFixed(3)} ms`)

// 4. 静止后的 update 开销（位置写入应被跳过）
for (let i = 0; i < 300; i++) engine.update(0.016)
const t3 = performance.now()
for (let i = 0; i < 300; i++) engine.update(0.016)
const idleMs = (performance.now() - t3) / 300
console.log(`静止后每帧 update 平均耗时: ${idleMs.toFixed(3)} ms`)

// 5. 序列化耗时
const t4 = performance.now()
for (let i = 0; i < 20; i++) engine.serialize(null, 'y', 0)
const serMs = (performance.now() - t4) / 20
console.log(`序列化 316 零件状态平均耗时: ${serMs.toFixed(3)} ms`)

const ok = recomputeMs < 8 && subtreeMs < 4 && frameMs < 6 && idleMs < 2 && serMs < 10
console.log(ok ? '\n性能基准达标 ✓（单帧逻辑开销远低于 16.7ms 预算）' : '\n性能基准未达标 ✗')
process.exit(ok ? 0 : 1)
