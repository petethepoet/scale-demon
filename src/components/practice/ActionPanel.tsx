import React from 'react'
import type { SRSGrade } from '../../types'
import { playGradeCue } from '../../utils/audio'

interface ActionPanelProps {
  onGrade: (g: SRSGrade) => void
  onHold: () => void
  onNext: () => void
  onFocus: () => void
  isHeld: boolean
  isFocused: boolean
}

export function ActionPanel({ onGrade, onHold, onNext, onFocus, isHeld, isFocused }: ActionPanelProps) {
  function handleGrade(g: SRSGrade) {
    playGradeCue(g)
    onGrade(g)
  }

  return (
    <div className="card p-4 space-y-3">
      {/* Grade header */}
      <p className="text-ash text-xs font-ui tracking-wide text-center">
        How well did this feel?
      </p>

      {/* Primary grade row */}
      <div className="flex gap-2">
        <button
          onClick={() => handleGrade('again')}
          className="btn-grade-again"
        >
          <span className="block text-sm">↺</span>
          <span>Again</span>
        </button>
        <button
          onClick={() => handleGrade('hard')}
          className="btn-grade-hard"
        >
          <span className="block text-sm">◐</span>
          <span>Hard</span>
        </button>
        <button
          onClick={() => handleGrade('good')}
          className="btn-grade-good"
        >
          <span className="block text-sm">✓</span>
          <span>Good</span>
        </button>
        <button
          onClick={() => handleGrade('easy')}
          className="btn-grade-easy"
        >
          <span className="block text-sm">⚡</span>
          <span>Easy</span>
        </button>
      </div>

      {/* Secondary utility row */}
      <div className="flex gap-2 justify-center flex-wrap">
        <button
          onClick={onHold}
          className={[
            'btn-utility',
            isHeld ? 'border-ice/40 text-ice bg-ice/5' : '',
          ].join(' ')}
        >
          <HoldIcon />
          {isHeld ? 'Held' : 'Hold this set'}
        </button>

        <button
          onClick={onNext}
          className="btn-utility"
        >
          <NextIcon />
          Next
        </button>

        <button
          onClick={onFocus}
          className={[
            'btn-utility',
            isFocused ? 'border-demon-purple/50 text-demon-purple-light bg-demon-purple/5' : '',
          ].join(' ')}
        >
          <FocusIcon />
          {isFocused ? 'Exit Focus' : 'Focus'}
        </button>
      </div>
    </div>
  )
}

// ─── Sticky Mobile Bar ────────────────────────────────────────────────────────

interface StickyMobileBarProps {
  onGrade: (g: SRSGrade) => void
  onHold: () => void
  onNext: () => void
  isHeld: boolean
}

export function StickyMobileBar({ onGrade, onHold, onNext, isHeld }: StickyMobileBarProps) {
  function handleGrade(g: SRSGrade) {
    playGradeCue(g)
    onGrade(g)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-ink/98 backdrop-blur-sm border-t border-white/8 safe-bottom">
      <div className="max-w-3xl mx-auto px-3 pt-2 pb-3">
        <p className="text-center text-ash text-[10px] mb-2 tracking-wide">How well did this feel?</p>
        <div className="flex gap-2 mb-2">
          <button onClick={() => handleGrade('again')} className="btn-grade-again text-xs py-3">
            <span className="text-base">↺</span> Again
          </button>
          <button onClick={() => handleGrade('hard')} className="btn-grade-hard text-xs py-3">
            <span className="text-base">◐</span> Hard
          </button>
          <button onClick={() => handleGrade('good')} className="btn-grade-good text-xs py-3">
            <span className="text-base">✓</span> Good
          </button>
          <button onClick={() => handleGrade('easy')} className="btn-grade-easy text-xs py-3">
            <span className="text-base">⚡</span> Easy
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onHold}
            className={['btn-utility flex-1 justify-center text-xs', isHeld ? 'border-ice/40 text-ice' : ''].join(' ')}
          >
            <HoldIcon /> {isHeld ? 'Held' : 'Hold'}
          </button>
          <button onClick={onNext} className="btn-utility flex-1 justify-center text-xs">
            <NextIcon /> Next
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function HoldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>
  )
}

function NextIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function FocusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M3 12h2M19 12h2M12 3v2M12 19v2"/>
    </svg>
  )
}
