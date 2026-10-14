// Mayank Tiwari — portfolio motion layer.
// One persistent WebGL particle field morphs between a shape per section; GSAP + Lenis drive everything else.
import * as THREE from 'three';

const { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, Lenis } = window;
gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = gsap.utils.clamp;
const EMAIL = 'mayank.tiwarii1720@gmail.com';
const GH = 'https://github.com/nika619';
if (RM) root.classList.add('rm');

history.scrollRestoration = 'manual';
scrollTo(0, 0);

const lenis = new Lenis({ lerp: 0.085, smoothWheel: !RM });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// pinned sections sit inside a pin-spacer; that wrapper is the real scroll target
const spacer = el => (el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el);
const go = target => lenis.scrollTo(typeof target === 'string' ? spacer($(target)) : target, { duration: 1.7, easing: t => 1 - (1 - t) ** 4 });

/* ───────────────────────── WebGL particle field ───────────────────────── */
const SCENES = {
  hero:    { s: 'core',    p: [0, .12, 0],     r: [.38, 0, .14], o: 1,   spin: .12, m: [0, 1.5, 0] },
  philo:   { s: 'wave',    p: [0, -1.75, -3],  r: [.1, 0, 0],    o: .5,  spin: 0 },
  vault:   { s: 'halo',    p: [0, 0, 0],       r: [0, 0, 0],     o: .6,  spin: 0 },
  rail:    { s: 'helix',   p: [0, -.1, -2.6],  r: [0, 0, .1],    o: .42, spin: 0 },
  work:    { s: 'dust',    p: [0, 0, 0],       r: [0, 0, 0],     o: .45, spin: .03 },
  skills:  { s: 'lattice', p: [0, .2, -2.2],   r: [.62, .79, 0], o: .72, spin: .12, a: .45 },
  exp:     { s: 'spiral',  p: [3.7, 0, -1.2],  r: [0, 0, .12],   o: .42, spin: .28, m: [1.75, 0, -1.2] },
  contact: { s: 'globe',   p: [0, -3.95, 0],   r: [.22, 0, 0],   o: .8,  spin: .07 },
};
// the skills filter swaps that scene's form: one signature shape per discipline
const DISCIPLINES = {
  all:       { s: 'lattice', r: [.62, .79, 0],  spin: .12 },
  frontend:  { s: 'knot',    r: [.3, 0, 0],     spin: .3 },
  backend:   { s: 'stack',   r: [.2, .5, 0],    spin: .16 },
  languages: { s: 'braces',  r: [0, 0, 0],      spin: 0 },
  ai:        { s: 'neural',  r: [.08, -.25, 0], spin: 0 },
};
// per scene: slate label, then where the warm and the teal key light sit (vw, vh)
const STAGE = {
  hero:    ['COLD OPEN', 72, 28, 12, 82],
  philo:   ['THE PHILOSOPHY', 50, 96, 86, 10],
  vault:   ['INT. SYSTEMS VAULT', 50, 50, 8, 20],
  rail:    ['FLAGSHIP SUITE', 18, 40, 88, 78],
  work:    ['THE ARCHIVE', 84, 30, 10, 70],
  skills:  ['CAPABILITIES', 50, 42, 90, 88],
  exp:     ['MILESTONES', 80, 55, 12, 18],
  contact: ['FINAL CUT', 50, 92, 20, 12],
};

function buildShapes(N) {
  const R = Math.random, TAU = Math.PI * 2, GOLD = Math.PI * (3 - Math.sqrt(5));
  const mk = fn => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) a.set(fn(i, i / N), i * 3); return a; };
  const fib = (i, n, r) => { const y = 1 - (i / (n - 1)) * 2, q = Math.sqrt(Math.max(0, 1 - y * y)), a = i * GOLD; return [Math.cos(a) * q * r, y * r, Math.sin(a) * q * r]; };
  const cols = Math.ceil(Math.sqrt(N * 2));
  // rasterise a glyph and scatter the particles over its filled pixels
  const glyph = txt => {
    const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true }), px = [];
    c.width = 320; c.height = 220;
    x.font = '700 150px ui-monospace, Consolas, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
    x.fillText(txt, 160, 112);
    const d = x.getImageData(0, 0, 320, 220).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 128) px.push(i >> 2);
    if (!px.length) return () => [(R() - .5) * 4, (R() - .5) * 3, 0]; // canvas readback blocked
    return () => { const q = px[Math.floor(R() * px.length)]; return [(q % 320 + R() - 160) / 44, (110 - Math.floor(q / 320) - R()) / 44, (R() - .5) * .4]; };
  };
  const LAYERS = [4, 6, 6, 3], node = (l, k) => [(l - 1.5) * 1.7, (k - (LAYERS[l] - 1) / 2) * .78];
  return {
    scatter: mk(() => [(R() - .5) * 24, (R() - .5) * 15, (R() - .5) * 16 - 3]),
    dust: mk(() => [(R() - .5) * 21, (R() - .5) * 13, (R() - .5) * 11 - 1]),
    // dense shell, inner dust, one orbit ring
    core: mk((i, t) => {
      if (t < .7) return fib(i, N * .7, 1.72 + (R() - .5) * .05);
      if (t < .84) return fib(Math.floor(R() * N), N, R() ** .5 * 1.5);
      const a = R() * TAU, r = 2.75 + (R() - .5) * .45 * R();
      return [Math.cos(a) * r, (R() - .5) * .04, Math.sin(a) * r];
    }),
    wave: mk(i => {
      const x = (i % cols) / cols, z = Math.floor(i / cols) / (N / cols);
      return [(x - .5) * 24, Math.sin(x * 19) * Math.cos(z * 9) * .34 + Math.sin(z * 15 + x * 6) * .16, (z - .5) * 11];
    }),
    halo: mk((i, t) => {
      const a = R() * TAU, r = t < .62 ? 2.06 + (R() - .5) * .05 : 2.06 + R() ** 2.2 * 2.6;
      return [Math.cos(a) * r, Math.sin(a) * r, (R() - .5) * .35];
    }),
    // double helix along x with rungs — a hash chain
    helix: mk((i, t) => {
      const x = (t - .5) * 27, a = x * 1.1;
      if (i % 3 < 2) { const o = (i % 3) * Math.PI, r = 1.25 + (R() - .5) * .07; return [x, Math.cos(a + o) * r, Math.sin(a + o) * r]; }
      const xs = Math.round(x * 2) / 2, k = (R() * 2 - 1) * 1.25;
      return [xs, Math.cos(xs * 1.1) * k, Math.sin(xs * 1.1) * k];
    }),
    // hollow cube: gridded faces plus the twelve edges drawn denser, so it reads as a cube rather than a filled block
    lattice: mk(() => {
      const h = 1.6, g = 4, node = () => (Math.floor(R() * (g + 1)) / g - .5) * 2 * h, edge = () => (R() < .5 ? -h : h);
      const ax = Math.floor(R() * 3), o = [0, 1, 2].filter(k => k !== ax), p = [0, 0, 0], k = R() < .5 ? 0 : 1;
      p[ax] = (R() - .5) * 2 * h;
      if (R() < .35) { p[o[0]] = edge(); p[o[1]] = edge(); } else { p[o[k]] = edge(); p[o[1 - k]] = node(); }
      return p;
    }),
    knot: mk((i, t) => {
      const a = t * TAU, r = (Math.cos(3 * a) + 2) * .78, j = () => (R() - .5) * .22;
      return [r * Math.cos(2 * a) + j(), r * Math.sin(2 * a) + j(), -Math.sin(3 * a) * .78 + j()];
    }),
    // three stacked drums: the database glyph
    stack: mk(i => {
      const a = R() * TAU, y = (i % 3 - 1) * 1.45, t = R(), c = Math.cos(a) * 1.55, z = Math.sin(a) * 1.55;
      if (t < .18) { const r = Math.sqrt(R()); return [c * r, y + .28, z * r]; } // lid
      if (t < .68) return [c, y + (R() < .5 ? .28 : -.28), z];                    // bright rims carry the silhouette
      return [c, y + (R() - .5) * .56, z];
    }),
    braces: mk(glyph('{ }')),
    // a small feed-forward network: glowing nodes, faint weights between layers
    neural: mk(() => {
      const l = Math.floor(R() * 3), a = node(l, Math.floor(R() * LAYERS[l])), b = node(l + 1, Math.floor(R() * LAYERS[l + 1])), k = R();
      if (k < .45) { const n = k < .225 ? a : b, d = fib(Math.floor(R() * 400), 400, .14 * Math.cbrt(R())); return [n[0] + d[0], n[1] + d[1], d[2]]; }
      const u = R(); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, (R() - .5) * .05];
    }),
    spiral: mk((i, t) => {
      const y = (t - .5) * 14, a = y * 1.55 + (i % 2) * Math.PI, r = 1.05 + Math.sin(y * .7) * .28 + (R() - .5) * .1;
      return [Math.cos(a) * r, y, Math.sin(a) * r];
    }),
    globe: mk((i, t) => {
      const r = 3.3;
      if (t < .5) return fib(i, N * .5, r);
      if (R() < .5) { const lo = Math.floor(R() * 18) / 18 * TAU, la = (R() - .5) * Math.PI; return [Math.cos(la) * Math.cos(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.sin(lo) * r]; }
      const la = (Math.floor(R() * 13) - 6) / 7 * (Math.PI / 2), a = R() * TAU;
      return [Math.cos(la) * Math.cos(a) * r, Math.sin(la) * r, Math.cos(la) * Math.sin(a) * r];
    }),
  };
}

const VERT = /* glsl */`
attribute vec3 aTo; attribute vec4 aRnd;
uniform float uT, uP, uTurb, uSize, uDpr, uHov, uFocus, uAper, uBurst; uniform vec3 uMouse;
varying float vA, vHot, vBlur;
vec3 flow(vec3 p, float t){ return vec3(sin(p.y*1.7+t)+sin(p.z*2.3-t*.7), sin(p.z*1.9+t*.8)+sin(p.x*2.1+t*.6), sin(p.x*1.6-t*.9)+sin(p.y*2.5+t*.5))*.5; }
void main(){
  float p = smoothstep(0., 1., clamp(uP*1.35 - aRnd.x*.35, 0., 1.));
  vec3 pos = mix(position, aTo, p);
  float bell = sin(p*3.14159265);
  // diffusion: every morph swirls and breathes outward before it settles into the next form
  pos += flow(pos*.9 + aRnd.yzw*6.283, uT*.5) * (.035 + bell*.75 + uTurb*.12 + uBurst*.45);
  pos += normalize(pos + .0001) * (bell*.4 + uBurst*.75) * (.35 + aRnd.z);
  vec4 wp = modelMatrix * vec4(pos, 1.);
  vec2 dm = wp.xy - uMouse.xy; float md = length(dm);
  wp.xy += dm / (md + .0001) * smoothstep(1.3, 0., md) * .42 * uHov;
  vec4 mv = viewMatrix * wp;
  gl_Position = projectionMatrix * mv;
  // depth of field: points off the focal plane open into soft bokeh discs
  float dist = max(-mv.z, .1);
  float base = uSize * uDpr * (.45 + aRnd.w*aRnd.w*1.6) / dist;
  float coc = abs(dist - uFocus) * uAper * uDpr;
  float size = base + coc;
  gl_PointSize = clamp(size, 1., 30.*uDpr);
  vBlur = clamp(coc / (base*1.5 + .5), 0., 1.);
  vA = (.55 + .45*sin(uT*(1.5 + aRnd.y*2.) + aRnd.z*40.)) * smoothstep(-22., -4., mv.z) * pow(base / size, 1.2);
  vHot = pow(aRnd.w, 6.);
}`;
const FRAG = /* glsl */`
uniform vec3 uCol, uHot; uniform float uO; varying float vA, vHot, vBlur;
void main(){
  float d = length(gl_PointCoord - .5) * 2.;
  float soft = smoothstep(1., 0., d); soft *= soft;
  float disc = smoothstep(1., .8, d) * (.4 + .3*d);
  gl_FragColor = vec4(mix(uCol, uHot, vHot), mix(soft, disc, vBlur) * vA * uO * .8);
  #include <colorspace_fragment>
}`;

function initGL() {
  const noop = () => {}, stub = { goto: noop, tint: noop, twist: noop, intro: noop, burst: noop };
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: false, powerPreference: 'high-performance' }); } catch { return stub; }
  const small = innerWidth < 900, N = small ? 24000 : 70000, dpr = Math.min(devicePixelRatio, small ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x08080a, 1);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(45, 1, .1, 60);
  cam.position.z = 6;
  const S = buildShapes(N), rnd = new Float32Array(N * 4).map(Math.random);
  const geo = new THREE.BufferGeometry();
  const from = new THREE.BufferAttribute(S.scatter.slice(), 3), to = new THREE.BufferAttribute(S.scatter.slice(), 3);
  geo.setAttribute('position', from); geo.setAttribute('aTo', to); geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
  const U = { uT: { value: 0 }, uP: { value: 1 }, uTurb: { value: 0 }, uSize: { value: small ? 17 : 26 }, uDpr: { value: dpr }, uHov: { value: 0 }, uO: { value: 0 }, uFocus: { value: 6 }, uAper: { value: 1 }, uBurst: { value: 0 },
    uMouse: { value: new THREE.Vector3() }, uCol: { value: new THREE.Color('#fc5b2e') }, uHot: { value: new THREE.Color('#fff1e0') } };
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false;
  scene.add(pts);

  const rot = { x: 0, y: 0, z: 0 }, spin = { a: 0, v: 0 }, m = { x: 0, y: 0, tx: 0, ty: 0 };
  let twist = 0, vel = 0, cur = 'scatter', live = false, pending = 'hero';
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); scene.scale.setScalar(clamp(.55, 1, cam.aspect / 1.45)); };
  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { m.tx = e.clientX / innerWidth * 2 - 1; m.ty = 1 - e.clientY / innerHeight * 2; if (FINE) U.uHov.value = 1; });

  function goto(name, dur = RM ? 0 : 2.4, force) {
    if (!live) { pending = name; return; }
    const c = SCENES[name];
    if (!c || (name === cur && !force)) return;
    cur = name;
    // bake the in-flight positions into "from" (same per-particle stagger as the shader) so a mid-morph retarget never pops
    const a = from.array, b = to.array, p = U.uP.value;
    for (let i = 0; i < N; i++) {
      let k = clamp(0, 1, p * 1.35 - rnd[i * 4] * .35); k = k * k * (3 - 2 * k);
      const j = i * 3;
      a[j] += (b[j] - a[j]) * k; a[j + 1] += (b[j + 1] - a[j + 1]) * k; a[j + 2] += (b[j + 2] - a[j + 2]) * k;
    }
    b.set(S[c.s]);
    from.needsUpdate = to.needsUpdate = true;
    U.uP.value = 0;
    const o = { duration: dur, ease: 'power3.inOut', overwrite: true };
    gsap.to(U.uP, { value: 1, ...o });
    const at = (small && c.m) || c.p;
    gsap.to(U.uO, { value: c.o * (small ? .65 : 1), ...o });
    gsap.to(pts.position, { x: at[0], y: at[1], z: at[2], ...o });
    gsap.to(U.uFocus, { value: cam.position.z - at[2] * scene.scale.x, ...o });
    gsap.to(U.uAper, { value: (c.a ?? 1.7) * (small ? .6 : 1), ...o });
    gsap.to(rot, { x: c.r[0], y: c.r[1], z: c.r[2], ...o });
    spin.a %= Math.PI * 2;
    gsap.to(spin, c.spin ? { v: c.spin, ...o } : { v: 0, a: 0, ...o });
  }

  gsap.ticker.add((_, dt) => {
    if (document.hidden) return;
    const d = Math.min(dt, 50) / 1000;
    U.uT.value += d;
    m.x += (m.tx - m.x) * .06; m.y += (m.ty - m.y) * .06;
    vel += ((lenis.velocity || 0) - vel) * .1;
    U.uTurb.value = Math.min(1, Math.abs(vel) / 50);
    spin.a += spin.v * d;
    pts.rotation.set(rot.x - m.y * .12 + twist, rot.y + spin.a + m.x * .18, rot.z);
    const hh = Math.tan(cam.fov * Math.PI / 360) * cam.position.z;
    U.uMouse.value.set(m.x * hh * cam.aspect, m.y * hh, 0);
    renderer.render(scene, cam);
  });

  const tint = hex => { const c = new THREE.Color(hex); gsap.to(U.uCol.value, { r: c.r, g: c.g, b: c.b, duration: 1.2 }); };
  const burst = (v = 1) => { gsap.killTweensOf(U.uBurst); gsap.timeline().to(U.uBurst, { value: v, duration: .22, ease: 'power2.out' }).to(U.uBurst, { value: 0, duration: 1.4, ease: 'expo.out' }); };
  return { goto, tint, burst, twist: v => (twist = v), intro: (dur = 3.4) => { live = true; goto(pending, dur); } };
}

/* ───────────────────────── UI that must work with or without motion ───────────────────────── */
let toastT;
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800); };
const copyEmail = () => navigator.clipboard.writeText(EMAIL).then(() => toast('Email copied to clipboard.'), () => toast(EMAIL));

function openDlg(d) {
  if (d.open) return;
  d.showModal();
  lenis.stop();
  root.classList.remove('has-cur'); // the custom cursor cannot draw above the top layer
  if (RM) return;
  gsap.fromTo(d, { opacity: 0 }, { opacity: 1, duration: .3 });
  gsap.fromTo($('.dlg-box', d), { y: 60, scale: .94, filter: 'blur(14px)' }, { y: 0, scale: 1, filter: 'blur(0px)', duration: .8, ease: 'expo.out', clearProps: 'filter' });
}
function closeDlg(d, then) {
  if (!d.open) return;
  const done = () => { d.close(); lenis.start(); if (FINE && !RM) root.classList.add('has-cur'); then?.(); };
  RM ? done() : gsap.to(d, { opacity: 0, duration: .22, onComplete: done });
}

const PROJECTS = {
  parity: { chrome: 'parity-rosy.vercel.app', kick: '01 / 04 · WINNER · LOVHACK S2', title: 'Parity — Autonomous 5-Round AI Voice Debate Arena', img: 'images/parity.webp',
    desc: 'Winner at LovHack Season 2. Autonomous 5-round AI voice debate arena with sub-second turnaround latency, conversational collision detection, and automated argument judging.',
    tags: ['Gemini Flash', 'Web Speech API', 'WebSocket', 'React', 'Winner LovHack S2'], links: [['Live Arena ↗', 'https://parity-rosy.vercel.app'], ['GitHub ↗', GH]] },
  'career-pathfinder': { chrome: 'career-pathfinder.ai', kick: '02 / 04 · RANK #6 NATIONAL FINALIST · AMPLIFIED S1', title: 'Career PathFinder — Autonomous Multi-Agent Guidance Engine', img: 'images/career.webp',
    desc: 'National Finalist (Rank #6 Nationwide) in AMPlified Season 1. Multi-agent syllabus gap engine matching 300D vector cosine similarity against 900+ O*NET occupational codes. 54/54 tests pass.',
    tags: ['Python', 'Vector Cosine Similarity', 'Multi-Agent DAG', 'FastAPI', '54/54 Tests Pass'], links: [['GitHub Repository ↗', GH + '/Career-pathfinder-nika619'], ['AMPlified Finals ↗', 'https://www.hackerearth.com/challenges/hackathon/amplified-season-1/']] },
  'eco-ops': { chrome: 'eco-ops.cloudrun.app', kick: '03 / 04 · GITLAB AI HACKATHON · GCP RUN', title: 'ECO-OPS — Intelligent CI Compute Optimizer', img: 'images/ecoops.webp',
    desc: "Built for GitLab AI Hackathon on Google Cloud Run. AST dependency subtree analysis & Tarjan's Strongly Connected Components DAG cycle pruning, eliminating ~1,680 minutes/month of wasteful runner compute.",
    tags: ['Google Cloud Run', 'GitLab CI API', 'Python AST', 'Tarjan SCC', 'FastAPI', 'Docker'], links: [['GitHub Repository ↗', GH + '/ecoops']] },
  backstop: { chrome: 'backstop-policy.dev', kick: '04 / 04 · PRODUCTION VERIFIED · POLICY GATE', title: 'BackStop — Deterministic Policy Gate & Merkle Chain', img: 'images/backstop.webp',
    desc: 'Deterministic AI revenue recovery engine enforcing RBI 72h cooldown and TRAI windowing via client-side SHA-256 Merkle chain. 82/82 passing test suites.',
    tags: ['FastAPI', 'React 19', 'Web Crypto API', 'SHA-256 Merkle Chain', '82/82 Tests Pass'], links: [['GitHub Repository ↗', GH + '/BackStop-']] },
};
const LEGAL = {
  privacy: ['Privacy Policy', `<h4>1. Data &amp; Telemetry Notice</h4><p>This personal portfolio of Mayank Tiwari collects zero tracking cookies, third-party analytics pixels, or personal identifiers. Any user interactions (such as theme switching) are persisted strictly within your browser's local sandbox storage (localStorage).</p><h4>2. Direct Contact Inquiries</h4><p>When you submit an inquiry through the message form, your name, email address, and message are sent through FormSubmit (formsubmit.co), a third-party form-to-email relay, only so they reach Mayank's inbox. This site itself stores nothing.</p><h4>3. Verified Open-Source Standards</h4><p>All client-side cryptographic hashing (such as SHA-256 Merkle simulations) runs strictly within the client browser via the standard Web Cryptography API without backend recording.</p>`],
  terms: ['Terms of Service', `<h4>1. Intellectual Property &amp; Open Source</h4><p>The system architectures, whitepapers, and software implementations showcased across this portfolio represent original engineering works by Mayank Tiwari, protected under relevant open-source licenses (MIT/Apache 2.0 where indicated on individual GitHub repositories).</p><h4>2. Accuracy of Architectural Claims</h4><p>All benchmarks, test coverage metrics (e.g. BackStop 82/82 suites, Career PathFinder 54/54 suites, and AMPlified Rank #6 National Finalist podium standing) are grounded in production repositories and verified hackathon submissions.</p><h4>3. Non-Commercial Portfolio Showcase</h4><p>This site serves as a live technological demonstration and engineering portfolio for AI engineering and cloud architecture opportunities.</p>`],
};
const THEMES = { ember: '#fc5b2e', violet: '#8b5cf6', gold: '#e5b045', emerald: '#19c98a' };

function ui(gl) {
  // dialogs: native <dialog> gives focus trap, ESC and inert background
  $$('dialog').forEach(d => {
    d.addEventListener('cancel', e => { e.preventDefault(); closeDlg(d); });
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) closeDlg(d); });
  });
  const dProj = $('#dlgProj'), dBp = $('#dlgBp'), dLegal = $('#dlgLegal'), dCmd = $('#dlgCmd');

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-project],[data-blueprint],[data-legal],[data-top],a[href^="#"]');
    if (!t) return;
    if (t.dataset.project) {
      const p = PROJECTS[t.dataset.project];
      $('#mChrome').textContent = p.chrome; $('#mKick').textContent = p.kick; $('#mTitle').textContent = p.title; $('#mDesc').textContent = p.desc;
      Object.assign($('#mImg'), { src: p.img, alt: p.title });
      $('#mTags').replaceChildren(...p.tags.map(x => Object.assign(document.createElement('span'), { textContent: x })));
      $('#mLinks').replaceChildren(...p.links.map(([label, href], i) => Object.assign(document.createElement('a'), { href, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-sm' + (i ? '' : ' btn-solid'), innerHTML: `<span>${label}</span>` })));
      openDlg(dProj);
      if (!RM) {
        gsap.fromTo('#mImg', { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'expo.out' });
        gsap.fromTo('#dlgProj .dlg-body > *', { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'expo.out', stagger: .07, delay: .18 });
      }
    } else if ('blueprint' in t.dataset) openDlg(dBp);
    else if (t.dataset.legal) { const [title, html] = LEGAL[t.dataset.legal]; $('#legalTitle').textContent = title; $('#legalBody').innerHTML = html; openDlg(dLegal); }
    else if ('top' in t.dataset) go(0);
    else { e.preventDefault(); const id = t.getAttribute('href'); closeMenu(); go(id === '#hero' ? 0 : id); }
  });

  $$('.bp-tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.bp-tabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('.bp-pane').forEach(p => p.classList.toggle('on', p.dataset.pane === b.dataset.tab));
    if (!RM) gsap.fromTo('.bp-pane.on > *', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'expo.out', stagger: .05 });
  }));

  // theme palettes (command palette only, persisted like the original)
  const setTheme = t => { if (!THEMES[t]) return; t === 'ember' ? delete root.dataset.theme : (root.dataset.theme = t); gl.tint(THEMES[t]); try { localStorage.setItem('theme', t); } catch {} };
  try { setTheme(localStorage.getItem('theme')); } catch {}

  // command palette
  const input = $('#cmdInput'), items = $$('#cmdList li');
  let sel = 0;
  const vis = () => items.filter(i => !i.classList.contains('no'));
  const paint = () => { const v = vis(); items.forEach(i => i.classList.toggle('sel', i === v[sel])); };
  const run = li => closeDlg(dCmd, () => {
    if (li.dataset.go) go(li.dataset.go === 'hero' ? 0 : '#' + li.dataset.go);
    else if (li.dataset.theme) { setTheme(li.dataset.theme); toast('Palette switched: ' + li.dataset.theme); }
    else if (li.dataset.act === 'blueprint') openDlg(dBp);
    else copyEmail();
  });
  const openCmd = () => { input.value = ''; items.forEach(i => i.classList.remove('no')); sel = 0; paint(); openDlg(dCmd); input.focus(); };
  input.addEventListener('input', () => { const q = input.value.toLowerCase(); items.forEach(i => i.classList.toggle('no', !i.textContent.toLowerCase().includes(q))); sel = 0; paint(); });
  input.addEventListener('keydown', e => {
    const v = vis();
    if (e.key === 'Enter') return v[sel] && run(v[sel]);
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    sel = (sel + (e.key === 'ArrowDown' ? 1 : v.length - 1)) % v.length;
    paint(); v[sel]?.scrollIntoView({ block: 'nearest' });
  });
  items.forEach(li => { li.addEventListener('click', () => run(li)); li.addEventListener('pointermove', () => { sel = vis().indexOf(li); paint(); }); });
  addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dCmd.open ? closeDlg(dCmd) : openCmd(); } });
  $$('[data-cmd]').forEach(b => b.addEventListener('click', openCmd));

  // menu
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  const mtl = gsap.timeline({ paused: true, defaults: { ease: 'expo.inOut' }, onReverseComplete: () => gsap.set(menu, { visibility: 'hidden' }) })
    .set(menu, { visibility: 'visible' })
    .to('.menu-bg i', { yPercent: 101, duration: .9, stagger: .09 })
    .from('.menu-list a', { yPercent: 110, duration: 1, ease: 'expo.out', stagger: .06 }, .45)
    .from('.menu-side > *', { y: 20, opacity: 0, duration: .7, ease: 'expo.out', stagger: .05 }, .7);
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', open); menu.setAttribute('aria-hidden', !open);
    $('#menuTxt').textContent = open ? 'Close' : 'Dive In';
    open ? lenis.stop() : lenis.start();
    if (RM) { mtl.progress(open ? 1 : 0); gsap.set(menu, { visibility: open ? 'visible' : 'hidden' }); }
    else open ? mtl.timeScale(1).play() : mtl.timeScale(1.7).reverse();
  };
  function closeMenu() { if (menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false); }
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', e => e.key === 'Escape' && closeMenu());

  // header + dock + progress
  const hdr = $('#hdr'), dock = $('#dock'), bar = $('#progress');
  lenis.on('scroll', ({ scroll, direction, progress }) => {
    hdr.classList.toggle('is-hidden', direction === 1 && scroll > 500);
    hdr.classList.toggle('is-scrolled', scroll > 40);
    dock.classList.toggle('on', scroll > innerHeight * .8 && progress < .985);
    bar.style.transform = `scaleX(${progress})`;
  });

  // contact: FormSubmit relays the message to Mayank's inbox; if the relay fails the visitor's mail app takes over, so nothing is lost
  $('#copyEmail').addEventListener('click', copyEmail);
  $('#contactForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, label = $('.btn-send span', form), f = Object.fromEntries(new FormData(form));
    if (f._honey || form.classList.contains('is-busy')) return;
    form.classList.add('is-busy');
    label.textContent = 'Sending…';
    let note = '';
    try {
      const r = await fetch('https://formsubmit.co/ajax/' + EMAIL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: f.name, email: f.email, message: f.message, _subject: 'Portfolio enquiry from ' + f.name, _template: 'table' }) });
      const j = await r.json();
      note = j.message || '';
      if (!r.ok || String(j.success) !== 'true') throw new Error(note);
      form.reset();
      label.textContent = 'Message Sent ✓';
      toast('Delivered to Mayank’s inbox. Thank you.');
      if (!RM) { gl.burst(1); gsap.fromTo('.btn-send .arr', { x: 0, y: 0, opacity: 1 }, { x: 180, y: -70, opacity: 0, duration: .9, ease: 'power3.in', clearProps: 'all' }); }
      setTimeout(() => (label.textContent = 'Send Message'), 3200);
    } catch {
      label.textContent = 'Send Message';
      toast(/activat/i.test(note) ? 'Form not activated yet: check the inbox for FormSubmit’s email.' : 'Mail relay unreachable. Opening your mail app instead.');
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Portfolio enquiry from ' + f.name)}&body=${encodeURIComponent(`${f.message}\n\n— ${f.name} (${f.email})`)}`;
    } finally { form.classList.remove('is-busy'); }
  });

  const clock = $('#clock'), tick = () => (clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }));
  tick(); setInterval(tick, 1000);

  // UI sound feedback (off by default)
  let actx, snd = false;
  const blip = (f, d, g) => {
    if (!snd) return;
    actx ||= new AudioContext();
    const o = actx.createOscillator(), a = actx.createGain(), t = actx.currentTime;
    o.frequency.value = f; a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(a).connect(actx.destination); o.start(t); o.stop(t + d);
  };
  $('#sndBtn').addEventListener('click', e => { snd = !snd; e.currentTarget.setAttribute('aria-pressed', snd); blip(660, .12, .05); toast(snd ? 'Sound feedback on.' : 'Sound feedback off.'); });
  document.addEventListener('pointerover', e => { const t = e.target.closest?.('a,button'); if (t && !t.contains(e.relatedTarget)) blip(1300, .03, .012); });
  document.addEventListener('pointerdown', e => e.target.closest?.('a,button') && blip(480, .09, .04));

  midnight();
  skills(gl);
}

// Midnight Drive: Web Audio synthwave pad, ported from the original site
function midnight() {
  const card = $('#md'), btn = $('#mdPlay');
  const prog = [[146.83, 174.61, 220, 261.63], [174.61, 220, 261.63, 329.63], [130.81, 164.81, 196, 261.63], [196, 246.94, 293.66, 392]], D = 3.2, GAP = .15;
  let ctx, out, rev, del, timer, on = false;
  const note = (dest, f, t, d, type = 'sawtooth') => {
    const o = ctx.createOscillator(), e = ctx.createGain();
    o.type = type; o.frequency.value = f;
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(.18, t + .06); e.gain.setValueAtTime(.18, t + d * .75); e.gain.linearRampToValueAtTime(0, t + d);
    o.connect(e).connect(dest); o.start(t); o.stop(t + d + .05);
  };
  const setup = () => {
    ctx = new AudioContext(); out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
    rev = ctx.createConvolver();
    const len = ctx.sampleRate * 2.2, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 1.8; }
    rev.buffer = buf; rev.connect(out);
    del = ctx.createDelay(.5); del.delayTime.value = .33;
    const fb = ctx.createGain(); fb.gain.value = .28;
    del.connect(fb).connect(del); del.connect(out);
  };
  const loop = () => {
    if (!on) return;
    const now = ctx.currentTime;
    prog.forEach((ch, i) => [rev, del].forEach(dest => ch.forEach((f, j) => { const t = now + i * (D + GAP); note(dest, f, t + j * .035, D); if (!j) note(dest, f / 2, t, D * .9, 'sine'); })));
    timer = setTimeout(loop, ((D + GAP) * prog.length - .3) * 1000);
  };
  btn.addEventListener('click', () => {
    on = !on;
    card.classList.toggle('is-playing', on); btn.textContent = on ? '❚❚' : '▶';
    if (on) { ctx || setup(); ctx.resume(); out.gain.setTargetAtTime(.55, ctx.currentTime, .1); loop(); }
    else { clearTimeout(timer); out.gain.setTargetAtTime(0, ctx.currentTime, .3); }
  });
}

function skills(gl) {
  const grid = $('#skillsGrid'), cards = $$('.skill', grid), btns = $$('#filters button'), ink = $('.filters-ink'), term = $('#termText'), ghost = $('#skillsGhost');
  const titles = new Map(cards.map(c => [c, $('h3', c).textContent]));
  const LINES = {
    all: 'inspect --discipline "ALL" // 82/82 suites passing · Merkle SHA-256 · 300D vector cosine · GCP Cloud Run',
    frontend: 'inspect --discipline "FRONTEND & 3D" // React 19 · Vite 8 · Three.js TSL shaders · Web Speech · 60/120fps',
    backend: 'inspect --discipline "BACKEND & CLOUD" // FastAPI · SHA-256 Merkle gates · Cloud Run · ~1,680 min/mo saved',
    languages: 'inspect --discipline "LANGUAGES" // Python · AST parsing · Tarjan SCC · Pydantic strict schemas',
    ai: 'inspect --discipline "AI / ML" // Gemini 2.5 Flash · multi-agent DAGs · 300D embeddings · 900+ O*NET codes',
  };
  // each discipline enters its own way: a focus pull, 3D doors, racks slotting in, lines typed out, neurons firing from the centre
  const REST = { y: 0, rotateY: 0, scale: 1, opacity: 1, filter: 'blur(0px)', clipPath: 'inset(0% 0% 0% 0%)' };
  const ENTER = {
    all:       { from: { y: 70, opacity: 0, filter: 'blur(14px)' }, stagger: .05, ease: 'expo.out' },
    frontend:  { from: { rotateY: -100, opacity: 0 }, origin: '0% 50%', stagger: .1, ease: 'expo.out', duration: 1.3 },
    backend:   { from: { y: -200, opacity: 0 }, stagger: .09, ease: 'back.out(1.3)', duration: .9 },
    languages: { from: { clipPath: 'inset(0% 100% 0% 0%)' }, stagger: .12, ease: 'power4.inOut', scramble: '{}[]<>/=;' },
    ai:        { from: { scale: .3, opacity: 0, filter: 'blur(22px)' }, stagger: { each: .1, from: 'center' }, ease: 'back.out(1.7)', scramble: '01' },
  };
  const moveInk = (b, duration = .7) => gsap.to(ink, { x: b.offsetLeft, y: b.offsetTop, width: b.offsetWidth, height: b.offsetHeight, duration: RM ? 0 : duration, ease: 'expo.out' });
  const place = () => moveInk($('#filters .on'), 0);
  document.fonts.ready.then(place); addEventListener('resize', place);
  let typing;
  const type = s => { typing?.kill(); const o = { n: 0 }; typing = gsap.to(o, { n: s.length, duration: RM ? 0 : s.length * .016, ease: 'none', onUpdate: () => (term.textContent = s.slice(0, Math.round(o.n))) }); };

  btns.forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('on')) return;
    const cat = b.dataset.cat, fx = ENTER[cat], shown = c => cat === 'all' || c.dataset.cat.split(',').includes(cat);
    btns.forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    moveInk(b); type(LINES[cat]);
    Object.assign(SCENES.skills, DISCIPLINES[cat]);
    gl.goto('skills', RM ? 0 : 2, true);
    if (RM) return cards.forEach(c => c.classList.toggle('hide', !shown(c)));
    // a shockwave from the pill, a burst through the particles, and the discipline's name crossing behind the grid like a title card
    const r = b.getBoundingClientRect(), h = grid.offsetHeight;
    gl.burst(.8);
    gsap.fromTo('#ring', { x: r.left + r.width / 2, y: r.top + r.height / 2, scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 1.3, ease: 'expo.out' });
    ghost.textContent = b.textContent;
    gsap.fromTo(ghost, { xPercent: 22 }, { xPercent: -22, duration: 2.6, ease: 'power2.out', overwrite: true });
    gsap.timeline().fromTo(ghost, { opacity: 0 }, { opacity: .9, duration: .5 }).to(ghost, { opacity: 0, duration: 1 }, 1.5);
    gsap.to(cards.filter(c => !c.classList.contains('hide')), { opacity: 0, scale: .92, filter: 'blur(10px)', duration: .3, ease: 'power2.in', overwrite: true, onComplete() {
      cards.forEach(c => { gsap.set(c, { clearProps: 'all' }); c.classList.toggle('hide', !shown(c)); });
      const vis = cards.filter(shown);
      gsap.from(grid, { height: h, duration: .9, ease: 'expo.inOut', clearProps: 'height', overwrite: true, onComplete: () => ScrollTrigger.refresh() });
      gsap.fromTo(vis, { transformPerspective: 1100, transformOrigin: fx.origin || '50% 50%', ...fx.from },
        { ...Object.fromEntries(Object.keys(fx.from).map(k => [k, REST[k]])), duration: fx.duration || 1, ease: fx.ease, stagger: fx.stagger, clearProps: 'all' });
      gsap.fromTo($$('.meter-track i', grid), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.out', delay: .45, stagger: .05, overwrite: true });
      countUp(vis.map(c => $('[data-count]', c)), { duration: 1.4, delay: .45, stagger: .05, overwrite: true });
      if (fx.scramble) vis.forEach((c, n) => gsap.to($('h3', c), { duration: 1, delay: .2 + n * .1, scrambleText: { text: titles.get(c), chars: fx.scramble, speed: .6 }, overwrite: true }));
    } });
  }));

  // one listener lights every card's border relative to the pointer, so neighbours glow too
  grid.addEventListener('pointermove', e => cards.forEach(c => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); }));
  grid.addEventListener('pointerleave', () => cards.forEach(c => { c.style.setProperty('--mx', '-999px'); c.style.setProperty('--my', '-999px'); }));
}

/* ───────────────────────── Motion ───────────────────────── */
function cursor() {
  if (!FINE) return;
  root.classList.add('has-cur');
  const ring = $('#cur'), dot = $('#curDot'), label = $('span', ring);
  const q = (el, p, duration) => gsap.quickTo(el, p, { duration, ease: 'power3' });
  const rx = q(ring, 'x', .5), ry = q(ring, 'y', .5), dx = q(dot, 'x', .1), dy = q(dot, 'y', .1);
  let shown = false;
  addEventListener('pointermove', e => {
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
    if (!shown) { shown = true; gsap.set([ring, dot], { x: e.clientX, y: e.clientY }); gsap.to([ring, dot], { opacity: 1, duration: .4 }); }
  });
  document.addEventListener('pointerover', e => {
    const l = e.target.closest?.('[data-cursor]'), h = e.target.closest?.('a,button,input,textarea,.cmd-list li');
    ring.classList.toggle('is-label', !!l); ring.classList.toggle('is-hover', !l && !!h);
    gsap.to(dot, { scale: l || h ? 0 : 1, duration: .3 });
    if (l) label.textContent = l.dataset.cursor;
  });
  addEventListener('pointerdown', () => gsap.to(ring, { scale: .78, duration: .25 }));
  addEventListener('pointerup', () => gsap.to(ring, { scale: 1, duration: .6, ease: 'elastic.out(1,.4)' }));
  root.addEventListener('mouseleave', () => gsap.to([ring, dot], { opacity: 0, duration: .3, onComplete: () => (shown = false) }));
}

function magnetic() {
  $$('.btn').forEach(b => b.addEventListener('pointerenter', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--x', e.clientX - r.left + 'px'); b.style.setProperty('--y', e.clientY - r.top + 'px'); }));
  if (!FINE) return;
  $$('[data-magnetic]').forEach(el => {
    const o = { duration: 1, ease: 'elastic.out(1,.35)' }, xTo = gsap.quickTo(el, 'x', o), yTo = gsap.quickTo(el, 'y', o);
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .35); yTo((e.clientY - r.top - r.height / 2) * .35); });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

function hero() {
  const chars = $$('#heroTitle span'), st = chars.map(() => ({ w: 640, d: 96 })), intro = { k: 0 };
  let mx = -1, my = -1, active = true;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
  ScrollTrigger.create({ trigger: '#hero', start: 'top bottom', end: 'bottom top', onToggle: s => (active = s.isActive) });
  // variable-font pressure: weight and width swell under the pointer; an idle wave runs on touch devices
  gsap.ticker.add(() => {
    if (!active) return;
    const t = performance.now() / 1000, rects = chars.map(c => c.getBoundingClientRect()), reach = innerWidth * .3;
    chars.forEach((c, i) => {
      const r = rects[i];
      const f = FINE && mx >= 0 ? Math.max(0, 1 - Math.hypot(mx - r.left - r.width / 2, my - r.top - r.height / 2) / reach) : (Math.sin(t * 1.3 - i * .75) * .5 + .5) * .55;
      st[i].w += (400 + 600 * f - st[i].w) * .12; st[i].d += (74 + 62 * f - st[i].d) * .12;
      c.style.setProperty('--w', (100 + (st[i].w - 100) * intro.k).toFixed(1));
      c.style.setProperty('--d', (25 + (st[i].d - 25) * intro.k).toFixed(1));
    });
  });

  // scroll-out animates the wrappers; the intro animates their children, so the two never fight over a property
  gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }, defaults: { ease: 'none' } })
    .to('#heroTitle', { yPercent: -45, scale: 1.14, autoAlpha: 0 }, 0)
    .to('.hero-tag', { y: -160, autoAlpha: 0 }, 0)
    .to('.hero-bio, .hero-cta, .hero-top', { y: -70, autoAlpha: 0 }, 0)
    .to('.hero-cue', { autoAlpha: 0, duration: .3 }, 0);

  const bio = SplitText.create('.hero-bio', { type: 'lines', mask: 'lines' });
  return gsap.timeline({ paused: true })
    .from(chars, { yPercent: 110, rotateX: -85, opacity: 0, transformPerspective: 900, duration: 1.5, ease: 'expo.out', stagger: .075 })
    .to(intro, { k: 1, duration: 2.2, ease: 'expo.out' }, .2)
    .from('.hdr > *', { y: -40, autoAlpha: 0, duration: 1.1, ease: 'expo.out', stagger: .08 }, .5)
    .from('.hero-top span', { y: -16, autoAlpha: 0, duration: .9, ease: 'expo.out', stagger: .08 }, .6)
    .from('.hero-badge, .hero-sub', { scale: .86, autoAlpha: 0, duration: .9, ease: 'back.out(1.7)', stagger: .14 }, .8)
    .add(() => $$('[data-scramble]').forEach(el => gsap.to(el, { duration: 1.5, scrambleText: { text: el.textContent, chars: 'upperCase', speed: .5 } })), .8)
    .from(bio.lines, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: .09 }, 1)
    .from('.hero-cta .btn', { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .1, clearProps: 'all' }, 1.1)
    .from('.hero-cue > *', { autoAlpha: 0, duration: 1.2 }, 1.5)
    .from('.hud > div', { autoAlpha: 0, duration: 1.4, stagger: .15 }, 1.6);
}

function marquees() {
  $$('.mq').forEach(mq => {
    const track = $('.mq-track', mq), base = mq.classList.contains('mq-rev') ? 1 : -1;
    track.innerHTML += track.innerHTML + track.innerHTML;
    let x = 0, w = 1, dir = 1, drag = 0;
    const measure = () => (w = (track.scrollWidth + parseFloat(getComputedStyle(track).columnGap)) / 3);
    document.fonts.ready.then(measure); addEventListener('resize', measure);
    mq.addEventListener('pointermove', e => e.buttons === 1 && (drag += e.movementX));
    gsap.ticker.add((_, dt) => {
      const v = lenis.velocity || 0;
      if (v) dir = Math.sign(v);
      x = gsap.utils.wrap(-w, 0, x + base * dir * (1.3 + Math.abs(v) * .32) * dt / 16.7 + drag);
      drag = 0;
      track.style.transform = `translate3d(${x}px,0,0) skewX(${clamp(-14, 14, v * -.22)}deg)`;
    });
  });
}

function philosophy() {
  const q = SplitText.create('#philoQuote', { type: 'words' });
  gsap.set(q.words, { opacity: .13 });
  gsap.timeline({ scrollTrigger: { trigger: '.philo', pin: true, start: 'top top', end: '+=280%', scrub: .7 }, defaults: { ease: 'none' } })
    // fromTo with both strings spelled out: browsers serialise inset() in a shortened form GSAP cannot pair up
    .fromTo('.philo-frame', { clipPath: 'inset(27% 33% 27% 33% round 26px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1, ease: 'power2.inOut' }, 0)
    .to('.philo-frame img', { scale: 1.05, duration: 3.2 }, 0)
    .to('.philo-title span:first-child', { xPercent: -220, autoAlpha: 0, duration: .9, ease: 'power2.in' }, 0)
    .to('.philo-title span:last-child', { xPercent: 110, autoAlpha: 0, duration: .9, ease: 'power2.in' }, 0)
    .to('.philo-hint', { autoAlpha: 0, duration: .25 }, 0)
    .to('.philo-scrim', { opacity: 1, duration: .5 }, .6)
    .fromTo('.philo-copy', { autoAlpha: 0, filter: 'blur(18px)' }, { autoAlpha: 1, filter: 'blur(0px)', duration: .4 }, .8)
    .from('.philo-copy .pill', { y: 24, duration: .3, ease: 'power2.out' }, .85)
    .to(q.words, { opacity: 1, duration: .2, stagger: .045 }, 1.05)
    .from('.philo-author > *', { y: 20, autoAlpha: 0, duration: .25, stagger: .06, ease: 'power2.out' }, '>-.15')
    .to({}, { duration: .3 });
}

function vault() {
  const io = 'power2.inOut';
  gsap.timeline({ scrollTrigger: { trigger: '.vault', pin: true, start: 'top top', end: '+=260%', scrub: .7 }, defaults: { ease: 'none' } })
    .to('.seam', { autoAlpha: 0, scaleY: 0, duration: .25 }, 0)
    .to('.door-l', { xPercent: -101, duration: 1.1, ease: io }, .05)
    .to('.door-r', { xPercent: 101, duration: 1.1, ease: io }, .05)
    .to('.door-l .door-in', { xPercent: 45, duration: 1.1, ease: io }, .05)
    .to('.door-r .door-in', { xPercent: -45, duration: 1.1, ease: io }, .05)
    .fromTo('.vault-photo', { clipPath: 'inset(100% 0% 0% 0% round 12px)' }, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: .9, ease: io }, .3)
    .from('.vault-photo img', { scale: 1.6, duration: 1.3, ease: 'power2.out' }, .3)
    // light spills through the seam as the doors part, with an anamorphic streak across the frame
    .fromTo('.vault-flare i', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: .5, ease: 'power2.out' }, .05)
    .fromTo('.vault-flare b', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: .45, ease: 'power2.out' }, .1)
    .to('.vault-flare i, .vault-flare b', { opacity: 0, duration: .6 }, .6)
    .fromTo('.vault-title span:first-child', { xPercent: -70, filter: 'blur(22px)' }, { xPercent: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' }, .25)
    .fromTo('.vault-title span:last-child', { xPercent: 70, filter: 'blur(22px)' }, { xPercent: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' }, .25)
    .from('.vault-top > *, .vault-kicker', { y: -24, autoAlpha: 0, duration: .35, stagger: .06, ease: 'power2.out' }, .95)
    .from('.vault-sub > *, .vault-bottom > *', { y: 26, autoAlpha: 0, duration: .35, stagger: .05, ease: 'power2.out' }, 1)
    .from('.md', { x: 80, autoAlpha: 0, duration: .45, ease: 'back.out(1.6)' }, 1.15)
    .to('.vault-title span:first-child', { xPercent: -5, duration: 1 }, 1.6)
    .to('.vault-title span:last-child', { xPercent: 5, duration: 1 }, 1.6)
    .to('.vault-photo img', { yPercent: -4, scale: 1.06, duration: 1 }, 1.6);
}

function rail(gl) {
  const mm = gsap.matchMedia(), cards = $$('.pcard');
  mm.add('(min-width: 900px)', () => {
    root.classList.add('h-rail');
    const sec = $('.rail'), track = $('#railTrack'), now = $('#railNow');
    const dist = () => track.scrollWidth - innerWidth;
    let st;
    const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: sec, pin: true, start: 'top top', end: () => '+=' + dist(), scrub: .9, invalidateOnRefresh: true,
      onUpdate: s => { gsap.set('#railBar', { scaleX: s.progress }); gl.twist(s.progress * Math.PI * 2); } } });
    st = tw.scrollTrigger;
    gsap.from('.rail-title span', { yPercent: 110, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: sec, start: 'top 60%' } });
    gsap.from('.rail-title-sub, .rail-intro p, .rail-pills > *, .rail-hint', { y: 30, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: sec, start: 'top 55%' } });
    cards.forEach((card, i) => {
      const at = (start, extra) => ({ trigger: card, containerAnimation: tw, start, ...extra });
      gsap.fromTo($('img', card), { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: at('left right', { end: 'right left', scrub: true }) });
      gsap.fromTo($('.pcard-media', card), { clipPath: 'inset(0% 100% 0% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: at('left 88%', { toggleActions: 'play none none reverse' }) });
      gsap.from($$('.pcard-top > *, .pcard-body > *', card), { y: 44, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: at('left 78%', { toggleActions: 'play none none reverse' }) });
      ScrollTrigger.create(at('left center', { end: 'right center', onToggle: s => s.isActive && (now.textContent = '0' + (i + 1)) }));
    });
    // lean into the scroll, and let the rail be dragged sideways
    const skew = gsap.quickTo(cards, 'skewX', { duration: .5, ease: 'power3' });
    const tick = () => st.isActive && skew(clamp(-4, 4, (lenis.velocity || 0) * -.09));
    const drag = e => { if (e.buttons === 1 && st.isActive && !e.target.closest('a,button')) lenis.scrollTo(lenis.scroll - e.movementX * 1.8, { immediate: true }); };
    gsap.ticker.add(tick); sec.addEventListener('pointermove', drag);
    return () => { root.classList.remove('h-rail'); gsap.ticker.remove(tick); sec.removeEventListener('pointermove', drag); gl.twist(0); };
  });
  mm.add('(max-width: 899px)', () => {
    cards.forEach(card => gsap.from(card, { y: 70, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%' } }));
  });
}

// rack focus: things arrive soft and settle sharp
const focusIn = (targets, from, vars) => gsap.fromTo(targets, { autoAlpha: 0, filter: 'blur(14px)', ...from },
  { autoAlpha: 1, filter: 'blur(0px)', ...Object.fromEntries(Object.keys(from).map(k => [k, 0])), duration: 1.2, ease: 'expo.out', clearProps: 'all', ...vars });

// counters roll up from zero to their data-count
const countUp = (els, vars) => gsap.fromTo(els, { textContent: 0 }, { textContent: (i, el) => +el.dataset.count, snap: { textContent: 1 }, duration: 1.6, ease: 'power2.out', ...vars });

function reveals() {
  $$('[data-split]').forEach(el => {
    if (el.dataset.split === 'chars') {
      const s = SplitText.create(el, { type: 'words,chars' });
      gsap.from(s.chars, { yPercent: 95, rotateX: -75, opacity: 0, transformPerspective: 700, transformOrigin: '50% 100%', duration: 1.2, ease: 'expo.out', stagger: .02, scrollTrigger: { trigger: el, start: 'top 88%' } });
      gsap.fromTo(el, { filter: 'blur(16px)' }, { filter: 'blur(0px)', duration: 1.5, ease: 'power2.out', clearProps: 'filter', scrollTrigger: { trigger: el, start: 'top 88%' } });
    } else SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: s => gsap.from(s.lines, { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: .09, scrollTrigger: { trigger: el, start: 'top 92%' } }) });
  });
  $$('[data-reveal]').forEach(el => focusIn(el, { y: 44 }, { scrollTrigger: { trigger: el, start: 'top 92%' } }));
  $$('[data-count]').filter(el => !el.closest('.skill')).forEach(el => countUp(el, { scrollTrigger: { trigger: el, start: 'top 94%' } }));
}

function work() {
  const list = $('#workList'), float = $('#workFloat'), inner = $('.work-float-in', float);
  focusIn('.work-row', { yPercent: 70 }, { stagger: .1, scrollTrigger: { trigger: list, start: 'top 86%' } });
  if (!FINE) return;
  const q = (p, duration) => gsap.quickTo(float, p, { duration, ease: 'power3' }), xTo = q('x', .6), yTo = q('y', .6), rTo = q('rotation', .9);
  let lx = 0, rest;
  list.addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); rTo(clamp(-14, 14, (e.clientX - lx) * .9)); lx = e.clientX; clearTimeout(rest); rest = setTimeout(() => rTo(0), 110); });
  list.addEventListener('pointerenter', e => { lx = e.clientX; gsap.set(float, { x: e.clientX, y: e.clientY }); gsap.to(float, { autoAlpha: 1, scale: 1, duration: .6, ease: 'expo.out' }); });
  list.addEventListener('pointerleave', () => gsap.to(float, { autoAlpha: 0, scale: .6, duration: .4, ease: 'power3.in' }));
  $$('.work-row', list).forEach(r => r.addEventListener('pointerenter', () => (inner.style.transform = `translateY(${-r.dataset.i * 100}%)`)));
  gsap.set(float, { scale: .6 });
}

function skillsMotion() {
  const grid = $('#skillsGrid');
  focusIn('.skill', { y: 80 }, { stagger: { each: .07, grid: 'auto', from: 'start' }, scrollTrigger: { trigger: grid, start: 'top 84%' } });
  // bars and their percentages share one trigger so a full bar never sits next to 0%
  gsap.from('.meter-track i', { scaleX: 0, duration: 1.6, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: grid, start: 'top 70%' } });
  countUp($$('.skill [data-count]'), { stagger: .08, scrollTrigger: { trigger: grid, start: 'top 70%' } });
}

function experience() {
  const tl = $('#tl'), st = { trigger: tl, start: 'top 62%', end: 'bottom 62%', scrub: .4 };
  gsap.fromTo('.tl-line i', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: st });
  gsap.to('.tl-line b', { y: () => tl.offsetHeight, ease: 'none', scrollTrigger: { ...st, invalidateOnRefresh: true } });
  $$('.tl-item').forEach(it => {
    ScrollTrigger.create({ trigger: it, start: 'top 62%', onEnter: () => it.classList.add('on'), onLeaveBack: () => it.classList.remove('on') });
    focusIn($$('.tl-l > *', it), { x: -40 }, { stagger: .08, scrollTrigger: { trigger: it, start: 'top 80%' } });
    focusIn($$('.tl-r > h3, .tl-r > p, .tl-r li', it), { y: 36 }, { stagger: .07, scrollTrigger: { trigger: it, start: 'top 80%' } });
  });
}

function footer() {
  gsap.from('#footBig span', { yPercent: 115, ease: 'power2.out', stagger: .05, scrollTrigger: { trigger: '.foot', start: 'top 96%', end: 'bottom bottom', scrub: .6 } });
}

// one trigger per section drives the film layer: particle form, nav, scene slate, letterbox bars and the two key lights
function scenes(gl) {
  const NAV = { hero: 'hero', philo: 'introduction', vault: 'introduction', rail: 'projects', work: 'projects', skills: 'skills', exp: 'experience', contact: 'contact' };
  const slate = $('#hudScene'), tc = $('#hudTc'), names = Object.keys(STAGE), two = n => String(Math.floor(n)).padStart(2, '0');
  // timecode reads the scroll as 24fps film transport
  lenis.on('scroll', ({ scroll }) => { const f = scroll * .6; tc.textContent = [f / 86400, f / 1440 % 60, f / 24 % 60, f % 24].map(two).join(':'); });
  if (FINE && !RM) {
    const q = p => gsap.quickTo('.light', p, { duration: 2.4, ease: 'power3' }), lx = q('x'), ly = q('y');
    addEventListener('pointermove', e => { lx((e.clientX / innerWidth - .5) * 120); ly((e.clientY / innerHeight - .5) * 120); });
  }
  $$('[data-scene]').forEach(sec => ScrollTrigger.create({ trigger: spacer(sec), start: 'top 55%', end: 'bottom 55%', onToggle: s => {
    if (!s.isActive) return;
    const name = sec.dataset.scene, [label, wx, wy, tx, ty] = STAGE[name], text = `SC ${two(names.indexOf(name) + 1)}/${two(names.length)} — ${label}`;
    gl.goto(name);
    $$('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + NAV[name]));
    if (RM) return void (slate.textContent = text);
    gsap.to(slate, { duration: 1.1, scrambleText: { text, chars: 'upperCase', speed: .5 } });
    gsap.to('.bars i', { scaleY: +(name === 'philo' || name === 'vault'), duration: 1.2, ease: 'expo.inOut', overwrite: true });
    // the lights diffuse wide, travel, and gather again at their new marks
    const o = { duration: 2.8, ease: 'power2.inOut', overwrite: 'auto' };
    gsap.to('.light i:first-child', { x: wx + 'vw', y: wy + 'vh', ...o });
    gsap.to('.light i:last-child', { x: tx + 'vw', y: ty + 'vh', ...o });
    gsap.fromTo('.light', { scale: 1.35 }, { scale: 1, duration: 2.8, ease: 'power2.out', overwrite: 'auto' });
  } }));
}

// motion is built once fonts are in, so every text split measures the real typeface
function preloader(build) {
  const count = $('#preCount'), status = $('#preStatus'), o = { v: 0 };
  let first = true; // the full title sequence plays once per session; reloads get the short cut
  try { first = !sessionStorage.seen; sessionStorage.seen = 1; } catch {}
  const msgs = ['INITIALIZING SYSTEMS ARCHITECTURE...', 'COMPILING PARTICLE SHADERS...', 'LINKING MERKLE HASH CHAIN...', 'SYSTEMS ONLINE.'];
  const counted = new Promise(res => gsap.to(o, { v: 100, duration: first ? 2.2 : 1.2, ease: 'power3.inOut', onComplete: res, onUpdate() {
    count.textContent = Math.round(o.v);
    gsap.set('#preBar', { scaleX: o.v / 100 });
    const msg = msgs[Math.min(3, Math.floor(o.v / 30))];
    if (status.textContent !== msg) status.textContent = msg;
  } }));
  // never hold the page hostage to a slow font CDN
  Promise.all([counted, Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 4000))])]).then(() => {
    const onExit = build();
    ScrollTrigger.refresh();
    const open = first ? 1.95 : .7, tl = gsap.timeline()
      .to(count, { yPercent: -105, duration: .8, ease: 'expo.in' }, .15)
      .to('.pre-top span, .pre-status, .pre-bar', { autoAlpha: 0, duration: .4, stagger: .04 }, .15);
    if (first) tl.fromTo('.pre-credit', { autoAlpha: 0, scale: .96, filter: 'blur(14px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: .7, ease: 'power2.out' }, .6)
      .to('.pre-credit', { autoAlpha: 0, scale: 1.06, filter: 'blur(16px)', duration: .55, ease: 'power2.in' }, 1.7);
    tl.add(onExit, open + .05)
      .to('.pre-cols i', { scaleY: 0, duration: 1.3, ease: 'expo.inOut', stagger: { each: .08, from: 'center' } }, open)
      .set('#pre', { display: 'none' });
  });
}

/* ───────────────────────── Boot ───────────────────────── */
const gl = initGL();
ui(gl);
if (RM) {
  gl.intro(0);
  scenes(gl);
} else {
  lenis.stop();
  cursor(); magnetic();
  preloader(() => {
    // creation order follows page order so each pin is measured before the sections below it
    const heroIntro = hero();
    marquees(); philosophy(); vault(); rail(gl); reveals(); work(); skillsMotion(); experience(); footer(); scenes(gl);
    return () => { lenis.start(); gl.intro(); heroIntro.play(); };
  });
}
