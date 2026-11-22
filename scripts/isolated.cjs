/* 隔离页面测试：无 postprocessing/Vue 干扰 */
const WebSocket = require('ws')
const http = require('http')
const put = (p) => new Promise((res, rej) => { const q = http.request(`http://127.0.0.1:9222${p}`, { method: 'PUT' }, (r) => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(JSON.parse(d))) }); q.on('error',rej); q.end() })
async function main() {
  const target = await put('/json/new?http://127.0.0.1:5180/src/test/isolated.html')
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false })
  let id = 0; const pending = new Map()
  await new Promise((r) => ws.on('open', r))
  const errors = []
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString())
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.description || a.value).join(' '))
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })) })
  await send('Runtime.enable'); await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 512, height: 512, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:5180/src/test/isolated.html' })
  await new Promise((r) => setTimeout(r, 4000))

  const r = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(async () => {
      const t = window.__test
      const gl = t.renderer.getContext()
      const measure = () => {
        t.renderer.setRenderTarget(null)
        t.renderer.render(t.scene, t.camera)
        const px = new Uint8Array(512*512*4)
        gl.readPixels(0, 0, 512, 512, gl.RGBA, gl.UNSIGNED_BYTE, px)
        let sum = 0, n = 0
        for (let i = 0; i < px.length; i += 4) {
          const lum = (px[i]+px[i+1]+px[i+2])/3
          if (Math.abs(lum-31) > 12) { sum += lum; n++ }
        }
        return Math.round(sum / Math.max(1, n))
      }
      // 1. fade=0
      t.mat.setFade(0)
      await new Promise(r=>setTimeout(r,200))
      const fade0 = measure()
      // 2. fade=1
      t.mat.setFade(1)
      await new Promise(r=>setTimeout(r,200))
      const fade1 = measure()
      // 3. 全白修复遮罩 + fade=1（应恢复到接近 fade0）
      const ctx = t.restoreCanvas.getContext('2d')
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,512,512)
      t.restoreTexture.needsUpdate = true
      await new Promise(r=>setTimeout(r,500))
      const fade1Masked = measure()
      // 4. 清除遮罩后应回到 fade1
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,512,512)
      t.restoreTexture.needsUpdate = true
      await new Promise(r=>setTimeout(r,500))
      const fade1Cleared = measure()
      return { fade0, fade1, fade1Masked, fade1Cleared }
    })()`,
    awaitPromise: true
  })
  const v = r.result?.value
  console.log('errors:', JSON.stringify(errors, null, 2))
  console.log(JSON.stringify(v, null, 2))
  if (!v) process.exit(2)
  const restoreWorks = Math.abs(v.fade1Masked - v.fade0) < 15
  const fadeWorks = v.fade0 !== v.fade1
  const clearWorks = Math.abs(v.fade1Cleared - v.fade1) < 15
  const ok = restoreWorks && fadeWorks && clearWorks
  console.log(`褪色变化: ${fadeWorks}, 修复生效: ${restoreWorks}, 清除恢复: ${clearWorks}`)
  console.log(ok ? 'PASS 隔离环境：修复遮罩与褪色逻辑正确' : 'FAIL 隔离环境仍异常')
  ws.close(); process.exit(ok ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
