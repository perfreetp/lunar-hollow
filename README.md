# 航站楼玻璃幕墙透射效果渲染工具

基于 **TypeScript + Vue 3 + Babylon.js（WebGPU 优先，WebGL2 自动回退）** 的浏览器端幕墙透射仿真。
在三维场景中搭建网格分格幕墙，调节每格玻璃的光学参数，观察阳光穿过后在室内地面与墙面形成的光斑，并读取室内眩光强度。

## 运行

```bash
npm install
npm run dev        # 开发服务器（默认端口被占用时自动顺延，见终端输出）
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm run typecheck  # 严格类型检查
npm test           # 纯逻辑单元测试（vitest，41 项）
npm run test:browser   # 真实浏览器 CDP 冒烟测试（需先 npm run dev）
```

浏览器打开后右上角显示当前引擎：支持 WebGPU 时为 **WebGPU 引擎**，否则自动 **WebGL2 回退**，两套后端共用同一份场景代码。

## 功能与需求对照

| 需求 | 实现 |
| --- | --- |
| 幕墙按网格分格、每格独立设置玻璃 | `core/grid.ts` 几何分格 + `core/types.ts` 每格 `GlassCell`；UI 点击任一格单独配置 |
| 透明 / 镀膜 / 彩釉三类玻璃 | `GlassType` 枚举，三类各自的材质与光学模型 |
| 透射率 10%–90% 调节 | 滑杆限定 `[0.1, 0.9]`，导入文件同样校验范围 |
| 镀膜带反射色偏 | 中性银/宝石蓝/青铜/翡翠绿四档，材质菲涅尔边缘高光与光斑染色均带色偏 |
| 太阳按时角 + 高度角设定 | `core/sun.ts` 解析为单位方向向量；时角 0=正午，正=下午 |
| 阳光穿幕墙在地面/墙面形成光斑 | `core/projection.ts` 沿太阳方向做射线-平面求交 + Sutherland–Hodgman 矩形裁剪 |
| 光斑形状随分格形状与遮挡条变化 | 孔径先内缩半个框条宽度再投影；彩釉格按遮罩离散为多个子孔径 |
| 玻璃按到相机距离逐格排序混合 | 每格独立半透明 mesh、关闭深度写，Babylon 透明队列按相机距离排序 |
| 多层玻璃叠加颜色累积正确、不穿插 | 能量乘积模型 `∏τᵢ`（`core/optics.ts`），双层演示前后顺序由透明排序保证 |
| 彩釉贴图遮罩控制透光区域、边缘抗锯齿 | `render/maskTexture.ts` 程序化生成 256² 灰度贴图，`smoothstep` 软边 + 双线性采样 |
| 室内眩光强度读数 | `core/glare.ts` 计算总通量、面积加权平均透射比、分类型通量 |
| 鼠标指向显示该格透射率与叠加可见光比例 | 场景拾取 → `CellReadout`，侧栏实时显示 |
| 日照变化时光斑与眩光整体重算 | `SceneManager.rebuildSun()` 只重算几何与读数，不重建玻璃 mesh |
| 导出/导入方案文件（分格参数 + 玻璃类型） | `core/scheme.ts` 带 magic/version 的 JSON，导入严格校验、非法文件报错不崩溃 |

## 架构

```
src/
├─ core/            # 纯 TypeScript 领域逻辑，不依赖 Babylon，可完整单测
│  ├─ types.ts        # 可序列化的方案模型与读数类型
│  ├─ sun.ts          # 时角/高度角 → 太阳方向向量
│  ├─ grid.ts         # 分格几何、孔径（含框条内缩）、UV 映射
│  ├─ fritMask.ts     # 彩釉遮罩解析场（硬判定/抗锯齿/开孔率/子孔径离散）
│  ├─ optics.ts       # 三类玻璃光学模型、多层乘积累积、镀膜色偏
│  ├─ projection.ts   # 射线-平面求交、凸多边形裁剪、三角化
│  ├─ facade.ts       # 整面幕墙光斑重算入口
│  ├─ glare.ts        # 眩光读数
│  └─ scheme.ts       # 方案文件导出/导入与校验
├─ render/          # Babylon 适配层
│  ├─ engine.ts       # WebGPU 探测 + WebGL2 回退
│  ├─ roomBuilder.ts  # 室内壳体与幕墙框条
│  ├─ glassBuilder.ts # 逐格半透明 mesh + 材质（菲涅尔玻璃、彩釉遮罩）
│  ├─ maskTexture.ts  # 与 core 同源的彩釉贴图生成
│  ├─ patchBuilder.ts # 光斑多边形 → 贴地/贴墙光片
│  └─ SceneManager.ts # 场景总装、相机、日照、拾取、分级重建
├─ store/           # Vue 响应式状态与变更调度
└─ components/      # Vue 单文件组件（画布 + 侧栏控制面板）
tests/
├─ *.test.ts         # vitest 单元测试（几何/光学/遮罩/序列化）
├─ cdp-smoke.mjs     # 零依赖 CDP 浏览器冒烟测试
└─ run-browser-smoke.mjs
```

### 关键设计决策

- **几何投影而非阴影贴图**：阳光是平行光，每格孔径四角沿太阳方向与室内各面求交即可得到精确光斑多边形，配合半平面裁剪处理跨面情况，结果确定、可单测，不依赖阴影贴图分辨率。
- **同一份遮罩函数三处复用**：`fritMask.ts` 的解析场同时驱动贴图外观、开孔率读数和光斑子孔径，保证“所见即所算”。
- **core 与 render 分离**：所有光学/几何计算都是无 Babylon 依赖的纯函数，业务正确性由 41 项 vitest 覆盖；Babylon 只负责把结果画出来。
- **分级重建**：改玻璃参数只重建玻璃 mesh，改日照只重算光斑，改结构才全量重建，避免每次滑杆拖动都重建整个场景。

## 坐标系约定

幕墙位于 `z=0` 平面，室内在 `+z`；`x` 沿幕墙向右，`y` 竖直向上。
太阳正午（时角 0）位于幕墙法线方向的室外侧（`-z`），时角为正偏向 `+x`。
