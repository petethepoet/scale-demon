import React from 'react'
import type { PitchSet, QueueReason, RootIndex, NoteNaming } from '../../types'
import { ReasonBadge } from '../shared/ReasonBadge'
import { NoteChips } from '../shared/NoteChips'
import { getRootName } from '../../utils/pitchSet'

const INSTRUCTION_LINES: Record<QueueReason, string[]> = {
  due:     [
    'Due for review. Run it in one position, then grade honestly.',
    'It\'s time. Find the root first, then hear the color.',
    'This one is due. Play it slowly and deliberately.',
  ],
  weak:    [
    'Weak spot detected. Stay with this shape before moving on.',
    'You\'ve struggled here. Slow down and hear each interval.',
    'This needs work. Run it again, deliberately.',
  ],
  new:     [
    'New territory. Find the root first, then let it breathe.',
    'First look. Play slowly. Don\'t rush the shape.',
    'Never seen this one. Let the intervals land.',
  ],
  variety: [
    'Something different. Keep your ear open.',
    'A change of color. Play it and hear where it goes.',
    'Variety round. Stay curious.',
  ],
}

function getInstruction(reason: QueueReason, id: number): string {
  const lines = INSTRUCTION_LINES[reason]
  return lines[id % lines.length]
}

interface CurrentSetCardProps {
  pitchSet: PitchSet
  reason: QueueReason
  rootIndex: RootIndex
  naming: NoteNaming
  isFavorite: boolean
  isHeld: boolean
  onFavorite: () => void
}

export function CurrentSetCard({
  pitchSet, reason, rootIndex, naming, isFavorite, isHeld, onFavorite,
}: CurrentSetCardProps) {
  const rootName = getRootName(rootIndex, naming)
  const instruction = getInstruction(reason, pitchSet.id)

  return (
    <div className={[
      'rounded-card border p-4 sm:p-5 animate-slide-up',
      'bg-void shadow-card',
      isHeld
        ? 'border-ice/30 shadow-glow-ice'
        : 'border-demon-purple/20 shadow-glow',
    ].join(' ')}>

      {/* ── Header row: root + name + favorite ── */}
      <div className="flex items-start justify-between gap-3 mb-3">

        {/* Root note (dominant visual) */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative flex-shrink-0 select-none">
            <span
              className="font-display font-black leading-none text-gradient-ember"
              style={{ fontSize: 'clamp(2.8rem, 9vw, 3.8rem)' }}
            >
              {rootName}
            </span>
            {/* Subtle ember glow behind root */}
            <span
              className="absolute inset-0 font-display font-black leading-none opacity-15 blur-sm text-ember"
              style={{ fontSize: 'clamp(2.8rem, 9vw, 3.8rem)' }}
              aria-hidden
            >
              {rootName}
            </span>
          </div>

          {/* Scale name + metadata */}
          <div className="pt-1 min-w-0 flex flex-col gap-1">
            <h2 className="font-display font-semibold text-bone leading-tight truncate"
              style={{ fontSize: 'clamp(1rem, 3.5vw, 1.2rem)' }}>
              {pitchSet.name}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <ReasonBadge reason={reason} />
              <span className="text-ash text-xs font-mono">{pitchSet.size}n</span>
              <span className="text-ash/40 text-xs font-mono">#{pitchSet.id}</span>
              {isHeld && (
                <span className="badge bg-ice/15 text-ice border border-ice/25 text-[10px]">Held</span>
              )}
            </div>
          </div>
        </div>

        {/* Favorite */}
        <button
          onClick={onFavorite}
          className={[
            'flex-shrink-0 p-1.5 rounded-btn transition-all duration-150',
            isFavorite ? 'text-ember' : 'text-ash/30 hover:text-ash/70',
          ].join(' ')}
          aria-label={isFavorite ? 'Remove favorite' : 'Favorite this set'}
        >
          <svg width="17" height="17" viewBox="0 0 24 24"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      </div>

      {/* ── Interval signature ── */}
      <p className="text-ash/60 text-[11px] font-mono tracking-wide mb-2.5">
        {pitchSet.signature}
      </p>

      {/* ── Note chips ── */}
      <div className="mb-3">
        <NoteChips intervals={pitchSet.intervals} rootIndex={rootIndex} naming={naming} />
      </div>

      {/* ── Instruction line ── */}
      <p className="text-ash/70 text-xs leading-relaxed border-t border-white/6 pt-2.5">
        {instruction}
      </p>
    </div>
  )
}
