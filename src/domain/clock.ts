/** Minute <-> wall-clock formatting. The scenario clock is airline-local. */

export interface ClockParts {
  hh: string
  mm: string
}

const pad = (n: number): string => String(Math.floor(n)).padStart(2, '0')

/** Format an offset in minutes from `startsAt` as HH:MM (24h). */
export function formatClock(startsAt: string, offsetMin: number): string {
  const base = Date.parse(startsAt)
  if (Number.isNaN(base)) return formatMinutes(offsetMin)
  const d = new Date(base + Math.round(offsetMin) * 60_000)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Format an offset as HH:MM:SS-style relative "MM分" for durations. */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} 分钟`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest === 0 ? `${h} 小时` : `${h} 小时 ${rest} 分`
}

/** Format an offset as +HH:MM / -HH:MM, for relative schedule hints. */
export function formatOffset(offsetMin: number): string {
  const sign = offsetMin < 0 ? '-' : '+'
  const abs = Math.abs(Math.round(offsetMin))
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

export function formatMinutes(offsetMin: number): string {
  const abs = Math.max(0, Math.round(offsetMin))
  return `${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/** Long date label for the header, e.g. "2026年11月23日 星期一". */
export function formatDate(startsAt: string): string {
  const base = new Date(Date.parse(startsAt))
  if (Number.isNaN(base.getTime())) return ''
  const weekday = '日一二三四五六'[base.getDay()]
  return `${base.getFullYear()}年${base.getMonth() + 1}月${base.getDate()}日 星期${weekday}`
}

/** Parse "HH:MM" into minutes since midnight, or null. */
export function parseClock(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

/** ISO string for the given local offset from `startsAt`. */
export function offsetToIso(startsAt: string, offsetMin: number): string {
  const base = Date.parse(startsAt)
  if (Number.isNaN(base)) return new Date().toISOString()
  return new Date(base + offsetMin * 60_000).toISOString()
}
