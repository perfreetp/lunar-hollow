/**
 * Interaction checks: playback advances the clock, timeline lanes select an
 * actor, and the stand placards are distinct and readable.
 *
 * Run against a live preview: node tools/interact_check.mjs
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const exe = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync)
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  defaultViewport: { width: 1400, height: 900 },
})
const page = await browser.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text())
})

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` - ${detail}` : ''}`)
}

await page.goto('http://localhost:4193/', { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 3000))

// --- Playback via the space bar --------------------------------------
const before = await page.evaluate(() => window.__apron.store.minute.value)
await page.evaluate(() => document.body.focus())
await page.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 1300))
const during = await page.evaluate(() => ({
  minute: window.__apron.store.minute.value,
  playing: window.__apron.store.playing.value,
}))
await page.keyboard.press('Space')
const afterPause = await page.evaluate(() => window.__apron.store.playing.value)
check(
  'Space starts playback and the clock advances',
  during.playing && during.minute > before,
  `${before.toFixed(2)} -> ${during.minute.toFixed(2)} min`,
)
check('Space pauses playback again', afterPause === false)

// --- Timeline lane selects an actor ----------------------------------
await page.evaluate(() => {
  const lane = [...document.querySelectorAll('.lane')].find((l) =>
    l.textContent?.includes('摆渡车'),
  )
  lane?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
})
await new Promise((r) => setTimeout(r, 400))
const selected = await page.evaluate(() => ({
  id: window.__apron.store.selectedId.value,
  inspectorTitle: document.querySelector('.inspector h3')?.textContent?.trim() ?? null,
}))
check(
  'Clicking a timeline lane selects the actor',
  selected.id === 'stand-a12:bus' && !!selected.inspectorTitle,
  `${selected.id} / ${selected.inspectorTitle}`,
)

// --- Stand placards are distinct -------------------------------------
const placards = await page.evaluate(() => {
  const ctrl = window.__apron.scene()
  return ctrl['standLabels'].map((l) => ({
    text: l.text.text,
    y: l.object.position.y,
  }))
})
const distinctText = new Set(placards.map((p) => p.text)).size === placards.length
check(
  'Each stand has a distinct placard',
  placards.length === 3 && distinctText && placards.every((p) => p.y > 10),
  placards.map((p) => p.text).join(' / '),
)

// --- No stray errors -------------------------------------------------
check('No runtime errors during interaction', errs.length === 0, errs.slice(0, 2).join(' | '))

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} interaction checks passed`)
if (failed.length) process.exitCode = 1
await browser.close()
