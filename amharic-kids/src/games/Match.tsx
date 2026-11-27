import { useEffect, useMemo, useState } from 'react';
import type { Lesson } from '../data/types.ts';
import { Picture } from '../art/Pictures.tsx';
import { Anbessa } from '../art/Anbessa.tsx';
import { playClip, saySequence, sfx, speak, stopAll } from '../audio/audio.ts';
import { Icon, Sparkles, shuffle } from '../ui/ui.tsx';

/** Pair each picture with its Amharic word. Tapping a word always plays it, so pre-readers match by sound. */
export function Match({ lesson, words, onDone }: { lesson: Lesson; words: string[]; onDone: () => void }) {
  const list = words.map((id) => lesson.words.find((w) => w.id === id)!);
  const pics = useMemo(() => shuffle(list), []); // eslint-disable-line react-hooks/exhaustive-deps
  const ams = useMemo(() => shuffle(list), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [pic, setPic] = useState<string | null>(null);
  const [am, setAm] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [shake, setShake] = useState<string[]>([]);
  const [cheer, setCheer] = useState(false);

  useEffect(() => {
    saySequence([{ en: 'Match each picture with its Amharic word. Tap a word to hear it!' }]);
    return () => stopAll();
  }, []);

  const tryPair = (p: string | null, a: string | null) => {
    if (!p || !a) return;
    if (p === a) {
      const nd = [...done, p];
      setDone(nd);
      setPic(null);
      setAm(null);
      sfx('ding');
      setCheer(true);
      setTimeout(() => setCheer(false), 1400);
      if (nd.length === list.length) {
        setTimeout(async () => {
          sfx('yay');
          await speak('You matched them all!');
          onDone();
        }, 700);
      }
    } else {
      sfx('oops');
      setShake([p, `am-${a}`]);
      setTimeout(() => { setShake([]); setPic(null); setAm(null); }, 600);
    }
  };

  return (
    <div className="screen match-screen">
      <h2 className="step-title">Match them up</h2>
      <div className="match-board">
        <div className="match-col">
          {pics.map((w) => (
            <button type="button" key={w.id} aria-label={w.en}
              className={`match-pic ${pic === w.id ? 'sel' : ''} ${done.includes(w.id) ? 'matched' : ''} ${shake.includes(w.id) ? 'wrong' : ''}`}
              onClick={() => { if (done.includes(w.id)) return; sfx('pop'); setPic(w.id); tryPair(w.id, am); }}>
              <Picture k={w.picture} title={w.en} />
              {done.includes(w.id) && <span className="tick"><Icon name="check" /></span>}
            </button>
          ))}
        </div>
        <div className="match-col">
          {ams.map((w) => (
            <button type="button" key={w.id}
              className={`match-am ${am === w.id ? 'sel' : ''} ${done.includes(w.id) ? 'matched' : ''} ${shake.includes(`am-${w.id}`) ? 'wrong' : ''}`}
              onClick={() => { playClip(w.clip); if (done.includes(w.id)) return; setAm(w.id); tryPair(pic, w.id); }}>
              <span className="am">{w.am}</span>
              <span className="tr"><Icon name="speaker" /> {w.translit}</span>
              {done.includes(w.id) && <Sparkles />}
            </button>
          ))}
        </div>
      </div>
      <div className="game-buddy"><Anbessa pose={cheer ? 'happy' : 'idle'} /></div>
    </div>
  );
}
