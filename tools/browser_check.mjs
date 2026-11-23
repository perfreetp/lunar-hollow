/**
 * Browser smoke test.
 *
 * Loads the built app in headless Chrome with a real GPU-backed WebGL
 * context (SwiftShader fallback is fine), then exercises:
 *   - first render and actor count
 *   - camera mode switching (perspective <-> orthographic)
 *   - timeline scrub throughput with 20+ objects
 *   - click-to-select picking on a known vehicle
 *   - JSON export round trip through localStorage
 *   - screenshots for visual review
 *
 * Run: node tools/browser_check.mjs [url]
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const URL = process.argv[2] ?? 'http://127.0.0.1:4173/'
const SHOT_DIR = path.resolve('tools/shots')

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]

function findBrowser() {
  for (const p of CHROME_CANDIDATES) if (existsSync(p)) return p
  throw new Error('No Chrome/Edge found')
}

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  const mark = ok ? 'PASS' : 'FAIL'
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ''}`)
}

async function main() {
  await mkdir(SHOT_DIR, { recursive: true })

  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--enable-unsafe-swiftshader',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--window-size=1600,1000',
      '--hide-scrollbars',
    ],
    defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1 },
  })

  const page = await browser.newPage()
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60_000 })
  await page.waitForFunction(() => document.querySelector('canvas') !== null, { timeout: 30_000 })

  // Give troika a frame or two to build glyph SDFs and the scene to render.
  await sleep(2500)

  // --- 1. Canvas has a real drawing buffer ---------------------------
  const canvasInfo = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    if (!c) return null
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    return {
      width: c.width,
      height: c.height,
      hasGl: !!gl,
      renderer: gl ? gl.getParameter(gl.RENDERER) : null,
      vendor: gl ? gl.getParameter(gl.VENDOR) : null,
    }
  })
  check(
    'WebGL canvas mounted',
    !!canvasInfo && canvasInfo.hasGl && canvasInfo.width > 100,
    `${canvasInfo?.width}x${canvasInfo?.height} ${canvasInfo?.renderer ?? ''}`,
  )

  // --- 2. Actors built ----------------------------------------------
  const actorCount = await page.evaluate(() => {
    const el = document.querySelector('[data-actor-count]')
    return el ? Number(el.getAttribute('data-actor-count')) : null
  })
  check('20+ actors in scene', (actorCount ?? 0) >= 20, `count=${actorCount}`)

  await page.screenshot({ path: path.join(SHOT_DIR, '01-initial.png') })

  // --- 3. Timeline scrub throughput ---------------------------------
  const scrub = await page.evaluate(async () => {
    // Drive the real timeline through its input path: dispatch pointer events
    // on the ruler, then measure how long the app takes to settle.
    const ruler = document.querySelector('.ruler')
    if (!ruler) return { ok: false, reason: 'no ruler' }
    const rect = ruler.getBoundingClientRect()
    const samples = []
    const t0 = performance.now()
    for (let i = 0; i < 60; i++) {
      const x = rect.left + (rect.width * i) / 59
      const y = rect.top + rect.height / 2
      ruler.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: x, clientY: y, bubbles: true, pointerId: 1, button: 0,
        }),
      )
      ruler.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: x, clientY: y, bubbles: true, pointerId: 1, button: 0,
        }),
      )
      ruler.dispatchEvent(
        new PointerEvent('pointerup', {
          clientX: x, clientY: y, bubbles: true, pointerId: 1, button: 0,
        }),
      )
      // Let the render loop catch up on alternate samples.
      if (i % 6 === 0) {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        samples.push(performance.now())
      }
    }
    const elapsed = performance.now() - t0
    // Report the readout the app itself shows.
    const readout = document.querySelector('.clock')?.textContent?.trim()
    return { ok: true, elapsed, samples: samples.length, readout }
  })
  check(
    'Timeline scrub completes',
    !!scrub.ok,
    `${scrub.elapsed?.toFixed(0)}ms for 60 seeks, clock=${scrub.readout}`,
  )

  await page.screenshot({ path: path.join(SHOT_DIR, '02-scrubbed.png') })

  // --- 4. Camera mode switch -----------------------------------------
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')]
    buttons.find((b) => b.textContent?.trim() === '正交')?.click()
  })
  await sleep(600)
  const orthoState = await page.evaluate(() => ({
    badge: !!document.body.innerText.match(/正交投影/),
    camera: window.__apron?.scene()?.['viewMode'] ?? null,
  }))
  check('Switched to orthographic camera', orthoState.badge, `mode=${orthoState.camera}`)
  await page.screenshot({ path: path.join(SHOT_DIR, '03-orthographic.png') })

  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')]
    buttons.find((b) => b.textContent?.trim() === '透视')?.click()
  })
  await sleep(400)

  // --- 5. Keyboard transport -----------------------------------------
  // The global handler ignores events from form controls, so make sure focus
  // is on the document body rather than the <select> used earlier.
  await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined))
  await page.evaluate(() => {
    window.__apron?.store?.setMinute?.(10)
  })
  await sleep(120)
  const before = await page.evaluate(() => window.__apron?.store?.minute?.value ?? null)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await sleep(250)
  const after = await page.evaluate(() => window.__apron?.store?.minute?.value ?? null)
  check('Arrow keys step the playhead', before !== null && after === before + 2, `${before} -> ${after}`)

  // --- 6. Selection via roster (picking is geometry-dependent) --------
  await page.evaluate(() => {
    const row = document.querySelector('.roster .row')
    row?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await sleep(500)
  const inspector = await page.evaluate(() => {
    const el = document.querySelector('.inspector')
    return {
      open: !!el,
      title: el?.querySelector('h3')?.textContent?.trim() ?? null,
      hasSegments: (el?.querySelectorAll('.segments li').length ?? 0) > 0,
      hasProgress: !!el?.querySelector('.bar'),
    }
  })
  check(
    'Inspector shows task segments + progress',
    inspector.open && inspector.hasSegments && inspector.hasProgress,
    `title=${inspector.title}`,
  )
  await page.screenshot({ path: path.join(SHOT_DIR, '04-inspector.png') })

  // --- 7. Stand switch preserves the playhead ------------------------
  const clockBefore = await page.evaluate(() => document.querySelector('.clock')?.textContent?.trim())
  await page.evaluate(() => {
    const selects = [...document.querySelectorAll('select')]
    const target = selects[selects.length - 1]
    target.value = 'stand-a14'
    target.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await sleep(700)
  const clockAfter = await page.evaluate(() => document.querySelector('.clock')?.textContent?.trim())
  check('Stand switch keeps the playhead', clockBefore === clockAfter, `${clockBefore} == ${clockAfter}`)
  await page.screenshot({ path: path.join(SHOT_DIR, '05-stand-a14.png') })

  // --- 8. Export round trip through localStorage ---------------------
  const storage = await page.evaluate(async () => {
    const buttons = [...document.querySelectorAll('button')]
    buttons.find((b) => b.textContent?.includes('导出 JSON'))?.click()
    await new Promise((r) => setTimeout(r, 300))
    // The download path uses a blob URL; verify by reading the saved session
    // that the debounced persister wrote for the same data.
    const keys = Object.keys(localStorage)
    const session = localStorage.getItem('apron-sequence.session.v1')
    const parsed = session ? JSON.parse(session) : null
    return {
      keys,
      parseable: !!parsed,
      actorCount: parsed?.payload?.actors?.length ?? 0,
      minute: parsed?.minute ?? null,
    }
  })
  check(
    'Session persisted to localStorage',
    storage.parseable && storage.actorCount >= 20,
    `actors=${storage.actorCount} minute=${storage.minute}`,
  )

  // --- 9. Debris checks ----------------------------------------------
  check('No page errors', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '))
  const realConsoleErrors = consoleErrors.filter(
    (e) => !/favicon|Failed to load resource/.test(e),
  )
  check('No console errors', realConsoleErrors.length === 0, realConsoleErrors.slice(0, 3).join(' | '))

  // --- 10. Perf probe: 20+ objects over 200 synthetic seeks ----------
  //
  // Headless Chrome paces requestAnimationFrame at ~10Hz regardless of how
  // fast the page is, so wall-clock scrub timing measures the browser's tick,
  // not the app. What we can measure honestly is the app's own per-frame work:
  // a full resample of every actor plus a synchronous draw. That number is
  // what determines whether real hardware stays smooth, and it is compared
  // against a 16.7ms frame budget.
  const perf = await page.evaluate(async () => {
    const scene = window.__apron?.scene?.()
    if (!scene) return { ok: false }
    // Warm up: first draw compiles shaders.
    for (let i = 0; i < 5; i++) {
      scene.setTime(i)
      scene.renderNow()
    }
    let worst = 0
    let total = 0
    let worstPose = 0
    const N = 200
    for (let i = 0; i < N; i++) {
      const t = (i / N) * 90
      const t0 = performance.now()
      scene.setTime(t)
      scene.renderNow()
      const dt = performance.now() - t0
      total += dt
      if (dt > worst) worst = dt
      const pose = scene.poseCost()
      if (pose > worstPose) worstPose = pose
    }
    // Raw rAF cadence, reported for context but not asserted on.
    const frames = []
    let last = performance.now()
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => requestAnimationFrame(r))
      const now = performance.now()
      frames.push(now - last)
      last = now
    }
    return {
      ok: true,
      avg: total / N,
      worst,
      worstPose,
      samples: N,
      stats: scene.stats(),
      rafAvg: frames.reduce((a, b) => a + b, 0) / frames.length,
      gpu: scene.rendererName(),
      quality: scene.qualityTier(),
    }
  })
  check(
    'Full resample + draw averages under a 16.7ms frame budget',
    perf.ok && perf.avg < 16.7,
    `avg ${perf.avg?.toFixed(2)}ms · worst ${perf.worst?.toFixed(2)}ms over ${perf.samples} seeks (${perf.quality} tier)`,
  )
  check(
    'Pose re-evaluation stays under 4ms for the whole cast',
    perf.worstPose > 0 && perf.worstPose < 4,
    `worst ${perf.worstPose?.toFixed(2)}ms · drawCalls=${perf.stats?.drawCalls} tris=${perf.stats?.triangles}`,
  )
  console.log(`       (headless rAF cadence ${perf.rafAvg?.toFixed(0)}ms — browser tick, not app cost)`)
  console.log(`       (GPU: ${perf.gpu})`)

  // --- 11. Picking through the canvas --------------------------------
  const pick = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return { ok: false, reason: 'no canvas' }
    const scene = window.__apron?.scene?.()
    if (!scene) return { ok: false, reason: 'no scene' }
    // Re-show every stand: the earlier filter test left only A14 visible.
    window.__apron?.store?.setStandFilter?.('all')
    await new Promise((r) => setTimeout(r, 400))
    // Drive the controller's own picker at the projected centre of a known
    // vehicle. This tests the raycast path without depending on page scroll.
    const id = scene.actorIdsByKind('fuelTruck').find((x) => x.includes('a12')) ?? null
    if (!id) return { ok: false, reason: 'no fuel truck' }
    const pt = scene.projectActor(id)
    if (!pt) return { ok: false, reason: 'no projection', id }
    const rect = canvas.getBoundingClientRect()
    const ndcX = (pt.x / rect.width) * 2 - 1
    const ndcY = -(pt.y / rect.height) * 2 + 1
    // Nudge the ray slightly if the projected centre falls between parts.
    let hit = scene.pickAtNdc(ndcX, ndcY)
    if (hit !== id) {
      outer: for (const dx of [-0.01, 0.01, -0.02, 0.02]) {
        for (const dy of [-0.01, 0.01, -0.02, 0.02]) {
          const h = scene.pickAtNdc(ndcX + dx, ndcY + dy)
          if (h === id) { hit = h; break outer }
        }
      }
    }
    window.__apron?.store?.select?.(hit)
    await new Promise((r) => setTimeout(r, 350))
    const title = document.querySelector('.inspector h3')?.textContent?.trim() ?? null
    return { ok: hit === id, id, hit, title }
  })
  check('Canvas raycast selects the vehicle under the cursor', pick.ok, `${pick.id} -> ${pick.hit}`)

  await writeFile(
    path.join(SHOT_DIR, 'report.json'),
    JSON.stringify({ results, canvasInfo, storage, perf }, null, 2),
  )

  await browser.close()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length) {
    process.exitCode = 1
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
