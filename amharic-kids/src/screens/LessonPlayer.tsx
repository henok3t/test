import { useEffect, useState } from 'react';
import { lessonById } from '../data/lessons/index.ts';
import type { Lesson } from '../data/types.ts';
import { clips } from '../data/clips.ts';
import { preloadClips, preloadNarration, stopAll } from '../audio/audio.ts';
import { allLines } from '../data/narration.ts';
import { useApp } from '../state.tsx';
import { Story } from '../games/Story.tsx';
import { Cards } from '../games/Cards.tsx';
import { Listen } from '../games/Listen.tsx';
import { Choose } from '../games/Choose.tsx';
import { Match } from '../games/Match.tsx';
import { Trace } from '../games/Trace.tsx';
import { Reward } from '../games/Reward.tsx';
import { Icon, RoundButton } from '../ui/ui.tsx';

export function LessonPlayer({ id, startStep = 0 }: { id: string; startStep?: number }) {
  const lesson = lessonById.get(id);
  if (!lesson?.ready) return <MissingLesson />;
  return <Player lesson={lesson} startStep={startStep} />;
}

function MissingLesson() {
  const { go } = useApp();
  useEffect(() => go({ name: 'map' }), [go]);
  return null;
}

function Player({ lesson, startStep }: { lesson: Lesson; startStep: number }) {
  const { go } = useApp();
  const [i, setI] = useState(Math.min(startStep, lesson.steps.length - 1));
  const [run, setRun] = useState(0); // bump to replay from the start
  const [leaving, setLeaving] = useState(false);
  const step = lesson.steps[i];

  useEffect(() => {
    preloadClips(clips.map((c) => c.id));
    preloadNarration(allLines([lesson]));
    return () => stopAll();
  }, []);

  const next = () => setI((k) => Math.min(k + 1, lesson.steps.length - 1));
  const key = `${run}-${i}`;
  let body;
  switch (step.type) {
    case 'story': body = <Story key={key} step={step} onDone={next} />; break;
    case 'cards': body = <Cards key={key} lesson={lesson} words={step.words} onDone={next} />; break;
    case 'listen': body = <Listen key={key} lesson={lesson} words={step.words} rounds={step.rounds} onDone={next} />; break;
    case 'choose': body = <Choose key={key} lesson={lesson} situations={step.situations} onDone={next} />; break;
    case 'match': body = <Match key={key} lesson={lesson} words={step.words} onDone={next} />; break;
    case 'trace': body = <Trace key={key} lesson={lesson} onDone={next} />; break;
    case 'reward': body = <Reward key={key} lesson={lesson} onAgain={() => { setRun(run + 1); setI(0); }} />; break;
  }

  return (
    <div className={`lesson lesson-${step.type}`}>
      {body}
      {step.type !== 'reward' && (
        <div className="lesson-bar">
          <RoundButton icon="close" label="Leave lesson" onClick={() => { stopAll(); setLeaving(true); }} size="s" />
          <div className="progress" aria-label={`Step ${i + 1} of ${lesson.steps.length}`}>
            {lesson.steps.map((s, k) => <span key={k} className={k < i ? 'done' : k === i ? 'on' : ''} title={s.type} />)}
          </div>
        </div>
      )}
      {leaving && (
        <div className="overlay" onClick={() => setLeaving(false)}>
          <div className="panel small-panel pop-in" onClick={(e) => e.stopPropagation()}>
            <h2>Leave the lesson?</h2>
            <div className="row-gap">
              <button type="button" className="big-pill green" onClick={() => setLeaving(false)}><Icon name="play" /> Keep playing</button>
              <button type="button" className="big-pill grey" onClick={() => go({ name: 'map' })}><Icon name="home" /> Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
