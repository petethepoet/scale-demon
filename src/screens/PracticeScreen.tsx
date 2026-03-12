import React, { useState } from 'react'
import type { FretboardDisplayMode, FretboardPositionMode, RootIndex } from '../types'
import type { useAppState } from '../hooks/useAppState'
import { CurrentSetCard } from '../components/practice/CurrentSetCard'
import { FretboardPanel } from '../components/practice/FretboardPanel'
import { ActionPanel } from '../components/practice/ActionPanel'
import { SessionStatusStrip } from '../components/practice/SessionStatusStrip'
import { SessionToolsTray } from '../components/practice/SessionToolsTray'

type AppState = ReturnType<typeof useAppState>

interface PracticeScreenProps {
  state: AppState
}

export function PracticeScreen({ state }: PracticeScreenProps) {
  const { settings, currentItem, currentPitchSet, sessionInfo, stats } = state
  const [displayMode, setDisplayMode] = useState<FretboardDisplayMode>('notes')
  const [positionMode, setPositionMode] = useState<FretboardPositionMode>('focus')

  // Empty state — no items to practice
  if (!currentItem || !currentPitchSet) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl mb-2">🎸</div>
          <h2 className="font-display font-semibold text-bone text-lg">Nothing due right now</h2>
          <p className="text-ash text-sm leading-relaxed">
            All caught up. Come back later for your next review, or explore the Library to add new sets.
          </p>
          <button
            onClick={() => state.rebuildQueue()}
            className="btn-primary mt-2"
          >
            Rebuild Session
          </button>
        </div>
      </div>
    )
  }

  const isFavorite = state.records.get(`${currentItem.id}:${currentItem.rootIndex}`)?.favorite ?? false
  const isFocused = state.focusId === currentItem.id
  const displayRoot = currentItem.rootIndex
  const isOffRoot = displayRoot !== settings.rootIndex

  return (
    <>
      {/* Main scrollable content — pb accounts for sticky bottom bar height */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-44 space-y-3">

        {/* Root selector */}
        <div className="flex items-center gap-2">
          <RootSelector
            rootIndex={settings.rootIndex}
            naming={settings.noteNaming}
            onChange={ri => state.updateSettings({ rootIndex: ri as RootIndex })}
          />
          {isOffRoot && (
            <span className="flex-shrink-0 text-[10px] font-ui text-amber-400/80 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full whitespace-nowrap">
              reviewing in {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][displayRoot]}
            </span>
          )}
        </div>

        {/* Current Set Card */}
        <CurrentSetCard
          pitchSet={currentPitchSet}
          reason={currentItem.reason}
          rootIndex={displayRoot}
          naming={settings.noteNaming}
          isFavorite={isFavorite}
          isHeld={!!state.heldItem}
          onFavorite={() => state.toggleFavorite(currentItem.id)}
        />

        {/* Fretboard — reduced padding so it breathes */}
        <div className="card p-2 sm:p-3">
          <FretboardPanel
            intervals={currentPitchSet.intervals}
            rootIndex={displayRoot}
            tuning={settings.tuning}
            naming={settings.noteNaming}
            displayMode={displayMode}
            positionMode={positionMode}
            onDisplayMode={setDisplayMode}
            onPositionMode={setPositionMode}
          />
        </div>

        {/* Session status */}
        <SessionStatusStrip
          dueCount={sessionInfo.dueCount}
          newRemaining={sessionInfo.newRemaining}
          position={sessionInfo.pos}
          total={sessionInfo.total}
          streak={stats.streak}
        />

        {/* Session tools — always visible, no accordion */}
        <SessionToolsTray rootIndex={displayRoot} />

      </main>

      {/* Universal sticky grade bar */}
      <ActionPanel
        onGrade={state.grade}
        onHold={state.hold}
        onNext={state.next}
        onFocus={() => state.setFocus(isFocused ? null : currentItem.id)}
        isHeld={!!state.heldItem}
        isFocused={isFocused}
      />
    </>
  )
}

// ─── Root Selector ────────────────────────────────────────────────────────────

const ROOTS      = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FLAT_ROOTS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

interface RootSelectorProps {
  rootIndex: number
  naming: string
  onChange: (i: number) => void
}

function RootSelector({ rootIndex, naming, onChange }: RootSelectorProps) {
  const names = naming === 'flats' ? FLAT_ROOTS : ROOTS
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1 flex-1">
      {names.map((name, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={[
            'flex-shrink-0 w-9 h-7 rounded font-mono text-xs font-medium transition-all duration-100',
            i === rootIndex
              ? 'bg-ember text-ink font-bold shadow-glow-ember'
              : 'bg-void/50 text-ash border border-white/8 hover:text-bone hover:border-white/20',
          ].join(' ')}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
