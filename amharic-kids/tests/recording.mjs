// Checks the Grown-ups corner: a recording made with a (fake) microphone is saved,
// shows up as "Mine", survives a reload, and can be deleted. Run `npm run build` first.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const dist = new URL('../dist/', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  try {
    const body = await readFile(join(dist, p.endsWith('/') ? `${p}index.html` : p));
    res.writeHead(200, { 'content-type': types[extname(p)] ?? 'text/html' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);

const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const ctx = await browser.newContext({ ...devices['iPad (gen 7)'], permissions: ['microphone'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const fail = (m) => { console.log(`FAIL ${m}`); process.exit(1); };
try {
  await page.goto(`http://localhost:${server.address().port}/`);
  const hb = await page.locator('.hold-btn').boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down(); await page.waitForTimeout(400); await page.mouse.up();
  if (await page.locator('.parents-screen').count()) fail('a short press opened the grown-ups corner');
  await page.mouse.down(); await page.waitForTimeout(2200); await page.mouse.up();
  await page.waitForSelector('.parents-screen');

  const row = page.locator('.clip-row').first();
  await row.locator('.mini-btn.rec').click({ force: true });
  await page.waitForSelector('.clip-row.recording');
  await page.waitForTimeout(1500);
  await row.locator('.mini-btn.rec').click({ force: true });
  await row.locator('.mini-btn.mine').waitFor({ timeout: 5000 });
  if (await page.locator('.warn').count()) fail(`warning shown: ${await page.locator('.warn').first().textContent()}`);

  await page.reload();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down(); await page.waitForTimeout(2200); await page.mouse.up();
  await page.waitForSelector('.parents-screen');
  await page.locator('.clip-row').first().locator('.mini-btn.mine').waitFor({ timeout: 5000 });
  await page.screenshot({ path: process.argv[2] ?? '/dev/null' }).catch(() => {});

  await page.locator('.clip-row').first().locator('.mini-btn.del').click();
  await page.waitForFunction(() => !document.querySelector('.clip-row .mini-btn.mine'));
  if (errors.length) fail(`page errors: ${errors.join(' | ')}`);
  console.log('PASS recording: record, save, reload, delete');
} finally {
  await browser.close();
  server.close();
}
