import * as THREE from 'three';

/**
 * 扭绞绳股材质。
 * 绳股是沿绳轴螺旋缠绕的柱面沟槽：在展开的 (弧长 s, 环向角 θ) 平面上，
 * 每条绳股是一条直线 θ = θ_i − k·s。用解析距离函数构造沟槽，
 * 不依赖纹理贴图，弧长重参数化后扭绞节距严格恒定。
 *
 * 半透明但 depthWrite=true、depthTest=true：凸管状单网格自遮挡由深度测试
 * 正确处理，轮组（不透明）先写入深度，透过绳看到的轮组片段也能正确遮挡。
 */
export function createRopeMaterial(opacity = 0.82): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    depthTest: true,
    side: THREE.FrontSide,
    uniforms: {
      uTwistPitch: { value: 0.18 }, // 扭绞节距 (m/圈)
      uStrandCount: { value: 6 }, // 绳股数
      uBaseColor: { value: new THREE.Color('#3a4149') },
      uStrandColor: { value: new THREE.Color('#6b7683') },
      uGrooveColor: { value: new THREE.Color('#1d2126') },
      uLightDir: { value: new THREE.Vector3(0.5, 0.8, 0.35).normalize() },
      uOpacity: { value: opacity },
      uHighlight: { value: 0 }, // 0 正常，1 报警高亮（张力越限时外部驱动）
      uHighlightColor: { value: new THREE.Color('#ff3b30') },
    },
    // 使用默认 GLSL1：three.js 自动注入 position/normal/uv 与矩阵声明，
    // 片元输出用 gl_FragColor，避免 GLSL3 下内建名称重复声明。
    vertexShader: /* glsl */ `
      varying vec3 vNormalV;
      varying vec2 vUv;
      void main() {
        vNormalV = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vNormalV;
      varying vec2 vUv;
      uniform float uTwistPitch;
      uniform float uStrandCount;
      uniform vec3 uBaseColor;
      uniform vec3 uStrandColor;
      uniform vec3 uGrooveColor;
      uniform vec3 uLightDir;
      uniform float uOpacity;
      uniform float uHighlight;
      uniform vec3 uHighlightColor;

      // 周期锯齿波，返回 [-1,1]
      float triWave(float x) {
        float f = fract(x);
        return 1.0 - 4.0 * abs(f - 0.5);
      }

      void main() {
        float s = vUv.x;                 // 累计弧长 (m)
        float theta = vUv.y * 6.2831853; // 环向角
        float k = 6.2831853 / uTwistPitch;
        // 到最近一条绳股中心线的角距离（展开平面上的螺旋线族）
        float phase = (theta + k * s) / 6.2831853 * uStrandCount;
        float d = triWave(phase);          // 1=股脊，-1=沟槽
        float ridge = smoothstep(-0.25, 0.9, d);

        vec3 base = mix(uGrooveColor, mix(uBaseColor, uStrandColor, ridge), 0.85);

        // 股间细沟（次级高频，模拟丝间缝隙）
        float fine = 0.5 + 0.5 * sin((theta + k * s * 1.0) * 18.0 + s * 90.0);
        base *= 0.92 + 0.08 * fine;

        // 简单 Lambert + 视线边缘光（view space）
        vec3 N = normalize(vNormalV);
        float diff = max(dot(N, normalize(uLightDir)), 0.0);
        float rim = pow(1.0 - clamp(dot(N, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.5) * 0.25;
        vec3 color = base * (0.35 + 0.75 * diff) + vec3(rim);

        color = mix(color, uHighlightColor, uHighlight * 0.55);
        gl_FragColor = vec4(color, uOpacity);
      }
    `,
  });
}
