import { useEffect, useState } from 'react';
import type { CharacterId, Lesson, Pose, SceneBackground, Situation, Word } from '../data/types.ts';
import { Village } from '../art/Village.tsx';
import { Character } from './Story.tsx';
import { playClip, saySequence, sfx, speak, stopAll } from '../audio/audio.ts';
import { Icon, RoundButton, Sparkles } from '../ui/ui.tsx';

const SCENES: Record<Situation['scene'], { bg: SceneBackground; cast: Record<CharacterId, Pose>; extra?: 'question' }> = {
  arrive: { bg: 'day', cast: { anbessa: 'idle', tota: 'wave' } },
  gift: { bg: 'day', cast: { anbessa: 'idle', tota: 'give' } },
  name: { bg: 'day', cast: { anbessa: 'idle', tota: 'talk' }, extra: 'question' },
  night: { bg: 'night', cast: { anbessa: 'idle', tota: 'wave' } },
};

/** In a word's text, "___" becomes Anbessa's name (he is the one speaking). */
const fill = (s: string, am: boolean) => s.replace('___', am ? 'አንበሳ' : 'Anbessa');
const clipFor = (w: Word) => (w.id === 'sime' ? 'sime-anbessa-new' : w.clip);

/** "Help Anbessa": a little scene, and the child picks what Anbessa should say. */
export function Choose({ lesson, situations, onDone }: { lesson: Lesson; situations: Situation[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [right, setRight] = useState(false);
  const [talking, setTalking] = useState(false);
  const sit = situations[i];
  const scene = SCENES[sit.scene];
  const words = sit.options.map((id) => lesson.words.find((w) => w.id === id)!);

  useEffect(() => {
    setWrong([]);
    setRight(false);
    saySequence([{ en: sit.narrate }]);
    return () => stopAll();
  }, [i, sit.narrate]);

  const pick = async (w: Word) => {
    if (right || wrong.includes(w.id)) return;
    if (w.id === sit.answer) {
      setRight(true);
      stopAll();
      sfx('ding');
      setTalking(true);
      await playClip(clipFor(w));
      setTalking(false);
      sfx('yay');
      await speak(`That’s right! ${fill(w.en, false)}!`);
      setTimeout(() => (i < situations.length - 1 ? setI(i + 1) : onDone()), 600);
    } else {
      sfx('oops');
      setWrong([...wrong, w.id]);
      await playClip(clipFor(w));
      speak(`Hmm, ${fill(w.translit, false)} means ${fill(w.en, false)}. Try another one!`);
    }
  };

  const cast = { ...scene.cast, ...(right ? { anbessa: 'happy' as Pose } : {}) };
  return (
    <div className="screen choose-screen">
      <h2 className="step-title">Help Anbessa!</h2>
      <div className="mini-scene" key={i}>
        <Village time={scene.bg} />
        <div className="mini-stage">
          <div className="actor on">{right && <Sparkles />}<Character id="anbessa" pose={talking ? 'talk' : cast.anbessa} talking={talking} /></div>
          <div className="actor on">
            {scene.extra === 'question' && <div className="q-bubble">?</div>}
            <Character id="tota" pose={cast.tota} />
          </div>
        </div>
        <div className="scene-caption">
          <RoundButton icon="speaker" label="Hear it again" onClick={() => saySequence([{ en: sit.narrate }])} size="s" color="blue" />
          <p>{sit.narrate}</p>
        </div>
      </div>
      <div className="choices">
        {words.map((w) => (
          <button
            type="button"
            key={w.id}
            className={`choice ${wrong.includes(w.id) ? 'wrong' : ''} ${right && w.id === sit.answer ? 'right' : ''} ${right && w.id !== sit.answer ? 'fade' : ''}`}
            onClick={() => pick(w)}
          >
            <span className="am">{fill(w.am, true)}</span>
            <span className="tr">{fill(w.translit, false)}</span>
            {right && w.id === sit.answer && <span className="tick"><Icon name="check" /></span>}
          </button>
        ))}
      </div>
    </div>
  );
}
