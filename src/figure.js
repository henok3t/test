// Robed human figures built from primitives: Moses, the elders, the beggar, the raiders.
import * as THREE from 'three';
import { damp } from './util.js';

const shared = new Map();
function material(color, own) {
  if (own) return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 });
  if (!shared.has(color)) shared.set(color, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 }));
  return shared.get(color);
}

export function makeFigure(o = {}) {
  const M = c => material(c, o.own);
  const robeM = M(o.robe ?? 0x7a2d22), skinM = M(o.skin ?? 0x4f3020), hoodM = M(o.hood ?? 0x8e1f1f);
  const beardM = M(o.beard ?? 0x15100d), trimM = M(o.trim ?? 0xd0a84a), darkM = M(0x120d0a);
  const root = new THREE.Group();
  const mk = (g, m, x = 0, y = 0, z = 0, parent = root) => {
    const me = new THREE.Mesh(g, m);
    me.position.set(x, y, z); me.castShadow = true; parent.add(me);
    return me;
  };
  const rg = new THREE.CylinderGeometry(0.21, 0.44, 1.05, 9); rg.translate(0, 0.525, 0);
  const robe = mk(rg, robeM);
  mk(new THREE.CylinderGeometry(0.45, 0.46, 0.07, 9), trimM, 0, 0.04, 0);
  const footL = mk(new THREE.BoxGeometry(0.14, 0.08, 0.26), darkM, 0.12, 0.04, 0.14);
  const footR = mk(new THREE.BoxGeometry(0.14, 0.08, 0.26), darkM, -0.12, 0.04, 0.14);

  const upper = new THREE.Group(); upper.position.y = 1.05; root.add(upper);
  mk(new THREE.SphereGeometry(0.3, 8, 6), robeM, 0, 0.08, 0, upper).scale.set(1, 0.62, 0.72);
  mk(new THREE.CylinderGeometry(0.235, 0.26, 0.09, 9), trimM, 0, -0.12, 0, upper);
  const chestCross = new THREE.Group(); chestCross.position.set(0, 0.0, 0.215); upper.add(chestCross);
  mk(new THREE.BoxGeometry(0.035, 0.16, 0.02), trimM, 0, 0, 0, chestCross);
  mk(new THREE.BoxGeometry(0.1, 0.035, 0.02), trimM, 0, 0.03, 0, chestCross);
  chestCross.visible = !!o.cross;

  const head = new THREE.Group(); head.position.set(0, 0.42, 0); upper.add(head);
  mk(new THREE.SphereGeometry(0.19, 9, 7), skinM, 0, 0, 0, head);
  const beard = mk(new THREE.ConeGeometry(0.15, 0.32, 7), beardM, 0, -0.18, 0.085, head); beard.rotation.x = Math.PI - 0.3;
  mk(new THREE.BoxGeometry(0.05, 0.07, 0.06), skinM, 0, -0.02, 0.18, head);
  for (const k of [-1, 1]) mk(new THREE.SphereGeometry(0.026, 5, 4), darkM, k * 0.07, 0.035, 0.17, head);
  const turban = new THREE.Group(); head.add(turban);
  mk(new THREE.SphereGeometry(0.215, 9, 6), hoodM, 0, 0.09, -0.01, turban).scale.set(1.08, 0.62, 1.08);
  mk(new THREE.SphereGeometry(0.07, 6, 5), hoodM, 0.17, 0.12, -0.05, turban);
  const hood = new THREE.Group(); head.add(hood);
  mk(new THREE.SphereGeometry(0.225, 9, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), hoodM, 0, 0.0, -0.015, hood);
  mk(new THREE.BoxGeometry(0.36, 0.42, 0.09), hoodM, 0, -0.2, -0.17, hood);
  turban.visible = o.headwear === 'turban';
  hood.visible = o.headwear !== 'turban';

  const haloM = new THREE.MeshBasicMaterial({ color: 0xffdc7a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, fog: false });
  const halo = mk(new THREE.RingGeometry(0.27, 0.36, 28), haloM, 0, 0.03, -0.17, head);
  halo.castShadow = false; halo.visible = false;

  const arms = [1, -1].map(side => {
    const g = new THREE.Group(); g.position.set(side * 0.3, 0.12, 0); upper.add(g);
    const ag = new THREE.CylinderGeometry(0.07, 0.09, 0.55, 6); ag.translate(0, -0.275, 0);
    mk(ag, robeM, 0, 0, 0, g);
    mk(new THREE.SphereGeometry(0.07, 6, 5), skinM, 0, -0.59, 0, g);
    return g;
  });

  const sack = mk(new THREE.SphereGeometry(0.26, 7, 6), M(0xb8935f), 0, 0.05, -0.32, upper); sack.visible = false;
  const jar = new THREE.Group(); jar.position.set(0, -0.1, 0.42); upper.add(jar); jar.visible = false;
  mk(new THREE.SphereGeometry(0.17, 7, 6), M(0xb5683e), 0, 0, 0, jar).scale.y = 1.2;
  mk(new THREE.CylinderGeometry(0.09, 0.07, 0.12, 7), M(0xb5683e), 0, 0.22, 0, jar);

  let sword = null, staff = null;
  if (o.sword) {
    sword = new THREE.Group(); sword.position.set(0, -0.6, 0.05); sword.rotation.x = 1.4; arms[1].add(sword);
    mk(new THREE.BoxGeometry(0.06, 0.85, 0.02), M(0xb9bec8), 0, 0.5, 0, sword);
    mk(new THREE.BoxGeometry(0.26, 0.05, 0.05), trimM, 0, 0.07, 0, sword);
  }
  if (o.staff) {
    staff = mk(new THREE.CylinderGeometry(0.03, 0.035, 1.7, 5), M(0x573821), -0.42, -0.25, 0.18, upper);
  }
  if (o.scale) root.scale.setScalar(o.scale);
  return { root, robe, upper, head, arms, footL, footR, halo, haloM, sack, jar, sword, staff, turban, hood, chestCross, m: { robeM, hoodM, trimM, beardM }, t: Math.random() * 6, k: 0, bow: 0 };
}

// s: { speed, air, kneel, carry, bow, strike }
export function animate(f, dt, s) {
  const sp = Math.min(1, (s.speed || 0) / 5);
  f.t += dt * (2 + (s.speed || 0) * 1.9);
  const k = f.k = damp(f.k, s.kneel ? 1 : 0, 12, dt);
  f.bow = damp(f.bow, s.bow || 0, 6, dt);
  const w = Math.sin(f.t) * sp;
  f.robe.scale.y = 1 - 0.48 * k;
  f.upper.position.y = 1.05 * (1 - 0.48 * k) + Math.abs(Math.sin(f.t)) * 0.04 * sp + Math.sin(f.t * 0.6) * 0.008;
  f.upper.rotation.x = 0.1 * sp + 0.22 * k + f.bow * 0.55;
  f.head.rotation.x = 0.3 * k + f.bow * 0.3;
  let lx = w * 0.8, rx = -w * 0.8, z = 0.1;
  if (s.air) { lx = rx = -2.5; z = 0.45; }
  if (s.kneel || f.bow > 0.3) { lx = rx = -1.15; z = -0.42; }
  if (s.carry) { lx = rx = -1.0; z = -0.34; }
  if (s.strike) { rx = -2.6 + (1 - s.strike) * 2.4; }
  const [L, R] = f.arms;
  L.rotation.x = damp(L.rotation.x, lx, 16, dt); R.rotation.x = damp(R.rotation.x, rx, 16, dt);
  L.rotation.z = damp(L.rotation.z, z, 16, dt); R.rotation.z = damp(R.rotation.z, -z, 16, dt);
  f.footL.position.z = 0.14 + w * 0.17; f.footR.position.z = 0.14 - w * 0.17;
  f.footL.position.y = 0.04 + Math.max(0, w) * 0.07; f.footR.position.y = 0.04 + Math.max(0, -w) * 0.07;
}
