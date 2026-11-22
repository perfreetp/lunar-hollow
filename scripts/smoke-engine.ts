import { CarBuilder } from '../src/model/CarBuilder'
import { ModelLoader } from '../src/model/ModelLoader'
import { ExplodeEngine } from '../src/three/ExplodeEngine'
import { collectLeaves, findNode, walkTree } from '../src/model/tree'

// ModelLoader.attach 需要 sceneRoot 上的 group 名字与叶子 id 一致，CarBuilder 已满足
const model = await new ModelLoader().loadProgrammatic()
const engine = new ExplodeEngine(model)
engine.recomputeAll()

let failures = 0
function check(name: string, cond: boolean, detail = ''): void {
  if (!cond) {
    failures++
    console.log(`✗ ${name} ${detail}`)
  } else {
    console.log(`✓ ${name}`)
  }
}

// 1. 初始状态所有目标位移为 0
let allZero = true
model.runtime.forEach((rt) => {
  if (rt.targetOffset.lengthSq() > 1e-12) allZero = false
})
check('初始装配状态所有零件位移为 0', allZero)

// 2. 只展开一个组：只有该组子树零件产生位移
const chassis = findNode(model.tree, 'g-chassis')!
engine.setFactor(chassis, 1)
// 手动触发 update 中的重算（update 无 DOM 依赖）
engine.update(0.016)
let leakage = 0
model.runtime.forEach((rt) => {
  const inSubtree = rt.node.id.startsWith('chassis-') ||
    rt.node.id.startsWith('elec-') || rt.node.id.startsWith('steer-') ||
    rt.node.id.startsWith('driveshaft-') || rt.node.id.startsWith('guard-')
  if (!inSubtree && rt.targetOffset.lengthSq() > 1e-12) leakage++
})
check('展开底盘组时其它组零件不受影响', leakage === 0, `泄漏 ${leakage} 个`)
const movedChassis = collectLeaves(chassis).filter((n) => {
  const rt = model.runtime.get(n.id)!
  return rt.targetOffset.lengthSq() > 1e-12
}).length
check('底盘子树全部 92 个零件产生位移', movedChassis === 92, `实际 ${movedChassis}`)

// 3. 嵌套因子：组因子 0.5 + 子组因子 0.5，叶子 factorSum=1
const frame = findNode(model.tree, 'g-chassis-frame')!
engine.setFactor(frame, 0.5)
engine.setFactor(chassis, 0.5)
engine.update(0.016)
const rail = model.runtime.get('chassis-rail-l')!
check('嵌套因子线性累加 (0.5+0.5=1)', Math.abs(rail.factorSum - 1) < 1e-9, `实际 ${rail.factorSum}`)
const expectedLen = rail.node.part!.explodeStep * 1 * engine.globalDistance
check('位移长度 = 步距 × 因子和 × 全局距离', Math.abs(rail.targetOffset.length() - expectedLen) < 1e-9)

// 4. 全局距离倍率
engine.globalDistance = 1.5
engine.recomputeAll()
const rail2 = model.runtime.get('chassis-rail-l')!
check('全局距离倍率生效', Math.abs(rail2.targetOffset.length() - expectedLen * 1.5) < 1e-9)
engine.globalDistance = 1

// 5. 全展开后每帧 update 平滑收敛
engine.resetAll()
engine.expandAll(1)
for (let i = 0; i < 200; i++) engine.update(0.05)
let settled = 0
model.runtime.forEach((rt) => {
  if (rt.currentOffset.distanceTo(rt.targetOffset) < 1e-3) settled++
})
check('200 帧动画后全部 316 零件收敛', settled === 316, `收敛 ${settled}`)

// 6. 一键回装
engine.resetAll()
for (let i = 0; i < 200; i++) engine.update(0.05)
let backHome = 0
model.runtime.forEach((rt) => {
  if (rt.pivot.position.distanceTo(rt.basePosition) < 1e-3 && rt.currentOffset.lengthSq() < 1e-6) backHome++
})
check('一键回装后全部零件回到装配位', backHome === 316, `回位 ${backHome}`)
check('isFullyAssembled 判定', engine.isFullyAssembled())

// 7. 序列化 / 复原往返
engine.setFactor(chassis, 0.8)
engine.setFactor(findNode(model.tree, 'g-motor')!, 0.4)
engine.update(0.016)
const state = engine.serialize(null, 'y', 0)
check('序列化包含 316 个零件记录', state.parts.length === 316)
check('序列化记录非零因子', Object.keys(state.factors).length >= 2)
check('worldPosition 已写入', state.parts.every((p) => p.worldPosition.length === 3))

const engine2 = new ExplodeEngine(model)
const snapshot = model.runtime.get('chassis-bolt-0')!.targetOffset.clone()
engine2.restore(state)
check('复原后因子一致', engine2.getFactor(chassis) === 0.8 && engine2.getFactor(findNode(model.tree, 'g-motor')!) === 0.4)
const restored = model.runtime.get('chassis-bolt-0')!.targetOffset
check('复原后目标位移与导出时一致', restored.distanceTo(snapshot) < 1e-9)

// 8. 子树重算范围验证：记录其它组目标位移，展开新组后应保持不变
engine2.resetAll()
engine2.recomputeAll()
engine2.setFactor(findNode(model.tree, 'g-body')!, 1)
engine2.update(0.016)
const motorLeaves = collectLeaves(findNode(model.tree, 'g-motor')!)
const motorStillZero = motorLeaves.every((n) => model.runtime.get(n.id)!.targetOffset.lengthSq() < 1e-12)
check('展开车壳组时电机组位移保持为 0（局部重算）', motorStillZero)

// 9. 因子边界裁剪
engine2.setFactor(chassis, 2.5)
check('因子被裁剪到 1', engine2.getFactor(chassis) === 1)
engine2.setFactor(chassis, -1)
check('因子被裁剪到 0', engine2.getFactor(chassis) === 0)

// 10. 内部节点数量与树完整性
let internal = 0
walkTree(model.tree, (n) => {
  if (n.children.length) internal++
})
check(`装配树内部节点 ${internal} 个、叶子 316 个`, internal > 12)
check('runtime 与叶子一一对应', model.runtime.size === 316)
check('可拾取对象已注册', model.pickables.length >= 316)

console.log(failures === 0 ? '\n全部通过 ✓' : `\n${failures} 项失败 ✗`)
process.exit(failures === 0 ? 0 : 1)
