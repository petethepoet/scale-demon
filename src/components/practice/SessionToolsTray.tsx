import React, { useState, useEffect, useRef } from 'react'
import { startMetronome, stopMetronome, startDrone, stopDrone } from '../../utils/audio'

interface SessionToolsTrayProps {
  rootIndex: number
}

export function SessionToolsTray({ rootIndex }: SessionToolsTrayProps) {
  const [metronomeOn, setMetronomeOn] = useState(false)
  const [bpm, setBpm] = useState(80)
  const [droneOn, setDroneOn] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [timerOn, setTimerOn] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer
  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerOn])

  // Stop drone on unmount
  useEffect(() => {
    return () => { stopDrone() }
  }, [])

  // Restart drone when root changes while it's on
  useEffect(() => {
    if (droneOn) {
      stopDrone()
      startDrone(rootIndex)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootIndex])

  function toggleMetronome() {
    if (metronomeOn) { stopMetronome(); setMetronomeOn(false) }
    else { startMetronome(bpm); setMetronomeOn(true) }
  }

  function handleBpmChange(val: number) {
    setBpm(val)
    if (metronomeOn) { stopMetronome(); startMetronome(val) }
  }

  function toggleDrone() {
    if (droneOn) { stopDrone(); setDroneOn(false) }
    else { startDrone(rootIndex); setDroneOn(true) }
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-3 bg-void/40 rounded-card border border-white/6 px-4 py-2.5">

      {/* Metronome toggle + label */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <MetronomeIcon active={metronomeOn} />
        <ToggleSwitch on={metronomeOn} onToggle={toggleMetronome} color="ember" />
      </div>

      {/* BPM slider */}
      <div className="flex items-center gap-2 flex-1">
        <input
          type="range" min={40} max={220} value={bpm}
          onChange={e => handleBpmChange(Number(e.target.value))}
          className="flex-1 h-1 accent-ember cursor-pointer"
        />
        <span className="text-xs font-mono text-ash w-7 text-right flex-shrink-0">{bpm}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-white/10 flex-shrink-0" />

      {/* Drone toggle */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <DroneIcon active={droneOn} />
        <ToggleSwitch on={droneOn} onToggle={toggleDrone} color="ice" />
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-white/10 flex-shrink-0" />

      {/* Timer */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={[
          'text-xs font-mono w-9 text-right',
          timerOn ? 'text-demon-purple-light' : 'text-ash/50',
        ].join(' ')}>
          {formatTime(elapsed)}
        </span>
        {!timerOn && elapsed > 0 && (
          <button
            onClick={() => setElapsed(0)}
            className="text-[10px] text-ash/40 hover:text-ash transition-colors"
          >
            ↺
          </button>
        )}
        <ToggleSwitch on={timerOn} onToggle={() => setTimerOn(t => !t)} color="purple" />
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MetronomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#F28C28' : '#8A83A6'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 20V4M8 20l8-16M6 20h12"/>
    </svg>
  )
}

function DroneIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#A8D8EA' : '#8A83A6'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M2 12 C5 6 7 6 10 12 C13 18 15 18 18 12 C21 6 22 6 22 12"/>
    </svg>
  )
}

function ToggleSwitch({ on, onToggle, color }: { on: boolean; onToggle: () => void; color: string }) {
  const colors: Record<string, string> = {
    ember: 'bg-ember',
    ice: 'bg-ice',
    purple: 'bg-demon-purple',
  }
  return (
    <button
      onClick={onToggle}
      className={[
        'relative w-8 h-4 rounded-full transition-colors duration-200 flex-shrink-0',
        on ? (colors[color] ?? 'bg-ember') : 'bg-white/15',
      ].join(' ')}
      aria-pressed={on}
    >
      <span className={[
        'absolute left-0 top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200',
        on ? 'translate-x-4' : 'translate-x-0.5',
      ].join(' ')} />
    </button>
  )
}
