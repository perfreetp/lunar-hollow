import { describe, it } from 'vitest'
import * as THREE from 'three'
import { buildAircraft } from '../src/three/models/aircraft'
import { buildFuelTruck } from '../src/three/models/vehicles'
import { buildCrew } from '../src/three/models/crew'

describe('model geometry sanity', () => {
  it('aircraft parts sit where expected', () => {
    const ac = buildAircraft({ type: 'A320', length: 37.6, wingspan: 35.8, livery: '#d9e3f0' })
    ac.group.updateMatrixWorld(true)
    console.log('--- aircraft meshes ---')
    ac.group.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const box = new THREE.Box3().setFromObject(m)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const pos = m.geometry.getAttribute('position')
      console.log(
        `tris=${(m.geometry.index ? m.geometry.index.count : pos.count) / 3}`.padEnd(12),
        `size=${size.x.toFixed(1)},${size.y.toFixed(1)},${size.z.toFixed(1)}`.padEnd(34),
        `center=${center.x.toFixed(1)},${center.y.toFixed(1)},${center.z.toFixed(1)}`,
      )
    })
  })

  it('fuel truck parts', () => {
    const v = buildFuelTruck('#e0a12c')
    v.group.updateMatrixWorld(true)
    console.log('--- fuel truck ---')
    v.group.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const box = new THREE.Box3().setFromObject(m)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      console.log(
        `size=${size.x.toFixed(1)},${size.y.toFixed(1)},${size.z.toFixed(1)}`.padEnd(34),
        `center=${center.x.toFixed(1)},${center.y.toFixed(1)},${center.z.toFixed(1)}`,
      )
    })
  })

  it('crew parts', () => {
    const c = buildCrew('机务')
    c.group.updateMatrixWorld(true)
    console.log('--- crew ---')
    c.group.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const box = new THREE.Box3().setFromObject(m)
      const size = box.getSize(new THREE.Vector3())
      console.log(`size=${size.x.toFixed(2)},${size.y.toFixed(2)},${size.z.toFixed(2)}`)
    })
  })
})
