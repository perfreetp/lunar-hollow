/* 视觉确认：设置褪色 70% 后截图保存 */
const WebSocket = require('ws')
const http = require('http')
const fs = require('fs')
const get = (p) => new Promise((res, rej) => { http.get(`http://127.0.0.1:9222${p}`, (r) => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(JSON.parse(d))) }).on('error', rej) })
const put = (p) => new Promise((res, rej) => { const q = http.request(`http://127.0.0.1:9222${p}`, { method: 'PUT' }, (r) => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(JSON.parse(d))) }); q.on('error',rej); q.end() })

async function main() {
  const target = await put('/json/new?http://127.0.0.1:5180/')
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false })
  let id = 0
  const pending = new Map()
  await new Promise((r) => ws.on('open', r))
  ws.on('message', (raw) => { const m = JSON.parse(raw.toString()); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) } })
  const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })) })
  await send('Runtime.enable'); await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:5180/' })
  await new Promise((r) => setTimeout(r, 6500))

  // 褪色 70%，双层模式
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('.timeline')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, 70)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })()`
  })
  await new Promise((r) => setTimeout(r, 1200))
  const shot1 = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync('D:/ccfb/runs/1000215/workspace/smoke-fade70.png', Buffer.from(shot1.data, 'base64'))

  // 仅底层纹样
  await send('Runtime.evaluate', {
    expression: `[...document.querySelectorAll('.layer-grid button')].find(b => b.textContent.includes('仅底层')).click()`
  })
  await new Promise((r) => setTimeout(r, 1200))
  const shot2 = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync('D:/ccfb/runs/1000215/workspace/smoke-base-layer.png', Buffer.from(shot2.data, 'base64'))

  console.log('截图已保存')
  ws.close(); process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
