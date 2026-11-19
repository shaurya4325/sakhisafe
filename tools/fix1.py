# Round 1 of visual fixes after the first full screenshot pass.
import os
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def patch(rel, pairs):
    p = os.path.join(W, rel)
    s = open(p, encoding="utf-8").read()
    for a, b in pairs:
        assert s.count(a) == 1, (rel, a[:80])
        s = s.replace(a, b)
    open(p, "w", encoding="utf-8").write(s)


patch("js/world.js", [
    # device keyframes
    ("  ['problem', 0, -.2, { x: 4.6, y: .2, s: .95, rx: .1, ry: 1.0, rz: -.18, spin: .3, sh: 0 }],\n  ['problem', 1, -.3, { x: 7.8, y: -.4, s: .9, ry: 1.6, rz: -.3 }],",
     "  ['problem', 0, -.25, { x: 7.6, y: .2, s: .95, rx: .1, ry: 1.0, rz: -.18, spin: .3, sh: 0 }],\n  ['problem', 1, -.3, { x: 8.4, y: -.4, s: .9, ry: 1.6, rz: -.3 }],"),
    ("  ['stun', 0, 0, { x: 3.0, y: -1.55, s: 1.32, rx: .12, ry: .62, rz: -.06, sh: 0 }],\n  ['stun', 1, 0, { x: 3.0, y: -1.5, ry: .38 }],",
     "  ['stun', 0, 0, { x: 3.55, y: -1.0, s: 1.12, rx: .14, ry: .62, rz: -.05, sh: 0 }],\n  ['stun', 1, 0, { x: 3.55, y: -1.0, ry: .4 }],"),
    ("  ['route', 0, 0, { x: 4.35, y: .95, s: .78, rx: .12, ry: -.32, rz: .04, sh: 0 }],\n  ['route', 1, 0, { x: 4.35, y: .95, ry: -.12 }],",
     "  ['route', 0, 0, { x: 4.1, y: 1.25, s: .66, rx: .14, ry: -.32, rz: .04, sh: 0 }],\n  ['route', 1, 0, { x: 4.1, y: 1.25, ry: -.12 }],"),
    ("  ['inside', .55, 0, { x: 2.3, y: -.05, s: .62, rx: .1, ry: -1.12, ex: 1 }],\n  ['inside', .95, 0, { ry: -.92, ex: 1 }],",
     "  ['inside', .55, 0, { x: 2.45, y: -.25, s: .74, rx: .16, ry: -1.38, ex: 1 }],\n  ['inside', .95, 0, { ry: -1.18, ex: 1 }],"),
    # route map: smaller, right half, under the device
    ("    mapRig.position.set((narrow ? 0 : 1.7), (narrow ? -1.4 : -1.15), -1.6);\n    mapRig.rotation.set(.62, -.42, 0);\n    mapRig.scale.setScalar(narrow ? .55 : 1);",
     "    mapRig.position.set((narrow ? 0 : 3.35), (narrow ? -1.4 : -1.05), -1.2);\n    mapRig.rotation.set(.66, -.5, 0);\n    mapRig.scale.setScalar(narrow ? .5 : .62);"),
    # stun: glowing sparks along the arcs (1-px lines are invisible on screen)
    ("  const sparks = [0, 1].map(() => add(new THREE.Sprite(",
     "  const arcDots = arcs.map((a, i) => add(new THREE.Points(a.geometry, new THREE.PointsMaterial({ map: glowTex, color: i ? 0x7cc8ff : 0xe8f6ff, size: .22, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))));\n  const sparks = [0, 1].map(() => add(new THREE.Sprite("),
    ("        a.material.opacity = mix(a.material.opacity, arcOn ? (j ? .8 : 1) : 0, arcOn ? .6 : .2);\n      });",
     "        a.material.opacity = mix(a.material.opacity, arcOn ? (j ? .8 : 1) : 0, arcOn ? .6 : .2);\n        arcDots[j].material.opacity = a.material.opacity * .9; arcDots[j].material.size = (j ? .2 : .26) * k.s;\n      });"),
    ("      sparks.forEach((s, i) => { s.position.copy(i ? pB : pA); s.scale.setScalar(.7 * k.s);",
     "      sparks.forEach((s, i) => { s.position.copy(i ? pB : pA); s.scale.setScalar(1.1 * k.s);"),
    # mirror: a lighter pane, thicker beams
    ("new THREE.MeshPhysicalMaterial({ color: 0xd8e6ff, metalness: .9, roughness: .06, transparent: true, opacity: 0, side: THREE.DoubleSide })",
     "new THREE.MeshPhysicalMaterial({ color: 0xf2f6ff, emissive: 0x6a5a80, emissiveIntensity: .35, metalness: .3, roughness: .08, clearcoat: 1, transparent: true, opacity: 0, side: THREE.DoubleSide })"),
    ("new THREE.CylinderGeometry(.018, .018, 1, 8, 1, true)", "new THREE.CylinderGeometry(.04, .04, 1, 10, 1, true)"),
    ("    glass.material.opacity = mirOn * .42;", "    glass.material.opacity = mirOn * .6;"),
    ("irDots[i].scale.setScalar(.35 * k.s);", "irDots[i].scale.setScalar(.6 * k.s);"),
    # teardown labels: a rolling tour, three at a time
    ("    PARTS.forEach(([n, a, b, left], i) => lab('in-' + n, n, a, b, vis('inside') && ip > .5 + i * .018, !!left));",
     "    PARTS.forEach(([n, a, b, left], i) => { const s0 = .46 + i * .042; lab('in-' + n, n, a, b, vis('inside') && ip > s0 && (ip < s0 + .13 || (i >= PARTS.length - 3 && ip > .9)), !!left); });"),
])

patch("css/site.css", [
    # HUD: status runs up the left edge like a viewfinder, out of the copy's way
    (".hud-l, .hud-r { position: absolute; bottom: 14px; display: flex; flex-direction: column; gap: 3px; font-size: 10.5px; letter-spacing: .14em; }\n.hud-l { left: 26px; } .hud-r { right: 26px; text-align: right; align-items: flex-end; }",
     ".hud-l, .hud-r { position: absolute; display: flex; gap: 3px; font-size: 10.5px; letter-spacing: .14em; }\n.hud-l { left: 4px; top: 50%; flex-direction: row; gap: 22px; writing-mode: vertical-rl; transform: translateY(-50%) rotate(180deg); white-space: nowrap; }\n.hud-l .st { writing-mode: vertical-rl; }\n.hud-r { right: 26px; bottom: 14px; flex-direction: column; text-align: right; align-items: flex-end; }"),
    # hero: Hindi under the wordmark, not behind the device
    (".hero-meta { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; }",
     ".hero-meta { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }"),
    # stun / mirror copy sizes, so the device keeps its half
    (".stun .stick { display: flex; flex-direction: column; justify-content: center; }",
     ".stun .stick { display: flex; flex-direction: column; justify-content: center; }\n.stun .h2 { font-size: clamp(40px, 5vw, 86px); max-width: 12ch; }"),
    (".mir-copy { grid-column: 1; max-width: 14ch; } .mir-copy .h2 { font-size: clamp(36px, 5vw, 84px); }",
     ".mir-copy { grid-column: 1; max-width: 44vw; } .mir-copy .h2 { font-size: clamp(36px, 4.6vw, 80px); }"),
    (".route-copy { grid-column: 1; }", ".route-copy { grid-column: 1; } .route .h2 { font-size: clamp(40px, 5.2vw, 90px); }"),
    # app: more room for the phones and their labels
    (".app .stick { display: grid; grid-template-columns: .8fr 1.2fr; align-items: center; }",
     ".app .stick { display: grid; grid-template-columns: .5fr 1.5fr; align-items: center; }\n.app .h2 { font-size: clamp(36px, 4.4vw, 76px); }"),
    (".ph { position: absolute; top: 50%; left: 50%; width: min(250px, 17vw);", ".ph { position: absolute; top: 50%; left: 50%; width: min(236px, 15.5vw);"),
    (".tag b { display: block; font-size: 15px;", ".tag b { display: block; font-size: 14px;"),
])

patch("js/main.js", [
    ("  { c: [50, 54, 0, .8, .12], l: [30, 49, -5, 1], r: [70, 52, 5, 1] },\n  { l2: [30, 50, -5, 1], r2: [70, 49, 5, 1] },",
     "  { c: [50, 54, 0, .8, .12], l: [36, 49, -5, 1], r: [64, 52, 5, 1] },\n  { l2: [36, 50, -5, 1], r2: [64, 49, 5, 1] },"),
    ("    const ex = tg.side === 'l' ? r.left - sr.left - 46 : r.right - sr.left + 46;",
     "    const ex = tg.side === 'l' ? r.left - sr.left - 34 : r.right - sr.left + 34;"),
    ("  const avail = innerWidth * (stack ? .9 : .62), gap = innerWidth * .016;",
     "  const avail = innerWidth * (stack ? .9 : .66), gap = innerWidth * .016;"),
])
print("fix1 applied")
