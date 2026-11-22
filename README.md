# 航标灯塔光束体积渲染工具

TypeScript + React + three.js + postprocessing 实现的航标灯塔光束体积渲染工作台，包含四个模块：

1. **灯塔参数台** — 灯高、灯质周期、光强档位（1–10 档，对应 80–420m 光程）、色温（1800–8000K）、闪光相位与占空比、塔身遮挡半径。
2. **光束编辑** — 扇形体积光柱（水平张角 / 垂直发散角）、水平旋转与俯仰、多灯叠加列表；实时显示有效光程、水面照射半径、光斑坐标、船-光斑距离与照亮状态。
3. **海域预览** — 可拖动船体（射线拾取 + 地面投影拖拽）、若干礁石（球形遮挡体）、可编辑雾况；船位变动时对所有灯塔的光斑与遮挡做同一帧联动重算。
4. **导出** — 场景配置下载为 JSON / 复制剪贴板 / 从文件导入，供他人还原场景。

## 运行

```bash
npm install
npm run dev      # 开发（默认 http://127.0.0.1:5173）
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览构建产物
```

冒烟测试（需要本机装有 Chrome，使用 playwright-core 直连，不下载浏览器）：

```bash
npm run dev      # 另开终端保持 dev server
BASE_URL=http://127.0.0.1:5173 node tests/smoke.mjs
```

## 关键实现

| 需求 | 实现位置 | 做法 |
| --- | --- | --- |
| 可见光柱 | `src/three/VolumetricBeam.ts` | 矩形截面棱台网格（光锥扇形近似）+ 顶点法线噪声扰动，加色混合、双面、深度写入关闭 |
| 体积噪声 | `src/three/noiseTexture.ts` | 共享 3D 体积噪声纹理：近灯 64³ 双频 fbm，远灯 16³ 单频 + 硬件三线性过滤 |
| 远灯加速 | `VolumetricBeam.update` | 按相机距离切换高/低 LOD（细分 26×6 → 8×3，高/低分辨率体积纹理），阈值 260m |
| 深度排序 | 同上 | 每帧按相机距离写 `renderOrder`，远的先画，避免半透明光束穿插闪烁 |
| 光斑/遮挡联动 | `src/lib/beamMath.ts`、`src/store.ts` | 船位或任一灯参变动 → `recompute()` 统一重算每盏灯的水面光斑、束锥包含、礁石球体与塔身圆柱遮挡 |
| 薄雾可读 | 光束片元着色器 | 光束只吃一半指数雾并叠加雾中散射提亮，可在 UI 开关 |
| 闪光 | `beamMath.ts` GLSL/CPU 同源 | 周期 + 相位 + 占空比方波，灯芯自发光、光柱 alpha、水面标记同步 |
| 后处理 | `src/three/SceneManager.ts` | postprocessing：Bloom + Vignette + ACES 色调映射 |

## 目录结构

```
src/
  types.ts                 场景与灯参类型
  store.ts                 zustand 状态与联动重算入口
  lib/beamMath.ts          色温、光程、束锥判定、遮挡解析、光斑解算
  three/
    noiseTexture.ts        高/低分辨率 3D 噪声纹理
    VolumetricBeam.ts      单灯光柱（双 LOD）+ 水面光斑标记
    SceneManager.ts        场景编排、拖拽拾取、后处理、每帧同步
  components/              四个功能模块 UI
tests/smoke.mjs            无头浏览器冒烟测试
```
