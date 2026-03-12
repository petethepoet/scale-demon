import React, { useMemo } from 'react'
import type { RootIndex, NoteNaming, FretboardDisplayMode, FretboardPositionMode } from '../../types'
import { getFretboardNotes, getFocusZoneNotes, getNoteInKey, getIntervalName, type FretNote } from '../../utils/pitchSet'

interface FretboardPanelProps {
  intervals: number[]
  rootIndex: RootIndex
  tuning: number[]
  naming: NoteNaming
  displayMode: FretboardDisplayMode
  positionMode: FretboardPositionMode
  onDisplayMode: (m: FretboardDisplayMode) => void
  onPositionMode: (m: FretboardPositionMode) => void
}

const FRET_COUNT = 12
const DOUBLE_DOTS = [12]
const SINGLE_DOTS = [3, 5, 7, 9]
const GUITAR_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'] // high to low, visual order
const BASS_LABELS   = ['G', 'D', 'A', 'E']

// SVG layout constants
const LEFT_MARGIN  = 22
const TOP_MARGIN   = 16
const STRING_H     = 32   // px per string gap
const FRET_W_BASE  = 44   // target px per fret cell

export function FretboardPanel({
  intervals, rootIndex, tuning, naming,
  displayMode, positionMode, onDisplayMode, onPositionMode,
}: FretboardPanelProps) {
  const stringCount = tuning.length
  const isBass = stringCount === 4
  const labels = isBass ? BASS_LABELS : GUITAR_LABELS

  const allNotes = useMemo(
    () => getFretboardNotes(intervals, rootIndex, tuning, FRET_COUNT),
    [intervals, rootIndex, tuning]
  )

  const visibleNotes = useMemo(() => {
    if (positionMode === 'focus') return getFocusZoneNotes(allNotes, tuning, rootIndex)
    if (positionMode === 'single') {
      const topString = stringCount - 1
      return allNotes.filter(n => n.string === topString)
    }
    return allNotes
  }, [allNotes, positionMode, stringCount, tuning, rootIndex])

  // Compute fret window
  const { startFret, endFret } = useMemo(() => {
    if (positionMode === 'all' || visibleNotes.length === 0) {
      return { startFret: 0, endFret: FRET_COUNT }
    }
    const frets = visibleNotes.map(n => n.fret)
    const minF = Math.min(...frets)
    const maxF = Math.max(...frets)
    // Note rendering uses fret = startFret + fi + 1, so we start one fret
    // before minF so that cell fi=0 renders fret minF correctly.
    const sf = Math.max(0, minF - 1)
    // Need maxF-minF+1 cells to cover all notes; minimum 5 cells of padding
    const span = Math.max(maxF - minF + 1, 5)
    const ef = Math.min(FRET_COUNT, sf + span)
    return { startFret: sf, endFret: ef }
  }, [visibleNotes, positionMode])

  const fretSpan = endFret - startFret
  const fretW = FRET_W_BASE
  const svgWidth = LEFT_MARGIN + fretSpan * fretW + 8
  const svgHeight = TOP_MARGIN + (stringCount - 1) * STRING_H + TOP_MARGIN

  const noteMap = useMemo(() => {
    const m = new Map<string, FretNote>()
    visibleNotes.forEach(n => m.set(`${n.string}:${n.fret}`, n))
    return m
  }, [visibleNotes])

  function getNoteLabel(note: FretNote): string {
    if (displayMode === 'root-only') return note.isRoot ? getNoteInKey(0, rootIndex, naming) : ''
    if (displayMode === 'degrees') return getIntervalName(note.degree)
    // In 'both' mode use sharps only — a circle can't fit "C#/Db"
    const dotNaming: NoteNaming = naming === 'both' ? 'sharps' : naming
    return getNoteInKey(note.degree, rootIndex, dotNaming)
  }

  // Visual string index: 0 = high e, last = low E
  const stringRows = useMemo(
    () => Array.from({ length: stringCount }, (_, i) => ({
      visualIdx: i,
      stringIdx: stringCount - 1 - i, // 0 = low E in tuning array
    })),
    [stringCount]
  )

  return (
    <div className="space-y-3">
      {/* Mode toggles */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="seg-control flex-1">
          {(['notes', 'degrees', 'root-only'] as FretboardDisplayMode[]).map(m => (
            <button key={m} onClick={() => onDisplayMode(m)}
              className={displayMode === m ? 'seg-btn-active' : 'seg-btn'}>
              {m === 'root-only' ? 'Root Only' : m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <div className="seg-control flex-1">
          {(['focus', 'all', 'single'] as FretboardPositionMode[]).map(m => (
            <button key={m} onClick={() => onPositionMode(m)}
              className={positionMode === m ? 'seg-btn-active' : 'seg-btn'}>
              {m === 'focus' ? 'Focus Zone' : m === 'all' ? 'All Positions' : 'Single String'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-ash">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-ember flex-shrink-0"/>
          <span>root</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-demon-purple/70 border border-demon-purple/50 flex-shrink-0"/>
          <span>scale tone</span>
        </div>
        {positionMode === 'focus' && <span className="text-ash/40">· focus zone</span>}
      </div>

      {/* SVG Fretboard — maxWidth keeps rendered height ≈ svgHeight × 1.6 on wide screens */}
      <div className="w-full" style={{ maxWidth: `${Math.round(svgWidth * 1.6)}px`, margin: '0 auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          style={{ display: 'block' }}
        >
          {/* ── Background ── */}
          <rect x={LEFT_MARGIN} y={TOP_MARGIN - 4}
            width={fretSpan * fretW} height={(stringCount - 1) * STRING_H + 8}
            rx={4} fill="rgba(22,10,42,0.6)" />

          {/* ── Fret wires ── */}
          {Array.from({ length: fretSpan + 1 }, (_, i) => {
            const fret = startFret + i
            const x = LEFT_MARGIN + i * fretW
            const isNut = fret === 0
            return (
              <line key={fret}
                x1={x} y1={TOP_MARGIN} x2={x} y2={TOP_MARGIN + (stringCount - 1) * STRING_H}
                stroke={isNut ? '#F4E8C8' : 'rgba(138,131,166,0.25)'}
                strokeWidth={isNut ? 3 : 1}
                strokeLinecap="round"
              />
            )
          })}

          {/* ── Fret position dots ── */}
          {Array.from({ length: fretSpan }, (_, i) => {
            const fret = startFret + i + 1
            const cx = LEFT_MARGIN + i * fretW + fretW / 2
            const midY = TOP_MARGIN + ((stringCount - 1) * STRING_H) / 2
            if (SINGLE_DOTS.includes(fret)) {
              return <circle key={fret} cx={cx} cy={midY} r={3} fill="rgba(138,131,166,0.2)" />
            }
            if (DOUBLE_DOTS.includes(fret)) {
              const offset = STRING_H * 0.8
              return (
                <g key={fret}>
                  <circle cx={cx} cy={midY - offset / 2} r={3} fill="rgba(138,131,166,0.22)" />
                  <circle cx={cx} cy={midY + offset / 2} r={3} fill="rgba(138,131,166,0.22)" />
                </g>
              )
            }
            return null
          })}

          {/* ── Fret numbers ── */}
          {Array.from({ length: fretSpan }, (_, i) => {
            const fret = startFret + i + 1
            const x = LEFT_MARGIN + i * fretW + fretW / 2
            return (
              <text key={fret} x={x} y={TOP_MARGIN - 4}
                textAnchor="middle" fontSize={9} fill="rgba(138,131,166,0.5)"
                fontFamily="JetBrains Mono, monospace">
                {fret}
              </text>
            )
          })}

          {/* ── String wires + labels ── */}
          {stringRows.map(({ visualIdx, stringIdx }) => {
            const y = TOP_MARGIN + visualIdx * STRING_H
            const thickness = stringIdx < 3 ? 1.8 : 1.1 // wound strings thicker
            const opacity = 0.18 + (stringIdx / stringCount) * 0.14
            return (
              <g key={stringIdx}>
                <line
                  x1={LEFT_MARGIN} y1={y}
                  x2={LEFT_MARGIN + fretSpan * fretW} y2={y}
                  stroke={`rgba(244,232,200,${opacity})`}
                  strokeWidth={thickness}
                />
                <text x={LEFT_MARGIN - 5} y={y + 4}
                  textAnchor="end" fontSize={10} fill="rgba(138,131,166,0.6)"
                  fontFamily="JetBrains Mono, monospace">
                  {labels[visualIdx]}
                </text>
              </g>
            )
          })}

          {/* ── Note dots ── */}
          {stringRows.map(({ visualIdx, stringIdx }) => {
            const y = TOP_MARGIN + visualIdx * STRING_H
            return Array.from({ length: fretSpan }, (_, fi) => {
              // Open string: only when window starts at nut and fi === 0
              if (startFret === 0 && fi === 0) {
                const openN = noteMap.get(`${stringIdx}:0`)
                if (openN) {
                  return <NoteDot key={`${stringIdx}:open`}
                    cx={LEFT_MARGIN} cy={y} note={openN}
                    label={getNoteLabel(openN)} displayMode={displayMode} isOpen />
                }
              }

              const fret = startFret + fi + 1
              const fretNote = noteMap.get(`${stringIdx}:${fret}`)
              if (!fretNote) return null
              const cx = LEFT_MARGIN + fi * fretW + fretW / 2
              return (
                <NoteDot key={`${stringIdx}:${fret}`}
                  cx={cx} cy={y} note={fretNote}
                  label={getNoteLabel(fretNote)} displayMode={displayMode} />
              )
            })
          })}
        </svg>
      </div>
    </div>
  )
}

// ─── Note Dot ─────────────────────────────────────────────────────────────────

interface NoteDotProps {
  cx: number
  cy: number
  note: FretNote
  label: string
  displayMode: FretboardDisplayMode
  isOpen?: boolean
}

function NoteDot({ cx, cy, note, label, displayMode, isOpen }: NoteDotProps) {
  const r = 11

  if (displayMode === 'root-only' && !note.isRoot) {
    // Ghost dot for non-root in root-only mode
    return (
      <circle cx={cx} cy={cy} r={r - 3}
        fill="rgba(138,131,166,0.08)" stroke="rgba(138,131,166,0.2)" strokeWidth={1} />
    )
  }

  const fillColor  = note.isRoot ? '#F28C28' : '#4A2D8A'
  const strokeColor = note.isRoot ? '#FF6A1A' : '#6F42C1'
  const textColor  = note.isRoot ? '#0A0614' : '#F4E8C8'
  const fontWeight = note.isRoot ? '700' : '500'

  const displayLabel = label || (note.isRoot ? 'R' : '·')
  const fontSize = displayLabel.length > 2 ? 7.5 : displayLabel.length > 1 ? 8.5 : 9.5

  return (
    <g>
      {/* Outer glow for root */}
      {note.isRoot && (
        <circle cx={cx} cy={cy} r={r + 3}
          fill="none" stroke="rgba(242,140,40,0.25)" strokeWidth={2} />
      )}
      <circle cx={cx} cy={cy} r={r}
        fill={fillColor} stroke={strokeColor} strokeWidth={1.5} />
      <text x={cx} y={cy + fontSize * 0.36}
        textAnchor="middle" fontSize={fontSize}
        fill={textColor} fontWeight={fontWeight}
        fontFamily="JetBrains Mono, monospace">
        {displayLabel}
      </text>
    </g>
  )
}
