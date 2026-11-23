import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import type { AssetSpec } from './assets';
import { buildChassis, buildGround } from './assets';

export interface StudioHandle {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
  shadow: ShadowGenerator;
  chassisMeshes: ReturnType<typeof buildChassis>;
  ground: ReturnType<typeof buildGround>;
  resize(): void;
  dispose(): void;
}

const view = { alpha: 0.78, beta: 1.14, radius: 470 };

export function createStudio(canvas: HTMLCanvasElement): StudioHandle {
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
    powerPreference: 'high-performance',
    adaptToDeviceRatio: true,
  }, true);

  const scene = new Scene(engine);
  scene.clearColor = Color4.FromHexString('#0a0e14ff');
  // Filmic response keeps the specular highlights on the fender and tyre from
  // clipping to white, which otherwise reads as a blown-out model.
  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType = 1; // ACES
  scene.imageProcessingConfiguration.exposure = 1.06;
  scene.imageProcessingConfiguration.contrast = 1.16;
  scene.ambientColor = new Color3(0.17, 0.2, 0.26);
  scene.useRightHandedSystem = false;
  scene.skipPointerMovePicking = true;
  scene.autoClear = true;

  const camera = new ArcRotateCamera(
    'orbit',
    view.alpha,
    view.beta,
    view.radius,
    new Vector3(120, 76, 0),
    scene,
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 180;
  camera.upperRadiusLimit = 2000;
  camera.lowerBetaLimit = 0.08;
  camera.upperBetaLimit = Math.PI * 0.62;
  camera.wheelDeltaPercentage = 0.012;
  camera.pinchDeltaPercentage = 0.012;
  camera.panningSensibility = 22;
  camera.minZ = 0.6;
  camera.maxZ = 6000;
  camera.fov = 0.72;
  camera.inertia = 0.72;
  camera.angularSensibilityX = 1400;
  camera.angularSensibilityY = 1400;
  camera.panningInertia = 0.7;
  camera.panningAxis = new Vector3(1, 1, 0);

  const hemi = new HemisphericLight('ambient', new Vector3(0.2, 1, 0.35), scene);
  hemi.intensity = 0.36;
  hemi.diffuse = Color3.FromHexString('#cfe3ff');
  hemi.groundColor = Color3.FromHexString('#1b2430');
  hemi.specular = new Color3(1, 1, 1);

  const key = new DirectionalLight('key', new Vector3(-0.55, -1, -0.42), scene);
  key.position = new Vector3(320, 520, 240);
  key.intensity = 1.35;
  key.diffuse = Color3.FromHexString('#fff3e0');
  key.specular = Color3.FromHexString('#ffffff');

  const rim = new DirectionalLight('rim', new Vector3(0.7, -0.32, 0.62), scene);
  rim.position = new Vector3(-260, 180, -320);
  rim.intensity = 0.72;
  rim.diffuse = Color3.FromHexString('#5ab0ff');
  rim.specular = Color3.FromHexString('#9ad4ff');

  const fill = new DirectionalLight('fill', new Vector3(0.2, -0.5, 1), scene);
  fill.position = new Vector3(-40, 220, 520);
  fill.intensity = 0.3;
  fill.diffuse = Color3.FromHexString('#ffd9b5');

  const shadow = new ShadowGenerator(1024, key);
  shadow.useBlurExponentialShadowMap = true;
  shadow.blurKernel = 22;
  shadow.depthScale = 42;
  shadow.darkness = 0.35;
  shadow.bias = 0.004;
  shadow.normalBias = 0.02;

  const ground = buildGround(scene);
  const chassisMeshes = buildChassis(scene);

  const resize = () => engine.resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    ro.disconnect();
    engine.stopRenderLoop();
    scene.dispose();
    engine.dispose();
  };

  return { engine, scene, camera, shadow, chassisMeshes, ground, resize, dispose };
}

/** Material helper so every part shares the same lighting response. */
export function makeStd(
  scene: Scene,
  name: string,
  hex: string,
  opts: Partial<{ specular: number; emissive: string; alpha: number; backFaceCulling: boolean; roughness: number }> = {},
): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = Color3.FromHexString(hex);
  mat.specularColor = Color3.FromHexString(opts.emissive ?? '#9fb4c8').scale(opts.specular ?? 0.55);
  mat.specularPower = 64 - (opts.roughness ?? 0.4) * 44;
  mat.emissiveColor = opts.emissive ? Color3.FromHexString(opts.emissive).scale(0.16) : Color3.Black();
  mat.ambientColor = Color3.FromHexString(hex).scale(0.32);
  mat.backFaceCulling = opts.backFaceCulling ?? true;
  if (typeof opts.alpha === 'number' && opts.alpha < 1) {
    mat.alpha = opts.alpha;
    mat.transparencyMode = 2;
  }
  return mat;
}

export { MeshBuilder, Vector3, Color3 };
export type { AssetSpec };
