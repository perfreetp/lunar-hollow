/**
 * Minimal ambient types for troika-three-text.
 *
 * The package ships `dist/types/*.d.ts` but no `types` field in package.json,
 * so TS resolves the UMD bundle and gives up. Only the surface we use is
 * declared here.
 */
declare module 'troika-three-text' {
  import type { Mesh, Material, Color } from 'three'

  export class Text extends Mesh {
    text: string
    font: string | null
    fontSize: number
    fontWeight: string | number
    fontStyle: string
    color: string | number | Color
    anchorX: number | string
    anchorY: number | string
    maxWidth: number
    lineHeight: number | string
    letterSpacing: number
    textAlign: string
    whiteSpace: string
    outlineWidth: number | string
    outlineColor: string | number | Color
    outlineOpacity: number
    outlineBlur: number | string
    outlineOffsetX: number | string
    outlineOffsetY: number | string
    strokeWidth: number | string
    strokeColor: string | number | Color
    strokeOpacity: number
    fillOpacity: number
    depthOffset: number
    sdfGlyphSize: number | null
    gpuAccelerateSDF: boolean
    material: Material & {
      depthWrite: boolean
      depthTest: boolean
      transparent: boolean
      toneMapped: boolean
      opacity: number
    }
    sync(callback?: () => void): void
    dispose(): void
    readonly textRenderInfo: {
      blockBounds: [number, number, number, number]
      visibleBounds: [number, number, number, number]
      glyphBounds?: Array<[number, number, number, number]>
    } | null
  }

  export function preloadFont(
    options: { font?: string; characters?: string | string[]; sdfGlyphSize?: number },
    callback: () => void,
  ): void
}
