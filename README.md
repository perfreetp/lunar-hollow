# 遥控玩具车结构拆解工具

基于 **Three.js + Vue 3 + TypeScript + Vite** 的三维装配结构拆解观察工具。整车按装配层级组织为 **316 个叶子零件 / 33 个装配节点**，覆盖车壳、底盘、电机、齿轮组、悬挂、轮胎六大分组，支持逐级拆解、单件观察、连接点标注、标签防重叠与状态导出/复原。

## 功能与需求对照

| 需求 | 实现 |
| --- | --- |
| 带装配层级的模型，六大分组 | `src/model/CarBuilder.ts` 程序化整车；`ModelLoader` 同时提供 GLB 加载接口（按 `userData.assemblyId` 绑定装配树） |
| 左侧树形层级，点选高亮零件 | `TreeView.vue` + `HighlightManager`（emissive 高亮，内部节点整组高亮） |
| 逐级展开，零件沿各自方向平移 | `ExplodeEngine`：每叶子带独立 `explodeDir/explodeStep`，因子 0–1 驱动 |
| 平移距离可调 | 全局 `globalDistance` 倍率滑块（0.2–2.2） |
| 上层让位、遮挡正确 | 因子沿祖先链线性累加，上层组先整体移出再由下级继续分散；各零件独立方向 |
| 一键回装复位 | `resetAll()` 因子清零，指数平滑动画回到装配位 |
| 单件沿轴拉出查看 | `ObservationManager`：X/Y/Z 轴向拉出，距离滑块实时驱动 |
| 装配关系与连接点标记 | 连接点按孔/轴/卡扣/螺接四类显示不同标记；同层相邻零件以虚线表达装配关系，端点每帧对齐连接点世界坐标 |
| 关键零件名称标注，跟随位置 | `LabelManager`：DOM 叠加层，世界坐标逐帧投影到屏幕 |
| 密集区域自动避让 | 2D 迭代推开（relaxation）+ 边界约束，6 轮收敛 |
| 标注开关 | 标注总开关 + 连接点标记开关 |
| 导出拆解状态为文件 | `StateExporter` 下载 JSON：各级因子、全局距离、观察状态、每零件 offset 与世界坐标；支持导入复原 |
| 300 零件流畅 | 几何/材质共享缓存、静止零件跳过矩阵写入；实测全量重算 0.21ms、单帧逻辑 ≤0.03ms（见性能基准） |
| 展开某级只重算该级子树 | `setFactor` 仅把该节点加入 `dirtySubtrees`，重算限定在其子树叶子 |
| 标签随拆解联动 | 标签锚点挂在 pivot 局部空间，投影每帧更新 |
| 树与模型双向同步 | `selectionStore` 单一数据源：树点击/3D 射线拾取互相同步，反向选中自动展开祖先路径并滚动定位 |

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # 生产构建
npm run type-check # 严格类型检查
```

## 验证脚本

```bash
npm run test:count        # 零件/分组/连接点/标注统计
npm run test:engine       # 拆解引擎 20 项不变量测试（子树重算、嵌套因子、回装、序列化往返…）
npm run test:bench        # 316 零件性能基准
npm run test:e2e          # 无头 Chrome 端到端（树选择、拾取、拆解、标注、FPS）
npm run test:e2e:observe  # 单件观察与导出文件往返（需先 npm run dev）
```

端到端脚本通过 Chrome DevTools Protocol 驱动本机 Chrome 无头模式，无需额外依赖。

## 目录结构

```
src/
├── model/
│   ├── types.ts          # 装配树/零件/连接点/序列化类型
│   ├── tree.ts           # 树遍历、祖先路径等纯函数
│   ├── materials.ts      # 共享材质与几何缓存（齿轮、弹簧等）
│   ├── CarBuilder.ts     # 程序化整车：316 零件 + 装配层级 + 连接点
│   └── ModelLoader.ts    # 运行时绑定（程序化 / GLB 双入口）
├── three/
│   ├── ExplodeEngine.ts      # 因子模型、子树重算、平滑动画、序列化
│   ├── HighlightManager.ts   # 材质克隆级高亮（选中/悬停）
│   ├── ObservationManager.ts # 单件拉出、连接点标记、关系虚线
│   ├── LabelManager.ts       # DOM 标签投影与防重叠
│   ├── StateExporter.ts      # JSON 下载/读取
│   └── ViewerScene.ts        # 渲染器、相机、射线拾取、渲染循环
├── store/selection.ts    # 选择/悬停/观察/标注开关的响应式单一数据源
├── components/
│   ├── TreeView.vue      # 装配树（递归 TreeItem、搜索、定位）
│   └── ControlPanel.vue  # 拆解/观察/标注/信息/导出面板
└── App.vue               # 模块编排与事件总线
```

## 拆解位移模型

对叶子零件 p，其拆解目标位移：

```
offset(p) = globalDistance × Σ_ancestor(a) factor(a) × p.explodeStep × normalize(p.explodeDir)
```

- 因子仅存在于内部装配节点，叶子恒为 0
- 每一级展开只影响该节点子树；嵌套级的因子沿祖先链累加
- `currentOffset` 以帧率无关的指数插值趋近 `targetOffset`，观察拉出位移 `observeOffset` 独立叠加

## 导出文件格式

```jsonc
{
  "version": 1,
  "exportedAt": "ISO 时间",
  "totalParts": 316,
  "globalDistance": 1.0,
  "observe": { "partId": "...", "axis": "y", "distance": 0.8 },
  "factors": { "g-motor": 0.75 },
  "parts": [
    { "id": "...", "name": "...", "offset": [x, y, z], "worldPosition": [x, y, z] }
  ]
}
```

## GLB 模型接入约定

`ModelLoader.loadGLB(url, tree)` 要求场景中每个可拆解对象的 `Object3D` 携带 `userData.assemblyId`（或对象名等于装配树叶子 id），装配树可由配套 JSON 描述后构建为 `AssemblyNode`。绑定后其余模块（拆解、拾取、标签、导出）无需改动。
