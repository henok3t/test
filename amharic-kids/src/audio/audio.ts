// Sound for the whole app:
//  - Amharic clips: the grown-up's recording if there is one (and recordings are on), else the bundled voice
//  - English narration: the device's own English voice (speechSynthesis)
//  - Sound effects: synthesised with Web Audio, no files needed
import { getAllRecordings, type Recording } from './recordings.ts';

export interface AudioSettings {
  narration: boolean;
  sounds: boolean;
  useRecordings: boolean;
}

let settings: AudioSettings = { narration: true, sounds: true, useRecordings: true };
export const setAudioSettings = (s: AudioSettings) => (settings = s);

let ctx: AudioContext | null = null;
const getCtx = () => {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
};

/** Call from the first tap: browsers (iOS especially) only allow sound after a user gesture. */
export function unlockAudio() {
  const c = getCtx();
  if (c.state !== 'running') c.resume().catch(() => {});
  const b = c.createBuffer(1, 1, 22050);
  const s = c.createBufferSource();
  s.buffer = b;
  s.connect(c.destination);
  s.start(0);
  if ('speechSynthesis' in window && !unlockedSpeech) {
    unlockedSpeech = true;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}
let unlockedSpeech = false;

// ---------- recordings ----------
let recordings = new Map<string, Recording>();
const listeners = new Set<() => void>();
export async function refreshRecordings() {
  recordings = new Map((await getAllRecordings()).map((r) => [r.id, r]));
  for (const k of [...buffers.keys()]) if (k.startsWith('mine:')) buffers.delete(k);
  listeners.forEach((l) => l());
}
export const hasRecording = (id: string) => recordings.has(id);
export function onRecordingsChange(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

// ---------- clips ----------
const buffers = new Map<string, Promise<AudioBuffer>>();
const base = import.meta.env.BASE_URL;

function decode(data: ArrayBuffer): Promise<AudioBuffer> {
  // callback form for older Safari
  return new Promise((resolve, reject) => getCtx().decodeAudioData(data, resolve, reject));
}

function loadBuffer(id: string, which: 'mine' | 'default'): Promise<AudioBuffer> {
  const key = `${which}:${id}`;
  let p = buffers.get(key);
  if (!p) {
    p =
      which === 'mine'
        ? recordings.get(id)!.blob.arrayBuffer().then(decode)
        : fetch(`${base}audio/${id}.mp3`).then((r) => {
            if (!r.ok) throw new Error(`missing audio ${id}`);
            return r.arrayBuffer().then(decode);
          });
    p.catch(() => buffers.delete(key));
    buffers.set(key, p);
  }
  return p;
}

/** Warm the cache so the first tap plays instantly. */
export function preloadClips(ids: string[]) {
  for (const id of ids) loadBuffer(id, recordings.has(id) && settings.useRecordings ? 'mine' : 'default').catch(() => {});
}

let generation = 0;
let current: AudioBufferSourceNode | null = null;

/** Stop whatever is playing or queued. */
export function stopAll() {
  generation++;
  try { current?.stop(); } catch { /* already stopped */ }
  current = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export async function playClip(id: string, opts: { which?: 'mine' | 'default'; rate?: number; gen?: number } = {}) {
  const gen = opts.gen ?? generation;
  const which = opts.which ?? (settings.useRecordings && recordings.has(id) ? 'mine' : 'default');
  let buf: AudioBuffer;
  try {
    buf = await loadBuffer(id, which);
  } catch {
    if (which === 'mine') return playClip(id, { ...opts, which: 'default' });
    return;
  }
  if (gen !== generation) return;
  const c = getCtx();
  if (c.state !== 'running') await c.resume().catch(() => {});
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = opts.rate ?? 1;
  const gain = c.createGain();
  gain.gain.value = which === 'mine' ? 1.4 : 1;
  src.connect(gain).connect(c.destination);
  current = src;
  await new Promise<void>((resolve) => {
    src.onended = () => resolve();
    // safety net in case onended never fires
    setTimeout(resolve, (buf.duration / (opts.rate ?? 1)) * 1000 + 400);
    src.start();
  });
  if (current === src) current = null;
}

// ---------- English voice ----------
let voice: SpeechSynthesisVoice | null | undefined;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
  if (!vs.length) return null;
  const liked = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Google US English', 'Google UK English Female', 'Microsoft Aria', 'Microsoft Jenny', 'Female'];
  for (const name of liked) {
    const v = vs.find((x) => x.name.includes(name));
    if (v) return v;
  }
  return vs.find((v) => v.localService) ?? vs[0];
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => (voice = pickVoice());

export function speak(text: string, opts: { force?: boolean; gen?: number } = {}): Promise<void> {
  const gen = opts.gen ?? generation;
  if ((!settings.narration && !opts.force) || !('speechSynthesis' in window) || gen !== generation) return Promise.resolve();
  if (voice === undefined) voice = pickVoice();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? 'en-US';
    u.rate = 0.92;
    u.pitch = 1.1;
    let done = false;
    const finish = () => {
      if (!done) { done = true; resolve(); }
    };
    u.onend = finish;
    u.onerror = finish;
    // Some browsers never fire onend (or have no voices at all); don't hang the story.
    setTimeout(finish, 1200 + text.split(/\s+/).length * 450);
    speechSynthesis.speak(u);
  });
}

export type SayItem = { clip: string } | { en: string; force?: boolean } | { pause: number };

/** Play a sequence of clips / narration. Starting a new sequence cancels the old one. */
export async function saySequence(items: SayItem[]) {
  stopAll();
  const gen = generation;
  for (const it of items) {
    if (gen !== generation) return false;
    if ('clip' in it) await playClip(it.clip, { gen });
    else if ('en' in it) await speak(it.en, { gen, force: it.force });
    else await new Promise((r) => setTimeout(r, it.pause));
  }
  return gen === generation;
}

// ---------- sound effects ----------
type Sfx = 'pop' | 'ding' | 'yay' | 'oops' | 'whoosh' | 'tap' | 'sparkle';

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, slideTo?: number) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

export function sfx(name: Sfx) {
  if (!settings.sounds) return;
  try {
    switch (name) {
      case 'tap': tone(660, 0, 0.08, 'triangle', 0.12); break;
      case 'pop': tone(420, 0, 0.12, 'sine', 0.2, 900); break;
      case 'ding': tone(1046, 0, 0.35, 'sine', 0.16); tone(1568, 0.08, 0.4, 'sine', 0.1); break;
      case 'yay': [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.14)); break;
      case 'oops': tone(300, 0, 0.18, 'sine', 0.14, 220); tone(260, 0.16, 0.22, 'sine', 0.12, 190); break;
      case 'whoosh': tone(200, 0, 0.35, 'sawtooth', 0.04, 1200); break;
      case 'sparkle': [1318, 1760, 2093, 2637].forEach((f, i) => tone(f, i * 0.06, 0.25, 'sine', 0.07)); break;
    }
  } catch { /* audio not available */ }
}
