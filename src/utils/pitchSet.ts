import type { PitchSet, NoteName, NoteNaming, RootIndex } from '../types'

// ─── Note Names ───────────────────────────────────────────────────────────────

export const SHARP_NAMES: NoteName[] = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
export const FLAT_NAMES:  NoteName[] = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

/** Resolve a chromatic index to a display name for the given naming convention. */
function getNamingLabel(idx: number, naming: NoteNaming): string {
  if (naming === 'flats') return FLAT_NAMES[idx]
  if (naming === 'both') {
    const s = SHARP_NAMES[idx], f = FLAT_NAMES[idx]
    return s === f ? s : `${s}/${f}`
  }
  return SHARP_NAMES[idx]
}

export function getNoteName(semitone: number, naming: NoteNaming): string {
  return getNamingLabel(((semitone % 12) + 12) % 12, naming)
}

export function getNoteInKey(semitone: number, rootIndex: RootIndex, naming: NoteNaming): string {
  return getNamingLabel(((rootIndex + semitone) % 12 + 12) % 12, naming)
}

export function getRootName(rootIndex: RootIndex, naming: NoteNaming): string {
  return getNamingLabel(rootIndex, naming)
}

// ─── Interval Labels ──────────────────────────────────────────────────────────

const INTERVAL_NAMES: Record<number, string> = {
  0:  'R',
  1:  'b2',
  2:  '2',
  3:  'b3',
  4:  '3',
  5:  '4',
  6:  'b5',
  7:  '5',
  8:  'b6',
  9:  '6',
  10: 'b7',
  11: '7',
}

export function getIntervalName(semitone: number): string {
  return INTERVAL_NAMES[semitone] ?? `${semitone}`
}

// ─── Named Scale Database ─────────────────────────────────────────────────────
// Map from sorted interval array (joined) to scale name

const NAMED_SCALES: Record<string, string> = {
  // 5-note
  '0,2,4,7,9':       'Major Pentatonic',
  '0,3,5,7,10':      'Minor Pentatonic',
  '0,2,4,7,10':      'Dominant Pentatonic',
  '0,1,5,7,8':       'Insen',
  '0,2,5,7,9':       'Hirajoshi',
  '0,2,3,7,8':       'Iwato',
  // 6-note
  '0,2,3,5,7,9':     'Minor Blues (alt)',
  '0,2,4,5,7,9':     'Major Hexatonic',
  '0,3,5,6,7,10':    'Blues Scale',
  '0,2,4,6,8,10':    'Whole Tone',
  // 7-note
  '0,2,4,5,7,9,11':  'Major (Ionian)',
  '0,2,3,5,7,9,10':  'Dorian',
  '0,1,3,5,7,8,10':  'Phrygian',
  '0,2,4,6,7,9,11':  'Lydian',
  '0,2,4,5,7,9,10':  'Mixolydian',
  '0,2,3,5,7,8,10':  'Natural Minor (Aeolian)',
  '0,1,3,5,6,8,10':  'Locrian',
  '0,2,3,5,7,8,11':  'Harmonic Minor',
  '0,2,3,5,7,9,11':  'Melodic Minor',
  '0,1,3,5,7,8,11':  'Phrygian Dominant',
  '0,2,4,5,7,8,11':  'Lydian Dominant (alt)',
  '0,2,4,6,7,9,10':  'Lydian Dominant',
  '0,2,4,6,8,9,11':  'Acoustic (Lydian b7)',
  '0,1,3,4,6,8,10':  'Super Locrian',
  '0,2,4,5,7,8,10':  'Mixolydian b6',
  '0,2,3,5,6,8,10':  'Half-Diminished (Locrian #2)',
  '0,1,3,4,6,7,9':   'Altered Scale',
  '0,1,4,5,7,8,11':  'Double Harmonic Major',
  '0,2,4,6,7,8,11':  'Lydian #2',
  // 8-note
  '0,1,3,4,6,7,9,10': 'Diminished (Half-Whole)',
  '0,2,3,5,6,8,9,11': 'Diminished (Whole-Half)',
  '0,1,2,4,6,7,9,10': 'Bebop Dominant',
  // 12-note
  '0,1,2,3,4,5,6,7,8,9,10,11': 'Chromatic',
}

function intervalsToKey(intervals: number[]): string {
  return [...intervals].sort((a, b) => a - b).join(',')
}

// ─── Core Generator ───────────────────────────────────────────────────────────

/**
 * Generate a PitchSet from an integer id (0–2047).
 * Bits 0–10 of `id` represent presence of intervals 1–11.
 * Interval 0 (root) is always present.
 */
export function generatePitchSet(id: number): PitchSet {
  const mask = id & 0x7FF // 11 bits
  const intervals: number[] = [0]

  for (let bit = 0; bit < 11; bit++) {
    if (mask & (1 << bit)) {
      intervals.push(bit + 1)
    }
  }

  const key = intervalsToKey(intervals)
  const name = NAMED_SCALES[key] ?? buildGenericName(intervals)
  const signature = intervals.map(getIntervalName).join(' ')

  return { id, mask, intervals, size: intervals.length, name, signature }
}

function buildGenericName(intervals: number[]): string {
  const size = intervals.length
  const hasThird = intervals.includes(3) || intervals.includes(4)
  const hasFifth = intervals.includes(7)
  const isMinor = intervals.includes(3) && !intervals.includes(4)

  if (size === 1) return 'Root Only'
  if (size === 2) return `Interval Set (${getIntervalName(intervals[1])})`
  if (size <= 4) return `${size}-Note Cluster`
  if (size === 5) return isMinor ? 'Minor-Type Pentatonic' : '5-Note Set'
  if (size === 6) return '6-Note Set'
  if (size === 7) {
    if (!hasThird) return '7-Note Quartal Set'
    if (!hasFifth) return '7-Note No-Fifth Set'
    return isMinor ? 'Minor-Type Heptatonic' : 'Major-Type Heptatonic'
  }
  if (size === 8) return '8-Note Set'
  return `${size}-Note Set`
}

// ─── Preset Filters ───────────────────────────────────────────────────────────

export type PresetKey = 'beginner' | 'intermediate' | 'common' | 'all' | 'chaos' | 'holdsworth'

// Cache for deterministic presets (chaos is excluded — it's random every call)
const _presetCache = new Map<PresetKey, number[]>()

const BEGINNER_INTERVALS = [
  '0,2,4,5,7,9,11',  // Major
  '0,2,3,5,7,8,10',  // Natural Minor
  '0,3,5,7,10',      // Minor Pentatonic
  '0,2,4,7,9',       // Major Pentatonic
  '0,3,5,6,7,10',    // Blues
  '0,2,4,5,7,9,10',  // Mixolydian
  '0,2,3,5,7,9,10',  // Dorian
  '0,2,3,5,7,8,11',  // Harmonic Minor
]

export function getPresetIds(preset: PresetKey): number[] {
  if (preset === 'all') return Array.from({ length: 2048 }, (_, i) => i)
  if (preset === 'chaos') {
    // Random 50 from all 2048 — intentionally not cached
    return shuffleArray(Array.from({ length: 2048 }, (_, i) => i)).slice(0, 50)
  }

  const cached = _presetCache.get(preset)
  if (cached) return cached

  const ids: number[] = []
  for (let id = 0; id < 2048; id++) {
    const ps = generatePitchSet(id)
    const key = intervalsToKey(ps.intervals)
    if (preset === 'beginner') {
      if (BEGINNER_INTERVALS.includes(key)) ids.push(id)
    } else if (preset === 'intermediate') {
      if (ps.size >= 5 && ps.size <= 7 && NAMED_SCALES[key]) ids.push(id)
    } else if (preset === 'common') {
      if (NAMED_SCALES[key]) ids.push(id)
    } else if (preset === 'holdsworth') {
      // Complex, 7+ note sets with unusual intervals (b2 or b5)
      if (ps.size >= 7 && (ps.intervals.includes(1) || ps.intervals.includes(6))) ids.push(id)
    }
  }

  _presetCache.set(preset, ids)
  return ids
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Prioritized Practice Ordering ───────────────────────────────────────────
// Returns all 2048 IDs ordered by musical usefulness for the "new" queue.
// Named 5-7 note sets first → named 4/8 note sets → unnamed 5-7 → rest.
// Sets with < 3 notes are placed at the very end (rarely useful in practice).

let _prioritizedIds: number[] | null = null

export function getPrioritizedIds(): number[] {
  if (_prioritizedIds) return _prioritizedIds

  const tier1: number[] = [] // named, 5–7 notes
  const tier2: number[] = [] // named, 4 or 8 notes
  const tier3: number[] = [] // unnamed, 5–7 notes
  const tier4: number[] = [] // unnamed, 4 or 8 notes
  const tier5: number[] = [] // 3 notes
  const tier6: number[] = [] // 9–11 notes
  const tier7: number[] = [] // 1–2 notes (trivial)

  for (let id = 0; id < 2048; id++) {
    const ps = generatePitchSet(id)
    const isNamed = !ps.name.includes('-Note') && !ps.name.includes('Cluster') &&
                    !ps.name.includes('Set') && !ps.name.includes('Root Only') &&
                    !ps.name.includes('Interval')

    if (ps.size >= 5 && ps.size <= 7) {
      isNamed ? tier1.push(id) : tier3.push(id)
    } else if (ps.size === 4 || ps.size === 8) {
      isNamed ? tier2.push(id) : tier4.push(id)
    } else if (ps.size === 3) {
      tier5.push(id)
    } else if (ps.size >= 9) {
      tier6.push(id)
    } else {
      tier7.push(id) // 1–2 notes
    }
  }

  _prioritizedIds = [...tier1, ...tier2, ...tier3, ...tier4, ...tier5, ...tier6, ...tier7]
  return _prioritizedIds
}

// ─── Search ───────────────────────────────────────────────────────────────────

// Lazy pool of all 2048 pitch sets — generated once, reused for every search
let _allPitchSets: PitchSet[] | null = null
function getAllPitchSets(): PitchSet[] {
  if (!_allPitchSets) {
    _allPitchSets = Array.from({ length: 2048 }, (_, id) => generatePitchSet(id))
  }
  return _allPitchSets
}

export function searchPitchSets(query: string, limit = 50): PitchSet[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const results: PitchSet[] = []
  for (const ps of getAllPitchSets()) {
    if (results.length >= limit) break
    if (
      ps.name.toLowerCase().includes(q) ||
      ps.signature.toLowerCase().includes(q) ||
      `#${ps.id}`.includes(q)
    ) {
      results.push(ps)
    }
  }
  return results
}

// ─── Fretboard Utilities ──────────────────────────────────────────────────────

export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64] // E2 A2 D3 G3 B3 E4 MIDI
export const BASS_TUNING     = [28, 33, 38, 43]          // E1 A1 D2 G2

export interface FretNote {
  string: number  // 0 = low E
  fret: number
  midiNote: number
  isRoot: boolean
  degree: number  // semitone interval
  degreeLabel: string
}

export function getFretboardNotes(
  intervals: number[],
  rootIndex: RootIndex,
  tuning: number[],
  fretCount = 12,
): FretNote[] {
  const notes: FretNote[] = []
  const intervalSet = new Set(intervals)

  for (let s = 0; s < tuning.length; s++) {
    for (let f = 0; f <= fretCount; f++) {
      const midi = tuning[s] + f
      const degree = ((midi - rootIndex) % 12 + 12) % 12
      if (intervalSet.has(degree)) {
        notes.push({
          string: s,
          fret: f,
          midiNote: midi,
          isRoot: degree === 0,
          degree,
          degreeLabel: getIntervalName(degree),
        })
      }
    }
  }

  return notes
}

export function getFocusZoneNotes(
  allNotes: FretNote[],
  tuning: number[],
  rootIndex: RootIndex,
): FretNote[] {
  // Find the best 5-fret window with the most coverage
  let bestFret = 0
  let bestScore = -1

  for (let startFret = 0; startFret <= 7; startFret++) {
    const endFret = startFret + 4
    const inWindow = allNotes.filter(n => n.fret >= startFret && n.fret <= endFret)
    // Score: coverage across strings
    const strings = new Set(inWindow.map(n => n.string))
    const score = strings.size * 10 + inWindow.length
    if (score > bestScore) {
      bestScore = score
      bestFret = startFret
    }
  }

  return allNotes.filter(n => n.fret >= bestFret && n.fret <= bestFret + 4)
}
