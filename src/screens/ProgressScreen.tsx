import React, { useMemo } from 'react'
import type { useAppState } from '../hooks/useAppState'
import type { SRSRecord } from '../types'
import { generatePitchSet } from '../utils/pitchSet'
import { isWeakSpot, getMasteryScore } from '../utils/srs'

type AppState = ReturnType<typeof useAppState>

interface ProgressScreenProps {
  state: AppState
  onNavigate: (screen: string) => void
}

export function ProgressScreen({ state, onNavigate }: ProgressScreenProps) {
  const { stats, records, settings } = state

  // Weak spots list
  const weakSpots = useMemo(() => {
    const result: SRSRecord[] = []
    records.forEach(r => {
      if (r.rootIndex === settings.rootIndex && isWeakSpot(r)) {
        result.push(r)
      }
    })
    return result.sort((a, b) => b.lapses - a.lapses).slice(0, 10)
  }, [records, settings.rootIndex])

  // Mastered list
  const masteredList = useMemo(() => {
    const result: SRSRecord[] = []
    records.forEach(r => {
      if (r.rootIndex === settings.rootIndex && r.mastery === 'mastered') {
        result.push(r)
      }
    })
    return result.sort((a, b) => b.intervalDays - a.intervalDays).slice(0, 10)
  }, [records, settings.rootIndex])

  const exposurePct = Math.round((stats.seen / 2048) * 100)

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-8 space-y-5">
      <div>
        <h1 className="font-display font-bold text-bone text-xl mb-0.5">Progress</h1>
        <p className="text-ash text-xs">Your practice history and momentum</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Due"
          value={stats.dueAllRoots}
          color="text-ember"
          sub={stats.dueAllRoots !== stats.due ? `${stats.due} in this key` : 'need review'}
        />
        <StatCard label="Streak" value={`${stats.streak}d`} color="text-ember-hot" sub="days straight" />
        <StatCard
          label="Mastered"
          value={stats.masteredAllRoots}
          color="text-demon-purple-light"
          sub={stats.masteredAllRoots !== stats.mastered ? `${stats.mastered} in this key` : 'fully stable'}
        />
        <StatCard label="Favorites" value={stats.favorites} color="text-ice" sub="saved sets" />
      </div>

      {/* Mastery breakdown */}
      <div className="card p-4 space-y-3">
        <h2 className="font-display font-semibold text-bone text-sm">Mastery Breakdown</h2>
        <div className="space-y-2">
          <MasteryBar label="New" count={2048 - stats.seen} total={2048} color="bg-ash/20" textColor="text-ash/60" />
          <MasteryBar label="Learning" count={stats.learning} total={2048} color="bg-ice" textColor="text-ice" />
          <MasteryBar label="Stable" count={stats.stable} total={2048} color="bg-demon-purple" textColor="text-demon-purple-light" />
          <MasteryBar label="Mastered" count={stats.mastered} total={2048} color="bg-ember" textColor="text-ember" />
        </div>
      </div>

      {/* Exposure Map */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-bone text-sm">Exposure Map</h2>
          <span className="text-xs font-mono text-ash">{stats.seen} / 2048 seen ({exposurePct}%)</span>
        </div>
        <ExposureMap records={records} rootIndex={settings.rootIndex} />
        <p className="text-[10px] text-ash/50 text-center">
          Each cell = one of the 2048 pitch sets. Orange = mastered · Purple = seen · Gray = unseen
        </p>
      </div>

      {/* Weak spots */}
      {weakSpots.length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-bone text-sm">Weak Spots</h2>
            <span className="badge-weak">{weakSpots.length}</span>
          </div>
          <div className="space-y-2">
            {weakSpots.map(r => {
              const ps = generatePitchSet(r.id)
              return (
                <div key={`${r.id}:${r.rootIndex}`} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-bone text-sm font-display">{ps.name}</p>
                    <p className="text-ash text-xs font-mono">#{r.id} · {r.lapses} lapses</p>
                  </div>
                  <button
                    onClick={() => { state.setFocus(r.id); onNavigate('practice') }}
                    className="btn-utility text-xs"
                  >
                    Focus
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mastered list */}
      {masteredList.length > 0 && (
        <div className="card p-4 space-y-3">
          <h2 className="font-display font-semibold text-bone text-sm">Mastered Sets</h2>
          <div className="space-y-2">
            {masteredList.map(r => {
              const ps = generatePitchSet(r.id)
              return (
                <div key={`${r.id}:${r.rootIndex}`} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-bone text-sm font-display">{ps.name}</p>
                    <p className="text-ash text-xs font-mono">#{r.id} · {r.intervalDays}d interval</p>
                  </div>
                  <span className="text-ember text-xs font-mono">✓ Mastered</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {stats.seen === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">🌑</div>
          <p className="text-ash text-sm">No practice sessions yet.</p>
          <p className="text-ash/50 text-xs">Start practicing to see your progress here.</p>
          <button onClick={() => onNavigate('practice')} className="btn-primary mt-2">
            Start Practicing
          </button>
        </div>
      )}
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, color, sub }: { label: string; value: number | string; color: string; sub: string }) {
  return (
    <div className="card p-3 text-center">
      <div className={`font-display font-bold text-2xl ${color}`}>{value}</div>
      <div className="text-bone text-xs font-ui mt-0.5">{label}</div>
      <div className="text-ash/50 text-[10px] mt-0.5">{sub}</div>
    </div>
  )
}

function MasteryBar({ label, count, total, color, textColor }: {
  label: string; count: number; total: number; color: string; textColor: string
}) {
  const pct = Math.round((count / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs w-16 flex-shrink-0 ${textColor}`}>{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.max(pct, 0.5)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-ash/60 w-10 text-right">{count}</span>
    </div>
  )
}

function ExposureMap({ records, rootIndex }: { records: Map<string, any>; rootIndex: number }) {
  // 2048 cells in a 64×32 grid
  const COLS = 64
  const ROWS = 32

  const cells = useMemo(() => {
    return Array.from({ length: 2048 }, (_, id) => {
      const rec = records.get(`${id}:${rootIndex}`)
      if (!rec || rec.reps === 0) return 0   // unseen
      if (rec.mastery === 'mastered') return 3  // mastered
      if (rec.mastery === 'stable') return 2    // stable
      return 1                                  // learning
    })
  }, [records, rootIndex])

  const STATE_COLORS = ['#1a1025', '#6F42C1', '#4A2D8A', '#F28C28']

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${COLS * 5} ${ROWS * 5}`}
        className="w-full"
        style={{ maxHeight: 160 }}
      >
        {cells.map((state, id) => {
          const col = id % COLS
          const row = Math.floor(id / COLS)
          return (
            <rect
              key={id}
              x={col * 5}
              y={row * 5}
              width={4}
              height={4}
              rx={0.5}
              fill={STATE_COLORS[state]}
              opacity={state === 0 ? 0.4 : 0.9}
            />
          )
        })}
      </svg>
    </div>
  )
}
