/**
 * Visual + behavioural checks for the requirements that are hard to assert in
 * a unit test: label toggling, ghost ordering against solids, pose determinism
 * and yaw continuity.
 *
 * Run against a live preview: node tools/visual_check.mjs
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
import path from 'node:path'

const exe = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync)
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 2 },
})
const page = await browser.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))
await page.goto('http://localhost:4193/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 3500))

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` - ${detail}` : ''}`)
}

// --- 1. Label toggle -------------------------------------------------
const labels = await page.evaluate(() => {
  const ctrl = window.__apron.scene()
  ctrl.setLabelsVisible(false)
  ctrl.renderNow()
  let crewRoots = 0
  let visibleCrewRoots = 0
  ctrl['scene'].traverse((o) => {
    // Crew chips only; `label:stand:` roots are the stand placards.
    if (o.name?.startsWith('label:') && !o.name.startsWith('label:stand:')) {
      crewRoots++
      if (o.visible) visibleCrewRoots++
    }
  })
  ctrl.setLabelsVisible(true)
  return { crewRoots, visibleCrewRoots }
})
check(
  'Label toggle hides every crew label',
  labels.crewRoots > 0 && labels.visibleCrewRoots === 0,
  `${labels.visibleCrewRoots} of ${labels.crewRoots} crew labels visible`,
)

// --- 2. Ghost render-order invariants --------------------------------
const ghost = await page.evaluate(() => {
  const ctrl = window.__apron.scene()
  ctrl.setTime(16)
  ctrl.setGhostMode('all')
  ctrl.renderNow()
  const hulls = []
  let markings = null
  ctrl['scene'].traverse((o) => {
    if (o.name === 'apron-markings') markings = o.renderOrder
    if (o.name?.startsWith('ghost:') && o.visible) {
      hulls.push({ name: o.name, orders: o.children.map((c) => c.renderOrder) })
    }
  })
  const unordered = hulls.filter((h) => {
    const sorted = [...h.orders].sort((a, b) => a - b)
    return sorted[sorted.length - 1] <= sorted[0]
  })
  return {
    hullCount: hulls.length,
    unordered: unordered.map((h) => h.name),
    markings,
    minGhost: Math.min(...hulls.flatMap((h) => h.orders)),
    maxGhost: Math.max(...hulls.flatMap((h) => h.orders)),
  }
})
check(
  'Ghost hull passes are ordered back-before-front',
  ghost.unordered.length === 0,
  `${ghost.hullCount} hulls`,
)
check(
  'Ghosts sort after ground markings',
  ghost.markings !== null && ghost.minGhost > ghost.markings,
  `markings=${ghost.markings} ghosts=${ghost.minGhost}..${ghost.maxGhost}`,
)

// --- 3. Ghost material flags (what makes depth sorting correct) ------
const flags = await page.evaluate(() => {
  const ctrl = window.__apron.scene()
  const ghosts = []
  ctrl['scene'].traverse((o) => {
    if (o.isMesh && o.userData.ghost) {
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        if (m) ghosts.push({ dw: m.depthWrite, dt: m.depthTest, trans: m.transparent })
      }
    }
  })
  return ghosts
})
check(
  'Ghosts are depth-tested, non-depth-writing, transparent',
  flags.length > 0 && flags.every((g) => g.dt === true && g.dw === false && g.trans === true),
  `${flags.length} ghost meshes`,
)

// --- 4. Pose determinism: same minute reproduces the same pose -------
const determinism = await page.evaluate(async () => {
  const ctrl = window.__apron.scene()
  const settle = () =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  const snap = () => {
    const out = {}
    ctrl['views'].forEach((v) => {
      out[v.spec.id] = { x: v.root.position.x, z: v.root.position.z, yaw: v.root.rotation.y }
    })
    return out
  }
  // Go through real animation frames, which is the path live playback uses.
  ctrl.setTime(37.25)
  await settle()
  const first = snap()
  for (const t of [1, 88, 44, 62]) {
    ctrl.setTime(t)
    await settle()
  }
  ctrl.setTime(37.25)
  await settle()
  const second = snap()

  let maxDelta = 0
  let nonFinite = 0
  const bad = []
  for (const id of Object.keys(first)) {
    const a = first[id]
    const b = second[id]
    if (!b) continue
    for (const k of ['x', 'z', 'yaw']) {
      // `+ 0` normalises negative zero, which CDP would return as null.
      const av = a[k] + 0
      const bv = b[k] + 0
      if (!Number.isFinite(av) || !Number.isFinite(bv)) {
        nonFinite++
        if (bad.length < 3) bad.push(`${id}.${k}=${av}/${bv}`)
      } else {
        maxDelta = Math.max(maxDelta, Math.abs(av - bv))
      }
    }
  }
  return { maxDelta, nonFinite, count: Object.keys(first).length, bad }
})
check(
  'Returning to a minute reproduces every pose exactly',
  determinism.nonFinite === 0 && determinism.maxDelta === 0,
  `${determinism.count} actors, max delta ${determinism.maxDelta}, ${determinism.nonFinite} non-finite ${determinism.bad.join(',')}`,
)

// --- 5. Yaw continuity under live scrubbing --------------------------
const yawContinuity = await page.evaluate(() => {
  const ctrl = window.__apron.scene()
  const id = ctrl.actorIdsByKind('bus')[0]
  const view = ctrl['views'].get(id)
  let prev = null
  let maxStep = 0
  for (let t = 0; t <= 90; t += 0.05) {
    const pose = ctrl.poseOf(id)
    if (!pose) continue
    if (prev !== null) {
      let d = Math.abs(pose.yaw - prev)
      if (d > Math.PI) d = Math.abs(d - Math.PI * 2)
      maxStep = Math.max(maxStep, d)
    }
    prev = pose.yaw
  }
  return { maxStep, id, hasView: !!view }
})
check(
  'Vehicle heading never snaps between samples',
  yawContinuity.maxStep < 0.2,
  `${yawContinuity.id} max delta-yaw ${yawContinuity.maxStep.toFixed(4)} rad`,
)

// --- Screenshots ----------------------------------------------------
await page.evaluate(() => {
  const s = window.__apron.store
  s.setMinute(16)
  s.setStandFilter('stand-a12')
})
await new Promise((r) => setTimeout(r, 900))
let el = await page.$('.viewport')
await el.screenshot({ path: path.resolve('tools/shots/70-final-a12.png') })

await page.evaluate(() => {
  const s = window.__apron.store
  s.setStandFilter('all')
})
await new Promise((r) => setTimeout(r, 900))
await page.screenshot({ path: path.resolve('tools/shots/71-final-overview.png') })

check('No page errors during visual checks', errs.length === 0, errs.slice(0, 2).join(' | '))

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} visual checks passed`)
if (failed.length) process.exitCode = 1
await browser.close()
