import type { Lesson, PictureKey } from '../types.ts';
import { lesson1 } from './lesson1.ts';

/** A lesson that is planned but not written yet: shown on the map as "coming soon". */
function planned(number: number, title: string, amTitle: string, subtitle: string, icon: PictureKey): Lesson {
  return { id: `l${number}`, number, title, amTitle, subtitle, icon, ready: false, words: [], steps: [] };
}

// To add a lesson: write lessonN.ts next to lesson1.ts, add its clips to clips.ts,
// run `npm run audio`, and swap the planned() entry below for the real lesson.
export const lessons: Lesson[] = [
  lesson1,
  planned(2, 'My Family', 'ቤተሰብ', 'Mom, Dad and me', 'family'),
  planned(3, 'One, Two, Three', 'ቁጥሮች', 'Counting oranges at the market', 'numbers'),
  planned(4, 'Colours', 'ቀለማት', 'The colours of the village', 'colors'),
  planned(5, 'Animals', 'እንስሳት', 'Anbessa’s animal friends', 'animals'),
  planned(6, 'Yummy Food', 'ምግብ', 'Injera, bread and coffee', 'food'),
  planned(7, 'My Body', 'ሰውነቴ', 'Head, hands and feet', 'body'),
  planned(8, 'Count to Ten', 'እስከ አስር', 'Bigger numbers', 'count10'),
];

export const lessonById = new Map(lessons.map((l) => [l.id, l]));
