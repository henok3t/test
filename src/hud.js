const KEYS = { give: 'G', kneel: 'Shift', strike: 'X', jump: 'Space' };
const TOUCH = { give: 'GIVE', kneel: 'KNEEL', strike: 'STRIKE', jump: 'JUMP' };
export const RUNGS = ['Repentance', 'Humility', 'Mercy', 'Forgiveness', 'Prayer', 'Love'];

export class Hud {
  constructor() {
    this.$ = id => document.getElementById(id);
    this.touch = false;
    this.queue = []; this.cap = null; this.capT = 0;
    this.hintText = ''; this.titleT = 0; this.invKey = '';
    const lad = this.$('ladder');
    RUNGS.forEach((name, i) => {
      const d = document.createElement('div');
      d.className = 'rung'; d.id = 'rung' + i;
      d.innerHTML = `<span>${name}</span>`;
      lad.prepend(d);
    });
  }

  fmt(s) {
    const map = this.touch ? TOUCH : KEYS;
    return s.replace(/\{(\w+)\}/g, (m, k) => `<kbd>${map[k] || k}</kbd>`);
  }

  setTouch(on) {
    this.touch = on;
    document.body.classList.toggle('touch', on);
    const h = this.hintText; this.hintText = ''; this.hint(h);
  }

  title(a, b = '') {
    this.$('titleMain').textContent = a;
    this.$('titleSub').textContent = b;
    this.$('title').classList.add('show');
    this.titleT = 5;
  }

  say(text, by = '', dur = 0) {
    this.queue.push({ text, by, dur: dur || Math.max(4.5, text.length * 0.065) });
  }

  flush() { this.queue.length = 0; if (this.cap) this.capT = Math.min(this.capT, 0.3); }

  hint(s) {
    s = s || '';
    if (s === this.hintText) return;
    this.hintText = s;
    const el = this.$('hint');
    if (s) el.innerHTML = this.fmt(s);
    el.classList.toggle('show', !!s);
    for (const [k, id] of [['give', 'bGive'], ['kneel', 'bKneel'], ['strike', 'bStrike'], ['jump', 'bJump']]) this.$(id).classList.toggle('glow', s.includes('{' + k + '}'));
  }

  inv(inv) {
    const key = `${inv.gold}|${inv.water}|${inv.bread}`;
    if (key === this.invKey) return;
    this.invKey = key;
    let h = '';
    if (inv.gold) h += `<div class="chip gold">Gold × ${inv.gold}<small>heavy</small></div>`;
    if (inv.water) h += `<div class="chip water">Water jar</div>`;
    if (inv.bread) h += `<div class="chip bread">Bread × ${inv.bread}</div>`;
    this.$('inv').innerHTML = h;
  }

  rung(i) { this.$('rung' + i).classList.add('lit'); }
  strike(on, pulse = false) {
    document.body.classList.toggle('canstrike', on);
    this.$('bStrike').classList.toggle('pulse', pulse);
    this.$('strikeKey').classList.toggle('pulse', pulse);
  }

  fade(op, color = '#000', secs = 0.5) {
    const f = this.$('fade');
    f.style.transition = `opacity ${secs}s`;
    f.style.background = color;
    f.style.opacity = op;
  }

  center(html) {
    const el = this.$('center');
    if (!html) { el.classList.remove('show'); return; }
    el.innerHTML = html;
    el.classList.add('show');
  }

  update(dt) {
    if (this.titleT > 0) {
      this.titleT -= dt;
      if (this.titleT <= 0) this.$('title').classList.remove('show');
    }
    const cap = this.$('caption');
    if (this.cap) {
      this.capT -= dt * (this.queue.length > 1 ? 2.2 : 1);
      if (this.capT <= 0) { this.cap = null; cap.classList.remove('show'); this.capT = 0.5; }
    } else if (this.queue.length) {
      this.capT -= dt;
      if (this.capT <= 0) {
        this.cap = this.queue.shift();
        cap.innerHTML = `<p>${this.cap.text}</p>` + (this.cap.by ? `<cite>${this.cap.by}</cite>` : '');
        cap.classList.add('show');
        this.capT = this.cap.dur;
      }
    }
  }
}
