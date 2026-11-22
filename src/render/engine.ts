import { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Engine } from '@babylonjs/core/Engines/engine';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';

export interface EngineHandle {
  engine: AbstractEngine;
  kind: 'webgpu' | 'webgl2';
}

/**
 * 引擎初始化：优先 WebGPU，环境不支持时自动回退 WebGL2。
 * 两者共享 AbstractEngine 接口与同一套场景图代码，回退对上层透明。
 */
export async function createEngine(canvas: HTMLCanvasElement): Promise<EngineHandle> {
  let webgpuSupported = false;
  try {
    webgpuSupported = await WebGPUEngine.IsSupportedAsync;
  } catch {
    webgpuSupported = false;
  }

  if (webgpuSupported) {
    const webgpu = new WebGPUEngine(canvas, {
      antialias: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });
    await webgpu.initAsync();
    return { engine: webgpu, kind: 'webgpu' };
  }

  const webgl = new Engine(
    canvas,
    true,
    {
      stencil: true,
      adaptToDeviceRatio: true,
      powerPreference: 'high-performance',
    },
    true,
  );
  return { engine: webgl, kind: 'webgl2' };
}
