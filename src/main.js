import * as THREE from 'three';
import { Hud, RUNGS } from './hud.js';
import { Sound } from './audio.js';
import { Input } from './input.js';
import { Env } from './env.js';
import { Player } from './player.js';
import { buildLevel } from './level.js';
import { Summit, Ending } from './ending.js';
import { Batch, cyl, sph, C } from './build.js';
import { clamp, damp, angleDamp } from './util.js';

const canvas = document.getElementById('c');
const lowSpec = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowSpec, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowSpec ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);

const G = {
  scene, camera, renderer, lowSpec,
  colliders: [], camSolids: [], ents: [], lamps: [], winds: [],
  time: 0, state: 'title', zone: 0, fallT: 0, hintT: 0, hintMsg: '', heavy: false, frozen: false, forceKneel: false,
  inv: { gold: 0, water: 0, bread: 0 },
  stats: { goldTaken: 0, gaveToPoor: false, falls: 0, served: 0, forgiven: 0, struck: 0, prayers: 0 },
  rungs: [0, 0, 0, 0, 0, 0], canStrike: true, told: {},
  cam: { yaw: 0, pitch: 0.34, dist: 9.5, targetYaw: null, look: new THREE.Vector3(0, 1.5, 6) },
};
G.hud = new Hud();
G.audio = new Sound();
G.input = new Input(canvas, G.hud);
G.env = new Env(G);
G.level = buildLevel(G);
G.env.buildTerrain(G.level);
G.player = new Player(G, ...G.level.spawn);
G.summit = new Summit(G, G.level.court); G.ents.push(G.summit);
G.ending = new Ending(G);
const L = G.level;

const ZONES = [
  ['The Gorge', 'Egypt, the fourth century. Moses the robber, feared along the Nile.'],
  ['The Desert Road', '“What can get through such snares?”'],
  ['Scetis', 'The elders’ jars stand empty at their doors.'],
  ['The Narrow Bridges', 'His old companions are waiting for him.'],
  ['The Cell', 'There is no road from here.'],
  ['The Summit', 'The last rung.'],
];

const once = (key, fn) => { if (!G.told[key]) { G.told[key] = true; fn(); } };

G.windAt = p => { let f = 0; for (const w of G.winds) f += w.force(p, G); return f; };

G.award = i => {
  if (G.rungs[i]) return;
  G.rungs[i] = 1;
  G.hud.rung(i);
  G.audio.bell([261.6, 293.7, 329.6, 392, 440, 523.3][i], 0.25, 4.5);
  if (i < 5) G.hud.say(`The rung of ${RUNGS[i]}.`, '', 3.5);
};

G.collect = kind => {
  if (kind === 'gold') {
    G.inv.gold++; G.stats.goldTaken++;
    G.audio.tone(1320, 0.12, 'triangle', 0.1); G.audio.tone(1760, 0.2, 'triangle', 0.08);
    once('gold', () => G.hud.say('Stolen gold. It weighs on you: the more you carry, the lower you leap.'));
    if (G.inv.gold >= 3) G.heavy = true;
  } else {
    G.inv.bread++;
    G.audio.tone(660, 0.15, 'sine', 0.08);
    once('bread', () => G.hud.say('Bread, still warm. Someone further on may be hungry.'));
  }
};

function layDownGold() {
  const p = G.player.pos, n = G.inv.gold, b = new Batch(40 + n);
  for (let i = 0; i < n; i++) b.add(sph(0.3, 7, 5), C.SAND_D, Math.cos(i * 2.1) * 0.35, 0.24, Math.sin(i * 2.1) * 0.35, { sy: 0.85, grad: 0.3 });
  for (let i = 0; i < 8; i++) b.add(cyl(0.08, 0.08, 0.03, 7), C.GOLD, Math.cos(i) * 0.75, 0.02, Math.sin(i) * 0.75, { jitter: 0.2 });
  const m = b.build(); m.position.copy(p); scene.add(m);
  G.inv.gold = 0; G.heavy = false; G.hintT = 0;
  G.audio.bell(196, 0.2, 3);
  const bg = L.beggar;
  if (Math.hypot(p.x - bg.x, p.z - bg.z) < 6.5 && Math.abs(p.y - bg.y) < 2) {
    G.stats.gaveToPoor = true; bg.lamp.on = true; bg.bows = true;
    G.hud.say('The poor man lifts his hands and blesses you. You feel light.');
  } else G.hud.say('You set the gold down. You feel light.');
}

G.serveElder = () => {
  const n = ++G.stats.served;
  L.stair.show(n - 1);
  G.audio.bell(330 + n * 55, 0.16, 3);
  G.hud.say(['“God reward you, my son.”', '“May the Lord give you water that does not run dry.”', '“You carried it as if it were for Christ Himself.”'][n - 1], 'an elder of Scetis', 3.8);
  if (n === 1) G.hud.say('In thanks, the elder sets a step against the cliff. Two more jars stand empty.', '', 4.5);
  if (n === 3) G.hud.say('The stair is whole. The way up is open.', '', 3.5);
};

G.onForgiven = (r, how) => {
  const n = ++G.stats.forgiven;
  G.audio.bell(392 + n * 40, 0.18, 3.5);
  if (how === 'bread') once('fed', () => G.hud.say('If your enemy is hungry, feed him.', 'Romans 12:20'));
  else once('knelt', () => G.hud.say('“Forgive me, brother.” — He lowers his sword. He had expected Moses the robber.'));
  if (n === 3) { L.door.openUp(G); G.award(3); }
};
G.onShoved = () => once('shoved', () => G.hud.say('He throws you back. You have no sword now, and you want none.'));
G.onPrayer = () => {
  G.stats.prayers++;
  once('prayed', () => G.hud.say('Be still, and know that I am God.', 'Psalm 46:10'));
};

function enterZone(i) {
  G.zone = i;
  G.hud.flush();
  G.audio.mood(i);
  G.hud.title(...ZONES[i]);
  if (i === 1) {
    G.player.becomeMonk();
    G.canStrike = false; G.hud.strike(false);
    G.award(0);
    G.hud.say('Moses left the gorge and his old life behind, and asked the monks of Scetis to receive him. He laid down his sword with his gold.');
  }
}

function doGive() {
  if (G.inv.gold) return layDownGold();
  for (const e of G.ents) if (e.onGive && e.onGive(G)) return;
}
function doStrike() {
  if (!G.canStrike) return;
  G.player.strikeT = 1;
  G.audio.noise(0.1, 900, 2, 0.12);
  for (const e of G.ents) if (e.onStrike && e.onStrike(G)) return;
}

function playUpdate(dt) {
  const p = G.player, inp = G.input;
  if (inp.consume('give')) doGive();
  if (inp.consume('strike')) doStrike();

  if (G.fallT > 0) {                         // falling is never the end: you get up where you last stood
    const before = G.fallT; G.fallT -= dt;
    if (before > 0.4 && G.fallT <= 0.4) {
      p.pos.copy(p.safe); p.vel.set(0, 0, 0); p.stun = 0;
      G.hud.fade(0, '#000', 0.5);
    }
    p.syncFigure(dt, G);
  } else {
    p.update(dt, G);
    if (p.pos.y < p.safe.y - 14) {
      G.fallT = 0.8; G.stats.falls++;
      G.hud.fade(1, '#000', 0.35);
      G.audio.tone(200, 0.6, 'sine', 0.1, -150);
      if (G.inv.gold) G.heavy = true;
      if (G.stats.falls === 1) G.hud.say('“What shall I do, abba, for I have fallen?” — “Get up again.” — “I got up, and I fell again.” — “Get up again and again.”', 'Abba Sisoes');
      else if (G.stats.falls % 3 === 0) G.hud.say('Get up again.', '', 2.5);
    }
  }
  for (const e of G.ents) e.update(dt, G);

  let z = 0;
  for (let i = 1; i < L.zoneZ.length; i++) if (p.pos.z < L.zoneZ[i]) z = i;
  while (G.zone < z) enterZone(G.zone + 1);
  if (p.grounded) {
    if (p.ground === L.r7.col) G.award(1);
    if (p.ground === L.up.col) G.award(2);
    if (p.ground === L.c2.col) G.award(4);
    if (p.ground === L.p4.col && G.inv.gold) G.heavy = true;
  }

  let h = null;
  if (G.hintT > 0) { G.hintT -= dt; h = G.hintMsg; }
  if (p.blocked && p.blockedBy && p.blockedBy.hint) {
    const m = p.blockedBy.hint(G);
    if (m) { G.hintMsg = h = m; G.hintT = 2.5; }
  }
  if (!h && G.inv.gold && G.heavy) h = 'The gold is heavy.  {give} — lay it down';
  if (!h) for (const e of G.ents) { if (e.prompt && (h = e.prompt(G))) break; }
  if (!h && G.time < G.introUntil) h = G.hud.touch ? 'Left stick — move  ·  {jump}  ·  {kneel}  ·  drag the view to look around' : 'WASD / arrows — move  ·  {jump} — jump  ·  {kneel} — kneel  ·  drag — look around';
  G.hud.hint(h);
  G.hud.inv(G.inv);
}

function cameraUpdate(dt) {
  const c = G.cam, p = G.player.pos, inp = G.input;
  if (G.state === 'title') {
    c.yaw = 0.5 + Math.sin(G.time * 0.1) * 0.5; c.look.set(-1, 1.6, 4);
    camera.position.set(c.look.x + Math.sin(c.yaw) * 13, 5.2, c.look.z + Math.cos(c.yaw) * 13);
    camera.lookAt(c.look);
    inp.camDX = inp.camDY = 0;
    return;
  }
  if (inp.camDX || inp.camDY) {
    c.yaw -= inp.camDX * 0.005; c.pitch = clamp(c.pitch + inp.camDY * 0.004, 0.06, 1.15);
    inp.camDX = inp.camDY = 0; c.targetYaw = null;
  }
  if (c.targetYaw !== null) c.yaw = angleDamp(c.yaw, c.targetYaw, 2.2, dt);
  c.look.x = damp(c.look.x, p.x, 10, dt); c.look.y = damp(c.look.y, p.y + 1.5, 6, dt); c.look.z = damp(c.look.z, p.z, 10, dt);
  const cp = Math.cos(c.pitch), ux = Math.sin(c.yaw) * cp, uy = Math.sin(c.pitch), uz = Math.cos(c.yaw) * cp;
  let want = c.dist;                       // pull the camera in rather than let a building swallow it
  scan: for (let s = 1; s <= 12; s++) {
    const d = c.dist * s / 12, x = c.look.x + ux * d, y = c.look.y + uy * d, z = c.look.z + uz * d;
    for (const k of G.camSolids) if (x > k.x0 - 0.4 && x < k.x1 + 0.4 && y > k.y0 && y < k.y1 + 0.4 && z > k.z0 - 0.4 && z < k.z1 + 0.4) { want = Math.max(1.6, c.dist * (s - 1) / 12); break scan; }
  }
  c.cur = damp(c.cur ?? want, want, want < (c.cur ?? want) ? 18 : 3, dt);
  camera.position.set(c.look.x + ux * c.cur, c.look.y + uy * c.cur, c.look.z + uz * c.cur);
  camera.lookAt(c.look.x, c.look.y + 0.4, c.look.z);
}

function update(dt) {
  G.time += dt;
  G.input.poll();
  if (G.state === 'play') playUpdate(dt);
  else {
    for (const e of G.ents) e.update(dt, G);
    if (G.state === 'title') G.player.syncFigure(dt, G);
    else G.ending.update(dt, G);
  }
  cameraUpdate(dt);
  G.env.update(dt, G);
  G.hud.update(dt);
}
G.update = update;

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = w < h ? 72 : 55;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

function begin() {
  if (G.state !== 'title') return;
  G.audio.start();
  G.state = 'play';
  G.introUntil = G.time + 14;
  G.cam.yaw = 0; G.cam.look.set(0, 1.5, 9.5);
  document.getElementById('start').classList.add('hide');
  document.body.classList.add('playing');
  G.hud.strike(true);
  G.hud.title(...ZONES[0]);
  G.hud.say('Chests of plunder lie around the camp. The road out of the gorge leads north, over the rocks.', '', 5);
}
G.begin = begin;
document.getElementById('begin').addEventListener('click', begin);
addEventListener('keydown', e => { if (e.code === 'Enter' && G.state === 'title') begin(); });
document.getElementById('again').addEventListener('click', () => location.reload());
document.getElementById('mute').addEventListener('click', e => { e.currentTarget.textContent = G.audio.toggle() ? 'Sound: on' : 'Sound: off'; });

let last = performance.now(), acc = 0;
const STEP = 1 / 60;
function frame(now) {
  requestAnimationFrame(frame);
  acc += Math.min(0.1, (now - last) / 1000); last = now;
  let n = 0;
  while (acc >= STEP && n < 4) { update(STEP); acc -= STEP; n++; }
  if (n === 4) acc = 0;
  renderer.render(scene, camera);
}
G.env.update(0, G);
requestAnimationFrame(frame);

// ── A small autopilot used by the automated playthrough test (window.__game.bot). ──
function groundAhead(x, z, y) {
  for (const c of G.colliders) if (c.on && x > c.x0 - 0.2 && x < c.x1 + 0.2 && z > c.z0 - 0.2 && z < c.z1 + 0.2 && c.y1 <= y + 0.43 && c.y1 >= y - 0.5) return true;
  return false;
}
const bot = { i: 0, giveT: 0, refind: false };
G.botStep = dt => {
  const p = G.player, inp = G.input, W = L.wps;
  inp.botKneel = false; inp.botDir = { x: 0, z: 0 };
  if (G.state !== 'play') return;
  if (G.fallT > 0) { bot.refind = true; return; }
  if (bot.refind) {
    bot.refind = false;
    let best = 0, bd = 1e9;
    for (let i = 0; i <= bot.i && i < W.length; i++) { const d = Math.hypot(W[i].x - p.pos.x, W[i].y - p.pos.y, W[i].z - p.pos.z); if (d < bd) { bd = d; best = i; } }
    bot.i = best;
  }
  if (G.inv.gold) inp.edges.give = true;
  const w = W[bot.i];
  if (!w) return;
  const dx = w.x - p.pos.x, dz = w.z - p.pos.z, d = Math.hypot(dx, dz);
  const windy = G.winds.some(z => z.inside(p.pos) && z.state(G) !== 0);
  if (d < 0.45 && Math.abs(w.y - p.pos.y) < 0.6 && p.grounded) {
    if (w.give && !w.give()) { bot.giveT -= dt; if (bot.giveT <= 0) { inp.edges.give = true; bot.giveT = 0.3; } }
    else if (w.kneelUntil && !w.kneelUntil()) inp.botKneel = true;
    else bot.i++;
    if (windy) inp.botKneel = true;
    return;
  }
  const dir = { x: dx / d, z: dz / d };
  const ahead = groundAhead(p.pos.x + dir.x * 0.75, p.pos.z + dir.z * 0.75, p.pos.y);
  if (w.kneel || windy) inp.botKneel = true;
  if (inp.botKneel && !ahead) return;
  if (p.grounded && !inp.botKneel && (!ahead || p.blocked)) inp.edges.jump = true;
  inp.botDir = dir;
};
G.bot = bot;
window.__game = G;
