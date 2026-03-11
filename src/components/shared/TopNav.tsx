import React from 'react'

type Screen = 'practice' | 'library' | 'progress' | 'settings'

interface TopNavProps {
  active: Screen
  onNavigate: (s: Screen) => void
}

export function TopNav({ active, onNavigate }: TopNavProps) {
  return (
    <nav className="sticky top-0 z-50 bg-ink/95 backdrop-blur-sm border-b border-white/8">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 select-none flex-shrink-0">
          <DemonLogo />
          <span className="font-display font-bold text-bone tracking-tight text-sm hidden sm:block">
            Scale Demon
          </span>
        </div>

        {/* Nav Items */}
        <div className="flex items-center">
          {(['practice', 'library', 'progress', 'settings'] as Screen[]).map(id => (
            <NavButton key={id} id={id} active={active} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </nav>
  )
}

interface NavButtonProps {
  id: Screen
  active: Screen
  onNavigate: (s: Screen) => void
}

function NavButton({ id, active, onNavigate }: NavButtonProps) {
  const isActive = active === id
  const label = id.charAt(0).toUpperCase() + id.slice(1)

  return (
    <button
      onClick={() => onNavigate(id)}
      className={[
        'relative flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5',
        'px-2 sm:px-3.5 py-2 rounded-btn font-ui font-medium transition-all duration-150 select-none',
        'min-w-[52px] sm:min-w-0',
        isActive
          ? 'text-bone'
          : 'text-ash hover:text-bone/70',
      ].join(' ')}
    >
      {/* Mobile: SVG icon */}
      <span className="sm:hidden opacity-90">
        <NavIcon id={id} active={isActive} />
      </span>

      {/* Label */}
      <span className="text-[10px] sm:text-xs tracking-wide sm:tracking-normal">
        {label}
      </span>

      {/* Active indicator */}
      {isActive && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-ember" />
      )}
    </button>
  )
}

function NavIcon({ id, active }: { id: Screen; active: boolean }) {
  const color = active ? '#F4E8C8' : '#8A83A6'
  const w = 16

  if (id === 'practice') return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <polygon points="5 3 19 12 5 21 5 3" fill={active ? color : 'none'} stroke={color} />
    </svg>
  )
  if (id === 'library') return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
  if (id === 'progress') return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
  if (id === 'settings') return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
  return null
}

function DemonLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Horns */}
      <path d="M7 3 L4.5 10 L9 8.5 Z" fill="#6F42C1"/>
      <path d="M23 3 L25.5 10 L21 8.5 Z" fill="#6F42C1"/>
      {/* Head */}
      <ellipse cx="15" cy="17" rx="9.5" ry="10.5" fill="#160A2A" stroke="#6F42C1" strokeWidth="1.5"/>
      {/* Eyes */}
      <ellipse cx="11" cy="14.5" rx="2.2" ry="2.8" fill="#53C8F5"/>
      <ellipse cx="19" cy="14.5" rx="2.2" ry="2.8" fill="#53C8F5"/>
      <circle cx="11" cy="14.5" r="1.1" fill="#0A0614"/>
      <circle cx="19" cy="14.5" r="1.1" fill="#0A0614"/>
      {/* Eye glints */}
      <circle cx="11.7" cy="13.5" r="0.5" fill="white" opacity="0.7"/>
      <circle cx="19.7" cy="13.5" r="0.5" fill="white" opacity="0.7"/>
      {/* Fretboard strings */}
      <line x1="8.5" y1="20" x2="21.5" y2="20" stroke="#F28C28" strokeWidth="1" opacity="0.65"/>
      <line x1="8.5" y1="22.5" x2="21.5" y2="22.5" stroke="#F28C28" strokeWidth="1" opacity="0.4"/>
      {/* Note dots */}
      <circle cx="11.5" cy="20" r="1.3" fill="#F28C28"/>
      <circle cx="15" cy="22.5" r="1.3" fill="#F28C28" opacity="0.7"/>
      <circle cx="18.5" cy="20" r="1.3" fill="#9B6EE8"/>
    </svg>
  )
}
