import { useEffect, useRef, useState } from 'react';
import { clips } from '../data/clips.ts';
import { lessons } from '../data/lessons/index.ts';
import type { Clip } from '../data/types.ts';
import { hasRecording, onRecordingsChange, playClip, refreshRecordings, stopAll } from '../audio/audio.ts';
import { deleteRecording, saveRecording, startRecording } from '../audio/recordings.ts';
import { useApp } from '../state.tsx';
import { Icon, RoundButton, Tibeb } from '../ui/ui.tsx';

function Toggle({ label, hint, on, set }: { label: string; hint?: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

function ClipRow({ clip, recordingId, setRecordingId, onError }: {
  clip: Clip; recordingId: string | null; setRecordingId: (id: string | null) => void; onError: (m: string) => void;
}) {
  const rec = useRef<{ stop: () => Promise<Blob> } | null>(null);
  const mine = hasRecording(clip.id);
  const isRec = recordingId === clip.id;

  const toggleRecord = async () => {
    if (isRec) {
      const blob = await rec.current!.stop();
      rec.current = null;
      setRecordingId(null);
      if (blob.size > 800) {
        await saveRecording({ id: clip.id, blob, type: blob.type, date: Date.now() });
        await refreshRecordings();
        playClip(clip.id, { which: 'mine' });
      } else onError('That recording was empty. Please try again and speak close to the microphone.');
      return;
    }
    if (recordingId) return;
    try {
      stopAll();
      rec.current = await startRecording();
      setRecordingId(clip.id);
    } catch {
      onError('The microphone could not be used. Please allow microphone access for this app in your browser or device settings.');
    }
  };

  return (
    <div className={`clip-row ${isRec ? 'recording' : ''}`}>
      <div className="clip-text">
        <span className="am">{clip.am}</span>
        <span className="tr">{clip.translit} · {clip.en}</span>
      </div>
      <div className="clip-actions">
        <button type="button" className="mini-btn" onClick={() => playClip(clip.id, { which: 'default' })} title="Play the built-in voice">
          <Icon name="play" /><span>Built-in</span>
        </button>
        {mine && (
          <button type="button" className="mini-btn mine" onClick={() => playClip(clip.id, { which: 'mine' })} title="Play your recording">
            <Icon name="play" /><span>Mine</span>
          </button>
        )}
        <button type="button" className={`mini-btn rec ${isRec ? 'on' : ''}`} onClick={toggleRecord} disabled={!!recordingId && !isRec}>
          <Icon name={isRec ? 'stop' : 'mic'} /><span>{isRec ? 'Stop' : mine ? 'Redo' : 'Record'}</span>
        </button>
        {mine && (
          <button type="button" className="mini-btn del" aria-label="Delete my recording"
            onClick={async () => { await deleteRecording(clip.id); await refreshRecordings(); }}>
            <Icon name="trash" />
          </button>
        )}
      </div>
    </div>
  );
}

export function Parents() {
  const { saved, update, reset, go } = useApp();
  const [, force] = useState(0);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => onRecordingsChange(() => force((n) => n + 1)), []);
  useEffect(() => () => stopAll(), []);
  const s = saved.settings;
  const setS = (patch: Partial<typeof s>) => update((x) => ({ ...x, settings: { ...x.settings, ...patch } }));
  const recordable = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  const mineCount = clips.filter((c) => hasRecording(c.id)).length;

  return (
    <div className="screen parents-screen">
      <header className="top-bar">
        <RoundButton icon="back" label="Back" onClick={() => go({ name: 'home' })} />
        <h1>Grown-ups’ corner</h1>
        <span />
      </header>
      <div className="parents-body">
        <section className="panel">
          <h2>Your child</h2>
          <label className="field">
            <span>Name used in the story</span>
            <input value={saved.childName} maxLength={24} placeholder="friend"
              onChange={(e) => update((x) => ({ ...x, childName: e.target.value, setupDone: true }))} />
          </label>
          <div className="progress-list">
            {lessons.filter((l) => l.ready).map((l) => (
              <div key={l.id}>
                Lesson {l.number}, {l.title}: {saved.completed[l.id] ? <b>finished {saved.completed[l.id].times}×</b> : 'not finished yet'}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Sound</h2>
          <Toggle label="Read the story aloud" hint="English narration with your device's voice" on={s.narration} set={(v) => setS({ narration: v })} />
          <Toggle label="Sound effects" on={s.sounds} set={(v) => setS({ sounds: v })} />
          <Toggle label="Use my recordings" hint={`When on, your recordings replace the built-in voice (${mineCount} recorded)`} on={s.useRecordings} set={(v) => setS({ useRecordings: v })} />
        </section>

        <section className="panel">
          <h2>Amharic voice</h2>
          <p>
            Every Amharic word comes with a <b>built-in computer voice</b>, so the app works straight away. It is understandable but robotic.
            If you, a relative or a friend speaks Amharic, you can <b>record your own voice</b> for any word. Your child will then hear a real person,
            which is much better for learning. Recordings stay on this device.
          </p>
          {!recordable && <p className="warn">Recording isn’t available in this browser. Try Safari or Chrome on a recent phone or tablet.</p>}
          {error && <p className="warn" onClick={() => setError('')}>{error}</p>}
          <p className="small">Tap <b>Record</b>, say the word clearly, then tap <b>Stop</b>. You will hear it played back.</p>
          {recordable && clips.map((c) => (
            <ClipRow key={c.id} clip={c} recordingId={recordingId} setRecordingId={setRecordingId} onError={setError} />
          ))}
        </section>

        <section className="panel">
          <h2>Tips</h2>
          <ul className="tips">
            <li>Short and often works best: one lesson, then replay the story another day.</li>
            <li>Say <b>ሰላም</b> (selam) and <b>ቻው</b> (chaw) to your child at home. Hearing words in real life makes them stick.</li>
            <li>To install the app: in Safari tap <b>Share → Add to Home Screen</b>; in Chrome tap <b>⋮ → Install app</b>. It then works offline.</li>
          </ul>
        </section>

        <section className="panel">
          <h2>Start over</h2>
          {confirmReset ? (
            <div className="row-gap">
              <button type="button" className="big-pill red" onClick={() => { reset(); setConfirmReset(false); }}>Yes, erase progress</button>
              <button type="button" className="big-pill grey" onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          ) : (
            <button type="button" className="big-pill grey" onClick={() => setConfirmReset(true)}>Reset progress and stickers</button>
          )}
          <p className="small">Recordings are kept when you reset.</p>
        </section>
        <Tibeb />
      </div>
    </div>
  );
}
