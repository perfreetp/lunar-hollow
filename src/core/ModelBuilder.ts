import * as THREE from 'three'
import { PaintedMaterial } from './PaintedMaterial'
import { makeBaseTexture, makeFadeMaskTexture, makeRestoreLayer, makeSurfaceTexture } from './TextureFactory'
import type { SceneComponent } from '../types'

/**
 * 程序化演示模型：一组古建木构立面
 * 分组：立柱 / 梁枋 / 斗拱 / 雀替
 * 每个构件独立材质与独立程序化纹理，可单独绑定贴图与修复遮罩。
 */

interface ComponentSpec {
  id: string
  name: string
  group: string
  geometry: THREE.BufferGeometry
  position: [number, number, number]
  rotation?: [number, number, number]
}

function buildSpecs(): ComponentSpec[] {
  const specs: ComponentSpec[] = []

  // ---- 立柱（4 根） ----
  const columnXs = [-4.2, -1.4, 1.4, 4.2]
  columnXs.forEach((x, i) => {
    specs.push({
      id: `column-${i + 1}`,
      name: `立柱 ${i + 1}`,
      group: '立柱',
      geometry: new THREE.CylinderGeometry(0.26, 0.3, 4.4, 24, 1),
      position: [x, 0, 0]
    })
  })

  // ---- 梁枋（3 道） ----
  const beamLevels = [
    { y: 2.45, name: '大额枋' },
    { y: 3.15, name: '小额枋' },
    { y: 3.85, name: '平板枋' }
  ]
  beamLevels.forEach((b, i) => {
    specs.push({
      id: `beam-${i + 1}`,
      name: b.name,
      group: '梁枋',
      geometry: new THREE.BoxGeometry(9.4, 0.42, 0.62),
      position: [0, b.y, 0]
    })
  })

  // ---- 斗拱（4 组） ----
  columnXs.forEach((x, i) => {
    specs.push({
      id: `dougong-${i + 1}`,
      name: `斗拱 ${i + 1}`,
      group: '斗拱',
      geometry: new THREE.BoxGeometry(0.95, 0.7, 0.85),
      position: [x, 4.5, 0]
    })
  })

  // ---- 雀替（4 个，贴在柱与梁交接处，略带旋转） ----
  columnXs.forEach((x, i) => {
    const inward = x < 0 ? 0.42 : -0.42
    specs.push({
      id: `queti-${i + 1}`,
      name: `雀替 ${i + 1}`,
      group: '雀替',
      geometry: new THREE.BoxGeometry(0.72, 0.34, 0.5),
      position: [x + inward * 0.7, 2.08, 0],
      rotation: [0, 0, inward]
    })
  })

  return specs
}

export interface BuiltModel {
  group: THREE.Group
  components: SceneComponent[]
}

export function buildDemoModel(): BuiltModel {
  const group = new THREE.Group()
  group.name = 'demo-caihua-facade'
  const components: SceneComponent[] = []

  for (const spec of buildSpecs()) {
    const seed = spec.id
    const surface = makeSurfaceTexture(seed)
    const base = makeBaseTexture(seed)
    const fadeMask = makeFadeMaskTexture(seed)
    const restore = makeRestoreLayer()

    const material = new PaintedMaterial({ surface, base, fadeMask, restore: restore.texture })
    const mesh = new THREE.Mesh(spec.geometry, material)
    mesh.name = spec.id
    mesh.position.set(...spec.position)
    if (spec.rotation) mesh.rotation.set(...spec.rotation)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.componentId = spec.id

    group.add(mesh)
    components.push({
      id: spec.id,
      name: spec.name,
      group: spec.group,
      mesh,
      material,
      restoreCanvas: restore.canvas,
      restoreTexture: restore.texture
    })
  }

  group.position.y = -2.2
  return { group, components }
}
