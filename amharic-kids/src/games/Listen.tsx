import { useEffect, useMemo, useState } from 'react';
import type { Lesson, Word } from '../data/types.ts';
import { Picture } from '../art/Pictures.tsx';
import { Anbessa } from '../art/Anbessa.tsx';
import { playClip, saySequence, sfx, speak, stopAll } from '../audio/audio.ts';
import { Icon, Sparkles, shuffle } from '../ui/ui.tsx';

/** Hear an Amharic word, tap the matching picture. */
export function Listen({ lesson, words, rounds, onDone }: { lesson: Lesson; words: string[]; rounds: number; onDone: () => void }) {
  const pool = words.map((id) => lesson.words.find((w) => w.id === id)!);
  const plan = useMemo(() => {
    const out: Word[] = [];
    while (out.length < rounds) {
      for (const w of shuffle(pool)) if (out.length < rounds && out[out.length - 1]?.id !== w.id) out.push(w);
    }
    return out.map((target) => ({ target, options: shuffle([target, ...shuffle(pool.filter((p) => p.id !== target.id)).slice(0, 2)]) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [r, setR] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [right, setRight] = useState<string | null>(null);
  const round = plan[r];

  useEffect(() => {
    setWrong([]);
    setRight(null);
    saySequence(r === 0
      ? [{ en: 'Listen carefully! Tap the picture that matches.' }, { pause: 200 }, { clip: round.target.clip }]
      : [{ pause: 300 }, { clip: round.target.clip }]);
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);

  const pick = async (w: Word) => {
    if (right || wrong.includes(w.id)) return;
    if (w.id === round.target.id) {
      setRight(w.id);
      sfx('yay');
      stopAll();
      await playClip(w.clip);
      await speak(`Yes! ${w.en}!`);
      setTimeout(() => (r < plan.length - 1 ? setR(r + 1) : onDone()), 500);
    } else {
      sfx('oops');
      setWrong([...wrong, w.id]);
      saySequence([{ en: 'Oops! Listen again.' }, { clip: round.target.clip }]);
    }
  };

  return (
    <div className="screen listen-screen">
      <h2 className="step-title">Listen and tap</h2>
      <div className="stars-row">
        {plan.map((_, k) => <span key={k} className={k < r || (k === r && right) ? 'got' : ''}><Icon name="star" /></span>)}
      </div>
      <button type="button" className="ear-btn pulse" onClick={() => playClip(round.target.clip)} aria-label="Hear the word again">
        <Icon name="speaker" />
        <span>Listen</span>
      </button>
      <div className="options" key={r}>
        {round.options.map((w) => (
          <button
            type="button"
            key={w.id}
            className={`option pop-in ${wrong.includes(w.id) ? 'wrong' : ''} ${right === w.id ? 'right' : ''} ${right && right !== w.id ? 'fade' : ''}`}
            onClick={() => pick(w)}
            aria-label={w.en}
          >
            <Picture k={w.picture} title={w.en} />
            <span className="opt-label">{w.en}</span>
            {right === w.id && <Sparkles />}
          </button>
        ))}
      </div>
      <div className="game-buddy"><Anbessa pose={right ? 'happy' : 'idle'} /></div>
    </div>
  );
}
