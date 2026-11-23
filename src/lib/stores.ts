import { writable } from 'svelte/store'
import type { Blockage, Pt, WheelchairParams } from './types'

export const params = writable<WheelchairParams>({
  width: 0.72,
  length: 1.15,
  turnRadius: 1.5,
  threshold: 0.9,
})

export const blockages = writable<Blockage[]>([])
export const selected = writable<Blockage | null>(null)
export const status = writable<string>('就绪：点击“设置起点/终点”后在平面图上点选')
export const stats = writable({ colliders: 0, fps: 0, pathLen: 0 })
export const viewMode = writable<'free' | 'top' | 'fps'>('free')
export const roaming = writable(false)
export const pickMode = writable<'none' | 'start' | 'end'>('none')
export const hasPlan = writable(false)
export const hasPath = writable(false)
export const startPt = writable<Pt | null>(null)
export const endPt = writable<Pt | null>(null)
