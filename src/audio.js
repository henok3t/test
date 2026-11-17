// All sound is synthesised: a low held drone (like the ison under a chant) plus bells and small effects.
const ROOTS = [65.41, 73.42, 87.31, 61.74, 55.0, 98.0];

export class Sound {
  constructor() { this.ctx = null; this.on = true; }

  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const c = this.ctx = new AC();
      this.master = c.createGain();
      this.master.gain.value = this.on ? 0.6 : 0;
      this.master.connect(c.destination);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 520;
      this.drone = c.createGain();
      this.drone.gain.value = 0;
      this.drone.connect(lp); lp.connect(this.master);
      this.osc = [1, 1.5, 2, 3].map((m, i) => {
        const o = c.createOscillator();
        o.type = i < 2 ? 'sine' : 'triangle';
        o.frequency.value = ROOTS[0] * m;
        const g = c.createGain();
        g.gain.value = [0.5, 0.3, 0.12, 0.05][i];
        o.connect(g); g.connect(this.drone); o.start();
        return { o, m };
      });
      this.drone.gain.linearRampToValueAtTime(0.24, c.currentTime + 4);
    } catch (e) { this.ctx = null; }
  }

  pause(hidden) { if (this.ctx) { if (hidden) this.ctx.suspend(); else this.ctx.resume(); } }

  toggle() {
    this.on = !this.on;
    if (this.master) this.master.gain.value = this.on ? 0.6 : 0;
    return this.on;
  }

  mood(i) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, root = ROOTS[i] || ROOTS[0];
    for (const { o, m } of this.osc) o.frequency.setTargetAtTime(root * m, t, 1.2);
  }

  bell(f = 523, v = 0.2, d = 3.2) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    [[1, 1], [2.01, 0.5], [2.76, 0.35], [3.9, 0.2], [5.4, 0.1]].forEach(([m, a]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.value = f * m;
      g.gain.setValueAtTime(v * a, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d / m ** 0.6);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + d);
    });
  }

  tone(f, d = 0.15, type = 'sine', v = 0.12, slide = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + d + 0.02);
  }

  noise(d = 0.3, f = 600, q = 1, v = 0.2) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime, n = Math.floor(c.sampleRate * d);
    const buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf;
    bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + d * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t);
  }
}
