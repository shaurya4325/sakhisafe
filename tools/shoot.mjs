// Screenshot the site at points of the story (headless Chrome, WebGL via SwiftShader).
// node tools/shoot.mjs <outDir> [width height] [ch:f,ch:f,...]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [outDir, w = '1440', h = '900', list = 'hero:0,problem:.3,problem:.8,sos:.3,sos:.7,shout:.4,shout:.7,voice:.5,stun:.7,route:.6,mirror:.4,mirror:.8,duress:.7,inside:.2,inside:.8,brain:0,app:.2,app:.5,app:.85,real:0,team:0,foot:0'] = process.argv.slice(2);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9400 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'sakhi-shoot-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--hide-scrollbars',
  ...(process.env.GLFLAGS ?? '--enable-unsafe-swiftshader').split(' ').filter(Boolean), `--window-size=${w},${h}`, 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 80 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const logs = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 400));
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) logs.push(m.params.type + ' ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300));
});
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const ev = async (expr) => { const m = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return m.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 700 });
await send('Page.navigate', { url: 'http://127.0.0.1:8765/' });
let ok = false;
for (let i = 0; i < 160 && !ok; i++) { await sleep(250); ok = await ev('!!window.__ready'); }
await sleep(2600);
console.log('diag', await ev(`JSON.stringify({rs: document.readyState, bg: getComputedStyle(document.documentElement).backgroundColor, loader: !!document.getElementById('loader'), go: document.documentElement.className, h: document.documentElement.scrollHeight, gl: !!document.querySelector('canvas#world')})`));
fs.mkdirSync(outDir, { recursive: true });
for (const item of list.split(',')) {
  const [ch, f] = item.split(':');
  const y = await ev(`(() => { const s = document.querySelector('[data-ch="${ch}"]'); const r = s.getBoundingClientRect(); const top = r.top + scrollY; return Math.round(top + ${+f} * Math.max(r.height - innerHeight, 0)); })()`);
  await ev(`window.scrollTo(0, ${y}); window.__forceY = ${y};`);
  if (process.env.HIDE) await ev(`document.querySelectorAll('${process.env.HIDE}').forEach(e => e.style.display='none')`);
  await sleep(1300);
  const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  fs.writeFileSync(path.join(outDir, `${ch}_${f}.png`), Buffer.from(shot.result.data, 'base64'));
}
console.log(ok ? 'ready' : 'NOT READY', logs.length ? '\n' + logs.join('\n') : '(no errors)');
ws.close(); proc.kill(); process.exit(0);
