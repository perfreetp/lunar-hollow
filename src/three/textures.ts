/**
 * Procedural canvas textures for the apron surface.
 *
 * Everything is drawn once into an offscreen canvas and used as a repeating
 * texture, so there are no external image assets to load and the markings stay
 * crisp under both camera modes.
 */

import * as THREE from 'three'

/** Length in meters of one side of the square apron ground plane. */
export const APRON_SIZE = 320

export interface ApronTextureSet {
  /** Large concrete slab, tiled across the slab. */
  concrete: THREE.Texture
  /** Alpha mask of the taxi/traffic lanes. */
  markings: THREE.Texture
  dispose: () => void
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  return [canvas, ctx]
}

/** Deterministic noise so the ground does not shimmer between reloads. */
function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

function concreteTexture(): THREE.CanvasTexture {
  const size = 512
  const [canvas, ctx] = makeCanvas(size)
  ctx.fillStyle = '#4a5058'
  ctx.fillRect(0, 0, size, size)

  // Slab joints.
  ctx.strokeStyle = 'rgba(20,24,28,0.55)'
  ctx.lineWidth = 3
  for (let i = 0; i <= 4; i++) {
    const p = (i / 4) * size
    ctx.beginPath()
    ctx.moveTo(p, 0)
    ctx.lineTo(p, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, p)
    ctx.lineTo(size, p)
    ctx.stroke()
  }

  // Speckle + oil stains.
  const img = ctx.getImageData(0, 0, size, size)
  const data = img.data
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const grain = (noise(x * 0.7, y * 0.7) - 0.5) * 18
      const blotch = Math.sin(x * 0.012) * Math.cos(y * 0.017) * 6
      data[i] = Math.max(0, Math.min(255, data[i] + grain + blotch))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain + blotch))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain + blotch))
    }
  }
  ctx.putImageData(img, 0, 0)

  for (let i = 0; i < 22; i++) {
    const cx = noise(i * 3.1, 1.7) * size
    const cy = noise(2.3, i * 4.4) * size
    const r = 6 + noise(i * 5.5, 9.1) * 34
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, 'rgba(24,26,30,0.22)')
    grad.addColorStop(1, 'rgba(24,26,30,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/**
 * Apron markings drawn as an alpha mask, composited over the concrete by a
 * separate transparent plane. Keeping markings off the concrete UVs means they
 * never blur together with the slab detail.
 */
function markingTexture(): THREE.CanvasTexture {
  const size = 1024
  const [canvas, ctx] = makeCanvas(size)
  ctx.clearRect(0, 0, size, size)

  // The texture maps the apron's WORLD_SIZE square (see apron.ts); the
  // playfield origin is the texture center, hence the +size/2 offsets.
  const world = APRON_SIZE
  const px = size / world
  const toPx = (m: number): number => m * px
  const X = (m: number): number => size / 2 + toPx(m)
  const Z = (m: number): number => size / 2 + toPx(m)

  // --- Service road running east-west, behind the stands. -------------
  const roadZ = 62
  ctx.strokeStyle = 'rgba(240,232,190,0.85)'
  ctx.lineWidth = toPx(0.35)
  ctx.beginPath()
  ctx.moveTo(X(-150), Z(roadZ))
  ctx.lineTo(X(150), Z(roadZ))
  ctx.stroke()
  // Dashed centerline.
  ctx.setLineDash([toPx(3), toPx(3)])
  ctx.strokeStyle = 'rgba(240,232,190,0.55)'
  ctx.beginPath()
  ctx.moveTo(X(-150), Z(roadZ))
  ctx.lineTo(X(150), Z(roadZ))
  ctx.stroke()
  ctx.setLineDash([])

  // --- Stand lead-in lines and stand boxes. ---------------------------
  const standLabels = ['A12', 'A14', 'A16']
  standLabels.forEach((label, i) => {
    const cx = X((i - 1) * 78)
    const cy = Z(0)

    // Lead-in line from the service road up to the nose stop bar.
    ctx.strokeStyle = 'rgba(240,232,190,0.8)'
    ctx.lineWidth = toPx(0.4)
    ctx.beginPath()
    ctx.moveTo(cx, Z(46))
    ctx.lineTo(cx, Z(25))
    ctx.stroke()

    // Stand box.
    ctx.strokeStyle = 'rgba(240,232,190,0.6)'
    ctx.lineWidth = toPx(0.3)
    ctx.strokeRect(cx - toPx(22), cy - toPx(24), toPx(44), toPx(50))

    // Stop bar across the nose gear.
    ctx.strokeStyle = 'rgba(230,180,60,0.85)'
    ctx.lineWidth = toPx(0.5)
    ctx.beginPath()
    ctx.moveTo(cx - toPx(9), cy - toPx(24))
    ctx.lineTo(cx + toPx(9), cy - toPx(24))
    ctx.stroke()

    // Stand number on the lead-in.
    ctx.fillStyle = 'rgba(240,232,190,0.9)'
    ctx.font = `bold ${toPx(5)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(label, cx, Z(53))

    // Equipment staging box.
    ctx.strokeStyle = 'rgba(120,200,255,0.35)'
    ctx.lineWidth = toPx(0.2)
    ctx.setLineDash([toPx(1.2), toPx(1.2)])
    ctx.strokeRect(cx - toPx(8), cy + toPx(18), toPx(16), toPx(10))
    ctx.setLineDash([])
  })

  // --- Taxiway centerline at the north edge. --------------------------
  ctx.strokeStyle = 'rgba(250,210,70,0.9)'
  ctx.lineWidth = toPx(0.6)
  ctx.beginPath()
  ctx.moveTo(0, Z(-96))
  ctx.lineTo(size, Z(-96))
  ctx.stroke()

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

export function buildApronTextures(): ApronTextureSet {
  const concrete = concreteTexture()
  const markings = markingTexture()
  concrete.repeat.set(10, 10)
  return {
    concrete,
    markings,
    dispose: () => {
      concrete.dispose()
      markings.dispose()
    },
  }
}
