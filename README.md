# Sakhi Safe — 3D story website

One long scroll that demonstrates the Sakhi Safe device in live 3D (the team's own Blender model), then the app.

**Open it:** double-click `Open Sakhi Safe website.bat` (needs Python), or run `python -m http.server 8765`
in this folder and open http://127.0.0.1:8765/. Opening `index.html` directly from the file does NOT work
(browsers block 3D/module files from `file://`). Everything is local — no internet needed at the stall.

**Host it online:** upload this folder as-is to any static host (GitHub Pages, Netlify). No build step.

| Folder | What |
|---|---|
| `index.html`, `css/site.css` | page and styles (pearl / plum / rose, bangle patterns) |
| `js/main.js` | scroll conductor: chapters, timers, meters, app leader lines |
| `js/world.js` | the 3D world: device, screen states, rings, stun arcs, route map, IR beams, teardown |
| `assets/sakhi.glb` | device model, exported from the Blender script (`sakhi_web.py`, mode `glb`) |
| `assets/screens/` | device screen states, from `sakhisathi/tools/make_web_assets.py` (firmware-accurate UI) |
| `img/` | app screenshots, bench photos, team |
| `vendor/three`, `fonts/` | three.js 0.170.0, Anek Devanagari, Tiro Devanagari Hindi, JetBrains Mono (self-hosted) |
| `tools/shoot.mjs` | headless screenshots of any point of the story: `node tools/shoot.mjs out 1440 900 sos:.7,route:.6` |
