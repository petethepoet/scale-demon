import type { SRSRecord, SRSGrade, MasteryState, RootIndex, QueueItem, QueueReason } from '../types'

// ─── SRS Algorithm (SM-2 variant) ─────────────────────────────────────────────

const DEFAULT_EASE = 2.5
const MIN_EASE     = 1.3
const AGAIN_INTERVAL = 1          // 1 day
const HARD_FACTOR    = 0.8
const EASY_BONUS     = 1.3
const GOOD_FACTOR    = 1.0        // standard interval × ease, ease unchanged

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
  } else if (grade === 'good') {
    const interval = r.intervalDays < 1
      ? 1
      : Math.round(r.intervalDays * r.easeFactor * GOOD_FACTOR)
    r.intervalDays = Math.max(1, interval)
    // ease factor unchanged — that's the whole point of "good"
    r.dueAt = now + r.intervalDays * 86_400_000
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

const ALL_ROOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const

export function buildQueue(opts: QueueOptions): QueueItem[] {
  const { records, allIds, rootIndex, dailyNewCap, newSeenToday, focusId, sessionSize } = opts
  const now = Date.now()

  const queue: QueueItem[] = []
  // Deduplicate by id:rootIndex — same scale in different roots are distinct items
  const added = new Set<string>()

  function addItem(id: number, ri: RootIndex, reason: QueueReason) {
    const key = `${id}:${ri}`
    if (!added.has(key)) {
      added.add(key)
      queue.push({ id, rootIndex: ri, reason })
    }
  }

  // Focus mode: only add focus set in preferred root
  if (focusId !== null) {
    addItem(focusId, rootIndex, 'due')
    return queue
  }

  // 1. Due items — scan ALL roots, not just preferred
  //    Sort: preferred root first, then others alphabetically by rootIndex
  const dueItems: Array<{ id: number; ri: RootIndex }> = []
  for (const id of allIds) {
    for (const ri of ALL_ROOTS) {
      const rec = records.get(`${id}:${ri}`)
      if (rec && isDue(rec)) {
        dueItems.push({ id, ri: ri as RootIndex })
      }
    }
  }
  // Preferred root first so the session starts familiar
  dueItems.sort((a, b) => {
    const aScore = a.ri === rootIndex ? 0 : 1
    const bScore = b.ri === rootIndex ? 0 : 1
    return aScore - bScore
  })
  dueItems.forEach(({ id, ri }) => addItem(id, ri, 'due'))

  // 2. Weak spots — scan ALL roots (not already due)
  const weakItems: Array<{ id: number; ri: RootIndex }> = []
  for (const id of allIds) {
    for (const ri of ALL_ROOTS) {
      const key = `${id}:${ri}`
      if (added.has(key)) continue
      const rec = records.get(key)
      if (rec && isWeakSpot(rec) && !isDue(rec)) {
        weakItems.push({ id, ri: ri as RootIndex })
      }
    }
  }
  // Preferred root first
  weakItems.sort((a, b) => (a.ri === rootIndex ? 0 : 1) - (b.ri === rootIndex ? 0 : 1))
  weakItems
    .slice(0, Math.max(0, sessionSize - queue.length))
    .forEach(({ id, ri }) => addItem(id, ri, 'weak'))

  // 3. New items — always in preferred root (don't overwhelm with cross-root introductions)
  const newAllowed = Math.max(0, dailyNewCap - newSeenToday)
  if (newAllowed > 0 && queue.length < sessionSize) {
    let newAdded = 0
    for (const id of allIds) {
      if (added.has(`${id}:${rootIndex}`)) continue
      if (newAdded >= newAllowed) break
      const rec = records.get(`${id}:${rootIndex}`)
      if (!rec || rec.reps === 0) {
        addItem(id, rootIndex, 'new')
        newAdded++
      }
    }
  }

  // 4. Variety — preferred root only (seen but not due, fill rest of session)
  if (queue.length < sessionSize) {
    const seenNotDue: number[] = []
    for (const id of allIds) {
      if (added.has(`${id}:${rootIndex}`)) continue
      const rec = records.get(`${id}:${rootIndex}`)
      if (rec && rec.reps > 0 && !isDue(rec)) {
        seenNotDue.push(id)
      }
    }
    shuffleArray(seenNotDue)
      .slice(0, sessionSize - queue.length)
      .forEach(id => addItem(id, rootIndex, 'variety'))
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
