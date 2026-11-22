# 古建彩画褪色模拟与修复预览工具（Caihua Fade Studio）

基于 **TypeScript + Vue 3 + three.js + postprocessing** 的浏览器端古建彩画数字化工具，
支持彩画构件的三维浏览、程序化分层褪色模拟、表面笔刷修复、配置分享与本地持久化。

## 功能清单

| 模块 | 实现 |
| --- | --- |
| 三维模型与轨道控制 | `OrbitControls` 旋转/缩放/平移，内置 15 构件演示模型（立柱/梁枋/斗拱/雀替），支持导入 GLB/GLTF |
| 纹理绑定 | 每个构件独立绑定表层颜料、底层纹样、褪色遮罩、修复遮罩四层纹理，支持上传自定义图片替换 |
| 褪色时间轴 | 全局滑块 0–100，实时重算全部构件；按构件、按分组可单独/批量调整 |
| 分层混合渲染 | 自定义 `onBeforeCompile` shader：`effectiveFade = fade × (1-修复) × 褪色遮罩`，表层老化 + 底层墨线显现 |
| 分层显示切换 | 双层混合 / 仅底层纹样（墨线稿）/ 仅表层颜料 |
| 修复笔刷 | 射线拾取 UV → 512² 画布绘制修复遮罩，笔画插值补点、大小/硬度/强度可调、表面光标环 |
| 修复历史 | 每笔快照式撤销/重做（最多 20 步）、单构件/全部清除，快捷键 Ctrl+Z / Ctrl+Shift+Z |
| 数据持久化 | IndexedDB 项目存储（含缩略图），1.5 秒防抖自动保存，启动自动恢复 |
| 分享 | 导出 PNG 视图截图；导出/导入自包含 JSON 配置（内嵌全部纹理 dataURL），支持拖拽导入 |
| 性能 | 褪色仅写 shader uniform 无重编译；笔刷单次处理实测 0.3–0.5ms；实时 FPS / 帧耗时 / 笔刷延迟面板 |

## 快速开始

```bash
npm install
npm run dev      # 开发服务器 http://127.0.0.1:5180
npm run build    # 类型检查 + 生产构建（输出 dist/）
npm run preview  # 预览生产构建
```

## 架构

```
src/
├── core/
│   ├── PaintedMaterial.ts   # MeshStandardMaterial 注入自定义分层 shader（核心）
│   ├── TextureFactory.ts    # 程序化彩画/墨线/褪色遮罩纹理（确定性随机，可复现）
│   ├── ModelBuilder.ts      # 演示古建立面（4 组 15 构件）
│   ├── RestoreBrush.ts      # 射线拾取 + 画布笔刷 + 快照撤销 + 延迟统计
│   └── SceneEngine.ts       # 渲染器/光照/阴影/后处理(SMAA+Bloom+暗角)/渲染循环/FPS
├── db/idb.ts                # IndexedDB 极简封装
├── io/serialize.ts          # 配置序列化、校验、导入恢复
├── store/useStore.ts        # 全局响应式状态（单例 store，桥接引擎与 Vue）
├── components/              # 工具栏/构件面板/笔刷面板/时间轴/性能徽章
└── types.ts
```

### 分层 shader 原理

```glsl
effectiveFade = clamp(uFade * (1.0 - restore) * fadeMask, 0.0, 1.0);
agedSurface   = mix(表层颜料, 老化木色, effectiveFade * 0.85);
finalColor    = mix(agedSurface, 底层墨线层, effectiveFade * 墨线覆盖率);
```

- `uFade`：构件褪色度（0–1），时间轴/分组/构件滑块直写 uniform
- `restore`：修复遮罩红通道，笔刷涂白处局部抵消褪色
- `fadeMask`：不均匀老化遮罩（斑块 + 噪点）
- 混合结果写入 `diffuseColor` 后继续走标准 PBR 光照与色调映射

## 自动化测试

测试通过 CDP（Chrome DevTools Protocol）驱动无头 Edge + SwiftShader 软件 WebGL，
共 18 项断言覆盖渲染、褪色、分层、笔刷、撤销、配置闭环、IndexedDB：

```bash
# 1. 启动开发服务器
npm run dev
# 2. 另开终端启动无头 Edge（Windows）
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --enable-unsafe-swiftshader \
  --use-gl=angle --use-angle=swiftshader \
  --remote-debugging-port=9222 --user-data-dir=/tmp/edge-test about:blank
# 3. 运行测试
node scripts/smoke-cdp.cjs       # 18 项端到端断言
node scripts/final-verify.cjs    # 修复遮罩像素级验证（完好/满褪/修复/清除）
node scripts/isolated.cjs        # 材质隔离页测试（无 Vue/后处理干扰）
node scripts/visual-shots.cjs    # 生成褪色与分层截图
```

## 快捷键

| 按键 | 功能 |
| --- | --- |
| B | 轨道 / 修复笔刷切换 |
| 1 / 2 / 3 | 双层混合 / 仅底层 / 仅表层 |
| Ctrl+Z | 撤销笔画 |
| Ctrl+Shift+Z / Ctrl+Y | 重做 |

## 性能设计说明

- **30 FPS 目标**：褪色变化只更新 uniform 数值，不触发 shader 重编译或纹理重传；15 个四纹理材质在主流独显上开销很低
- **笔刷 <80ms**：`pointermove` 内仅一次射线相交 + Canvas 2D 径向渐变绘制 + `needsUpdate`，软件渲染环境实测 0.3–0.5ms
- 无头测试中的低 FPS（7–10）是 SwiftShader 软件渲染所致，不代表真实 GPU 表现
