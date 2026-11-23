/**
 * End-to-end JSON round-trip: export the live scene, reload the page, import
 * the file through the real UI file input, and confirm the scenario, playhead
 * and camera come back.
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const exe = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync)
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  defaultViewport: { width: 1400, height: 900 },
})
const page = await browser.newPage()
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` - ${detail}` : ''}`)
}

await mkdir('tools/export', { recursive: true })
await page.goto('http://localhost:4193/', { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 3000))

// Set a distinctive state, then export through the store API (the toolbar
// button triggers a browser download, which headless cannot capture).
const exported = await page.evaluate(() => {
  const s = window.__apron.store
  s.setMinute(23.5)
  s.setStandFilter('stand-a14')
  s.viewMode.value = 'orthographic'
  const snap = window.__apron.viewport().snapshot()
  const res = s.exportJson(snap)
  return { ok: res.ok, data: res.data ?? null }
})
check('Export produces valid JSON', exported.ok && !!exported.data, `${exported.data?.length ?? 0} bytes`)
if (exported.data) {
  await writeFile(path.resolve('tools/export/roundtrip.json'), exported.data)
  const parsed = JSON.parse(exported.data)
  check('Export has the documented envelope', parsed.format === 'apron-sequence' && parsed.version === 1)
  check('Export carries a view snapshot', parsed.view?.minute === 23.5 && parsed.view?.viewMode === 'orthographic')
}

// Reload with empty storage and import the file via the real <input type=file>.
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 2500))

const input = await page.$('input[type="file"]')
check('Toolbar exposes a file input for import', !!input)
if (input) {
  await input.uploadFile(path.resolve('tools/export/roundtrip.json'))
  await new Promise((r) => setTimeout(r, 1200))
}

const after = await page.evaluate(() => {
  const s = window.__apron.store
  const ctrl = window.__apron.scene()
  return {
    minute: s.minute.value,
    stand: s.standFilter.value,
    mode: s.viewMode.value,
    actors: s.actors.value.length,
    stands: s.stands.value.length,
    sceneActors: ctrl.actorCount(),
    persisted: !!localStorage.getItem('apron-sequence.session.v1'),
    toast: document.querySelector('.toast .title')?.textContent?.trim() ?? null,
  }
})
check('Import restores the playhead', Math.abs(after.minute - 23.5) < 0.01, `minute=${after.minute}`)
check('Import restores the stand filter', after.stand === 'stand-a14', after.stand)
check('Import restores the camera mode', after.mode === 'orthographic', after.mode)
check('Import rebuilds every actor in the scene', after.sceneActors === after.actors && after.actors === 36, `${after.sceneActors} scene / ${after.actors} spec`)
check('Imported session is persisted', after.persisted)

// Re-export the imported state and confirm it carries the same data (key order
// may differ because the validator rebuilds objects, so compare canonically).
const reexport = await page.evaluate(() => {
  const s = window.__apron.store
  const snap = window.__apron.viewport().snapshot()
  const res = s.exportJson(snap)
  return res.data ?? null
})
if (reexport && exported.data) {
  /** Deep, key-order-independent view for comparison. */
  const canonical = (value) => {
    const walk = (v) => {
      if (Array.isArray(v)) return v.map(walk)
      if (v && typeof v === 'object') {
        const out = {}
        for (const k of Object.keys(v).sort()) out[k] = walk(v[k])
        return out
      }
      return v
    }
    return JSON.stringify(walk(value))
  }
  const a = JSON.parse(exported.data)
  const b = JSON.parse(reexport)
  delete a.exportedAt
  delete b.exportedAt
  // Camera is restored approximately; compare data, not the exact camera.
  if (a.view) delete a.view.camera
  if (b.view) delete b.view.camera
  check('Re-export matches the imported data', canonical(a) === canonical(b))
}

// Sanity: the import toast was shown.
check('Import surfaces a success toast', !!after.toast, after.toast ?? 'none')

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} round-trip checks passed`)
if (failed.length) process.exitCode = 1
await browser.close()
