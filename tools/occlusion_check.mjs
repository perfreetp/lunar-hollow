/**
 * Occlusion / translucency probe — reads real pixels from the WebGL context
 * with `gl.readPixels` to verify the depth-sorting contract:
 *
 *  1. A solid model occludes a translucent ghost that is BEHIND it. We frame a
 *     vehicle's ghost behind the aircraft body, then toggle only that ghost and
 *     assert the aircraft's silhouette pixels do not change.
 *  2. Ghosts really are drawn where nothing solid covers them (so check 1
 *     cannot pass trivially).
 *  3. Ghost materials are depth-tested / non-depth-writing / transparent, and
 *     each hull's passes are ordered back-before-front, which is what makes
 *     overlapping translucent hulls blend correctly.
 *
 * The controller's automatic pose refresh is paused during the probe so manual
 * visibility changes are not overwritten between explicit renders.
 *
 * Run against a live preview: node tools/occlusion_check.mjs
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const exe = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync)
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  defaultViewport: { width: 1000, height: 800 },
})
const page = await browser.newPage()
await page.goto('http://localhost:4193/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 3200))

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` - ${detail}` : ''}`)
}

const probe = await page.evaluate(async () => {
  const ctrl = window.__apron.scene()
  const store = window.__apron.store
  const gl = ctrl['renderer'].getContext()
  const dpr = ctrl['renderer'].getPixelRatio()
  const W = gl.drawingBufferWidth
  const H = gl.drawingBufferHeight
  void dpr
  const frame = () => new Promise((r) => requestAnimationFrame(r))

  store.setMinute(18)
  store.setStandFilter('stand-a12')
  store.ghostMode.value = 'all'
  await frame()

  // Freeze automatic pose application and camera damping.
  ctrl.setAutoRefresh(false)

  // Frame the aircraft from the side so its fuselage sits between the camera
  // and the parked vehicles on the far side of the stand.
  const cam = ctrl['perspCam']
  const aircraft = ctrl['views'].get('stand-a12:aircraft')
  const ap = aircraft.root.position
  cam.position.set(ap.x - 6, 9, ap.z + 44)
  cam.lookAt(ap.x, 4, ap.z)
  ctrl['controlsPersp'].target.set(ap.x, 4, ap.z)
  ctrl['controlsPersp'].update()
  ctrl['cameraDirty'] = true

  const grab = () => {
    ctrl.renderNow()
    const buf = new Uint8Array(W * H * 4)
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf)
    return buf
  }
  const diff = (a, b, i) =>
    Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])

  const roots = []
  ctrl['views'].forEach((v, id) => roots.push({ v, id }))

  // --- Mask: the aircraft's solid silhouette -------------------------
  for (const { v } of roots) v.root.visible = false
  aircraft.root.visible = true
  const aircraftOnly = grab()
  for (const { v } of roots) v.root.visible = false
  const empty = grab()
  for (const { v } of roots) v.root.visible = true

  // --- Pick a ghost that the aircraft body covers --------------------
  // Try each vehicle ghost in turn; the first whose "on" frame changes many
  // pixels but *none* inside the aircraft silhouette is the subject.
  const vehicles = roots.filter(
    ({ id }) => !id.endsWith(':aircraft') && !roots.find((r) => r.id === id)?.v.spec.role,
  )

  let subject = null
  let ghostOutside = 0
  let ghostInside = 0
  let baselineInside = 0

  for (const { v, id } of vehicles) {
    const ghost = v.ghost
    if (!ghost || ghost.children.length === 0) continue
    // Toggle only this one ghost.
    ghost.visible = true
    const on = grab()
    ghost.visible = false
    const off = grab()
    let inside = 0
    let outside = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4
        const isAircraft = diff(aircraftOnly, empty, i) > 18
        if (diff(on, off, i) > 8) {
          if (isAircraft) inside++
          else outside++
        }
      }
    }
    if (!subject || inside < ghostInside) {
      subject = id
      ghostInside = inside
      ghostOutside = Math.max(ghostOutside, outside)
      baselineInside = inside
    }
    ghost.visible = true
  }

  // Re-run the chosen subject explicitly for a clean measurement.
  let finalInside = 0
  let finalOutside = 0
  let maskPixels = 0
  let worstInside = 0
  const chosen = roots.find((r) => r.id === subject)
  if (chosen && chosen.v.ghost.children.length > 0) {
    chosen.v.ghost.visible = true
    const on = grab()
    chosen.v.ghost.visible = false
    const off = grab()
    chosen.v.ghost.visible = true
    for (let i = 0; i < W * H * 4; i += 4) {
      const isAircraft = diff(aircraftOnly, empty, i) > 18
      if (isAircraft) maskPixels++
      const d = diff(on, off, i)
      if (d > 8) {
        if (isAircraft) {
          finalInside++
          if (d > worstInside) worstInside = d
        } else {
          finalOutside++
        }
      }
    }
  }

  // Restore everything.
  for (const { v } of roots) {
    v.root.visible = true
  }
  ctrl['views'].forEach((v) => {
    if (v.ghost) v.ghost.visible = true
  })
  ctrl.setAutoRefresh(true)
  await frame()

  // --- Material / ordering invariants ---------------------------------
  const ghostMats = []
  const hullOrders = []
  ctrl['scene'].traverse((o) => {
    if (o.name?.startsWith('ghost:')) {
      hullOrders.push(o.children.filter((c) => c.isMesh).map((c) => c.renderOrder))
    }
    if (o.isMesh && o.userData.ghost) {
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        if (m) ghostMats.push({ dw: m.depthWrite, dt: m.depthTest, trans: m.transparent })
      }
    }
  })

  return {
    W,
    H,
    subject,
    maskPixels,
    finalInside,
    finalOutside,
    worstInside,
    baselineInside,
    ghostMatsOk: ghostMats.length > 0 && ghostMats.every((g) => g.dt && !g.dw && g.trans),
    ghostMatCount: ghostMats.length,
    orderOk: hullOrders.every((orders) => {
      const s = [...orders].sort((a, b) => a - b)
      return orders.length < 2 || s[s.length - 1] > s[0]
    }),
    hullCount: hullOrders.length,
  }
})

check('Aircraft silhouette was found on screen', probe.maskPixels > 2000, `${probe.maskPixels} px`)
check(
  'The queued ghost is actually drawn outside the aircraft',
  probe.finalOutside > 200,
  `subject=${probe.subject}, ${probe.finalOutside} px changed outside`,
)
check(
  'Solid aircraft occludes the ghost behind it',
  probe.maskPixels > 0 && probe.finalInside === 0,
  `${probe.finalInside} of ${probe.maskPixels} aircraft px affected (worst delta ${probe.worstInside})`,
)
check(
  'Ghost materials are depth-tested, non-depth-writing, transparent',
  probe.ghostMatsOk,
  `${probe.ghostMatCount} ghost meshes`,
)
check(
  'Ghost hull passes are ordered back-before-front',
  probe.orderOk,
  `${probe.hullCount} hulls`,
)

// Save a diagnostic frame.
const shot = await page.screenshot({ encoding: 'base64' })
await writeFile(path.resolve('tools/shots/80-occlusion.png'), Buffer.from(shot, 'base64'))

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} occlusion checks passed`)
if (failed.length) process.exitCode = 1
await browser.close()
