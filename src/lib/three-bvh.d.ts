// three-mesh-bvh 0.7.x 未附带对 three 的模块增强，这里补齐
import 'three'

declare module 'three' {
  interface BufferGeometry {
    computeBoundsTree: () => void
    disposeBoundsTree: () => void
    boundsTree?: unknown
  }
  interface Raycaster {
    firstHitOnly: boolean
  }
}
