// 可复用 three.js 视口:机构模型渲染、随开度驱动、干涉高亮、关键点标注、姿态幻影对比
import { createEffect, onCleanup, onMount } from 'solid-js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  CYLINDER,
  HINGE,
  SIDES,
  type SideConfig,
} from '../config';
import {
  cylinderBarrelEnds,
  leafAngleAt,
  solveKinematics,
  type KinematicsResult,
  type Vec3,
} from '../kinematics';
import { getLeafMeshes, getStaticMeshes, type MeshData } from '../manifoldService';
import { angle, interference, showHighlights, showLabels } from '../store';

export interface ViewportApi {
  capture: () => string;
}

interface Props {
  /** 对比姿态的开度(幻影显示),null 不显示 */
  ghostAngle?: number | null;
  /** 是否强制显示干涉高亮(默认跟随全局开关) */
  showHits?: boolean;
}

const COLORS = {
  leaf: 0x4f7fb8,
  leafGhost: 0x9a6fd0,
  rod: 0xd8a03c,
  piston: 0xc0c6cc,
  barrel: 0x6b7280,
  hinge: 0x374151,
  wall: 0x9aa3ad,
  obstacle: 0x9c8a4a,
  hit: 0xff2222,
};

function meshDataToGeometry(data: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  g.setIndex(new THREE.BufferAttribute(data.indices, 1));
  g.computeVertexNormals();
  return g;
}

/** 创建一根可复用的"两点圆柱"(单位长度,沿 Y 轴) */
function makeSegmentMesh(radius: number, color: number, opacity = 1): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, 1, 20);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.35,
    transparent: opacity < 1,
    opacity,
  });
  return new THREE.Mesh(geo, mat);
}

function setSegment(mesh: THREE.Mesh, p0: Vec3, p1: Vec3) {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const dz = p1.z - p0.z;
  const len = Math.hypot(dx, dy, dz);
  mesh.position.set((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
  mesh.scale.set(1, Math.max(len, 1e-6), 1);
  const dir = new THREE.Vector3(dx, dy, dz).normalize();
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
}

interface SideRig {
  side: SideConfig;
  leaf: THREE.Mesh;
  rod: THREE.Mesh;
  piston: THREE.Mesh;
  barrel: THREE.Mesh;
  hinge: THREE.Mesh;
  anchor: THREE.Mesh;
}

function buildSideRig(side: SideConfig, ghost: boolean): SideRig {
  const leafColor = ghost ? COLORS.leafGhost : COLORS.leaf;
  const opacity = ghost ? 0.35 : 1;
  const leafMat = new THREE.MeshStandardMaterial({
    color: leafColor,
    roughness: 0.6,
    metalness: 0.2,
    transparent: ghost,
    opacity,
  });
  const leaf = new THREE.Mesh(new THREE.BufferGeometry(), leafMat);
  // 几何由 manifold 生成(局部:支铰在原点,+X 沿门叶,含铰点支架与中缝斜切)

  const rod = makeSegmentMesh(CYLINDER.linkRodRadius, ghost ? COLORS.leafGhost : COLORS.rod, opacity);
  const piston = makeSegmentMesh(CYLINDER.rodRadius, ghost ? COLORS.leafGhost : COLORS.piston, opacity);
  const barrel = makeSegmentMesh(CYLINDER.barrelRadius, ghost ? COLORS.leafGhost : COLORS.barrel, opacity);

  const hinge = new THREE.Mesh(
    new THREE.CylinderGeometry(HINGE.radius, HINGE.radius, HINGE.height, 24),
    new THREE.MeshStandardMaterial({ color: COLORS.hinge, roughness: 0.5, metalness: 0.5 }),
  );
  hinge.position.set(side.hinge[0], HINGE.height / 2, side.hinge[2]);

  const anchor = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 16, 12),
    new THREE.MeshStandardMaterial({ color: COLORS.hinge, roughness: 0.5, metalness: 0.5 }),
  );
  anchor.position.set(side.cylAnchor[0], side.cylAnchor[1], side.cylAnchor[2]);

  return { side, leaf, rod, piston, barrel, hinge, anchor };
}

function poseSideRig(rig: SideRig, kin: KinematicsResult) {
  const sk = kin.sides.find((s) => s.side.id === rig.side.id)!;
  const a = leafAngleAt(rig.side, kin.thetaDeg);
  // three.js 中绕 Y 轴旋转 γ 使 +X 指向 (cos a, 0, sin a):γ = -a
  rig.leaf.position.set(rig.side.hinge[0], 0, rig.side.hinge[2]);
  rig.leaf.rotation.set(0, -a, 0);
  setSegment(rig.rod, sk.B, sk.C);
  const barrel = cylinderBarrelEnds(rig.side);
  setSegment(rig.piston, barrel.p1, sk.B);
  setSegment(rig.barrel, barrel.p0, barrel.p1);
}

interface LabelDef {
  el: HTMLDivElement;
  world: () => Vec3;
  text: () => string;
}

export default function Viewport(props: Props & { apiRef?: (api: ViewportApi) => void }) {
  let container!: HTMLDivElement;
  let overlay!: HTMLDivElement;
  let renderer!: THREE.WebGLRenderer;
  let camera!: THREE.PerspectiveCamera;
  let controls!: OrbitControls;
  let scene!: THREE.Scene;
  const rigs: SideRig[] = [];
  const ghostRigs: SideRig[] = [];
  const hitGroup = new THREE.Group();
  const labels: LabelDef[] = [];
  let disposed = false;

  function buildLabels() {
    const mk = (world: () => Vec3, text: () => string) => {
      const el = document.createElement('div');
      el.className = 'vp-label';
      overlay.appendChild(el);
      labels.push({ el, world, text });
    };
    for (const side of SIDES) {
      const tag = side.id === 'L' ? '左' : '右';
      mk(
        () => ({ x: side.hinge[0], y: HINGE.height + 0.6, z: side.hinge[2] }),
        () => `${tag}支铰 θ=${angle().toFixed(1)}°`,
      );
      mk(
        () => {
          const kin = solveKinematics(angle());
          const sk = kin.sides.find((s) => s.side.id === side.id)!;
          return { x: sk.C.x, y: sk.C.y + 0.7, z: sk.C.z };
        },
        () => {
          const kin = solveKinematics(angle());
          const sk = kin.sides.find((s) => s.side.id === side.id)!;
          return `${tag}连杆铰点 L=${sk.rodLength.toFixed(2)}m`;
        },
      );
      mk(
        () => {
          const kin = solveKinematics(angle());
          const sk = kin.sides.find((s) => s.side.id === side.id)!;
          return { x: sk.B.x, y: sk.B.y + 0.7, z: sk.B.z };
        },
        () => {
          const kin = solveKinematics(angle());
          const sk = kin.sides.find((s) => s.side.id === side.id)!;
          return `${tag}活塞行程 ${sk.stroke.toFixed(2)}m`;
        },
      );
      mk(
        () => ({ x: side.cylAnchor[0], y: side.cylAnchor[1] + 0.8, z: side.cylAnchor[2] }),
        () => `${tag}启闭机支座`,
      );
    }
  }

  function updateLabels() {
    const show = showLabels();
    const rect = container.getBoundingClientRect();
    const v = new THREE.Vector3();
    for (const l of labels) {
      if (!show) {
        l.el.style.display = 'none';
        continue;
      }
      const w = l.world();
      v.set(w.x, w.y, w.z).project(camera);
      if (v.z > 1) {
        l.el.style.display = 'none';
        continue;
      }
      l.el.style.display = 'block';
      l.el.style.left = `${((v.x + 1) / 2) * rect.width}px`;
      l.el.style.top = `${((-v.y + 1) / 2) * rect.height}px`;
      l.el.textContent = l.text();
    }
  }

  function refreshHits() {
    // 清空旧高亮
    for (const c of [...hitGroup.children]) {
      hitGroup.remove(c);
      (c as THREE.Mesh).geometry.dispose();
    }
    const report = interference();
    const want = props.showHits ?? showHighlights();
    if (!report || !want) return;
    for (const hit of report.hits) {
      if (!hit.mesh) continue;
      const mesh = new THREE.Mesh(
        meshDataToGeometry(hit.mesh),
        new THREE.MeshStandardMaterial({
          color: COLORS.hit,
          emissive: 0xaa0000,
          transparent: true,
          opacity: 0.75,
          depthTest: true,
        }),
      );
      hitGroup.add(mesh);
    }
  }

  function applyPose() {
    const kin = solveKinematics(angle());
    for (const rig of rigs) poseSideRig(rig, kin);
    const g = props.ghostAngle;
    if (g !== null && g !== undefined) {
      const gkin = solveKinematics(g);
      for (const rig of ghostRigs) poseSideRig(rig, gkin);
    }
  }

  onMount(async () => {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c2330);
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    camera.position.set(26, 24, 30);
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 4, -2);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.52;

    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x30363f, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(20, 40, 15);
    scene.add(sun);

    const grid = new THREE.GridHelper(60, 60, 0x3a4556, 0x2a3342);
    grid.position.y = -0.01;
    scene.add(grid);
    // 水面
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(2 * 30, 44),
      new THREE.MeshStandardMaterial({ color: 0x1d4e66, transparent: true, opacity: 0.55, roughness: 0.2 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.02;
    scene.add(water);

    // 运动机构
    for (const side of SIDES) {
      const rig = buildSideRig(side, false);
      rigs.push(rig);
      scene.add(rig.leaf, rig.rod, rig.piston, rig.barrel, rig.hinge, rig.anchor);
      const grig = buildSideRig(side, true);
      ghostRigs.push(grig);
      grig.leaf.visible = grig.rod.visible = grig.piston.visible = grig.barrel.visible = false;
      grig.hinge.visible = grig.anchor.visible = false;
      scene.add(grig.leaf, grig.rod, grig.piston, grig.barrel, grig.hinge, grig.anchor);
    }
    scene.add(hitGroup);

    // 静态实体(墙壁含门龛、障碍块)与门叶实体来自 manifold
    try {
      const [stat, leafMeshes] = await Promise.all([getStaticMeshes(), getLeafMeshes()]);
      if (disposed) return;
      const wallMat = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.9, metalness: 0.05 });
      scene.add(new THREE.Mesh(meshDataToGeometry(stat.wallL), wallMat));
      scene.add(new THREE.Mesh(meshDataToGeometry(stat.wallR), wallMat));
      scene.add(
        new THREE.Mesh(
          meshDataToGeometry(stat.obstacle),
          new THREE.MeshStandardMaterial({ color: COLORS.obstacle, roughness: 0.8 }),
        ),
      );
      for (const rig of rigs) {
        rig.leaf.geometry = meshDataToGeometry(leafMeshes[rig.side.id]);
      }
      for (const rig of ghostRigs) {
        rig.leaf.geometry = meshDataToGeometry(leafMeshes[rig.side.id]);
      }
    } catch (e) {
      console.error('manifold 静态场景加载失败', e);
    }

    buildLabels();
    applyPose();
    refreshHits();

    // 响应式
    createEffect(() => {
      angle();
      applyPose();
    });
    createEffect(() => {
      interference();
      showHighlights();
      refreshHits();
    });
    createEffect(() => {
      const g = props.ghostAngle;
      const vis = g !== null && g !== undefined;
      for (const rig of ghostRigs) {
        rig.leaf.visible = rig.rod.visible = rig.piston.visible = rig.barrel.visible = vis;
      }
      applyPose();
    });

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const loop = () => {
      if (disposed) return;
      requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
      updateLabels();
    };
    loop();

    props.apiRef?.({
      capture: () => {
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL('image/png');
      },
    });
  });

  onCleanup(() => {
    disposed = true;
    controls?.dispose();
    renderer?.dispose();
  });

  return (
    <div class="viewport" ref={container}>
      <div class="vp-overlay" ref={overlay} />
    </div>
  );
}
