import { CarBuilder } from '../src/model/CarBuilder'
import { collectLeaves, walkTree } from '../src/model/tree'

const { root, leafCount } = new CarBuilder().build()
const leaves = collectLeaves(root)
console.log('叶子零件总数:', leafCount, leaves.length)

const groups = new Map<string, number>()
walkTree(root, (n) => {
  let g = n
  while (g && !g.groupId && g.parent) g = g.parent
  if (g.groupId) groups.set(g.name, (groups.get(g.name) ?? 0) + (n.children.length ? 0 : 1))
})
console.log('分组统计:')
for (const [name, count] of groups) console.log(`  ${name}: ${count}`)

// 校验每个叶子都有合法拆解方向与步距
let bad = 0
for (const leaf of leaves) {
  const p = leaf.part!
  const len = Math.hypot(...p.explodeDir)
  if (len < 0.99 || len > 1.01 || p.explodeStep <= 0) {
    bad++
    console.log('  异常零件:', p.id, p.explodeDir, p.explodeStep)
  }
}
console.log('方向/步距异常数:', bad)

// 统计关键零件（标签）与连接点
const keyCount = leaves.filter((l) => l.part!.keyPart).length
const cpCount = leaves.reduce((s, l) => s + l.part!.connections.length, 0)
console.log('关键零件标注数:', keyCount, '连接点总数:', cpCount)

// 层级深度
let maxDepth = 0
walkTree(root, (n) => {
  maxDepth = Math.max(maxDepth, n.depth)
})
console.log('最大层级深度:', maxDepth)
