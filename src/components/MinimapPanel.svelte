<script lang="ts">
  import { onMount } from 'svelte';
  import type { RoamState } from '../lib/state/roam';
  import { STREAM_RADIUS, LOD_BOUNDARIES } from '../lib/state/roam';

  interface Props {
    state: RoamState;
    polyline: Array<{ x: number; z: number }>;
    segmentPoints: Array<{ x: number; z: number; segment: number }>;
    onPick: (worldX: number, worldZ: number) => void;
    onExport: () => void;
  }
  let { state, polyline, segmentPoints, onPick, onExport }: Props = $props();

  const SIZE = 240;
  let canvasEl: HTMLCanvasElement;

  // 世界 -> 小地图的等比变换(留 14px 边距)
  const bounds = $derived.by(() => {
    if (polyline.length === 0) return null;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const p of polyline) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }
    const pad = 30;
    minX -= pad;
    maxX += pad;
    minZ -= pad;
    maxZ += pad;
    const scale = Math.min(SIZE / (maxX - minX), SIZE / (maxZ - minZ));
    const ox = (SIZE - (maxX - minX) * scale) / 2;
    const oz = (SIZE - (maxZ - minZ) * scale) / 2;
    return { minX, minZ, scale, ox, oz };
  });

  function toMap(x: number, z: number): [number, number] {
    const b = bounds!;
    return [b.ox + (x - b.minX) * b.scale, b.oz + (z - b.minZ) * b.scale];
  }

  function toWorld(mx: number, mz: number): [number, number] {
    const b = bounds!;
    return [(mx - b.ox) / b.scale + b.minX, (mz - b.oz) / b.scale + b.minZ];
  }

  function draw() {
    const ctx = canvasEl?.getContext('2d');
    if (!ctx || !bounds || polyline.length === 0) return;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // 背景
    ctx.fillStyle = 'rgba(8, 14, 22, 0.85)';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // 分块着色:按 state.chunks 的 centerS 找到对应中心线点
    if (state.chunks.length > 0) {
      for (const ch of state.chunks) {
        const idx = Math.min(
          polyline.length - 1,
          Math.round((ch.centerS / state.totalLength) * polyline.length)
        );
        const p = polyline[idx];
        if (!p) continue;
        const [mx, mz] = toMap(p.x, p.z);
        const r = 4.5;
        if (ch.state === 'loading') {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
        } else if (ch.state === 'ready') {
          ctx.fillStyle =
            ch.lod === 0
              ? 'rgba(52, 211, 153, 0.95)'
              : ch.lod === 1
                ? 'rgba(56, 189, 248, 0.8)'
                : 'rgba(125, 211, 252, 0.55)';
        } else {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
        }
        ctx.beginPath();
        ctx.arc(mx, mz, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 赛道折线
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    polyline.forEach((p, i) => {
      const [mx, mz] = toMap(p.x, p.z);
      if (i === 0) ctx.moveTo(mx, mz);
      else ctx.lineTo(mx, mz);
    });
    ctx.closePath();
    ctx.stroke();

    // 路段编号
    ctx.fillStyle = '#7dd3fc';
    ctx.font = '600 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const sp of segmentPoints) {
      const [mx, mz] = toMap(sp.x, sp.z);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.95)';
      ctx.beginPath();
      ctx.arc(mx, mz, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#082f49';
      ctx.fillText(String(sp.segment), mx, mz + 0.5);
    }

    // 当前位置三角(带朝向)
    const sIdx = Math.min(
      polyline.length - 1,
      Math.round((state.s / state.totalLength) * polyline.length)
    );
    const here = polyline[sIdx];
    if (here) {
      const [hx, hy] = toMap(here.x, here.z);
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(-state.heading); // 屏幕 y 向下,航向取反
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(6, 7);
      ctx.lineTo(0, 4);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  $effect(() => {
    // 依赖状态与几何,状态每帧变化时重绘
    state.s;
    state.heading;
    state.chunks;
    polyline;
    draw();
  });

  onMount(draw);

  function handleClick(e: MouseEvent) {
    if (!bounds) return;
    const rect = canvasEl.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SIZE;
    const mz = ((e.clientY - rect.top) / rect.height) * SIZE;
    const [wx, wz] = toWorld(mx, mz);
    onPick(wx, wz);
  }
</script>

<section class="panel minimap-panel">
  <h2><span class="step">4</span>小地图与位置导出</h2>
  <canvas
    bind:this={canvasEl}
    width={SIZE}
    height={SIZE}
    onclick={handleClick}
    title="点击任意位置快速跳转"
  ></canvas>

  <div class="legend">
    <span><i class="dot lod0"></i>LOD0</span>
    <span><i class="dot lod1"></i>LOD1</span>
    <span><i class="dot lod2"></i>LOD2</span>
    <span><i class="dot loading"></i>加载中</span>
    <span><i class="dot idle"></i>未加载</span>
  </div>
  <p class="muted" style="margin: 6px 0 10px">
    流式半径 {STREAM_RADIUS}m · LOD 边界 {LOD_BOUNDARIES[0]}/{LOD_BOUNDARIES[1]}m · 点击地图跳转
  </p>
  <button class="primary" style="width: 100%" disabled={!state.ready} onclick={onExport}>
    导出当前位置与相机朝向(JSON)
  </button>
</section>

<style>
  canvas {
    width: 100%;
    border-radius: 10px;
    border: 1px solid var(--panel-border);
    cursor: crosshair;
    display: block;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
    font-size: 11px;
    color: var(--muted);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .dot.lod0 {
    background: rgba(52, 211, 153, 0.95);
  }
  .dot.lod1 {
    background: rgba(56, 189, 248, 0.8);
  }
  .dot.lod2 {
    background: rgba(125, 211, 252, 0.55);
  }
  .dot.loading {
    background: rgba(245, 158, 11, 0.9);
  }
  .dot.idle {
    background: rgba(100, 116, 139, 0.5);
  }
</style>
