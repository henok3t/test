// The climb itself: six stages laid out one after another, running away from the camera (-z) and upward.
import {
  Batch, C, box, cyl, mesa, bridge, rock, tuft, palm, deadTree, acacia, tent, campfire, crate, barrel, sack, jar, rug,
  swordStuck, cross, cell, well, oven, table, garden, clothesline, gateArch, stele, snares, lampPost, church, lowWall,
} from './build.js';
import { Pickup, Chest, Npc, Plaque, WindZone, Well, Elder, Stair, Raider, Door, PrayerSpot } from './entities.js';

export function buildLevel(G) {
  const samples = [], wps = [], zoneZ = [Infinity], cur = { x: 0, y: 0, z: 12 };
  let b = new Batch(1);
  const nextBatch = seed => { G.scene.add(b.build()); b = new Batch(seed); };
  const add = e => { G.ents.push(e); return e; };
  const wp = (x, y, z, o = {}) => wps.push({ x, y, z, ...o });
  const solid = (x, y, z, hw, h, hd) => { const c = { x0: x - hw, x1: x + hw, y0: y, y1: y + h, z0: z - hd, z1: z + hd, on: true, safe: false }; G.colliders.push(c); G.camSolids.push(c); };
  const lamp = (x, y, z, o = {}) => { const [lx, ly, lz] = lampPost(b, x, y, z, o.h); return G.env.addLamp(lx, ly, lz, o); };
  const plaque = (x, y, z, ry, text, by) => { stele(b, x, y, z, ry); add(new Plaque(G, x, y, z, text, by)); };

  // Place the next platform relative to the far edge of the previous one, so every jump is known to be makeable.
  function P(o) {
    const w = o.w, d = o.d, gap = o.gap || 0, st = o.style || 'mesa';
    const x = cur.x + (o.dx || 0), y = cur.y + (o.dy || 0), z = cur.z - gap - d / 2;
    const thick = o.thick ?? (st === 'mesa' ? 20 : 0.3);
    const col = { x0: x - w / 2, x1: x + w / 2, y0: y - thick, y1: y, z0: z - d / 2, z1: z + d / 2, on: !o.off, safe: o.safe !== false };
    G.colliders.push(col);
    if (st === 'mesa') mesa(b, x, y, z, w, d, { depth: 22, ...o });
    else if (st === 'bridge') bridge(b, x, y, z, w, d);
    else if (st === 'stone') {
      b.add(box(w, thick, d), C.STONE, x, y - thick / 2, z, { jitter: 0.07, grad: 0.25 });
      b.add(box(w + 0.12, 0.08, d + 0.05), C.WHITE, x, y - 0.04, z, { jitter: 0.04 });
    }
    cur.x = x; cur.y = y; cur.z = z - d / 2;
    samples.push([z + d / 2, y], [z - d / 2, y]);
    if (!o.nowp) wp(x, y, z);
    return { x, y, z, w, d, col };
  }

  // ───────────── 0 · THE GORGE — night. Moses the robber. ─────────────
  const camp = P({ w: 20, d: 22, scatter: 12 });
  campfire(b, -2.5, 0, 5);
  G.env.addLamp(-2.5, 0.6, 5, { color: 0xff8030, intensity: 70, size: 3.4 });
  tent(b, -6.5, 0, 2, 0.9, C.RED); solid(-6.5, 0, 2, 1.5, 2.6, 1.5);
  tent(b, 6.5, 0, 6, -0.9, C.BLUE); solid(6.5, 0, 6, 1.5, 2.6, 1.5);
  tent(b, 6.2, 0, -4.5, -1.4, C.RED); solid(6.2, 0, -4.5, 1.5, 2.6, 1.5);
  rug(b, -0.8, 0, 6.6, 2.6, 1.6, 0.3); rug(b, -4.6, 0, 7.2, 2.2, 1.4, -0.5, C.BLUE);
  crate(b, 8.2, 0, -0.5, 0.9, 0.2); crate(b, 8.4, 0.9, -0.4, 0.7, 0.5); crate(b, 7.1, 0, 0.6, 0.8, -0.3);
  barrel(b, 8.6, 0, 1.3); barrel(b, -8.6, 0, -3);
  sack(b, -8, 0, -1.6); sack(b, -7.3, 0, -2.2, 0.8); sack(b, 4.2, 0, 8.2);
  jar(b, -8.6, 0, 5.4); jar(b, -8.0, 0, 6.1, 0.7); jar(b, 3.4, 0, 9, 0.8);
  swordStuck(b, -1.0, 0, 3.5, 0.4); swordStuck(b, -4.1, 0, 3.8, -1); swordStuck(b, -0.6, 0, 4.0, 2);
  deadTree(b, -7.5, 0, -7, 3.6);
  rock(b, 8.6, 0, -8, 1.1); rock(b, -9, 0, 9.5, 1.3); rock(b, 9, 0, 10, 0.9); rock(b, 7.4, 0, -8.9, 0.6);
  add(new Chest(G, 3.2, 0, 3, -0.5)); add(new Chest(G, -4.5, 0, -4.5, 0.7));
  lamp(-3.2, 0, -9.2); lamp(3.2, 0, -9.2);
  add(new Npc(G, -4.3, 0, 5.4, 1.3, { robe: 0x3a2f3a, hood: 0x7a2020, headwear: 'turban', sit: true, bows: false, faces: false, sword: true }));
  add(new Npc(G, -2.0, 0, 7.1, 3.0, { robe: 0x4a2a22, hood: 0x2f4f7a, headwear: 'turban', sit: true, bows: false, faces: false }));

  const p1 = P({ w: 4.2, d: 4.2, gap: 2.2, dx: 1.5, dy: 0.4 });
  add(new Pickup(G, 'gold', p1.x, p1.y, p1.z));
  P({ w: 3.8, d: 3.8, gap: 2.4, dx: -2.6, dy: 0.5 });
  const p3 = P({ w: 4.4, d: 5, gap: 2.4, dx: 2.2, dy: 0.4 });
  add(new Pickup(G, 'gold', p3.x, p3.y, p3.z - 0.5));
  const p4 = P({ w: 10, d: 9, gap: 2.2, dx: -1, dy: 0.3 });
  deadTree(b, p4.x - 4.2, p4.y, p4.z + 0.4, 3.2);
  rug(b, p4.x - 3, p4.y, p4.z + 1.6, 1.8, 1.3, 0.4, C.SAND_D, C.ROCK_D);
  b.add(cyl(0.2, 0.12, 0.12, 7), C.CLAY, p4.x - 2.2, p4.y + 0.06, p4.z + 2.4);
  const beggar = add(new Npc(G, p4.x - 3, p4.y, p4.z + 1.6, 0.9, { robe: 0x8a7a5a, hood: 0x6a5a44, trim: 0x5a4a34, beard: 0x9a948a, skin: 0x7a5238, sit: true, bows: false }));
  beggar.lamp = lamp(p4.x - 4.3, p4.y, p4.z + 2.8, { on: false, intensity: 20, h: 1.3 });
  plaque(p4.x + 3.4, p4.y, p4.z + 0.6, -0.3, 'For where your treasure is, there your heart will be also.', 'Matthew 6:21');
  rock(b, p4.x + 4, p4.y, p4.z - 3.4, 0.8); rock(b, p4.x - 4.2, p4.y, p4.z - 3.6, 0.6);
  const wall = P({ w: 10, d: 7, gap: 0, dy: 1.8, top: C.SAND_L });
  wall.col.hint = G => (G.inv.gold ? 'The gold is too heavy to climb with.  {give} — lay it down' : null);
  zoneZ.push(wall.z + wall.d / 2);

  // ───────────── 1 · THE DESERT ROAD — dawn. Humility. ─────────────
  nextBatch(2);
  acacia(b, wall.x - 3.2, wall.y, wall.z - 0.5); rock(b, wall.x + 3.6, wall.y, wall.z + 1, 0.9);
  const r1 = P({ w: 6, d: 7, gap: 2.6, dx: -2, dy: 0.6 });
  plaque(r1.x - 1.9, r1.y, r1.z - 1.6, 0.3, 'I saw the snares that the enemy spreads out over the world, and I said, groaning, “What can get through such snares?” Then I heard a voice saying to me, “Humility.”', 'Abba Anthony the Great');
  deadTree(b, r1.x + 2.2, r1.y, r1.z + 1.8, 2.6);
  const r2 = P({ w: 3, d: 17, gap: 2.4, dx: 1.5, dy: 0.4, nowp: true, scatter: 3 });
  snares(b, r2.x, r2.y, r2.z, 3, 10);
  G.colliders.push({ x0: r2.x - 1.5, x1: r2.x + 1.5, y0: r2.y + 1.22, y1: r2.y + 7, z0: r2.z - 5, z1: r2.z + 5, on: true, safe: false, hint: () => 'Bow low.  Hold {kneel} and pass beneath the snares' });
  wp(r2.x, r2.y, r2.z + 7); wp(r2.x, r2.y, r2.z - 6.6, { kneel: true }); wp(r2.x, r2.y, r2.z - 7.6);
  const r3 = P({ w: 5, d: 5, gap: 2.6, dx: 2, dy: 0.8 });
  acacia(b, r3.x + 1.5, r3.y, r3.z - 1.2, 2.8);
  const r4 = P({ w: 2.2, d: 14, gap: 2.2, dx: -1.2, dy: 0.3, safe: false, nowp: true, scatter: 2 });
  G.winds.push(add(new WindZone(G, r4.x, r4.y, r4.z - 7, r4.z + 7, 1, 0)));
  wp(r4.x, r4.y, r4.z + 6); wp(r4.x, r4.y, r4.z - 6.2, { kneel: true });
  const r5 = P({ w: 4.5, d: 4.5, gap: 2.2, dx: 0.8, dy: 0.6 });
  rock(b, r5.x + 1.5, r5.y, r5.z + 1.4, 0.5);
  const r6 = P({ w: 2.2, d: 14, gap: 2.2, dx: 0.8, dy: 0.3, safe: false, nowp: true, scatter: 2 });
  G.winds.push(add(new WindZone(G, r6.x, r6.y, r6.z - 7, r6.z + 7, -1, 2.3)));
  wp(r6.x, r6.y, r6.z + 6); wp(r6.x, r6.y, r6.z - 6.2, { kneel: true });
  const r7 = P({ w: 7, d: 7, gap: 2.4, dx: -1, dy: 0.8 });
  rock(b, r7.x + 2.3, r7.y, r7.z - 1, 0.8, C.STONE); rock(b, r7.x + 2.0, r7.y, r7.z - 1.5, 0.5, C.STONE_D);
  cross(b, r7.x + 2.3, r7.y + 0.6, r7.z - 1, 1.3, C.WOOD_D);
  palm(b, r7.x - 2.5, r7.y, r7.z + 1.6, 4.5);
  plaque(r7.x - 1.7, r7.y, r7.z - 2, 0.2, 'God resists the proud, but gives grace to the humble.', 'James 4:6');
  P({ w: 5, d: 3.5, gap: 2, dy: 1.0 });

  // ───────────── 2 · SCETIS — morning. Mercy. ─────────────
  nextBatch(3);
  const vil = P({ w: 34, d: 36, gap: 1.8, dy: 0.8, nowp: true, scatter: 30, top: C.SAND_L });
  zoneZ.push(vil.z + 18);
  const vx = vil.x, vy = vil.y, vz = vil.z, zf = vz - 18;
  gateArch(b, vx, vy, vz + 16.6);
  b.add(box(0.03, 0.7, 0.03), C.ROPE, vx, vy + 4.3, vz + 16.6);
  G.env.addLamp(vx, vy + 3.85, vz + 16.6, { intensity: 12, size: 1.2 });
  well(b, vx + 1, vy, vz + 5); solid(vx + 1, vy, vz + 5, 1.3, 0.8, 1.3);
  add(new Well(G, vx + 1, vy, vz + 5));
  const cells = [[vx - 11, vz + 9, Math.PI / 2], [vx + 11.5, vz + 3, -Math.PI / 2], [vx - 10, vz - 8, Math.PI / 2]];
  const elders = cells.map(([cx, cz, ry]) => {
    cell(b, cx, vy, cz, ry); solid(cx, vy, cz, 1.6, 3.4, 1.6);
    rug(b, cx + Math.sin(ry) * 2.9 - Math.cos(ry) * 1.0, vy, cz + Math.cos(ry) * 2.9 + Math.sin(ry) * 1.0, 1.3, 1.6, ry, C.OCHRE, C.CREAM);
    return add(new Elder(G, cx, vy, cz, ry));
  });
  cell(b, vx + 11, vy, vz - 9, -Math.PI / 2, { r: 1.7 }); solid(vx + 11, vy, vz - 9, 1.45, 3.2, 1.45);
  cell(b, vx - 13.5, vy, vz - 1, Math.PI / 2, { r: 1.5, h: 1.8 }); solid(vx - 13.5, vy, vz - 1, 1.3, 3, 1.3);
  cell(b, vx + 13, vy, vz + 12, -2.2, { r: 1.6, h: 1.8 }); solid(vx + 13, vy, vz + 12, 1.35, 3, 1.35);
  oven(b, vx + 9.5, vy, vz + 13, -2.5); solid(vx + 9.5, vy, vz + 13, 0.95, 1.6, 0.95);
  table(b, vx + 6.8, vy, vz + 10.4, 0.2); solid(vx + 6.8, vy, vz + 10.4, 0.85, 0.82, 0.45);
  add(new Pickup(G, 'bread', vx + 6.4, vy + 0.88, vz + 10.4)); add(new Pickup(G, 'bread', vx + 7.3, vy + 0.88, vz + 10.5));
  garden(b, vx - 3.8, vy, vz - 5.5, 5, 4); garden(b, vx + 6.5, vy, vz - 4, 4.5, 3.4); garden(b, vx - 7, vy, vz + 14, 4, 2.6);
  clothesline(b, vx - 13, vy, vz + 14.5, 5, 0.4);
  for (const [px, pz, h] of [[-15, 15.5, 5.5], [-6, 16, 4.6], [15.5, 15, 5], [15.5, -3, 5.6], [-15.5, 4, 4.8], [14, -15, 5.2], [-14.5, -14.5, 5.8], [6.5, -13, 4.4], [-9, 13.5, 5], [9, 1, 4.2], [-7.5, -14, 5]])
    palm(b, vx + px, vy, vz + pz, h);
  jar(b, vx + 3.2, vy, vz + 6.2, 0.8); jar(b, vx + 3.8, vy, vz + 5.4, 0.6); jar(b, vx + 12.6, vy, vz - 6.2, 0.9); jar(b, vx - 12, vy, vz - 3, 0.8);
  sack(b, vx + 8.2, vy, vz + 11.6); sack(b, vx + 5.4, vy, vz + 11.4, 0.8);
  rock(b, vx - 16, vy, vz - 6, 0.9); rock(b, vx + 16, vy, vz + 5, 0.8); rock(b, vx - 8, vy, vz + 2.5, 0.5);
  // the leaking basket
  b.add(cyl(0.38, 0.26, 0.5, 9), C.SAND_D, vx - 4.2, vy + 0.25, vz + 1.2, { jitter: 0.2 });
  for (let i = 0; i < 9; i++) b.add(box(0.3 - i * 0.02, 0.03, 0.3), C.SAND_L, vx - 4.2 + 0.25 + i * 0.38, vy + 0.015, vz + 1.2 + Math.sin(i) * 0.15);
  plaque(vx - 5.6, vy, vz + 0.6, 0.5, 'My sins run out behind me, and I do not see them, and today I am coming to judge the errors of another.', 'Abba Moses, arriving with a leaking basket of sand at a council called to judge a brother');
  plaque(vx + 3.6, vy, vz + 8, -0.4, 'I was thirsty and you gave Me drink.', 'Matthew 25:35');
  const stair = add(new Stair(G, vx, vy, zf));
  lamp(vx - 3, vy, zf + 1); lamp(vx + 3, vy, zf + 1);
  {
    const W = [vx - 1.7, vz + 5], S = [vx + 1, vz + 8.3], drawn = () => G.inv.water > 0;
    const ap = e => [e.jx + (e.jx > vx ? -1.3 : 1.3), e.jz];
    wp(vx, vy, vz + 13);
    wp(W[0], vy, W[1], { give: drawn }); wp(...[ap(elders[0])[0], vy, ap(elders[0])[1]], { give: () => elders[0].served });
    wp(W[0], vy, W[1], { give: drawn }); wp(S[0], vy, S[1]); wp(ap(elders[1])[0], vy, ap(elders[1])[1], { give: () => elders[1].served });
    wp(S[0], vy, S[1]); wp(W[0], vy, W[1], { give: drawn }); wp(ap(elders[2])[0], vy, ap(elders[2])[1], { give: () => elders[2].served });
    wp(vx, vy, zf + 9.5);
    for (const s of stair.steps) wp(s.x, s.top, s.z);
  }

  // ───────────── 3 · THE NARROW BRIDGES — dusk. Forgiveness. ─────────────
  nextBatch(4);
  const up = P({ w: 14, d: 9, gap: 0, dy: 6, thick: 28 });
  zoneZ.push(up.z + 4.5);
  plaque(up.x + 4.4, up.y, up.z + 1.2, -0.4, 'When four robbers fell upon Abba Moses in his cell, he would not harm them, but carried them to the church. When they learned who he was, they too became monks.', 'Palladius, The Lausiac History');
  deadTree(b, up.x - 4.8, up.y, up.z - 1, 3); rock(b, up.x - 5, up.y, up.z + 2.6, 0.9);
  lamp(up.x - 1.9, up.y, up.z - 3.6); lamp(up.x + 1.9, up.y, up.z - 3.6);
  const raiders = [];
  let lastMesa = up;
  for (const [dx, mdx] of [[0, 0], [-1.8, 1.2], [1.5, -0.5]]) {
    const sx = cur.x + dx, sz = cur.z, sy = cur.y;
    const br = P({ w: 2.4, d: 13, gap: 0, dx, style: 'bridge', safe: false, nowp: true });
    const m = P({ w: 7.5, d: 7.5, gap: 0, dx: mdx, dy: 0.35, nowp: true });
    const side = dx >= 0 ? 1 : -1;
    const r = add(new Raider(G, br.x, br.y, br.z - 5, br.z + 4.5, { x: m.x + side * 2.6, y: m.y, z: m.z + 1.5 }));
    raiders.push(r);
    wp(sx, sy, sz + 1.3, { kneelUntil: () => !r.hostile });
    wp(br.x, br.y, br.z - 6); wp(m.x, m.y, m.z);
    rock(b, m.x - side * 2.6, m.y, m.z - 2.2, 0.7); lamp(m.x - side * 2.9, m.y, m.z + 2.6, { intensity: 14 });
    lastMesa = m;
  }
  acacia(b, lastMesa.x - 2.6, lastMesa.y, lastMesa.z - 1.8, 2.6);
  const neck = P({ w: 4, d: 9, gap: 0, scatter: 0 });
  const door = add(new Door(G, neck.x, neck.y, neck.z, 4));
  for (const k of [-1, 1]) mesa(b, neck.x + k * 3.1, neck.y + 5.6, neck.z, 1.9, 1.9, { depth: 28, scatter: 0 });
  b.add(box(8.3, 0.8, 1.3), C.STONE, neck.x, neck.y + 6.0, neck.z, { grad: 0.2 });
  cross(b, neck.x, neck.y + 6.4, neck.z, 1.3);
  lamp(neck.x - 1.6, neck.y, neck.z + 3.6); lamp(neck.x + 1.6, neck.y, neck.z + 3.6);

  // ───────────── 4 · THE CELL — night. Prayer. ─────────────
  nextBatch(5);
  const c0 = P({ w: 12, d: 12, gap: 1.8, dy: 0.8, nowp: true });
  zoneZ.push(c0.z + 6);
  cell(b, c0.x - 3.5, c0.y, c0.z + 1.6, 0.7); solid(c0.x - 3.5, c0.y, c0.z + 1.6, 1.6, 3.4, 1.6);
  jar(b, c0.x - 1.2, c0.y, c0.z + 3.2, 0.8); sack(b, c0.x - 5.2, c0.y, c0.z - 1);
  plaque(c0.x + 3.6, c0.y, c0.z + 2, -0.3, 'Go, sit in your cell, and your cell will teach you everything.', 'Abba Moses');
  palm(b, c0.x + 4.6, c0.y, c0.z - 2.5, 4.6); rock(b, c0.x - 4.8, c0.y, c0.z - 4.4, 0.8);
  rug(b, c0.x, c0.y, c0.z - 4, 1.6, 2.2, 0, C.BLUE, C.CREAM);
  lamp(c0.x + 1.5, c0.y, c0.z - 4.7, { h: 1.0, intensity: 10 });
  const lights = dxs => dxs.map(dx => P({ w: 3, d: 3, gap: 2.4, dx, dy: 1.0, style: 'none', safe: false, off: true }));
  wp(c0.x, c0.y, c0.z - 4, { kneelUntil: () => spotA.active });
  const A = lights([1.6, -1.8, -1.4, 1.8, 1.2]);
  const c1 = P({ w: 6, d: 6, gap: 2.4, dy: 1.0, dx: -0.8, nowp: true, scatter: 2 });
  rug(b, c1.x, c1.y, c1.z, 1.6, 2.2, 0, C.RED, C.CREAM);
  lamp(c1.x - 1.7, c1.y, c1.z - 0.6, { h: 1.0, intensity: 10 });
  wp(c1.x, c1.y, c1.z, { kneelUntil: () => spotB.active });
  const B = lights([-1.5, 1.8, 1.6, -1.6, -1.2]);
  const c2 = P({ w: 10, d: 9, gap: 2.4, dy: 1.0, dx: 0.5 });
  const spotA = add(new PrayerSpot(G, c0.x, c0.y, c0.z - 4, A)), spotB = add(new PrayerSpot(G, c1.x, c1.y, c1.z, B));

  // ───────────── 5 · THE SUMMIT — sunrise. Love. ─────────────
  nextBatch(6);
  plaque(c2.x - 3.2, c2.y, c2.z - 1, 0.3, 'Pray without ceasing.', '1 Thessalonians 5:17');
  acacia(b, c2.x + 3.2, c2.y, c2.z + 1.5, 3);
  let first = null;
  for (let i = 0; i < 12; i++) {
    const s = P({ w: 7, d: 1.2, gap: 0, dy: 0.35, style: 'stone', nowp: true, thick: 0.85 + 0.35 * i });
    if (!first) first = s;
    if (i % 4 === 1) { lamp(s.x - 3.2, s.y, s.z, { h: 1.4, intensity: 10 }); lamp(s.x + 3.2, s.y, s.z, { h: 1.4, intensity: 10 }); }
  }
  mesa(b, first.x, first.y - 0.85, first.z - 6.6, 7.6, 15, { depth: 22, scatter: 0, top: C.STONE_D });
  zoneZ.push(first.z + 0.6);
  const court = P({ w: 28, d: 30, gap: 0, dy: 0.35, nowp: true, scatter: 16, top: C.SAND_L });
  const cx = court.x, cy = court.y, cz = court.z;
  church(b, cx, cy, cz - 6, 0);
  solid(cx, cy, cz - 6, 6.6, 12, 6.2); solid(cx - 9, cy, cz - 3.5, 1.4, 12, 1.4); solid(cx, cy, cz - 12.5, 2.5, 8, 2.4);
  for (const k of [-1, 1]) {
    lowWall(b, cx + k * 13.6, cz + 14.6, cx + k * 13.6, cz - 14.6, cy);
    lowWall(b, cx + k * 13.6, cz + 14.6, cx + k * 4.2, cz + 14.6, cy);
    palm(b, cx + k * 11.5, cy, cz + 11.5, 5.4); palm(b, cx + k * 12, cy, cz - 1, 4.8);
    acacia(b, cx + k * 9.5, cy, cz + 6.5, 3);
    lamp(cx + k * 2.6, cy, cz + 12.5); lamp(cx + k * 2.6, cy, cz + 4.5);
    garden(b, cx + k * 10.5, cy, cz + 2.5, 3, 4);
    jar(b, cx + k * 3.6, cy, cz + 1.4, 0.9);
  }
  for (let i = 0; i < 7; i++) b.add(box(2.2, 0.05, 1.1), i % 2 ? C.STONE : C.WHITE, cx, cy + 0.025, cz + 13.4 - i * 1.7, { jitter: 0.06 });
  rug(b, cx, cy, cz + 2.4, 2.4, 1.6, 0, C.RED, C.OCHRE);
  wp(cx, cy, cz + 13.5); wp(cx, cy, cz + 10.2);
  G.scene.add(b.build());

  samples.sort((a, c) => c[0] - a[0]);
  const pathY = z => {
    if (z >= samples[0][0]) return samples[0][1];
    for (let i = 1; i < samples.length; i++) {
      const [z1, y1] = samples[i];
      if (z >= z1) { const [z0, y0] = samples[i - 1]; return z0 === z1 ? y1 : y0 + (y1 - y0) * (z0 - z) / (z0 - z1); }
    }
    return samples[samples.length - 1][1];
  };

  return {
    spawn: [0, 0, 9.5], zoneZ, pathY, zEnd: cz - 15, wps,
    camp, p4, wall, beggar, r7, vil, elders, stair, up, raiders, door, neck, c0, c2, spotA, spotB, court,
  };
}
