import { useEffect, useRef, useState } from 'react';
import type { Lesson } from '../data/types.ts';
import { playClip, saySequence, sfx, stopAll } from '../audio/audio.ts';
import { Confetti, RoundButton } from '../ui/ui.tsx';

const FONT = (px: number) => `700 ${px}px "Noto Sans Ethiopic", sans-serif`;
const NEEDED = 0.55; // share of the letter that must be painted

/** Meet a fidel letter, then paint over it with a finger. */
export function Trace({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const letter = lesson.letter!;
  const word = lesson.words.find((w) => w.id === letter.fromWord)!;
  const [phase, setPhase] = useState<'meet' | 'trace' | 'done'>('meet');
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const guide = useRef<HTMLCanvasElement>(null);
  const paint = useRef<HTMLCanvasElement>(null);
  const samples = useRef<{ x: number; y: number }[]>([]);
  const glyph = useRef({ size: 0, y: 0 });

  useEffect(() => {
    if (phase === 'meet') {
      saySequence([{ en: `This is an Amharic letter. It says ${letter.sayLike}.` }, { clip: letter.clip }, { pause: 300 },
        { en: `It is the first sound in ${word.translit}.` }, { clip: word.clip }]);
    }
    if (phase === 'trace') saySequence([{ en: 'Now trace the letter with your finger. Paint it all in!' }]);
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // draw the guide letter and work out which points are inside it
  useEffect(() => {
    if (phase !== 'trace') return;
    let cancelled = false;
    const setup = async () => {
      try { await document.fonts.load(FONT(100), letter.char); } catch { /* use what's there */ }
      if (cancelled || !box.current || !guide.current || !paint.current) return;
      const size = box.current.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [guide.current, paint.current]) {
        c.width = size * dpr;
        c.height = size * dpr;
        c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const g = guide.current.getContext('2d')!;
      g.clearRect(0, 0, size, size);
      g.font = FONT(size * 0.8);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const m = g.measureText(letter.char);
      const y = size / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
      glyph.current = { size, y };
      g.fillStyle = '#FFE9A8';
      g.fillText(letter.char, size / 2, y);
      g.setLineDash([size * 0.02, size * 0.025]);
      g.lineWidth = size * 0.008;
      g.strokeStyle = '#E3A21A';
      g.strokeText(letter.char, size / 2, y);
      // sample the letter's pixels on a grid
      const data = g.getImageData(0, 0, g.canvas.width, g.canvas.height).data;
      const pts: { x: number; y: number }[] = [];
      const stepPx = Math.max(3, Math.round(size / 70));
      for (let py = 0; py < size; py += stepPx)
        for (let px = 0; px < size; px += stepPx) {
          const idx = (Math.round(py * dpr) * g.canvas.width + Math.round(px * dpr)) * 4;
          if (data[idx + 3] > 200) pts.push({ x: px, y: py });
        }
      samples.current = pts;
      paint.current.getContext('2d')!.clearRect(0, 0, size, size);
      setProgress(0);
    };
    setup();
    return () => { cancelled = true; };
  }, [phase, attempt, letter.char]);

  // painting
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hue = useRef(0);
  const pos = (e: React.PointerEvent) => {
    const r = paint.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const measure = () => {
    const c = paint.current!;
    const ctx = c.getContext('2d')!;
    const dpr = c.width / c.clientWidth;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const pts = samples.current;
    if (!pts.length) return 0;
    let hit = 0;
    for (const p of pts) if (data[(Math.round(p.y * dpr) * c.width + Math.round(p.x * dpr)) * 4 + 3] > 0) hit++;
    return hit / pts.length;
  };
  const stroke = (to: { x: number; y: number }) => {
    const c = paint.current!;
    const ctx = c.getContext('2d')!;
    const from = last.current ?? to;
    hue.current = (hue.current + 4) % 360;
    ctx.strokeStyle = `hsl(${hue.current} 85% 55%)`;
    ctx.lineWidth = c.clientWidth * 0.085;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x + 0.01, to.y);
    ctx.stroke();
    last.current = to;
  };
  const finishStroke = () => {
    drawing.current = false;
    last.current = null;
    if (phase !== 'trace') return;
    const p = measure();
    setProgress(p);
    if (p >= NEEDED) {
      setPhase('done');
      // paint the finished letter in gold, exactly over the guide
      const g = guide.current!.getContext('2d')!;
      const { size, y } = glyph.current;
      g.setLineDash([]);
      g.lineWidth = size * 0.02;
      g.strokeStyle = '#E09A00';
      g.fillStyle = '#FFC531';
      g.strokeText(letter.char, size / 2, y);
      g.fillText(letter.char, size / 2, y);
      sfx('yay');
      saySequence([{ en: 'Wow! Beautiful tracing!' }, { clip: letter.clip }, { en: `${letter.sayLike}, like in ${word.translit}!` }]);
    } else sfx('pop');
  };

  return (
    <div className="screen trace-screen">
      <h2 className="step-title">{phase === 'meet' ? 'A new letter!' : 'Trace the letter'}</h2>
      {phase === 'meet' ? (
        <div className="letter-meet pop-in">
          <button type="button" className="letter-big" onClick={() => playClip(letter.clip)}>{letter.char}</button>
          <div className="letter-says">says <b>“{letter.sayLike}”</b></div>
          <button type="button" className="letter-word" onClick={() => playClip(word.clip)}>
            <span><span className="hl">{word.am.slice(0, 1)}</span>{word.am.slice(1)}</span>
            <small>{word.translit} · {word.en}</small>
          </button>
          <RoundButton icon="next" label="Let's trace it" onClick={() => setPhase('trace')} size="l" color="green" pulse />
        </div>
      ) : (
        <>
          <div className="trace-layout">
          <div className={`trace-box ${phase === 'done' ? 'traced' : ''}`} ref={box}>
            <canvas ref={guide} className="trace-guide" />
            <canvas
              ref={paint}
              className="trace-paint"
              onPointerDown={(e) => { if (phase !== 'trace') return; drawing.current = true; (e.target as Element).setPointerCapture(e.pointerId); stroke(pos(e)); }}
              onPointerMove={(e) => { if (drawing.current) stroke(pos(e)); }}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
            />
          </div>
          <div className="trace-side">
            <div className="trace-bar"><i style={{ width: `${Math.min(100, (progress / NEEDED) * 100)}%` }} /></div>
            <div className="row-gap">
              <RoundButton icon="redo" label="Start again" onClick={() => { setPhase('trace'); setAttempt(attempt + 1); }} />
              {phase === 'done' && <RoundButton icon="next" label="Next" onClick={onDone} size="l" color="green" pulse />}
            </div>
          </div>
          </div>
          {phase === 'done' && <Confetti count={40} />}
        </>
      )}
    </div>
  );
}
