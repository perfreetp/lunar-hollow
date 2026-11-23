import {
  Color3,
  Color4,
  CreateCylinder,
  CreateLathe,
  CreateSphere,
  CreateTorus,
  Matrix,
  Mesh,
  MeshBuilder,
  Quaternion,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import type {
  Contact,
  LayerId,
  OcclusionReport,
  Pose,
  RenderSettings,
  SuspensionDims,
} from '../core/model';
import { LAYER_IDS } from '../core/model';
import { renderingGroupsFor, zOffsetsFor, wheelShapeOf } from '../core/collision';
import { PART_INFO, RIG } from '../core/rigSpec';
import { add, scale, sub, type Vec3 } from '../core/math';

const V = (p: Vec3) => new Vector3(p.x, p.y, p.z);
const SPRING_TURNS = 9;

function stdMat(scene: Scene, name: string) {
  const m = new StandardMaterial(name, scene);
  m.specularColor = Color3.FromHexString('#a7bfd6').scale(0.4);
  m.specularPower = 70;
  return m;
}

function tinted(scene: Scene, name: string, hex: string, opts: { alpha?: number; emissive?: number } = {}) {
  const m = stdMat(scene, name);
  m.diffuseColor = Color3.FromHexString(hex);
  m.ambientColor = Color3.FromHexString(hex).scale(0.45);
  if (opts.emissive) m.emissiveColor = Color3.FromHexString(hex).scale(opts.emissive);
  if (opts.alpha !== undefined && opts.alpha < 1) {
    m.alpha = opts.alpha;
    m.transparencyMode = 2;
    m.backFaceCulling = true;
  }
  return m;
}

/** Orient a +Y cylinder between two points. */
function orientBetween(mesh: Mesh, a: Vec3, b: Vec3, radiusScale = 1) {
  const delta = sub(b, a);
  const len = Math.hypot(delta.x, delta.y, delta.z) || 0.0001;
  mesh.position = V(add(a, scale(delta, 0.5)));
  mesh.scaling.set(radiusScale, len, radiusScale);
  const from = new Vector3(0, 1, 0);
  const to = new Vector3(delta.x, delta.y, delta.z).normalize();
  const q = Quaternion.FromUnitVectorsToRef(from, to, new Quaternion(), 1e-6);
  mesh.rotationQuaternion = q;
}

export interface RigViewOptions {
  dims: SuspensionDims;
  render: RenderSettings;
  pose: Pose;
  contacts: Contact[];
  occlusion: OcclusionReport | null;
  previewTravel: number | null;
  visibleParts: Record<string, boolean>;
}

export class RigRenderer {
  readonly scene: Scene;
  readonly root: TransformNode;

  private lowerArm!: TransformNode;
  private upperArm!: TransformNode;
  private knuckle!: TransformNode;
  private tieRod!: TransformNode;
  private wheelRoot!: TransformNode;
  private shockRoot!: TransformNode;

  private lowerMeshes: Mesh[] = [];
  private upperMeshes: Mesh[] = [];
  private knuckleMeshes: Mesh[] = [];
  private tieMeshes: Mesh[] = [];
  private wheelMeshes: Mesh[] = [];
  private shockMeshes: Mesh[] = [];

  private springCoils!: Mesh;
  private shockBody!: Mesh;
  private shockShaft!: Mesh;
  private shockEyeTop!: Mesh;
  private shockEyeBottom!: Mesh;

  private lowerBeam!: Mesh;
  private lowerBraceA!: Mesh;
  private lowerBraceB!: Mesh;
  private lowerPivotTube!: Mesh;
  private upperBeam!: Mesh;
  private upperBraceA!: Mesh;
  private upperBraceB!: Mesh;
  private upperPivotTube!: Mesh;
  private knuckleBody!: Mesh;
  private knuckleHub!: Mesh;
  private brakeDisc!: Mesh;
  private tieRodRod!: Mesh;
  private tieBallOuter!: Mesh;
  private tieBallInner!: Mesh;

  private ballLBJ!: Mesh;
  private ballUBJ!: Mesh;

  private tyre!: Mesh;
  private rim!: Mesh;
  private wheelLug!: Mesh;
  private spokeMeshes: Mesh[] = [];
  private wheelAxisMesh!: Mesh;

  private socketMarkers = new Map<string, Mesh>();
  private contactMarkers: Mesh[] = [];
  private occlusionMarkers!: Mesh;
  private ghostLower!: Mesh;
  private ghostUpper!: Mesh;
  private ghostKnuckle!: Mesh;
  private ghostTie!: Mesh;

  private contactGlow = new Map<string, { mat: StandardMaterial; base: Color3; on: boolean }>();
  private tyreBaseEmissive = Color3.Black();

  constructor(scene: Scene) {
    this.scene = scene;
    this.root = new TransformNode('rigRoot', scene);

    this.buildLowerArm();
    this.buildUpperArm();
    this.buildKnuckle();
    this.buildTieRod();
    this.buildWheel();
    this.buildShock();
    this.buildBallJoints();
    this.buildSockets();
    this.buildMarkers();
  }

  /* ------------------------------- build ------------------------------- */

  private buildLowerArm() {
    const scene = this.scene;
    const mat = tinted(scene, 'lowerArmMat', PART_INFO.lowerArm.tone, { emissive: 0.08 });
    this.lowerArm = new TransformNode('lowerArm', scene);
    this.lowerArm.parent = this.root;

    this.lowerBeam = MeshBuilder.CreateBox('lowerBeam', { width: 1, height: 13, depth: 13 }, scene);
    this.lowerBeam.material = mat;
    this.lowerBeam.parent = this.lowerArm;

    this.lowerBraceA = MeshBuilder.CreateBox('lowerBraceA', { width: 1, height: 8, depth: 7 }, scene);
    this.lowerBraceA.material = mat;
    this.lowerBraceA.parent = this.lowerArm;
    this.lowerBraceB = MeshBuilder.CreateBox('lowerBraceB', { width: 1, height: 8, depth: 7 }, scene);
    this.lowerBraceB.material = mat;
    this.lowerBraceB.parent = this.lowerArm;

    this.lowerPivotTube = CreateCylinder('lowerPivotTube', { height: 52, diameter: 13, tessellation: 18 }, scene);
    this.lowerPivotTube.material = tinted(scene, 'lowerTubeMat', '#2e6f77', {});
    this.lowerPivotTube.rotation.x = Math.PI / 2;
    this.lowerPivotTube.parent = this.lowerArm;

    for (const m of [this.lowerBeam, this.lowerBraceA, this.lowerBraceB, this.lowerPivotTube]) {
      m.isPickable = true;
      m.metadata = { ...(m.metadata ?? {}), layer: 'wheel', part: 'lowerArm', draggable: true };
      m.receiveShadows = true;
      this.lowerMeshes.push(m);
    }
  }

  private buildUpperArm() {
    const scene = this.scene;
    const mat = tinted(scene, 'upperArmMat', PART_INFO.upperArm.tone, { emissive: 0.08 });
    this.upperArm = new TransformNode('upperArm', scene);
    this.upperArm.parent = this.root;

    this.upperBeam = MeshBuilder.CreateBox('upperBeam', { width: 1, height: 9, depth: 9 }, scene);
    this.upperBeam.material = mat;
    this.upperBeam.parent = this.upperArm;
    this.upperBraceA = MeshBuilder.CreateBox('upperBraceA', { width: 1, height: 6, depth: 5 }, scene);
    this.upperBraceA.material = mat;
    this.upperBraceA.parent = this.upperArm;
    this.upperBraceB = MeshBuilder.CreateBox('upperBraceB', { width: 1, height: 6, depth: 5 }, scene);
    this.upperBraceB.material = mat;
    this.upperBraceB.parent = this.upperArm;
    this.upperPivotTube = CreateCylinder('upperPivotTube', { height: 44, diameter: 10.5, tessellation: 18 }, scene);
    this.upperPivotTube.material = tinted(scene, 'upperTubeMat', '#2c4f74', {});
    this.upperPivotTube.rotation.x = Math.PI / 2;
    this.upperPivotTube.parent = this.upperArm;

    for (const m of [this.upperBeam, this.upperBraceA, this.upperBraceB, this.upperPivotTube]) {
      m.isPickable = true;
      m.metadata = { ...(m.metadata ?? {}), layer: 'wheel', part: 'upperArm', draggable: true };
      m.receiveShadows = true;
      this.upperMeshes.push(m);
    }
  }

  private buildKnuckle() {
    const scene = this.scene;
    const mat = tinted(scene, 'knuckleMat', PART_INFO.knuckle.tone, { emissive: 0.08 });
    this.knuckle = new TransformNode('knuckle', scene);
    this.knuckle.parent = this.root;

    this.knuckleBody = MeshBuilder.CreateBox('knuckleBody', { width: 20, height: 46, depth: 26 }, scene);
    this.knuckleBody.material = mat;
    this.knuckleBody.parent = this.knuckle;
    this.knuckleHub = CreateCylinder('knuckleHub', { height: 24, diameter: 34, tessellation: 26 }, scene);
    this.knuckleHub.material = tinted(scene, 'hubMat', '#c88f3f', {});
    this.knuckleHub.rotation.z = Math.PI / 2;
    this.knuckleHub.parent = this.knuckle;
    this.brakeDisc = CreateCylinder('brakeDisc', { height: 5, diameter: 86, tessellation: 40 }, scene);
    this.brakeDisc.material = tinted(scene, 'discMat', '#8d9aa8', {});
    this.brakeDisc.rotation.z = Math.PI / 2;
    this.brakeDisc.parent = this.knuckle;

    for (const m of [this.knuckleBody, this.knuckleHub, this.brakeDisc]) {
      m.isPickable = false;
      m.metadata = { ...(m.metadata ?? {}), layer: 'wheel', part: 'knuckle' };
      this.knuckleMeshes.push(m);
    }
  }

  private buildTieRod() {
    const scene = this.scene;
    const mat = tinted(scene, 'tieMat', PART_INFO.tieRod.tone, { emissive: 0.12 });
    this.tieRod = new TransformNode('tieRod', scene);
    this.tieRod.parent = this.root;
    this.tieRodRod = CreateCylinder('tieRodRod', { height: 1, diameter: 8, tessellation: 14 }, scene);
    this.tieRodRod.material = mat;
    this.tieRodRod.parent = this.tieRod;
    this.tieBallInner = CreateSphere('tieBallInner', { diameter: 15, segments: 12 }, scene);
    this.tieBallInner.material = mat;
    this.tieBallInner.parent = this.tieRod;
    this.tieBallOuter = CreateSphere('tieBallOuter', { diameter: 13, segments: 12 }, scene);
    this.tieBallOuter.material = mat;
    this.tieBallOuter.parent = this.tieRod;
    for (const m of [this.tieRodRod, this.tieBallInner, this.tieBallOuter]) {
      m.isPickable = false;
      m.metadata = { ...(m.metadata ?? {}), layer: 'wheel', part: 'tieRod' };
      this.tieMeshes.push(m);
    }
  }

  private buildWheel() {
    const scene = this.scene;
    this.wheelRoot = new TransformNode('wheelRoot', scene);
    this.wheelRoot.parent = this.root;
    this.wheelRoot.rotationQuaternion = Quaternion.Identity();

    const R = 62;
    const hw = 22;
    const edge = 7.5;

    // Tyre section in (radial, axial) space. `closed` must stay false: closing
    // the profile would bridge the two beads with a disc and hide the rim.
    const profile: Vector3[] = [];
    const push = (radial: number, axial: number) => profile.push(new Vector3(radial, axial, 0));
    // Sidewall starts just inside the bead, sweeping out to the tread shoulder
    // and back, so the silhouette is round with no seam at the bead.
    push(R - edge - 3, -hw + 1.2);
    push(R - edge - 1, -hw + 0.35);
    push(R - edge + 0.1, -hw);
    for (let i = 1; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2);
      push(R - edge + Math.sin(a) * edge, -hw + edge - Math.cos(a) * edge);
    }
    for (const ax of [-0.62, -0.3, 0.3, 0.62]) push(R, ax * hw);
    for (let i = 1; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2);
      push(R - edge + Math.cos(a) * edge, hw - edge + Math.sin(a) * edge);
    }
    push(R - edge + 0.1, hw);
    push(R - edge - 1, hw - 0.35);
    push(R - edge - 3, hw - 1.2);

    this.tyre = CreateLathe(
      'tyre',
      { shape: profile, tessellation: 64, closed: false, sideOrientation: Mesh.DOUBLESIDE },
      scene,
    );
    const tyreMat = tinted(scene, 'tyreMat', '#20262e', {});
    tyreMat.specularColor = Color3.FromHexString('#43536a').scale(0.45);
    tyreMat.specularPower = 26;
    this.tyre.material = tyreMat;
    this.tyreBaseEmissive = tyreMat.emissiveColor.clone();
    this.tyre.parent = this.wheelRoot;
    this.tyre.rotation.z = -Math.PI / 2;

    // Rim: an open barrel over a dark well, with spokes on the outboard face.
    const rimR = R - edge - 2;
    this.rim = CreateCylinder(
      'rim',
      { height: hw * 1.36, diameter: rimR * 2, tessellation: 56, cap: Mesh.NO_CAP },
      scene,
    );
    const rimMat = tinted(scene, 'rimMat', '#aab8c6', { emissive: 0.02 });
    rimMat.specularPower = 120;
    rimMat.specularColor = Color3.FromHexString('#dfe9f2').scale(0.45);
    rimMat.backFaceCulling = false;
    this.rim.material = rimMat;
    this.rim.parent = this.wheelRoot;
    this.rim.rotation.z = Math.PI / 2;

    const well = CreateCylinder(
      'rimWell',
      { height: hw * 1.3, diameter: rimR * 1.94, tessellation: 44, cap: Mesh.NO_CAP },
      scene,
    );
    const wellMat = tinted(scene, 'rimWellMat', '#2b333b', {});
    wellMat.backFaceCulling = false;
    well.material = wellMat;
    well.parent = this.wheelRoot;
    well.rotation.z = Math.PI / 2;
    well.isPickable = false;

    const backing = CreateCylinder(
      'rimBacking',
      { height: 3, diameter: rimR * 1.9, tessellation: 44 },
      scene,
    );
    backing.material = tinted(scene, 'rimBackingMat', '#232a31', {});
    backing.parent = this.wheelRoot;
    backing.rotation.z = Math.PI / 2;
    backing.position.x = -hw * 0.34;
    backing.isPickable = false;

    const lip = CreateTorus('rimLip', { diameter: rimR * 2 - 1.5, thickness: 2.2, tessellation: 56 }, scene);
    const lipMat = tinted(scene, 'rimLipMat', '#b9c6d2', { emissive: 0.0 });
    lipMat.specularPower = 140;
    lipMat.specularColor = Color3.FromHexString('#ffffff').scale(0.45);
    lip.material = lipMat;
    lip.parent = this.wheelRoot;
    lip.rotation.x = Math.PI / 2;
    lip.position.x = hw * 0.68;
    lip.isPickable = false;

    const spokeMat = tinted(scene, 'spokeMat', '#bdcbd8', { emissive: 0.02 });
    spokeMat.specularPower = 110;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const spoke = MeshBuilder.CreateBox(`spoke-${i}`, { width: 3.6, height: 7, depth: rimR * 0.78 }, scene);
      spoke.material = spokeMat;
      spoke.parent = this.wheelRoot;
      spoke.rotationQuaternion = Quaternion.RotationAxis(new Vector3(1, 0, 0), -a);
      spoke.position.set(hw * 0.5, Math.cos(a) * rimR * 0.45, Math.sin(a) * rimR * 0.45);
      spoke.isPickable = false;
      this.spokeMeshes.push(spoke);
    }

    const hubCap = CreateCylinder('hubCap', { height: 9, diameter: 21, tessellation: 24 }, scene);
    hubCap.material = spokeMat;
    hubCap.rotation.z = Math.PI / 2;
    hubCap.position.x = hw * 0.56;
    hubCap.parent = this.wheelRoot;
    hubCap.isPickable = false;

    this.wheelMeshes.push(this.tyre, this.rim, well, backing, lip, hubCap, ...this.spokeMeshes);
    for (const m of this.wheelMeshes) {
      // Every visible wheel surface is grabbable. The tyre and rim are open
      // shells, so the hub/spokes must be pickable too or the wheel's middle is
      // a hole the pointer falls through.
      m.isPickable = true;
      m.receiveShadows = true;
      m.metadata = { ...(m.metadata ?? {}), layer: 'wheel', part: 'wheel', draggable: true };
    }

    this.wheelAxisMesh = MeshBuilder.CreateCylinder(
      'wheelAxis',
      { height: 96, diameter: 1.6, tessellation: 8 },
      scene,
    );
    this.wheelAxisMesh.material = tinted(this.scene, 'axisMat', '#ffd166', { emissive: 0.6 });
    this.wheelAxisMesh.rotation.z = Math.PI / 2;
    this.wheelAxisMesh.parent = this.wheelRoot;
    this.wheelAxisMesh.isPickable = false;
    this.wheelAxisMesh.metadata = { layer: 'wheel' };
    this.wheelAxisMesh.setEnabled(false);
  }

  private buildShock() {
    const scene = this.scene;
    this.shockRoot = new TransformNode('shockRoot', scene);
    this.shockRoot.parent = this.root;

    this.shockBody = CreateCylinder('shockBody', { height: 1, diameter: 19, tessellation: 22 }, scene);
    this.shockBody.material = tinted(scene, 'shockBodyMat', '#c9d4e0', {});
    (this.shockBody.material as StandardMaterial).specularPower = 120;
    this.shockBody.parent = this.shockRoot;

    this.shockShaft = CreateCylinder('shockShaft', { height: 1, diameter: 8.4, tessellation: 14 }, scene);
    this.shockShaft.material = tinted(scene, 'shockShaftMat', '#eef4fa', {});
    (this.shockShaft.material as StandardMaterial).specularPower = 180;
    this.shockShaft.parent = this.shockRoot;

    const initialPath: Vector3[] = [];
    for (let i = 0; i <= 240; i++) {
      const f = i / 240;
      const a = f * SPRING_TURNS * Math.PI * 2;
      initialPath.push(new Vector3(Math.cos(a) * 14.2, f * 108, Math.sin(a) * 14.2));
    }
    this.springCoils = MeshBuilder.CreateTube(
      'spring',
      { path: initialPath, radius: 2.15, tessellation: 7, cap: Mesh.CAP_ALL, updatable: true },
      scene,
    );
    this.springCoils.material = tinted(scene, 'springMat', PART_INFO.lowerArm.tone, { emissive: 0.1 });
    (this.springCoils.material as StandardMaterial).specularPower = 150;
    this.springCoils.parent = this.shockRoot;

    this.shockEyeTop = CreateSphere('shockEyeTop', { diameter: 16, segments: 12 }, scene);
    this.shockEyeTop.material = tinted(scene, 'eyeMat', '#7d8b9c', {});
    this.shockEyeTop.parent = this.shockRoot;
    this.shockEyeBottom = CreateSphere('shockEyeBottom', { diameter: 14, segments: 12 }, scene);
    this.shockEyeBottom.material = tinted(scene, 'eyeMat2', '#7d8b9c', {});
    this.shockEyeBottom.parent = this.shockRoot;

    for (const m of [this.shockBody, this.shockShaft, this.springCoils, this.shockEyeTop, this.shockEyeBottom]) {
      m.isPickable = false;
      m.metadata = { ...(m.metadata ?? {}), layer: 'shock', part: 'shock' };
      this.shockMeshes.push(m);
    }
  }

  private buildBallJoints() {
    const scene = this.scene;
    this.ballLBJ = CreateSphere('ballLBJ', { diameter: 17, segments: 14 }, scene);
    this.ballLBJ.material = tinted(scene, 'ballMat', '#ffd166', { emissive: 0.12 });
    (this.ballLBJ.material as StandardMaterial).specularColor = Color3.FromHexString('#fff7d6').scale(0.9);
    this.ballLBJ.isPickable = false;
    this.ballLBJ.parent = this.root;
    this.ballLBJ.metadata = { layer: 'wheel' };
    this.ballUBJ = CreateSphere('ballUBJ', { diameter: 14, segments: 14 }, scene);
    this.ballUBJ.material = this.ballLBJ.material;
    this.ballUBJ.isPickable = false;
    this.ballUBJ.parent = this.root;
    this.ballUBJ.metadata = { layer: 'wheel' };
  }

  private buildSockets() {
    const scene = this.scene;
    const specs: { id: string; label: string; pos: Vec3 }[] = [
      { id: 'lowerPivot', label: '下摆臂轴位', pos: RIG.lowerPivot },
      { id: 'upperPivot', label: '上摆臂轴位', pos: RIG.upperPivot },
      { id: 'knuckleSeat', label: '转向节座', pos: RIG.knuckleSeat },
      { id: 'rackEnd', label: '齿条端', pos: RIG.rackEnd },
    ];
    for (const spec of specs) {
      const ring = CreateTorus(`socket-${spec.id}`, { diameter: 30, thickness: 2.2, tessellation: 28 }, scene);
      ring.material = tinted(scene, `socketMat-${spec.id}`, '#7dd3fc', { emissive: 0.65, alpha: 0.85 });
      ring.position = V(spec.pos);
      if (spec.id === 'lowerPivot' || spec.id === 'upperPivot') ring.rotation.x = Math.PI / 2;
      ring.isPickable = false;
      ring.parent = this.root;
      ring.metadata = { layer: 'fx', socket: spec.id };
      this.socketMarkers.set(spec.id, ring);

      const core = CreateSphere(`socketCore-${spec.id}`, { diameter: 6, segments: 10 }, scene);
      core.material = ring.material;
      core.position = V(spec.pos);
      core.isPickable = false;
      core.parent = this.root;
      core.metadata = { layer: 'fx', socket: spec.id };
      this.socketMarkers.set(`${spec.id}-core`, core);
    }
  }

  private buildMarkers() {
    const scene = this.scene;
    // Contact markers (pool of 6).
    for (let i = 0; i < 6; i++) {
      const m = CreateSphere(`contact-${i}`, { diameter: 10, segments: 10 }, scene);
      m.material = tinted(scene, `contactMat-${i}`, '#ff4d4f', { emissive: 0.85, alpha: 0.9 });
      m.isPickable = false;
      m.setEnabled(false);
      m.parent = this.root;
      m.metadata = { layer: 'fx' };
      this.contactMarkers.push(m);
    }

    // Occlusion probe cloud via thin instances (single draw call).
    this.occlusionMarkers = CreateSphere('occlusionProbes', { diameter: 4.4, segments: 6 }, scene);
    const probeMat = stdMat(scene, 'probeMat');
    probeMat.diffuseColor = Color3.White();
    probeMat.emissiveColor = Color3.FromHexString('#ffffff').scale(0.4);
    probeMat.specularColor = Color3.Black();
    this.occlusionMarkers.material = probeMat;
    this.occlusionMarkers.isPickable = false;
    this.occlusionMarkers.setEnabled(false);
    this.occlusionMarkers.parent = this.root;
    this.occlusionMarkers.metadata = { layer: 'fx' };
    this.occlusionMarkers.alwaysSelectAsActiveMesh = true;

    // Ghost parts shown while dragging a part out of the library.
    this.ghostLower = this.makeGhost('ghostLower', '#4fd1c5');
    this.ghostUpper = this.makeGhost('ghostUpper', '#63b3ed');
    this.ghostKnuckle = this.makeGhost('ghostKnuckle', '#f6ad55');
    this.ghostTie = this.makeGhost('ghostTie', '#b794f4');
  }

  private makeGhost(name: string, hex: string): Mesh {
    const mesh = CreateSphere(name, { diameter: 26, segments: 16 }, this.scene);
    const mat = stdMat(this.scene, `${name}-mat`);
    mat.diffuseColor = Color3.FromHexString(hex);
    mat.emissiveColor = Color3.FromHexString(hex).scale(0.5);
    mat.alpha = 0.45;
    mat.transparencyMode = 2;
    mesh.material = mat;
    mesh.isPickable = false;
    mesh.setEnabled(false);
    mesh.parent = this.root;
    mesh.metadata = { layer: 'fx' };
    return mesh;
  }

  /**
   * Place one leg of a wishbone: from the pivot tube end (0, 0, z0) to the outer
   * joint (len, 0, 0). The leg box is unit-sized in X so scaling.x is its length.
   */
  private placeLeg(mesh: Mesh, z0: number, len: number, heightScale = 1) {
    const dz = -z0;
    const l = Math.hypot(len, dz);
    mesh.position.set(len * 0.5, 0, z0 * 0.5);
    mesh.rotation.set(0, Math.atan2(dz, len), 0);
    mesh.scaling.set(l, heightScale, 1);
    mesh.rotationQuaternion = null;
  }

  /* ------------------------------ update ------------------------------ */

  update(opts: RigViewOptions) {
    const { dims, pose, render } = opts;

    // --- lower arm -------------------------------------------------------
    // A wishbone: a pivot tube along Z plus two tapered legs converging on the
    // ball joint, so the shape reads as an A-arm from every angle.
    const lowerLen = dims.lowerArmLength;
    const theta = (pose.lowerAngleDeg * Math.PI) / 180;
    const lowerSpan = 26;
    this.lowerArm.position = V(RIG.lowerPivot);
    this.lowerArm.rotation.z = -theta;
    this.lowerBeam.position.set(lowerLen, 0, 0);
    this.lowerBeam.scaling.set(16, 1, 1);
    this.placeLeg(this.lowerBraceA, lowerSpan, lowerLen, 1);
    this.placeLeg(this.lowerBraceB, -lowerSpan, lowerLen, 1);
    this.lowerPivotTube.position.set(0, 0, 0);
    this.lowerPivotTube.scaling.set(1, 56 / 52, 1);

    // --- upper arm -------------------------------------------------------
    const ubj = pose.ubj;
    const upDelta = sub(ubj, RIG.upperPivot);
    const upLen = Math.hypot(upDelta.x, upDelta.y) || 1;
    const upAngle = Math.atan2(-upDelta.y, upDelta.x);
    const upperSpan = 21;
    this.upperArm.position = V(RIG.upperPivot);
    this.upperArm.rotation.z = upAngle;
    this.upperBeam.position.set(upLen, 0, 0);
    this.upperBeam.scaling.set(13, 1, 1);
    this.placeLeg(this.upperBraceA, upperSpan, upLen, 1);
    this.placeLeg(this.upperBraceB, -upperSpan, upLen, 1);

    // --- knuckle ---------------------------------------------------------
    this.knuckle.position = V(pose.lbj);
    const q = pose.wheelQuat;
    this.knuckle.rotationQuaternion = new Quaternion(q.x, q.y, q.z, q.w);
    // Body sits between the ball joints.
    const kpLen = dims.kingpinLength;
    const localUp = new Vector3(-Math.sin((10 * Math.PI) / 180), Math.cos((10 * Math.PI) / 180), 0);
    this.knuckleBody.position.copyFrom(localUp.scale(kpLen * 0.5));
    this.knuckleBody.rotationQuaternion = null;
    this.knuckleBody.rotation.z = (-10 * Math.PI) / 180;
    this.knuckleBody.scaling.set(1, kpLen / 46, 1);
    this.knuckleHub.position.set(dims.hubOffset, dims.hubHeight, 0);
    this.brakeDisc.position.set(dims.hubOffset + dims.wheelWidth * 0.06, dims.hubHeight, 0);

    // --- tie rod ---------------------------------------------------------
    orientBetween(this.tieRodRod, pose.rackEnd, pose.tieOuter);
    this.tieBallInner.position = V(pose.rackEnd);
    this.tieBallOuter.position = V(pose.tieOuter);

    // --- wheel -----------------------------------------------------------
    this.wheelRoot.position = V(pose.wheelCenter);
    this.wheelRoot.rotationQuaternion = new Quaternion(q.x, q.y, q.z, q.w);
    // Wheel geometry scales with the tyre size; all wheel meshes share the same
    // local frame so one scale keeps proportions consistent.
    const radiusScale = dims.wheelRadius / 62;
    const widthScale = dims.wheelWidth / 44;
    for (const m of this.wheelMeshes) {
      if (m.name === 'rimLip') {
        m.scaling.set(radiusScale, radiusScale, radiusScale);
        continue;
      }
      if (m.name.startsWith('spoke-')) {
        m.scaling.set(1, radiusScale, radiusScale);
        continue;
      }
      if (m.name === 'hubCap') {
        m.scaling.set(1, radiusScale, radiusScale);
        continue;
      }
      m.scaling.set(radiusScale, widthScale, radiusScale);
    }
    const spokeRadius = dims.wheelRadius * 0.45;
    for (let i = 0; i < this.spokeMeshes.length; i++) {
      const a = (i / this.spokeMeshes.length) * Math.PI * 2;
      this.spokeMeshes[i].position.set(
        dims.wheelWidth * 0.5,
        Math.cos(a) * spokeRadius,
        Math.sin(a) * spokeRadius,
      );
    }
    const lipMesh = this.scene.getMeshByName('rimLip');
    if (lipMesh) lipMesh.position.x = dims.wheelWidth * 0.68;
    const hubMesh = this.scene.getMeshByName('hubCap');
    if (hubMesh) hubMesh.position.x = dims.wheelWidth * 0.56;
    const backingMesh = this.scene.getMeshByName('rimBacking');
    if (backingMesh) backingMesh.position.x = -dims.wheelWidth * 0.34;
    this.wheelAxisMesh.scaling.set(1, Math.max(0.6, dims.wheelWidth / 44), 1);
    this.wheelAxisMesh.setEnabled(render.showOcclusionProbes);

    // --- shock -----------------------------------------------------------
    const top = pose.shock.top;
    const bottom = pose.shock.lower;
    const axis = sub(bottom, top);
    const total = Math.hypot(axis.x, axis.y, axis.z) || 1;
    const bodyLen = total * 0.52;
    const shaftLen = total * 0.56;
    const bodyEnd = add(top, scale(axis, bodyLen / total));
    orientBetween(this.shockBody, top, bodyEnd);
    orientBetween(this.shockShaft, add(bottom, scale(axis, -shaftLen / total)), add(bottom, scale(axis, 0.02)));
    this.shockEyeTop.position = V(top);
    this.shockEyeBottom.position = V(bottom);

    // Spring tiled between the seats; compressing shortens the pitch, not the coils.
    const springBottom = add(bottom, scale(sub(top, bottom), 0.16));
    const springTop = add(top, scale(sub(bottom, top), 0.18));
    this.updateSpring(springBottom, springTop);

    // --- sockets ---------------------------------------------------------
    const showSockets = render.showSockets;
    for (const [id, mesh] of this.socketMarkers) {
      mesh.setEnabled(showSockets);
      if (id === 'knuckleSeat') mesh.position = V(pose.lbj);
      if (id === 'rackEnd') mesh.position = V(pose.rackEnd);
    }

    // --- ball joints -----------------------------------------------------
    this.ballLBJ.position = V(pose.lbj);
    this.ballUBJ.position = V(pose.ubj);

    // --- contact markers -------------------------------------------------
    const showContacts = render.showContactMarkers;
    for (let i = 0; i < this.contactMarkers.length; i++) {
      const c = opts.contacts[i];
      const m = this.contactMarkers[i];
      if (!c || !showContacts) {
        m.setEnabled(false);
        continue;
      }
      m.setEnabled(true);
      m.position = V(c.point);
      const s = 0.7 + Math.min(2.2, c.depth * 0.35);
      m.scaling.setAll(s);
    }

    this.applyOcclusionProbes(opts.occlusion, render.showOcclusionProbes);

    // --- visibility ------------------------------------------------------
    const vis = opts.visibleParts;
    const setVis = (meshes: Mesh[], on: boolean) => meshes.forEach((m) => m.setEnabled(on));
    setVis(this.lowerMeshes, vis.lowerArm !== false);
    setVis(this.upperMeshes, vis.upperArm !== false);
    setVis(this.knuckleMeshes, vis.knuckle !== false);
    setVis(this.tieMeshes, vis.tieRod !== false);
    setVis(this.wheelMeshes, vis.wheel !== false);
    setVis(this.shockMeshes, vis.shock !== false);


  }

  /**
   * Rebuild the coil in world space for the current shock length.
   *
   * The tube is rebuilt (not scaled) because non-uniform scaling would stretch
   * the helix radially as the shock compresses, which reads as a giant glowing
   * cone. The coil count stays constant so the spring visibly binds.
   */
  private updateSpring(bottom: Vec3, top: Vec3) {
    const dir = sub(top, bottom);
    const len = Math.hypot(dir.x, dir.y, dir.z) || 1;
    const radius = 14.2;
    const n = 240;
    const pts: Vector3[] = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const a = f * SPRING_TURNS * Math.PI * 2;
      pts.push(new Vector3(Math.cos(a) * radius, (0.04 + 0.92 * f) * len, Math.sin(a) * radius));
    }
    const mesh = MeshBuilder.CreateTube(
      'spring',
      { path: pts, radius: 2.15, tessellation: 7, cap: Mesh.CAP_ALL, instance: this.springCoils },
      this.scene,
    );
    this.springCoils = mesh;
    const axis = new Vector3(dir.x, dir.y, dir.z).normalize();
    const q = Quaternion.FromUnitVectorsToRef(new Vector3(0, 1, 0), axis, new Quaternion(), 1e-6);
    mesh.rotationQuaternion = q;
    mesh.position = V(bottom);
    mesh.scaling.set(1, 1, 1);
    mesh.metadata = { layer: 'shock', part: 'shock' };
    mesh.isPickable = false;
    mesh.receiveShadows = true;
    this.shockMeshes[2] = mesh;
  }

  private applyOcclusionProbes(report: OcclusionReport | null, enabled: boolean) {
    const mesh = this.occlusionMarkers;
    if (!enabled || !report || report.points.length === 0) {
      mesh.setEnabled(false);
      mesh.thinInstanceCount = 0;
      return;
    }
    mesh.setEnabled(true);
    const n = report.points.length;
    const m = Matrix.Identity();
    const buf = new Float32Array(n * 16);
    const col = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const p = report.points[i];
      Matrix.TranslationToRef(p.position.x, p.position.y, p.position.z, m);
      m.copyToArray(buf, i * 16);
      if (p.hidden) {
        col[i * 4] = 1;
        col[i * 4 + 1] = 0.28;
        col[i * 4 + 2] = 0.32;
      } else {
        col[i * 4] = 0.36;
        col[i * 4 + 1] = 0.92;
        col[i * 4 + 2] = 0.55;
      }
      col[i * 4 + 3] = 1;
    }
    mesh.thinInstanceSetBuffer('matrix', buf, 16, false);
    mesh.thinInstanceSetBuffer('color', col, 4, false);
    mesh.thinInstanceCount = n;
  }

  /* --------------------------- layer order --------------------------- */

  applyLayerOrder(order: LayerId[]) {
    const groups = renderingGroupsFor(order);
    const zOff = zOffsetsFor(order);
    for (const mesh of this.root.getChildMeshes(false)) {
      const layer = mesh.metadata?.layer as LayerId | undefined;
      if (!layer || !(layer in groups)) continue;
      mesh.renderingGroupId = groups[layer];
      const mat = mesh.material as StandardMaterial | null;
      if (mat) {
        mat.zOffset = zOff[layer];
        mat.zOffsetUnits = 0;
      }
      mesh.receiveShadows = true;
    }
    this.applyChassisLayerGroups(order, groups, zOff);
    const maxGroup = order.length;
    for (let g = 1; g <= maxGroup; g++) {
      // Shared depth buffer across layers: geometric occlusion stays correct,
      // only the draw order and polygon bias change.
      this.scene.setRenderingAutoClearDepthStencil(g, false, false, false);
    }
    this.scene.setRenderingAutoClearDepthStencil(0, true, true, true);
  }

  /**
   * Paint overlapping surfaces hot. When the tyre intersects the chassis or the
   * shock body, the offending colliders glow red — this is the "穿插处高亮"
   * the design calls for, and it is driven by the same mm-accurate contact
   * report that the HUD shows.
   */
  highlightContacts(contacts: Contact[]) {
    const active = new Set(contacts.map((c) => c.target));
    for (const [id, state] of this.contactGlow) {
      if (!active.has(id)) {
        state.mat.emissiveColor = state.base;
        state.on = false;
      }
    }
    for (const c of contacts) {
      const entry = this.contactGlow.get(c.target);
      if (!entry) continue;
      const strength = Math.min(0.55, 0.2 + c.depth * 0.07);
      entry.mat.emissiveColor = Color3.FromHexString('#ff3346').scale(strength);
      entry.on = true;
    }
    // The tyre itself also glows so the overlap is visible on the moving part.
    const worst = contacts.reduce((a, b) => (b.depth > a ? b.depth : a), 0);
    const tyreMat = this.tyre?.material as StandardMaterial | null;
    if (tyreMat) {
      const base = this.tyreBaseEmissive;
      tyreMat.emissiveColor =
        worst > 0.4 ? Color3.FromHexString('#8f1420').scale(Math.min(0.38, 0.12 + worst * 0.045)) : base;
    }
  }

  /** Register static chassis meshes so layer order and visibility apply. */
  private chassisMeshes: Mesh[] = [];
  private bodyOffsetY = 0;

  private applyChassisLayerGroups(
    order: LayerId[],
    groups: Record<LayerId, number>,
    zOff: Record<LayerId, number>,
  ) {
    for (const mesh of this.chassisMeshes) {
      mesh.renderingGroupId = groups.chassis;
      const mat = mesh.material as StandardMaterial | null;
      if (mat) {
        mat.zOffset = zOff.chassis;
        mat.zOffsetUnits = 0;
      }
    }
    void order;
  }

  /**
   * Attach the static chassis under the rig root so it takes part in the
   * ride-height offset (the body moves, the wheel stays on the ground).
   */
  registerChassis(meshes: Mesh[], chassisRoot?: TransformNode) {
    if (chassisRoot) chassisRoot.parent = this.root;
    this.chassisMeshes = meshes.filter((m) => m.metadata?.layer === 'chassis');
    // Each collider needs its OWN material instance. Cloning per source material
    // would still let two colliders share one clone (the chassis reuses a few
    // materials), and glowing it would paint the whole car red.
    for (const m of this.chassisMeshes) {
      const colliderId = m.metadata?.colliderId as string | undefined;
      const mat = m.material as StandardMaterial | null;
      if (!colliderId || !mat) continue;
      const own = mat.clone(`${mat.name}-${m.name}`);
      own.emissiveColor = mat.emissiveColor.clone();
      m.material = own;
      this.contactGlow.set(colliderId, { mat: own, base: own.emissiveColor.clone(), on: false });
    }
    const shock = this.shockMeshes[0]?.material as StandardMaterial | undefined;
    if (shock) this.contactGlow.set('shock', { mat: shock, base: shock.emissiveColor.clone(), on: false });
  }

  setChassisVisible(on: boolean) {
    for (const mesh of this.chassisMeshes) mesh.setEnabled(on);
  }

  /**
   * Ride height: the preview keeps the wheel on the ground and moves the body,
   * which is what a real corner does. `offsetY` is minus the wheel-centre travel
   * in rig space.
   */
  setBodyOffset(offsetY: number) {
    this.bodyOffsetY = offsetY;
    this.root.position.y = offsetY;
  }

  getBodyOffset(): number {
    return this.bodyOffsetY;
  }

  addShadowCasters(casters: Mesh[]) {
    casters.forEach((m) => {
      m.receiveShadows = true;
    });
  }

  /** All meshes that should cast shadows. */
  shadowCasterMeshes(): Mesh[] {
    return [
      ...this.lowerMeshes,
      ...this.upperMeshes,
      ...this.knuckleMeshes,
      ...this.tieMeshes,
      ...this.wheelMeshes,
      ...this.shockMeshes,
    ];
  }

  setGhost(part: string | null, at: Vec3 | null, snapOk: boolean) {
    const map: Record<string, Mesh> = {
      lowerArm: this.ghostLower,
      upperArm: this.ghostUpper,
      knuckle: this.ghostKnuckle,
      tieRod: this.ghostTie,
    };
    for (const [key, mesh] of Object.entries(map)) {
      const active = part === key && at !== null;
      mesh.setEnabled(active);
      if (active && at) {
        mesh.position = V(at);
        const mat = mesh.material as StandardMaterial;
        const hex = snapOk ? '#68d391' : '#f56565';
        mat.diffuseColor = Color3.FromHexString(hex);
        mat.emissiveColor = Color3.FromHexString(hex).scale(0.55);
      }
    }
  }

  /** Screen-space position of a world point (CSS pixels). */
  screenPoint(
    viewport: { width: number; height: number },
    worldToClip: (v: Vec3) => { x: number; y: number; z: number },
    p: Vec3,
  ): { x: number; y: number } {
    const c = worldToClip(p);
    return {
      x: (c.x * 0.5 + 0.5) * viewport.width,
      y: (1 - (c.y * 0.5 + 0.5)) * viewport.height,
    };
  }

  wheelShapeFor(pose: Pose, dims: SuspensionDims) {
    return wheelShapeOf(pose, dims);
  }

  /** Meshes the user can grab to drag the arm. */
  dragMeshes(): Mesh[] {
    return [...this.lowerMeshes, ...this.wheelMeshes];
  }

  dispose() {
    this.root.dispose(false, true);
  }
}

export { LAYER_IDS };
export type { Color4 };
