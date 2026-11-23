/**
 * Troika text label layer.
 *
 * Two label families:
 *  - crew role chips, always camera-facing, mounted over each person;
 *  - stand placards, mounted at the rear of each stand.
 *
 * Every label is a separate `Text` object sharing one font and one material
 * base. Troika caches SDF glyphs globally, so 30+ labels cost a few dozen
 * glyph SDFs in total. Labels are parked in the transparent, non-depth-writing
 * pass and sorted by distance to avoid blending artefacts.
 *
 * Billboarding: troika's `Text` overrides `onBeforeRender` for its own material
 * bookkeeping, so rotating the text from such a hook breaks glyph rendering.
 * Instead the label root is a plain Group that the scene controller rotates
 * toward the camera every frame (`billboard()`).
 */

import * as THREE from 'three'
import { preloadFont, Text } from 'troika-three-text'
import type { CrewRole } from '../domain/model'

export const LABEL_FONT = '/assets/noto-sans-sc-subset.woff'

export interface LabelSpec {
  id: string
  text: string
  color: string
  /** World position of the label anchor. */
  x: number
  y: number
  z: number
  fontSize: number
  /** Chip background tint; omitted for pure text labels. */
  chip?: string
  /** Height of the anchor, for sorting. */
  order?: number
}

export interface LabelHandle {
  id: string
  /** Root object holding the chip sprite + text. */
  object: THREE.Group
  text: Text
  chip: THREE.Sprite
  setVisible: (visible: boolean) => void
  setOpacity: (opacity: number) => void
  setHighlight: (on: boolean) => void
  /** Global on/off for the whole label layer, preserving per-label visibility. */
  setEnabled: (enabled: boolean) => void
  dispose: () => void
}

/**
 * Rounded-rect chip textures, cached per aspect ratio.
 *
 * The chip is a sprite stretched to the measured text block, so the texture
 * must be generated at (approximately) the same aspect ratio. Drawing at the
 * true aspect and bucketing to 0.05 keeps the pill ends circular without a
 * texture per label.
 */
const chipTextureCache = new Map<string, THREE.CanvasTexture>()

function getChipTexture(aspect: number): THREE.CanvasTexture {
  const bucket = Math.max(0.6, Math.min(8, Math.round(aspect * 20) / 20))
  const key = bucket.toFixed(2)
  const hit = chipTextureCache.get(key)
  if (hit) return hit

  const h = 64
  const w = Math.round(h * bucket)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const pad = 3
  ctx.beginPath()
  ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, (h - pad * 2) / 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  chipTextureCache.set(key, tex)
  return tex
}

const chipMaterialCache = new Map<string, THREE.SpriteMaterial>()

function getChipMaterial(color: string, aspect: number): THREE.SpriteMaterial {
  const bucket = Math.max(0.6, Math.min(8, Math.round(aspect * 20) / 20))
  const key = `${color}|${bucket.toFixed(2)}`
  const hit = chipMaterialCache.get(key)
  if (hit) return hit
  const mat = new THREE.SpriteMaterial({
    map: getChipTexture(bucket),
    color,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  })
  chipMaterialCache.set(key, mat)
  return mat
}

/** Preload the font once, used to warm troika before the first frame. */
const fontReady = new Map<string, Promise<void>>()

export function preloadLabelFont(): Promise<void> {
  const key = LABEL_FONT
  const existing = fontReady.get(key)
  if (existing) return existing
  const promise = new Promise<void>((resolve) => {
    // Troika's font resolver caches per-URL, so warming it with the exact
    // characters used by the labels removes the first-frame glyph pop-in.
    let settled = false
    const done = (): void => {
      if (settled) return
      settled = true
      resolve()
    }
    preloadFont(
      {
        font: key,
        characters: '机务加油行李摆渡客舱航食清水污水牵引监护0123456789A-Z·',
        sdfGlyphSize: 64,
      },
      done,
    )
    // Never block the app for more than 4s on a font miss: labels fall back to
    // troika's own async sync path.
    window.setTimeout(done, 4000)
  })
  fontReady.set(key, promise)
  return promise
}

let labelSeq = 0

export function createLabel(spec: LabelSpec): LabelHandle {
  const group = new THREE.Group()
  group.name = `label:${spec.id}:${labelSeq++}`
  group.position.set(spec.x, spec.y, spec.z)
  group.renderOrder = 20

  const text = new Text()
  text.font = LABEL_FONT
  text.text = spec.text
  text.fontSize = spec.fontSize
  text.color = spec.color
  text.anchorX = 'center'
  text.anchorY = 'middle'
  text.outlineWidth = '5%'
  text.outlineColor = '#ffffff'
  text.outlineOpacity = 0.35
  text.material.depthWrite = false
  text.material.depthTest = true
  text.material.transparent = true
  text.material.toneMapped = false
  text.renderOrder = 22
  group.add(text)

  let chip: THREE.Sprite
  if (spec.chip) {
    // Provisional size; `fitChip()` refines it once troika has measured the
    // real glyph bounds (and re-derives the texture aspect from them).
    chip = new THREE.Sprite(getChipMaterial(spec.chip, 2.6))
    chip.scale.set(spec.fontSize * 2.6, spec.fontSize * 1.55, 1)
    chip.position.set(0, 0, -0.02)
    chip.renderOrder = 21
    group.add(chip)
  } else {
    // Invisible placeholder keeps the handle shape uniform.
    chip = new THREE.Sprite(getChipMaterial('#000000', 2.6))
    chip.visible = false
    group.add(chip)
  }

  /**
   * Size the chip to the measured text block plus padding. Runs after troika
   * finishes a sync pass, so the numbers are the real glyph metrics.
   */
  const fitChip = (): void => {
    if (!chip.visible || !spec.chip) return
    const info = text.textRenderInfo
    const block = info?.blockBounds as [number, number, number, number] | undefined
    if (!block) return
    const textW = Math.abs(block[2] - block[0])
    const textH = Math.abs(block[3] - block[1])
    if (textW <= 0 || textH <= 0) return
    const padX = spec.fontSize * 0.46
    const padY = spec.fontSize * 0.34
    const w = textW + padX * 2
    const h = textH + padY * 2
    chip.scale.set(w, h, 1)
    chip.material = getChipMaterial(spec.chip, w / h)
  }

  text.sync(fitChip)

  let enabled = true
  let wantedVisible = true

  const applyVisibility = (): void => {
    group.visible = enabled && wantedVisible
  }

  return {
    id: spec.id,
    object: group,
    text,
    chip,
    setVisible: (visible: boolean) => {
      wantedVisible = visible
      applyVisibility()
    },
    setOpacity: (opacity: number) => {
      const clamped = Math.max(0, Math.min(1, opacity))
      text.fillOpacity = clamped
      text.outlineOpacity = clamped * 0.85
      if (chip.visible) chip.material.opacity = clamped * 0.82
    },
    setHighlight: (on: boolean) => {
      const color = on ? '#fde68a' : spec.color
      text.color = color
      group.scale.setScalar(on ? 1.12 : 1)
      if (chip.visible) chip.material.opacity = on ? 0.95 : 0.82
    },
    setEnabled: (next: boolean) => {
      enabled = next
      applyVisibility()
    },
    dispose: () => {
      text.dispose()
      group.removeFromParent()
      // Chip materials are shared via cache; nothing to release per label.
    },
  }
}

export function disposeLabelCache(): void {
  for (const tex of chipTextureCache.values()) tex.dispose()
  chipTextureCache.clear()
  for (const mat of chipMaterialCache.values()) mat.dispose()
  chipMaterialCache.clear()
}

/** Role label text for a crew figure. */
export function crewLabel(role: CrewRole): string {
  return role
}
