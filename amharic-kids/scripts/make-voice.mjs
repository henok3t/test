// Generates the app's voices with Gemini text-to-speech:
//   - English narration  -> public/voice/en/<hash>.mp3, listed in public/voice/en.json
//   - Amharic words       -> public/audio/<clip>.mp3 (replacing the espeak-ng voice), listed in public/audio/voices.json
//
//   GEMINI_API_KEY=... node scripts/make-voice.mjs            generate anything missing or changed
//   GEMINI_API_KEY=... node scripts/make-voice.mjs --force    regenerate everything
//   GEMINI_API_KEY=... node scripts/make-voice.mjs --verify   transcribe the Amharic clips back and compare
//   node scripts/make-voice.mjs --list                        print the sentences (no key needed)
//
// Options (env): GEMINI_TTS_MODEL, GEMINI_TEXT_MODEL, NARRATOR_VOICE, AMHARIC_VOICE.
// Needs ffmpeg. Clips a grown-up records in the app still take priority over these files.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { clips } from '../src/data/clips.ts';
import { lessons } from '../src/data/lessons/index.ts';
import { allLines } from '../src/data/narration.ts';

const root = new URL('..', import.meta.url).pathname;
const args = new Set(process.argv.slice(2));
const TTS_MODEL = process.env.GEMINI_TTS_MODEL ?? 'gemini-3.8-flash-tts';
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? 'gemini-flash-latest';
const NARRATOR = process.env.NARRATOR_VOICE ?? 'Sulafat'; // warm
const AMHARIC = process.env.AMHARIC_VOICE ?? 'Achird'; // friendly
const KEY = process.env.GEMINI_API_KEY;
const API = 'https://generativelanguage.googleapis.com/v1beta/models';

const AMHARIC_WORDS = 'Selam, Sime, new, Amesegnalehu, Chaw, Anbessa, Tota';
const enPrompt = (t) =>
  `Read this aloud warmly and cheerfully, like a kind storyteller reading a picture book to a five-year-old. ` +
  `Speak clearly and not too fast. The words ${AMHARIC_WORDS} are Amharic: pronounce them the Ethiopian Amharic way.\n\n${t}`;
const amPrompt = (c) =>
  `Say this Amharic slowly and clearly, the way a friendly Ethiopian teacher says it to a young child who is learning: ${c.tts ?? c.am}`;

const lines = allLines(lessons);
if (args.has('--list')) { lines.forEach((l) => console.log(l)); console.log(`\n${lines.length} sentences, ${clips.length} Amharic clips`); process.exit(0); }
if (!KEY) { console.error('Set GEMINI_API_KEY (an API key from https://aistudio.google.com/apikey).'); process.exit(1); }

const sha = (s) => createHash('sha1').update(s).digest('hex').slice(0, 12);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(model, body) {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(`${API}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify(body),
    });
    if (r.ok) return r.json();
    const text = await r.text();
    if ((r.status === 429 || r.status >= 500) && attempt < 6) { await sleep(2000 * 2 ** attempt); continue; }
    if (r.status === 404) {
      const list = await fetch(`${API}?pageSize=200`, { headers: { 'x-goog-api-key': KEY } }).then((x) => x.json()).catch(() => ({}));
      const names = (list.models ?? []).map((m) => m.name.replace('models/', ''));
      throw new Error(`model ${model} not found. Available TTS models: ${names.filter((n) => /tts/.test(n)).join(', ') || '(none listed)'}`);
    }
    throw new Error(`Gemini ${r.status}: ${text.slice(0, 500)}`);
  }
}

/** Text -> mp3 file, via Gemini TTS (24 kHz 16-bit mono PCM) and ffmpeg. */
async function tts(prompt, voice, dest) {
  const res = await call(TTS_MODEL, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
  });
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error(`no audio returned: ${JSON.stringify(res).slice(0, 300)}`);
  const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType)?.[1] ?? 24000);
  const pcm = Buffer.from(part.inlineData.data, 'base64');
  // trim silence at both ends, add a tiny lead-in, even out loudness
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', String(rate), '-ac', '1', '-i', 'pipe:0',
    '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,adelay=60,apad=pad_dur=0.12,loudnorm=I=-16:TP=-1.5,aresample=44100',
    '-ac', '1', '-b:a', '64k', dest], { input: pcm });
}

async function pool(items, n, fn) {
  let i = 0, failed = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const it = items[i++];
      try { await fn(it); } catch (e) { failed++; console.error(`  ✗ ${it.label}: ${e.message}`); }
    }
  }));
  return failed;
}

// ---------- verify ----------
if (args.has('--verify')) {
  const strip = (s) => s.replace(/[\s።፣!?.,፡]/g, '');
  let bad = 0;
  for (const c of clips) {
    const file = join(root, 'public/audio', `${c.id}.mp3`);
    const res = await call(TEXT_MODEL, { contents: [{ parts: [
      { inlineData: { mimeType: 'audio/mp3', data: readFileSync(file).toString('base64') } },
      { text: 'This is a short Amharic recording. Write exactly what is said, in Ge\'ez (Ethiopic) script only, nothing else.' },
    ] }] });
    const heard = (res.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim();
    const ok = strip(heard) === strip(c.am);
    if (!ok) bad++;
    console.log(`${ok ? '✓' : '?'} ${c.id.padEnd(18)} expected ${c.am.padEnd(14)} heard ${heard}`);
  }
  console.log(bad ? `\n${bad} clip(s) to listen to (the transcriber can also be wrong).` : '\nAll Amharic clips transcribe as expected.');
  process.exit(0);
}

// ---------- English narration ----------
const voiceDir = join(root, 'public/voice');
mkdirSync(join(voiceDir, 'en'), { recursive: true });
const manifestPath = join(voiceDir, 'en.json');
const old = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const manifest = {};
const todo = [];
for (const line of lines) {
  const file = `en/${sha(`${NARRATOR}|${enPrompt(line)}`)}.mp3`;
  manifest[line] = file;
  if (args.has('--force') || !existsSync(join(voiceDir, file))) todo.push({ label: line, line, file });
}
console.log(`English: ${lines.length} sentences, ${todo.length} to generate (voice ${NARRATOR}, model ${TTS_MODEL})`);
let failed = await pool(todo, 3, async (t) => { await tts(enPrompt(t.line), NARRATOR, join(voiceDir, t.file)); console.log(`  ✓ ${t.line}`); });
// keep only sentences that have audio; delete files nothing uses any more
for (const [line, file] of Object.entries(manifest)) if (!existsSync(join(voiceDir, file))) delete manifest[line];
const used = new Set(Object.values(manifest).map((f) => f.replace('en/', '')));
for (const f of readdirSync(join(voiceDir, 'en'))) if (!used.has(f)) rmSync(join(voiceDir, 'en', f));
writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
void old;

// ---------- Amharic clips ----------
const audioDir = join(root, 'public/audio');
const amListPath = join(audioDir, 'voices.json');
const amList = existsSync(amListPath) ? JSON.parse(readFileSync(amListPath, 'utf8')) : {};
const amTodo = clips
  .map((c) => ({ label: c.id, c, sig: sha(`${AMHARIC}|${TTS_MODEL}|${amPrompt(c)}`) }))
  .filter((t) => args.has('--force') || amList[t.c.id]?.sig !== t.sig);
console.log(`Amharic: ${clips.length} clips, ${amTodo.length} to generate (voice ${AMHARIC})`);
failed += await pool(amTodo, 3, async (t) => {
  await tts(amPrompt(t.c), AMHARIC, join(audioDir, `${t.c.id}.mp3`));
  amList[t.c.id] = { sig: t.sig, source: 'gemini', voice: AMHARIC, model: TTS_MODEL };
  console.log(`  ✓ ${t.c.id} ${t.c.am}`);
});
writeFileSync(amListPath, JSON.stringify(amList, null, 1) + '\n');

console.log(failed ? `\nDone with ${failed} failure(s): run again to retry them.` : '\nDone. Run with --verify to check the Amharic.');
process.exit(failed ? 1 : 0);
