import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { sfx } from '../audio/audio.ts';

export type IconName = 'speaker' | 'next' | 'back' | 'home' | 'close' | 'star' | 'check' | 'turtle' | 'mic' | 'stop' | 'play' | 'trash' | 'lock' | 'gear' | 'book' | 'redo';

export function Icon({ name }: { name: IconName }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 3.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 32 32" className="icon" aria-hidden="true">
      {name === 'speaker' && (<g {...p}><path d="M5 12h5l7-6v20l-7-6H5z" fill="currentColor" /><path d="M21 11q4 5 0 10M24.5 7.5q7 8.5 0 17" /></g>)}
      {name === 'next' && <path {...p} strokeWidth={4} d="M8 16h16M17 8l8 8-8 8" />}
      {name === 'back' && <path {...p} strokeWidth={4} d="M24 16H8M15 8l-8 8 8 8" />}
      {name === 'home' && <path {...p} d="M5 15L16 5l11 10M8 13v13h6v-7h4v7h6V13" />}
      {name === 'close' && <path {...p} strokeWidth={4} d="M8 8l16 16M24 8L8 24" />}
      {name === 'check' && <path {...p} strokeWidth={4.5} d="M6 17l7 7L26 9" />}
      {name === 'star' && <path d="M16 3l3.9 8.2 9 1.1-6.6 6.2 1.7 8.9L16 23l-8 4.4 1.7-8.9L3.1 12.3l9-1.1z" fill="currentColor" />}
      {name === 'turtle' && (<g><path d="M4 21q0-11 11-11t11 11z" fill="currentColor" /><circle cx={28} cy={18.5} r={3.2} fill="currentColor" /><path d="M8 21l-1 4M21 21l1 4" {...p} /><path d="M10 20l3-6h4l3 6" fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.6} /></g>)}
      {name === 'mic' && (<g {...p}><rect x={11} y={4} width={10} height={16} rx={5} fill="currentColor" /><path d="M7 15q0 9 9 9t9-9M16 24v4" /></g>)}
      {name === 'stop' && <rect x={8} y={8} width={16} height={16} rx={3} fill="currentColor" />}
      {name === 'play' && <path d="M10 6l16 10-16 10z" fill="currentColor" />}
      {name === 'trash' && <path {...p} d="M6 9h20M13 9V5h6v4M8 9l1.5 18h13L24 9" />}
      {name === 'lock' && (<g {...p}><rect x={7} y={14} width={18} height={13} rx={3} fill="currentColor" /><path d="M11 14v-4q0-5 5-5t5 5v4" /></g>)}
      {name === 'gear' && (<g {...p}><circle cx={16} cy={16} r={4.5} /><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8" /></g>)}
      {name === 'book' && (<g {...p}><path d="M4 7q6-2 12 1v19q-6-3-12-1zM28 7q-6-2-12 1v19q6-3 12-1z" /></g>)}
      {name === 'redo' && <path {...p} d="M25 13A10 10 0 1 0 26 20M25 5v8h-8" />}
    </svg>
  );
}

export function RoundButton({ icon, label, onClick, color = 'white', size = 'm', className = '', pulse, disabled }: {
  icon: IconName; label: string; onClick: () => void; color?: string; size?: 's' | 'm' | 'l'; className?: string; pulse?: boolean; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`round-btn rb-${size} c-${color} ${pulse ? 'pulse' : ''} ${className}`}
      aria-label={label}
      disabled={disabled}
      onClick={() => { sfx('tap'); onClick(); }}
    >
      <Icon name={icon} />
    </button>
  );
}

/** Green-yellow-red woven border, like the tibeb on a netela */
export function Tibeb({ className = '' }: { className?: string }) {
  return <div className={`tibeb ${className}`} aria-hidden="true" />;
}

export function Confetti({ count = 60 }: { count?: number }) {
  const bits = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 1.8 + Math.random() * 1.6,
      color: ['#E8453C', '#FFC531', '#2FA05A', '#3A8FD6', '#FF8AC2', '#A65BD6'][i % 6],
      rot: Math.random() * 360,
      w: 8 + Math.random() * 8,
      round: i % 3 === 0,
    })),
    [count],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{ left: `${b.left}%`, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, background: b.color,
          width: b.w, height: b.round ? b.w : b.w * 1.6, borderRadius: b.round ? '50%' : 3, transform: `rotate(${b.rot}deg)` }} />
      ))}
    </div>
  );
}

/** Little burst of stars, e.g. around a correct answer */
export function Sparkles() {
  return (
    <div className="sparkles" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} style={{ ['--a' as string]: `${i * 45}deg` }}><Icon name="star" /></span>
      ))}
    </div>
  );
}

/** A button that only fires after being held: keeps little fingers out of grown-up settings. */
export function HoldButton({ children, onDone, ms = 1800, className = '' }: { children: ReactNode; onDone: () => void; ms?: number; className?: string }) {
  const [p, setP] = useState(0);
  const t = useRef<number>(0);
  const start = useRef(0);
  const stop = () => { cancelAnimationFrame(t.current); setP(0); };
  const tick = () => {
    const v = Math.min(1, (performance.now() - start.current) / ms);
    setP(v);
    if (v >= 1) { stop(); onDone(); } else t.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(t.current), []);
  return (
    <button
      type="button"
      className={`hold-btn ${className}`}
      style={{ ['--p' as string]: p }}
      onPointerDown={(e) => { e.preventDefault(); start.current = performance.now(); t.current = requestAnimationFrame(tick); }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="hold-ring" />
      {children}
    </button>
  );
}

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
