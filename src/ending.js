// The last stage: the raid on Scetis, the choice, and the ending that names what was practised.
import * as THREE from 'three';
import { Batch, box, C, rock } from './build.js';
import { makeFigure, animate } from './figure.js';
import { Npc } from './entities.js';
import { damp, angleDamp, clamp } from './util.js';

export class Summit {
  constructor(G, court) {
    const cx = this.cx = court.x, cy = this.cy = court.y, cz = this.cz = court.z;
    this.state = 'idle'; this.t = 0;
    const elder = { robe: 0xcdbb96, hood: 0xe6dcc4, beard: 0xe8e4da, trim: 0x8a6a4a, skin: 0x8a5f42, staff: true, cross: true };
    const monk = { robe: 0x6b4a32, hood: 0x2c2420, trim: 0xd8c8a0, beard: 0x1a1512, cross: true };
    const spots = [[-4.6, 4], [4.6, 4], [-4.6, 6.4], [4.6, 6.4], [-4.6, 8.8], [4.6, 8.8], [2.4, 2.6]];
    this.brothers = spots.map(([x, z], i) => {
      const n = new Npc(G, cx + x, cy, cz + z, x < 0 ? Math.PI / 2 : -Math.PI / 2, i < 3 ? elder : monk);
      G.ents.push(n);
      return n;
    });
    // the sword, laid on a stone
    this.sx = cx - 1.9; this.sz = cz + 13;
    const b = new Batch(88);
    rock(b, 0, 0, 0, 0.75, C.STONE);
    b.add(box(1.0, 0.035, 0.09), C.IRON, 0.1, 0.62, 0, { ry: 0.5, jitter: 0.03 });
    b.add(box(0.06, 0.06, 0.34), C.GOLD, -0.34, 0.62, 0.24, { ry: 0.5 });
    b.add(box(0.26, 0.05, 0.06), C.WOOD_D, -0.5, 0.62, 0.33, { ry: 0.5 });
    const m = b.build(); m.position.set(this.sx, cy, this.sz); G.scene.add(m);
    this.glow = G.env.addLamp(this.sx, cy + 0.9, this.sz, { color: 0xff3a22, intensity: 26, size: 2.6, flame: false, on: false });
    this.raiders = [];
    for (let i = 0; i < 5; i++) {
      const fig = makeFigure({ robe: 0x231f29, hood: 0x6a1616, trim: 0x5a1414, beard: 0x0d0a08, headwear: 'turban', sword: true, scale: 1.08 });
      fig.root.visible = false; G.scene.add(fig.root);
      const torch = G.env.addLamp(0, -99, 0, { color: 0xff7a30, intensity: 16, size: 1.5, on: false });
      this.raiders.push({ fig, torch, x: 0, y: 0, z: 0, yaw: Math.PI, ox: (i - 2) * 1.25, oz: (i % 2) * 1.6 + Math.abs(i - 2) * 0.7 });
    }
  }

  place() {
    for (const r of this.raiders) { r.x = this.cx + r.ox; r.z = this.cz + 23 + r.oz; }
  }

  prompt() {
    return this.state === 'raid' ? '{strike} — take up the sword   ·   {kneel} — kneel' : null;
  }

  onStrike(G) {
    if (this.state !== 'raid') return false;
    this.state = 'struck'; this.t = 0;
    G.stats.struck++;
    G.frozen = true;
    G.hud.fade(1, '#2a0606', 0.3);
    G.audio.noise(0.5, 220, 1, 0.4); G.audio.tone(110, 1.4, 'sawtooth', 0.12, -60);
    G.hud.say('All who take the sword will perish by the sword.', 'Matthew 26:52', 4.5);
    return true;
  }

  update(dt, G) {
    const p = G.player.pos, L = G.level;
    this.t += dt;
    if (this.state === 'idle') {
      if (p.z < this.cz + 11 && Math.abs(p.y - this.cy) < 2) {
        this.state = 'talk'; this.t = 0;
        G.cam.targetYaw = 2.4;
        G.hud.flush();
        G.hud.say('“Abba, raiders are coming over the desert. Flee with us!”', 'a brother of Scetis', 4.5);
        G.hud.say('“I have been waiting for this day for many years.”', 'Abba Moses', 4.5);
      }
    } else if (this.state === 'talk') {
      if (this.t > 7.5) {
        this.state = 'raid'; this.t = 0;
        this.place();
        for (const r of this.raiders) { r.fig.root.visible = true; r.torch.on = true; }
        for (const n of this.brothers) n.kneel = true;
        this.glow.on = true;
        G.canStrike = true; G.hud.strike(true, true);
        G.audio.noise(1.2, 120, 0.5, 0.3);
      }
    } else if (this.state === 'struck') {
      if (this.t > 2.6) {
        this.place();
        p.set(this.cx, this.cy, this.cz + 10); G.player.vel.set(0, 0, 0);
        G.frozen = false;
        G.hud.fade(0, '#2a0606', 1.2);
        G.hud.say('The ladder does not go that way.', '', 3.5);
        this.state = 'raid'; this.t = 0;
      }
    }
    if (this.state === 'raid') {
      const sp = G.player.kneeling ? 2.7 : 1.6;
      let nearest = 99;
      for (const r of this.raiders) {
        const dx = p.x + r.ox * 0.7 - r.x, dz = p.z - r.z, d = Math.hypot(dx, dz);
        if (d > 0.1) { r.x += dx / d * sp * dt; r.z += dz / d * sp * dt; r.yaw = angleDamp(r.yaw, Math.atan2(dx, dz), 6, dt); }
        nearest = Math.min(nearest, Math.hypot(p.x - r.x, p.z - r.z));
      }
      if (nearest < 2.3) { this.state = 'done'; G.ending.start(G); }
    }
    if (this.state === 'raid' || this.state === 'struck') {
      for (const r of this.raiders) {
        r.y = Math.min(this.cy, L.pathY(r.z));
        r.fig.root.position.set(r.x, r.y, r.z); r.fig.root.rotation.y = r.yaw;
        animate(r.fig, dt, { speed: this.state === 'raid' ? 2 : 0 });
        const t = r.torch;
        t.x = r.x + Math.cos(r.yaw) * 0.4; t.y = r.y + 2.25; t.z = r.z - Math.sin(r.yaw) * 0.4;
        t.sprite.position.set(t.x, t.y, t.z); t.flame.position.set(t.x, t.y, t.z);
      }
    }
  }

  clear() {
    for (const r of this.raiders) { r.fig.root.visible = false; r.torch.on = false; }
    this.glow.on = false;
  }
}

const plural = (n, w) => `${['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] || n} ${w}${n === 1 ? '' : 's'}`;

export class Ending {
  constructor(G) {
    this.t = 0; this.on = false; this.ready = false; this.lines = []; this.shown = -1; this.done = false;
    this.mat = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.ladder = new THREE.Group();
    for (const k of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.13, 90, 0.13), this.mat); r.position.set(k * 0.85, 45, 0); this.ladder.add(r); }
    for (let i = 0; i < 60; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.1), this.mat); r.position.set(0, 1.2 + i * 1.45, 0); this.ladder.add(r); }
    this.ladder.rotation.x = -0.2; this.ladder.visible = false;
    G.scene.add(this.ladder);
    this.beam = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.env.glow, color: 0xffe9b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.beam.scale.set(14, 70, 1); G.scene.add(this.beam);
    this.doves = [];
    const wm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.14, 0, 0, -0.14, 0.62, 0, -0.05]), 3));
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group(), body = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 5), wm);
      body.rotation.x = Math.PI / 2; g.add(body);
      const wl = new THREE.Mesh(wg, wm), wr = new THREE.Mesh(wg, wm); wr.scale.x = -1;
      g.add(wl, wr); g.visible = false; G.scene.add(g);
      this.doves.push({ g, wl, wr, r: 6 + i * 1.3, h: 7 + i * 1.1, ph: i * 0.9, sp: 0.5 + (i % 3) * 0.12 });
    }
  }

  start(G) {
    if (this.on) return;
    this.on = true; this.t = 0;
    G.state = 'ending'; G.frozen = true;
    G.hud.hint(''); G.hud.strike(false);
    document.body.classList.add('ending');
    G.hud.fade(1, '#fff', 1.6);
    G.audio.bell(196, 0.3, 6); G.audio.mood(5);
    const s = G.stats, L = this.lines;
    L.push(s.gaveToPoor ? ['You laid the gold at a poor man’s feet.', 'This was <b>repentance</b>.']
      : s.goldTaken ? ['You laid the gold down, and left the gorge.', 'This was <b>repentance</b>.']
        : ['You left the gold where it lay.', 'This was <b>repentance</b>.']);
    if (s.falls) L.push([`You fell ${plural(s.falls, 'time')}, and each time you got up again.`, 'This was <b>perseverance</b>.']);
    L.push(['You bowed beneath the snares and the wind.', 'This was <b>humility</b>.']);
    L.push(['You carried water to those who could not.', 'This was <b>mercy</b>.']);
    L.push(['Three enemies became your brothers.', 'This was <b>forgiveness</b>.']);
    L.push(['You were still, and the way appeared.', 'This was <b>prayer</b>.']);
    L.push(s.struck ? ['At the last, you put the sword down.', 'This was <b>love</b>.'] : ['You did not take up the sword.', 'This was <b>love</b>.']);
    L.push(['The last rung is not climbed.', 'It is given.']);
    L.push(['“For by grace you have been saved through faith, and that not of yourselves; it is the gift of God.”', 'Ephesians 2:8']);
    L.push(['“And now abide faith, hope, love, these three; but the greatest of these is love.”', '1 Corinthians 13:13']);
  }

  update(dt, G) {
    if (!this.on) return;
    this.t += dt;
    const t = this.t, pl = G.player, S = G.summit;
    if (!this.ready && t > 1.9) {
      this.ready = true;
      S.clear();
      pl.pos.set(S.cx, S.cy, S.cz + 8.5); pl.vel.set(0, 0, 0); pl.yaw = Math.PI; pl.kneeling = true;
      this.base = pl.pos.clone();
      this.ladder.position.set(S.cx, S.cy, S.cz + 7.4); this.ladder.visible = true;
      for (const d of this.doves) d.g.visible = true;
      pl.fig.halo.visible = true;
      G.cam.yaw = 2.45; G.cam.pitch = 0.2; G.cam.dist = 11; G.cam.targetYaw = null;
      G.hud.flush();
      G.hud.fade(0, '#fff', 3);
      G.award(5);
    }
    if (!this.ready) return;
    const LINE = 5.2, t0 = 4.5, n = this.lines.length, idx = Math.floor((t - t0) / LINE);
    if (idx !== this.shown && t > t0) {
      this.shown = idx;
      if (idx < n) {
        const [a, c] = this.lines[idx];
        G.hud.center(`<p>${a}</p><p class="${idx >= n - 2 ? 'cite' : 'second'}">${c}</p>`);
        G.audio.bell([261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880][idx % 10], 0.12, 4);
      } else G.hud.center('');
    } else if (idx >= 0 && idx < n && (t - t0) % LINE > LINE - 0.7) G.hud.center('');
    const rise = t0 + (n - 3) * LINE;                       // begins with "The last rung is not climbed"
    const k = clamp((t - 2) / 4, 0, 1);
    this.mat.opacity = 0.55 * k + 0.1 * Math.sin(t * 1.3);
    pl.fig.haloM.opacity = k;
    G.env.boost = damp(G.env.boost, t > rise ? 1.6 : 0.3, 1, dt);
    if (t > rise) {
      pl.kneeling = false;
      const up = Math.min(40, (t - rise) * 1.15);
      pl.pos.set(this.base.x, this.base.y + up * 0.98, this.base.z - 1.1 - up * 0.2);
      this.beam.material.opacity = Math.min(0.75, (t - rise) * 0.15);
    }
    this.beam.position.set(pl.pos.x, pl.pos.y + 22, pl.pos.z);
    pl.syncFigure(dt, G);
    G.cam.yaw = 2.45 + Math.sin((t - 2) * 0.09) * 0.4;
    G.cam.pitch = damp(G.cam.pitch, t > rise ? -0.12 : 0.2, 0.6, dt);
    for (const d of this.doves) {
      const a = t * d.sp + d.ph;
      d.g.position.set(S.cx + Math.cos(a) * d.r, S.cy + d.h + Math.sin(a * 1.7) * 0.8 + Math.max(0, pl.pos.y - this.base.y) * 0.6, S.cz + 3 + Math.sin(a) * d.r);
      d.g.rotation.y = -a;
      d.wl.rotation.z = d.wr.rotation.z = 0; d.wl.rotation.z = Math.sin(t * 9 + d.ph) * 0.7; d.wr.rotation.z = -Math.sin(t * 9 + d.ph) * 0.7;
    }
    const endAt = t0 + n * LINE;
    if (t > endAt && !this.done) {
      this.done = true;
      G.hud.center('');
      G.hud.fade(1, '#fff8e8', 3.5);
      setTimeout(() => document.getElementById('end').classList.add('show'), 3200);
    }
  }
}
