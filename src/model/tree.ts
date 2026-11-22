import type { AssemblyNode } from './types'

/** 深度优先遍历，回调返回 false 时剪枝 */
export function walkTree(
  root: AssemblyNode,
  fn: (node: AssemblyNode) => void | false,
): void {
  const stack: AssemblyNode[] = [root]
  while (stack.length) {
    const node = stack.pop()!
    if (fn(node) === false) continue
    for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i])
  }
}

/** 收集全部叶子零件 */
export function collectLeaves(root: AssemblyNode): AssemblyNode[] {
  const leaves: AssemblyNode[] = []
  walkTree(root, (n) => {
    if (!n.children.length) leaves.push(n)
  })
  return leaves
}

export function findNode(root: AssemblyNode, id: string): AssemblyNode | null {
  let found: AssemblyNode | null = null
  walkTree(root, (n) => {
    if (n.id === id) {
      found = n
      return false
    }
  })
  return found
}

/** 根到该节点的路径（含自身） */
export function ancestorPath(node: AssemblyNode): AssemblyNode[] {
  const path: AssemblyNode[] = []
  let cur: AssemblyNode | null = node
  while (cur) {
    path.unshift(cur)
    cur = cur.parent
  }
  return path
}

/** 节点构建器：自动维护 parent / depth */
export class NodeBuilder {
  constructor(
    public node: AssemblyNode,
  ) {}

  group(id: string, name: string, groupId?: AssemblyNode['groupId']): NodeBuilder {
    const child: AssemblyNode = {
      id,
      name,
      groupId,
      children: [],
      parent: this.node,
      depth: this.node.depth + 1,
      userData: {},
    }
    this.node.children.push(child)
    return new NodeBuilder(child)
  }
}
