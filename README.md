# 玻璃幕墙层叠光学预览工具

浏览器内运行的多层玻璃幕墙光学预览：SolidJS + TypeScript + three.js + three-mesh-bvh。
数据保存在浏览器 localStorage，通过导出/导入 JSON 文件分享配置。

## 运行

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 类型检查 + 生产构建到 dist/
npm run preview    # 预览生产构建
```

冒烟与性能测试（需先 `npx playwright install chromium`，dev server 运行中）：

```bash
node --experimental-strip-types tests/smoke.ts        # 18 项功能/渲染/导入导出
node --experimental-strip-types tests/perf-rotate.ts  # 持续旋转帧预算
node --experimental-strip-types tests/screenshots.ts  # 三态截图
```

## 功能与实现对照

| 需求 | 实现位置 |
| --- | --- |
| 四十层玻璃网格布置 | `optics.ts` `DEFAULT_LAYER_COUNT=40`，`WallEngine.buildLayerGeometry` 按 `cols×rows` 合并每层网格 |
| 每层透射/镀膜档位独立调节（各 5 档） | `store.ts` action + `LayerPanel.tsx` 档位按钮，档位表见 `optics.ts` |
| 按视线深度排序 | `WallEngine.incrementalSort`：按相机距离 back-to-front 的**增量插入排序**，近乎有序时 O(n)，并统计交换次数 |
| 半透明层叠混合 | 自定义 `ShaderMaterial`（`transparent + depthWrite:false`），按 `renderOrder` 从后向前 alpha 混合 |
| 镀膜反射随视角变化 | fragment shader 内 Schlick Fresnel：`R(θ)=F0+(1-F0)(1-cosθ)^5`，F0 由镀膜档位决定 |
| 背后场景透过玻璃可见 | 城市楼块/天空/网格背景 + 玻璃不写深度，多层叠加自然变暗 |
| 射线求交统计穿层数 | 每层合并网格挂独立 BVH（`computeBoundsTree`），屏幕中心视线 `firstHitOnly` 求交，命中层数即穿层数 |
| 总透射估算 | `estimateTotalTransmission`：各层视角相关有效透射率连乘（Beer-Lambert 风格层叠模型） |
| 单层高亮隔离 | `setIsolated`：仅该层可见并注入青色高亮 uniform，横幅可退出 |
| 厚度/间距微调 | 厚度走单层几何局部重建（其余层 BVH 保留），间距走幕墙级 z 位置刷新 |
| 旋转时增量更新 | 每帧仅插入排序 + 一条 BVH 射线；40 层实测 0.25–0.6ms（预算 2ms） |
| 层数过多裁剪提示 | 光学裁剪：累积透射 < 2% 的深层计入提示；硬裁剪：> 80 启用层时只渲染最前 80 层，顶部横幅 + 底栏计数 |
| 导出/导入配置 | 带 `format/version` 的 JSON 文件，导入经 `validateConfig` 结构校验，损坏文件报错不崩溃 |
| 防明暗跳变 | 统一 back-to-front 排序 + `depthWrite:false` 避免深度抢占；Fresnel/不透明度均为视角连续函数，排序只做相邻交换不产生帧间突变 |

## 光学模型（实时估算，非物理光谱渲染）

- 透射档位 → 法向透射率 T₀：35% / 50% / 65% / 78% / 90%
- 镀膜档位 → 法向反射率 F₀：4% / 7% / 11% / 16% / 22%
- 视角相关反射：Schlick 近似，掠射角反射增强
- 单层有效透射：`T(θ) = T₀ · (1-R(θ)) / (1-F0)`
- 总透射：视线穿过的启用层 `T(θ)` 连乘；低于 2% 阈值后的深层标记为光学裁剪

## 目录结构

```
src/
  types.ts        配置与帧统计类型
  optics.ts       档位表、Fresnel、总透射估算、配置校验/默认配置
  store.ts        SolidJS store、localStorage 持久化、导入导出 action
  WallEngine.ts   three.js 场景、BVH、增量排序、玻璃 shader、帧预算统计
  components/     Toolbar / LayerPanel / StatsBar
  App.tsx         三段式布局与引擎生命周期
tests/            Playwright 冒烟、性能、截图脚本
```

## 数据与分享

- 所有修改 200ms 防抖写入 `localStorage` 键 `curtain-wall-optics:config:v1`
- 「导出配置」下载 `curtain-wall-optics-<日期>.json`，他人用「导入配置」恢复完整层叠设置
- 不依赖任何后端服务
