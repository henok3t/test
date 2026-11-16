// Everything in the world that responds to Moses.
import * as THREE from 'three';
import { Batch, box, cyl, sph, C, woodStep, jar } from './build.js';
import { makeFigure, animate } from './figure.js';
import { damp, clamp, angleDamp } from './util.js';

const near = (G, x, y, z, r) => { const p = G.player.pos; return Math.abs(p.y - y) < 2.2 && Math.hypot(p.x - x, p.z - z) < r; };

export class Pickup {
  constructor(G, kind, x, y, z) {
    Object.assign(this, { kind, x, y, z, taken: false });
    const b = new Batch(Math.floor(Math.abs(x * 13 + z * 7)) + 50);
    if (kind === 'gold') {
      b.add(sph(0.3, 7, 5), C.SAND_D, 0, 0.25, 0, { sy: 0.85, grad: 0.3 });
      b.add(cyl(0.2, 0.25, 0.07, 8), C.GOLD, 0, 0.5, 0);
      for (let i = 0; i < 6; i++) b.add(cyl(0.08, 0.08, 0.03, 7), C.GOLD, Math.cos(i) * 0.42, 0.02, Math.sin(i) * 0.42, { jitter: 0.2 });
      this.lamp = G.env.addLamp(x, y + 0.6, z, { color: 0xffc24a, intensity: 5, size: 1.0, flame: false });
    } else {
      b.add(sph(0.24, 8, 5), 0xc98a4a, 0, 0.1, 0, { sy: 0.5, grad: 0.2 });
      b.add(box(0.3, 0.03, 0.04), 0x8a5a2a, 0, 0.21, 0);
      b.add(box(0.04, 0.03, 0.3), 0x8a5a2a, 0, 0.21, 0);
    }
    this.mesh = b.build(); this.mesh.position.set(x, y, z); G.scene.add(this.mesh);
  }
  update(dt, G) {
    if (this.taken) return;
    if (this.kind === 'gold') this.mesh.rotation.y += dt * 0.7;
    if (near(G, this.x, this.y, this.z, 1.0)) {
      this.taken = true; this.mesh.visible = false;
      if (this.lamp) this.lamp.on = false;
      G.collect(this.kind);
    }
  }
}

export class Chest {
  constructor(G, x, y, z, ry = 0) {
    Object.assign(this, { x, y, z, open: false });
    const g = this.group = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.scene.add(g);
    const b = new Batch(31);
    b.add(box(1.1, 0.5, 0.7), C.WOOD, 0, 0.25, 0, { jitter: 0.12 });
    for (const k of [-0.4, 0.4]) b.add(box(0.1, 0.52, 0.72), C.GOLD, k, 0.25, 0);
    b.add(box(0.94, 0.06, 0.54), C.GOLD, 0, 0.47, 0, { jitter: 0.25 });
    g.add(b.build());
    const lb = new Batch(32);
    lb.add(box(1.1, 0.2, 0.7), C.WOOD_D, 0, 0.1, 0.35, { jitter: 0.12 });
    for (const k of [-0.4, 0.4]) lb.add(box(0.1, 0.22, 0.72), C.GOLD, k, 0.1, 0.35);
    lb.add(box(0.16, 0.2, 0.06), C.IRON, 0, 0.02, 0.71);
    this.lid = lb.build(); this.lid.position.set(0, 0.5, -0.35); g.add(this.lid);
  }
  prompt(G) { return !this.open && G.canStrike && near(G, this.x, this.y, this.z, 2.3) ? '{strike} — break open the chest' : null; }
  onStrike(G) {
    if (this.open || !near(G, this.x, this.y, this.z, 2.6)) return false;
    this.open = true;
    G.audio.noise(0.2, 300, 1, 0.3);
    G.collect('gold');
    return true;
  }
  update(dt) { this.lid.rotation.x = damp(this.lid.rotation.x, this.open ? -1.9 : 0, 8, dt); }
}

export class Npc {
  constructor(G, x, y, z, ry, o = {}) {
    Object.assign(this, { x, y, z, sit: !!o.sit, bows: o.bows !== false, faces: o.faces !== false, kneel: false, baseYaw: ry });
    this.fig = makeFigure(o);
    this.fig.root.position.set(x, y, z); this.fig.root.rotation.y = ry;
    G.scene.add(this.fig.root);
  }
  update(dt, G) {
    const p = G.player.pos, d = Math.hypot(p.x - this.x, p.z - this.z), r = this.fig.root;
    const closeBy = d < 7 && Math.abs(p.y - this.y) < 3;
    if (this.faces) r.rotation.y = angleDamp(r.rotation.y, closeBy ? Math.atan2(p.x - this.x, p.z - this.z) : this.baseYaw, 4, dt);
    animate(this.fig, dt, { kneel: this.sit || this.kneel, bow: this.bows && closeBy && d < 4 ? 1 : 0 });
  }
}

// A saying cut in stone: it speaks when Moses stands before it.
export class Plaque {
  constructor(G, x, y, z, text, by) { Object.assign(this, { x, y, z, text, by, inside: false, cool: 0 }); }
  update(dt, G) {
    this.cool -= dt;
    const n = near(G, this.x, this.y, this.z, 2.6);
    if (n && !this.inside && this.cool <= 0) { G.hud.say(this.text, this.by); this.cool = 25; }
    this.inside = n;
  }
}

export class WindZone {
  constructor(G, x, y, z0, z1, dir, phase = 0) {
    Object.assign(this, { x, y, z0, z1, dir, phase, period: 4.6, last: 0, level: 0, told: false });
    this.mat = new THREE.MeshBasicMaterial({ color: 0xfff2d8, transparent: true, opacity: 0, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.03, 0.03), this.mat, 40);
    this.mesh.frustumCulled = false;
    this.p = [];
    for (let i = 0; i < 40; i++) this.p.push({ u: Math.random() * 18, y: 0.2 + Math.random() * 2.6, z: z0 + Math.random() * (z1 - z0), v: 0.7 + Math.random() * 0.6 });
    this.m4 = new THREE.Matrix4();
    G.scene.add(this.mesh);
  }
  state(G) { const u = (G.time + this.phase) % this.period; return u < 1.5 ? 2 : u > this.period - 0.9 ? 1 : 0; }
  inside(p) { return p.z > this.z0 && p.z < this.z1 && Math.abs(p.x - this.x) < 4 && Math.abs(p.y - this.y) < 3; }
  force(p, G) { return this.inside(p) && this.state(G) === 2 ? this.dir * 140 : 0; }
  update(dt, G) {
    const st = this.state(G), p = G.player.pos, close = Math.abs(p.z - (this.z0 + this.z1) / 2) < 22;
    if (st === 2 && this.last !== 2 && close) G.audio.noise(1.6, 520, 0.7, 0.22);
    if (st === 1 && this.last !== 1 && close) G.audio.noise(0.9, 900, 3, 0.05);
    this.last = st;
    if (!this.told && this.inside(p)) {
      this.told = true;
      G.hud.say('The wind throws down whoever stands tall. Kneel when it rises, and it passes over you.');
    }
    this.level = damp(this.level, st === 2 ? 0.75 : st === 1 ? 0.2 : 0, 6, dt);
    this.mat.opacity = this.level;
    this.mesh.visible = this.level > 0.01 && close;
    if (!this.mesh.visible) return;
    const sp = st === 2 ? 30 : 7;
    for (let i = 0; i < 40; i++) {
      const s = this.p[i];
      s.u = (s.u + dt * sp * s.v) % 18;
      this.m4.makeTranslation(this.x + this.dir * (s.u - 9), this.y + s.y, s.z);
      this.mesh.setMatrixAt(i, this.m4);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

export class Well {
  constructor(G, x, y, z) { Object.assign(this, { x, y, z, told: false }); }
  can(G) { return near(G, this.x, this.y, this.z, 3) && !G.inv.water && !G.inv.gold && G.stats.served < 3; }
  prompt(G) { return this.can(G) ? '{give} — draw water from the well' : null; }
  onGive(G) {
    if (!this.can(G)) return false;
    G.inv.water = 1;
    G.audio.noise(0.35, 900, 2, 0.2); G.audio.tone(520, 0.25, 'sine', 0.06, -220);
    if (!this.told) { this.told = true; G.hud.say('Carry it to an elder’s door. The blue lights mark the jars that stand empty.'); }
    return true;
  }
  update() {}
}

export class Elder {
  constructor(G, cx, y, cz, ry) {
    const dx = Math.sin(ry), dz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry);
    Object.assign(this, { y, served: false });
    this.jx = cx + dx * 3.0 + sx * 1.0; this.jz = cz + dz * 3.0 + sz * 1.0;
    this.x = cx + dx * 2.7 - sx * 1.0; this.z = cz + dz * 2.7 - sz * 1.0;
    const b = new Batch(77); jar(b, 0, 0, 0, 1.25);
    const jm = b.build(); jm.position.set(this.jx, y, this.jz); G.scene.add(jm);
    this.water = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 8), new THREE.MeshBasicMaterial({ color: 0x6fc8f0 }));
    this.water.position.set(this.jx, y + 1.36, this.jz); this.water.visible = false; G.scene.add(this.water);
    this.fig = makeFigure({ robe: 0xcdbb96, hood: 0xe6dcc4, beard: 0xe8e4da, trim: 0x8a6a4a, skin: 0x8a5f42, staff: true, cross: true });
    this.fig.root.position.set(this.x, y, this.z); this.fig.root.rotation.y = this.yaw = ry;
    G.scene.add(this.fig.root);
    this.marker = G.env.addLamp(this.jx, y + 2.0, this.jz, { color: 0x7fd0ff, intensity: 0, size: 1.3, flame: false });
    this.lamp = G.env.addLamp(cx + dx * 2.0 - sx * 0.85, y + 1.75, cz + dz * 2.0 - sz * 0.85, { on: false, intensity: 16, size: 1.3 });
  }
  can(G) { return !this.served && G.inv.water > 0 && near(G, this.jx, this.y, this.jz, 2.4); }
  prompt(G) { return this.can(G) ? '{give} — fill the elder’s jar' : null; }
  onGive(G) {
    if (!this.can(G)) return false;
    this.served = true; this.water.visible = true; this.marker.on = false; this.lamp.on = true;
    G.inv.water = 0;
    G.audio.noise(0.4, 1200, 2, 0.15);
    G.serveElder(this);
    return true;
  }
  update(dt, G) {
    const p = G.player.pos, d = Math.hypot(p.x - this.x, p.z - this.z);
    if (this.served && d < 9) this.yaw = angleDamp(this.yaw, Math.atan2(p.x - this.x, p.z - this.z), 4, dt);
    this.fig.root.rotation.y = this.yaw;
    animate(this.fig, dt, { kneel: !this.served, bow: this.served && d < 4.5 ? 1 : 0 });
  }
}

// The stair the elders set against the cliff, one step for each jar filled.
export class Stair {
  constructor(G, x, y, zf) {
    this.steps = [1, 2, 3].map(k => {
      const b = new Batch(90 + k); woodStep(b, 4, 2.4, 1.5 * k);
      const m = b.build(), top = y + 1.5 * k, z = zf + 1.2 + 2.4 * (3 - k);
      m.position.set(x, top + 9, z); m.visible = false; G.scene.add(m);
      const col = { x0: x - 2, x1: x + 2, y0: y, y1: top, z0: z - 1.2, z1: z + 1.2, on: false, safe: true };
      G.colliders.push(col);
      return { m, col, top, x, z, t: -1 };
    });
  }
  show(k) { const s = this.steps[k]; if (s && s.t < 0) { s.t = 0; s.m.visible = true; s.col.on = true; } }
  update(dt, G) {
    for (const s of this.steps) {
      if (s.t < 0 || s.t >= 1) continue;
      s.t = Math.min(1, s.t + dt * 1.5);
      s.m.position.y = s.top + 9 * (1 - s.t) ** 3;
      if (s.t >= 1) G.audio.noise(0.18, 160, 1, 0.3);
    }
  }
}

const MONK = { robe: new THREE.Color(0x6b4a32), hood: new THREE.Color(0x2c2420), trim: new THREE.Color(0xd8c8a0) };

export class Raider {
  constructor(G, x, y, z0, z1, home) {
    Object.assign(this, { x, y, z: (z0 + z1) / 2, z0, z1, home, dir: 1, hostile: true, t: 0, state: 'patrol', cool: 0, yaw: 0, moving: true });
    this.fig = makeFigure({ robe: 0x2a2430, hood: 0x8a1c1c, trim: 0x7a1c1c, beard: 0x0d0a08, headwear: 'turban', sword: true, own: true, scale: 1.08 });
    G.scene.add(this.fig.root);
  }
  dist(G) { const p = G.player.pos; return Math.abs(p.y - this.y) < 2.2 ? Math.hypot(p.x - this.x, p.z - this.z) : 99; }
  prompt(G) {
    if (!this.hostile || this.dist(G) > 7) return null;
    return G.inv.bread ? 'Hold {kneel} — ask his forgiveness   ·   {give} — offer him bread' : 'You carry no sword. Hold {kneel} — ask his forgiveness';
  }
  onGive(G) {
    if (!this.hostile || !G.inv.bread || this.dist(G) > 7) return false;
    G.inv.bread--;
    this.forgive(G, 'bread');
    return true;
  }
  forgive(G, how) {
    this.hostile = false; this.state = 'turn'; this.t = 0; this.moving = false;
    this.fig.sword.visible = false;
    G.audio.noise(0.25, 2400, 6, 0.12);
    G.onForgiven(this, how);
  }
  update(dt, G) {
    const p = G.player.pos, d = this.dist(G), f = this.fig;
    let bow = 0, face = this.yaw;
    if (this.hostile) {
      const pk = G.player.kneeling && d < 6.5;
      if (pk) {
        this.t += dt; this.moving = false;
        face = Math.atan2(p.x - this.x, p.z - this.z);
        if (this.t > 1.8) this.forgive(G, 'kneel');
      } else {
        this.t = Math.max(0, this.t - dt); this.moving = true;
        this.z += this.dir * 2.1 * dt;
        if (this.z > this.z1) { this.z = this.z1; this.dir = -1; }
        if (this.z < this.z0) { this.z = this.z0; this.dir = 1; }
        face = this.dir > 0 ? 0 : Math.PI;
      }
      this.cool -= dt;
      if (d < 1.05 && this.cool <= 0 && !pk) {
        const nx = d > 0.05 ? (p.x - this.x) / d : 0, nz = d > 0.05 ? (p.z - this.z) / d : 1;
        G.player.knock(nx * 8.5, 6.5, nz * 8.5);
        this.cool = 0.8;
        G.audio.noise(0.15, 140, 1, 0.35);
        G.onShoved();
      }
    } else {
      const k = Math.min(1, dt * 0.9);
      f.m.robeM.color.lerp(MONK.robe, k); f.m.hoodM.color.lerp(MONK.hood, k); f.m.trimM.color.lerp(MONK.trim, k);
      if (this.state === 'turn') {
        this.t += dt; bow = 1;
        face = Math.atan2(p.x - this.x, p.z - this.z);
        if (this.t > 1.8) { this.state = 'go'; f.turban.visible = false; f.hood.visible = true; f.chestCross.visible = true; }
      } else if (this.state === 'go') {
        const hx = this.home.x - this.x, hz = this.home.z - this.z, hd = Math.hypot(hx, hz);
        this.moving = true;
        if (hd < 0.15) { this.state = 'home'; this.moving = false; this.y = this.home.y; }
        else {
          this.x += hx / hd * 2.8 * dt; this.z += hz / hd * 2.8 * dt; face = Math.atan2(hx, hz);
          if (hd < 1.6) this.y = damp(this.y, this.home.y, 10, dt);
        }
      } else {
        this.moving = false;
        if (d < 9) face = Math.atan2(p.x - this.x, p.z - this.z);
        bow = d < 4 ? 1 : 0;
      }
    }
    this.yaw = angleDamp(this.yaw, face, 8, dt);
    f.root.position.set(this.x, this.y, this.z); f.root.rotation.y = this.yaw;
    animate(f, dt, { speed: this.moving ? 2.2 : 0, bow });
  }
}

export class Door {
  constructor(G, x, y, z, w) {
    Object.assign(this, { x, y, z, open: false, t: 0 });
    const b = new Batch(61);
    b.add(box(w, 5, 0.5), C.STONE, 0, 2.5, 0, { grad: 0.3, jitter: 0.06 });
    b.add(box(w - 0.5, 4.5, 0.08), C.STONE_D, 0, 2.5, 0.27);
    b.add(box(0.22, 2.6, 0.08), C.GOLD, 0, 2.7, 0.33);
    b.add(box(1.3, 0.22, 0.08), C.GOLD, 0, 3.3, 0.33);
    for (const kx of [-1, 1]) for (const ky of [0.6, 4.4]) b.add(sph(0.1, 6, 4), C.IRON, kx * (w / 2 - 0.4), ky, 0.3);
    this.mesh = b.build(); this.mesh.position.set(x, y, z); G.scene.add(this.mesh);
    this.col = { x0: x - w / 2, x1: x + w / 2, y0: y - 0.1, y1: y + 5, z0: z - 0.3, z1: z + 0.3, on: true, safe: false };
    G.colliders.push(this.col);
  }
  prompt(G) { return !this.open && near(G, this.x, this.y, this.z + 1.5, 3.4) ? 'The door is shut.  “First be reconciled to your brother.” — Matthew 5:24' : null; }
  openUp(G) { if (!this.open) { this.open = true; G.audio.noise(2.2, 90, 0.6, 0.4); } }
  update(dt) {
    if (!this.open || this.t >= 1) return;
    this.t = Math.min(1, this.t + dt * 0.45);
    this.mesh.position.y = this.y - 5.3 * this.t;
    this.col.y1 = this.y + 5 - 5.3 * this.t;
    if (this.t >= 1) this.col.on = false;
  }
}

const LIFE = 18, CHIME = [392, 440, 523.25, 587.33, 659.25, 783.99];

// A place of prayer. Kneel here in stillness and a path of light appears for a while.
export class PrayerSpot {
  constructor(G, x, y, z, plats) {
    Object.assign(this, { x, y, z, plats, life: 0, t: 0, used: false });
    const geo = new THREE.CylinderGeometry(1.75, 1.45, 0.28, 6);
    for (const pl of plats) {
      pl.mat = new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0, fog: false, depthWrite: false });
      pl.mesh = new THREE.Mesh(geo, pl.mat); pl.mesh.position.set(pl.x, pl.y - 0.14, pl.z); pl.mesh.visible = false; G.scene.add(pl.mesh);
      pl.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.env.glow, color: 0xffdf90, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      pl.glow.position.set(pl.x, pl.y - 0.3, pl.z); pl.glow.scale.setScalar(6.5); G.scene.add(pl.glow);
      pl.born = false;
    }
    this.ringM = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.3, 40), this.ringM);
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.set(x, y + 0.08, z); G.scene.add(this.ring);
  }
  get active() { return this.life > 0; }
  prompt(G) {
    if (this.life > 4 || !near(G, this.x, this.y, this.z, 1.7)) return null;
    return G.player.kneeling ? 'Be still…' : 'Hold {kneel} here, and be still';
  }
  update(dt, G) {
    const praying = near(G, this.x, this.y, this.z, 1.7) && G.player.kneeling && G.player.speed < 0.4;
    if (praying && this.life <= 4) {
      this.t += dt;
      if (this.t > 2) { this.life = LIFE; this.t = 0; for (const pl of this.plats) pl.born = false; G.onPrayer(this); this.used = true; }
    } else this.t = Math.max(0, this.t - dt * 2);
    this.ringM.opacity = 0.22 + 0.1 * Math.sin(G.time * 2.4) + this.t * 0.3;
    this.ring.scale.setScalar(1 + this.t * 0.12);
    if (this.life > 0) this.life -= dt;
    this.plats.forEach((pl, i) => {
      let a = 0;
      if (this.life > 0) {
        a = clamp((LIFE - this.life - i * 0.28) / 0.4, 0, 1);
        if (a > 0.5 && !pl.born) { pl.born = true; G.audio.bell(CHIME[i % 6], 0.08, 1.6); }
        if (this.life < 4) a *= Math.min(1, this.life) * (0.45 + 0.55 * Math.abs(Math.sin(this.life * 5)));
      }
      pl.col.on = this.life > 0.05 && pl.born;
      pl.mat.opacity = a * 0.9; pl.glow.material.opacity = a * 0.55;
      pl.mesh.visible = pl.glow.visible = a > 0.01;
      pl.mesh.rotation.y = G.time * 0.2 + i;
    });
  }
}
