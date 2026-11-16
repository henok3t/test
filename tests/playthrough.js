// Plays the whole game with the built-in autopilot, simulating at 60 Hz without waiting for real time.
const { chromium } = require('playwright');
(async () => {
  const shots = process.argv[2] === 'shots';
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('file://' + require('path').resolve(__dirname, '..', 'index.html') + '');
  await page.waitForTimeout(1000);
  await page.evaluate(() => { window.__game.begin(); });
  let lastZone = -1, lastI = -1, stuck = 0, total = 0;
  for (let chunk = 0; chunk < 400; chunk++) {
    const s = await page.evaluate(() => {
      const G = window.__game;
      for (let i = 0; i < 120; i++) { G.botStep(1 / 60); G.update(1 / 60); }
      const p = G.player.pos;
      return { state: G.state, zone: G.zone, i: G.bot.i, n: G.level.wps.length, pos: [p.x, p.y, p.z].map(v => +v.toFixed(1)), stats: G.stats, rungs: G.rungs.join(''), summit: G.summit.state, inv: G.inv, ending: G.ending.on ? +G.ending.t.toFixed(1) : null, done: G.ending.done };
    });
    total += 2;
    if (s.zone !== lastZone || chunk % 15 === 0) console.log(`t=${total}s`, JSON.stringify(s));
    if (shots && s.zone !== lastZone) { await page.waitForTimeout(400); await page.screenshot({ path: `zone${s.zone}.png` }); }
    if (s.i === lastI && s.state === 'play' && s.summit === 'idle') stuck++; else stuck = 0;
    lastZone = s.zone; lastI = s.i;
    if (stuck > 25) { console.log('STUCK', JSON.stringify(s)); await page.screenshot({ path: 'stuck.png' }); break; }
    if (s.done) { console.log('FINISHED', JSON.stringify(s)); break; }
  }
  console.log(errs.slice(0, 10).join('\n') || 'no console errors');
  await browser.close();
})();
