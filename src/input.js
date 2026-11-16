// Keyboard, mouse-drag camera, and on-screen touch controls.
export class Input {
  constructor(canvas, hud) {
    this.keys = new Set();
    this.mx = 0; this.my = 0; this.jump = false; this.kneel = false;
    this.edges = { jump: false, give: false, strike: false };
    this.camDX = 0; this.camDY = 0;
    this.stick = { x: 0, y: 0 }; this.btn = { jump: false, kneel: false };
    this.botDir = null; this.botKneel = false;
    const $ = id => document.getElementById(id);

    addEventListener('keydown', e => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'Space') this.edges.jump = true;
      if (e.code === 'KeyG' || e.code === 'KeyE' || e.code === 'Enter') this.edges.give = true;
      if (e.code === 'KeyX' || e.code === 'KeyF') this.edges.strike = true;
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    let drag = null;
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') hud.setTouch(true);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      this.camDX += e.clientX - drag.x; this.camDY += e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
    });
    const end = e => { if (drag && drag.id === e.pointerId) drag = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    const zone = $('stick'), knob = $('knob');
    let sid = null, ox = 0, oy = 0;
    const moveStick = e => {
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const len = Math.hypot(dx, dy), max = 52;
      if (len > max) { dx *= max / len; dy *= max / len; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.stick.x = dx / max; this.stick.y = -dy / max;
    };
    zone.addEventListener('pointerdown', e => {
      hud.setTouch(true);
      sid = e.pointerId; zone.setPointerCapture(sid);
      const r = zone.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2;
      moveStick(e); e.preventDefault();
    });
    zone.addEventListener('pointermove', e => { if (e.pointerId === sid) moveStick(e); });
    const stickEnd = e => { if (e.pointerId === sid) { sid = null; this.stick.x = this.stick.y = 0; knob.style.transform = ''; } };
    zone.addEventListener('pointerup', stickEnd); zone.addEventListener('pointercancel', stickEnd);

    const hold = (id, down, up) => {
      const el = $(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('down'); down(); });
      const rel = () => { el.classList.remove('down'); if (up) up(); };
      el.addEventListener('pointerup', rel); el.addEventListener('pointercancel', rel);
    };
    hold('bJump', () => { this.edges.jump = true; this.btn.jump = true; }, () => { this.btn.jump = false; });
    hold('bKneel', () => { this.btn.kneel = true; }, () => { this.btn.kneel = false; });
    hold('bGive', () => { this.edges.give = true; });
    hold('bStrike', () => { this.edges.strike = true; });
    if (matchMedia('(pointer: coarse)').matches) hud.setTouch(true);
  }

  consume(n) { const v = this.edges[n]; this.edges[n] = false; return v; }

  poll() {
    const k = this.keys, c = (...codes) => codes.some(x => k.has(x)) ? 1 : 0;
    let x = c('KeyD', 'ArrowRight') - c('KeyA', 'ArrowLeft') + this.stick.x;
    let y = c('KeyW', 'ArrowUp') - c('KeyS', 'ArrowDown') + this.stick.y;
    this.mx = Math.max(-1, Math.min(1, x)); this.my = Math.max(-1, Math.min(1, y));
    this.jump = k.has('Space') || this.btn.jump;
    this.kneel = !!c('ShiftLeft', 'ShiftRight', 'KeyC') || this.btn.kneel || this.botKneel;
  }
}
