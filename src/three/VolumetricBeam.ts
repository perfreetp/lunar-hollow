import * as THREE from 'three';
import type { BeamConfig, LighthouseConfig } from '../types';
import { GLSL_FLASH, beamDirection, beamPower, beamRange, kelvinToLinearRGB } from '../lib/beamMath';
import { getNoiseTextures } from './noiseTexture';

export type LodLevel = 'high' | 'low';

interface FrustumDims {
  range: number;
  near: number;
  nearHalf: number;
  farHalfH: number;
  farHalfV: number;
}

/**
 * 矩形截面棱台（光锥的扇形体积近似）：
 * 局部 +Z 为光轴，四个侧面 + 远端盖面均带细分网格，
 * 顶点着色器沿法线做噪声扰动 → 可见的流动光柱。
 */
function buildFrustumGeometry(dims: FrustumDims, segL: number, segC: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = []; // (aU 横向 -1..1, aV 纵向 0..1)
  const indices: number[] = [];

  const hw = (z: number) =>
    dims.nearHalf + (dims.farHalfH - dims.nearHalf) * THREE.MathUtils.clamp(z / dims.range, 0, 1);
  const hv = (z: number) =>
    dims.nearHalf + (dims.farHalfV - dims.nearHalf) * THREE.MathUtils.clamp(z / dims.range, 0, 1);

  const addFace = (
    segA: number,
    segB: number,
    point: (a: number, b: number) => THREE.Vector3,
    normal: THREE.Vector3,
    uFor: (a: number, b: number) => [number, number],
  ) => {
    const base = positions.length / 3;
    for (let j = 0; j <= segB; j++) {
      for (let i = 0; i <= segA; i++) {
        const a = i / segA;
        const b = j / segB;
        const p = point(a, b);
        positions.push(p.x, p.y, p.z);
        normals.push(normal.x, normal.y, normal.z);
        const [u, v] = uFor(a, b);
        uvs.push(u, v);
      }
    }
    for (let j = 0; j < segB; j++) {
      for (let i = 0; i < segA; i++) {
        const a = base + j * (segA + 1) + i;
        indices.push(a, a + 1, a + segA + 1, a + 1, a + segA + 2, a + segA + 1);
      }
    }
  };

  const zAt = (t: number) => dims.near + (dims.range - dims.near) * t;

  // 上/下侧面（法向 ±Y）
  for (const sign of [1, -1]) {
    addFace(
      segC,
      segL,
      (a, b) => {
        const z = zAt(b);
        return new THREE.Vector3((a * 2 - 1) * hw(z), sign * hv(z), z);
      },
      new THREE.Vector3(0, sign, 0),
      (a, b) => [a * 2 - 1, b],
    );
  }
  // 左/右侧面（法向 ±X）
  for (const sign of [1, -1]) {
    addFace(
      segC,
      segL,
      (a, b) => {
        const z = zAt(b);
        return new THREE.Vector3(sign * hw(z), (a * 2 - 1) * hv(z), z);
      },
      new THREE.Vector3(sign, 0, 0),
      (a, b) => [a * 2 - 1, b],
    );
  }
  // 远端盖面
  addFace(
    segC,
    segC,
    (a, b) => new THREE.Vector3((a * 2 - 1) * dims.farHalfH, (b * 2 - 1) * dims.farHalfV, dims.range),
    new THREE.Vector3(0, 0, 1),
    (a, b) => [a * 2 - 1, 1],
  );

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('aUV', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

const vertexShader = /* glsl */ `
attribute vec2 aUV;
uniform float uTime;
uniform float uDisplace;
varying vec3 vLocalPos;
varying vec3 vNormalW;
varying vec3 vWorldPos;
varying vec2 vUV;
varying float vViewDist;

void main() {
  vUV = aUV;
  vec3 pos = position;
  // 远端扰动更强，根部保持稳定（灯芯处光柱不抖动）
  float amp = uDisplace * smoothstep(0.0, 0.35, aUV.y);
  float n = sin(position.z * 0.11 + uTime * 0.9) * 0.5
          + sin(position.x * 0.23 - uTime * 0.6) * 0.3
          + sin(position.y * 0.31 + uTime * 1.3) * 0.2;
  pos += normal * n * amp;
  vLocalPos = pos;

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 mv = viewMatrix * world;
  vViewDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
precision highp sampler3D;
out highp vec4 pc_fragColor;
uniform sampler3D uNoise;
uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPeriod;
uniform float uPhase;
uniform float uDuty;
uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uMistBoost;
uniform float uLowRes;
uniform float uOpacity;
varying vec3 vLocalPos;
varying vec3 vNormalW;
varying vec3 vWorldPos;
varying vec2 vUV;
varying float vViewDist;

${GLSL_FLASH}

float sampleNoise(vec3 p) {
  // 纹理本身已是线性过滤的平滑噪声；高档再叠一层高频 fbm
  float n = texture(uNoise, p).r;
  if (uLowRes < 0.5) {
    n = n * 0.65 + texture(uNoise, p * 2.7 + 11.3).r * 0.35;
  }
  return n;
}

void main() {
  vec3 drift = vec3(uTime * 0.015, uTime * 0.01, -uTime * 0.02);
  // 柔化噪声对比度，避免粗硬颗粒，保持薄雾中光柱均匀可读
  float density = mix(0.45, 1.0, sampleNoise(vLocalPos * 0.02 + drift));
  density = clamp(density, 0.0, 1.0);

  // 横向边缘衰减（棱台边界柔化）+ 纵向淡入淡出
  float lateral = 1.0 - smoothstep(0.55, 1.0, abs(vUV.x));
  float axial = smoothstep(0.0, 0.06, vUV.y) * (1.0 - smoothstep(0.82, 1.0, vUV.y));

  // 视角相关：掠射角时壳面更亮，模拟体积散射
  vec3 V = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), V)), 1.4);

  float flash = flashEnvelope(uTime, uPeriod, uPhase, uDuty);
  float core = 1.0 - smoothstep(0.2, 1.0, vUV.y) * 0.45; // 灯芯附近更亮

  float alpha = density * lateral * axial * (0.32 + 0.68 * fresnel)
              * core * uIntensity * uOpacity * flash;
  if (alpha < 0.004) discard;

  // 近岸薄雾：光束在雾中保留可读性（只吃一半雾，并加散射提亮）
  float fog = 1.0 - exp(-uFogDensity * vViewDist);
  float beamFog = fog * (0.55 - uMistBoost * 0.2);
  vec3 col = mix(uColor, uFogColor, beamFog);
  col += uColor * fog * uMistBoost * 0.8 * flash;

  pc_fragColor = vec4(col, alpha);
}
`;

function makeMaterial(lowRes: boolean): THREE.ShaderMaterial {
  const { high, low } = getNoiseTextures();
  return new THREE.ShaderMaterial({
    uniforms: {
      uNoise: { value: lowRes ? low : high },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(1, 0.9, 0.7) },
      uIntensity: { value: 1 },
      uPeriod: { value: 5 },
      uPhase: { value: 0 },
      uDuty: { value: 0.4 },
      uFogDensity: { value: 0.0016 },
      uFogColor: { value: new THREE.Color(0.09, 0.16, 0.24) },
      uMistBoost: { value: 1 },
      uLowRes: { value: lowRes ? 1 : 0 },
      uOpacity: { value: 0.68 },
      uDisplace: { value: 1.3 },
    },
    vertexShader,
    fragmentShader,
    glslVersion: THREE.GLSL3, // sampler3D 需要 GLSL ES 3.0（three 注入 attribute/varying 兼容宏）
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

/** 单盏灯塔的体积光柱（高/低双 LOD）+ 水面光斑标记 */
export class VolumetricBeam {
  readonly group = new THREE.Group();
  private meshHigh: THREE.Mesh;
  private meshLow: THREE.Mesh;
  private matHigh: THREE.ShaderMaterial;
  private matLow: THREE.ShaderMaterial;
  private dims: FrustumDims;
  private footprint: THREE.Group;
  private ring: THREE.Mesh;
  private dot: THREE.Mesh;
  private color = new THREE.Color();
  lighthouseId: string;

  constructor(lh: LighthouseConfig) {
    this.lighthouseId = lh.id;
    const range = beamRange(lh.beam.intensity);
    this.dims = {
      range,
      near: 0.6,
      nearHalf: 0.35,
      farHalfH: Math.max(0.5, range * Math.tan(THREE.MathUtils.degToRad(lh.beam.horizontalAngle / 2))),
      farHalfV: Math.max(0.4, range * Math.tan(THREE.MathUtils.degToRad(lh.beam.verticalAngle / 2))),
    };
    this.matHigh = makeMaterial(false);
    this.matLow = makeMaterial(true);
    this.meshHigh = new THREE.Mesh(buildFrustumGeometry(this.dims, 26, 6), this.matHigh);
    this.meshLow = new THREE.Mesh(buildFrustumGeometry(this.dims, 8, 3), this.matLow);
    this.meshHigh.frustumCulled = false;
    this.meshLow.frustumCulled = false;
    this.group.add(this.meshHigh, this.meshLow);

    // 水面光斑：圆环 + 中心点
    this.footprint = new THREE.Group();
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 1.3;
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.dot = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), dotMat);
    this.dot.rotation.x = -Math.PI / 2;
    this.dot.position.y = 1.35;
    this.footprint.add(this.ring, this.dot);
  }

  get footprintGroup(): THREE.Group {
    return this.footprint;
  }

  /** 按参数重建（张角/光强档位/灯高变化时调用） */
  syncConfig(lh: LighthouseConfig) {
    const range = beamRange(lh.beam.intensity);
    const newDims: FrustumDims = {
      range,
      near: 0.6,
      nearHalf: 0.35,
      farHalfH: Math.max(0.5, range * Math.tan(THREE.MathUtils.degToRad(lh.beam.horizontalAngle / 2))),
      farHalfV: Math.max(0.4, range * Math.tan(THREE.MathUtils.degToRad(lh.beam.verticalAngle / 2))),
    };
    const sig = `${newDims.range}|${newDims.farHalfH}|${newDims.farHalfV}`;
    const oldSig = `${this.dims.range}|${this.dims.farHalfH}|${this.dims.farHalfV}`;
    if (sig !== oldSig) {
      this.dims = newDims;
      this.meshHigh.geometry.dispose();
      this.meshLow.geometry.dispose();
      this.meshHigh.geometry = buildFrustumGeometry(newDims, 26, 6);
      this.meshLow.geometry = buildFrustumGeometry(newDims, 8, 3);
    }

    // 位姿：灯芯位置 + 朝向（局部 +Z → 光束世界方向）
    this.group.position.set(lh.x, lh.height, lh.z);
    const dir = beamDirection(lh.beam);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    this.group.quaternion.copy(q);

    kelvinToLinearRGB(lh.beam.colorTemp, this.color);
    for (const m of [this.matHigh, this.matLow]) {
      m.uniforms.uColor.value.copy(this.color);
      m.uniforms.uIntensity.value = beamPower(lh.beam.intensity);
      m.uniforms.uPeriod.value = lh.beam.period;
      m.uniforms.uPhase.value = lh.beam.phase;
      m.uniforms.uDuty.value = lh.beam.duty;
    }
    (this.ring.material as THREE.MeshBasicMaterial).color.copy(this.color);
    (this.dot.material as THREE.MeshBasicMaterial).color.copy(this.color);
  }

  /** 每帧：时间、雾、LOD 选择、深度排序序号 */
  update(
    time: number,
    cameraPos: THREE.Vector3,
    fogDensity: number,
    fogColor: THREE.Color,
    mistBoost: number,
    lowResFar: boolean,
    farDistance: number,
  ) {
    const dist = this.group.position.distanceTo(cameraPos);
    const useLow = lowResFar && dist > farDistance;
    this.meshHigh.visible = !useLow;
    this.meshLow.visible = useLow;
    for (const m of [this.matHigh, this.matLow]) {
      m.uniforms.uTime.value = time;
      m.uniforms.uFogDensity.value = fogDensity;
      m.uniforms.uFogColor.value.copy(fogColor);
      m.uniforms.uMistBoost.value = mistBoost;
    }
    // 半透明光束按深度排序：越远 renderOrder 越小，先画远的，避免穿插闪烁
    const order = Math.max(1, Math.round(2000 - dist));
    this.meshHigh.renderOrder = order;
    this.meshLow.renderOrder = order;
  }

  setFootprint(spot: { x: number; z: number }, radius: number, visible: boolean, flashOn: boolean) {
    this.footprint.visible = visible && radius > 0;
    this.footprint.position.set(spot.x, 0, spot.z);
    this.ring.scale.setScalar(Math.max(1, radius));
    const rm = this.ring.material as THREE.MeshBasicMaterial;
    const dm = this.dot.material as THREE.MeshBasicMaterial;
    rm.opacity = flashOn ? 0.85 : 0.18;
    dm.opacity = flashOn ? 0.95 : 0.25;
  }

  dispose() {
    this.meshHigh.geometry.dispose();
    this.meshLow.geometry.dispose();
    this.matHigh.dispose();
    this.matLow.dispose();
    this.ring.geometry.dispose();
    this.dot.geometry.dispose();
    (this.ring.material as THREE.Material).dispose();
    (this.dot.material as THREE.Material).dispose();
  }
}
