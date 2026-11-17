// Sky, light, weather and ground. The time of day turns as Moses climbs: night in the gorge,
// dawn on the road, morning in Scetis, dusk on the bridges, starlight at the cell, a golden sunrise at the summit.
import * as THREE from 'three';
import { lerp, smooth, fbm, rng, clamp } from './util.js';
import { flatMat, C } from './build.js';

const col = h => new THREE.Color(h);
const PAL = [
  { top: 0x0a1030, hor: 0x24325f, fog: 0x161e40, dens: 0.016, sun: 0x8fa8ff, sunI: 0.9, hs: 0x44588f, hg: 0x241c2a, hi: 0.75, dir: [-0.4, 0.75, 0.35], stars: 1 },
  { top: 0x35508c, hor: 0xf2a66b, fog: 0xd9a37a, dens: 0.011, sun: 0xffc890, sunI: 2.3, hs: 0x9fb4d8, hg: 0x8a6a4a, hi: 0.8, dir: [0.8, 0.3, -0.4], stars: 0.1 },
  { top: 0x3f8fd8, hor: 0xcfe6f5, fog: 0xd3dfe4, dens: 0.0075, sun: 0xfff2d8, sunI: 3.0, hs: 0xbfd8ff, hg: 0xb09060, hi: 1.0, dir: [0.5, 0.8, 0.25], stars: 0 },
  { top: 0x2a2350, hor: 0xd9603f, fog: 0x8a4a48, dens: 0.013, sun: 0xff7a45, sunI: 2.0, hs: 0x7a6aa0, hg: 0x503038, hi: 0.7, dir: [-0.8, 0.26, -0.45], stars: 0.35 },
  { top: 0x04061a, hor: 0x161d4a, fog: 0x0c1030, dens: 0.013, sun: 0x9fb4ff, sunI: 0.8, hs: 0x38457a, hg: 0x16141f, hi: 0.7, dir: [0.3, 0.78, 0.4], stars: 1 },
  { top: 0x4a78c8, hor: 0xffd98a, fog: 0xf0cf9a, dens: 0.008, sun: 0xffe2a8, sunI: 3.2, hs: 0xffe8c0, hg: 0xa08050, hi: 1.0, dir: [0.5, 0.4, -0.76], stars: 0 },
].map(p => ({ ...p, top: col(p.top), hor: col(p.hor), fog: col(p.fog), sun: col(p.sun), hs: col(p.hs), hg: col(p.hg), dir: new THREE.Vector3(...p.dir).normalize() }));

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)');
  gr.addColorStop(0.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Env {
  constructor(G) {
    const s = G.scene;
    this.G = G;
    this.glow = glowTexture();
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); s.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(G.lowSpec ? 1024 : 2048, G.lowSpec ? 1024 : 2048);
    if (G.lowSpec) this.G.renderer.shadowMap.type = THREE.PCFShadowMap;
    Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 190 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05;
    s.add(sun, sun.target);
    s.fog = new THREE.FogExp2(0x000000, 0.01);

    this.skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() } };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(450, 24, 14), new THREE.ShaderMaterial({
      uniforms: this.skyU, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top, hor, bot, sunDir, sunCol; varying vec3 vDir;
        void main(){ vec3 d = normalize(vDir); float h = d.y;
          vec3 c = mix(hor, top, pow(max(h, 0.0), 0.55)); c = mix(c, bot, smoothstep(0.0, -0.3, h));
          float s = max(dot(d, sunDir), 0.0); c += sunCol * (pow(s, 600.0) * 3.0 + pow(s, 14.0) * 0.22);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }));
    this.sky.renderOrder = -10; this.sky.frustumCulled = false; s.add(this.sky);

    const R = rng(7), sp = new Float32Array(1400 * 3);
    for (let i = 0; i < 1400; i++) {
      const a = R() * 6.283, y = R() * 0.95 + 0.04, r = Math.sqrt(1 - y * y);
      sp.set([Math.cos(a) * r * 420, y * 420, Math.sin(a) * r * 420], i * 3);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.starM = new THREE.PointsMaterial({ color: 0xdfe6ff, size: 1.8, sizeAttenuation: false, transparent: true, opacity: 1, fog: false, depthWrite: false });
    this.stars = new THREE.Points(sg, this.starM); this.stars.frustumCulled = false; this.stars.renderOrder = -9; s.add(this.stars);

    // drifting dust motes that travel with the camera
    const dp = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i++) dp.set([(R() - 0.5) * 34, R() * 12 - 2, (R() - 0.5) * 34], i * 3);
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    this.dustM = new THREE.PointsMaterial({ map: this.glow, color: 0xfff0d0, size: 0.16, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
    this.dust = new THREE.Points(dg, this.dustM); this.dust.frustumCulled = false; s.add(this.dust);

    this.pool = [];
    for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffa040, 0, 17, 1.7); s.add(l); this.pool.push(l); }
    this.flameG = new THREE.ConeGeometry(0.06, 0.2, 5);
    this.tmp = { top: new THREE.Color(), hor: new THREE.Color(), fog: new THREE.Color(), sun: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(), dir: new THREE.Vector3() };
    this.boost = 0;   // extra glow used by the ending
  }

  // A small flame with a soft halo. The four nearest lit lamps also get a real light.
  addLamp(x, y, z, o = {}) {
    const color = o.color ?? 0xffa040;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    sprite.position.set(x, y, z); this.G.scene.add(sprite);
    let flame = null;
    if (o.flame !== false) {
      flame = new THREE.Mesh(this.flameG, new THREE.MeshBasicMaterial({ color: 0xff9a30 }));
      flame.position.set(x, y, z); this.G.scene.add(flame);
    }
    const lamp = { x, y, z, color: new THREE.Color(color), intensity: o.intensity ?? 22, size: o.size ?? 1.5, on: o.on !== false, sprite, flame, ph: Math.random() * 9, level: 0 };
    this.G.lamps.push(lamp);
    return lamp;
  }

  buildTerrain(level) {
    const zEnd = level.zEnd, W = 300, L = 70 + 80 - zEnd, nx = 70, nz = Math.round(L / 4.4);
    const g = new THREE.PlaneGeometry(W, L, nx, nz);
    g.rotateX(-Math.PI / 2); g.translate(0, 0, 70 - L / 2);
    const p = g.attributes.position;
    const gorge = z => smooth(level.zoneZ[1] - 30, level.zoneZ[1] + 8, z);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), py = level.pathY(z);
      const ax = Math.abs(x + 7 * Math.sin(z * 0.021)), wall = smooth(17, 52, ax), gz = gorge(z);
      let h = py - 16 + (fbm(x * 0.03 + 7, z * 0.03) - 0.5) * 8;
      h += wall * lerp(10, 40, gz) * (0.55 + 0.9 * fbm(x * 0.022, z * 0.022 + 3));
      h += Math.sin(x * 0.09 + z * 0.05 + 4 * fbm(x * 0.02, z * 0.02)) * 1.8 * (1 - wall) * (1 - gz);
      h += smooth(60, 150, ax) * 34 * fbm(x * 0.012 + 5, z * 0.012);
      p.setY(i, h);
    }
    const ng = g.toNonIndexed(); g.dispose();
    ng.computeVertexNormals();
    const np = ng.attributes.position, nn = ng.attributes.normal, cols = new Float32Array(np.count * 3);
    const cs = new THREE.Color(C.SAND), cd = new THREE.Color(C.SAND_D), cr = new THREE.Color(C.ROCK_D), c = new THREE.Color(), R = rng(11);
    for (let i = 0; i < np.count; i += 3) {
      const steep = 1 - nn.getY(i), j = 0.9 + R() * 0.2;
      c.copy(cs).lerp(cd, clamp(fbm(np.getX(i) * 0.05, np.getZ(i) * 0.05) * 1.4 - 0.2, 0, 1)).lerp(cr, clamp(steep * 3.2, 0, 1));
      for (let k = 0; k < 3; k++) cols.set([c.r * j, c.g * j, c.b * j], (i + k) * 3);
    }
    ng.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const m = new THREE.Mesh(ng, flatMat);
    m.receiveShadow = true;
    this.G.scene.add(m);
  }

  update(dt, G) {
    const pz = G.player.pos.z, t = this.tmp, zz = G.level.zoneZ;
    t.top.copy(PAL[0].top); t.hor.copy(PAL[0].hor); t.fog.copy(PAL[0].fog); t.sun.copy(PAL[0].sun); t.hs.copy(PAL[0].hs); t.hg.copy(PAL[0].hg); t.dir.copy(PAL[0].dir);
    let dens = PAL[0].dens, sunI = PAL[0].sunI, hi = PAL[0].hi, stars = PAL[0].stars;
    for (let i = 1; i < PAL.length; i++) {
      const w = smooth(zz[i] + 12, zz[i] - 12, pz);
      if (w <= 0) break;
      const P = PAL[i];
      t.top.lerp(P.top, w); t.hor.lerp(P.hor, w); t.fog.lerp(P.fog, w); t.sun.lerp(P.sun, w); t.hs.lerp(P.hs, w); t.hg.lerp(P.hg, w); t.dir.lerp(P.dir, w);
      dens = lerp(dens, P.dens, w); sunI = lerp(sunI, P.sunI, w); hi = lerp(hi, P.hi, w); stars = lerp(stars, P.stars, w);
    }
    t.dir.normalize();
    G.scene.fog.color.copy(t.fog); G.scene.fog.density = dens;
    this.hemi.color.copy(t.hs); this.hemi.groundColor.copy(t.hg); this.hemi.intensity = hi + this.boost * 0.6;
    this.sun.color.copy(t.sun); this.sun.intensity = sunI + this.boost;
    const pp = G.player.pos;
    this.sun.target.position.set(pp.x, pp.y, pp.z - 6);
    this.sun.position.copy(this.sun.target.position).addScaledVector(t.dir, 90);
    this.skyU.top.value.copy(t.top); this.skyU.hor.value.copy(t.hor); this.skyU.bot.value.copy(t.fog);
    this.skyU.sunDir.value.copy(t.dir); this.skyU.sunCol.value.copy(t.sun).multiplyScalar(0.55 + this.boost * 0.3);
    this.starM.opacity = stars;
    this.stars.visible = stars > 0.01;
    const cp = G.camera.position;
    this.sky.position.copy(cp); this.stars.position.copy(cp);
    this.stars.rotation.y = G.time * 0.004;
    this.dustM.opacity = 0.3 + 0.4 * stars;

    const dp = this.dust.geometry.attributes.position;
    for (let i = 0; i < dp.count; i++) {
      let x = dp.getX(i) + dt * (0.35 + (i % 5) * 0.08), y = dp.getY(i) + dt * 0.12 * ((i % 3) - 0.6), z = dp.getZ(i) + dt * 0.1;
      const bx = cp.x - 17, by = cp.y - 7, bz = cp.z - 26;
      x = bx + ((((x - bx) % 34) + 34) % 34); y = by + ((((y - by) % 12) + 12) % 12); z = bz + ((((z - bz) % 34) + 34) % 34);
      dp.setXYZ(i, x, y, z);
    }
    dp.needsUpdate = true;

    // lamps: flicker, and hand the pooled lights to whichever are closest
    const near = [];
    for (const l of G.lamps) {
      l.level = lerp(l.level, l.on ? 1 : 0, 1 - Math.exp(-4 * dt));
      const f = l.level * (0.82 + 0.12 * Math.sin(G.time * 11 + l.ph) + 0.06 * Math.sin(G.time * 23 + l.ph * 2));
      l.f = f;
      l.sprite.visible = f > 0.02;
      l.sprite.scale.setScalar(l.size * (0.9 + f * 0.6));
      l.sprite.material.opacity = Math.min(1, f);
      if (l.flame) { l.flame.visible = f > 0.05; l.flame.scale.set(1, 0.8 + f * 0.5, 1); }
      if (f > 0.02) { l.d = (l.x - pp.x) ** 2 + (l.y - pp.y) ** 2 + (l.z - pp.z) ** 2; if (l.d < 1600) near.push(l); }
    }
    near.sort((a, b) => a.d - b.d);
    for (let i = 0; i < this.pool.length; i++) {
      const pl = this.pool[i], l = near[i];
      if (!l) { pl.intensity = 0; continue; }
      pl.position.set(l.x, l.y + 0.1, l.z); pl.color.copy(l.color);
      pl.intensity = l.intensity * l.f * smooth(1600, 500, l.d);
    }
  }
}
