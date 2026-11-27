import { useEffect, useRef } from 'react';
import type { Lesson } from '../data/types.ts';
import { Village } from '../art/Village.tsx';
import { Anbessa } from '../art/Anbessa.tsx';
import { Sticker } from '../art/Pictures.tsx';
import { playClip, saySequence, sfx, stopAll } from '../audio/audio.ts';
import { completeLesson, useApp } from '../state.tsx';
import { Confetti, Icon, RoundButton } from '../ui/ui.tsx';
import { N } from '../data/narration.ts';

export function Reward({ lesson, onAgain }: { lesson: Lesson; onAgain: () => void }) {
  const { update, go, name } = useApp();
  const saved = useRef(false);
  useEffect(() => {
    if (!saved.current) {
      saved.current = true;
      update((s) => completeLesson(s, lesson.id, lesson.sticker?.id));
    }
    sfx('yay');
    saySequence([{ pause: 400 }, { en: N.rewardDone(lesson) },
      { en: N.rewardWords(lesson) }]);
    return () => stopAll();
  }, [lesson, name, update]);

  return (
    <div className="screen reward-screen">
      <Village time="day" />
      <Confetti />
      <div className="reward-card pop-in">
        <h2>Great job, {name}!</h2>
        {lesson.sticker && <div className="sticker-reveal"><Sticker id={lesson.sticker.id} /></div>}
        <p className="reward-sub">You learned {lesson.words.length} Amharic words</p>
        <div className="chips">
          {lesson.words.map((w) => (
            <button type="button" key={w.id} className="chip" onClick={() => playClip(w.clip)}>
              <span className="am">{w.am}</span><span className="en">{w.en}</span>
            </button>
          ))}
        </div>
        <div className="row-gap">
          <RoundButton icon="redo" label="Play again" onClick={onAgain} />
          <button type="button" className="big-pill green" onClick={() => go({ name: 'map' })}>
            <Icon name="home" /> Back to the village
          </button>
        </div>
      </div>
      <div className="reward-lion"><Anbessa pose="happy" /></div>
    </div>
  );
}
