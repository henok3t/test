import { useEffect } from 'react';
import { refreshRecordings, unlockAudio } from './audio/audio.ts';
import { AppProvider, useApp } from './state.tsx';
import { Home } from './screens/Home.tsx';
import { Setup } from './screens/Setup.tsx';
import { MapScreen } from './screens/MapScreen.tsx';
import { LessonPlayer } from './screens/LessonPlayer.tsx';
import { Stickers } from './screens/Stickers.tsx';
import { Parents } from './screens/Parents.tsx';

function Screens() {
  const { screen } = useApp();
  switch (screen.name) {
    case 'home': return <Home />;
    case 'setup': return <Setup />;
    case 'map': return <MapScreen />;
    case 'lesson': return <LessonPlayer key={screen.id} id={screen.id} startStep={screen.step} />;
    case 'stickers': return <Stickers />;
    case 'parents': return <Parents />;
  }
}

export function App() {
  useEffect(() => {
    refreshRecordings();
    // any first touch unlocks sound on iOS/Android
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);
  return (
    <AppProvider>
      <div className="app"><Screens /></div>
    </AppProvider>
  );
}
