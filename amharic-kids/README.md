# Selam, Anbessa! – Amharic for kids

A story app that teaches young children (about 4–8) their first Amharic words, assuming they know none.
Anbessa (አንበሳ, "lion") the lion cub and Tota (ጦጣ, "monkey") live in a highland village. Each lesson is a chapter of their story.
The app works on phones and tablets in portrait or landscape. It can be installed to the home screen and works offline after the first visit.

## Lesson 1 – ሰላም (Selam!)

| Amharic | Say it like | Meaning |
|---|---|---|
| ሰላም | seh-LAHM | Hello |
| ስሜ ___ ነው | sih-MEH ___ NEH-oo | My name is ___ |
| አመሰግናለሁ | ah-meh-seh-gih-NAH-leh-hoo | Thank you |
| ቻው | CHOW | Bye! |

Letter of the lesson: **ሰ** ("seh"), the first sound of ሰላም.

Every lesson runs in the same order:

1. **Story**: an animated, narrated scene. The child taps big buttons to "say" the words back to the characters, and the story uses the child's name.
2. **Meet the words**: picture cards with sound, a slow-speed button, the sound-it-out spelling and the meaning.
3. **Listen and tap**: hear a word, then tap its picture.
4. **Help Anbessa**: pick what Anbessa should say in a little scene.
5. **Match**: pair pictures with words. Tapping a word always plays it, so children who can't read yet match by sound.
6. **Trace**: meet one fidel letter, then paint over it with a finger.
7. **Reward**: confetti, a sticker for the sticker book, and the next stop on the village map.

There are no timers and no lives. A wrong answer gets a wiggle and another try.

## Voices

- **Amharic, default:** bundled clips made with espeak-ng's Amharic voice (`npm run audio`). They're understandable but robotic.
- **Amharic, recorded:** in the **Grown-ups' corner** (on the home screen, press and hold *Grown-ups*), a parent or relative can record any word. Recordings stay on the device (IndexedDB) and replace the built-in voice while *Use my recordings* is on.
  - To ship real native-speaker audio for everyone, drop `<clip-id>.mp3` files into `public/audio/` (`npm run audio` doesn't overwrite existing files unless you pass `--force`).
- **English narration:** the device's own voice (speechSynthesis). It can be turned off, and the story still works with no voice available.

## Run it

```
npm install
npm run dev        # development server (add --host to try it on a phone on the same Wi-Fi)
npm run build      # type-check, build to dist/, generate the offline service worker
npm run preview    # serve dist/
```

`dist/` is a static site. Put it on any web host (GitHub Pages, Netlify, …) and open it in Safari or Chrome.
Then choose **Add to Home Screen** to install it.

## Adding a lesson

1. Add the new Amharic phrases to `src/data/clips.ts` and run `npm run audio` (needs `espeak-ng` and `ffmpeg`).
2. Copy `src/data/lessons/lesson1.ts` to `lessonN.ts`. Write the words, the story beats (`say` = a character speaks a clip, `childSays` = the child's tap-to-say button, `cast` = character poses, `bg` = day/sunset/night), and choose which game steps to include.
3. In `src/data/lessons/index.ts`, replace the `planned(N, …)` entry with your lesson. It unlocks on the map once the previous lesson is finished.
4. If the lesson needs new pictures or a sticker, add them in `src/art/Pictures.tsx`.

Planned so far: 2 My Family · 3 One, Two, Three · 4 Colours · 5 Animals · 6 Yummy Food · 7 My Body · 8 Count to Ten.

Deep links help while writing a lesson: `#/lesson/l1/3` opens lesson 1 at step 3; `#/map` and `#/stickers` also work.

## Layout

- `src/data/` – lesson content (`types.ts` explains every field), the clip list
- `src/art/` – all illustrations as SVG components: Anbessa, Tota, the village, word pictures, stickers
- `src/games/` – the story player and the mini-games
- `src/screens/` – home, first-run setup, village map, sticker book, Grown-ups' corner, lesson player
- `src/audio/` – clip playback (Web Audio), English narration, sound effects, microphone recordings
- `scripts/` – audio generator, icon renderer, service-worker generator

## Tests

These need `playwright` and a fresh `npm run build`.

- `npm test` (`tests/playthrough.mjs`) plays Lesson 1 from the first screen to the sticker at iPhone and iPad sizes, in portrait and landscape. It uses only taps and finger drags, and fails on any page error. Add `--shots=DIR` to save a screenshot of every step.
- `node tests/recording.mjs` records a word with a fake microphone, then checks that the recording is saved, survives a reload, and can be deleted.

## Before children use it

The Amharic content and the sound-it-out spellings should be checked by a native speaker,
and real recordings are much better than the built-in computer voice.
