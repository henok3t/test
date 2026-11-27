import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { setAudioSettings, type AudioSettings } from './audio/audio.ts';

export interface Saved {
  childName: string;
  setupDone: boolean;
  completed: Record<string, { date: number; times: number }>;
  stickers: string[];
  settings: AudioSettings;
}

const KEY = 'selam-anbessa.v1';
const fresh = (): Saved => ({
  childName: '',
  setupDone: false,
  completed: {},
  stickers: [],
  settings: { narration: true, sounds: true, useRecordings: true },
});

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = { ...fresh(), ...JSON.parse(raw) } as Saved;
      s.settings = { ...fresh().settings, ...s.settings };
      return s;
    }
  } catch { /* private mode etc. */ }
  return fresh();
}

/** Deep links for testing and sharing: #/map, #/stickers, #/lesson/l1 or #/lesson/l1/3 (step index) */
function fromHash(): Screen {
  const [, a, b, c] = location.hash.split('/');
  if (a === 'map' || a === 'stickers' || a === 'setup') return { name: a };
  if (a === 'lesson' && b) return { name: 'lesson', id: b, step: Number(c) || 0 };
  return { name: 'home' };
}

export type Screen =
  | { name: 'home' }
  | { name: 'setup' }
  | { name: 'map' }
  | { name: 'lesson'; id: string; step?: number }
  | { name: 'stickers' }
  | { name: 'parents' };

interface Ctx {
  saved: Saved;
  update: (fn: (s: Saved) => Saved) => void;
  reset: () => void;
  screen: Screen;
  go: (s: Screen) => void;
  /** The child's name, or "friend" if none was entered */
  name: string;
}

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState(load);
  const [screen, setScreen] = useState<Screen>(fromHash);

  useEffect(() => {
    setAudioSettings(saved.settings);
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* full or blocked */ }
  }, [saved]);

  const update = useCallback((fn: (s: Saved) => Saved) => setSaved((s) => fn(s)), []);
  const reset = useCallback(() => setSaved({ ...fresh(), settings: saved.settings }), [saved.settings]);
  const go = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo(0, 0);
  }, []);

  const name = saved.childName.trim() || 'friend';
  return <AppCtx.Provider value={{ saved, update, reset, screen, go, name }}>{children}</AppCtx.Provider>;
}

export function completeLesson(s: Saved, lessonId: string, sticker?: string): Saved {
  const prev = s.completed[lessonId];
  return {
    ...s,
    completed: { ...s.completed, [lessonId]: { date: Date.now(), times: (prev?.times ?? 0) + 1 } },
    stickers: sticker && !s.stickers.includes(sticker) ? [...s.stickers, sticker] : s.stickers,
  };
}
