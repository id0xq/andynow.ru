// The flock of the first screen: a few thousand points that fly like starlings and settle into forms.
// At rest they make Andy with his hang (assets/figure.bin + a hang drawn here). Each statement of the
// headline calls its own form: the hang being played, a hang turning in space, sound waves, a cube.
// Between forms the points lift off into a murmuration: a curl-noise flow around a moving centre.
(() => {
  'use strict';
  const canvas = document.querySelector('[data-flock]');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = window.matchMedia('(max-width: 760px)').matches;
  const N = phone ? 2600 : 5200;
  const DOT = phone ? 1.5 : 1.6;

  // the hang inside the photo DSC00133, in figure units (height = 1): see tools/figure.py
  const HANG_IN_FIGURE = { x: 0, y: 0.429, rx: 0.137, ry: 0.158, tilt: (12 * Math.PI) / 180 };

  let W = 0, H = 0, DPR = 1;
  const px = new Float32Array(N), py = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
  const tx = new Float32Array(N), ty = new Float32Array(N), ta = new Float32Array(N).fill(1);
  const delay = new Float32Array(N), seed = new Float32Array(N);

  // deterministic randomness, so the forms look the same on every visit
  let s0 = 20261111;
  const rnd = () => { s0 |= 0; s0 = (s0 + 0x6D2B79F5) | 0; let t = Math.imul(s0 ^ (s0 >>> 15), 1 | s0); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = 0; i < N; i++) seed[i] = rnd() * 1000;

  // ── models: each form is a set of N points in its own units ──────────────────────────────────

  // a hang seen from above, in a unit circle: rim, ding, eight tone fields, sparse steel
  function hangTop(n, share) {
    const x = new Float32Array(n), y = new Float32Array(n), g = new Int8Array(n);
    const FIELD_R = 0.63, FA = 0.15, FT = 0.115;
    const centres = [];
    for (let k = 0; k < 8; k++) { const a = ((k * 45 + 22.5) * Math.PI) / 180 - Math.PI / 2; centres.push([Math.cos(a) * FIELD_R, Math.sin(a) * FIELD_R, a]); }
    const inField = (u, v) => {
      if (Math.hypot(u, v) < 0.3) return true;
      return centres.some(([cx, cy, a]) => { const du = u - cx, dv = v - cy; const r = du * Math.cos(a) + dv * Math.sin(a), t = -du * Math.sin(a) + dv * Math.cos(a); return (r * r) / (FA * FA * 1.4) + (t * t) / (FT * FT * 1.4) < 1; });
    };
    const nRim = Math.round(n * share.rim), nDing = Math.round(n * share.ding), nField = Math.round(n * share.fields);
    let i = 0;
    for (; i < nRim; i++) { const a = rnd() * Math.PI * 2, r = 0.955 + rnd() * 0.045; x[i] = Math.cos(a) * r; y[i] = Math.sin(a) * r; g[i] = 0; }
    for (let k = 0; k < nDing; k++, i++) { const a = rnd() * Math.PI * 2, r = k % 5 === 0 ? rnd() * 0.08 : 0.235 + (rnd() - 0.5) * 0.03; x[i] = Math.cos(a) * r; y[i] = Math.sin(a) * r; g[i] = 1; }
    for (let k = 0; k < nField; k++, i++) {
      const f = k % 8, [cx, cy, a] = centres[f], b = rnd() * Math.PI * 2;
      const inner = k % 6 === 0; const rr = inner ? 0.35 + rnd() * 0.12 : 1 + (rnd() - 0.5) * 0.09;
      const r = Math.cos(b) * FA * rr, t = Math.sin(b) * FT * rr;
      x[i] = cx + r * Math.cos(a) - t * Math.sin(a); y[i] = cy + r * Math.sin(a) + t * Math.cos(a); g[i] = 2 + f;
    }
    for (; i < n; i++) {
      let u, v; do { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.93; u = Math.cos(a) * r; v = Math.sin(a) * r; } while (inField(u, v));
      x[i] = u; y[i] = v; g[i] = 10;
    }
    return { x, y, g, centres };
  }

  // a hang in space: two shells, the rim between them, the ding and fields on top, the gu below
  function hang3d(n) {
    const x = new Float32Array(n), y = new Float32Array(n), z = new Float32Array(n);
    const capPoint = (h, r, a) => { const R = (1 + h * h) / (2 * h); return [Math.cos(a) * r, Math.sqrt(Math.max(0, R * R - r * r)) - (R - h), Math.sin(a) * r]; };
    const capRandom = (h) => { const R = (1 + h * h) / (2 * h); const yy = rnd() * h; const r = Math.sqrt(Math.max(0, R * R - (yy + R - h) ** 2)); return [r, rnd() * Math.PI * 2]; };
    for (let i = 0; i < n; i++) {
      const k = i / n; let p;
      if (k < 0.16) { const a = rnd() * Math.PI * 2; p = [Math.cos(a), (rnd() - 0.5) * 0.05, Math.sin(a)]; }            // rim
      else if (k < 0.48) { const [r, a] = capRandom(0.36); p = capPoint(0.36, r, a); }                                     // top shell
      else if (k < 0.58) { const a = rnd() * Math.PI * 2, r = 0.22 + (rnd() - 0.5) * 0.03; p = capPoint(0.36, r, a); }      // ding
      else if (k < 0.78) {                                                                                                  // fields
        const f = Math.floor(rnd() * 8), fa = (f * Math.PI) / 4 + Math.PI / 8, b = rnd() * Math.PI * 2;
        const u = Math.cos(fa) * 0.62 + Math.cos(b) * 0.13, v = Math.sin(fa) * 0.62 + Math.sin(b) * 0.1;
        p = capPoint(0.36, Math.hypot(u, v), Math.atan2(v, u));
      } else {                                                                                                              // bottom shell with the gu
        let r, a; do { [r, a] = capRandom(0.3); } while (r < 0.27);
        const q = capPoint(0.3, r, a); p = [q[0], -q[1], q[2]];
      }
      x[i] = p[0]; y[i] = p[1]; z[i] = p[2];
    }
    return { x, y, z };
  }

  // a cube of points: edges and a light grid on its faces
  function cube3d(n) {
    const x = new Float32Array(n), y = new Float32Array(n), z = new Float32Array(n);
    const edges = [];
    for (const a of [-1, 1]) for (const b of [-1, 1]) { edges.push([[-1, a, b], [1, a, b]], [[a, -1, b], [a, 1, b]], [[a, b, -1], [a, b, 1]]); }
    for (let i = 0; i < n; i++) {
      if (i < n * 0.55) {
        const [p, q] = edges[i % 12], t = rnd();
        x[i] = p[0] + (q[0] - p[0]) * t; y[i] = p[1] + (q[1] - p[1]) * t; z[i] = p[2] + (q[2] - p[2]) * t;
      } else {
        const face = Math.floor(rnd() * 6), axis = face % 3, side = face < 3 ? -1 : 1;
        const line = [-0.5, 0, 0.5][Math.floor(rnd() * 3)], t = rnd() * 2 - 1, along = rnd() < 0.5;
        const c = [0, 0, 0]; c[axis] = side; const o1 = (axis + 1) % 3, o2 = (axis + 2) % 3;
        c[o1] = along ? line : t; c[o2] = along ? t : line;
        x[i] = c[0]; y[i] = c[1]; z[i] = c[2];
      }
    }
    return { x, y, z };
  }

  // sound: rings that leave the centre and fade
  const RINGS = 7;
  function waves(n) {
    const ring = new Uint8Array(n), ang = new Float32Array(n), jit = new Float32Array(n);
    for (let i = 0; i < n; i++) { ring[i] = i % (RINGS + 1); ang[i] = rnd() * Math.PI * 2; jit[i] = (rnd() - 0.5) * 0.018; }
    return { ring, ang, jit };
  }

  let figure = null; // { x, y, n } body points from the photo
  const HANG_SHARE_BIG = { rim: 0.2, ding: 0.1, fields: 0.44 };
  const HANG_SHARE_FIG = { rim: 0.24, ding: 0.1, fields: 0.42 };
  const big = hangTop(N, HANG_SHARE_BIG);
  const shell = hang3d(N);
  const cube = cube3d(N);
  const wave = waves(N);
  let figHang = null, bodyCount = 0;

  // ── targets for the current form, every frame ─────────────────────────────────────────────────
  const MELODY = [1, 2, 6, 4, 8, 1, 3, 7, 5, 9];
  let form = 'figure', formStart = 0, phaseUntil = 0;

  function targets(t) {
    const cx = W / 2, cy = H / 2, S = Math.min(W, H);
    if (form === 'figure' && figure) {
      const FH = H * (phone ? 0.9 : 0.86), top = (H - FH) / 2 + (phone ? 0 : H * 0.02), fx = cx;
      for (let i = 0; i < bodyCount; i++) { tx[i] = fx + figure.x[i] * FH; ty[i] = top + figure.y[i] * FH; ta[i] = 1; }
      const h = HANG_IN_FIGURE, c = Math.cos(h.tilt), s = Math.sin(h.tilt);
      const hx = fx + h.x * FH, hy = top + h.y * FH, rx = h.rx * FH, ry = h.ry * FH;
      for (let k = 0, i = bodyCount; i < N; i++, k++) {
        const u = figHang.x[k] * rx, v = figHang.y[k] * ry;
        tx[i] = hx + u * c - v * s; ty[i] = hy + u * s + v * c; ta[i] = 1;
      }
    } else if (form === 'hang') {
      const R = S * 0.4, beat = 0.48, step = Math.floor(t / beat), since = t - step * beat;
      const field = MELODY[step % MELODY.length];
      const centre = field === 1 ? [0, 0] : big.centres[field - 2];
      const k = 1 + 0.22 * Math.exp(-since * 6);
      const rot = t * 0.05;
      const c = Math.cos(rot), s = Math.sin(rot);
      for (let i = 0; i < N; i++) {
        let u = big.x[i], v = big.y[i];
        if (big.g[i] === field) { u = centre[0] + (u - centre[0]) * k; v = centre[1] + (v - centre[1]) * k; }
        tx[i] = cx + (u * c - v * s) * R; ty[i] = cy + (u * s + v * c) * R; ta[i] = big.g[i] === field ? 1 : 0.92;
      }
    } else if (form === 'shell' || form === 'cube') {
      const m = form === 'shell' ? shell : cube;
      const R = form === 'shell' ? S * 0.37 : S * 0.24;
      const ay = t * (form === 'shell' ? 0.42 : 0.35), ax = form === 'shell' ? 0.5 : 0.55 + Math.sin(t * 0.3) * 0.1;
      const cyA = Math.cos(ay), syA = Math.sin(ay), cxA = Math.cos(ax), sxA = Math.sin(ax);
      for (let i = 0; i < N; i++) {
        const x1 = m.x[i] * cyA + m.z[i] * syA, z1 = -m.x[i] * syA + m.z[i] * cyA;
        const y2 = m.y[i] * cxA - z1 * sxA, z2 = m.y[i] * sxA + z1 * cxA;
        const persp = 1 / (1 - z2 * 0.18);
        tx[i] = cx + x1 * R * persp; ty[i] = cy - y2 * R * persp; ta[i] = 0.35 + 0.65 * (z2 + 1.2) / 2.4;
      }
    } else if (form === 'waves') {
      const Rmax = S * 0.46, speed = 0.16;
      for (let i = 0; i < N; i++) {
        const r0 = wave.ring[i];
        if (r0 === RINGS) { const a = wave.ang[i], rr = Math.sqrt((seed[i] % 1)) * S * 0.035; tx[i] = cx + Math.cos(a) * rr; ty[i] = cy + Math.sin(a) * rr; ta[i] = 1; continue; }
        const phase = ((r0 / RINGS + t * speed) % 1);
        const r = (0.06 + phase * 0.94 + wave.jit[i]) * Rmax;
        tx[i] = cx + Math.cos(wave.ang[i]) * r; ty[i] = cy + Math.sin(wave.ang[i]) * r * 0.98;
        ta[i] = phase < 0.08 ? phase / 0.08 : 1 - Math.max(0, phase - 0.55) / 0.45;
      }
    }
  }

  // ── murmuration flow ──────────────────────────────────────────────────────────────────────────
  // curl of ψ = sin(x·a + t)·cos(y·b − t) + ½·sin((x + y)·c + t): an incompressible, swirling field
  function flow(x, y, t, out) {
    const a = 0.0062, b = 0.0071, c = 0.0043;
    const s1 = Math.sin(x * a + t * 0.7), c1 = Math.cos(x * a + t * 0.7);
    const s2 = Math.sin(y * b - t * 0.6), c2 = Math.cos(y * b - t * 0.6);
    const c3 = Math.cos((x + y) * c + t * 0.5);
    const dpdx = a * c1 * c2 + 0.5 * c * c3;
    const dpdy = -b * s1 * s2 + 0.5 * c * c3;
    out[0] = dpdy / 0.008; out[1] = -dpdx / 0.008;
  }

  // ── simulation ────────────────────────────────────────────────────────────────────────────────
  const mouse = { x: -9999, y: -9999 };
  const f = [0, 0];
  let last = 0, clock = 0;

  function step(dt) {
    clock += dt;
    const t = clock, k = Math.min(2, dt * 60);
    const flocking = t < phaseUntil;
    const centreX = W * (0.5 + 0.26 * Math.sin(t * 0.37)), centreY = H * (0.48 + 0.2 * Math.sin(t * 0.53 + 1));
    const speed = Math.max(1.6, Math.min(W, H) / 330);
    if (!flocking) targets(t - formStart);
    for (let i = 0; i < N; i++) {
      let ax, ay;
      if (flocking || t < formStart + delay[i]) {
        flow(px[i] + seed[i] * 0.02, py[i], t * 0.6, f);
        const dx = centreX - px[i], dy = centreY - py[i], d = Math.hypot(dx, dy) + 1;
        const pull = Math.min(1.6, d / (Math.min(W, H) * 0.32)) * 0.9;
        ax = (f[0] * speed + (dx / d) * pull * speed - vx[i]) * 0.07;
        ay = (f[1] * speed + (dy / d) * pull * speed - vy[i]) * 0.07;
        vx[i] += ax * k; vy[i] += ay * k;
      } else {
        const wob = 0.6 * Math.sin(t * 1.3 + seed[i]);
        ax = (tx[i] + wob - px[i]) * 0.055; ay = (ty[i] + Math.cos(t * 1.1 + seed[i]) * 0.6 - py[i]) * 0.055;
        vx[i] = vx[i] * Math.pow(0.8, k) + ax * k; vy[i] = vy[i] * Math.pow(0.8, k) + ay * k;
      }
      const mx = px[i] - mouse.x, my = py[i] - mouse.y, md = mx * mx + my * my;
      if (md < 6400) { const d = Math.sqrt(md) + 0.1, push = (1 - d / 80) * 2.4; vx[i] += (mx / d) * push * k; vy[i] += (my / d) * push * k; }
      px[i] += vx[i] * k; py[i] += vy[i] * k;
    }
  }

  const BUCKETS = [0.28, 0.55, 0.8, 1];
  function draw(alpha) {
    ctx.clearRect(0, 0, W, H);
    const flocking = clock < phaseUntil;
    for (let b = 0; b < BUCKETS.length; b++) {
      const lo = b ? BUCKETS[b - 1] : 0, hi = BUCKETS[b];
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const a = flocking || clock < formStart + delay[i] ? 1 : ta[i];
        if (a <= lo || a > hi) continue;
        ctx.rect(px[i], py[i], DOT, DOT);
      }
      ctx.fillStyle = `rgba(0,0,0,${(hi * alpha).toFixed(3)})`;
      ctx.fill();
    }
  }

  // ── switching forms ───────────────────────────────────────────────────────────────────────────
  let pending = null;
  function setForm(next, { lift = 0.55 } = {}) {
    if (next === form && clock > phaseUntil) return;
    form = next;
    if (reduce) { formStart = clock; phaseUntil = 0; targets(0); for (let i = 0; i < N; i++) { px[i] = tx[i]; py[i] = ty[i]; } draw(1); return; }
    phaseUntil = clock + lift;
    formStart = phaseUntil;
    for (let i = 0; i < N; i++) delay[i] = Math.pow(rnd(), 1.6) * 0.75;
  }
  window.addEventListener('flock:form', (e) => {
    clearTimeout(pending);
    pending = setTimeout(() => setForm(e.detail || 'figure'), 90);
  });

  // ── canvas, size, loop ────────────────────────────────────────────────────────────────────────
  function resize() {
    const r = canvas.getBoundingClientRect();
    const was = W;
    W = r.width; H = r.height; DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!was) for (let i = 0; i < N; i++) { const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * Math.min(W, H) * 0.42; px[i] = W * 0.5 + Math.cos(a) * rr * 1.4; py[i] = H * 0.5 + Math.sin(a) * rr * 0.7; }
    if (reduce) setForm(form);
  }

  let running = false, visible = true;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    step(dt); draw(1);
    requestAnimationFrame(frame);
  }
  function start() { if (running || reduce || !visible || document.hidden) return; running = true; last = 0; requestAnimationFrame(frame); }
  function stop() { running = false; }

  canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  canvas.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 120); });

  fetch('/assets/figure.bin').then((r) => r.arrayBuffer()).then((buf) => {
    const raw = new Int16Array(buf);
    bodyCount = Math.min(raw.length / 2, Math.round(N * 0.6));
    figure = { x: new Float32Array(bodyCount), y: new Float32Array(bodyCount) };
    for (let i = 0; i < bodyCount; i++) { figure.x[i] = raw[i * 2] / 10000; figure.y[i] = raw[i * 2 + 1] / 10000; }
    figHang = hangTop(N - bodyCount, HANG_SHARE_FIG);
    resize();
    form = '';
    setForm('figure', { lift: 1.3 });
    start();
  }).catch(() => { canvas.hidden = true; });
})();
