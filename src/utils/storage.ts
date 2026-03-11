import type { SRSRecord, AppSettings, RootIndex } from '../types'
import { STANDARD_TUNING } from './pitchSet'

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  RECORDS:          'sd:records',
  SETTINGS:         'sd:settings',
  STREAK:           'sd:streak',
  LAST_PRACTICED:   'sd:lastPracticed',
  NEW_TODAY:        'sd:newToday',
  NEW_TODAY_DATE:   'sd:newTodayDate',
  SESSION:          'sd:session',
} as const

// ─── Default Settings ─────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  instrument: 'guitar',
  stringCount: 6,
  tuning: STANDARD_TUNING,
  noteNaming: 'sharps',
  newPerDay: 5,
  sessionGoalMinutes: 10,
  rootIndex: 0,
  srsEnabled: true,
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

// ─── SRS Records ──────────────────────────────────────────────────────────────

export function loadRecords(): Map<string, SRSRecord> {
  try {
    const raw = localStorage.getItem(KEYS.RECORDS)
    if (!raw) return new Map()
    const obj = JSON.parse(raw) as Record<string, SRSRecord>
    return new Map(Object.entries(obj))
  } catch {
    return new Map()
  }
}

export function saveRecords(records: Map<string, SRSRecord>): void {
  const obj: Record<string, SRSRecord> = {}
  records.forEach((val, key) => { obj[key] = val })
  localStorage.setItem(KEYS.RECORDS, JSON.stringify(obj))
}

export function recordKey(id: number, rootIndex: RootIndex): string {
  return `${id}:${rootIndex}`
}

// ─── Streak ───────────────────────────────────────────────────────────────────

interface StreakData {
  count: number
  lastDate: string  // YYYY-MM-DD
}

export function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(KEYS.STREAK)
    if (!raw) return { count: 0, lastDate: '' }
    return JSON.parse(raw)
  } catch {
    return { count: 0, lastDate: '' }
  }
}

export function updateStreak(): number {
  const today = getTodayString()
  const streak = loadStreak()

  if (streak.lastDate === today) return streak.count

  const yesterday = getYesterdayString()
  const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1

  localStorage.setItem(KEYS.STREAK, JSON.stringify({ count: newCount, lastDate: today }))
  return newCount
}

// ─── Daily New Tracking ───────────────────────────────────────────────────────

export function getNewSeenToday(): number {
  const today = getTodayString()
  const storedDate = localStorage.getItem(KEYS.NEW_TODAY_DATE)
  if (storedDate !== today) {
    localStorage.setItem(KEYS.NEW_TODAY_DATE, today)
    localStorage.setItem(KEYS.NEW_TODAY, '0')
    return 0
  }
  return parseInt(localStorage.getItem(KEYS.NEW_TODAY) ?? '0', 10)
}

export function incrementNewSeenToday(): void {
  const current = getNewSeenToday()
  localStorage.setItem(KEYS.NEW_TODAY, String(current + 1))
}

// ─── Import / Export ──────────────────────────────────────────────────────────

export interface ExportData {
  version: 1
  exportedAt: number
  settings: AppSettings
  records: Record<string, SRSRecord>
  streak: { count: number; lastDate: string }
}

export function exportData(): ExportData {
  const records: Record<string, SRSRecord> = {}
  loadRecords().forEach((val, key) => { records[key] = val })

  return {
    version: 1,
    exportedAt: Date.now(),
    settings: loadSettings(),
    records,
    streak: loadStreak(),
  }
}

export function importData(data: ExportData): void {
  if (data.version !== 1) throw new Error('Unsupported export version')
  saveSettings(data.settings)
  saveRecords(new Map(Object.entries(data.records)))
  localStorage.setItem(KEYS.STREAK, JSON.stringify(data.streak))
}

export function resetAllData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function getYesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}
