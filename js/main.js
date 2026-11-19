// The conductor: smooth scroll, one clock for every chapter, the page's own motion, and the 3D world fed
// from the same scroll position each frame. window.__forceY lets a test render any point of the story.
import { createWorld } from './world.js';
import { createBg } from './bgfx.js';
const bg = createBg();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const band = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const root = document.documentElement;

// ---------- headings arrive word by word ----------
function split(el) {
  let i = 0;
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const f = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { f.append(' '); return; }
        const o = document.createElement('span'); o.className = 'w';
        const s = document.createElement('span'); s.textContent = w; s.style.setProperty('--i', i++);
        o.append(s); f.append(o);
      });
      n.replaceWith(f);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
  });
  walk(el);
}
$$('[data-split]').forEach(split);
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2 });
$$('[data-split]').forEach((el) => io.observe(el));

// ---------- loader ----------
const ld = $('#loader'), ldBar = $('.ld-bar i'), ldPct = $('#ldPct'), ldLog = $('#ldLog');
const LOG = ['BLE · LOOKING FOR HER PHONE', 'SPEAKER · 4.0 V · PAIRED', 'IR × 4 · CALIBRATED', 'SOS · HOLD 3 s · READY'];
let shown = 0, loading = true;
const setLoad = (p) => { shown = Math.max(shown, p); ldBar.style.setProperty('--p', shown); ldPct.textContent = String(Math.round(shown * 100)).padStart(3, '0'); ldLog.textContent = LOG[Math.min(3, Math.floor(shown * 4))]; };
root.style.overflow = 'hidden';
let fake = 0; const fakeT = setInterval(() => { fake = Math.min(.6, fake + .03 + Math.random() * .04); setLoad(fake); }, 110);

// ---------- chapters ----------
const secs = $$('[data-ch]').map((el) => ({ el, id: el.dataset.ch, name: el.dataset.name, bg: el.dataset.bg || '#FFF7FA', fg: el.dataset.fg || '#2B1A22', top: 0, h: 0 }));
const byId = Object.fromEntries(secs.map((s) => [s.id, s]));
let vh = innerHeight, maxY = 1;
function measure() {
  vh = innerHeight;
  secs.forEach((s) => { const r = s.el.getBoundingClientRect(); s.top = r.top + scrollY; s.h = r.height; });
  maxY = root.scrollHeight - vh;
}
const pos = (id, f = 0, off = 0) => { const s = byId[id]; return s.top + f * Math.max(s.h - vh, 0) + off * vh; };
function chState(y) {
  const o = {};
  for (const s of secs) o[s.id] = { p: clamp((y - s.top) / Math.max(s.h - vh, 1)), vis: y + vh * .5 >= s.top && y + vh * .5 < s.top + s.h ? 1 : 0, q: clamp((y - s.top + vh) / (s.h + vh)) };
  return o;
}

// ---------- smooth wheel (touch and keys stay native) ----------
let target = scrollY, cur = scrollY;
if (!still && fine) {
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || loading) return;
    e.preventDefault();
    target = clamp(target + e.deltaY * (e.deltaMode === 1 ? 36 : 1), 0, maxY);
  }, { passive: false });
}
addEventListener('scroll', () => { if (Math.abs(scrollY - cur) > 3) target = cur = scrollY; }, { passive: true });
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const t = $(a.getAttribute('href')); if (!t) return;
  e.preventDefault();
  const y = t.id === 'top' ? 0 : t.getBoundingClientRect().top + scrollY;
  if (still || !fine) scrollTo({ top: y, behavior: still ? 'auto' : 'smooth' }); else target = clamp(y, 0, maxY);
}));

// ---------- pointer: a bangle for a cursor, magnetic buttons ----------
const mouse = { x: 0, y: 0, px: innerWidth / 2, py: innerHeight / 2 };
const cursor = $('#cursor'); let cx = mouse.px, cy = mouse.py;
addEventListener('pointermove', (e) => { mouse.px = e.clientX; mouse.py = e.clientY; mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; });
$$('a, [data-magnet]').forEach((el) => {
  el.addEventListener('pointerenter', () => cursor.classList.add('big'));
  el.addEventListener('pointerleave', () => { cursor.classList.remove('big'); if (el.dataset.magnet !== undefined) el.style.transform = ''; });
  if (el.dataset.magnet !== undefined) el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
  });
});

// ---------- page pieces ----------
const hw1 = $('.hw1'), hw2 = $('.hw2'), heroMeta = $('.hero-meta'), heroFoot = $('.hero-foot'), cue = $('.cue');
const ks = $$('.k'), kin = $('.kin'), kinAfter = $('.kin-after'), statN = $('.stat .n');
const tHold = $('#tHold'), tState = $('#tState'), timer = $('.timer'), flow = $$('.flow li');
const bars = $('#bars'); for (let i = 0; i < 46; i++) bars.append(document.createElement('i'));
const barEls = [...bars.children], lvl = $('#lvl'), held = $('#held'), shoutGo = $('#shoutGo');
const tabs = $$('.tabs span'), lines = $$('.line'), wave = $('.wave');
for (let i = 0; i < 60; i++) wave.append(document.createElement('i'));
const waveBars = [...wave.children];
const sw = $('#sw'), lks = [$('#lk1'), $('#lk2'), $('#lk3')];
const navCard = $('#navCard'), ncDist = $('#ncDist'), ncDir = $('#ncDir'), ncSay = $('#ncSay'), ncBar = $('#ncBar'), arrow = $('.nc-turn .arrow'), ladder = $$('#ladder li');
const mvals = $('#mvals'), mBars = $$('.mbars i'), mres = $('#mres');
const twA = $('.tw.a'), twB = $('.tw.b');
const hudCh = $('#hudCh'), hudBar = $('#hudBar'), hudSos = $('#hudSos'), nav = $('.nav');
const labelsEl = $('#labels'); const labs = new Map();
let statDone = false, lastY = 0, navAway = false, curBg = '';

function lum(hex) { const n = parseInt(hex.slice(1), 16); return (.299 * (n >> 16 & 255) + .587 * (n >> 8 & 255) + .114 * (n & 255)) / 255; }
function noise(i, t) { return .5 + .5 * Math.sin(t * 7.1 + i * .73) * Math.sin(t * 2.3 + i * .29); }

// ---------- the app: phones, tags, leader lines ----------
const stage = $('#appStage'), leads = $('#leads'), tagsEl = $('#tags');
const phones = Object.fromEntries($$('.ph', stage).map((p) => [p.classList[1], p]));
const POSE = [   // per step: phone -> [x%, y%, rotate, scale] (centre of the phone, relative to the stage)
  { c: [50, 50, 0, 1.12] },
  { c: [50, 54, 0, .8, .12], l: [36, 49, -5, 1], r: [64, 52, 5, 1] },
  { l2: [36, 50, -5, 1], r2: [64, 49, 5, 1] },
];
const TAGS = [
  [0, 'c', 50, 33, 'Hold SOS', 'alerts her whole circle', 'r'],
  [0, 'c', 66, 57, 'Loud alarm', 'a siren from the phone', 'r'],
  [0, 'c', 66, 72, 'Help nearby', 'police · hospitals · helplines', 'r'],
  [0, 'c', 16, 57, 'Safe Walk', 'a timed check-in', 'l'],
  [0, 'c', 16, 72, 'Fake call', 'a way out, on demand', 'l'],
  [0, 'c', 18, 88, 'Her circle', 'SMS + WhatsApp + location', 'l'],
  [1, 'l', 34, 15, 'Nearby mesh', 'women close by get her SOS', 'l'],
  [1, 'l', 62, 54, 'I’m going to help', 'one tap to respond', 'l'],
  [1, 'r', 50, 42, 'Seconds to cancel', 'then help goes out', 'r'],
  [1, 'r', 50, 86, 'Cancel', 'pressed by mistake? fine', 'r'],
  [2, 'l2', 30, 10, 'Safe Walk', 'where + how long', 'l'],
  [2, 'l2', 50, 92, 'No check-in?', 'her circle is told', 'l'],
  [2, 'r2', 22, 12, '112 · 181 · 1091', 'one tap to call', 'r'],
  [2, 'r2', 50, 70, 'Nearest police', 'from OpenStreetMap', 'r'],
].map(([step, ph, u, v, t, s, side]) => {
  const el = document.createElement('div'); el.className = 'tag' + (side === 'l' ? ' left' : '');
  el.innerHTML = `<b>${t}</b><span>${s}</span>`; tagsEl.append(el);
  return { step, ph, u, v, side, el };
});
const appTitles = $$('.ah');
let appStep = -1;
function appFrame(p, vis) {
  const step = p < .34 ? 0 : p < .67 ? 1 : 2;
  if (step !== appStep) {
    appStep = step;
    appTitles.forEach((h, i) => h.classList.toggle('on', i === step));
    for (const [k, el] of Object.entries(phones)) {
      const pose = POSE[step][k];
      el.classList.toggle('on', !!pose);
      if (pose) {
        el.style.left = pose[0] + '%'; el.style.top = pose[1] + '%';
        el.style.transform = `translate(-50%, -50%) rotate(${pose[2]}deg) scale(${pose[3]})`;
        el.style.opacity = pose[4] ?? '';
      } else el.style.transform = `translate(-50%, -40%) scale(.9)`;
    }
  }
  if (!vis || innerWidth < 900) return;
  const sr = stage.getBoundingClientRect();
  let svg = '';
  for (const tg of TAGS) {
    const on = tg.step === step && p > [0, .34, .67][step] + .04;
    tg.el.classList.toggle('on', on);
    if (!on) continue;
    const r = phones[tg.ph].querySelector('img').getBoundingClientRect();
    const ax = r.left - sr.left + r.width * tg.u / 100, ay = r.top - sr.top + r.height * tg.v / 100;
    const ex = tg.side === 'l' ? r.left - sr.left - 34 : r.right - sr.left + 34;
    tg.el.style.left = (tg.side === 'l' ? ex - 6 : ex + 6) + 'px'; tg.el.style.top = ay + 'px';
    svg += `<path d="M${ax},${ay} L${ex},${ay}"/><circle cx="${ax}" cy="${ay}" r="4.5"/>`;
  }
  leads.innerHTML = svg;
}

// ---------- the tagline's loop that breaks ----------
const loopPath = $('#loopPath'), freePath = $('#freePath');
(function drawLoop() {
  let d = '';
  for (let t = 0, first = true; ; t += .08) {
    const x = 14 + 9 * t - 16 * Math.sin(t), y = 40 + 22 * Math.cos(t);
    if (x > 620) break;
    d += (first ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1); first = false;
  }
  loopPath.setAttribute('d', d);
  freePath.setAttribute('d', 'M652,62 C760,62 860,40 990,14 M972,8 L990,14 L978,28');
})();
const loopLen = loopPath.getTotalLength(), freeLen = freePath.getTotalLength();
loopPath.style.strokeDasharray = loopLen; freePath.style.strokeDasharray = freeLen;

// ---------- one frame of the page ----------
function dom(y, ch, t) {
  // hero
  const hp = clamp(y / vh);
  hw1.style.setProperty('--y', `${-hp * 24}vh`); hw2.style.setProperty('--y', `${hp * 12}vh`);
  hw1.style.opacity = hw2.style.opacity = 1 - hp * .9;
  const hin = introT < 0 ? 0 : ease(clamp((performance.now() - introT - 700) / 900));
  heroMeta.style.opacity = heroFoot.style.opacity = cue.style.opacity = Math.max(0, 1 - hp * 2.2) * hin;

  // problem: three short sentences, then the number
  const pp = ch.problem.p;
  ks.forEach((k, i) => { const a = ease(band(pp, .04 + i * .12, .14 + i * .12)); k.style.opacity = a; k.style.transform = `translate3d(${(1 - a) * -50}px, ${(1 - a) * 40}px, 0)`; });
  const out = ease(band(pp, .5, .64));
  kin.style.transform = `translateY(${-out * 22}vh) scale(${1 - out * .32})`; kin.style.transformOrigin = 'left center'; kin.style.opacity = 1 - out * .88;
  const aft = band(pp, .58, .7);
  kinAfter.style.opacity = aft; kinAfter.style.transform = `translateY(${(1 - ease(aft)) * 40}px)`;
  if (aft > .5 && !statDone) { statDone = true; const t0 = performance.now(); const run = (tt) => { const k = ease(clamp((tt - t0) / 1300)); statN.textContent = Math.round(71 * k); if (k < 1) requestAnimationFrame(run); }; requestAnimationFrame(run); }

  // SOS: three seconds, then everything happens at once
  const sp = ch.sos.p, hold = 3 * band(sp, .12, .42), fired = sp >= .42;
  tHold.textContent = hold.toFixed(1); timer.classList.toggle('fired', fired); tState.textContent = fired ? 'SOS ON' : sp > .12 ? 'HOLDING' : 'HOLD';
  flow.forEach((li, i) => li.classList.toggle('on', sp > .46 + i * .1));

  // shout: the room, then her voice crossing the line
  if (ch.shout.vis) {
    const shp = ch.shout.p, scream = band(shp, .22, .48), k = 1 + 3.1 * scream;
    barEls.forEach((b, i) => {
      const h = clamp((.08 + .12 * noise(i, t)) * k * (.75 + .5 * noise(i + 9, t * .7)));
      b.style.transform = `scaleY(${h.toFixed(3)})`; b.classList.toggle('hot', h > .58);
    });
    lvl.textContent = (k * (.92 + .08 * Math.sin(t * 9))).toFixed(1) + '×';
    held.textContent = (clamp((shp - .48) / .08) * .7).toFixed(1) + ' s';
    shoutGo.classList.toggle('on', shp > .56);
  }

  // voice: three moments, three lines
  const vp = ch.voice.p, li = vp < .36 ? 0 : vp < .7 ? 1 : 2;
  tabs.forEach((x, i) => x.classList.toggle('on', i === li)); lines.forEach((x, i) => x.classList.toggle('on', i === li));
  if (ch.voice.vis) waveBars.forEach((b, i) => { const a = .1 + .9 * Math.abs(Math.sin(t * 6.1 + i * .5) * Math.sin(t * 1.9 + i * .23)); b.style.transform = `scaleY(${a.toFixed(3)})`; });

  // stun: the switch decides
  const stp = ch.stun.p;
  sw.classList.toggle('is-on', stp > .3);
  lks.forEach((l, i) => l.classList.toggle('on', stp > [.12, .45, .7][i]));

  // escape route: distance, the turn, the voice
  const rp = ch.route.p, prog = band(rp, .2, .92), done = prog * 640;
  navCard.classList.toggle('on', rp > .1);
  ncBar.style.setProperty('--w', prog);
  if (prog < .47) { ncDist.textContent = Math.max(0, Math.round(300 - done)) + ' m'; ncDir.textContent = 'RIGHT'; arrow.className = 'arrow right'; }
  else if (prog < .985) { ncDist.textContent = Math.round(640 - done) + ' m'; ncDir.textContent = 'AHEAD'; arrow.className = 'arrow'; }
  else { ncDist.textContent = 'Here'; ncDir.textContent = 'ARRIVED'; arrow.className = 'arrow'; }
  ncSay.textContent = prog < .12 ? '“Route started. Follow the purple line.”' : prog < .35 ? '' : prog < .5 ? '“In fifty metres, turn right.”' : prog < .9 ? '“Go straight.”' : '“You have arrived.”';
  ladder.forEach((l, i) => l.classList.toggle('on', rp > .28 + i * .1));

  // mirror: two scans, two answers
  const mp = ch.mirror.p, s1 = band(mp, .14, .3), s2 = band(mp, .46, .62);
  const A = [.91, .88, .93, .90], B = [.21, .18, .26, .24];
  const vals = mp < .46 ? A.map((v) => v * s1) : B.map((v) => v * s2 + (1 - s2) * .9 * 0);
  mBars.forEach((b, i) => b.style.setProperty('--h', Math.max(.04, vals[i])));
  mvals.textContent = (mp < .14 ? ['—', '—', '—', '—'] : vals.map((v) => v.toFixed(2))).join(' ');
  const res = mp < .3 ? 'SCANNING' : mp < .46 ? 'LOOKS NORMAL' : mp < .62 ? 'SCANNING' : 'SUSPICIOUS';
  mres.textContent = res; mres.className = 'mres' + (res === 'LOOKS NORMAL' ? ' ok' : res === 'SUSPICIOUS' ? ' bad' : '');

  // duress: what he sees, what is true
  const dp = ch.duress.p;
  twB.classList.toggle('on', dp > .4); twA.classList.toggle('dim', dp > .4);

  // app
  if (ch.app.vis || appStep < 0) appFrame(ch.app.p, ch.app.vis);

  // tagline: the loop is drawn, then it breaks free
  const fq = ch.foot.q;
  loopPath.style.strokeDashoffset = loopLen * (1 - ease(band(fq, .15, .55)));
  freePath.style.strokeDashoffset = freeLen * (1 - ease(band(fq, .55, .75)));

  // HUD + page colour
  let curSec = secs[0], idx = 0;
  secs.forEach((s, i) => { if (y + vh * .5 >= s.top) { curSec = s; idx = i; } });
  hudCh.textContent = `${String(idx).padStart(2, '0')} / ${curSec.name}`;
  hudBar.style.setProperty('--p', clamp(y / maxY));
  const sosOn = (ch.sos.vis && ch.sos.p >= .42) || (ch.shout.vis && ch.shout.p > .56) || ch.voice.vis || ch.stun.vis || ch.route.vis;
  hudSos.classList.toggle('sos', sosOn); hudSos.querySelector('b').textContent = sosOn ? 'SOS ON' : 'SOS READY';
  if (curSec.bg !== curBg) {
    curBg = curSec.bg;
    root.style.setProperty('--bg', curSec.bg); root.style.setProperty('--fg', curSec.fg);
    root.classList.toggle('dark', lum(curSec.bg) < .3);
    root.classList.toggle('rose-bg', curSec.id === 'voice');
    document.querySelector('meta[name=theme-color]').setAttribute('content', curSec.bg);
  }
  const away = y > lastY + 1 && y > vh * .8, back = y < lastY - 1;
  if (away && !navAway) { navAway = true; nav.classList.add('away'); } else if ((back || y < vh * .8) && navAway) { navAway = false; nav.classList.remove('away'); }
  lastY = y;
}

// 3D labels: a dot on the part, a line, a small card
function placeLabels(list) {
  if (!list) return;
  for (const a of list) {
    let el = labs.get(a.id);
    if (!el) {
      el = document.createElement('div'); el.className = 'lab';
      el.innerHTML = `<span class="pt"></span><span class="ln"></span><span class="tx"><b>${a.t1}</b><span>${a.t2}</span></span>`;
      labelsEl.append(el); labs.set(a.id, el); el._w = 0;
    } else if (el._t2 !== a.t2) { el.querySelector('.tx span').textContent = a.t2; el._w = 0; }
    el._t2 = a.t2;
    el.classList.toggle('left', !!a.left); el.classList.toggle('on', !!a.on);
    if (!a.on && el.style.opacity === '0') continue;
    if (!el._w || el._side !== a.left) { el._w = el.offsetWidth; el._h = el.offsetHeight; el._side = a.left; }
    const x = a.left ? a.x - el._w + 5.5 : a.x - 5.5;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${(a.y - el._h / 2).toFixed(1)}px, 0)`;
  }
}

// ---------- boot ----------
let world = null, introT = -1;
(async () => {
  await document.fonts.ready;
  if (!/[?&]nogl/.test(location.search)) { try { world = await createWorld($('#world'), (p) => setLoad(.6 + p * .35)); } catch (e) { console.error(e); } }
  if (!world) { root.classList.add('no-webgl'); $('#world').remove(); }
  measure(); world?.layout(pos);
  clearInterval(fakeT); setLoad(1);
  setTimeout(() => {
    ld.classList.add('out'); loading = false; root.style.overflow = '';
    setTimeout(() => ld.remove(), 1200);
    $$('.hero [data-split]').forEach((el) => el.classList.add('in'));
    root.classList.add('go'); introT = performance.now();
  }, 380);
  window.__ready = true;
})();

function fitHero() {
  const ws = $$('.hw'); const stack = innerWidth / innerHeight < .85;
  const wrap = $('.hero-word'); wrap.style.flexDirection = stack ? 'column' : 'row';
  ws.forEach((w) => { w.style.fontSize = '100px'; });
  const widths = ws.map((w) => w.getBoundingClientRect().width);
  const avail = innerWidth * (stack ? .9 : .66), gap = innerWidth * .016;
  const k = stack ? avail / Math.max(...widths) : (avail - gap) / (widths[0] + widths[1]);
  ws.forEach((w) => { w.style.fontSize = (100 * k).toFixed(1) + 'px'; });
}
document.fonts.ready.then(fitHero);
addEventListener('resize', () => { fitHero(); measure(); world?.resize(); world?.layout(pos); appStep = -1; });
addEventListener('load', () => { measure(); world?.layout(pos); });
new ResizeObserver(() => { measure(); world?.layout(pos); }).observe(document.body);

function loop(now) {
  const t = now / 1000;
  if (Math.abs(target - cur) > .4) { cur += (target - cur) * .09; scrollTo(0, cur); } else if (target !== cur) { cur = target; scrollTo(0, cur); }
  const y = window.__forceY ?? scrollY;
  const ch = chState(y);
  dom(y, ch, t);
  if (!still) bg.update(y, t); else if (!bg._once) { bg.update(0, 0); bg._once = 1; }
  cx += (mouse.px - cx) * .22; cy += (mouse.py - cy) * .22;
  cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
  const intro = introT < 0 ? 0 : clamp((now - introT - 100) / 1600);
  if (world) placeLabels(world.frame({ y, ch, mouse, intro }));
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
