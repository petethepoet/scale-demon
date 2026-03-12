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

// Universal sticky bottom bar — applies on all screen sizes
export function ActionPanel({ onGrade, onHold, onNext, onFocus, isHeld, isFocused }: ActionPanelProps) {
  function handleGrade(g: SRSGrade) {
    playGradeCue(g)
    onGrade(g)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-ink/98 backdrop-blur-sm border-t border-white/8">
      <div className="max-w-3xl mx-auto px-3 pt-2 pb-3">

        {/* Label */}
        <p className="text-center text-ash/60 text-[10px] mb-2 tracking-widest uppercase font-ui">
          How well did this feel?
        </p>

        {/* Grade buttons */}
        <div className="flex gap-1.5 mb-2">
          <button onClick={() => handleGrade('again')} className="btn-grade-again flex-col py-2.5 gap-0.5">
            <span className="text-sm leading-none">↺</span>
            <span className="text-xs">Again</span>
          </button>
          <button onClick={() => handleGrade('hard')} className="btn-grade-hard flex-col py-2.5 gap-0.5">
            <span className="text-sm leading-none">◐</span>
            <span className="text-xs">Hard</span>
          </button>
          <button onClick={() => handleGrade('good')} className="btn-grade-good flex-col py-2.5 gap-0.5">
            <span className="text-sm leading-none">✓</span>
            <span className="text-xs">Good</span>
          </button>
          <button onClick={() => handleGrade('easy')} className="btn-grade-easy flex-col py-2.5 gap-0.5">
            <span className="text-sm leading-none">⚡</span>
            <span className="text-xs">Easy</span>
          </button>
        </div>

        {/* Utility row */}
        <div className="flex items-center justify-center gap-1">
          <UtilButton
            onClick={onHold}
            active={isHeld}
            activeClass="text-ice border-ice/30"
            icon={<HoldIcon />}
            label={isHeld ? 'Held' : 'Hold'}
          />
          <UtilButton
            onClick={onNext}
            icon={<NextIcon />}
            label="Next"
          />
          <UtilButton
            onClick={onFocus}
            active={isFocused}
            activeClass="text-demon-purple-light border-demon-purple/30"
            icon={<FocusIcon />}
            label={isFocused ? 'Exit Focus' : 'Focus'}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Utility button ───────────────────────────────────────────────────────────

interface UtilButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
  active?: boolean
  activeClass?: string
}

function UtilButton({ onClick, icon, label, active, activeClass }: UtilButtonProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 px-4 py-1.5 rounded-btn text-xs font-ui',
        'border transition-all duration-150 select-none',
        active
          ? `bg-void/50 ${activeClass}`
          : 'bg-void/50 border-white/10 text-ash hover:border-white/20 hover:text-bone',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function HoldIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>
  )
}

function NextIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function FocusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M3 12h2M19 12h2M12 3v2M12 19v2"/>
    </svg>
  )
}
