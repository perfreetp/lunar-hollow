/**
 * Shared head-mesh topology. Vertex 0 is the centre of the head, rings
 * 1..RINGS cover the membrane (rho 0..1), and the last COLLAR rings wrap over
 * the bearing edge into the hoop. All geometry and simulation code must use
 * this layout.
 */
export const SEG = 96;
export const RINGS = 36;
export const COLLAR = 5;
export const TOTAL_RINGS = RINGS + COLLAR;
export const VERT_COUNT = 1 + TOTAL_RINGS * SEG;
export const MEMBRANE_VERTS = 1 + RINGS * SEG;
export const TRIANGLE_COUNT = SEG + (TOTAL_RINGS - 1) * SEG * 2;

export function wrapJ(j: number): number {
  return ((j % SEG) + SEG) % SEG;
}

export function vertexIndex(ring: number, j: number): number {
  if (ring <= 0) return 0;
  return 1 + (ring - 1) * SEG + wrapJ(j);
}

/**
 * Normalised radius of a ring: exactly 1 at the bearing edge. The collar
 * turns barely outward and mostly down, so it tucks behind the hoop instead
 * of flaring into a visible disc.
 */
export function ringRho(ring: number): number {
  if (ring <= RINGS) return ring / RINGS;
  return 1 + ((ring - RINGS) / COLLAR) * 0.018;
}

/** How far down over the bearing edge a collar ring sits, 0..1. */
export function collarDrop(ring: number): number {
  if (ring <= RINGS) return 0;
  const u = (ring - RINGS) / COLLAR;
  return Math.pow(u, 1.15);
}

/**
 * Index buffer, wound so the top face of the head is the front face and the
 * explicit up-facing vertex normals light correctly from above.
 */
export function buildIndexArray(): Uint32Array {
  const out = new Uint32Array(TRIANGLE_COUNT * 3);
  let t = 0;
  for (let j = 0; j < SEG; j++) {
    out[t++] = 0;
    out[t++] = vertexIndex(1, j + 1);
    out[t++] = vertexIndex(1, j);
  }
  for (let r = 1; r < TOTAL_RINGS; r++) {
    for (let j = 0; j < SEG; j++) {
      const a = vertexIndex(r, j);
      const b = vertexIndex(r + 1, j);
      const c = vertexIndex(r, j + 1);
      const d = vertexIndex(r + 1, j + 1);
      out[t++] = a;
      out[t++] = c;
      out[t++] = b;
      out[t++] = c;
      out[t++] = d;
      out[t++] = b;
    }
  }
  return out;
}

/**
 * Grid normals from central differences in (ring, segment) space, written into
 * `out` as xyz per vertex. n = tangentTheta x tangentRing, which points up out
 * of the head for the winding above.
 */
export function computeGridNormals(positions: Float32Array, out: Float32Array): void {
  for (let ring = 0; ring <= TOTAL_RINGS; ring++) {
    const upRing = ring === 0 ? 0 : ring - 1;
    const dnRing = ring >= TOTAL_RINGS ? TOTAL_RINGS : ring + 1;
    for (let j = 0; j < SEG; j++) {
      const v = vertexIndex(ring, j);
      const p = v * 3;

      // Radial tangent.
      let rx: number;
      let ry: number;
      let rz: number;
      if (ring === 0) {
        const a = vertexIndex(1, j);
        rx = positions[a * 3];
        ry = positions[a * 3 + 1];
        rz = positions[a * 3 + 2];
      } else if (ring === TOTAL_RINGS) {
        const a = vertexIndex(ring - 1, j);
        rx = positions[p] - positions[a * 3];
        ry = positions[p + 1] - positions[a * 3 + 1];
        rz = positions[p + 2] - positions[a * 3 + 2];
      } else {
        const a = vertexIndex(upRing, j);
        const b = vertexIndex(dnRing, j);
        rx = positions[b * 3] - positions[a * 3];
        ry = positions[b * 3 + 1] - positions[a * 3 + 1];
        rz = positions[b * 3 + 2] - positions[a * 3 + 2];
      }

      // Angular tangent.
      let tx: number;
      let ty: number;
      let tz: number;
      const base = ring === 0 ? 1 : 1 + (ring - 1) * SEG;
      const a0 = ring === 0 ? vertexIndex(1, j - 1) : base + wrapJ(j - 1);
      const a1 = ring === 0 ? vertexIndex(1, j + 1) : base + wrapJ(j + 1);
      tx = positions[a1 * 3] - positions[a0 * 3];
      ty = positions[a1 * 3 + 1] - positions[a0 * 3 + 1];
      tz = positions[a1 * 3 + 2] - positions[a0 * 3 + 2];

      // n = t x r
      let nx = ty * rz - tz * ry;
      let ny = tz * rx - tx * rz;
      let nz = tx * ry - ty * rx;

      if (ring === 0) {
        // At the pole the radial tangent is degenerate; blend in the axis so
        // the centre is lit smoothly.
        nx = 0;
        ny = 1;
        nz = 0;
      }
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      out[p] = nx / len;
      out[p + 1] = ny / len;
      out[p + 2] = nz / len;
    }
  }
}
