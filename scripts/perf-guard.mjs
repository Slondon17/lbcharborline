// Phone performance guard. Stops the "starts at 30 fps, sinks to 5-9 fps, then crashes" pattern on mid-range phones
// (GPU flat out -> heat -> throttling -> Android kills the app), while keeping the picture sharp.
//  1. "Phone display" choice in the office footer (phones and tablets only):
//       Sharp (default)  30 fps at up to 1.5x sharpness
//       Smooth 60        60 fps at 1.0x
//       Battery saver    30 fps at 1.0x
//  2. Automatic governor: if the frame rate stays below target it steps down, one notch at a time, giving up
//     sharpness LAST:  (Smooth only: 60 -> 30 fps) -> glow off -> shadows off
//     -> sharpness 0.85x (never below 1.0x) -> sharpness down to 0.8x as a last resort. Dock cameras are never touched.
//     It steps back up when the phone cools, and remembers roughly where it ended for next time.
//  3. If the phone's graphics driver resets (WebGL context lost), the game saves and reloads instead of closing.
// Computers are unaffected. Safe to run more than once.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* PERF GUARD v2 */';
if (s.includes(MARK)) { console.log('perf-guard: already applied'); process.exit(0); }
if (s.includes('/* PERF GUARD */')) { console.error('perf-guard: an older perf guard is already in this file; start from a clean index.html'); process.exit(1); }
const fail = (m) => { console.error('perf-guard: ' + m); process.exit(1); };
const must = (from, to) => { const n = s.split(from).length - 1; if (n !== 1) fail(`expected 1 match, found ${n}: ${from.slice(0, 70)}`); s = s.replace(from, to); };

/* ---- 1. footer control ---- */
must('<button data-q="high">High · reflections</button></span>',
     '<button data-q="high">High · reflections</button></span><span class="qual" id="phoneDisp" hidden><span>Phone display</span><button data-pd="sharp">Sharp</button><button data-pd="smooth">Smooth 60</button><button data-pd="battery">Battery saver</button></span>');

/* ---- 2. state, governor and crash-safe reload, right before the main loop ---- */
must('let last=performance.now(),wt=0;\nfunction loop(now){requestAnimationFrame(loop);',
`${MARK}
var PERF=(()=>{const touch=matchMedia('(pointer:coarse)').matches;let mode='sharp',lv=0;
  try{mode=localStorage.getItem('harborline-phone-display')||'sharp';lv=Math.max(0,(+localStorage.getItem('harborline-perf-level')||0)-1);}catch(e){}
  if(!['sharp','smooth','battery'].includes(mode))mode='sharp';
  return {touch,mode,level:0,startLevel:touch?lv:0,lastR:0,acc:0,n:0,winT:0,slowT:0,fastT:0,noFX:false,cap:0,told:false};})();
const PD={sharp:{fps:30,pr:1.5},smooth:{fps:60,pr:1.0},battery:{fps:30,pr:1.0}};
/* the governor's steps, in order; sharpness comes last */
function perfSteps(){return (PERF.mode==='smooth'?['fps30']:[]).concat(['glow','shadows','soft','low']);}
function perfApply(){const on=perfSteps().slice(0,PERF.level),pd=PD[PERF.mode];
  if(!PERF.touch){PERF.cap=0;PERF.noFX=false;return;}
  PERF.cap=1000/((on.includes('fps30')?30:pd.fps));PERF.noFX=on.includes('glow');
  const q=QUALITY[G.quality||'medium']||{pr:1.5,sh:2048};
  let pr=Math.min(window.devicePixelRatio||1,q.pr,pd.pr);
  if(on.includes('low'))pr=Math.max(0.8,pr*0.8);else if(on.includes('soft'))pr=Math.max(Math.min(1,pr),pr*0.85);
  if(Math.abs(renderer.getPixelRatio()-pr)>0.01){renderer.setPixelRatio(pr);resize();}
  const wantSh=!on.includes('shadows')&&q.sh>0;
  if(renderer.shadowMap.enabled!==wantSh){renderer.shadowMap.enabled=wantSh;scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);});}}
function perfSetLevel(n,quiet){n=Math.max(0,Math.min(perfSteps().length,n));PERF.level=n;perfApply();
  if(!quiet)try{localStorage.setItem('harborline-perf-level',String(n));}catch(e){}}
function perfSetMode(m){PERF.mode=m;try{localStorage.setItem('harborline-phone-display',m);localStorage.setItem('harborline-perf-level','0');}catch(e){}
  PERF.slowT=PERF.fastT=0;perfSetLevel(0,true);markPD();}
function markPD(){const el=document.getElementById('phoneDisp');if(!el)return;el.hidden=!PERF.touch;
  el.querySelectorAll('[data-pd]').forEach(b=>b.classList.toggle('on',b.dataset.pd===PERF.mode));}
function perfTick(dtMs){PERF.acc+=dtMs;PERF.n++;PERF.winT+=dtMs;if(PERF.winT<2000)return;
  const avg=PERF.acc/PERF.n,tgt=PERF.cap||1000/60;PERF.acc=0;PERF.n=0;PERF.winT=0;
  if(avg>tgt*1.35){PERF.slowT++;PERF.fastT=0;}else if(avg<tgt*1.08){PERF.fastT++;PERF.slowT=0;}else{PERF.slowT=0;PERF.fastT=0;}
  if(PERF.slowT>=2&&PERF.level<perfSteps().length){perfSetLevel(PERF.level+1);PERF.slowT=0;
    if(!PERF.told&&mode==='helm'){PERF.told=true;toast('Graphics eased a little to keep the game smooth.');}}
  else if(PERF.fastT>=15&&PERF.level>0){perfSetLevel(PERF.level-1);PERF.fastT=0;}}
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();try{save();}catch(_){}
  try{localStorage.setItem('harborline-perf-level',String(Math.min(perfSteps().length,PERF.level+2)));}catch(_){}
  setTimeout(()=>location.reload(),1500);},false);
document.getElementById('phoneDisp').addEventListener('click',e=>{const b=e.target.closest('[data-pd]');if(!b)return;perfSetMode(b.dataset.pd);
  toast({sharp:'Phone display: Sharp, 30 fps at full sharpness.',smooth:'Phone display: Smooth, 60 fps.',battery:'Phone display: Battery saver, cooler and longer battery life.'}[b.dataset.pd]);});
let last=performance.now(),wt=0;
function loop(now){requestAnimationFrame(loop);
  if(PERF.cap){if(now-PERF.lastR<PERF.cap-3)return;perfTick(PERF.lastR?now-PERF.lastR:PERF.cap);PERF.lastR=now;}`);

/* ---- 3. hooks into the existing graphics code ---- */
must("const useFX=()=>(G.quality||'medium')!=='low'&&setupFX();",
     "const useFX=()=>!(typeof PERF!=='undefined'&&PERF.noFX)&&(G.quality||'medium')!=='low'&&setupFX();");
must("  resize();}\n\n/* ================= HELM STATE ================= */",
     "  resize();if(typeof PERF!=='undefined'&&PERF)perfApply();}\n\n/* ================= HELM STATE ================= */");
must('renderOffice();requestAnimationFrame(loop);',
     'renderOffice();markPD();perfSetLevel(PERF.startLevel,true);requestAnimationFrame(loop);');

writeFileSync(FILE, s);
console.log('perf-guard: phone display modes (Sharp / Smooth 60 / Battery saver) and sharpness-last governor');
