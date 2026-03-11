import React, { useState } from 'react'
import type { FretboardDisplayMode, FretboardPositionMode, RootIndex } from '../types'
import type { useAppState } from '../hooks/useAppState'
import { CurrentSetCard } from '../components/practice/CurrentSetCard'
import { FretboardPanel } from '../components/practice/FretboardPanel'
import { ActionPanel, StickyMobileBar } from '../components/practice/ActionPanel'
import { SessionStatusStrip } from '../components/practice/SessionStatusStrip'
import { SessionToolsTray } from '../components/practice/SessionToolsTray'
import { getRootName } from '../utils/pitchSet'

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

  return (
    <>
      {/* Main scrollable content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-36 space-y-3">

        {/* Root selector — compact pill row */}
        <RootSelector
          rootIndex={settings.rootIndex}
          naming={settings.noteNaming}
          onChange={ri => state.updateSettings({ rootIndex: ri as RootIndex })}
        />

        {/* Current Set Card */}
        <CurrentSetCard
          pitchSet={currentPitchSet}
          reason={currentItem.reason}
          rootIndex={settings.rootIndex}
          naming={settings.noteNaming}
          isFavorite={isFavorite}
          isHeld={!!state.heldItem}
          onFavorite={() => state.toggleFavorite(currentItem.id)}
        />

        {/* Fretboard */}
        <div className="card p-4">
          <FretboardPanel
            intervals={currentPitchSet.intervals}
            rootIndex={settings.rootIndex}
            tuning={settings.tuning}
            naming={settings.noteNaming}
            displayMode={displayMode}
            positionMode={positionMode}
            onDisplayMode={setDisplayMode}
            onPositionMode={setPositionMode}
          />
        </div>

        {/* Session status strip */}
        <SessionStatusStrip
          dueCount={sessionInfo.dueCount}
          newRemaining={sessionInfo.newRemaining}
          position={sessionInfo.pos}
          total={sessionInfo.total}
          streak={stats.streak}
        />

        {/* Action panel — desktop only (sticky bar handles mobile) */}
        <div className="hidden sm:block">
          <ActionPanel
            onGrade={state.grade}
            onHold={state.hold}
            onNext={state.next}
            onFocus={() => state.setFocus(isFocused ? null : currentItem.id)}
            isHeld={!!state.heldItem}
            isFocused={isFocused}
          />
        </div>

        {/* Session tools */}
        <SessionToolsTray rootIndex={settings.rootIndex} />
      </main>

      {/* Sticky grade bar — mobile only */}
      <div className="sm:hidden">
        <StickyMobileBar
          onGrade={state.grade}
          onHold={state.hold}
          onNext={state.next}
          isHeld={!!state.heldItem}
        />
      </div>
    </>
  )
}

// ─── Root Selector ────────────────────────────────────────────────────────────

const ROOTS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FLAT_ROOTS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

interface RootSelectorProps {
  rootIndex: number
  naming: string
  onChange: (i: number) => void
}

function RootSelector({ rootIndex, naming, onChange }: RootSelectorProps) {
  const names = naming === 'flats' ? FLAT_ROOTS : ROOTS
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
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
