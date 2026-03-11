import React from 'react'

interface SessionStatusStripProps {
  dueCount: number
  newRemaining: number
  position: number
  total: number
  streak: number
}

export function SessionStatusStrip({ dueCount, newRemaining, position, total, streak }: SessionStatusStripProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-void/60 rounded-btn border border-white/6">
      <div className="flex items-center gap-4 text-xs font-mono">
        <Stat label="Due" value={dueCount} color={dueCount > 0 ? 'text-ember' : 'text-ash'} />
        <Stat label="New" value={newRemaining} color={newRemaining > 0 ? 'text-ice' : 'text-ash'} />
        <Stat label="Set" value={`${position} of ${total}`} color="text-ash" />
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1 text-xs font-mono text-ember">
          <span>🔥</span>
          <span>{streak}</span>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-ash/50">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </span>
  )
}
