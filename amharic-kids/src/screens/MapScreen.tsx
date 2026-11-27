import { useEffect } from 'react';
import { lessons } from '../data/lessons/index.ts';
import { Picture } from '../art/Pictures.tsx';
import { Anbessa } from '../art/Anbessa.tsx';
import { Acacia, Daisy, Tukul } from '../art/Village.tsx';

/** Scenery along the sides of the path, one piece per stop */
function Decor({ kind }: { kind: number }) {
  return (
    <svg viewBox="-130 -240 260 260" className="decor-svg" aria-hidden="true">
      {kind % 3 === 0 && <Tukul x={0} y={0} s={1} />}
      {kind % 3 === 1 && <Acacia x={0} y={0} s={1} />}
      {kind % 3 === 2 && (<g><Daisy x={-60} y={0} s={2} /><Daisy x={0} y={-10} s={2.6} /><Daisy x={60} y={0} s={2} /></g>)}
    </svg>
  );
}
import { sfx, speak, stopAll } from '../audio/audio.ts';
import { useApp } from '../state.tsx';
import { Icon, RoundButton } from '../ui/ui.tsx';
import { N } from '../data/narration.ts';

/** The village path: one stop per lesson. Planned lessons show as "coming soon". */
export function MapScreen() {
  const { go, saved } = useApp();
  const unlocked = (i: number) => lessons[i].ready && (i === 0 || !!saved.completed[lessons[i - 1].id]);
  const currentIdx = lessons.findIndex((l, i) => unlocked(i) && !saved.completed[l.id]);
  const lastDone = lessons.reduce((acc, l, i) => (saved.completed[l.id] ? i : acc), 0);
  const lionAt = currentIdx >= 0 ? currentIdx : lastDone;

  useEffect(() => {
    speak(currentIdx === 0 && !saved.completed.l1 ? N.mapFirst : N.mapBack);
    return () => stopAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (i: number) => {
    const l = lessons[i];
    if (unlocked(i)) {
      sfx('pop');
      go({ name: 'lesson', id: l.id });
    } else {
      sfx('oops');
      speak(l.ready ? N.mapLocked : N.mapSoon(l));
    }
  };

  return (
    <div className="screen map-screen">
      <header className="top-bar">
        <RoundButton icon="home" label="Home" onClick={() => go({ name: 'home' })} />
        <h1>Anbessa’s Village</h1>
        <RoundButton icon="star" label="My stickers" onClick={() => go({ name: 'stickers' })} color="yellow" />
      </header>
      <div className="map-hills" aria-hidden="true" />
      <div className="map-decor" aria-hidden="true">
        {lessons.map((l, i) => (
          <div key={l.id} className={`decor ${i % 2 ? 'd-left' : 'd-right'}`} style={{ top: `${(i / lessons.length) * 100}%` }}><Decor kind={i} /></div>
        ))}
        {lessons.map((l, i) => (
          <div key={`b${l.id}`} className={`decor small ${i % 2 ? 'd-right' : 'd-left'}`} style={{ top: `${((i + 0.5) / lessons.length) * 100}%` }}><Decor kind={i + 2} /></div>
        ))}
      </div>
      <div className="map-path">
        <svg className="path-line" viewBox="0 0 100 800" preserveAspectRatio="none" aria-hidden="true">
          <path d={`M30 40 ${lessons.slice(1).map((_, i) => `S ${i % 2 ? 10 : 90} ${100 * i + 90}, ${i % 2 ? 30 : 70} ${100 * (i + 1) + 40}`).join(' ')}`}
            stroke="#E7C48A" strokeWidth={9} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={`M30 40 ${lessons.slice(1).map((_, i) => `S ${i % 2 ? 10 : 90} ${100 * i + 90}, ${i % 2 ? 30 : 70} ${100 * (i + 1) + 40}`).join(' ')}`}
            stroke="#fff" strokeWidth={3} strokeDasharray="2 12" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.8} />
        </svg>
        {lessons.map((l, i) => {
          const open_ = unlocked(i);
          const done = !!saved.completed[l.id];
          return (
            <div key={l.id} className={`stop ${i % 2 ? 'right' : 'left'}`} style={{ top: `${(i / lessons.length) * 100}%` }}>
              <button type="button" className={`stop-btn ${open_ ? 'open' : 'locked'} ${i === currentIdx ? 'current' : ''}`} onClick={() => open(i)}
                aria-label={`Lesson ${l.number}: ${l.title}${open_ ? '' : ' (coming soon)'}`}>
                <Picture k={l.icon} />
                <span className="stop-num">{l.number}</span>
                {!open_ && <span className="stop-lock"><Icon name="lock" /></span>}
                {done && <span className="stop-star"><Icon name="star" /></span>}
              </button>
              <div className="stop-label">
                <b>{l.title}</b>
                <span className="am">{l.amTitle}</span>
                {!l.ready && <em>coming soon</em>}
              </div>
              {i === lionAt && <div className="map-lion"><Anbessa pose={currentIdx >= 0 ? 'wave' : 'happy'} /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
