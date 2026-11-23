/**
 * Static environment: apron ground, taxilane, stand furniture, lighting.
 *
 * Markings are a separate alpha-blended plane lifted 4cm above the concrete,
 * rendered in the transparent pass so it sorts cleanly with vehicles.
 */

import * as THREE from 'three'
import { APRON_SIZE, buildApronTextures, type ApronTextureSet } from './textures'
import type { StandSpec } from '../domain/model'
import { deg2rad } from '../domain/model'

export interface EnvironmentBuild {
  group: THREE.Group
  textures: ApronTextureSet
  /** Uniforms driven by the theme (fog / ground tint). */
  dispose: () => void
}

const STAND_ACCENT = new THREE.Color('#3b82f6')

function buildStandFurniture(stands: StandSpec[]): THREE.Group {
  const group = new THREE.Group()
  group.name = 'stand-furniture'

  const poleMat = new THREE.MeshStandardMaterial({
    color: '#6b7280',
    roughness: 0.6,
    metalness: 0.5,
  })
  const lampMat = new THREE.MeshStandardMaterial({
    color: '#dbeafe',
    emissive: '#93c5fd',
    emissiveIntensity: 0.9,
    roughness: 0.35,
  })
  const boxMat = new THREE.MeshStandardMaterial({
    color: '#2a3038',
    roughness: 0.85,
    metalness: 0.25,
  })
  const screenMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    emissive: '#1e3a8a',
    emissiveIntensity: 0.5,
    roughness: 0.4,
  })

  for (const stand of stands) {
    const g = new THREE.Group()
    g.position.set(stand.origin.x, 0, stand.origin.z)
    g.rotation.y = deg2rad(stand.heading)

    // Light masts at the two rear corners of the stand.
    for (const sx of [-1, 1]) {
      const mast = new THREE.Group()
      mast.position.set(sx * 21, 0, 27)

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 14, 8), poleMat)
      pole.position.y = 7
      pole.castShadow = true
      mast.add(pole)

      const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 0.7), lampMat)
      head.position.set(-sx * 0.6, 14.2, 0)
      mast.add(head)

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.25), poleMat)
      arm.position.set(-sx * 0.5, 13.6, 0)
      mast.add(arm)

      g.add(mast)
    }

    // Stand guidance / information board at the rear of the stand.
    const board = new THREE.Group()
    board.position.set(0, 0, 30)
    const boardPole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 0.4), poleMat)
    boardPole.position.y = 1.7
    boardPole.castShadow = true
    board.add(boardPole)
    const bx = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 0.3), boxMat)
    bx.position.y = 4.2
    bx.castShadow = true
    board.add(bx)
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 1.95), screenMat)
    screen.position.set(0, 4.2, 0.17)
    board.add(screen)
    g.add(board)

    // Apron edge lights along the lead-in.
    for (let i = 0; i < 4; i++) {
      for (const sx of [-1, 1]) {
        const light = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.2, 0.35, 8),
          new THREE.MeshBasicMaterial({ color: '#fbbf24' }),
        )
        light.position.set(sx * 1.6, 0.18, 12 + i * 8)
        g.add(light)
      }
    }

    group.add(g)
  }

  return group
}

export interface EnvironmentOptions {
  /** Enable shadow casting on the key light. */
  shadows: boolean
  /** Shadow map resolution when shadows are on. */
  shadowSize: number
}

export function buildEnvironment(
  stands: StandSpec[],
  options: EnvironmentOptions = { shadows: true, shadowSize: 2048 },
): EnvironmentBuild {
  const root = new THREE.Group()
  root.name = 'environment'
  const textures = buildApronTextures()

  // Ground slab: a wide concrete apron with a subtle inner bevel.
  const groundGeo = new THREE.PlaneGeometry(APRON_SIZE, APRON_SIZE, 1, 1)
  groundGeo.rotateX(-Math.PI / 2)
  const groundMat = new THREE.MeshStandardMaterial({
    map: textures.concrete,
    color: '#8e98a6',
    roughness: 0.95,
    metalness: 0.04,
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.receiveShadow = true
  ground.name = 'apron-ground'
  root.add(ground)

  // Markings overlay, lifted to avoid z-fighting.
  const markGeo = new THREE.PlaneGeometry(APRON_SIZE, APRON_SIZE, 1, 1)
  markGeo.rotateX(-Math.PI / 2)
  const markMat = new THREE.MeshBasicMaterial({
    map: textures.markings,
    transparent: true,
    depthWrite: false,
    opacity: 0.95,
    toneMapped: false,
  })
  const markings = new THREE.Mesh(markGeo, markMat)
  markings.position.y = 0.04
  markings.renderOrder = 1
  markings.name = 'apron-markings'
  root.add(markings)

  // Grass verge / boundary skirt far from the action.
  const skirtGeo = new THREE.RingGeometry(APRON_SIZE * 0.5, APRON_SIZE * 1.6, 64, 1)
  skirtGeo.rotateX(-Math.PI / 2)
  const skirtMat = new THREE.MeshStandardMaterial({ color: '#2b3a2f', roughness: 1 })
  const skirt = new THREE.Mesh(skirtGeo, skirtMat)
  skirt.position.y = -0.06
  skirt.name = 'verge'
  root.add(skirt)

  root.add(buildStandFurniture(stands))

  // Lighting rig: hemisphere bounce + a warm key and a cool rim.
  const hemi = new THREE.HemisphereLight('#bfd4f2', '#3a3f47', 1.05)
  root.add(hemi)

  const key = new THREE.DirectionalLight('#fff6e8', 2.1)
  key.position.set(-90, 140, 70)
  if (options.shadows) {
    key.castShadow = true
    key.shadow.mapSize.set(options.shadowSize, options.shadowSize)
    key.shadow.camera.near = 20
    key.shadow.camera.far = 420
    const cam = key.shadow.camera
    cam.left = -160
    cam.right = 160
    cam.top = 160
    cam.bottom = -160
    cam.updateProjectionMatrix()
    key.shadow.bias = -0.0006
    key.shadow.normalBias = 0.9
  }
  root.add(key)

  const rim = new THREE.DirectionalLight('#8fb8ff', 0.75)
  rim.position.set(120, 80, -110)
  root.add(rim)

  const fill = new THREE.DirectionalLight('#ffffff', 0.35)
  fill.position.set(0, 40, 160)
  root.add(fill)

  // Blinking beacon glow at the taxiway edge is skipped on purpose: the scene
  // already carries a point light budget for the vehicles.

  return {
    group: root,
    textures,
    dispose: () => {
      groundGeo.dispose()
      groundMat.dispose()
      markGeo.dispose()
      markMat.dispose()
      skirtGeo.dispose()
      skirtMat.dispose()
      textures.dispose()
    },
  }
}

export { STAND_ACCENT }
