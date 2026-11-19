// The soothing background from the tagline poster, alive: flower-of-life rosettes, ripples, flowing silk strokes,
// petals and sparkles. Everything drifts slowly on its own and moves with the scroll (parallax), so the page breathes
// with the 3D layer. One SVG, only transforms change per frame (cheap).
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.append(e); return e; };

export function createBg() {
  const svg = el('svg', { id: 'bgfx', viewBox: '0 0 1600 1000', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
  document.body.prepend(svg);
  const items = [];

  // rosettes in the corners: seven circles + two halos, turning very slowly
  const rosette = (cx, cy, r, op, dir) => {
    const g = el('g', { opacity: op, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.1 }, svg);
    el('circle', { cx: 0, cy: 0, r }, g);
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; el('circle', { cx: (r * Math.cos(a)).toFixed(1), cy: (r * Math.sin(a)).toFixed(1), r }, g); }
    items.push((t, y) => g.setAttribute('transform', `translate(${cx} ${cy - y * .06}) rotate(${(t * 2.2 * dir) % 360})`));
  };
  rosette(90, 90, 58, .2, 1); rosette(1520, 930, 64, .2, -1);

  // ripples breathing in from both sides
  const ripples = (cx, cy, op) => {
    const g = el('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.1 }, svg);
    const cs = Array.from({ length: 3 }, (_, k) => el('circle', { cx, cy, r: 90 + k * 90, 'stroke-opacity': op - k * .07 }, g));
    items.push((t, y) => cs.forEach((c, k) => c.setAttribute('r', (90 + k * 90 + Math.sin(t * .6 + k * .7) * 9).toFixed(1))));
  };
  ripples(-40, 520, .3); ripples(1640, 470, .3);

  // flowing silk strokes (periodic, so they can glide forever)
  const P = 800;
  const silk = (y0, amp, n, op, speed) => {
    const g = el('g', { fill: 'none', stroke: 'currentColor' }, svg);
    for (let i = 0; i < n; i++) {
      let d = '';
      for (let x = -P; x <= 1600 + P; x += 10) {
        const yy = y0 + i * 12 + amp * Math.sin((x / P) * 2 * Math.PI + i * .35);
        d += (x === -P ? 'M' : 'L') + x + ',' + yy.toFixed(1);
      }
      el('path', { d, 'stroke-width': 1.1, 'stroke-opacity': (op - .04 * i).toFixed(2) }, g);
    }
    items.push((t, y) => g.setAttribute('transform', `translate(${(-((t * speed + y * .25) % P) + P) % P - P / 2} ${-y * .03 % 40})`));
  };
  silk(140, 24, 3, .22, 22); silk(860, 28, 3, .22, -16);

  // petals drifting, sparkles twinkling
  const petal = (x, y, r, a, i) => {
    const p = el('path', { d: `M0,${-r} C${r * .7},${-r * .4} ${r * .7},${r * .4} 0,${r} C${-r * .7},${r * .4} ${-r * .7},${-r * .4} 0,${-r}z`, fill: 'currentColor', 'fill-opacity': .16 }, svg);
    items.push((t, yy) => {
      const dy = ((y - yy * (.12 + (i % 3) * .05) + t * 6) % 1100 + 1100) % 1100 - 50;
      p.setAttribute('transform', `translate(${x + Math.sin(t * .5 + i) * 18} ${dy}) rotate(${a + t * 12 * (i % 2 ? 1 : -1)})`);
    });
  };
  [[220, 260, 11, 20], [1380, 320, 9, -30], [1460, 720, 11, 40], [200, 780, 9, -20]]
    .forEach(([x, y, r, a], i) => petal(x, y, r, a, i));
  const spark = (x, y, r, i) => {
    const s = el('path', { d: `M0,${-r} Q0,0 ${r},0 Q0,0 0,${r} Q0,0 ${-r},0 Q0,0 0,${-r}z`, fill: 'currentColor' }, svg);
    items.push((t, yy) => {
      s.setAttribute('transform', `translate(${x} ${((y - yy * .08) % 1000 + 1000) % 1000}) scale(${.7 + .5 * Math.sin(t * 1.3 + i * 1.7)})`);
      s.setAttribute('fill-opacity', (.25 + .3 * Math.max(0, Math.sin(t * 1.3 + i * 1.7))).toFixed(2));
    });
  };
  [[300, 340, 6], [1310, 420, 5], [1040, 880, 5]].forEach(([x, y, r], i) => spark(x, y, r, i));

  return { update(y, t) { for (const f of items) f(t, y); } };
}
