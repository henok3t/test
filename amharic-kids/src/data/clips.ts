import type { Clip } from './types.ts';

// Every Amharic sound in the app. `npm run audio` turns each into public/audio/<id>.mp3,
// and grown-ups can replace any of them with their own recording in the Grown-ups corner.
export const clips: Clip[] = [
  // Lesson 1 – Selam!
  { id: 'selam', am: 'ሰላም', translit: 'selam', en: 'Hello' },
  { id: 'sime', am: 'ስሜ', translit: 'sime', en: 'My name (is)' },
  { id: 'new', am: 'ነው', translit: 'new', en: '(is) – ends the sentence' },
  { id: 'sime-anbessa-new', am: 'ስሜ አንበሳ ነው', translit: 'sime Anbessa new', en: 'My name is Anbessa' },
  { id: 'sime-tota-new', am: 'ስሜ ጦጣ ነው', translit: 'sime Tota new', en: 'My name is Tota' },
  { id: 'amesegnalehu', am: 'አመሰግናለሁ', translit: 'amesegnalehu', en: 'Thank you' },
  { id: 'chaw', am: 'ቻው', translit: 'chaw', en: 'Bye!' },
  { id: 'anbessa', am: 'አንበሳ', translit: 'anbessa', en: 'Lion' },
  { id: 'tota', am: 'ጦጣ', translit: 'tota', en: 'Monkey' },
  { id: 'birtukan', am: 'ብርቱካን', translit: 'birtukan', en: 'Orange' },
  { id: 'letter-se', am: 'ሰ', translit: 'se', en: 'The letter “se”' },
];

export const clipById = new Map(clips.map((c) => [c.id, c]));
