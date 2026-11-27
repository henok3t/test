import { useEffect, useState } from 'react';
import type { Lesson } from '../data/types.ts';
import { Picture } from '../art/Pictures.tsx';
import { Anbessa } from '../art/Anbessa.tsx';
import { playClip, saySequence, stopAll } from '../audio/audio.ts';
import { RoundButton } from '../ui/ui.tsx';
import { N } from '../data/narration.ts';

/** "Meet the words": one big card per word. */
export function Cards({ lesson, words, onDone }: { lesson: Lesson; words: string[]; onDone: () => void }) {
  const list = words.map((id) => lesson.words.find((w) => w.id === id)!);
  const [i, setI] = useState(0);
  const [talking, setTalking] = useState(false);
  const w = list[i];

  const play = async () => {
    setTalking(true);
    await saySequence([{ clip: w.clip }, { pause: 300 }, { en: w.explain }, { pause: 300 }, { en: N.sayIt }]);
    setTalking(false);
  };
  useEffect(() => {
    play();
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  return (
    <div className="screen cards-screen">
      <h2 className="step-title">Meet the words</h2>
      <div className="word-card pop-in" key={w.id}>
        <button type="button" className="word-pic" onClick={() => playClip(w.clip)} aria-label={`Hear ${w.en}`}>
          <Picture k={w.picture} title={w.en} />
        </button>
        <div className="word-info">
          <button type="button" className="am-big" onClick={() => playClip(w.clip)}>{w.am}</button>
          <div className="say-like">say: <b>{w.sayLike}</b></div>
          <div className="meaning">{w.en}</div>
          <div className="card-buttons">
            <RoundButton icon="speaker" label="Hear it" onClick={() => playClip(w.clip)} color="blue" />
            <RoundButton icon="turtle" label="Hear it slowly" onClick={() => playClip(w.clip, { rate: 0.75 })} color="purple" />
          </div>
        </div>
      </div>
      <div className="cards-foot">
        <div className={`buddy ${talking ? '' : 'buddy-idle'}`}><Anbessa pose={talking ? 'talk' : 'happy'} talking={talking} /></div>
        <div className="dots">{list.map((x, k) => <span key={x.id} className={k === i ? 'on' : k < i ? 'done' : ''} />)}</div>
        <div className="row-gap">
          {i > 0 && <RoundButton icon="back" label="Previous word" onClick={() => setI(i - 1)} />}
          <RoundButton icon="next" label="Next word" onClick={() => (i < list.length - 1 ? setI(i + 1) : onDone())} size="l" color="green" pulse={!talking} />
        </div>
      </div>
    </div>
  );
}
