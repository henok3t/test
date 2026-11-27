import { useEffect, useMemo, useRef, useState } from 'react';
import type { Beat, CharacterId, Pose, SceneBackground, Step } from '../data/types.ts';
import { clipById } from '../data/clips.ts';
import { Village } from '../art/Village.tsx';
import { Anbessa } from '../art/Anbessa.tsx';
import { Tota } from '../art/Tota.tsx';
import { playClip, saySequence, sfx, speak, stopAll, type SayItem } from '../audio/audio.ts';
import { useApp } from '../state.tsx';
import { Icon, RoundButton, Sparkles } from '../ui/ui.tsx';
import { N } from '../data/narration.ts';

type StoryStep = Extract<Step, { type: 'story' }>;
const CAST: CharacterId[] = ['anbessa', 'tota'];

/** Fold beats 0..i into the current background and cast poses */
function stateAt(beats: Beat[], i: number) {
  let bg: SceneBackground = 'day';
  const cast: Record<CharacterId, Pose> = { anbessa: 'hidden', tota: 'hidden' };
  for (let k = 0; k <= i; k++) {
    if (beats[k].bg) bg = beats[k].bg!;
    Object.assign(cast, beats[k].cast);
  }
  return { bg, cast };
}

export function Character({ id, pose, talking }: { id: CharacterId; pose: Pose; talking?: boolean }) {
  return id === 'anbessa' ? <Anbessa pose={pose} talking={talking} /> : <Tota pose={pose} talking={talking} />;
}

export function Story({ step, onDone }: { step: StoryStep; onDone: () => void }) {
  const { name } = useApp();
  const [i, setI] = useState(0);
  const [talking, setTalking] = useState<CharacterId | null>(null);
  const [ready, setReady] = useState(false); // audio for this beat has finished
  const [reacted, setReacted] = useState<Partial<Record<CharacterId, Pose>> | null>(null);
  const beat = step.beats[i];
  const { bg, cast } = useMemo(() => stateAt(step.beats, i), [step.beats, i]);
  const poses = { ...cast, ...(reacted ?? {}) };
  const childLabel = beat.childSays?.label.replace('$name', name);
  const root = useRef<HTMLDivElement>(null);
  const narr = useRef<HTMLDivElement>(null);

  // keep the characters above the narration panel, whatever its height
  useEffect(() => {
    if (!narr.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => root.current?.style.setProperty('--narr', `${narr.current!.offsetHeight + 24}px`));
    ro.observe(narr.current);
    return () => ro.disconnect();
  }, []);

  // Each beat (and each replay / child tap) gets a token; stale async work checks it and stops.
  const token = useRef(0);
  const playBeat = async () => {
    const my = ++token.current;
    setReady(false);
    stopAll();
    if (beat.say && beat.speaker) {
      setTalking(beat.speaker);
      await playClip(beat.say);
      if (token.current !== my) return;
      setTalking(null);
      await new Promise((r) => setTimeout(r, 250));
      if (token.current !== my) return;
    }
    const ok = await saySequence([{ en: beat.narrate }]);
    if (ok && token.current === my) setReady(true);
  };

  useEffect(() => {
    setReacted(null);
    setTalking(null);
    playBeat();
    if (beat.bg && i > 0) sfx('whoosh');
    return () => {
      token.current++;
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const next = () => {
    if (i < step.beats.length - 1) setI(i + 1);
    else onDone();
  };

  const childSay = async () => {
    if (!beat.childSays || reacted) return;
    const my = ++token.current;
    setTalking(null);
    const items: SayItem[] = beat.childSays.clips.map((c) => (c === '$name' ? { name } : { clip: c }));
    const done = await saySequence(items);
    if (!done || token.current !== my) return;
    sfx('sparkle');
    setReacted(beat.childSays.react);
    await speak(N.praise[i % N.praise.length]);
    setTimeout(() => token.current === my && next(), 900);
  };

  const showBubble = (id: CharacterId) => beat.speaker === id && beat.say;

  return (
    <div className={`story bg-${bg}`} ref={root}>
      <Village time={bg} />
      <div className={`stage ${CAST.filter((c) => poses[c] !== 'hidden').length === 1 ? 'solo' : 'duo'}`}>
        {CAST.map((id) => (
          <div key={id} className={`actor actor-${id} ${poses[id] === 'hidden' ? 'off' : 'on'}`}>
            {showBubble(id) && (
              <button type="button" className="bubble" onClick={() => playClip(beat.say!)} aria-label="Hear it again">
                <span className="am">{clipById.get(beat.say!)?.am}</span>
                <span className="tr">{clipById.get(beat.say!)?.translit}</span>
              </button>
            )}
            {reacted?.[id] && <Sparkles />}
            <Character id={id} pose={poses[id] === 'hidden' ? 'idle' : poses[id]} talking={talking === id} />
          </div>
        ))}
      </div>

      <div className="narration" ref={narr}>
        <RoundButton icon="speaker" label="Hear it again" onClick={playBeat} size="s" color="blue" />
        <p>{beat.narrate}</p>
        {beat.childSays ? (
          <button type="button" className={`say-btn ${reacted ? 'said' : 'pulse'}`} onClick={childSay}>
            <span className="am">{childLabel}</span>
            <span className="hint">{reacted ? <Icon name="check" /> : 'Tap to say it!'}</span>
          </button>
        ) : (
          <RoundButton icon="next" label="Next" onClick={next} size="l" color="green" pulse={ready} className="next-btn" />
        )}
      </div>
    </div>
  );
}
