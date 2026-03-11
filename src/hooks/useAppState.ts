import { useState, useCallback, useEffect, useMemo } from 'react'
import type { SRSRecord, AppSettings, QueueItem, RootIndex, SRSGrade } from '../types'
import {
  loadRecords, saveRecords,
  loadSettings as loadSettingsFromStorage,
  saveSettings as saveSettingsToStorage,
  recordKey, getNewSeenToday, incrementNewSeenToday, updateStreak,
  loadStreak,
} from '../utils/storage'
import { createRecord, gradeRecord, buildQueue, isDue, isWeakSpot } from '../utils/srs'
import { generatePitchSet, getPrioritizedIds } from '../utils/pitchSet'

// Lazily computed on first use — named 5-7 note sets first, trivial sets last
const ACTIVE_IDS = getPrioritizedIds()
const SESSION_SIZE = 10

export function useAppState() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettingsFromStorage)
  const [records, setRecordsState] = useState<Map<string, SRSRecord>>(loadRecords)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [heldItem, setHeldItem] = useState<QueueItem | null>(null)
  const [focusId, setFocusId] = useState<number | null>(null)
  const [newSeenToday, setNewSeenToday] = useState(getNewSeenToday)
  const [streak, setStreak] = useState(() => loadStreak().count)

  // ─── Queue rebuild ────────────────────────────────────────────────────
  const rebuildQueueFn = useCallback((
    recs: Map<string, SRSRecord>,
    cfg: AppSettings,
    newSeen: number,
    focId: number | null,
    held: QueueItem | null,
  ) => {
    const q = buildQueue({
      records: recs,
      allIds: ACTIVE_IDS,
      rootIndex: cfg.rootIndex,
      dailyNewCap: cfg.newPerDay,
      newSeenToday: newSeen,
      holdItem: held,
      focusId: focId,
      sessionSize: SESSION_SIZE,
    })
    setQueue(q)
    setCurrentIndex(0)
  }, [])

  // Initial queue build
  useEffect(() => {
    rebuildQueueFn(records, settings, newSeenToday, focusId, heldItem)
  }, []) // eslint-disable-line

  // ─── Current item ─────────────────────────────────────────────────────
  const currentItem = useMemo((): QueueItem | null => {
    if (heldItem) return heldItem
    return queue[currentIndex] ?? null
  }, [queue, currentIndex, heldItem])

  const currentPitchSet = useMemo(() => {
    if (!currentItem) return null
    return generatePitchSet(currentItem.id)
  }, [currentItem])

  // ─── Grade ────────────────────────────────────────────────────────────
  const grade = useCallback((g: SRSGrade) => {
    if (!currentItem) return

    const key = recordKey(currentItem.id, currentItem.rootIndex)
    const existing = records.get(key) ?? createRecord(currentItem.id, currentItem.rootIndex)
    const updated = gradeRecord(existing, g)

    const newRecs = new Map(records)
    newRecs.set(key, updated)
    setRecordsState(newRecs)
    saveRecords(newRecs)

    // Track new items
    if (existing.reps === 0) {
      incrementNewSeenToday()
      setNewSeenToday(prev => prev + 1)
    }

    // Update streak
    const s = updateStreak()
    setStreak(s)

    // Advance
    if (heldItem) {
      setHeldItem(null)
    } else {
      const next = currentIndex + 1
      if (next >= queue.length) {
        rebuildQueueFn(newRecs, settings, newSeenToday + (existing.reps === 0 ? 1 : 0), focusId, null)
      } else {
        setCurrentIndex(next)
      }
    }
  }, [currentItem, records, heldItem, currentIndex, queue, settings, newSeenToday, focusId, rebuildQueueFn])

  // ─── Next ─────────────────────────────────────────────────────────────
  const next = useCallback(() => {
    if (heldItem) {
      setHeldItem(null)
      return
    }
    const nextIdx = currentIndex + 1
    if (nextIdx >= queue.length) {
      rebuildQueueFn(records, settings, newSeenToday, focusId, null)
    } else {
      setCurrentIndex(nextIdx)
    }
  }, [heldItem, currentIndex, queue.length, records, settings, newSeenToday, focusId, rebuildQueueFn])

  // ─── Hold ─────────────────────────────────────────────────────────────
  const hold = useCallback(() => {
    if (currentItem) setHeldItem(currentItem)
  }, [currentItem])

  const releaseHold = useCallback(() => {
    setHeldItem(null)
  }, [])

  // ─── Favorite ─────────────────────────────────────────────────────────
  const toggleFavorite = useCallback((id: number) => {
    const key = recordKey(id, settings.rootIndex)
    const existing = records.get(key) ?? createRecord(id, settings.rootIndex)
    const updated = { ...existing, favorite: !existing.favorite }
    const newRecs = new Map(records)
    newRecs.set(key, updated)
    setRecordsState(newRecs)
    saveRecords(newRecs)
  }, [records, settings.rootIndex])

  // ─── Focus ────────────────────────────────────────────────────────────
  const setFocus = useCallback((id: number | null) => {
    setFocusId(id)
    rebuildQueueFn(records, settings, newSeenToday, id, null)
  }, [records, settings, newSeenToday, rebuildQueueFn])

  // ─── Settings update ──────────────────────────────────────────────────
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const nextSettings = { ...settings, ...updates }
    setSettingsState(nextSettings)
    saveSettingsToStorage(nextSettings)
    if (updates.rootIndex !== undefined) {
      rebuildQueueFn(records, nextSettings, newSeenToday, focusId, null)
    }
  }, [settings, records, newSeenToday, focusId, rebuildQueueFn])

  // ─── Stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let due = 0, weak = 0, seen = 0, mastered = 0, learning = 0, stable = 0, favorites = 0
    records.forEach(r => {
      if (r.rootIndex !== settings.rootIndex) return
      seen++
      if (isDue(r)) due++
      if (isWeakSpot(r)) weak++
      if (r.mastery === 'mastered') mastered++
      if (r.mastery === 'learning') learning++
      if (r.mastery === 'stable') stable++
      if (r.favorite) favorites++
    })
    return { due, weak, seen, mastered, learning, stable, favorites, streak, newSeenToday }
  }, [records, settings.rootIndex, streak, newSeenToday])

  const sessionInfo = useMemo(() => {
    const dueCount = queue.filter(i => i.reason === 'due').length
    const newRemaining = queue.filter(i => i.reason === 'new').length
    const total = queue.length
    const pos = Math.min(currentIndex + 1, total)
    return { dueCount, newRemaining, total, pos }
  }, [queue, currentIndex])

  return {
    settings, updateSettings,
    records, setRecordsState,
    currentItem, currentPitchSet,
    queue, currentIndex,
    heldItem, focusId,
    grade, next, hold, releaseHold,
    toggleFavorite, setFocus,
    stats, sessionInfo,
    rebuildQueue: () => rebuildQueueFn(records, settings, newSeenToday, focusId, heldItem),
  }
}
