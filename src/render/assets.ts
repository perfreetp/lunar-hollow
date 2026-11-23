import {
  Color3,
  Color4,
  CreateBox,
  CreateCylinder,
  CreateGround,
  CreateSphere,
  CreateTorus,
  CreateTube,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { CHASSIS_BOXES, RIG } from '../core/rigSpec';
import type { BoxCollider } from '../core/model';

export interface AssetSpec {
  name: string;
  mesh: Mesh;
  material: StandardMaterial;
  layer: 'chassis' | 'shock' | 'wheel' | 'fx';
}

const toV = (p: { x: number; y: number; z: number }) => new Vector3(p.x, p.y, p.z);

export function std(scene: Scene, name: string, hex: string): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = Color3.FromHexString(hex);
  mat.specularColor = Color3.FromHexString('#7d93a8').scale(0.35);
  mat.specularPower = 42;
  mat.ambientColor = Color3.FromHexString(hex).scale(0.4);
  return mat;
}

/** Arc path in the XY plane around `centre`, extruded later along Z. */
export function arcPath(
  centre: { x: number; y: number },
  radius: number,
  fromDeg: number,
  toDeg: number,
  segments = 26,
  z = 0,
): Vector3[] {
  const pts: Vector3[] = [];
  const a0 = (fromDeg * Math.PI) / 180;
  const a1 = (toDeg * Math.PI) / 180;
  for (let i = 0; i <= segments; i++) {
    const a = a0 + ((a1 - a0) * i) / segments;
    pts.push(new Vector3(centre.x + Math.cos(a) * radius, centre.y + Math.sin(a) * radius, z));
  }
  return pts;
}

/** Grid floor + reference axes. */
export function buildGround(scene: Scene): { root: Mesh; grid: Mesh[] } {
  const floor = CreateGround('floor', { width: 2400, height: 2400, subdivisions: 1 }, scene);
  const floorMat = std(scene, 'floorMat', '#0c1219');
  floorMat.specularColor = Color3.FromHexString('#2c3b4d').scale(0.4);
  floorMat.specularPower = 20;
  floor.material = floorMat;
  floor.position.y = RIG.groundY;
  floor.isPickable = false;
  floor.receiveShadows = true;
  floor.metadata = { layer: 'ground' };

  const grid: Mesh[] = [];
  const lines: Vector3[][] = [];
  const colors: Color4[][] = [];
  const minor = Color4.FromHexString('#16202cff');
  const major = Color4.FromHexString('#22303fff');
  for (let i = -8; i <= 8; i++) {
    const v = i * 50;
    const c = i % 2 === 0 ? major : minor;
    lines.push([new Vector3(v, 0.4, -420), new Vector3(v, 0.4, 420)]);
    colors.push([c, c]);
    lines.push([new Vector3(-420, 0.4, v), new Vector3(420, 0.4, v)]);
    colors.push([c, c]);
  }
  const gridMesh = MeshBuilder.CreateLineSystem('grid', { lines, colors, updatable: false }, scene);
  gridMesh.isPickable = false;
  gridMesh.alwaysSelectAsActiveMesh = true;
  grid.push(gridMesh);

  const axes: Vector3[][] = [
    [new Vector3(0, 0.6, 0), new Vector3(110, 0.6, 0)],
    [new Vector3(0, 0.6, 0), new Vector3(0, 110, 0)],
    [new Vector3(0, 0.6, 0), new Vector3(0, 0.6, 110)],
  ];
  const axisColors: Color4[][] = [
    [Color4.FromHexString('#ff6b6bcc'), Color4.FromHexString('#ff6b6bcc')],
    [Color4.FromHexString('#68d391cc'), Color4.FromHexString('#68d391cc')],
    [Color4.FromHexString('#63b3edcc'), Color4.FromHexString('#63b3edcc')],
  ];
  const axisMesh = MeshBuilder.CreateLineSystem('axes', { lines: axes, colors: axisColors }, scene);
  axisMesh.isPickable = false;
  grid.push(axisMesh);

  return { root: floor, grid };
}

/**
 * The visible wheel arch band. Its inner face sits where the `arch` collider's
 * underside is, so what the eye sees matches what the clearance check measures.
 */
export const ARCH = {
  centre: { x: 163, y: 86 },
  innerRadius: 68,
  outerRadius: 78,
  // A partial arc over the top of the wheel: a full 180° band would hide the
  // linkage and the tyre from the default camera.
  from: 46,
  to: 134,
  halfDepth: 24,
};

export interface ChassisMeshes {
  boxes: Record<string, Mesh>;
  root: Mesh;
  colliders: BoxCollider[];
  all: Mesh[];
}

/**
 * Chassis built so the *visible* surfaces coincide with the colliders the solver
 * tests, plus a wheel arch and shock tower that read at a glance.
 */
export function buildChassis(scene: Scene): ChassisMeshes {
  const plate = std(scene, 'chassisPlate', '#3d4c60');
  plate.specularColor = Color3.FromHexString('#9fb4c8').scale(0.55);
  plate.specularPower = 90;
  const dark = std(scene, 'chassisDark', '#26313e');
  dark.specularColor = Color3.FromHexString('#6d8296').scale(0.4);
  const accent = std(scene, 'chassisAccent', '#576879');
  accent.specularColor = Color3.FromHexString('#c9d8e6').scale(0.55);
  accent.specularPower = 110;
  const anodized = std(scene, 'chassisAnodized', '#3f6f8f');
  anodized.specularColor = Color3.FromHexString('#a9d7f2').scale(0.6);

  const root = new Mesh('chassisRoot', scene);
  const all: Mesh[] = [];
  const boxes: Record<string, Mesh> = {};

  const add = (mesh: Mesh, mat: StandardMaterial, edges = true) => {
    mesh.metadata = { ...(mesh.metadata ?? {}), layer: 'chassis' };
    mesh.material = mat;
    mesh.parent = root;
    mesh.isPickable = false;
    mesh.receiveShadows = true;
    mesh.enableEdgesRendering(0.995);
    mesh.edgesWidth = 1.0;
    mesh.edgesColor = new Color4(0.48, 0.62, 0.78, 0.3);
    all.push(mesh);
    return mesh;
  };

  // --- collider-backed volumes ---------------------------------------
  for (const box of CHASSIS_BOXES) {
    // The arch is drawn as the swept band below, not as a box.
    if (box.id === 'arch') continue;
    const mesh = CreateBox(
      `chassis-${box.id}`,
      { width: box.half.x * 2, height: box.half.y * 2, depth: box.half.z * 2 },
      scene,
    );
    mesh.position = toV(box.center);
    const mat = box.id === 'tower' ? anodized : box.id === 'arch' ? accent : plate;
    add(mesh, mat);
    mesh.metadata = { layer: 'chassis', colliderId: box.id };
    boxes[box.id] = mesh;
  }

  // --- wheel arch: the visible face of the `arch` collider --------------
  const archOuter = arcPath(ARCH.centre, ARCH.outerRadius, ARCH.from, ARCH.to, 30);
  const archInner = arcPath(ARCH.centre, ARCH.innerRadius, ARCH.from, ARCH.to, 30);
  const fender = MeshBuilder.CreateRibbon(
    'chassis-fender',
    {
      pathArray: [
        archOuter.map((p) => new Vector3(p.x, p.y, -ARCH.halfDepth)),
        archInner.map((p) => new Vector3(p.x, p.y, -ARCH.halfDepth)),
        archInner.map((p) => new Vector3(p.x, p.y, ARCH.halfDepth)),
        archOuter.map((p) => new Vector3(p.x, p.y, ARCH.halfDepth)),
        archOuter.map((p) => new Vector3(p.x, p.y, -ARCH.halfDepth)),
      ],
      closeArray: false,
      closePath: false,
      sideOrientation: Mesh.DOUBLESIDE,
      updatable: false,
    },
    scene,
  );
  add(fender, plate, false);
  // The fender is the visible face of the `arch` collider; tag it so the
  // contact highlight can light it up when the tyre rubs through.
  fender.metadata = { layer: 'chassis', colliderId: 'arch' };

  for (const z of [-ARCH.halfDepth, ARCH.halfDepth]) {
    const lip = CreateTube(
      `chassis-archLip${z}`,
      {
        path: arcPath(ARCH.centre, ARCH.innerRadius, ARCH.from, ARCH.to, 34, z),
        radius: 2.1,
        tessellation: 8,
        cap: Mesh.CAP_ALL,
      },
      scene,
    );
    add(lip, accent, false);
  }

  // --- visible detail -------------------------------------------------
  // Pivot bosses for both A-arm axes; the arms pivot on these.
  for (const [name, p, d] of [
    ['lower', RIG.lowerPivot, 52],
    ['upper', RIG.upperPivot, 44],
  ] as const) {
    const boss = CreateCylinder(`chassis-boss-${name}`, { height: d, diameter: 20, tessellation: 22 }, scene);
    boss.rotation.x = Math.PI / 2;
    boss.position = new Vector3(p.x, p.y, 0);
    add(boss, anodized, false);
    const cap = CreateCylinder(`chassis-bossCap-${name}`, { height: d + 5, diameter: 9, tessellation: 18 }, scene);
    cap.rotation.x = Math.PI / 2;
    cap.position = new Vector3(p.x, p.y, 0);
    add(cap, plate, false);
  }

  // Top deck carrying the upper pivot boss.
  const deck = CreateBox('chassis-deck', { width: 62, height: 5, depth: 96 }, scene);
  deck.position = new Vector3(34, 104, 0);
  add(deck, accent);

  // Shock tower: plates + top brace + back stay.
  for (const z of [-40, -20]) {
    const towerPlate = CreateBox(`chassis-towerPlate${z}`, { width: 30, height: 86, depth: 5 }, scene);
    towerPlate.position = new Vector3(70, 126, z);
    add(towerPlate, anodized);
  }
  const towerBrace = CreateBox('chassis-towerBrace', { width: 18, height: 10, depth: 25 }, scene);
  towerBrace.position = new Vector3(70, 160, -30);
  add(towerBrace, anodized);
  const towerStay = CreateBox('chassis-towerStay', { width: 56, height: 7, depth: 7 }, scene);
  towerStay.position = new Vector3(46, 118, -30);
  towerStay.rotation.z = -0.62;
  add(towerStay, dark);

  // Roll-hoop style tube for silhouette.
  const mast = CreateTube(
    'chassis-mast',
    {
      path: [
        new Vector3(6, 66, -66),
        new Vector3(14, 118, -58),
        new Vector3(44, 152, -42),
        new Vector3(70, 158, -32),
      ],
      radius: 3,
      tessellation: 8,
      cap: Mesh.CAP_ALL,
    },
    scene,
  );
  add(mast, dark, false);

  // Steering rack + housing.
  const rack = CreateCylinder('chassis-rack', { height: 130, diameter: 11, tessellation: 18 }, scene);
  rack.rotation.x = Math.PI / 2;
  rack.position = new Vector3(64, 76, 0);
  add(rack, dark, false);
  const rackBoss = CreateCylinder('chassis-rackBoss', { height: 15, diameter: 17, tessellation: 16 }, scene);
  rackBoss.position = new Vector3(66, 76, -36);
  add(rackBoss, anodized, false);

  // Tub floor stiffener ribs.
  for (const z of [-34, 0, 34]) {
    const rib = CreateBox(`chassis-rib${z}`, { width: 104, height: 4, depth: 5 }, scene);
    rib.position = new Vector3(44, 20, z);
    add(rib, accent, false);
  }

  return { boxes, root, colliders: CHASSIS_BOXES as BoxCollider[], all };
}

/** Small helper: a ball joint sphere. */
export function ballJoint(scene: Scene, name: string, diameter: number, hex: string): Mesh {
  const mesh = CreateSphere(name, { diameter, segments: 14 }, scene);
  const mat = std(scene, `${name}-mat`, hex);
  mat.specularColor = Color3.FromHexString('#ffffff').scale(0.85);
  mat.specularPower = 120;
  mesh.material = mat;
  mesh.isPickable = false;
  return mesh;
}

export function torusRing(
  scene: Scene,
  name: string,
  diameter: number,
  thickness: number,
  hex: string,
  glow = 0.35,
): Mesh {
  const mesh = CreateTorus(name, { diameter, thickness, tessellation: 40 }, scene);
  const mat = std(scene, `${name}-mat`, hex);
  mat.emissiveColor = Color3.FromHexString(hex).scale(glow);
  mesh.material = mat;
  mesh.isPickable = false;
  return mesh;
}

export { toV };
