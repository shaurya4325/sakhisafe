// The 3D layer: one scene for the whole page. The device is the team's own Blender model (every real module inside),
// exported to GLB. Each chapter moves it, changes what its screen shows, and brings its own set piece:
// siren rings, sound rings, stun arcs, a street map with the escape route, IR beams on a mirror, the teardown.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const band = (p, a, b) => clamp((p - a) / (b - a));

// keyframes over the page scroll: [chapter, f, off, values] -> scroll = top + f*(height - vh) + off*vh
function track(keys) {
  let at = [];
  return {
    layout(pos) {
      let last = {};
      at = keys.map(([id, f, off, v]) => { last = { ...last, ...v }; return { y: pos(id, f, off), v: last }; }).sort((a, b) => a.y - b.y);
    },
    get(y) {
      if (!at.length) return {};
      if (y <= at[0].y) return at[0].v;
      for (let i = 0; i < at.length - 1; i++) {
        const a = at[i], b = at[i + 1];
        if (y < b.y) {
          const t = smooth(clamp((y - a.y) / Math.max(1, b.y - a.y)));
          const o = {};
          for (const k in b.v) o[k] = mix(a.v[k] ?? b.v[k], b.v[k], t);
          return o;
        }
      }
      return at[at.length - 1].v;
    },
  };
}

const PI = Math.PI;
const DESK = track([
  ['hero', 0, 0, { x: 3.0, y: -.15, s: 1.08, rx: .08, ry: -.55, rz: .06, ex: 0, spin: 1, sh: 1 }],
  ['hero', 0, .7, { x: 3.4, y: .05, ry: .25, rz: -.03, spin: .6 }],
  ['problem', 0, -.25, { x: 7.6, y: .2, s: .95, rx: .1, ry: 1.0, rz: -.18, spin: .3, sh: 0 }],
  ['problem', 1, -.3, { x: 8.4, y: -.4, s: .9, ry: 1.6, rz: -.3 }],
  ['sos', 0, -.5, { x: 3.6, y: 4.6, s: 1.12, rx: .04, ry: -.2, rz: 0, spin: 0, sh: 0 }],
  ['sos', 0, 0, { x: 3.1, y: -.05, s: 1.12, rx: .04, ry: -.22, rz: 0, sh: 1 }],
  ['sos', 1, 0, { x: 3.1, y: -.05, ry: -.12 }],
  ['shout', 0, 0, { x: 3.2, y: .55, s: 1.42, rx: .02, ry: -.08, rz: 0 }],
  ['shout', 1, 0, { x: 3.2, y: .55, ry: .06 }],
  ['voice', 0, 0, { x: 3.2, y: .05, s: 1.12, rx: .02, ry: PI - .55, rz: 0 }],
  ['voice', 1, 0, { ry: PI - .25 }],
  ['stun', 0, 0, { x: 3.55, y: -1.0, s: 1.12, rx: .14, ry: .62, rz: -.05, sh: 0 }],
  ['stun', 1, 0, { x: 3.55, y: -1.0, ry: .4 }],
  ['route', 0, 0, { x: 4.1, y: 1.25, s: .66, rx: .14, ry: -.32, rz: .04, sh: 0 }],
  ['route', 1, 0, { x: 4.1, y: 1.25, ry: -.12 }],
  ['mirror', 0, 0, { x: 3.35, y: .95, s: 1.0, rx: -.42, ry: -.25, rz: 0 }],
  ['mirror', 1, 0, { x: 3.35, y: .95, ry: .1 }],
  ['duress', 0, 0, { x: 3.2, y: -.05, s: 1.1, rx: .04, ry: -.2, rz: 0, sh: 1 }],
  ['duress', 1, 0, { ry: -.05 }],
  ['inside', 0, 0, { x: 2.7, y: -.15, s: .82, rx: .06, ry: -.35, ex: 0, sh: 1 }],
  ['inside', .14, 0, { ry: -.55, ex: 0 }],
  ['inside', .55, 0, { x: 2.45, y: -.25, s: .74, rx: .16, ry: -1.38, ex: 1 }],
  ['inside', .95, 0, { ry: -1.18, ex: 1 }],
  ['brain', 0, -.2, { x: 3.0, y: -6.5, s: .6, ry: -1.6, ex: .4, sh: 0 }],
  ['app', 0, 0, { x: 3.0, y: -8, ex: 0 }],
]);
// phones and narrow windows: the device sits above the copy, smaller, no side labels
const NARROW = track([   // phones: the device lives in the top part of the screen, the copy below it
  ['hero', 0, 0, { x: .35, y: .55, s: .5, rx: .08, ry: -.55, rz: .06, ex: 0, spin: 1, sh: 0 }],
  ['hero', 0, .6, { x: .2, y: 1.2, s: .5, spin: .5 }],
  ['problem', 0, -.2, { x: 0, y: 6.5, s: .6, spin: 0 }],
  ['problem', 1, 0, { x: 0, y: 6.5 }],
  ['sos', 0, 0, { x: 0, y: 1.9, s: .62, rx: .04, ry: -.2, rz: 0 }],
  ['shout', 0, 0, { x: 0, y: 1.85, s: .66, ry: -.05 }],
  ['voice', 0, 0, { x: 0, y: 1.85, s: .6, ry: PI - .5 }],
  ['stun', 0, 0, { x: 0, y: 1.55, s: .66, ry: .55 }],
  ['route', 0, 0, { x: .45, y: 2.35, s: .4, ry: -.25 }],
  ['mirror', 0, 0, { x: 0, y: 2.35, s: .5, rx: -.42, ry: -.2 }],
  ['duress', 0, 0, { x: 0, y: 1.9, s: .62, rx: .04, ry: -.15 }],
  ['inside', 0, 0, { x: 0, y: 1.9, s: .5, ex: 0, ry: -.4 }],
  ['inside', .55, 0, { y: 1.85, s: .4, rx: .16, ry: -1.38, ex: 1 }],
  ['brain', 0, -.2, { y: -6.5, ex: .4 }],
]);

// exploded view: the Blender layer offsets (Blender x, y, z) -> three (x, z, -y)
const OFF = { front_shell: [0, -21, 0], front_layer: [0, -14, 0], mid_layer: [0, -7, 0], back_layer: [0, -.5, 0], back_shell: [0, 7, 0],
  head: [0, -3, 10.5], head_inner: [0, -3, 5.5], ir_cap: [0, -3, -5.5], ir_layer: [0, -3, -2.6] };

const PARTS = [   // teardown labels: object, title, line 2, side
  ['ESP32_PCB', 'ESP32', 'main brain · Bluetooth', 1], ['Node_PCB', 'NodeMCU', 'screen · Wi-Fi · maps', 0],
  ['BT_PCB', 'Speaker board', 'Bluetooth audio', 0], ['TFT_PCB', '1.8" screen', 'ST7735 · 160×128', 1],
  ['Spk_Frame', 'Speaker', 'voice + siren', 0], ['LiPo_0', '7.4 V pack', '+ a separate stun cell', 0],
  ['MT3608', 'Step-down', 'LM2596 · 5 V + 4 V', 0], ['HV_Module', 'Stun module', 'switched by a relay', 1],
  ['IR_PCB_1', '4 IR sensors', 'mirror check', 1], ['Mic_PCB', 'Shout mic', 'loudness, not words', 1],
  ['RGB_PCB', 'Status light', 'green ready · red SOS', 0],
];

export async function createWorld(canvas, onProgress = () => {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 200);
  camera.position.set(0, 0, 14);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.add(new THREE.HemisphereLight(0xfff0f5, 0x3a2030, .55));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc2d6, 1.6); rim.position.set(-6, 3, -5); scene.add(rim);

  // ---------- the device ----------
  const gltf = await new GLTFLoader().loadAsync('assets/sakhi.glb', (e) => e.total && onProgress(e.loaded / e.total));
  const model = gltf.scene;
  const stage = new THREE.Group(), spin = new THREE.Group(), fit = new THREE.Group();
  scene.add(stage); stage.add(spin); spin.add(fit); fit.add(model);
  const bb = new THREE.Box3().setFromObject(model), size = bb.getSize(new THREE.Vector3()), ctr = bb.getCenter(new THREE.Vector3());
  model.position.copy(ctr).multiplyScalar(-1);
  const S = 3.4 / size.y;
  fit.scale.setScalar(S);
  const byName = {};
  const parts = [];
  model.traverse((o) => {
    byName[o.name] = o;
    if (o.userData && o.userData.grp && OFF[o.userData.grp]) {
      const [dx, dy, dz] = OFF[o.userData.grp];
      parts.push({ o, base: o.position.clone(), off: new THREE.Vector3(dx, dz, -dy) });
    }
    if (o.isMesh) { o.frustumCulled = false; if (o.material && o.material.transparent === undefined) o.material.transparent = false; }
  });
  const get = (n) => byName[n] || byName[THREE.PropertyBinding.sanitizeNodeName(n)] || null;   // the loader drops '.' from names
  const centerOf = (o) => {   // world centre of an object's geometry (cached in local space)
    if (!o) return null;
    if (!o.userData._c) {
      const b = new THREE.Box3().setFromObject(o);
      o.updateWorldMatrix(true, false);
      o.userData._c = b.getCenter(new THREE.Vector3()).applyMatrix4(o.matrixWorld.clone().invert());
    }
    return o.userData._c.clone().applyMatrix4(o.matrixWorld);
  };

  // the screen shows the real firmware UI states
  const texL = new THREE.TextureLoader();
  const names = ['boot', 'home', 'hold3', 'hold2', 'hold1', 'sos', 'count', 'map', 'mapsos', 'help', 'mirror_ok', 'mirror_bad', 'duress'];
  const tex = {};
  await Promise.all(names.map((n) => texL.loadAsync(`assets/screens/${n}.png`).then((t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 4; t.magFilter = THREE.LinearFilter; tex[n] = t;
  })));
  const scr = get('Screen_On');
  const scrMat = new THREE.MeshBasicMaterial({ map: tex.boot, toneMapped: false });
  if (scr) { scr.traverse((m) => { if (m.isMesh) m.material = scrMat; }); }
  let curScr = 'boot';
  const setScreen = (n) => { if (n !== curScr && tex[n]) { curScr = n; scrMat.map = tex[n]; } };

  // status light
  const rgb = get('RGB_Lens');
  const rgbMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x22c55e, emissiveIntensity: 2.2, roughness: .2 });
  if (rgb) rgb.traverse((m) => { if (m.isMesh) m.material = rgbMat; });
  const GREEN = new THREE.Color(0x2ee87a), RED = new THREE.Color(0xff2a3c);
  const sosBtn = [get('SOS_Button'), get('SOS_Text')].filter(Boolean).map((o) => ({ o, z: o.position.z }));

  // ---------- set pieces ----------
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const add = (o) => { scene.add(o); return o; };

  // soft contact shadow under the device on pearl pages
  const shadow = add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, color: 0x5a1a35, transparent: true, opacity: 0, depthWrite: false })));
  shadow.rotation.x = -PI / 2;

  // rings: siren (around the device) and sound (from the speaker)
  const ringGeo = new THREE.RingGeometry(.96, 1, 96);
  const mkRings = (col) => Array.from({ length: 5 }, () => add(new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }))));
  const siren = mkRings(0xe0182d), sound = mkRings(0xfff7fa);

  // stun arcs between the two prongs
  const arcN = 28;
  const arcs = Array.from({ length: 3 }, (_, i) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arcN * 3), 3));
    return add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: i ? 0x9fd8ff : 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));
  });
  const arcDots = arcs.map((a, i) => add(new THREE.Points(a.geometry, new THREE.PointsMaterial({ map: glowTex, color: i ? 0x7cc8ff : 0xe8f6ff, size: .22, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))));
  const sparks = [0, 1].map(() => add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9fd8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))));

  // escape route: a little street map that tilts in under the device
  const mapRig = add(new THREE.Group());
  const mapTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
    g.fillStyle = '#f4eee6'; g.fillRect(0, 0, 1024, 1024);
    g.fillStyle = '#e3efe1'; [[60, 640, 240, 300], [720, 90, 230, 210], [690, 700, 270, 260]].forEach((r) => g.fillRect(...r));
    g.fillStyle = '#dbe8f6'; g.fillRect(0, 900, 360, 124);
    g.strokeStyle = '#ffffff'; g.lineCap = 'round';
    const road = (pts, w) => { g.lineWidth = w + 6; g.strokeStyle = '#ddd2c6'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.lineWidth = w; g.strokeStyle = '#fff'; g.stroke(); };
    [[[0, 520], [1024, 520]], [[512, 1024], [512, 0]], [[0, 180], [1024, 200]], [[200, 1024], [220, 0]], [[820, 1024], [800, 0]]].forEach((p, i) => road(p, i < 2 ? 34 : 18));
    road([[512, 520], [800, 360], [1024, 330]], 16);
    g.fillStyle = '#d8ccc0'; for (let i = 0; i < 26; i++) { const x = (i * 197) % 960 + 20, y = (i * 331) % 960 + 20; if (Math.abs(x - 512) > 40 && Math.abs(y - 520) > 40) g.fillRect(x, y, 34 + (i % 3) * 10, 26 + (i % 4) * 6); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  })();
  const mapPlane = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: mapTex, transparent: true, opacity: 0, toneMapped: false }));
  mapPlane.rotation.x = -PI / 2; mapRig.add(mapPlane);
  const M = (u, v) => new THREE.Vector3((u / 1024 - .5) * 9, .02, (v / 1024 - .5) * 9);
  const routeCurve = new THREE.CatmullRomCurve3([M(512, 980), M(512, 760), M(512, 560), M(530, 525), M(620, 470), M(800, 362), M(930, 340)], false, 'catmullrom', .05);
  const routeGeo = new THREE.TubeGeometry(routeCurve, 220, .07, 10, false);
  const routeMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0, toneMapped: false });
  const route = new THREE.Mesh(routeGeo, routeMat); mapRig.add(route);
  const routeCount = routeGeo.index.count;
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xc2185b, roughness: .35, transparent: true, opacity: 0 });
  const pin = new THREE.Group(); mapRig.add(pin);
  const pinHead = new THREE.Mesh(new THREE.SphereGeometry(.26, 32, 16), pinMat); pinHead.position.y = .62; pin.add(pinHead);
  const pinTip = new THREE.Mesh(new THREE.ConeGeometry(.2, .5, 32), pinMat); pinTip.rotation.x = PI; pinTip.position.y = .28; pin.add(pinTip);
  pin.position.copy(M(930, 340));
  const me = new THREE.Mesh(new THREE.CircleGeometry(.16, 32), new THREE.MeshBasicMaterial({ color: 0x1e63d6, transparent: true, opacity: 0, toneMapped: false }));
  me.rotation.x = -PI / 2; mapRig.add(me);
  const meHalo = new THREE.Mesh(new THREE.CircleGeometry(.34, 32), new THREE.MeshBasicMaterial({ color: 0x9cc2ff, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
  meHalo.rotation.x = -PI / 2; mapRig.add(meHalo);

  // mirror check: a pane of glass and four IR beams
  const glassTex = (() => {      // a pane of glass: soft sheen and two diagonal light streaks
    const c = document.createElement('canvas'); c.width = 512; c.height = 320; const g = c.getContext('2d');
    const bgr = g.createLinearGradient(0, 0, 512, 320); bgr.addColorStop(0, 'rgba(210,225,255,.55)'); bgr.addColorStop(1, 'rgba(160,150,200,.25)');
    g.fillStyle = bgr; g.fillRect(0, 0, 512, 320);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(120, 0); g.lineTo(190, 0); g.lineTo(80, 320); g.lineTo(10, 320); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(230, 0); g.lineTo(250, 0); g.lineTo(140, 320); g.lineTo(120, 320); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; g.strokeRect(2, 2, 508, 316);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const glass = add(new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.25), new THREE.MeshBasicMaterial({ map: glassTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })));
  glass.rotation.x = -PI / 2 + .55;
  const beamGeo = new THREE.CylinderGeometry(.04, .04, 1, 10, 1, true); beamGeo.translate(0, -.5, 0);
  const beams = Array.from({ length: 8 }, (_, i) => add(new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: i < 4 ? 0xff4d6d : 0xffb3c4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))));
  const irDots = Array.from({ length: 4 }, () => add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff4d6d, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))));

  // ---------- sizing ----------
  let W = 1, H = 1, narrow = false;
  function resize() {
    W = innerWidth; H = innerHeight; narrow = W / H < .9 || W < 760;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  }
  resize();
  const layout = (pos) => { DESK.layout(pos); NARROW.layout(pos); };

  const v = new THREE.Vector3();
  const toScreen = (p) => { v.copy(p).project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, front: v.z < 1 }; };
  const t0 = performance.now();

  function frame({ y, ch, mouse, intro }) {
    const t = (performance.now() - t0) / 1000;
    const k = (narrow ? NARROW : DESK).get(y);
    const ix = 1 - smooth(clamp(intro));
    // device transform
    stage.position.set(k.x + mouse.x * .08, k.y - mouse.y * .06 - ix * 1.2, 0);
    const idle = (k.spin || 0) * Math.sin(t * .5) * .22;
    spin.rotation.set(k.rx + mouse.y * .04, k.ry + idle + mouse.x * .1 + ix * 1.6, k.rz);
    stage.scale.setScalar(k.s * (1 - ix * .25));
    for (const p of parts) p.o.position.copy(p.base).addScaledVector(p.off, (k.ex || 0));
    scene.updateMatrixWorld(true);

    // what the screen says, and the light
    const sp = ch.sos?.p ?? 0, shp = ch.shout?.p ?? 0, mp = ch.mirror?.p ?? 0, rp = ch.route?.p ?? 0;
    let scrN = t < 1.4 + intro * 0 ? 'boot' : 'home', red = false;
    const vis = (id) => ch[id] && ch[id].vis;
    if (vis('sos')) { scrN = sp < .12 ? 'home' : sp < .22 ? 'hold3' : sp < .32 ? 'hold2' : sp < .42 ? 'hold1' : 'sos'; red = sp >= .42; }
    else if (vis('shout')) { scrN = shp < .56 ? 'home' : 'count'; red = shp >= .56; }
    else if (vis('voice') || vis('stun')) { scrN = 'sos'; red = true; }
    else if (vis('route')) { scrN = rp < .1 ? 'sos' : 'mapsos'; red = true; }
    else if (vis('mirror')) { scrN = mp < .3 ? 'home' : mp < .62 ? 'mirror_ok' : 'mirror_bad'; }
    else if (vis('duress')) { scrN = 'duress'; }
    else if (vis('problem')) { scrN = 'home'; }
    if (t > 1.4 || y > 10) setScreen(scrN); else setScreen('boot');
    rgbMat.emissive.copy(red ? RED : GREEN);
    rgbMat.emissiveIntensity = red ? 2.4 + Math.sin(t * 12) * 1.2 : 1.8;
    const press = vis('sos') ? (sp > .1 && sp < .44 ? 1 : 0) : 0;
    for (const b of sosBtn) b.o.position.z = mix(b.o.position.z, b.z - press * .14, .25);

    // contact shadow
    const bottom = centerOf(get('IR_Cap')) || stage.position;
    shadow.position.set(stage.position.x, bottom.y - .55 * k.s, 0);
    shadow.scale.set(3.4 * k.s, 1.3 * k.s, 1);
    shadow.material.opacity = mix(shadow.material.opacity, (k.sh || 0) * .35, .1);

    // siren rings around the device while SOS is on
    const sirenOn = (vis('sos') && sp > .42) || (vis('shout') && shp > .56);
    siren.forEach((r, i) => {
      const ph = (t * .55 + i / siren.length) % 1;
      r.position.copy(stage.position); r.quaternion.copy(camera.quaternion);
      r.scale.setScalar((.9 + ph * 3.2) * k.s);
      r.material.opacity = mix(r.material.opacity, sirenOn ? (1 - ph) * .55 : 0, .15);
    });
    // sound rings from the speaker on the back
    const spk = centerOf(get('Spk_Ring'));
    const soundOn = vis('voice');
    sound.forEach((r, i) => {
      const ph = (t * .7 + i / sound.length) % 1;
      if (spk) r.position.copy(spk);
      r.quaternion.copy(camera.quaternion);
      r.scale.setScalar((.25 + ph * 1.9) * k.s);
      r.material.opacity = mix(r.material.opacity, soundOn ? (1 - ph) * .8 : 0, .15);
    });

    // stun arcs
    const stp = ch.stun?.p ?? 0, arcOn = vis('stun') && stp > .45 && Math.sin(t * 9) > -.6;
    const pA = centerOf(get('Prong_tip_0.85')), pB = centerOf(get('Prong_tip_-0.85'));
    if (pA && pB) {
      const dir = new THREE.Vector3().subVectors(pB, pA), up = new THREE.Vector3(0, 1, 0).applyQuaternion(spin.quaternion);
      arcs.forEach((a, j) => {
        const arr = a.geometry.attributes.position.array;
        for (let i = 0; i < arcN; i++) {
          const u = i / (arcN - 1), lift = Math.sin(u * PI) * (.22 + j * .06) * k.s, jit = (i === 0 || i === arcN - 1) ? 0 : (Math.random() - .5) * .16 * k.s;
          const p = pA.clone().addScaledVector(dir, u).addScaledVector(up, lift + jit);
          p.x += (Math.random() - .5) * .05 * k.s; p.z += (Math.random() - .5) * .05 * k.s;
          arr.set([p.x, p.y, p.z], i * 3);
        }
        a.geometry.attributes.position.needsUpdate = true;
        a.material.opacity = mix(a.material.opacity, arcOn ? (j ? .8 : 1) : 0, arcOn ? .6 : .2);
        arcDots[j].material.opacity = a.material.opacity * .9; arcDots[j].material.size = (j ? .2 : .26) * k.s;
      });
      sparks.forEach((s, i) => { s.position.copy(i ? pB : pA); s.scale.setScalar(1.1 * k.s); s.material.opacity = arcOn ? .9 : mix(s.material.opacity, 0, .2); });
    }

    // escape route on the street map
    const routeOn = vis('route') ? smooth(band(rp, 0, .12)) : 0;
    mapRig.position.set((narrow ? -.1 : 3.35), (narrow ? 1.35 : -1.05), -1.2);
    mapRig.rotation.set(.66, -.5, 0);
    mapRig.scale.setScalar(narrow ? .36 : .62);
    mapPlane.material.opacity = routeOn * .96;
    const prog = band(rp, .2, .92);
    routeMat.opacity = routeOn; route.geometry.setDrawRange(0, Math.floor(routeCount * prog / 6) * 6);
    pinMat.opacity = routeOn; pin.position.y = .02 + Math.abs(Math.sin(t * 2.4)) * .18; pin.rotation.y = t;
    const mePos = routeCurve.getPointAt(clamp(prog, 0, .999));
    me.position.set(mePos.x, .05, mePos.z); meHalo.position.set(mePos.x, .04, mePos.z);
    me.material.opacity = routeOn; meHalo.material.opacity = routeOn * (.35 + Math.sin(t * 4) * .15);
    meHalo.scale.setScalar(1 + Math.sin(t * 4) * .15);

    // mirror check
    const mirOn = vis('mirror') ? smooth(band(mp, 0, .12)) : 0;
    const irs = [0, 1, 2, 3].map((i) => centerOf(get(`IRlens_${i}_-0.24`)));
    const gy = (irs[0] ? Math.min(...irs.map((p) => p.y)) : 0) - .9 * k.s;
    glass.position.set(stage.position.x - .1 * k.s, gy, .3); glass.scale.setScalar(k.s * .7);
    glass.material.opacity = mirOn;
    const scan1 = band(mp, .14, .3), scan2 = band(mp, .46, .62), two = mp > .46;
    const reach = mp < .46 ? scan1 : scan2;
    irs.forEach((p, i) => {
      if (!p) return;
      const out = beams[i], back = beams[i + 4], d = p.y - gy;
      out.position.copy(p); out.scale.set(k.s, d * reach, k.s); out.material.opacity = mirOn * (reach > 0 ? .85 : 0);
      back.position.set(p.x + .06 * k.s, gy, p.z); back.rotation.z = PI; back.scale.set(k.s, d * clamp(reach * 1.4 - .4), k.s);
      back.material.opacity = mirOn * (reach > .3 ? (two ? .18 : .9) : 0);
      irDots[i].position.copy(p); irDots[i].scale.setScalar(.6 * k.s); irDots[i].material.opacity = mirOn * .9;
    });

    renderer.render(scene, camera);

    // labels for the DOM layer
    const L = [];
    const lab = (id, objName, t1, t2, on, left) => {
      const c = centerOf(get(objName));
      if (!c) return;
      const s = toScreen(c);
      L.push({ id, x: s.x, y: s.y, t1, t2, on: on && s.front && !narrow, left });
    };
    const hp = clamp(y / H);
    lab('h-screen', 'Screen_On', 'Live screen', 'its own maps', hp < .35 && intro > .95 && !narrow, true);
    lab('h-sos', 'SOS_Button', 'SOS', 'hold 3 seconds', hp < .35 && intro > .95, true);
    lab('h-stun', 'Prong_0.85', 'Stun prongs', 'last resort', hp < .35 && intro > .95, false);
    lab('s-sos', 'SOS_Button', 'Hold here', '3 seconds', vis('sos') && sp > .06 && sp < .5, true);
    lab('s-led', 'RGB_Lens', 'Status light', sp >= .42 ? 'red = SOS' : 'green = ready', vis('sos') && sp > .06, false);
    lab('sh-mic', 'Mic_hole_1', 'Shout mic', 'always listening', vis('shout') && shp > .08, true);
    lab('v-spk', 'Spk_Ring', 'Speaker', 'English + Hindi', vis('voice') && (ch.voice.p > .05), true);
    lab('st-btn', 'Stun_Button', 'Stun button', 'side, hold to fire', vis('stun') && stp > .1, true);
    lab('st-pr', 'Prong_0.85', 'Prongs', 'only when ON', vis('stun') && stp > .45, false);
    lab('m-ir', 'IRlens_1_-0.24', '4 IR eyes', 'on the bottom edge', vis('mirror') && mp > .08, true);
    const ip = ch.inside?.p ?? 0;
    PARTS.forEach(([n, a, b, left], i) => { const s0 = .46 + i * .042; lab('in-' + n, n, a, b, vis('inside') && ip > s0 && (ip < s0 + .13 || (i >= PARTS.length - 3 && ip > .9)), !!left); });
    return L;
  }

  return { frame, layout, resize, setScreen };
}
