import React, { useState } from 'react'
import { TopNav } from './components/shared/TopNav'
import { PracticeScreen } from './screens/PracticeScreen'
import { LibraryScreen } from './screens/LibraryScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { useAppState } from './hooks/useAppState'

type Screen = 'practice' | 'library' | 'progress' | 'settings'

export default function App() {
  const [screen, setScreen] = useState<Screen>('practice')
  const appState = useAppState()

  function handleNavigate(s: string) {
    setScreen(s as Screen)
  }

  // Wrap setFocus for library so it also navigates to practice
  const libraryState = {
    ...appState,
    setFocus: (id: number | null) => {
      appState.setFocus(id)
      setScreen('practice')
    },
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <TopNav active={screen} onNavigate={s => setScreen(s)} />

      <div className="flex-1 flex flex-col animate-fade-in" key={screen}>
        {screen === 'practice' && <PracticeScreen state={appState} />}
        {screen === 'library'  && <LibraryScreen  state={libraryState} />}
        {screen === 'progress' && <ProgressScreen state={appState} onNavigate={handleNavigate} />}
        {screen === 'settings' && <SettingsScreen state={appState} />}
      </div>
    </div>
  )
}
