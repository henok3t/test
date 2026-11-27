import { useEffect, useState } from 'react';
import { Village } from '../art/Village.tsx';
import { Anbessa } from '../art/Anbessa.tsx';
import { playClip, sfx, speak, stopAll, unlockAudio } from '../audio/audio.ts';
import { useApp } from '../state.tsx';
import { HoldButton, Icon, Tibeb } from '../ui/ui.tsx';

export function Home() {
  const { go, saved, name } = useApp();
  const [pose, setPose] = useState<'wave' | 'happy' | 'talk'>('wave');
  useEffect(() => () => stopAll(), []);

  const greet = async () => {
    unlockAudio();
    setPose('talk');
    await playClip('selam');
    setPose('happy');
    sfx('sparkle');
    await speak(saved.setupDone ? `Selam, ${name}! Let's play!` : 'Selam! I am Anbessa. Let’s play!');
    setPose('wave');
  };

  const play = () => {
    unlockAudio();
    sfx('pop');
    go(saved.setupDone ? { name: 'map' } : { name: 'setup' });
  };

  return (
    <div className="screen home-screen">
      <Village time="day" />
      <div className="home-title pop-in">
        <div className="logo-am">ሰላም</div>
        <div className="logo-en">Selam, Anbessa!</div>
        <Tibeb className="logo-tibeb" />
        <div className="logo-sub">Learn Amharic with a little lion</div>
      </div>
      <button type="button" className="home-lion" onClick={greet} aria-label="Say hello to Anbessa">
        <Anbessa pose={pose} talking={pose === 'talk'} />
      </button>
      <button type="button" className="play-btn pulse" onClick={play} aria-label="Play">
        <Icon name="play" />
      </button>
      <div className="home-corner">
        <button type="button" className="corner-btn" onClick={() => { unlockAudio(); go({ name: 'stickers' }); }} aria-label="My stickers">
          <Icon name="star" /><span>Stickers</span>
        </button>
        <HoldButton className="corner-btn grown" onDone={() => { unlockAudio(); go({ name: 'parents' }); }}>
          <Icon name="gear" /><span>Grown-ups<br /><small>hold</small></span>
        </HoldButton>
      </div>
    </div>
  );
}
