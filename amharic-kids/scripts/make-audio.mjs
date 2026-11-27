// Generates the default Amharic voice: public/audio/<clip>.mp3 for every clip in src/data/clips.ts.
// Uses espeak-ng's Amharic voice (apt-get install espeak-ng) and ffmpeg.
// This is a computer voice: grown-ups can replace any clip with a real recording inside the app,
// or drop a native-speaker recording into public/audio/<clip>.mp3 and skip regenerating it.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { clips } from '../src/data/clips.ts';

const out = new URL('../public/audio/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const force = process.argv.includes('--force');
const tmp = join(tmpdir(), `selam-audio-${process.pid}.wav`);

for (const clip of clips) {
  const dest = join(out, `${clip.id}.mp3`);
  if (existsSync(dest) && !force) { console.log('keep ', clip.id); continue; }
  // f2 = a softer, higher voice variant; slow speed for young learners
  execFileSync('espeak-ng', ['-v', 'am+f2', '-s', '115', '-p', '58', '-g', '4', '-w', tmp, clip.tts ?? clip.am]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp,
    '-af', 'adelay=80,apad=pad_dur=0.15,loudnorm=I=-16:TP=-1.5,aresample=44100',
    '-ac', '1', '-b:a', '64k', dest]);
  console.log('made ', clip.id);
}
rmSync(tmp, { force: true });
