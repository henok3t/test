import * as THREE from 'three';
import { makeFigure, animate } from './figure.js';
import { damp, clamp, angleDamp } from './util.js';

const HALF = 0.35, H_STAND = 1.75, H_KNEEL = 1.0, EPS = 1e-3;
export const JUMP_V = 11, GRAVITY = 28, SPEED = 6;

export class Player {
  constructor(G, x, y, z) {
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3();
    this.safe = new THREE.Vector3(x, y, z);
    this.h = H_STAND; this.yaw = Math.PI;
    this.grounded = false; this.kneeling = false; this.ground = null;
    this.coyote = 0; this.buffer = 0; this.stun = 0; this.strikeT = 0;
    this.blocked = false; this.blockedBy = null; this.speed = 0;
    this.fig = makeFigure({ robe: 0x7a2d22, hood: 0x8e1f1f, trim: 0xd0a84a, headwear: 'turban', own: true });
    G.scene.add(this.fig.root);
  }

  becomeMonk() {
    const f = this.fig;
    f.m.robeM.color.setHex(0x6b4a32); f.m.hoodM.color.setHex(0x2c2420); f.m.trimM.color.setHex(0xd8c8a0);
    f.m.beardM.color.setHex(0x2a2522);
    f.turban.visible = false; f.hood.visible = true; f.chestCross.visible = true;
  }

  overlaps(c, h) {
    const p = this.pos;
    return c.on && p.x + HALF > c.x0 && p.x - HALF < c.x1 && p.z + HALF > c.z0 && p.z - HALF < c.z1 && p.y + h > c.y0 && p.y < c.y1;
  }

  canStand(G) {
    for (const c of G.colliders) if (this.overlaps(c, H_STAND)) return false;
    return true;
  }

  knock(vx, vy, vz) { this.vel.set(vx, vy, vz); this.stun = 0.45; this.grounded = false; }

  moveAxis(a, d, G) {
    if (!d) return;
    const p = this.pos;
    p[a] += d;
    for (const c of G.colliders) {
      if (!this.overlaps(c, this.h)) continue;
      if (this.grounded && c.y1 - p.y <= 0.42) {           // walk up small steps
        const oy = p.y; p.y = c.y1;
        let ok = true;
        for (const c2 of G.colliders) if (c2 !== c && this.overlaps(c2, this.h)) { ok = false; break; }
        if (ok) continue;
        p.y = oy;
      }
      if (a === 'x') p.x = d > 0 ? c.x0 - HALF - EPS : c.x1 + HALF + EPS;
      else p.z = d > 0 ? c.z0 - HALF - EPS : c.z1 + HALF + EPS;
      this.vel[a] = 0; this.blocked = true; this.blockedBy = c;
    }
  }

  update(dt, G) {
    const inp = G.input, cam = G.cam;
    let dx, dz;
    if (inp.botDir) { dx = inp.botDir.x; dz = inp.botDir.z; }
    else {
      const s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
      dx = c * inp.mx - s * inp.my; dz = -s * inp.mx - c * inp.my;
    }
    if (G.frozen) { dx = dz = 0; }
    const len = Math.hypot(dx, dz);
    if (len > 1) { dx /= len; dz /= len; }
    if (this.stun > 0) { this.stun -= dt; dx *= 0.15; dz *= 0.15; }

    if ((inp.kneel && this.grounded && !G.frozen) || G.forceKneel) this.kneeling = true;
    else if (this.kneeling && this.canStand(G)) this.kneeling = false;
    this.h = this.kneeling ? H_KNEEL : H_STAND;

    const gold = Math.min(3, G.inv.gold);
    const speed = this.kneeling ? 2.4 : SPEED - 0.8 * gold;
    const k = this.grounded ? 14 : 6;
    this.vel.x = damp(this.vel.x, dx * speed, k, dt);
    this.vel.z = damp(this.vel.z, dz * speed, k, dt);
    const wind = G.windAt(this.pos);
    if (wind && !this.kneeling) this.vel.x += wind * dt;

    this.coyote = this.grounded ? 0.1 : this.coyote - dt;
    this.buffer = inp.consume('jump') ? 0.13 : this.buffer - dt;
    if (this.buffer > 0 && this.coyote > 0 && !this.kneeling && this.stun <= 0 && !G.frozen) {
      this.vel.y = JUMP_V - 1.4 * gold;
      this.coyote = 0; this.buffer = 0; this.grounded = false;
      G.audio.tone(gold ? 150 : 220, 0.16, 'sine', 0.07, 160);
    }
    if (this.vel.y > 0 && !inp.jump && !inp.botDir) this.vel.y -= 26 * dt;   // release early for a short hop
    this.vel.y = Math.max(-45, this.vel.y - GRAVITY * dt);

    this.blocked = false;
    this.moveAxis('x', this.vel.x * dt, G);
    this.moveAxis('z', this.vel.z * dt, G);
    const wasGrounded = this.grounded, vy = this.vel.y;
    this.grounded = false;
    this.pos.y += vy * dt;
    for (const c of G.colliders) {
      if (!this.overlaps(c, this.h)) continue;
      if (vy <= 0) {
        if (c.y1 - this.pos.y > -vy * dt + 0.45) continue;
        this.pos.y = c.y1; this.grounded = true; this.ground = c;
      } else this.pos.y = c.y0 - this.h - EPS;
      this.vel.y = 0;
    }
    if (this.grounded && !wasGrounded && vy < -9) G.audio.noise(0.12, 180, 0.8, Math.min(0.25, -vy * 0.012));

    if (this.grounded && this.ground.safe && this.stun <= 0) {
      const c = this.ground;
      const cx = c.x1 - c.x0 > 1.6 ? clamp(this.pos.x, c.x0 + 0.8, c.x1 - 0.8) : (c.x0 + c.x1) / 2;
      const cz = c.z1 - c.z0 > 1.6 ? clamp(this.pos.z, c.z0 + 0.8, c.z1 - 0.8) : (c.z0 + c.z1) / 2;
      this.safe.set(cx, c.y1, cz);
    }

    this.speed = Math.hypot(this.vel.x, this.vel.z);
    if (len > 0.1) this.yaw = angleDamp(this.yaw, Math.atan2(dx, dz), 12, dt);
    if (this.strikeT > 0) this.strikeT -= dt * 3;
    this.syncFigure(dt, G);
  }

  syncFigure(dt, G) {
    const f = this.fig;
    f.root.position.copy(this.pos);
    f.root.rotation.y = this.yaw;
    f.sack.visible = G.inv.gold > 0;
    f.sack.scale.setScalar(0.8 + 0.25 * Math.min(4, G.inv.gold));
    f.jar.visible = G.inv.water > 0;
    animate(f, dt, { speed: this.grounded ? this.speed : 0, air: !this.grounded, kneel: this.kneeling, carry: G.inv.water > 0, strike: this.strikeT > 0 ? this.strikeT : 0 });
  }
}
