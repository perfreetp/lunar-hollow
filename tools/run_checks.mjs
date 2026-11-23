/**
 * One-shot verification runner: builds, starts a preview server, runs every
 * headless browser check, and shuts the server down.
 *
 * Usage: npm run verify
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 4193
const BASE = `http://localhost:${PORT}/`
const SHOTS = path.resolve('tools/shots')
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Run a Node script directly (no shell), so exit codes are reliable. */
function run(script, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let out = ''
    child.stdout?.on('data', (d) => {
      out += d.toString()
      process.stdout.write(d)
    })
    child.stderr?.on('data', (d) => process.stderr.write(d))
    child.on('close', (code) => resolve({ code: code ?? 1, out }))
  })
}

async function waitForServer(url, timeoutMs = 30_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (res.ok) return true
    } catch {
      // Not up yet.
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  return false
}

async function main() {
  console.log('\n=== build ===')
  const build = await run(path.join(ROOT, 'node_modules/vite/bin/vite.js'), ['build'])
  if (build.code !== 0) {
    console.error('Build failed')
    process.exit(1)
  }

  console.log('\n=== preview server ===')
  // Launch Vite's own entry point with Node directly: under `shell: true` the
  // server ends up parented to a cmd.exe that can exit mid-run on Windows.
  const server = spawn(
    process.execPath,
    [
      path.join(ROOT, 'node_modules/vite/bin/vite.js'),
      'preview',
      '--port',
      String(PORT),
      '--strictPort',
    ],
    {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  )
  server.stdout?.on('data', () => {})
  server.stderr?.on('data', (d) => process.stderr.write(d))
  const cleanup = () => {
    try {
      server.kill('SIGTERM')
    } catch {
      // Already gone.
    }
  }
  process.on('exit', cleanup)
  process.on('SIGINT', () => {
    cleanup()
    process.exit(130)
  })

  if (!(await waitForServer(BASE))) {
    console.error(`Preview server never came up on ${BASE}`)
    cleanup()
    process.exit(1)
  }

  const scripts = [
    ['browser_check.mjs', [BASE]],
    ['visual_check.mjs', []],
    ['occlusion_check.mjs', []],
    ['roundtrip_check.mjs', []],
    ['interact_check.mjs', []],
  ]

  let failed = 0
  for (const [script, args] of scripts) {
    console.log(`\n=== ${script} ===`)
    // Re-check the server before each script so a death is reported where it
    // happens rather than as a confusing navigation error.
    if (!(await waitForServer(BASE, 4000))) {
      console.error(`Preview server died before ${script}`)
      failed++
      continue
    }
    const result = await run(path.join(ROOT, 'tools', script), args)
    if (result.code !== 0) failed++
  }

  cleanup()

  if (existsSync(SHOTS)) console.log(`\nScreenshots: ${SHOTS}`)
  if (failed) {
    console.error(`\n${failed} check script(s) failed`)
    process.exit(1)
  }
  console.log('\nAll checks passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
