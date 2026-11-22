# 机场跑道标志线渲染工具

基于 **TypeScript + 原生 Web Components + MapLibre GL JS** 的跑道标志线布设与查看工具。
标线在局部米坐标系中按真实尺寸建模，投影到经纬度+高程后由 MapLibre 贴地渲染。

## 快速开始

```bash
npm install
npm run dev        # 开发服务器（默认 http://127.0.0.1:5173）
npm run build      # 类型检查 + 生产构建到 dist/
npm run preview    # 预览生产构建
npm test           # 运行单元测试（Vitest）
```

## 功能对照

| 需求 | 实现 |
| --- | --- |
| 五类标线 | 中线、边线、入口标志、接地带标志、跑道号码，各自独立图层与开关 |
| 真实尺寸 | 全部参数以米为单位（默认值参照 FAA AC 150/5340-1），滑块实时调整 |
| 中线虚线可调 | 虚线段长、间隔、端部留白均为独立参数，改动即重建 |
| 号码自动朝向 | 按跑道真方位换算号码（1–36 + L/C/R/W 后缀），矢量字形按来机方向旋转 180° |
| 贴地 + 纵向坡度 | 局部高程 `z = x·slope`，所有标线顶点随坡面起伏，号码/条带沿坡走向 |
| 接缝对齐 | 各类标线共用同一局部坐标系与坡面函数，阈值处基于同一 x 基准，天然对齐 |
| 最小可见宽度 | 线宽表达式把真实米宽换算成屏幕像素，再与 1.6px 保底取大：远处不消失，近处显真实宽 |
| 远处合并简化 | 三级 LOD（完整 / 中距简化 / 远距合并线），随 zoom 自动切换，阈值可调 |
| 数万标线流畅 | 单 GeoJSON 源 + 数据驱动图层 + 空间索引拾取；实测 2.1 万要素稳态 60 FPS |
| 间距测量 | 测量模式下点选两条标线，读出含坡度的三维边缘净距；支持跨跑道测量 |
| 号码随方位重排 | 修改方位即整体重建，号码与入口标志自动重新排布 |
| 导出/导入 | JSON 文件含每要素三维坐标、类型、真实宽度与 LOD；导入后几何零偏差恢复 |

## 架构

```
src/
├─ core/                  # 与地图无关的纯领域逻辑（可单测）
│  ├─ types.ts            # 类型、默认真实尺寸参数
│  ├─ geo.ts              # 局部 ENU 切平面投影（正反算、坡度、包围盒）
│  ├─ text.ts             # 块状矢量字形与跑道号码换算
│  ├─ markingBuilder.ts   # 五类标线要素生成器（含 LOD 级别）
│  ├─ measure.ts          # 同/跨坐标系最近间距、拾取距离
│  ├─ featureSource.ts    # GeoJSON 转换、空间索引、导出/导入
│  └─ scenarios.ts        # 示例与压测场景
├─ map/
│  ├─ MarkingRenderer.ts  # MapLibre 图层、LOD 过滤、线宽表达式、道面
│  └─ RunwayApp.ts        # 应用控制器：状态、拾取测量、导入导出
└─ ui/                    # 原生 Web Components（Shadow DOM）
   ├─ ToolBar / VisibilityPanel / RunwayEditor
   ├─ MarkingParamsPanel / MeasurePanel / StatusBar
   └─ styles.ts
```

### 关键设计

- **局部坐标系**：以跑道起点阈值为原点，x 沿跑道纵轴、y 指向跑道左侧、z 为高程。
  标线全部在该坐标系用米建模，再经 `localToLngLat` 旋转投影，保证多类标线接缝对齐。
- **LOD 数值语义**：每个要素带 `lodMax`（仍可见的最粗级别 0/1/2），
  渲染过滤为 `lodMax >= 当前级别`，避免位掩码匹配错误。
- **线宽表达式**：`line-width` 单位是屏幕像素，逐 zoom 档输出
  `max(1.6, 真实米宽 × 每米像素数)`，近显真实、远保持可见。
- **测量**：同跑道用局部二维线段最近点 + 坡面 z 修正；跨跑道转地理坐标用大圆距离。

## 导出文件格式（`runway-markings-v1`）

```jsonc
{
  "format": "runway-markings-v1",
  "crs": "EPSG:4326",
  "runways": [ /* 跑道几何与坡度参数 */ ],
  "options": { /* 真实尺寸构建参数 */ },
  "visibility": { /* 五类显隐 */ },
  "features": [
    {
      "id": 1, "markingType": "centerline", "kind": "line",
      "width": 0.45, "lodMask": 1,
      "geometry": { "type": "LineString", "coordinates": [[lng, lat, alt], ...] }
    }
  ]
}
```

注：导出字段名 `lodMask` 为历史命名，实际语义是最粗可见 LOD 级别（0/1/2）。
底图使用 OpenStreetMap 栅格瓦片，无需 API Key。
