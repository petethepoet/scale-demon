import React, { useRef } from 'react'
import type { AppSettings, Instrument, NoteNaming } from '../types'
import type { useAppState } from '../hooks/useAppState'
import { STANDARD_TUNING, BASS_TUNING } from '../utils/pitchSet'
import { exportData, importData, resetAllData, DEFAULT_SETTINGS } from '../utils/storage'

type AppState = ReturnType<typeof useAppState>

interface SettingsScreenProps {
  state: AppState
}

export function SettingsScreen({ state }: SettingsScreenProps) {
  const { settings, updateSettings } = state
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scale-demon-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        importData(data)
        window.location.reload()
      } catch {
        alert('Invalid backup file.')
      }
    }
    reader.readAsText(file)
  }

  function handleReset() {
    if (confirm('Reset all progress data? This cannot be undone.')) {
      resetAllData()
      window.location.reload()
    }
  }

  function handleInstrumentChange(instrument: Instrument) {
    const tuning = instrument === 'bass' ? BASS_TUNING : STANDARD_TUNING
    const stringCount = instrument === 'bass' ? 4 : 6
    updateSettings({ instrument, tuning, stringCount })
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-8 space-y-5">
      <div>
        <h1 className="font-display font-bold text-bone text-xl mb-0.5">Settings</h1>
        <p className="text-ash text-xs">Configure your practice environment</p>
      </div>

      {/* Instrument */}
      <Section title="Instrument">
        <div className="seg-control">
          {(['guitar', 'bass'] as Instrument[]).map(inst => (
            <button
              key={inst}
              onClick={() => handleInstrumentChange(inst)}
              className={settings.instrument === inst ? 'seg-btn-active' : 'seg-btn'}
            >
              {inst.charAt(0).toUpperCase() + inst.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-ash text-xs mt-2">
          {settings.instrument === 'guitar'
            ? 'Standard tuning: E A D G B e'
            : 'Standard bass tuning: E A D G'}
        </p>
      </Section>

      {/* Note Naming */}
      <Section title="Note Naming">
        <div className="seg-control">
          {(['sharps', 'flats', 'both'] as NoteNaming[]).map(n => (
            <button
              key={n}
              onClick={() => updateSettings({ noteNaming: n })}
              className={settings.noteNaming === n ? 'seg-btn-active' : 'seg-btn'}
            >
              {n.charAt(0).toUpperCase() + n.slice(1)}
            </button>
          ))}
        </div>
      </Section>

      {/* Session */}
      <Section title="Session">
        <div className="space-y-4">
          <SliderSetting
            label="New sets per day"
            value={settings.newPerDay}
            min={1} max={20}
            onChange={v => updateSettings({ newPerDay: v })}
            unit="sets"
            hint="Controls how many brand-new pitch sets appear each day."
          />
          <SliderSetting
            label="Session goal"
            value={settings.sessionGoalMinutes}
            min={5} max={60} step={5}
            onChange={v => updateSettings({ sessionGoalMinutes: v })}
            unit="min"
            hint="Target practice duration shown in session tools."
          />
        </div>
      </Section>

      {/* SRS Mode */}
      <Section title="Practice Mode">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-bone text-sm">Spaced Repetition</p>
            <p className="text-ash text-xs mt-0.5">Prioritizes due and weak sets using SRS algorithm</p>
          </div>
          <ToggleSwitch
            on={settings.srsEnabled}
            onToggle={() => updateSettings({ srsEnabled: !settings.srsEnabled })}
            color="ember"
          />
        </div>
        {!settings.srsEnabled && (
          <p className="text-amber-400/70 text-xs mt-2 border border-amber-800/30 rounded p-2 bg-amber-900/10">
            Random mode: sets will be chosen without SRS scheduling.
          </p>
        )}
      </Section>

      {/* Data */}
      <Section title="Data">
        <div className="space-y-2">
          <button onClick={handleExport} className="btn-utility w-full justify-center py-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export backup (.json)
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-utility w-full justify-center py-2.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import backup (.json)
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

          <div className="border-t border-white/6 pt-2 mt-2">
            <button
              onClick={handleReset}
              className="btn-utility w-full justify-center py-2.5 border-red-900/40 text-red-400/70 hover:text-red-400 hover:border-red-700/50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
              Reset all progress data
            </button>
          </div>
        </div>
      </Section>

      {/* About */}
      <Section title="About">
        <div className="text-xs text-ash/60 space-y-1">
          <p>Scale Demon v0.1 — MVP build</p>
          <p>2048 pitch sets from the 12-tone system.</p>
          <p>Offline-first. Local storage only. No backend.</p>
          <p className="pt-2 text-ash/40">Built for serious players.</p>
        </div>
      </Section>
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-display font-semibold text-bone text-sm border-b border-white/6 pb-2">{title}</h2>
      {children}
    </div>
  )
}

function SliderSetting({
  label, value, min, max, step = 1, onChange, unit, hint
}: {
  label: string; value: number; min: number; max: number; step?: number
  onChange: (v: number) => void; unit: string; hint?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-bone">{label}</span>
        <span className="text-sm font-mono text-ember">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-ember bg-void"
      />
      {hint && <p className="text-ash/50 text-xs mt-1">{hint}</p>}
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
        'relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0',
        on ? (colors[color] ?? 'bg-ember') : 'bg-ash/20',
      ].join(' ')}
    >
      <span className={[
        'absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
        on ? 'translate-x-5' : 'translate-x-0.5',
      ].join(' ')} />
    </button>
  )
}
