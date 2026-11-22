import * as THREE from 'three';

/**
 * 共享的低分辨率 3D 体积噪声纹理。
 * 近灯用 64³（三 octave fbm），远灯用 16³（单 octave）——
 * 用硬件三线性插值代替高频程序化噪声，控制十余盏灯同屏时的采样开销。
 */
function createNoise3D(size: number): THREE.Data3DTexture {
  const data = new Uint8Array(size * size * size);
  // 简单平滑随机格点：线性过滤由硬件完成
  let seed = 1337 + size;
  const rand = () => {
    // 确定性 LCG，避免每次构建纹理不一致
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < data.length; i++) data[i] = Math.floor(rand() * 255);
  const tex = new THREE.Data3DTexture(data, size, size, size);
  tex.format = THREE.RedFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapR = THREE.RepeatWrapping;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

let highTex: THREE.Data3DTexture | null = null;
let lowTex: THREE.Data3DTexture | null = null;

export function getNoiseTextures(): { high: THREE.Data3DTexture; low: THREE.Data3DTexture } {
  if (!highTex) highTex = createNoise3D(64);
  if (!lowTex) lowTex = createNoise3D(16);
  return { high: highTex, low: lowTex };
}
