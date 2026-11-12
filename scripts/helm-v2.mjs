// Helm console, round 2:
//  - Classic controls removed: the helm console is the only layout
//  - Thruster and tug keys latch: tap once to run, tap again (or the other direction) to stop
//  - Folding the console leaves the engine lever and steering wheel on screen as a minimal HUD
//  - The mission card becomes a simple timer
//  - Dock cameras sit higher up, out of the playing view
// Runs after console-controls, center-view and top-tabs. Safe to run more than once.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* HELM V2 */';
if (s.includes(MARK)) { console.log('helm-v2: already applied'); process.exit(0); }
const fail = (m) => { console.error('helm-v2: ' + m); process.exit(1); };
const must = (from, to) => { const n = s.split(from).length - 1; if (n !== 1) fail(`expected 1 match, found ${n}: ${from.slice(0, 70)}`); s = s.replace(from, to); };
for (const m of ['/* CONSOLE CONTROLS */', '/* CENTER VIEW */', '/* TOP TABS */']) if (!s.includes(m)) fail('run the earlier scripts first: ' + m);

/* 1. Console only */
must("setCtrl(saved?saved==='console':touch,true);", "setCtrl(true,true);");

/* 2. Latching thruster and tug keys */
must(`  document.querySelectorAll('[data-chold]').forEach(b=>{const k=b.dataset.chold;
    const on=e=>{e.preventDefault();hold[k]=1;b.classList.add('on');try{b.setPointerCapture(e.pointerId)}catch(_){}};
    const off=()=>{hold[k]=0;b.classList.remove('on');};
    b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);b.addEventListener('contextmenu',e=>e.preventDefault());});`,
`  const pairOf={bowL:'bowR',bowR:'bowL',tugL:'tugR',tugR:'tugL'};
  const latch=(k,on)=>{hold[k]=on?1:0;};
  document.querySelectorAll('[data-chold]').forEach(b=>{const k=b.dataset.chold;
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(!P||mode!=='helm')return;const on=!hold[k];latch(k,on);if(on)latch(pairOf[k],false);});
    b.addEventListener('contextmenu',e=>e.preventDefault());});
  setInterval(()=>{if(!P||mode!=='helm'||P.done)for(const k in pairOf)hold[k]=0;
    document.querySelectorAll('[data-chold]').forEach(x=>{const on=!!hold[x.dataset.chold];x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on));});},100);`);

/* 3. Folded console keeps the lever and wheel: the view centres above the small tab */
must("const cn=document.getElementById('console');if(cn&&!cn.hidden)els.push(cn);",
     "const cn=document.getElementById('console');if(cn&&!cn.hidden)els.push(cn.classList.contains('tuck')?cn.querySelector('.cn-tab'):cn);");

/* 4 + 5 + styles */
const css = `
${MARK}
#ctrlBtn,#pCtrl{display:none!important}
.hud-bottom .tele,.hud-bottom .gauges,.hud-bottom .thr{display:none!important}
.ck.on i{background:#ffb347;box-shadow:0 0 8px #ffb347}
.ck.on{color:#ffd08a}
/* folded console = minimal HUD: engine lever left, wheel right, small tab in between */
.console.tuck{background:none;box-shadow:none;overflow:visible;pointer-events:none;width:min(920px,calc(100% - 2*max(10px,env(safe-area-inset-left,0px))));min-width:0;display:flex;flex-direction:column}
.console.tuck .cn-face{display:grid!important;background:none;border:0;padding:0 4px;pointer-events:none}
.console.tuck .cn-mid,.console.tuck .cn-keys,.console.tuck .cn-cap{visibility:hidden}
.console.tuck .cn-eng,.console.tuck .cn-til{pointer-events:auto}
.console.tuck .cn-slot{background:rgba(11,13,15,.8)}
.console.tuck .cn-tab{order:2;width:auto;align-self:center;margin-top:4px;padding:0 12px;border-radius:6px;pointer-events:auto;box-shadow:0 4px 12px rgba(0,0,0,.5)}
/* mission card -> timer */
.brief #hBerth,.brief #hNav,.brief #hWx,.brief [data-fold]{display:none!important}
.brief{padding:6px 12px!important;max-width:none!important;flex:0 0 auto!important;gap:4px!important}
.brief #hClock{font-size:15px;color:var(--fg)}
.brief .dockmeter{width:150px}
@media (orientation:landscape) and (max-height:520px){
  .console.tuck{width:auto;right:max(8px,env(safe-area-inset-right,0px))}
  .brief #hClock{font-size:12px}
  .brief .dockmeter{width:120px}
  /* dock cameras up in the top bar, between the timer and the chart */
  .dockcam{top:calc(6px + env(safe-area-inset-top,0px));width:20vw;left:calc(max(8px,env(safe-area-inset-left,0px)) + 196px)}
  .dockcam.right{left:auto;right:calc(max(8px,env(safe-area-inset-right,0px)) + 148px)}
}
`;
must('</style>\n\n<canvas id="gl"', css + '</style>\n\n<canvas id="gl"');

// help text: the old line mentioned the rudder slider (optional; skipped if the wording has changed)
s = s.replace('On a phone, use the console buttons and drag the rudder slider.', 'On a phone or with a mouse, drag the engine lever and turn the steering wheel on the helm console. Thruster and tug keys switch on with one tap and off with another.');

// touch wording for the on-screen tips (optional; skipped if the tip code differs)
if (s.split('  if(h!==lastHint){el.innerHTML=h;lastHint=h;}').length === 2 && !s.includes('TOUCH_UI')) {
  s = s.replace('  if(h!==lastHint){el.innerHTML=h;lastHint=h;}', '  if(TOUCH_UI)h=touchHint(h);\n  if(h!==lastHint){el.innerHTML=h;lastHint=h;}');
  s = s.replace('/* ================= MODAL / TOAST ================= */', "const TOUCH_UI=matchMedia('(pointer:coarse)').matches;\nconst touchHint=h=>h.replace('<kbd>W</kbd><kbd>S</kbd> engine order','Drag the engine <b>lever</b>').replace('<kbd>W</kbd><kbd>S</kbd> engine','Engine <b>lever</b>')\n  .replace('<kbd>A</kbd><kbd>D</kbd> rudder','turn the <b>wheel</b>').replace('<kbd>V</kbd> camera · ','').replace('<kbd>M</kbd> sound · ','')\n  .replace('<kbd>W</kbd> pushes her in','lever ahead pushes her in').replace('<kbd>S</kbd> eases off','lever back eases off')\n  .replace('<kbd>Q</kbd><kbd>E</kbd> walk sideways','<b>Walk</b> keys move you sideways').replace('<kbd>Q</kbd><kbd>E</kbd> bow thruster','<b>Bow</b> keys for the thruster')\n  .replace('<kbd>Z</kbd><kbd>X</kbd> tugs push you sideways','<b>Tug</b> keys push you sideways').replace(' (<kbd>F</kbd> makes fast)',' (or tap <b>Make fast</b>)');\n" + '/* ================= MODAL / TOAST ================= */');
}

writeFileSync(FILE, s);
console.log('helm-v2: console-only controls, latching keys, minimal folded HUD, timer, higher dock cams');
