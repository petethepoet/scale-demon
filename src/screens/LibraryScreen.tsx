import React, { useState, useMemo, useCallback } from 'react'
import type { PitchSet } from '../types'
import type { useAppState } from '../hooks/useAppState'
import { generatePitchSet, searchPitchSets, getPresetIds } from '../utils/pitchSet'
import type { PresetKey } from '../utils/pitchSet'
import { NoteChips } from '../components/shared/NoteChips'

type AppState = ReturnType<typeof useAppState>

const PRESETS: { key: PresetKey; label: string; desc: string }[] = [
  { key: 'beginner',     label: 'Beginner',     desc: 'Common scales to build your foundation' },
  { key: 'intermediate', label: 'Intermediate',  desc: 'Named sets beyond the basics' },
  { key: 'common',       label: 'Common',        desc: 'All recognized named scale forms' },
  { key: 'holdsworth',   label: 'Complex',       desc: 'Unusual, complex, and fusion-ready sets' },
  { key: 'all',          label: 'All 2048',      desc: 'The complete pitch-set universe' },
  { key: 'chaos',        label: 'Chaos',         desc: '50 random sets across the spectrum' },
]

interface LibraryScreenProps {
  state: AppState
}

export function LibraryScreen({ state }: LibraryScreenProps) {
  const [query, setQuery] = useState('')
  const [activePreset, setActivePreset] = useState<PresetKey | null>('common')
  const [sizeFilter, setSizeFilter] = useState<number | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(50)

  const { settings, records, toggleFavorite, setFocus } = state

  // Get base ID list
  const baseIds = useMemo(() => {
    if (query.trim()) return searchPitchSets(query, 100).map(p => p.id)
    if (activePreset) return getPresetIds(activePreset)
    return Array.from({ length: 200 }, (_, i) => i) // default: first 200
  }, [query, activePreset])

  // Apply filters
  const filteredIds = useMemo(() => {
    let ids = baseIds
    if (sizeFilter !== null) {
      ids = ids.filter(id => {
        const ps = generatePitchSet(id)
        return ps.size === sizeFilter
      })
    }
    if (showFavoritesOnly) {
      ids = ids.filter(id => {
        const key = `${id}:${settings.rootIndex}`
        return records.get(key)?.favorite ?? false
      })
    }
    return ids
  }, [baseIds, sizeFilter, showFavoritesOnly, records, settings.rootIndex])

  const displayedIds = filteredIds.slice(0, displayLimit)

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-8 space-y-4">
      <div>
        <h1 className="font-display font-bold text-bone text-xl mb-0.5">Library</h1>
        <p className="text-ash text-xs">
          {filteredIds.length.toLocaleString()} sets
          {activePreset === 'all' ? ' in the full universe' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setActivePreset(null) }}
          placeholder="Search by name, interval, or #id…"
          className="w-full bg-void border border-white/10 rounded-btn pl-9 pr-4 py-2.5 text-sm text-bone placeholder-ash/50 focus:outline-none focus:border-demon-purple/50 transition-colors"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-bone">
            ×
          </button>
        )}
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs text-ash/60 mb-2 uppercase tracking-wide font-ui">Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => { setActivePreset(p.key); setQuery('') }}
              className={[
                'px-3 py-1.5 rounded-btn text-xs font-ui font-medium transition-all duration-150 border',
                activePreset === p.key
                  ? 'bg-demon-purple text-bone border-demon-purple'
                  : 'bg-void text-ash border-white/10 hover:text-bone hover:border-white/20',
              ].join(' ')}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ash">Notes:</span>
          {[null, 5, 6, 7, 8].map(n => (
            <button
              key={n ?? 'all'}
              onClick={() => setSizeFilter(n)}
              className={[
                'px-2 py-1 rounded text-xs font-mono transition-all',
                sizeFilter === n
                  ? 'bg-void border border-bone/30 text-bone'
                  : 'text-ash hover:text-bone',
              ].join(' ')}
            >
              {n ?? 'All'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowFavoritesOnly(f => !f)}
          className={[
            'flex items-center gap-1 text-xs px-2 py-1 rounded border transition-all',
            showFavoritesOnly
              ? 'border-ember/40 text-ember bg-ember/5'
              : 'border-white/10 text-ash hover:text-bone',
          ].join(' ')}
        >
          ★ Favorites only
        </button>
      </div>

      {/* Set list */}
      <div className="space-y-2">
        {displayedIds.map(id => (
          <LibraryItem
            key={id}
            id={id}
            rootIndex={settings.rootIndex}
            naming={settings.noteNaming}
            record={records.get(`${id}:${settings.rootIndex}`) ?? null}
            isFavorite={records.get(`${id}:${settings.rootIndex}`)?.favorite ?? false}
            onFavorite={() => toggleFavorite(id)}
            onFocus={() => { setFocus(id); /* navigate to practice */ }}
            onPractice={() => { setFocus(id) }}
          />
        ))}

        {displayedIds.length === 0 && (
          <div className="text-center py-12 text-ash">
            <p className="text-sm">No sets match your filters.</p>
          </div>
        )}

        {filteredIds.length > displayLimit && (
          <button
            onClick={() => setDisplayLimit(l => l + 50)}
            className="w-full py-3 text-sm text-ash hover:text-bone border border-white/8 rounded-btn transition-colors"
          >
            Load more ({filteredIds.length - displayLimit} remaining)
          </button>
        )}
      </div>
    </main>
  )
}

// ─── Library Item ─────────────────────────────────────────────────────────────

interface LibraryItemProps {
  id: number
  rootIndex: number
  naming: string
  record: any
  isFavorite: boolean
  onFavorite: () => void
  onFocus: () => void
  onPractice: () => void
}

function LibraryItem({ id, rootIndex, naming, record, isFavorite, onFavorite, onFocus }: LibraryItemProps) {
  const ps = useMemo(() => generatePitchSet(id), [id])
  const mastery = record?.mastery ?? 'new'

  const masteryColor: Record<string, string> = {
    new: 'text-ash/40',
    learning: 'text-ice',
    stable: 'text-demon-purple-light',
    mastered: 'text-ember',
  }

  return (
    <div className="card p-3 flex items-start gap-3 hover:border-white/15 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <h3 className="font-display font-semibold text-bone text-sm">{ps.name}</h3>
          <span className={`text-[10px] font-ui uppercase tracking-wide ${masteryColor[mastery]}`}>
            {mastery}
          </span>
          <span className="text-ash/40 text-xs font-mono">#{id}</span>
          <span className="text-ash text-xs">{ps.size} notes</span>
        </div>
        <NoteChips
          intervals={ps.intervals}
          rootIndex={rootIndex as any}
          naming={naming as any}
        />
        <p className="text-ash/50 text-[10px] font-mono mt-1.5">{ps.signature}</p>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={onFavorite}
          className={['p-1.5 rounded transition-colors', isFavorite ? 'text-ember' : 'text-ash/30 hover:text-ash'].join(' ')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
        <button
          onClick={onFocus}
          className="p-1.5 rounded text-ash/30 hover:text-demon-purple-light transition-colors"
          title="Focus mode"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
