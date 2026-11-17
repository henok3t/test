// Phone emulation with real touch events. usage: node mob.js <tag> [w] [h]
const { chromium } = require('playwright');
const [tag, W, H] = [process.argv[2] || 'm', +process.argv[3] || 390, +process.argv[4] || 844];
let R0;
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page), errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + require('path').resolve(__dirname, '..', 'index.html')); await page.waitForTimeout(1500);
  await page.screenshot({ path: `/tmp/${tag}_start.png` });
  const read = () => page.evaluate(() => { const G = window.__game, p = G.player; return { t: G.time, x: p.pos.x, y: p.pos.y, z: p.pos.z, kneel: p.kneeling, state: G.state, yaw: G.cam.yaw, touch: document.body.classList.contains('touch') }; });
  const waitSim = async secs => { const t0 = (await read()).t; let maxY = -99, s; do { await page.waitForTimeout(60); s = await read(); maxY = Math.max(maxY, s.y); } while (s.t - t0 < secs); return { ...s, maxY }; };
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const mid = async sel => { const b = await page.locator(sel).boundingBox(); return b && { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
  R0 = await page.evaluate(() => ({ label: document.getElementById('begin').textContent, disabled: document.getElementById('begin').disabled })); await page.evaluate(() => { window.__game.adaptive = false; });
  await page.tap('#begin'); await page.waitForTimeout(400);
  const R = { size: `${W}x${H}`, begin: R0 }; let a = await read(); R.started = a.state; R.touchMode = a.touch;
  // are all controls on screen, not overlapping each other, and actually the thing a finger hits?
  R.controls = await page.evaluate(() => {
    const ids = ['stick', 'bJump', 'bKneel', 'bGive', 'bStrike'], out = {}, rects = {};
    for (const id of ids) { const e = document.getElementById(id), r = e.getBoundingClientRect(); rects[id] = r;
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      out[id] = { on: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, hit: !!top && (top === e || e.contains(top)), size: Math.round(r.width) }; }
    const ov = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const p = rects[ids[i]], q = rects[ids[j]]; if (p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom) ov.push(ids[i] + '/' + ids[j]); }
    out.overlaps = ov; return out;
  });
  const s = await mid('#stick');
  await touch('touchStart', [{ x: s.x, y: s.y, id: 1 }]); await touch('touchMove', [{ x: s.x, y: s.y - 50, id: 1 }]);
  let b = await waitSim(1); R.stickSpeed = +((a.z - b.z) / (b.t - a.t)).toFixed(2);
  const j = await mid('#bJump');
  await touch('touchStart', [{ x: s.x, y: s.y - 50, id: 1 }, { x: j.x, y: j.y, id: 2 }]); b = await waitSim(0.6); R.jump = +b.maxY.toFixed(2);
  await touch('touchEnd', []); await waitSim(0.5);
  const k = await mid('#bKneel');
  await touch('touchStart', [{ x: k.x, y: k.y, id: 3 }]); b = await waitSim(0.3); R.kneel = b.kneel; await touch('touchEnd', []); b = await waitSim(0.3); R.stands = !b.kneel;
  a = await read(); await touch('touchStart', [{ x: W * 0.55, y: H * 0.3, id: 4 }]); await touch('touchMove', [{ x: W * 0.55 + 70, y: H * 0.3, id: 4 }]); await touch('touchEnd', []);
  b = await waitSim(0.1); R.dragLooks = Math.abs(b.yaw - a.yaw) > 0.1;
  // chest: walk up to it and tap STRIKE, then check GIVE lays the gold down
  await page.evaluate(() => { const G = window.__game; G.player.pos.set(3.2, 0, 4.6); });
  await waitSim(0.2); const st = await mid('#bStrike'); await touch('touchStart', [{ x: st.x, y: st.y, id: 5 }]); await touch('touchEnd', []); await waitSim(0.4);
  R.goldAfterStrikeTap = await page.evaluate(() => window.__game.inv.gold);
  const g = await mid('#bGive'); await touch('touchStart', [{ x: g.x, y: g.y, id: 6 }]); await touch('touchEnd', []); await waitSim(0.3);
  R.goldAfterGiveTap = await page.evaluate(() => window.__game.inv.gold);
  await page.evaluate(() => { const G = window.__game; G.hud.say('I saw the snares that the enemy spreads out over the world, and I said, groaning, “What can get through such snares?” Then I heard a voice saying to me, “Humility.”', 'Abba Anthony the Great'); G.hintT = 9; G.hintMsg = 'The gold is too heavy to climb with.  {give} — lay it down'; G.inv.gold = 2; G.inv.bread = 1; G.award(0); G.award(1); });
  await page.waitForTimeout(2500);
  R.textOverControls = await page.evaluate(() => {
    const hit = (a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return p.width && q.width && p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom; };
    const out = [];
    for (const t of ['caption', 'hint', 'title', 'inv', 'ladder']) for (const c of ['stick', 'bJump', 'bKneel', 'bGive', 'bStrike', 'mute']) if (hit(document.getElementById(t), document.getElementById(c))) out.push(t + '/' + c);
    for (const [x, y] of [['caption', 'hint'], ['title', 'inv'], ['title', 'mute'], ['caption', 'title']]) if (hit(document.getElementById(x), document.getElementById(y))) out.push(x + '/' + y);
    return out;
  });
  await page.screenshot({ path: `/tmp/${tag}_play.png` });
  console.log(JSON.stringify(R), errs.length ? errs : 'no errors');
  await browser.close();
})();
