// World-building helpers: every static object in the game is low-poly geometry generated here,
// vertex-coloured and merged into one mesh per stage so the whole climb is a handful of draw calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, fbm, lerp } from './util.js';

export const C = {
  SAND: 0xdcc095, SAND_L: 0xead6ae, SAND_D: 0xb8935f,
  ROCK: 0xb98258, ROCK_D: 0x8f5f40, ROCK_R: 0xc56f48, ROCK_P: 0x9a6a5a,
  MUD: 0xd2b182, MUD_L: 0xe6cfa4, MUD_D: 0xa88455, WHITE: 0xefe6d0,
  WOOD: 0x7d5535, WOOD_D: 0x573821, TRUNK: 0x6e5540, ROPE: 0xb39b6a,
  RED: 0xa8322a, BLUE: 0x2f4f7a, CREAM: 0xe8dcc0, OCHRE: 0xc98f3a,
  PALM: 0x56803c, PALM_D: 0x3d6430, GRASS: 0x9a8f55, GREEN: 0x6f9a4a,
  CLAY: 0xb5683e, STONE: 0xa39c8e, STONE_D: 0x756f64,
  GOLD: 0xe0aa3e, DARK: 0x1c1612, THORN: 0x2d1c26, IRON: 0x9a9ea8, WATER: 0x2f6f8f,
};

const _col = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
const _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();

export const flatMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 });

export const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
export const cyl = (rt, rb, h, n = 8, hs = 1) => new THREE.CylinderGeometry(rt, rb, h, n, hs);
export const sph = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
export const dome = (r, w = 10, h = 5) => new THREE.SphereGeometry(r, w, h, 0, Math.PI * 2, 0, Math.PI / 2);
export const cone = (r, h, n = 8) => new THREE.ConeGeometry(r, h, n);
export const ico = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);

export class Batch {
  constructor(seed = 1) { this.g = []; this.rand = rng(seed); }

  // color: hex, or fn(x, y, z) -> hex evaluated per face. Options: rx ry rz, s sx sy sz, jitter, grad.
  add(geom, color, x = 0, y = 0, z = 0, o = {}) {
    const g = geom.index ? geom.toNonIndexed() : geom;
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    const s = o.s ?? 1;
    _e.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ');
    _q.setFromEuler(_e);
    _m.compose(_p.set(x, y, z), _q, _s.set((o.sx ?? 1) * s, (o.sy ?? 1) * s, (o.sz ?? 1) * s));
    g.applyMatrix4(_m);
    const pos = g.attributes.position, n = pos.count, col = new Float32Array(n * 3);
    let minY = Infinity, maxY = -Infinity;
    if (o.grad) for (let i = 0; i < n; i++) { const v = pos.getY(i); if (v < minY) minY = v; if (v > maxY) maxY = v; }
    const jit = o.jitter ?? 0.1, fn = typeof color === 'function' ? color : null;
    if (!fn) _col.setHex(color);
    for (let i = 0; i + 2 < n; i += 3) {
      const j = 1 + (this.rand() - 0.5) * 2 * jit;
      if (fn) _col.setHex(fn((pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3, (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3));
      for (let k = 0; k < 3; k++) {
        let f = j;
        if (o.grad) f *= lerp(1 - o.grad, 1, (pos.getY(i + k) - minY) / (maxY - minY || 1));
        col[(i + k) * 3] = _col.r * f; col[(i + k) * 3 + 1] = _col.g * f; col[(i + k) * 3 + 2] = _col.b * f;
      }
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.g.push(g);
    return this;
  }

  build() {
    const geo = mergeGeometries(this.g, false);
    for (const g of this.g) g.dispose();
    this.g.length = 0;
    const m = new THREE.Mesh(geo, flatMat);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
}

// Place parts in the local frame of an object standing at (x, y, z) and turned by ry.
function at(b, x, y, z, ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return (geom, color, lx = 0, ly = 0, lz = 0, o = {}) =>
    b.add(geom, color, x + lx * c + lz * s, y + ly, z - lx * s + lz * c, { ...o, ry: (o.ry || 0) + ry });
}

function warp(g, amp, seed) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 1 + (fbm(x * 1.7 + seed, y * 1.7 + z * 1.3 + seed) - 0.5) * 2 * amp;
    p.setXYZ(i, x * n, y * n, z * n);
  }
  return g;
}

export function rock(b, x, y, z, s = 1, color = C.ROCK) {
  const R = b.rand;
  b.add(warp(ico(1, 1), 0.35, R() * 50), color, x, y + s * 0.3, z,
    { sx: s * (0.8 + R() * 0.5), sy: s * (0.5 + R() * 0.4), sz: s * (0.8 + R() * 0.5), ry: R() * 6, grad: 0.3 });
}

export function tuft(b, x, y, z, s = 1) {
  const R = b.rand;
  for (let i = 0; i < 4; i++)
    b.add(cone(0.05 * s, (0.3 + R() * 0.3) * s, 3), C.GRASS, x + (R() - 0.5) * 0.25, y + 0.18 * s, z + (R() - 0.5) * 0.25,
      { rx: (R() - 0.5) * 0.7, rz: (R() - 0.5) * 0.7, jitter: 0.2 });
}

// A sandstone tower: a flat cap you can stand on, and a weathered, banded column falling away below it.
export function mesa(b, x, y, z, w, d, o = {}) {
  const R = b.rand, depth = o.depth ?? 18, seed = R() * 100;
  b.add(box(w + 0.16, 0.45, d + 0.16), o.top ?? C.SAND, x, y - 0.225, z, { jitter: 0.05 });
  const g = cyl(1, o.taper ?? (0.8 + R() * 0.3), depth, 12, 6), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i), py = p.getY(i), pz = p.getZ(i), rr = Math.hypot(px, pz);
    if (rr < 1e-4) continue;
    const th = Math.atan2(pz, px), sq = 1 / Math.pow(Math.cos(th) ** 4 + Math.sin(th) ** 4, 0.25), t = 0.5 - py / depth;
    const n = 1 + (fbm(Math.cos(th) * 1.6 + seed, py * 0.3 + Math.sin(th) * 1.6 + seed) - 0.5) * 0.7 * Math.min(1, t * 4);
    p.setXYZ(i, px * sq * n, py, pz * sq * n);
  }
  const bands = [C.ROCK, C.ROCK_R, C.ROCK_D, C.ROCK, C.ROCK_P];
  const band = (cx, cy, cz) => bands[((Math.floor((cy + fbm(cx * 0.2, cz * 0.2) * 2.5) * 0.55) % 5) + 5) % 5];
  b.add(g, band, x, y - 0.45 - depth / 2, z, { sx: w / 2 * 0.98, sz: d / 2 * 0.98, grad: 0.5, jitter: 0.1 });
  const n = o.scatter ?? Math.round(w * d / 14);
  for (let i = 0; i < n; i++) {
    const rx = x + (R() - 0.5) * (w - 0.8), rz = z + (R() - 0.5) * (d - 0.8);
    if (R() < 0.55) rock(b, rx, y - 0.05, rz, 0.1 + R() * 0.16, C.ROCK_D); else tuft(b, rx, y, rz);
  }
}

export function stoneStep(b, x, y, z, w, d) {
  b.add(box(w, 0.9, d), C.STONE, x, y - 0.45, z, { jitter: 0.07, grad: 0.2 });
  b.add(box(w + 0.1, 0.08, d + 0.06), C.WHITE, x, y - 0.04, z, { jitter: 0.04 });
}

export function bridge(b, x, y, z, w, d) {
  const R = b.rand, n = Math.round(d / 0.5);
  for (let i = 0; i < n; i++)
    b.add(box(w - 0.12 + R() * 0.1, 0.1, d / n - 0.07), R() < 0.5 ? C.WOOD : C.WOOD_D, x, y - 0.05 - R() * 0.02, z - d / 2 + (i + 0.5) * d / n, { ry: (R() - 0.5) * 0.05, jitter: 0.15 });
  for (const sx of [-1, 1]) {
    b.add(box(0.14, 0.16, d), C.WOOD_D, x + sx * (w / 2 - 0.2), y - 0.18, z);
    const posts = Math.max(2, Math.round(d / 3.2)) + 1;
    for (let k = 0; k < posts; k++) b.add(cyl(0.06, 0.07, 1.2, 5), C.WOOD_D, x + sx * (w / 2 + 0.02), y + 0.45, z - d / 2 + k * d / (posts - 1));
    b.add(box(0.035, 0.035, d), C.ROPE, x + sx * (w / 2 + 0.02), y + 0.95, z);
    b.add(box(0.03, 0.03, d), C.ROPE, x + sx * (w / 2 + 0.02), y + 0.55, z);
  }
}

// Wooden scaffold step, with its top surface at local y = 0. Used for the stair the elders set up.
export function woodStep(b, w, d, post) {
  const R = b.rand, n = Math.round(d / 0.45);
  for (let i = 0; i < n; i++) b.add(box(w, 0.12, d / n - 0.05), R() < 0.5 ? C.WOOD : C.WOOD_D, 0, -0.06, -d / 2 + (i + 0.5) * d / n, { jitter: 0.15 });
  for (const sx of [-1, 1]) {
    b.add(box(0.16, 0.18, d), C.WOOD_D, sx * (w / 2 - 0.2), -0.2, 0);
    for (const sz of [-1, 1]) b.add(cyl(0.09, 0.1, post, 6), C.WOOD_D, sx * (w / 2 - 0.2), -0.12 - post / 2, sz * (d / 2 - 0.2));
    b.add(box(0.08, 0.08, Math.hypot(d, post) * 0.9), C.WOOD, sx * (w / 2 - 0.2), -post / 2, 0, { rx: Math.atan2(post, d) });
  }
}

export function palm(b, x, y, z, h = 5) {
  const R = b.rand, lean = (R() - 0.5) * 0.3, la = R() * 6.28, segs = 6;
  let tx = x, tz = z;
  for (let i = 0; i < segs; i++) {
    const t = i / segs, off = lean * h * t * t;
    tx = x + Math.cos(la) * off; tz = z + Math.sin(la) * off;
    b.add(cyl(0.15 - 0.05 * t, 0.2 - 0.05 * t, h / segs + 0.06, 6), i % 2 ? C.TRUNK : C.WOOD, tx, y + t * h + h / segs / 2, tz, { jitter: 0.15 });
  }
  const ty = y + h;
  for (let i = 0; i < 9; i++) {
    const L = 2.3 + R() * 0.8, g = box(0.6, 0.04, L, 1, 1, 5);
    g.translate(0, 0, L / 2);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const t = p.getZ(k) / L;
      p.setXYZ(k, p.getX(k) * (1 - t * 0.85), p.getY(k) + 0.55 * t - 1.25 * t * t, p.getZ(k));
    }
    b.add(g, i % 2 ? C.PALM : C.PALM_D, tx, ty, tz, { ry: i / 9 * 6.283 + R() * 0.4, rx: -0.15 + R() * 0.3, jitter: 0.15 });
  }
  for (let i = 0; i < 5; i++) b.add(sph(0.12, 5, 4), C.OCHRE, tx + (R() - 0.5) * 0.4, ty - 0.2 - R() * 0.2, tz + (R() - 0.5) * 0.4);
}

export function deadTree(b, x, y, z, h = 3) {
  const R = b.rand;
  b.add(cyl(0.1, 0.2, h, 6), C.TRUNK, x, y + h / 2, z, { rz: 0.08, jitter: 0.15 });
  for (let i = 0; i < 5; i++) {
    const a = R() * 6.28, L = 0.8 + R() * 1.1, yy = y + h * (0.5 + R() * 0.5), tilt = 0.7 + R() * 0.5;
    b.add(cyl(0.03, 0.07, L, 5), C.TRUNK, x + Math.sin(a) * Math.sin(tilt) * L / 2, yy + Math.cos(tilt) * L / 2, z + Math.cos(a) * Math.sin(tilt) * L / 2, { ry: a, rx: tilt });
  }
}

export function acacia(b, x, y, z, h = 3.4) {
  const R = b.rand;
  b.add(cyl(0.12, 0.22, h, 6), C.TRUNK, x, y + h / 2, z, { rz: 0.1 });
  for (let i = 0; i < 4; i++) {
    const a = i * 1.57 + R(), r = 0.9 + R() * 0.6;
    b.add(warp(ico(1, 1), 0.25, R() * 30), i % 2 ? C.PALM_D : C.GREEN, x + Math.cos(a) * r, y + h + 0.1, z + Math.sin(a) * r, { sx: 1.5, sy: 0.38, sz: 1.5, grad: 0.35 });
  }
  b.add(warp(ico(1, 1), 0.25, R() * 30), C.GREEN, x, y + h + 0.45, z, { sx: 1.9, sy: 0.45, sz: 1.9, grad: 0.35 });
}

export function tent(b, x, y, z, ry = 0, color = C.RED) {
  const a = at(b, x, y, z, ry);
  const stripe = (cx, cy, cz) => (Math.floor(Math.atan2(cz - z, cx - x) * 3.2 + 20) % 2 ? color : C.CREAM);
  a(cone(2.3, 2.7, 8), stripe, 0, 1.35, 0, { jitter: 0.06, grad: 0.25 });
  a(box(0.9, 1.5, 0.1), C.DARK, 0, 0.75, 1.72, { rx: -0.62 });
  a(cyl(0.05, 0.05, 0.8, 5), C.WOOD_D, 0, 3.0, 0);
  a(box(0.5, 0.25, 0.03), C.GOLD, 0.26, 3.25, 0);
  for (let i = 0; i < 4; i++) {
    const an = i * 1.57 + 0.78;
    a(cyl(0.03, 0.03, 0.5, 4), C.WOOD_D, Math.cos(an) * 2.7, 0.2, Math.sin(an) * 2.7, { rz: 0.4 });
  }
}

export function campfire(b, x, y, z) {
  const R = b.rand;
  for (let i = 0; i < 8; i++) rock(b, x + Math.cos(i * 0.785) * 0.75, y - 0.05, z + Math.sin(i * 0.785) * 0.75, 0.2 + R() * 0.08, C.STONE_D);
  for (let i = 0; i < 4; i++) b.add(cyl(0.08, 0.1, 1.1, 5), C.WOOD_D, x, y + 0.22, z, { ry: i * 0.8, rx: 1.15 });
}

export function crate(b, x, y, z, s = 0.9, ry = 0) {
  const a = at(b, x, y, z, ry);
  a(box(s, s, s), C.WOOD, 0, s / 2, 0, { jitter: 0.12 });
  for (const k of [-1, 1]) {
    a(box(s + 0.04, 0.09, s + 0.04), C.WOOD_D, 0, s / 2 + k * s * 0.38, 0);
    a(box(0.09, s, s + 0.04), C.WOOD_D, k * s * 0.42, s / 2, 0);
  }
}

export function barrel(b, x, y, z) {
  b.add(cyl(0.34, 0.42, 0.5, 10), C.WOOD, x, y + 0.75, z);
  b.add(cyl(0.42, 0.34, 0.5, 10), C.WOOD, x, y + 0.25, z);
  for (const yy of [0.12, 0.5, 0.88]) b.add(cyl(0.43, 0.43, 0.06, 10), C.IRON, x, y + yy, z);
}

export function sack(b, x, y, z, s = 1) {
  b.add(sph(0.36, 7, 5), C.SAND_D, x, y + 0.27 * s, z, { sx: s, sy: s * 0.85, sz: s, grad: 0.3 });
  b.add(cone(0.12, 0.2, 5), C.SAND_D, x, y + 0.62 * s, z, { s });
}

export function jar(b, x, y, z, s = 1, color = C.CLAY) {
  b.add(sph(0.36, 8, 6), color, x, y + 0.42 * s, z, { sx: s, sy: s * 1.2, sz: s, grad: 0.3 });
  b.add(cyl(0.14, 0.2, 0.25, 8), color, x, y + 0.9 * s, z, { s });
  b.add(cyl(0.2, 0.16, 0.07, 8), color, x, y + 1.05 * s, z, { s });
}

export function rug(b, x, y, z, w, d, ry = 0, c1 = C.RED, c2 = C.CREAM) {
  const a = at(b, x, y, z, ry);
  a(box(w, 0.04, d), c1, 0, 0.02, 0, { jitter: 0.05 });
  for (const k of [-0.36, -0.22, 0.22, 0.36]) a(box(w, 0.045, d * 0.05), c2, 0, 0.022, k * d);
  a(box(w * 0.35, 0.046, d * 0.2), C.OCHRE, 0, 0.022, 0);
}

export function swordStuck(b, x, y, z, ry = 0) {
  const a = at(b, x, y, z, ry);
  a(box(0.07, 0.8, 0.02), C.IRON, 0, 0.42, 0, { rz: 0.15 });
  a(box(0.3, 0.05, 0.05), C.GOLD, -0.12, 0.84, 0, { rz: 0.15 });
  a(cyl(0.03, 0.03, 0.2, 5), C.WOOD_D, -0.14, 0.95, 0, { rz: 0.15 });
}

export function cross(b, x, y, z, s = 1, color = C.GOLD, ry = 0) {
  const a = at(b, x, y, z, ry);
  a(box(0.1 * s, 1.0 * s, 0.1 * s), color, 0, 0.5 * s, 0, { jitter: 0.04 });
  a(box(0.56 * s, 0.1 * s, 0.1 * s), color, 0, 0.68 * s, 0, { jitter: 0.04 });
}

// A monastic cell: round mud-brick wall, dome, low door, cross.
export function cell(b, x, y, z, ry = 0, o = {}) {
  const a = at(b, x, y, z, ry), r = o.r ?? 1.9, h = o.h ?? 2.0;
  a(cyl(r, r * 1.07, h, 12), C.MUD, 0, h / 2, 0, { grad: 0.25 });
  a(cyl(r * 1.03, r * 1.03, 0.14, 12), C.WHITE, 0, h, 0);
  a(dome(r * 0.97, 12, 5), C.MUD_L, 0, h, 0, { sy: 0.78, grad: 0.15 });
  a(box(0.85, 1.35, 0.3), C.DARK, 0, 0.68, r * 0.97);
  a(box(1.15, 0.16, 0.42), C.WOOD_D, 0, 1.44, r * 0.98);
  for (const k of [-1, 1]) a(box(0.14, 1.4, 0.4), C.WOOD_D, k * 0.5, 0.7, r * 0.98);
  a(box(0.4, 0.4, 0.3), C.DARK, r * 0.95, 1.2, 0, { ry: 1.57 });
  cross(b, x, y + h + r * 0.74, z, 0.75, C.GOLD, ry);
  a(box(1.5, 0.1, 0.8), C.STONE, 0, 0.05, r + 0.5);
}

export function well(b, x, y, z) {
  for (let l = 0; l < 2; l++)
    for (let i = 0; i < 10; i++) {
      const a = (i + l * 0.5) / 10 * 6.283;
      b.add(box(0.72, 0.36, 0.32), l ? C.STONE : C.STONE_D, x + Math.cos(a) * 1.1, y + 0.18 + l * 0.36, z + Math.sin(a) * 1.1, { ry: -a + 1.57, jitter: 0.12 });
    }
  b.add(cyl(1.0, 1.0, 0.1, 12), C.WATER, x, y + 0.42, z, { jitter: 0.06 });
  for (const k of [-1, 1]) b.add(cyl(0.08, 0.1, 2.3, 6), C.WOOD_D, x + k * 1.25, y + 1.15, z);
  b.add(cyl(0.07, 0.07, 2.9, 6), C.WOOD, x, y + 2.25, z, { rz: 1.5708 });
  b.add(cyl(0.16, 0.16, 0.8, 8), C.WOOD_D, x, y + 2.25, z, { rz: 1.5708 });
  b.add(box(0.03, 1.1, 0.03), C.ROPE, x, y + 1.7, z);
  b.add(cyl(0.2, 0.15, 0.3, 7), C.WOOD, x, y + 1.05, z);
}

export function oven(b, x, y, z, ry = 0) {
  const a = at(b, x, y, z, ry);
  a(cyl(1.15, 1.2, 0.7, 10), C.MUD_D, 0, 0.35, 0);
  a(dome(1.1, 10, 5), C.MUD, 0, 0.7, 0, { sy: 0.9, grad: 0.2 });
  a(box(0.6, 0.45, 0.3), C.DARK, 0, 0.95, 1.0);
  a(box(0.5, 0.2, 0.2), 0xff7a2a, 0, 0.86, 0.98, { jitter: 0.2 });
  a(cyl(0.14, 0.18, 0.6, 6), C.MUD_D, 0, 1.9, -0.2);
}

export function table(b, x, y, z, ry = 0) {
  const a = at(b, x, y, z, ry);
  a(box(1.8, 0.1, 0.9), C.WOOD, 0, 0.8, 0, { jitter: 0.1 });
  for (const kx of [-1, 1]) for (const kz of [-1, 1]) a(box(0.1, 0.8, 0.1), C.WOOD_D, kx * 0.8, 0.4, kz * 0.36);
  a(box(1.5, 0.02, 0.6), C.CREAM, 0, 0.86, 0);
}

export function garden(b, x, y, z, w, d) {
  const R = b.rand;
  b.add(box(w, 0.12, d), 0x6b4a30, x, y + 0.06, z, { jitter: 0.1 });
  for (let i = 0; i < Math.round(w * d * 1.4); i++) {
    const px = x + (R() - 0.5) * (w - 0.4), pz = z - d / 2 + 0.3 + Math.floor(R() * (d / 0.7)) * 0.7;
    b.add(cone(0.14, 0.35 + R() * 0.25, 5), R() < 0.5 ? C.GREEN : C.PALM, px, y + 0.3, pz, { jitter: 0.2 });
  }
  for (const kx of [-1, 1]) b.add(box(0.1, 0.25, d + 0.2), C.STONE, x + kx * (w / 2 + 0.05), y + 0.12, z);
  for (const kz of [-1, 1]) b.add(box(w + 0.2, 0.25, 0.1), C.STONE, x, y + 0.12, z + kz * (d / 2 + 0.05));
}

export function clothesline(b, x, y, z, len, ry = 0) {
  const a = at(b, x, y, z, ry), R = b.rand;
  for (const k of [-1, 1]) a(cyl(0.05, 0.06, 2, 5), C.WOOD_D, k * len / 2, 1, 0);
  a(box(len, 0.03, 0.03), C.ROPE, 0, 1.9, 0);
  const cols = [C.CREAM, C.BLUE, C.OCHRE, C.WHITE, C.RED];
  for (let i = 0; i < Math.floor(len / 0.8); i++) a(box(0.55, 0.7 + R() * 0.3, 0.03), cols[i % 5], -len / 2 + 0.6 + i * 0.8, 1.5, 0, { rx: (R() - 0.5) * 0.2 });
}

export function gateArch(b, x, y, z, w = 5.5, h = 4.6) {
  for (const k of [-1, 1]) {
    b.add(box(1.5, h, 1.5), C.MUD, x + k * w / 2, y + h / 2, z, { grad: 0.25 });
    b.add(box(1.7, 0.25, 1.7), C.WHITE, x + k * w / 2, y + h, z);
    b.add(dome(0.8, 8, 4), C.MUD_L, x + k * w / 2, y + h + 0.12, z);
  }
  b.add(box(w + 1.4, 0.9, 1.2), C.MUD_L, x, y + h + 0.55, z, { grad: 0.15 });
  b.add(box(w + 1.7, 0.16, 1.4), C.WHITE, x, y + h + 1.05, z);
  cross(b, x, y + h + 1.1, z, 1.1);
}

export function stele(b, x, y, z, ry = 0) {
  const a = at(b, x, y, z, ry);
  a(box(1.0, 0.25, 0.5), C.STONE_D, 0, 0.12, 0);
  a(box(0.85, 1.2, 0.24), C.STONE, 0, 0.85, 0, { grad: 0.15 });
  a(cyl(0.425, 0.425, 0.24, 10), C.STONE, 0, 1.45, 0, { rx: 1.5708 });
  a(box(0.07, 0.5, 0.04), C.GOLD, 0, 1.3, 0.13);
  a(box(0.3, 0.07, 0.04), C.GOLD, 0, 1.38, 0.13);
  for (let i = 0; i < 4; i++) a(box(0.55, 0.035, 0.03), C.STONE_D, 0, 0.9 - i * 0.14, 0.125);
}

// The snares of Abba Anthony's vision: arches of thorn that leave room only for someone bowed low.
export function snares(b, x, y, z, w, d) {
  const R = b.rand, n = Math.round(d / 0.85);
  for (let i = 0; i < n; i++) {
    const zz = z - d / 2 + (i + 0.5) * d / n;
    for (const [tilt, sy, rad] of [[0, 1.34, w / 2 + 0.05], [0.25, 1.9, w / 2 + 0.25], [-0.2, 2.5, w / 2 + 0.4]]) {
      const yy = sy * (0.97 + R() * 0.1), ry = tilt + (R() - 0.5) * 0.3, oz = (R() - 0.5) * 0.3;
      b.add(new THREE.TorusGeometry(1, 0.022 + R() * 0.012, 5, 14, Math.PI), i % 2 ? C.THORN : 0x4a2c30, x, y, zz + oz, { sx: rad, sy: yy, sz: rad, ry, jitter: 0.35 });
      for (let k = 0; k < 6; k++) {
        const an = 0.2 + R() * 2.74;
        b.add(cone(0.035, 0.26, 4), C.THORN, x + Math.cos(an) * rad * Math.cos(ry), y + Math.sin(an) * yy, zz + oz - Math.cos(an) * rad * Math.sin(ry),
          { rx: R() * 6, rz: R() * 6, jitter: 0.35 });
      }
    }
  }
}

export function lampPost(b, x, y, z, h = 2.2) {
  b.add(cyl(0.05, 0.08, h, 6), C.WOOD_D, x, y + h / 2, z);
  b.add(cyl(0.2, 0.08, 0.16, 7), C.IRON, x, y + h + 0.08, z);
  return [x, y + h + 0.32, z];
}

export function church(b, x, y, z, ry = 0) {
  const a = at(b, x, y, z, ry);
  a(box(14.5, 0.5, 14), C.STONE, 0, 0.25, 0, { jitter: 0.05 });
  a(box(13, 3.6, 9.5), C.WHITE, 0, 2.3, -0.5, { grad: 0.18, jitter: 0.04 });
  a(box(8.6, 6.2, 12), C.WHITE, 0, 3.6, 0, { grad: 0.2, jitter: 0.04 });
  a(box(13.3, 0.22, 9.8), C.MUD_D, 0, 4.15, -0.5);
  a(box(8.9, 0.25, 12.3), C.MUD_D, 0, 6.75, 0);
  a(cyl(2.7, 2.7, 2.0, 14), C.WHITE, 0, 7.8, -0.5, { grad: 0.1 });
  for (let i = 0; i < 8; i++) { const an = i * 0.785; a(box(0.45, 1.1, 0.12), C.BLUE, Math.sin(an) * 2.68, 7.9, -0.5 + Math.cos(an) * 2.68, { ry: an }); }
  a(cyl(2.9, 2.9, 0.2, 14), C.MUD_D, 0, 8.85, -0.5);
  a(dome(2.8, 14, 6), C.GOLD, 0, 8.9, -0.5, { grad: 0.2, jitter: 0.08 });
  cross(b, x, y + 11.6, z - 0.5 * Math.cos(ry), 1.6, C.GOLD, ry);
  for (const kx of [-1, 1]) for (const kz of [-1, 1]) {
    a(cyl(1.25, 1.25, 0.6, 10), C.WHITE, kx * 5.1, 4.4, -0.5 + kz * 3.3);
    a(dome(1.3, 10, 5), C.OCHRE, kx * 5.1, 4.7, -0.5 + kz * 3.3, { grad: 0.2 });
    a(box(0.07, 0.6, 0.07), C.GOLD, kx * 5.1, 6.25, -0.5 + kz * 3.3);
    a(box(0.32, 0.07, 0.07), C.GOLD, kx * 5.1, 6.35, -0.5 + kz * 3.3);
  }
  a(cyl(2.5, 2.5, 4.4, 12), C.WHITE, 0, 2.6, -6.2, { grad: 0.2 });
  a(dome(2.5, 12, 5), C.OCHRE, 0, 4.8, -6.2, { grad: 0.2 });
  // west door, facing the courtyard
  a(box(2.9, 3.9, 0.5), C.MUD, 0, 2.4, 6.1);
  a(box(1.9, 2.9, 0.4), C.WOOD_D, 0, 1.95, 6.25);
  a(cyl(0.95, 0.95, 0.4, 12), C.WOOD_D, 0, 3.4, 6.25, { rx: 1.5708 });
  a(box(0.08, 2.9, 0.06), C.GOLD, 0, 1.95, 6.47);
  a(box(0.9, 0.08, 0.06), C.GOLD, 0, 2.7, 6.47);
  for (const kx of [-1, 1]) {
    a(cyl(0.22, 0.26, 3.3, 8), C.STONE, kx * 1.75, 2.15, 6.55);
    a(box(0.6, 0.2, 0.6), C.STONE_D, kx * 1.75, 3.9, 6.55);
    a(box(0.7, 1.9, 0.12), C.BLUE, kx * 3.0, 4.4, 6.02);
    a(cyl(0.35, 0.35, 0.12, 10), C.BLUE, kx * 3.0, 5.35, 6.02, { rx: 1.5708 });
    for (let i = 0; i < 3; i++) a(box(0.5, 1.4, 0.12), 0xffd27a, kx * 6.52, 2.6, -3 + i * 2.4, { ry: 1.5708 });
  }
  for (let i = 0; i < 3; i++) a(box(4.2 + i * 0.9, 0.2, 0.7), C.STONE, 0, 0.6 - i * 0.2 + 0.0, 6.9 + i * 0.6);
  // bell tower
  a(box(2.6, 9.5, 2.6), C.WHITE, -9, 4.75, 2.5, { grad: 0.22, jitter: 0.04 });
  a(box(2.9, 0.25, 2.9), C.MUD_D, -9, 6.6, 2.5);
  for (let i = 0; i < 4; i++) a(box(1.2, 1.7, 0.2), C.DARK, -9 + Math.sin(i * 1.5708) * 1.25, 8.0, 2.5 + Math.cos(i * 1.5708) * 1.25, { ry: i * 1.5708 });
  a(box(3.0, 0.25, 3.0), C.MUD_D, -9, 9.5, 2.5);
  a(cone(2.0, 2.2, 4), C.OCHRE, -9, 10.7, 2.5, { ry: 0.785, grad: 0.2 });
  cross(b, x - 9 * Math.cos(ry) + 2.5 * Math.sin(ry), y + 11.7, z + 9 * Math.sin(ry) + 2.5 * Math.cos(ry), 1.0, C.GOLD, ry);
}

export function lowWall(b, x0, z0, x1, z1, y, h = 0.9) {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
  b.add(box(0.5, h, len), C.MUD, (x0 + x1) / 2, y + h / 2, (z0 + z1) / 2, { ry, grad: 0.2 });
  b.add(box(0.62, 0.12, len), C.WHITE, (x0 + x1) / 2, y + h, (z0 + z1) / 2, { ry });
}
