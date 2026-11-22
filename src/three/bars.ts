import * as THREE from 'three';
import type { BarSpec, BarType } from '../types';

export const BAR_RADIUS = 0.016;
/** 墙面到扶手管轴线的距离 */
export const STANDOFF = 0.075;
/** L 型竖直段长度 */
export const L_VERTICAL = 0.6;
export const MIN_LEN = 0.4;
export const MAX_LEN = 1.2;
export const MIN_H = 0.3;
export const MAX_H = 1.5;

export function typeNameOf(t: BarType): string {
  return t === 'straight' ? '一字型' : t === 'lshape' ? 'L 型' : '折叠型';
}

// 共享单位几何体（通过 mesh.scale 调整长度，不重复分配）
const G = {
  tubeX: new THREE.CylinderGeometry(BAR_RADIUS, BAR_RADIUS, 1, 20).rotateZ(Math.PI / 2),
  tubeY: new THREE.CylinderGeometry(BAR_RADIUS, BAR_RADIUS, 1, 20),
  tubeZ: new THREE.CylinderGeometry(BAR_RADIUS, BAR_RADIUS, 1, 20).rotateX(Math.PI / 2),
  legZ: new THREE.CylinderGeometry(0.011, 0.011, 1, 12).rotateX(Math.PI / 2),
  flangeZ: new THREE.CylinderGeometry(0.034, 0.034, 0.012, 20).rotateX(Math.PI / 2),
  cap: new THREE.SphereGeometry(BAR_RADIUS, 16, 12),
  hinge: new THREE.CylinderGeometry(0.02, 0.02, 0.14, 16).rotateZ(Math.PI / 2),
  plate: new THREE.BoxGeometry(0.16, 0.34, 0.025),
};

const LEG_Z = (0.012 + STANDOFF) / 2;
const LEG_LEN = STANDOFF - 0.012;

/** 扶手材质：半透明金属。depthWrite 关闭，配合逐帧 renderOrder 排序保证交叠处不闪烁 */
function barMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xb9c6cf,
    metalness: 0.85,
    roughness: 0.32,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
}

function ghostMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: 0x2fd27b,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
}

type Mat = THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial;

/**
 * 一根扶手的三维表示。
 * 局部坐标约定：原点 = 墙面贴合点，+Z = 墙面外法线，+X = 沿墙面水平方向，+Y 近似竖直向上。
 */
export class GrabBar {
  readonly group = new THREE.Group();
  readonly pickMeshes: THREE.Mesh[] = [];
  readonly mat: Mat;
  private refs: Record<string, THREE.Object3D> = {};

  constructor(public spec: BarSpec, ghost = false) {
    this.mat = ghost ? ghostMaterial() : barMaterial();
    this.group.userData.barId = spec.id;
    if (spec.type === 'straight') this.buildStraight();
    else if (spec.type === 'lshape') this.buildL();
    else this.buildFolding();
    this.setLength(spec.length);
    if (spec.type === 'folding') this.setFoldAngle(spec.foldAngle);
  }

  private mk(
    geo: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = this.group,
  ): THREE.Mesh {
    const m = new THREE.Mesh(geo, this.mat);
    m.position.set(x, y, z);
    m.userData.barId = this.spec.id;
    parent.add(m);
    this.pickMeshes.push(m);
    return m;
  }

  /** 一字型：水平直杆 + 两端法兰与支撑腿 */
  private buildStraight() {
    this.refs.tube = this.mk(G.tubeX, 0, 0, STANDOFF);
    this.refs.flangeL = this.mk(G.flangeZ, 0, 0, 0.006);
    this.refs.flangeR = this.mk(G.flangeZ, 0, 0, 0.006);
    this.refs.legL = this.mk(G.legZ, 0, 0, LEG_Z);
    this.refs.legR = this.mk(G.legZ, 0, 0, LEG_Z);
    this.refs.legL.scale.z = LEG_LEN;
    this.refs.legR.scale.z = LEG_LEN;
  }

  /** L 型：水平杆 + 转角竖直段；转角侧由 spec.flipped 决定 */
  private buildL() {
    this.refs.hTube = this.mk(G.tubeX, 0, 0, STANDOFF);
    const corner = new THREE.Group();
    this.group.add(corner);
    this.refs.corner = corner;
    // 转角弯头、竖直管、顶端盖帽
    this.mk(G.cap, 0, 0, STANDOFF, corner);
    const v = this.mk(G.tubeY, 0, L_VERTICAL / 2, STANDOFF, corner);
    v.scale.y = L_VERTICAL;
    this.mk(G.cap, 0, L_VERTICAL, STANDOFF, corner);
    // 转角附近水平段固定点
    this.mk(G.flangeZ, 0.06, 0, 0.006, corner);
    const cl = this.mk(G.legZ, 0.06, 0, LEG_Z, corner);
    cl.scale.z = LEG_LEN;
    // 竖直段中部固定点
    this.mk(G.flangeZ, 0, L_VERTICAL - 0.1, 0.006, corner);
    const vl = this.mk(G.legZ, 0, L_VERTICAL - 0.1, LEG_Z, corner);
    vl.scale.z = LEG_LEN;
    // 远端固定点
    this.refs.flangeE = this.mk(G.flangeZ, 0, 0, 0.006);
    this.refs.legE = this.mk(G.legZ, 0, 0, LEG_Z);
    this.refs.legE.scale.z = LEG_LEN;
  }

  /** 折叠型：墙板 + 铰链 + 可上翻横杆 */
  private buildFolding() {
    this.mk(G.plate, 0, 0.15, 0.0125);
    this.mk(G.hinge, 0, 0, 0.03);
    const pivot = new THREE.Group();
    pivot.position.set(0, 0, 0.03);
    this.group.add(pivot);
    this.refs.pivot = pivot;
    this.refs.tube = this.mk(G.tubeZ, 0, 0, 0, pivot);
    this.refs.endCap = this.mk(G.cap, 0, 0, 0, pivot);
  }

  /** 调整长度：管体缩放，端点与墙面接触点（法兰/支撑腿）同步移动 */
  setLength(len: number) {
    this.spec.length = len;
    const s = this.spec.flipped ? 1 : -1;
    if (this.spec.type === 'straight') {
      this.refs.tube.scale.x = len;
      const off = len / 2 - 0.06;
      this.refs.flangeL.position.x = -off;
      this.refs.flangeR.position.x = off;
      this.refs.legL.position.x = -off;
      this.refs.legR.position.x = off;
    } else if (this.spec.type === 'lshape') {
      this.refs.hTube.scale.x = len;
      this.refs.corner.position.x = (s * len) / 2;
      const e = -s * (len / 2 - 0.06);
      this.refs.flangeE.position.x = e;
      this.refs.legE.position.x = e;
    } else {
      this.refs.tube.scale.z = len;
      this.refs.tube.position.z = len / 2;
      this.refs.endCap.position.z = len;
    }
  }

  setFoldAngle(deg: number) {
    this.spec.foldAngle = deg;
    this.refs.pivot.rotation.x = (-deg * Math.PI) / 180;
  }

  setSelected(on: boolean) {
    const m = this.mat as THREE.MeshPhysicalMaterial;
    if (m.emissive) {
      m.emissive.setHex(on ? 0xff7a1a : 0x000000);
      m.emissiveIntensity = on ? 0.5 : 0;
    }
  }

  dispose() {
    this.group.removeFromParent();
    this.mat.dispose();
    // 几何体为模块级共享缓存，不销毁
  }
}
