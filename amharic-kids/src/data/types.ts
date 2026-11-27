// The shape of lesson content. Adding a lesson = writing one file that exports a `Lesson`.

/** One piece of Amharic audio. Each clip has a generated default voice and can be re-recorded by a grown-up. */
export interface Clip {
  id: string;
  /** Amharic text in fidel */
  am: string;
  /** Simple romanisation, e.g. "selam" */
  translit: string;
  /** English meaning */
  en: string;
  /** Text fed to the speech synthesiser if it differs from `am` */
  tts?: string;
}

export type PictureKey =
  | 'hello'
  | 'myname'
  | 'thanks'
  | 'bye'
  | 'orange'
  | 'family'
  | 'numbers'
  | 'colors'
  | 'animals'
  | 'food'
  | 'body'
  | 'count10';

export interface Word {
  id: string;
  /** Amharic text shown on cards. Use ___ for a gap the child fills (e.g. their name). */
  am: string;
  translit: string;
  /** English-reader pronunciation guide, e.g. "seh-LAHM" (CAPS = stressed) */
  sayLike: string;
  en: string;
  picture: PictureKey;
  /** Clip played for the word */
  clip: string;
  /** Sentence the narrator reads when the card is shown */
  explain: string;
}

export type CharacterId = 'anbessa' | 'tota';
export type Pose = 'idle' | 'wave' | 'happy' | 'talk' | 'give' | 'hidden';
export type SceneBackground = 'day' | 'sunset' | 'night';

/** One beat of a story scene. Beats play in order; the child taps to continue. */
export interface Beat {
  bg?: SceneBackground;
  /** Pose for each character on stage. Characters not listed keep their previous pose. */
  cast?: Partial<Record<CharacterId, Pose>>;
  /** Who is speaking Amharic in this beat (shows the speech bubble on them) */
  speaker?: CharacterId;
  /** Amharic line: a clip id, plays first */
  say?: string;
  /** English narration, read aloud after the Amharic line */
  narrate: string;
  /**
   * Interactive beat: the child taps a big button to "say" the phrase.
   * `clips` play in sequence; the literal token "$name" speaks the child's name.
   */
  childSays?: { label: string; clips: string[]; react: Partial<Record<CharacterId, Pose>> };
}

export interface Situation {
  narrate: string;
  scene: 'arrive' | 'gift' | 'night' | 'name';
  answer: string; // word id
  options: string[]; // word ids
}

export type Step =
  | { type: 'story'; title: string; beats: Beat[] }
  | { type: 'cards'; words: string[] }
  | { type: 'listen'; words: string[]; rounds: number }
  | { type: 'choose'; situations: Situation[] }
  | { type: 'match'; words: string[] }
  | { type: 'trace' }
  | { type: 'reward' };

export interface Letter {
  char: string;
  translit: string;
  sayLike: string;
  clip: string;
  /** A lesson word that starts with this letter */
  fromWord: string;
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  amTitle: string;
  subtitle: string;
  icon: PictureKey;
  /** When false the lesson shows on the map as "coming soon" */
  ready: boolean;
  words: Word[];
  letter?: Letter;
  steps: Step[];
  sticker?: { id: string; label: string };
}
