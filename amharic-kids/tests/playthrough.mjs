// Plays Lesson 1 from the first screen to the sticker, using only taps and finger drags,
// at phone and tablet sizes. Run `npm run build` first. Needs playwright.
//   node tests/playthrough.mjs                 (all sizes)
//   node tests/playthrough.mjs --shots=DIR     (also save a screenshot of every step)
//   node tests/playthrough.mjs --only=phone
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const dist = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(join(dist, 'index.html'))) { console.error('Run `npm run build` first.'); process.exit(1); }
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const shotsDir = arg('shots');
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  try {
    const body = await readFile(join(dist, path.endsWith('/') ? `${path}index.html` : path));
    res.writeHead(200, { 'content-type': types[extname(path)] ?? (path.endsWith('/') ? 'text/html' : 'application/octet-stream') });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const url = `http://localhost:${server.address().port}/`;

const sizes = {
  phone: { ...devices['iPhone 13'] },
  'phone-landscape': { ...devices['iPhone 13 landscape'] },
  ipad: { ...devices['iPad (gen 7)'] },
  'ipad-landscape': { ...devices['iPad (gen 7) landscape'] },
};
const only = arg('only');

async function run(name, device) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...device });
  const page = await ctx.newPage();
  const errors = [];
  runErrors = errors;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
  let n = 0;
  const shot = async (label) => shotsDir && page.screenshot({ path: join(shotsDir, `${name}-${String(++n).padStart(2, '0')}-${label}.png`) });
  const tap = (sel) => page.locator(sel).first().tap({ force: true, timeout: 5000 });
  const step = async () => (await page.locator('.lesson').getAttribute('class')).replace('lesson lesson-', '');
  const waitStep = async (s) => page.waitForSelector(`.lesson-${s}`, { timeout: 20000 });

  // narration off keeps the test fast (headless browsers have no voices anyway); sound effects on
  await page.addInitScript(() => {
    if (!localStorage.getItem('selam-anbessa.v1'))
      localStorage.setItem('selam-anbessa.v1', JSON.stringify({ settings: { narration: false, sounds: true, useRecordings: true } }));
  });
  await page.goto(url);
  await page.waitForSelector('.play-btn');
  await shot('home');
  await tap('.play-btn');
  // first run: grown-up setup
  await page.waitForSelector('.setup-screen input');
  await shot('setup');
  await page.locator('.setup-screen input').fill('Liya');
  await tap('.setup-screen button[type=submit]');
  await page.waitForSelector('.stop-btn.current');
  await shot('map');
  await tap('.stop-btn.current');

  // story: tap Next, or the big "say it" button, until the story ends
  await waitStep('story');
  let beats = 0;
  while ((await step()) === 'story') {
    if (beats === 1 || beats === 4 || beats === 7) await shot(`story-beat${beats}`);
    const say = page.locator('.say-btn:not(.said)');
    if (await say.count()) {
      await say.tap({ force: true });
      await page.waitForFunction(() => !document.querySelector('.say-btn') || document.querySelector('.say-btn.said'), null, { timeout: 8000 });
      await page.waitForFunction(() => !document.querySelector('.say-btn.said'), null, { timeout: 15000 });
    } else {
      await tap('.next-btn');
      await page.waitForTimeout(150);
    }
    if (++beats > 40) throw new Error('story did not end');
  }
  if (beats < 13) throw new Error(`story ended after only ${beats} beats`);

  // meet the words
  await waitStep('cards');
  await shot('cards');
  for (let k = 0; k < 4; k++) {
    await page.waitForSelector('.word-card');
    await tap('button[aria-label="Next word"]');
    await page.waitForTimeout(200);
  }

  // listen and tap: try pictures until the right one lights up
  await waitStep('listen');
  await shot('listen');
  for (let r = 0; r < 6; r++) {
    await page.waitForTimeout(300);
    const opts = page.locator('.option');
    for (let k = 0; k < (await opts.count()); k++) {
      if (await page.locator('.option.right').count()) break;
      const o = opts.nth(k);
      if (!(await o.getAttribute('class')).includes('wrong')) await o.tap({ force: true });
      await page.waitForTimeout(250);
    }
    if (!(await page.locator('.option.right').count())) throw new Error('no right answer in listen round');
    await page.waitForFunction((r) => document.querySelectorAll('.stars-row .got').length >= r + 1 && !document.querySelector('.option.right') || !document.querySelector('.listen-screen'), r, { timeout: 15000 });
    if (!(await page.locator('.listen-screen').count())) break;
  }

  // help Anbessa
  await waitStep('choose');
  await shot('choose');
  for (let r = 0; r < 4; r++) {
    await page.waitForSelector('.choice');
    const ch = page.locator('.choice');
    for (let k = 0; k < (await ch.count()); k++) {
      if (await page.locator('.choice.right').count()) break;
      const c = ch.nth(k);
      if (!(await c.getAttribute('class')).includes('wrong')) await c.tap({ force: true });
      await page.waitForTimeout(400);
    }
    await page.waitForFunction(() => !document.querySelector('.choice.right'), null, { timeout: 15000 });
  }

  // match: pair each picture with each word until it sticks
  await waitStep('match');
  await shot('match');
  const pics = page.locator('.match-pic');
  const ams = page.locator('.match-am');
  for (let a = 0; a < 4 && (await step()) === 'match'; a++) {
    for (let b = 0; b < 4 && (await step()) === 'match'; b++) {
      if ((await pics.nth(a).getAttribute('class')).includes('matched')) break;
      if ((await ams.nth(b).getAttribute('class')).includes('matched')) continue;
      await pics.nth(a).tap({ force: true });
      await ams.nth(b).tap({ force: true });
      await page.waitForTimeout(700);
    }
  }
  if ((await page.locator('.match-pic.matched').count()) < 4 && (await step()) === 'match') throw new Error('could not match everything');

  // trace: meet the letter, then paint over it with zig-zag finger strokes
  await waitStep('trace');
  await shot('letter');
  await tap('button[aria-label="Let\'s trace it"]');
  await page.waitForSelector('.trace-paint');
  await page.waitForTimeout(600);
  const box = await page.locator('.trace-paint').boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  for (let row = 0.12; row <= 0.9 && !(await page.locator('.trace-box.traced').count()); row += 0.06) {
    await touch('touchStart', box.x + box.width * 0.1, box.y + box.height * row);
    // real finger speed (~60 moves a second); instant synthetic strokes confuse Chromium's tap detection
    for (let col = 0.1; col <= 0.9; col += 0.05) { await touch('touchMove', box.x + box.width * col, box.y + box.height * row); await page.waitForTimeout(30); }
    await touch('touchEnd');
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  await page.waitForSelector('.trace-box.traced', { timeout: 5000 });
  await shot('traced');
  await tap('.trace-screen button[aria-label="Next"]');

  // reward
  await waitStep('reward');
  await page.waitForSelector('.sticker-reveal');
  const title = await page.locator('.reward-card h2').textContent();
  if (!title.includes('Liya')) throw new Error(`reward title was "${title}"`);
  await page.waitForTimeout(1500);
  await shot('reward');
  await tap('.reward-card .big-pill');
  await page.waitForSelector('.stop-star');
  await shot('map-after');
  await tap('button[aria-label="My stickers"]');
  await page.waitForSelector('.sticker-slot.have');
  await shot('stickers');

  // grown-ups corner: press and hold
  await tap('button[aria-label="Back"]');
  await page.waitForSelector('.hold-btn');
  const hb = await page.locator('.hold-btn').boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2200);
  await page.mouse.up();
  await page.waitForSelector('.parents-screen');
  await shot('grown-ups');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('selam-anbessa.v1')));
  if (!saved.completed?.l1 || !saved.stickers?.includes('l1-selam')) throw new Error('progress was not saved');
  await browser.close();
  if (errors.length) throw new Error(`page errors:\n  ${errors.join('\n  ')}`);
}

let failed = 0;
let runErrors = [];
for (const [name, device] of Object.entries(sizes)) {
  if (only && !name.startsWith(only)) continue;
  const t = Date.now();
  try {
    await run(name, device);
    console.log(`PASS ${name} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`);
    if (runErrors.length) console.log(`  page errors: ${runErrors.join(' | ')}`);
  }
}
server.close();
process.exit(failed ? 1 : 0);
