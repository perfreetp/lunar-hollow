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
await page.goto('http://localhost:4193/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 3500))

// Cinematic default camera at a mid-task time, all stands visible.
await page.evaluate(() => {
  const s = window.__apron.store
  const c = window.__apron.scene()
  s.setMinute(16)
  s.setStandFilter('all')
  const cam = c['perspCam']
  cam.position.set(96, 74, 132)
  cam.lookAt(0, 0, 4)
  c['controlsPersp'].target.set(0, 0, 4)
  c['controlsPersp'].update()
  c.renderNow()
})
await new Promise((r) => setTimeout(r, 900))
let el = await page.$('.viewport')
await el.screenshot({ path: path.resolve('tools/shots/60-overview.png') })

// A12 at a busy moment.
await page.evaluate(() => {
  const s = window.__apron.store
  s.setMinute(16)
  s.setStandFilter('stand-a12')
})
await new Promise((r) => setTimeout(r, 900))
el = await page.$('.viewport')
await el.screenshot({ path: path.resolve('tools/shots/61-a12-busy.png') })

// Select the fuel truck and show the inspector.
await page.evaluate(() => {
  window.__apron.store.select('stand-a12:fuel')
})
await new Promise((r) => setTimeout(r, 600))
await page.screenshot({ path: path.resolve('tools/shots/62-selected-full.png') })

// Orthographic top-down.
await page.evaluate(() => {
  const s = window.__apron.store
  s.setStandFilter('all')
  s.viewMode.value = 'orthographic'
})
await new Promise((r) => setTimeout(r, 500))
await page.evaluate(() => window.__apron.viewport().topView())
await new Promise((r) => setTimeout(r, 700))
el = await page.$('.viewport')
await el.screenshot({ path: path.resolve('tools/shots/63-ortho-top.png') })
await browser.close()
console.log('ok')
