// The living photo of the first screen.
// Andy with his hang is taken apart into tens of thousands of coloured points (assets/img/hero-cut.webp:
// position from the pixel, colour from the photo, a little depth from brightness). The points breathe,
// step aside from the cursor and lean with it. Each statement of the headline gathers them into its own
// form: the hang being played, a hang turning in space, sound waves, a cube. Between forms they lift off
// into a murmuration (a curl-noise flow around a moving centre) and land one by one.
// Trackers follow a few points with live coordinates; a scan line runs over the scene.
// Points are simulated on the CPU and drawn with WebGL in one call.
(() => {
  'use strict';
  const stage = document.querySelector('[data-live]');
  if (!stage) return;
  const canvas = stage.querySelector('canvas');
  const gl = canvas && canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) { stage.classList.add('no-gl'); return; }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = window.matchMedia('(max-width: 760px)').matches;
  const N = phone ? 24000 : 46000;
  const INK = [0.086, 0.08, 0.075], ORANGE = [1, 0.353, 0.122];
  const PHOTO_SRC = '/assets/img/hero-cut.webp';
  const NOTES = ['A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];   // D Kurd 9 around the ding D3

  // deterministic randomness: the forms look the same on every visit
  let s0 = 20261112;
  const rnd = () => { s0 |= 0; s0 = (s0 + 0x6D2B79F5) | 0; let t = Math.imul(s0 ^ (s0 >>> 15), 1 | s0); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // ── state of every point ─────────────────────────────────────────────────────────────────────────
  const px = new Float32Array(N), py = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
  const tx = new Float32Array(N), ty = new Float32Array(N), ta = new Float32Array(N);
  const tr = new Float32Array(N), tg = new Float32Array(N), tb = new Float32Array(N);   // target colour
  const seed = new Float32Array(N), delay = new Float32Array(N), free = new Uint8Array(N);
  const pos = new Float32Array(N * 3);   // x, y, alpha → GPU every frame
  const col = new Float32Array(N * 3);   // r, g, b → GPU while colours move
  for (let i = 0; i < N; i++) { seed[i] = rnd() * 1000; col[i * 3] = INK[0]; col[i * 3 + 1] = INK[1]; col[i * 3 + 2] = INK[2]; }

  // ── models ───────────────────────────────────────────────────────────────────────────────────────

  // The photo: most points on a jittered grid, so the picture is covered evenly and reads as a photo;
  // the rest go to edges and detail, so the face and hands stay sharp.
  let photo = null;   // { u, v, z, r, g, b, w, step } in figure units, height = 1
  function samplePhoto(img, n) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, w, h).data;
    const L = (i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    const inside = (px0, py0) => px0 > 0 && py0 > 0 && px0 < w - 1 && py0 < h - 1 && d[(py0 * w + px0) * 4 + 3] > 150;
    // edge map and the area of the subject
    const cells = new Int32Array(w * h), cum = new Float32Array(w * h);
    let m = 0, total = 0, area = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let xx = 1; xx < w - 1; xx++) {
        const i = (y * w + xx) * 4;
        if (d[i + 3] < 150) continue;
        area++;
        const gx = L(i + 4) - L(i - 4), gy = L(i + w * 4) - L(i - w * 4);
        const edge = Math.min(1, Math.hypot(gx, gy) / 55);
        if (edge < 0.2) continue;
        total += edge;
        cells[m] = y * w + xx; cum[m] = total; m++;
      }
    }
    const out = { u: new Float32Array(n), v: new Float32Array(n), z: new Float32Array(n), r: new Float32Array(n), g: new Float32Array(n), b: new Float32Array(n), w: w / h, step: 0 };
    let k = 0;
    const put = (fx, fy) => {
      const px0 = Math.min(w - 1, fx | 0), py0 = Math.min(h - 1, fy | 0), i = (py0 * w + px0) * 4;
      out.u[k] = fx / h; out.v[k] = fy / h;
      out.r[k] = d[i] / 255; out.g[k] = d[i + 1] / 255; out.b[k] = d[i + 2] / 255;
      out.z[k] = L(i) / 255 - 0.5;
      k++;
    };
    // 1. jittered grid over the subject: ~84% of the points
    const step = Math.sqrt(area / (n * 0.84));
    out.step = step / h;
    for (let gy = 0; gy < h && k < n; gy += step) {
      for (let gx = 0; gx < w && k < n; gx += step) {
        const fx = gx + (0.2 + rnd() * 0.6) * step, fy = gy + (0.2 + rnd() * 0.6) * step;
        if (inside(fx | 0, fy | 0)) put(fx, fy);
      }
    }
    // 2. the rest on edges and detail
    while (k < n && m > 0) {
      const q = rnd() * total;
      let lo = 0, hi = m - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < q) lo = mid + 1; else hi = mid; }
      const cell = cells[lo];
      put((cell % w) + rnd(), ((cell / w) | 0) + rnd());
    }
    // shuffle, so that any slice of the points covers the whole figure
    for (let i = k - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      for (const a of [out.u, out.v, out.z, out.r, out.g, out.b]) { const t = a[i]; a[i] = a[j]; a[j] = t; }
    }
    return out;
  }
  // where the trackers sit on the photo (figure units)
  const PHOTO_TRACKS = [[0.37, 0.19, 'взгляд'], [0.6, 0.47, 'касание'], [0.45, 0.67, 'ханг']];

  // A hang seen from above, in a unit circle: rim, ding, eight tone fields, sparse steel.
  function hangTop(n) {
    const x = new Float32Array(n), y = new Float32Array(n), g = new Int8Array(n);
    const FIELD_R = 0.63, FA = 0.15, FT = 0.115, centres = [];
    for (let k = 0; k < 8; k++) { const a = ((k * 45 + 22.5) * Math.PI) / 180 + Math.PI / 2; centres.push([Math.cos(a) * FIELD_R, Math.sin(a) * FIELD_R, a]); }
    const inField = (u, v) => Math.hypot(u, v) < 0.3 || centres.some(([cx, cy, a]) => {
      const du = u - cx, dv = v - cy, r = du * Math.cos(a) + dv * Math.sin(a), t = -du * Math.sin(a) + dv * Math.cos(a);
      return (r * r) / (FA * FA * 1.4) + (t * t) / (FT * FT * 1.4) < 1;
    });
    const nRim = Math.round(n * 0.2), nDing = Math.round(n * 0.1), nField = Math.round(n * 0.44);
    let i = 0;
    for (; i < nRim; i++) { const a = rnd() * Math.PI * 2, r = 0.955 + rnd() * 0.045; x[i] = Math.cos(a) * r; y[i] = Math.sin(a) * r; g[i] = 0; }
    for (let k = 0; k < nDing; k++, i++) { const a = rnd() * Math.PI * 2, r = k % 5 === 0 ? rnd() * 0.08 : 0.235 + (rnd() - 0.5) * 0.03; x[i] = Math.cos(a) * r; y[i] = Math.sin(a) * r; g[i] = 1; }
    for (let k = 0; k < nField; k++, i++) {
      const f = k % 8, [cx, cy, a] = centres[f], b = rnd() * Math.PI * 2;
      const rr = k % 6 === 0 ? 0.35 + rnd() * 0.12 : 1 + (rnd() - 0.5) * 0.09;
      const r = Math.cos(b) * FA * rr, t = Math.sin(b) * FT * rr;
      x[i] = cx + r * Math.cos(a) - t * Math.sin(a); y[i] = cy + r * Math.sin(a) + t * Math.cos(a); g[i] = 2 + f;
    }
    for (; i < n; i++) {
      let u, v;
      do { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.93; u = Math.cos(a) * r; v = Math.sin(a) * r; } while (inField(u, v));
      x[i] = u; y[i] = v; g[i] = 10;
    }
    return { x, y, g, centres };
  }

  // A hang in space: two shells, the rim, the ding and fields on top, the gu below. part: 1 = ding.
  function hang3d(n) {
    const x = new Float32Array(n), y = new Float32Array(n), z = new Float32Array(n), part = new Uint8Array(n);
    const capPoint = (h, r, a) => { const R = (1 + h * h) / (2 * h); return [Math.cos(a) * r, Math.sqrt(Math.max(0, R * R - r * r)) - (R - h), Math.sin(a) * r]; };
    const capRandom = (h) => { const R = (1 + h * h) / (2 * h), yy = rnd() * h; return [Math.sqrt(Math.max(0, R * R - (yy + R - h) ** 2)), rnd() * Math.PI * 2]; };
    for (let i = 0; i < n; i++) {
      const k = i / n;
      let p;
      if (k < 0.16) { const a = rnd() * Math.PI * 2; p = [Math.cos(a), (rnd() - 0.5) * 0.05, Math.sin(a)]; }
      else if (k < 0.48) { const [r, a] = capRandom(0.36); p = capPoint(0.36, r, a); }
      else if (k < 0.58) { const a = rnd() * Math.PI * 2, r = 0.22 + (rnd() - 0.5) * 0.03; p = capPoint(0.36, r, a); part[i] = 1; }
      else if (k < 0.78) {
        const f = Math.floor(rnd() * 8), fa = (f * Math.PI) / 4 + Math.PI / 8, b = rnd() * Math.PI * 2;
        const u = Math.cos(fa) * 0.62 + Math.cos(b) * 0.13, v = Math.sin(fa) * 0.62 + Math.sin(b) * 0.1;
        p = capPoint(0.36, Math.hypot(u, v), Math.atan2(v, u));
      } else {
        let r, a;
        do { [r, a] = capRandom(0.3); } while (r < 0.27);
        const q = capPoint(0.3, r, a); p = [q[0], -q[1], q[2]];
      }
      x[i] = p[0]; y[i] = p[1]; z[i] = p[2];
    }
    return { x, y, z, part };
  }

  // A cube of points: edges and a light grid on the faces. part: 1 = face grid.
  function cube3d(n) {
    const x = new Float32Array(n), y = new Float32Array(n), z = new Float32Array(n), part = new Uint8Array(n);
    const edges = [];
    for (const a of [-1, 1]) for (const b of [-1, 1]) edges.push([[-1, a, b], [1, a, b]], [[a, -1, b], [a, 1, b]], [[a, b, -1], [a, b, 1]]);
    for (let i = 0; i < n; i++) {
      if (i < n * 0.6) {
        const [p, q] = edges[i % 12], t = rnd();
        x[i] = p[0] + (q[0] - p[0]) * t; y[i] = p[1] + (q[1] - p[1]) * t; z[i] = p[2] + (q[2] - p[2]) * t;
      } else {
        const face = Math.floor(rnd() * 6), axis = face % 3, side = face < 3 ? -1 : 1;
        const line = [-0.5, 0, 0.5][Math.floor(rnd() * 3)], t = rnd() * 2 - 1, along = rnd() < 0.5;
        const c = [0, 0, 0]; c[axis] = side; c[(axis + 1) % 3] = along ? line : t; c[(axis + 2) % 3] = along ? t : line;
        x[i] = c[0]; y[i] = c[1]; z[i] = c[2]; part[i] = 1;
      }
    }
    return { x, y, z, part };
  }

  // Sound: rings that leave the hang and fade. ring = RINGS marks the source in the centre.
  const RINGS = 7;
  function waves(n) {
    const ring = new Uint8Array(n), cs = new Float32Array(n), sn = new Float32Array(n), jit = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2; ring[i] = i % (RINGS + 1); cs[i] = Math.cos(a); sn[i] = Math.sin(a); jit[i] = (rnd() - 0.5) * 0.018; }
    return { ring, cs, sn, jit };
  }

  // structure points per form; the rest of the flock stays around as faint dust
  const COUNT = { hang: phone ? 4600 : 7600, shell: phone ? 4600 : 7600, cube: phone ? 3400 : 5600, waves: phone ? 4600 : 7600 };
  const M = { hang: hangTop(COUNT.hang), shell: hang3d(COUNT.shell), cube: cube3d(COUNT.cube), waves: waves(COUNT.waves) };
  const MELODY = [1, 2, 6, 4, 8, 1, 3, 7, 5, 9];

  // ── layout ───────────────────────────────────────────────────────────────────────────────────────
  let W = 0, H = 0, DPR = 1;
  const frame = { fx: 0, top: 0, FH: 0 };   // where the photo stands
  function layout() {
    if (!photo) return;
    let FH = H * (phone ? 0.94 : 0.9);
    if (photo.w * FH > W * 0.98) FH = (W * 0.98) / photo.w;
    frame.FH = FH; frame.top = H - FH; frame.fx = (W - photo.w * FH) / 2;
  }

  // 3D rotation for the shell and the cube
  function spin3(m, i, ay, ax, R, out) {
    const cyA = Math.cos(ay), syA = Math.sin(ay), cxA = Math.cos(ax), sxA = Math.sin(ax);
    const x1 = m.x[i] * cyA + m.z[i] * syA, z1 = -m.x[i] * syA + m.z[i] * cyA;
    const y2 = m.y[i] * cxA - z1 * sxA, z2 = m.y[i] * sxA + z1 * cxA;
    const p = 1 / (1 - z2 * 0.18);
    out[0] = W / 2 + x1 * R * p; out[1] = H / 2 - y2 * R * p; out[2] = z2;
  }

  // ── targets of the current form, every frame ─────────────────────────────────────────────────────
  let form = 'photo', formStart = 0, phaseUntil = 0;
  const sway = { x: 0, y: 0, tx: 0, ty: 0 };
  const tmp = [0, 0, 0];
  let active = { field: -1, since: 0 };

  function setColor(i, c, k = 1) { tr[i] = c[0] * k + INK[0] * (1 - k); tg[i] = c[1] * k + INK[1] * (1 - k); tb[i] = c[2] * k + INK[2] * (1 - k); }

  function targets(t) {
    const S = Math.min(W, H);
    if (form === 'photo' && photo) {
      const { fx, top, FH } = frame, edge = photo.w;
      const breathe = 1 + 0.004 * Math.sin(t * 0.7);   // the figure breathes from its feet
      const cx = fx + (edge / 2) * FH, bottom = top + FH;
      for (let i = 0; i < N; i++) {
        const u = photo.u[i], v = photo.v[i], z = photo.z[i];
        tx[i] = cx + (u - edge / 2) * FH * breathe + z * sway.x;
        ty[i] = bottom - (1 - v) * FH * breathe + z * sway.y;
        ta[i] = smooth(edge, edge - 0.05, u) * smooth(1, 0.96, v);
        free[i] = 0;
      }
      return;
    }
    const n = COUNT[form];
    for (let i = n; i < N; i++) { free[i] = 1; ta[i] = 0.04; setColor(i, INK); }
    if (form === 'hang') {
      const m = M.hang, R = S * 0.4, beat = 0.48, step = Math.floor(t / beat), since = t - step * beat;
      const field = MELODY[step % MELODY.length];
      const centre = field === 1 ? [0, 0] : m.centres[field - 2];
      const k = 1 + 0.22 * Math.exp(-since * 6), glow = Math.exp(-since * 2.2);
      const rot = t * 0.05, c = Math.cos(rot), s = Math.sin(rot);
      active = { field, since, centre, rot, R };
      for (let i = 0; i < n; i++) {
        let u = m.x[i], v = m.y[i];
        const hit = m.g[i] === field;
        if (hit) { u = centre[0] + (u - centre[0]) * k; v = centre[1] + (v - centre[1]) * k; }
        tx[i] = W / 2 + (u * c - v * s) * R; ty[i] = H / 2 + (u * s + v * c) * R;
        ta[i] = hit ? 1 : 0.86; free[i] = 0;
        setColor(i, ORANGE, hit ? glow : 0);
      }
    } else if (form === 'shell' || form === 'cube') {
      const m = M[form], isShell = form === 'shell';
      const R = isShell ? S * 0.37 : S * 0.24;
      const ay = t * (isShell ? 0.42 : 0.35), ax = isShell ? 0.5 : 0.55 + Math.sin(t * 0.3) * 0.1;
      for (let i = 0; i < n; i++) {
        spin3(m, i, ay, ax, R, tmp);
        tx[i] = tmp[0]; ty[i] = tmp[1];
        ta[i] = (0.3 + 0.62 * (tmp[2] + 1.2) / 2.4) * (m.part[i] && !isShell ? 0.6 : 1); free[i] = 0;
        setColor(i, ORANGE, isShell && m.part[i] && i % 2 ? 1 : 0);
      }
    } else if (form === 'waves') {
      const m = M.waves, Rmax = S * 0.47, speed = 0.16;
      for (let i = 0; i < n; i++) {
        free[i] = 0;
        if (m.ring[i] === RINGS) {
          const rr = Math.sqrt(seed[i] % 1) * S * 0.035;
          tx[i] = W / 2 + m.cs[i] * rr; ty[i] = H / 2 + m.sn[i] * rr; ta[i] = 1; setColor(i, ORANGE); continue;
        }
        const phase = (m.ring[i] / RINGS + t * speed) % 1;
        const r = (0.06 + phase * 0.94 + m.jit[i]) * Rmax;
        tx[i] = W / 2 + m.cs[i] * r; ty[i] = H / 2 + m.sn[i] * r * 0.98;
        ta[i] = phase < 0.08 ? phase / 0.08 : 1 - Math.max(0, phase - 0.55) / 0.45;
        setColor(i, INK);
      }
    }
  }

  // ── trackers ─────────────────────────────────────────────────────────────────────────────────────
  const layer = stage.querySelector('.live-trackers');
  const tags = [];
  for (let k = 0; k < 3; k++) {
    const el = document.createElement('div');
    el.className = 'tracker';
    el.innerHTML = '<i aria-hidden="true"></i><span></span>';
    layer && layer.appendChild(el);
    tags.push({ el, text: el.querySelector('span'), last: '' });
  }
  function trackerSpots(t) {
    const S = Math.min(W, H), out = [];
    if (form === 'photo' && photo) {
      for (const [u, v, label] of PHOTO_TRACKS) out.push([frame.fx + u * frame.FH + sway.x * 0.3, frame.top + v * frame.FH + sway.y * 0.3, label]);
    } else if (form === 'hang' && active.centre) {
      const c = Math.cos(active.rot), s = Math.sin(active.rot), [u, v] = active.centre;
      out.push([W / 2, H / 2, 'D3 · динг']);
      if (active.field !== 1) out.push([W / 2 + (u * c - v * s) * active.R, H / 2 + (u * s + v * c) * active.R, NOTES[active.field - 2]]);
      out.push([W / 2 + Math.cos(-0.5) * active.R, H / 2 + Math.sin(-0.5) * active.R, 'D Kurd 9']);
    } else if (form === 'shell') {
      const ay = (t - formStart) * 0.42;
      for (const [x, y, z, label] of [[1, 0, 0, 'Ø 53 см'], [0, 0.36, 0, '9 нот'], [0, -0.3, 0, 'гу']]) {
        spin3({ x: [x], y: [y], z: [z] }, 0, ay, 0.5, S * 0.37, tmp); out.push([tmp[0], tmp[1], label]);
      }
    } else if (form === 'cube') {
      const ay = (t - formStart) * 0.35, ax = 0.55 + Math.sin((t - formStart) * 0.3) * 0.1;
      for (const [x, y, z, label] of [[1, 1, 1, 'идея'], [-1, -1, 1, 'код'], [1, -1, -1, 'запуск']]) {
        spin3({ x: [x], y: [y], z: [z] }, 0, ay, ax, S * 0.24, tmp); out.push([tmp[0], tmp[1], label]);
      }
    } else if (form === 'waves') {
      out.push([W / 2, H / 2, 'живой звук'], [W / 2 + Math.cos(-0.7) * S * 0.36, H / 2 + Math.sin(-0.7) * S * 0.36, '15–90 мин']);
    }
    return out;
  }
  let tagTick = 0;
  function drawTrackers(t, force) {
    if (!layer) return;
    const ready = t > phaseUntil + 0.6;
    const spots = ready ? trackerSpots(t) : [];
    const writeText = force || tagTick++ % 8 === 0;
    tags.forEach((tag, k) => {
      const s = spots[k];
      tag.el.classList.toggle('is-on', !!s);
      if (!s) return;
      tag.el.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px)`;
      tag.el.classList.toggle('is-left', s[0] > W - 190);   // label flips inward near the right edge
      if (writeText) {
        const fx = (s[0] / W) * 2 - 1, fy = 1 - (s[1] / H) * 2, sign = (v) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(2);
        const text = `0${k + 1} ${sign(fx)} ${sign(fy)} ${s[2]}`;
        if (text !== tag.last) { tag.text.textContent = text; tag.last = text; }
      }
    });
  }

  // ── murmuration flow ─────────────────────────────────────────────────────────────────────────────
  // curl of ψ = sin(x·a + t)·cos(y·b − t) + ½·sin((x + y)·c + t): an incompressible, swirling field
  function flow(x, y, t, out) {
    const a = 0.0062, b = 0.0071, c = 0.0043;
    const s1 = Math.sin(x * a + t * 0.7), c1 = Math.cos(x * a + t * 0.7);
    const s2 = Math.sin(y * b - t * 0.6), c2 = Math.cos(y * b - t * 0.6);
    const c3 = Math.cos((x + y) * c + t * 0.5);
    out[0] = (-b * s1 * s2 + 0.5 * c * c3) / 0.008;
    out[1] = -(a * c1 * c2 + 0.5 * c * c3) / 0.008;
  }

  // ── simulation ───────────────────────────────────────────────────────────────────────────────────
  const mouse = { x: -9999, y: -9999 };
  const f = [0, 0];
  let clock = 0, colorsMoving = true;

  function step(dt) {
    clock += dt;
    const t = clock, k = Math.min(2, dt * 60);
    const flocking = t < phaseUntil;
    const centreX = W * (0.5 + 0.22 * Math.sin(t * 0.37)), centreY = H * (0.5 + 0.18 * Math.sin(t * 0.53 + 1));
    const speed = Math.max(1.6, Math.min(W, H) / 330);
    sway.x += (sway.tx - sway.x) * 0.05 * k; sway.y += (sway.ty - sway.y) * 0.05 * k;
    if (!flocking) targets(t - formStart);
    const ease = Math.min(1, 0.045 * k), wob = form === 'photo' && !flocking ? 0.22 : 0.6;
    let moving = false;
    for (let i = 0; i < N; i++) {
      const flying = flocking || free[i] || t < formStart + delay[i];
      if (flying) {
        flow(px[i] + seed[i] * 0.02, py[i], t * 0.6, f);
        const dx = centreX - px[i], dy = centreY - py[i], d = Math.hypot(dx, dy) + 1;
        const pull = Math.min(1.6, d / (Math.min(W, H) * 0.32)) * 0.9;
        vx[i] += (f[0] * speed + (dx / d) * pull * speed - vx[i]) * 0.07 * k;
        vy[i] += (f[1] * speed + (dy / d) * pull * speed - vy[i]) * 0.07 * k;
      } else {
        const ax = (tx[i] + wob * Math.sin(t * 1.3 + seed[i]) - px[i]) * 0.055;
        const ay = (ty[i] + wob * Math.cos(t * 1.1 + seed[i]) - py[i]) * 0.055;
        const damp = Math.pow(0.8, k);
        vx[i] = vx[i] * damp + ax * k; vy[i] = vy[i] * damp + ay * k;
      }
      const mx = px[i] - mouse.x, my = py[i] - mouse.y, md = mx * mx + my * my;
      if (md < 8100) { const dd = Math.sqrt(md) + 0.1, push = (1 - dd / 90) * 2.6; vx[i] += (mx / dd) * push * k; vy[i] += (my / dd) * push * k; }
      px[i] += vx[i] * k; py[i] += vy[i] * k;
      const j = i * 3;
      const aim = flocking ? (free[i] ? 0.04 : 0.75) : (t < formStart + delay[i] && !free[i] ? 0.75 : ta[i]);
      pos[j] = px[i]; pos[j + 1] = py[i]; pos[j + 2] += (aim - pos[j + 2]) * ease;
      if (colorsMoving) {
        const landed = !flying || free[i];
        const r = landed ? tr[i] : INK[0], g = landed ? tg[i] : INK[1], b = landed ? tb[i] : INK[2];
        const dr = r - col[j], dg = g - col[j + 1], db = b - col[j + 2];
        col[j] += dr * ease * 1.4; col[j + 1] += dg * ease * 1.4; col[j + 2] += db * ease * 1.4;
        if (dr * dr + dg * dg + db * db > 1e-5) moving = true;
      }
    }
    colorsMoving = moving || form === 'hang' || form === 'shell' || form === 'waves' || flocking;
  }

  // ── WebGL ────────────────────────────────────────────────────────────────────────────────────────
  const VS = `attribute vec3 aP; attribute vec3 aC;
uniform vec2 uRes; uniform float uSize, uScan, uScanOn;
varying vec3 vC; varying float vA;
void main() {
  vec2 c = aP.xy / uRes * 2.0 - 1.0;
  gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
  float s = uScanOn * exp(-pow((aP.y - uScan) / 3.5, 2.0));
  vC = mix(aC, vec3(1.0, 0.353, 0.122), s * 0.6);
  vA = aP.z;
  gl_PointSize = uSize * (1.0 + s * 0.25);
}`;
  const FS = `precision mediump float;
varying vec3 vC; varying float vA;
void main() {
  vec2 d = gl_PointCoord - 0.5; float r = dot(d, d);
  if (r > 0.25) discard;
  float a = vA * smoothstep(0.25, 0.14, r);
  gl_FragColor = vec4(vC * a, a);
}`;
  function shader(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
  const vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
  const prog = gl.createProgram();
  if (vs && fs) { gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); }
  if (!vs || !fs || !gl.getProgramParameter(prog, gl.LINK_STATUS)) { stage.classList.add('no-gl'); return; }
  gl.useProgram(prog);
  const U = { res: gl.getUniformLocation(prog, 'uRes'), size: gl.getUniformLocation(prog, 'uSize'), scan: gl.getUniformLocation(prog, 'uScan'), scanOn: gl.getUniformLocation(prog, 'uScanOn') };
  const posBuf = gl.createBuffer(), colBuf = gl.createBuffer();
  const aP = gl.getAttribLocation(prog, 'aP'), aC = gl.getAttribLocation(prog, 'aC');
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, pos.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, colBuf); gl.bufferData(gl.ARRAY_BUFFER, col, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(aC); gl.vertexAttribPointer(aC, 3, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let pointSize = 1.6, sizeAim = 1.6, scanOn = !reduce, uploadColors = true;
  const scanLine = stage.querySelector('.live-scan');
  function photoPointSize() {
    if (!photo) return 1.6;
    // grid step on screen; points slightly larger than the step overlap into a continuous picture
    return Math.min(6.5, Math.max(1.3, photo.step * frame.FH * 1.85));
  }

  function draw(t) {
    pointSize += (sizeAim - pointSize) * 0.06;
    const scanY = (((t * 0.085) % 1.25) - 0.12) * H;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.res, W, H);
    gl.uniform1f(U.size, pointSize * DPR);
    gl.uniform1f(U.scan, scanY);
    gl.uniform1f(U.scanOn, scanOn ? 1 : 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    if (uploadColors) { gl.bindBuffer(gl.ARRAY_BUFFER, colBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, col); }
    uploadColors = colorsMoving;
    gl.drawArrays(gl.POINTS, 0, N);
    if (scanLine) scanLine.style.transform = `translateY(${scanY.toFixed(1)}px)`;
  }

  // ── switching forms ──────────────────────────────────────────────────────────────────────────────
  function setForm(next, { lift = 0.55 } = {}) {
    if (next === 'figure' || !next) next = 'photo';
    if (next === form && clock > phaseUntil) return;
    form = next;
    stage.dataset.form = form;
    sizeAim = form === 'photo' ? photoPointSize() : (phone ? 1.5 : 1.7);
    colorsMoving = true; uploadColors = true;
    if (form === 'photo') for (let i = 0; i < N; i++) { tr[i] = photo.r[i]; tg[i] = photo.g[i]; tb[i] = photo.b[i]; }
    if (reduce) {
      formStart = clock; phaseUntil = 0; targets(0);
      for (let i = 0; i < N; i++) { const j = i * 3; px[i] = tx[i]; py[i] = ty[i]; pos[j] = px[i]; pos[j + 1] = py[i]; pos[j + 2] = free[i] ? 0 : ta[i]; col[j] = tr[i]; col[j + 1] = tg[i]; col[j + 2] = tb[i]; }
      pointSize = sizeAim; uploadColors = true; draw(0); drawTrackers(0, true);
      return;
    }
    phaseUntil = clock + lift;
    formStart = phaseUntil;
    for (let i = 0; i < N; i++) delay[i] = Math.pow(rnd(), 1.6) * 0.75;
  }
  let pending = 0;
  window.addEventListener('flock:form', (e) => { clearTimeout(pending); pending = setTimeout(() => setForm(e.detail), 90); });

  // ── size, loop, input ────────────────────────────────────────────────────────────────────────────
  function resize() {
    const r = canvas.getBoundingClientRect();
    const first = !W;
    W = Math.max(1, r.width); H = Math.max(1, r.height); DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    layout();
    if (form === 'photo') sizeAim = photoPointSize();
    if (first) for (let i = 0; i < N; i++) { const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * Math.min(W, H) * 0.45; px[i] = W * 0.5 + Math.cos(a) * rr; py[i] = H * 0.55 + Math.sin(a) * rr * 0.9; }
    if (reduce && photo) { const was = form; form = ''; setForm(was); }
  }

  let running = false, visible = true, last = 0;
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    step(dt); draw(clock); drawTrackers(clock);
    requestAnimationFrame(loop);
  }
  function start() { if (running || reduce || !visible || document.hidden || !photo) return; running = true; last = 0; requestAnimationFrame(loop); }
  function stop() { running = false; }

  stage.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    sway.tx = ((mouse.x / W) * 2 - 1) * -9; sway.ty = ((mouse.y / H) * 2 - 1) * -5;
  });
  stage.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; sway.tx = sway.ty = 0; });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); }).observe(stage);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 120); });

  // legend: trackers and scan on/off
  stage.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    if (b.dataset.toggle === 'scan') { scanOn = on; stage.classList.toggle('no-scan', !on); }
    else stage.classList.toggle('no-trackers', !on);
    if (reduce) draw(0);
  }));

  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    photo = samplePhoto(img, N);
    resize();
    form = '';
    stage.classList.add('is-live');
    setForm('photo', { lift: 1.1 });
    start();
  };
  img.onerror = () => stage.classList.add('no-gl');
  img.src = PHOTO_SRC;
})();
