import type { Lesson, Letter, Word } from './types.ts';

// Every English sentence the app reads aloud. Narration comes from pre-recorded voice files
// (scripts/make-voice.mjs), so a sentence can only be spoken naturally if it is listed here
// or in the lesson data. Keep the child's name out of these: the recordings are shared by every child.

/** In "My name is ___", the gap is Anbessa's name when he is the one speaking. */
export const fillEn = (s: string) => s.replace('___', 'Anbessa');

export const N = {
  homeHello: 'Selam! I am Anbessa. Let’s play!',
  homeAgain: 'Selam! Let’s play!',
  mapFirst: 'Tap the first stop to start your adventure!',
  mapBack: 'Welcome back! Where shall we go?',
  mapLocked: 'Finish the stop before this one first!',
  mapSoon: (l: Lesson) => `${l.title} is coming soon!`,
  stickerHave: (l: Lesson) => `${l.title}! You earned this one.`,
  stickerMissing: (l: Lesson) => `Finish lesson ${l.number} to get this sticker.`,
  praise: ['Yay!', 'Wonderful!', 'Great job!', 'You did it!'],
  sayIt: 'Now you say it!',
  listenIntro: 'Listen carefully! Tap the picture that matches.',
  listenYes: (w: Word) => `Yes! ${w.en}!`,
  listenOops: 'Oops! Listen again.',
  chooseRight: (w: Word) => `That’s right! ${fillEn(w.en)}!`,
  chooseWrong: (w: Word) => `Hmm, ${fillEn(w.translit)} means ${fillEn(w.en)}. Try another one!`,
  matchIntro: 'Match each picture with its Amharic word. Tap a word to hear it!',
  matchDone: 'You matched them all!',
  letterMeet: (l: Letter) => `This is an Amharic letter. It says ${l.sayLike}.`,
  letterFrom: (w: Word) => `It is the first sound in ${w.translit}.`,
  traceGo: 'Now trace the letter with your finger. Paint it all in!',
  traceWow: 'Wow! Beautiful tracing!',
  traceDone: (l: Letter, w: Word) => `${l.sayLike}, like in ${w.translit}!`,
  rewardDone: (l: Lesson) => `Amazing! You finished lesson ${l.number}, and you earned a sticker!`,
  rewardWords: (l: Lesson) => `You know ${l.words.length} Amharic words now. Tap them to hear them again.`,
};

/** All sentences the app can say, for the voice generator and for the coverage check in tests. */
export function allLines(lessons: Lesson[]): string[] {
  const out = new Set<string>();
  const add = (s: string) => out.add(s);
  for (const v of Object.values(N)) {
    if (typeof v === 'string') add(v);
    if (Array.isArray(v)) v.forEach(add);
  }
  for (const l of lessons) {
    add(N.mapSoon(l));
    add(N.stickerHave(l));
    add(N.stickerMissing(l));
    if (!l.ready) continue;
    add(N.rewardDone(l));
    add(N.rewardWords(l));
    for (const w of l.words) {
      add(w.explain);
      add(N.listenYes(w));
      add(N.chooseRight(w));
      add(N.chooseWrong(w));
    }
    for (const s of l.steps) {
      if (s.type === 'story') s.beats.forEach((b) => add(b.narrate));
      if (s.type === 'choose') s.situations.forEach((x) => add(x.narrate));
    }
    if (l.letter) {
      const w = l.words.find((x) => x.id === l.letter!.fromWord)!;
      add(N.letterMeet(l.letter));
      add(N.letterFrom(w));
      add(N.traceDone(l.letter, w));
    }
  }
  return [...out];
}
