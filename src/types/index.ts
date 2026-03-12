// ─── Pitch Set Types ─────────────────────────────────────────────────────────

export interface PitchSet {
  id: number           // 0–2047
  mask: number         // bitmask of 11 bits (excluding root)
  intervals: number[]  // semitones above root, always includes 0
  size: number         // note count
  name: string         // derived name or generated label
  signature: string    // e.g. "1 b2 2 b3" for display
}

export type NoteName =
  | 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F'
  | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B'

export type RootIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

// ─── SRS Types ───────────────────────────────────────────────────────────────

export type SRSGrade = 'again' | 'hard' | 'good' | 'easy'

export type MasteryState = 'new' | 'learning' | 'stable' | 'mastered'

export interface SRSRecord {
  id: number
  rootIndex: RootIndex
  dueAt: number          // Unix ms
  lastSeenAt: number     // Unix ms, 0 = never
  intervalDays: number
  easeFactor: number     // starts at 2.5
  reps: number
  lapses: number
  againCount: number
  hardCount: number
  easyCount: number
  mastery: MasteryState
  favorite: boolean
  held: boolean
  focused: boolean
}

// ─── Session Types ────────────────────────────────────────────────────────────

export type QueueReason = 'due' | 'weak' | 'new' | 'variety'

export interface QueueItem {
  id: number
  rootIndex: RootIndex
  reason: QueueReason
}

export interface SessionState {
  queue: QueueItem[]
  currentIndex: number
  dueCount: number
  newRemaining: number
  totalInSession: number
  heldItem: QueueItem | null
  focusId: number | null
}

// ─── Settings Types ───────────────────────────────────────────────────────────

export type Instrument = 'guitar' | 'bass'
export type NoteNaming = 'sharps' | 'flats' | 'both'
export type FretboardDisplayMode = 'notes' | 'degrees' | 'root-only'
export type FretboardPositionMode = 'focus' | 'all' | 'single'
export type StringCount = 4 | 6

export interface AppSettings {
  instrument: Instrument
  stringCount: StringCount
  tuning: number[]            // MIDI note numbers, low to high
  noteNaming: NoteNaming
  newPerDay: number
  sessionGoalMinutes: number
  rootIndex: RootIndex
  srsEnabled: boolean
}

// ─── Progress Types ───────────────────────────────────────────────────────────

export interface ProgressStats {
  totalSeen: number
  totalDue: number
  totalNew: number
  totalLearning: number
  totalStable: number
  totalMastered: number
  totalFavorites: number
  streak: number
  lastPracticed: number
  weakSpots: SRSRecord[]
}
