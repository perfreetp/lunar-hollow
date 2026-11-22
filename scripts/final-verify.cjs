/* 主应用修复逻辑最终验证（同一页面上下文，避免标签页状态差异） */
const WebSocket = require('ws')
const http = require('http')
const put = (p) => new Promise((res, rej) => { const q = http.request(`http://127.0.0.1:9222${p}`, { method: 'PUT' }, (r) => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(JSON.parse(d))) }); q.on('error',rej); q.end() })
async function main() {
  const target = await put('/json/new?http://127.0.0.1:5180/')
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false })
  let id = 0; const pending = new Map()
  await new Promise((r) => ws.on('open', r))
  ws.on('message', (raw) => { const m = JSON.parse(raw.toString()); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) } })
  const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })) })
  await send('Runtime.enable'); await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:5180/' })
  await new Promise((r) => setTimeout(r, 8000))

  const r = await send('Runtime.evaluate', {
    returnByValue: true,
    awaitPromise: true,
    expression: `(async () => {
      try {
        const e = window.__engine
        const wait = (ms) => new Promise(r => setTimeout(r, ms))

        // 初始基线
        e.setAllFade(0)
        await wait(300)
        const base0 = e.debugSample()

        // 满褪
        e.setAllFade(1)
        await wait(300)
        const faded1 = e.debugSample()

        // 在每个构件的修复遮罩上画大白圆
        for (const comp of e.getComponents()) {
          const cv = comp.restoreCanvas
          const ctx = cv.getContext('2d')
          ctx.fillStyle = '#000'; ctx.fillRect(0,0,cv.width,cv.height)
          const g = ctx.createRadialGradient(cv.width/2,cv.height/2,10,cv.width/2,cv.height/2,cv.width/2)
          g.addColorStop(0,'rgba(255,255,255,1)')
          g.addColorStop(1,'rgba(255,255,255,0.85)')
          ctx.fillStyle = g
          ctx.fillRect(0,0,cv.width,cv.height)
          comp.restoreTexture.needsUpdate = true
        }
        await wait(800)
        const restored = e.debugSample()

        // 清除所有修复
        for (const comp of e.getComponents()) {
          const ctx = comp.restoreCanvas.getContext('2d')
          ctx.fillStyle = '#000'; ctx.fillRect(0,0,comp.restoreCanvas.width,comp.restoreCanvas.height)
          comp.restoreTexture.needsUpdate = true
        }
        await wait(800)
        const cleared = e.debugSample()
        e.setAllFade(0)

        const d = (a, b) => a.grid.reduce((s, v, i) => s + Math.abs(v - b.grid[i]), 0)
        return {
          modelLum: { intact: base0.modelLum, faded: faded1.modelLum, restored: restored.modelLum, cleared: cleared.modelLum },
          gridDiff: {
            intactVsFaded: d(base0, faded1),
            fadedVsRestored: d(faded1, restored),
            restoredVsIntact: d(restored, base0),
            fadedVsCleared: d(faded1, cleared)
          }
        }
      } catch (err) { return { error: String(err && err.stack ? err.stack : err) } }
    })()`
  })
  console.log(JSON.stringify(r.result.value, null, 2))
  ws.close(); process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
