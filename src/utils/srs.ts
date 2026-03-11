import type { SRSRecord, SRSGrade, MasteryState, RootIndex, QueueItem, QueueReason } from '../types'

// ─── SRS Algorithm (SM-2 variant) ─────────────────────────────────────────────

const DEFAULT_EASE = 2.5
const MIN_EASE     = 1.3
const AGAIN_INTERVAL = 1          // 1 day
const HARD_FACTOR    = 0.8
const EASY_BONUS     = 1.3

export function createRecord(id: number, rootIndex: RootIndex): SRSRecord {
  return {
    id,
    rootIndex,
    dueAt: 0,
    lastSeenAt: 0,
    intervalDays: 0,
    easeFactor: DEFAULT_EASE,
    reps: 0,
    lapses: 0,
    againCount: 0,
    hardCount: 0,
    easyCount: 0,
    mastery: 'new',
    favorite: false,
    held: false,
    focused: false,
  }
}

export function gradeRecord(record: SRSRecord, grade: SRSGrade): SRSRecord {
  const now = Date.now()
  const r = { ...record, lastSeenAt: now, reps: record.reps + 1 }

  if (grade === 'again') {
    r.againCount++
    r.lapses++
    r.intervalDays = AGAIN_INTERVAL
    r.easeFactor = Math.max(MIN_EASE, r.easeFactor - 0.2)
    r.dueAt = now + AGAIN_INTERVAL * 86_400_000
  } else if (grade === 'hard') {
    r.hardCount++
    const interval = r.intervalDays < 1
      ? 1
      : Math.max(1, Math.round(r.intervalDays * HARD_FACTOR))
    r.intervalDays = interval
    r.easeFactor = Math.max(MIN_EASE, r.easeFactor - 0.15)
    r.dueAt = now + interval * 86_400_000
  } else {
    // easy
    r.easyCount++
    const interval = r.intervalDays < 1
      ? 1
      : Math.round(r.intervalDays * r.easeFactor * EASY_BONUS)
    r.intervalDays = Math.max(1, interval)
    r.easeFactor = r.easeFactor + 0.1
    r.dueAt = now + r.intervalDays * 86_400_000
  }

  r.mastery = computeMastery(r)
  return r
}

function computeMastery(r: SRSRecord): MasteryState {
  if (r.reps === 0) return 'new'
  if (r.intervalDays >= 21 && r.lapses === 0) return 'mastered'
  if (r.intervalDays >= 7) return 'stable'
  return 'learning'
}

export function isWeakSpot(record: SRSRecord): boolean {
  const totalReps = record.reps
  if (totalReps < 3) return false
  const lapseRate = record.lapses / totalReps
  return lapseRate > 0.3 || (record.lapses > 2 && record.intervalDays < 3)
}

export function isDue(record: SRSRecord): boolean {
  if (record.lastSeenAt === 0) return false
  return Date.now() >= record.dueAt
}

export function getMasteryScore(record: SRSRecord): number {
  // 0–100 score for visualization
  const states: MasteryState[] = ['new', 'learning', 'stable', 'mastered']
  const base = states.indexOf(record.mastery) * 25
  const bonus = Math.min(record.reps * 2, 20)
  return Math.min(100, base + bonus)
}

// ─── Queue Builder ────────────────────────────────────────────────────────────

export interface QueueOptions {
  records: Map<string, SRSRecord>  // key: `${id}:${rootIndex}`
  allIds: number[]
  rootIndex: RootIndex
  dailyNewCap: number
  newSeenToday: number
  holdItem: QueueItem | null
  focusId: number | null
  sessionSize: number
}

export function buildQueue(opts: QueueOptions): QueueItem[] {
  const { records, allIds, rootIndex, dailyNewCap, newSeenToday, focusId, sessionSize } = opts
  const now = Date.now()

  const queue: QueueItem[] = []
  const added = new Set<number>()

  function addItem(id: number, reason: QueueReason) {
    if (!added.has(id)) {
      added.add(id)
      queue.push({ id, rootIndex, reason })
    }
  }

  // Focus mode: only add focus set
  if (focusId !== null) {
    addItem(focusId, 'due')
    return queue
  }

  // 1. Due items
  const dueItems: number[] = []
  for (const id of allIds) {
    const key = `${id}:${rootIndex}`
    const rec = records.get(key)
    if (rec && isDue(rec)) {
      dueItems.push(id)
    }
  }
  dueItems.forEach(id => addItem(id, 'due'))

  // 2. Weak spots (not already due)
  const weakItems: number[] = []
  for (const id of allIds) {
    if (added.has(id)) continue
    const key = `${id}:${rootIndex}`
    const rec = records.get(key)
    if (rec && isWeakSpot(rec) && !isDue(rec)) {
      weakItems.push(id)
    }
  }
  weakItems.slice(0, Math.max(0, sessionSize - queue.length)).forEach(id => addItem(id, 'weak'))

  // 3. New items (never seen)
  const newAllowed = Math.max(0, dailyNewCap - newSeenToday)
  if (newAllowed > 0 && queue.length < sessionSize) {
    let newAdded = 0
    for (const id of allIds) {
      if (added.has(id)) continue
      if (newAdded >= newAllowed) break
      const key = `${id}:${rootIndex}`
      const rec = records.get(key)
      if (!rec || rec.reps === 0) {
        addItem(id, 'new')
        newAdded++
      }
    }
  }

  // 4. Variety (seen but not due, fill rest of session)
  if (queue.length < sessionSize) {
    const seenNotDue: number[] = []
    for (const id of allIds) {
      if (added.has(id)) continue
      const key = `${id}:${rootIndex}`
      const rec = records.get(key)
      if (rec && rec.reps > 0 && !isDue(rec)) {
        seenNotDue.push(id)
      }
    }
    // Pick random variety
    shuffleArray(seenNotDue)
      .slice(0, sessionSize - queue.length)
      .forEach(id => addItem(id, 'variety'))
  }

  return queue
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
