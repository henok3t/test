import { lessons } from '../data/lessons/index.ts';
import { Sticker } from '../art/Pictures.tsx';
import { sfx, speak } from '../audio/audio.ts';
import { useApp } from '../state.tsx';
import { RoundButton } from '../ui/ui.tsx';

export function Stickers() {
  const { go, saved } = useApp();
  return (
    <div className="screen stickers-screen">
      <header className="top-bar">
        <RoundButton icon="back" label="Back" onClick={() => go({ name: 'home' })} />
        <h1>My Stickers</h1>
        <RoundButton icon="play" label="Play" onClick={() => go({ name: 'map' })} color="green" />
      </header>
      <div className="sticker-grid">
        {lessons.map((l) => {
          const id = l.sticker?.id;
          const have = !!id && saved.stickers.includes(id);
          return (
            <button type="button" key={l.id} className={`sticker-slot ${have ? 'have' : ''}`}
              onClick={() => { sfx(have ? 'sparkle' : 'tap'); speak(have ? `${l.title}! You earned this one.` : `Finish lesson ${l.number} to get this sticker.`); }}>
              {have ? <Sticker id={id!} /> : <span className="mystery">?</span>}
              <span className="slot-label">{l.number}. {l.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
