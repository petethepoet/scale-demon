import React, { useState, useEffect, useRef } from 'react'
import {
  startMetronome, stopMetronome, isMetronomeRunning,
  startDrone, stopDrone, isDroneRunning,
} from '../../utils/audio'

interface SessionToolsTrayProps {
  rootIndex: number
}

export function SessionToolsTray({ rootIndex }: SessionToolsTrayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [metronomeOn, setMetronomeOn] = useState(false)
  const [droneOn, setDroneOn] = useState(false)
  const [bpm, setBpm] = useState(80)
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

  function toggleMetronome() {
    if (metronomeOn) {
      stopMetronome()
      setMetronomeOn(false)
    } else {
      startMetronome(bpm)
      setMetronomeOn(true)
    }
  }

  function toggleDrone() {
    if (droneOn) {
      stopDrone()
      setDroneOn(false)
    } else {
      startDrone(rootIndex)
      setDroneOn(true)
    }
  }

  function handleBpmChange(val: number) {
    setBpm(val)
    if (metronomeOn) {
      stopMetronome()
      startMetronome(val)
    }
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="rounded-card border border-white/8 overflow-hidden">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-void/40 hover:bg-void/60 transition-colors"
      >
        <span className="text-xs text-ash font-ui">Session Tools</span>
        <div className="flex items-center gap-2">
          {metronomeOn && <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse-glow" />}
          {droneOn && <span className="w-1.5 h-1.5 rounded-full bg-ice animate-pulse-glow" />}
          {timerOn && <span className="text-xs font-mono text-ash">{formatTime(elapsed)}</span>}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A83A6" strokeWidth="2"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 py-3 bg-void/20 border-t border-white/6 grid grid-cols-2 gap-3 animate-fade-in">
          {/* Metronome */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ash">Metronome</span>
              <ToggleSwitch on={metronomeOn} onToggle={toggleMetronome} color="ember" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range" min={40} max={220} value={bpm}
                onChange={e => handleBpmChange(Number(e.target.value))}
                className="flex-1 h-1 accent-ember"
              />
              <span className="text-xs font-mono text-ash w-8 text-right">{bpm}</span>
            </div>
          </div>

          {/* Drone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ash">Drone</span>
              <ToggleSwitch on={droneOn} onToggle={toggleDrone} color="ice" />
            </div>
            <p className="text-[10px] text-ash/50">Root tone held</p>
          </div>

          {/* Timer */}
          <div className="space-y-2 col-span-2 border-t border-white/6 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ash">Timer</span>
              {timerOn && (
                <span className="text-sm font-mono text-bone">{formatTime(elapsed)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch on={timerOn} onToggle={() => setTimerOn(t => !t)} color="purple" />
              {!timerOn && elapsed > 0 && (
                <button
                  onClick={() => setElapsed(0)}
                  className="text-[10px] text-ash/50 hover:text-ash"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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
        'relative w-8 h-4 rounded-full transition-colors duration-200',
        on ? (colors[color] ?? 'bg-ember') : 'bg-ash/20',
      ].join(' ')}
    >
      <span className={[
        'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200',
        on ? 'translate-x-4' : 'translate-x-0.5',
      ].join(' ')} />
    </button>
  )
}
