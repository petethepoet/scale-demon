import React from 'react'
import type { RootIndex, NoteNaming } from '../../types'
import { getNoteInKey, getIntervalName } from '../../utils/pitchSet'

interface NoteChipsProps {
  intervals: number[]
  rootIndex: RootIndex
  naming: NoteNaming
  showDegrees?: boolean
}

export function NoteChips({ intervals, rootIndex, naming, showDegrees = false }: NoteChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {intervals.map(interval => {
        const isRoot = interval === 0
        const noteName = getNoteInKey(interval, rootIndex, naming)
        const degreeName = getIntervalName(interval)
        return (
          <span
            key={interval}
            className={isRoot ? 'note-chip-root' : 'note-chip-tone'}
          >
            {showDegrees ? degreeName : noteName}
          </span>
        )
      })}
    </div>
  )
}
