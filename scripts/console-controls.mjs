// "Console" controls: a ship's-helm style control panel for touch players
// (engine lever, steering tiller, thruster keypad, small displays), plus a restyled
// wheelhouse view with wood posts, white window frames, hanging displays and twin levers.
// Safe to run more than once.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* CONSOLE CONTROLS */';
if (s.includes(MARK)) { console.log('console-controls: already applied'); process.exit(0); }
const fail = (m) => { console.error('console-controls: ' + m); process.exit(1); };
if (!s.includes('/* HUD TABS */')) fail('run hud-tabs.mjs first');
const must = (from, to) => { const n = s.split(from).length - 1; if (n !== 1) fail(`expected 1 match, found ${n}: ${from.slice(0, 70)}`); s = s.replace(from, to); };

/* ---------- 1. Markup: the console, and an option button to switch controls ---------- */
const markup = `
  <section class="console" id="console" hidden aria-label="Helm console">
    <button type="button" class="cn-tab" id="cnTab" aria-expanded="true"><span>Helm console</span><b id="cnTabVal"></b></button>
    <div class="cn-face">
      <div class="cn-eng" id="cnEng" role="slider" aria-label="Engine order" aria-valuemin="0" aria-valuemax="8">
        <div class="cn-cap">Engine</div>
        <div class="cn-slot"><div class="cn-ticks" id="cnTicks"></div><div class="cn-handle" id="cnLever"><i></i></div></div>
      </div>
      <div class="cn-mid">
        <div class="cn-lcds">
          <div class="lcd"><small>Speed kn</small><b id="cnSpd">0.0</b></div>
          <div class="lcd round"><small>Hdg</small><b id="cnHdg">000</b></div>
          <div class="lcd"><small>Rot °/m</small><b id="cnRot">0</b></div>
        </div>
        <div class="cn-ord" id="cnOrd">Stop</div>
        <div class="cn-rud"><span>P</span><div class="cn-rbar"><i id="cnRudA"></i><i id="cnRudC"></i></div><span>S</span></div>
        <div class="cn-stat"><span>Hull <b id="cnHull">100%</b></span><span>Fuel <b id="cnFuel">$0</b></span><span class="cn-spdw" id="cnSpdW" hidden>Speeding</span></div>
      </div>
      <div class="cn-keys">
        <div class="cn-krow"><small id="cnThrH">Bow thruster</small></div>
        <div class="cn-krow"><button type="button" class="ck" data-chold="bowL" id="cnBowL"><i></i>◀ Bow</button><button type="button" class="ck" data-chold="bowR" id="cnBowR"><i></i>Bow ▶</button></div>
        <div class="cn-krow"><small id="cnTugH">Tugs</small></div>
        <div class="cn-krow" id="cnTugRow"><button type="button" class="ck" data-chold="tugL"><i></i>◀ Tug</button><button type="button" class="ck" data-chold="tugR"><i></i>Tug ▶</button></div>
        <div class="cn-krow" id="cnLineRow" hidden><button type="button" class="ck" data-cact="fast" id="cnFast"><i></i>Make fast</button><button type="button" class="ck" data-cact="letgo" id="cnLetgo"><i></i>Let go</button></div>
        <div class="cn-krow"><button type="button" class="ck red" data-cact="horn"><i></i>Horn</button><button type="button" class="ck" data-cact="mid"><i></i>Midships</button></div>
      </div>
      <div class="cn-til" id="cnTil" role="slider" aria-label="Steering wheel" aria-valuemin="-35" aria-valuemax="35">
        <div class="cn-cap">Steering</div>
        <div class="cn-wheel hwheel" id="cnWheel"></div>
      </div>
    </div>
  </section>`;
must('<div class="hud-bottom" id="hudBottom">', markup.trimStart() + '\n  <div class="hud-bottom" id="hudBottom">');
must('<div><small>Rudder <span id="hRud" class="num">0°</span></small>', '<div class="rwrap"><div class="rcol"><small>Rudder <span id="hRud" class="num">0°</span></small>');
must('<span>stbd 35°</span></div></div>', '<span>stbd 35°</span></div></div><div class="hwheel" id="clWheel" role="slider" aria-label="Steering wheel" aria-valuemin="-35" aria-valuemax="35"></div></div>');
must('<button class="btn ghost" data-p="sound" id="pSound">Sound: on</button>',
     '<button class="btn ghost" data-p="sound" id="pSound">Sound: on</button>\n      <button class="btn ghost" data-p="ctrl" id="pCtrl">Controls: Classic</button>');
must('<button class="hb" data-act="photo">Hide HUD</button>',
     '<button class="hb" data-act="ctrl" id="ctrlBtn">Controls: Classic</button>\n      <button class="hb" data-act="photo">Hide HUD</button>');

/* ---------- 2. Styles ---------- */
const css = `
${MARK}
.console{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(6px + env(safe-area-inset-bottom,0px));width:min(920px,calc(100% - 2*max(10px,env(safe-area-inset-left,0px))));pointer-events:auto;
  border-radius:8px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.55);background:#14181b;font-family:var(--body);user-select:none;-webkit-user-select:none}
.cn-tab{display:flex;align-items:center;gap:10px;width:100%;height:24px;padding:0 12px;border:0;cursor:pointer;touch-action:manipulation;
  background:linear-gradient(180deg,#7a4a2a,#5a331b 55%,#4a2914);color:#f1dcc6;font:600 10px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,220,180,.25)}
.cn-tab b{margin-left:auto;font-family:var(--mono);font-weight:500;letter-spacing:0;color:#ffd08a}
.cn-tab::after{content:"";width:7px;height:7px;border-right:2px solid #ffd08a;border-bottom:2px solid #ffd08a;transform:translateY(-2px) rotate(45deg)}
.console.tuck .cn-face{display:none}.console.tuck .cn-tab::after{transform:translateY(2px) rotate(-135deg)}
.console.tuck{width:auto;min-width:300px}
.cn-face{display:grid;grid-template-columns:78px minmax(0,1.25fr) minmax(0,1fr) 150px;gap:10px;padding:10px 12px 12px;
  background:radial-gradient(120% 140% at 50% 0%,#20262b,#111417 70%);border-top:1px solid #000}
.cn-cap{font:600 9px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:#7f8c95;text-align:center;margin-bottom:6px}
/* engine lever */
.cn-eng{display:flex;flex-direction:column;touch-action:none;cursor:ns-resize}
.cn-slot{position:relative;flex:1;min-height:110px;margin:0 auto;width:62px;border-radius:6px;background:#0b0d0f;box-shadow:inset 0 2px 6px #000,0 0 0 1px #2c343a}
.cn-slot::before{content:"";position:absolute;left:50%;top:8px;bottom:8px;width:8px;margin-left:-4px;border-radius:4px;background:#000;box-shadow:inset 0 1px 3px #000}
.cn-ticks{position:absolute;inset:8px 0}
.cn-ticks i{position:absolute;left:6px;right:6px;height:2px;margin-top:-1px;border-radius:1px;background:#3a4349}
.cn-ticks i.a{background:#2b9a5a}.cn-ticks i.s{background:#d9dde0;height:3px}.cn-ticks i.r{background:#b8382e}
.cn-handle{position:absolute;left:50%;top:50%;width:44px;height:22px;margin:-11px 0 0 -22px;border-radius:7px;transition:top .12s;
  background:linear-gradient(180deg,#3d454b,#15191c);box-shadow:0 3px 6px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.18)}
.cn-handle i{position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff7a6a,#c8231b 60%,#7c120d);box-shadow:0 0 6px rgba(255,60,40,.5)}
.cn-eng.drag .cn-handle{transition:none}
/* displays */
.cn-mid{display:flex;flex-direction:column;gap:6px;min-width:0}
.cn-lcds{display:grid;grid-template-columns:1fr 64px 1fr;gap:6px;align-items:center}
.lcd{border-radius:4px;padding:4px 6px 3px;background:linear-gradient(180deg,#a9b9a0,#8fa287);box-shadow:inset 0 1px 4px rgba(0,0,0,.45),0 0 0 2px #262c30,0 0 0 3px #3a4248;color:#18221a;text-align:right;min-width:0}
.lcd small{display:block;text-align:left;font:700 8px/1 var(--body);letter-spacing:.1em;text-transform:uppercase;color:#2e4232}
.lcd b{display:block;font:500 20px/1.05 var(--mono);font-variant-numeric:tabular-nums;white-space:nowrap}
.lcd.round{width:64px;height:64px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0;text-align:center;box-shadow:inset 0 1px 6px rgba(0,0,0,.5),0 0 0 3px #1b2024,0 0 0 5px #3a4248}
.lcd.round small{text-align:center}.lcd.round b{font-size:21px}
.cn-ord{text-align:center;font:600 12px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:#ffd08a;padding:5px 6px;border-radius:3px;background:#0b0d0f;box-shadow:inset 0 1px 3px #000}
.cn-ord.ah{color:#7fe0a3}.cn-ord.as{color:#ff8a7a}
.cn-rud{display:flex;align-items:center;gap:6px;font:600 9px/1 var(--mono)}
.cn-rud span:first-child{color:#ff6b5e}.cn-rud span:last-child{color:#5fd68a}
.cn-rbar{position:relative;flex:1;height:10px;border-radius:5px;background:linear-gradient(90deg,#5a1d19,#1b2024 48%,#1b2024 52%,#1b4a2c);box-shadow:inset 0 1px 3px #000}
.cn-rbar i{position:absolute;top:-3px;width:3px;height:16px;margin-left:-1.5px;border-radius:2px;left:50%}
#cnRudA{background:#f3a73b;box-shadow:0 0 6px #f3a73b}#cnRudC{background:#e8edf0;opacity:.55;width:2px}
.cn-stat{display:flex;gap:10px;font-size:10px;color:#8b98a1;flex-wrap:wrap}.cn-stat b{font-family:var(--mono);font-weight:500;color:#dfe6ea}
.cn-spdw{color:#ff8a7a;font-weight:700}
/* keypad */
.cn-keys{display:flex;flex-direction:column;gap:4px;min-width:0}
.cn-krow{display:flex;gap:5px}.cn-krow small{font:600 8px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:#7f8c95;margin-top:2px}
.ck{position:relative;flex:1;min-width:0;min-height:30px;padding:4px 6px 4px 14px;border-radius:3px;border:1px solid #000;cursor:pointer;touch-action:none;
  background:linear-gradient(180deg,#2c3337,#1a1f22);color:#e9eef1;font:600 11px/1.1 var(--body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 2px 0 #050607}
.ck i{position:absolute;left:5px;top:50%;width:5px;height:5px;margin-top:-2.5px;border-radius:50%;background:#3d474d}
.ck.on,.ck:active{background:linear-gradient(180deg,#1a1f22,#2a3135);transform:translateY(1px);box-shadow:inset 0 1px 3px #000}
.ck.on i,.ck:active i{background:#ffb347;box-shadow:0 0 6px #ffb347}
.ck.red i{background:#8a2a22}.ck.red:active i{background:#ff5a4a;box-shadow:0 0 6px #ff5a4a}
.ck:disabled{opacity:.4}
/* steering tiller */
.cn-til{display:flex;flex-direction:column;align-items:center;justify-content:center}
.hwheel{flex:none;width:124px;height:124px;touch-action:none;cursor:grab;-webkit-tap-highlight-color:transparent}
.hwheel.drag{cursor:grabbing}
.hwheel svg{width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(0 3px 4px rgba(0,0,0,.6))}
.wrot{transform-origin:0 0}
.wsp{stroke:#5b351d;stroke-width:4;stroke-linecap:round}
.wh{stroke:#7a4a2a;stroke-width:6.5;stroke-linecap:round}.wh.king{stroke:#e0aa45}
.wrim{fill:none;stroke:#5e381f;stroke-width:7.5}.wrim2{fill:none;stroke:#b07548;stroke-width:1.6;opacity:.85}
.whub{fill:#c9963a;stroke:#6e4c17;stroke-width:1.5}.whub2{fill:#3a2a12}
.wmark{fill:#e0aa45}
.rwrap{display:flex;gap:12px;align-items:center}.rcol{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.rwrap .hwheel{width:86px;height:86px}
#rudder{display:none}
/* console mode: hide the classic panels, options move to a side column */
body.cn-on .hud-bottom .tele,body.cn-on .hud-bottom .gauges,body.cn-on .hud-bottom .thr{display:none!important}
body.cn-on .util{position:fixed;left:max(8px,env(safe-area-inset-left,0px));top:calc(96px + env(safe-area-inset-top,0px));display:flex;flex-direction:column;gap:4px;padding:5px;width:104px}
body.cn-on .util .hb{min-height:32px;font-size:11px;padding:4px 6px}
body.photo .console{display:none}
@media (orientation:landscape) and (max-height:520px){
  .console{bottom:calc(4px + env(safe-area-inset-bottom,0px));left:calc(max(8px,env(safe-area-inset-left,0px)) + 96px);right:max(8px,env(safe-area-inset-right,0px));width:auto;transform:none}
  .console.tuck{right:auto}
  .cn-tab{height:20px}
  .cn-face{grid-template-columns:58px minmax(0,1.3fr) minmax(0,1fr) 112px;gap:8px;padding:6px 10px 7px}
  .cn-cap,.cn-krow:has(small),.cn-stat{display:none}
  .cn-slot{min-height:92px;width:50px}
  body:not(.cn-on) #ctrlBtn{display:none}
  .cn-wheel{width:96px;height:96px}
  .rwrap{gap:8px}.rwrap .hwheel{width:62px;height:62px}
  .ck{min-height:28px}
  .lcd b{font-size:16px}.lcd.round{width:52px;height:52px}.lcd.round b{font-size:17px}.cn-lcds{grid-template-columns:1fr 52px 1fr}
  .cn-mid{gap:4px}.cn-ord{font-size:10px;padding:3px}
  .ck{font-size:10px}
  body.cn-on .util{width:88px;top:calc(88px + env(safe-area-inset-top,0px))}
}
`;
must('</style>\n\n<canvas id="gl"', css + '</style>\n\n<canvas id="gl"');

/* ---------- 3. Wheelhouse view restyle (wood posts, white window frames, hanging displays, twin levers) ---------- */
must('const mI=new THREE.MeshLambertMaterial({color:0x2b3237})', 'const mI=new THREE.MeshLambertMaterial({color:0x5a3721})');
must('const panel=add(cw,0.08,1.0,mI,', 'const panel=add(cw,0.08,1.0,mP,');
must('for(let k=0;k<=nM;k++)add(0.13,yC-yF,0.2,mP,', 'for(let k=0;k<=nM;k++)add(0.26,yC-yF,0.24,mI,');
must('  const ov=add(ovW,ovH,0.4,mP,0,yC-ovH*0.6,ovZ);ov.rotation.x=0.35;\n  const ovS=new THREE.Mesh(new THREE.PlaneGeometry(ovW*0.95,ovH*0.85),new THREE.MeshBasicMaterial({map:ovTex}));ovS.position.set(0,yC-ovH*0.7,ovZ+0.21);ovS.rotation.x=0.35;g.add(ovS);',
`  {const mFr=new THREE.MeshLambertMaterial({color:0xe9ecea}),pw=W/nM,fy0=yF+1.08,fy1=yC-0.42,fh=fy1-fy0,fz=zF+0.16,t=0.06;
    for(let k=0;k<nM;k++){const cx=-W/2+(k+0.5)*pw,iw=pw-0.34;add(iw,t,0.05,mFr,cx,fy0+t/2,fz);add(iw,t,0.05,mFr,cx,fy1-t/2,fz);add(t,fh,0.05,mFr,cx-iw/2+t/2,(fy0+fy1)/2,fz);add(t,fh,0.05,mFr,cx+iw/2-t/2,(fy0+fy1)/2,fz);}}
  const nOv=narrow?2:3,ow=Math.min(1.1,ovW/nOv*0.72),oh=ow*0.62;
  for(let k=0;k<nOv;k++){const ox=(k-(nOv-1)/2)*(ovW/nOv)*(narrow?1.1:1.15),d=new THREE.Group();d.position.set(ox,yC-0.2-oh/2,ovZ);d.rotation.x=0.32;g.add(d);
    add(0.05,0.22,0.05,greyMat,ox,yC-0.09,ovZ);
    const bx=new THREE.Mesh(new THREE.BoxGeometry(ow,oh,0.22),mP);d.add(bx);
    const sc=new THREE.Mesh(new THREE.PlaneGeometry(ow*0.7,oh*0.68),new THREE.MeshBasicMaterial({map:ovTex,toneMapped:false}));sc.position.set(-ow*0.07,0.02,0.115);d.add(sc);
    for(let j=0;j<3;j++){const kb=new THREE.Mesh(new THREE.BoxGeometry(ow*0.08,oh*0.12,0.03),greyMat);kb.position.set(ow*0.38,oh*(0.22-j*0.2),0.12);d.add(kb);}}`);
must('knob.position.y=0.5;lever.add(knob);',
     'knob.position.y=0.5;lever.add(knob);{const l2=lv.clone(),k2=knob.clone();l2.position.x=k2.position.x=-0.2;lever.add(l2,k2);}');

/* ---------- 4. Behaviour, inside the game script ---------- */
must("else if(a==='photo')togglePhoto();", "else if(a==='photo')togglePhoto();\n  else if(a==='ctrl')setCtrl(!ctrlConsole);");
const glue = `
/* ---- helm console (touch controls) ---- */
let ctrlConsole=false;
const CN_KEY='harborline-controls';
function setCtrl(on,quiet){ctrlConsole=!!on;try{localStorage.setItem(CN_KEY,on?'console':'classic')}catch(e){}
  document.body.classList.toggle('cn-on',ctrlConsole);$('#console').hidden=!ctrlConsole;$('#ctrlBtn').textContent=$('#pCtrl').textContent='Controls: '+(ctrlConsole?'Console':'Classic');
  if(!quiet)toast(ctrlConsole?'Helm console on. Drag the red-topped levers: turn the wheel on the right to steer.':'Classic controls.');}
(function(){
  let saved=null;try{saved=localStorage.getItem(CN_KEY)}catch(e){}
  const touch=matchMedia('(pointer:coarse)').matches;
  setCtrl(saved?saved==='console':touch,true);
  const N=ORDERS.length,eng=$('#cnEng'),slot=eng.querySelector('.cn-slot'),lev=$('#cnLever'),til=$('#cnTil');
  $('#cnTicks').innerHTML=ORDERS.map((o,i)=>'<i class="'+(o.v>0?'a':o.v<0?'r':'s')+'" style="top:'+((N-1-i)/(N-1)*100)+'%"></i>').join('');
  const ordAt=y=>{const r=slot.getBoundingClientRect(),f=clamp((y-r.top-8)/(r.height-16),0,1);return Math.round((1-f)*(N-1));};
  const drag=(el,move)=>{el.addEventListener('pointerdown',e=>{if(!P||mode!=='helm')return;e.preventDefault();el.classList.add('drag');try{el.setPointerCapture(e.pointerId)}catch(_){}move(e);
      const mv=ev=>move(ev),up=()=>{el.classList.remove('drag');el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);};
      el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);});};
  drag(eng,e=>setOrd(ordAt(e.clientY)));
  const setRud=v=>{P.rudCmd=clamp(Math.round(v),-35,35);$('#rudder').value=P.rudCmd;};
  /* steering wheel: turn it like a real wheel, 3/4 turn each way = hard over (35°); double-tap to centre */
  const WMAX=270,wheels=[];
  const wheelSVG=()=>{let sp='';for(let k=0;k<8;k++)sp+='<g transform="rotate('+k*45+')"><line x1="0" y1="-9" x2="0" y2="-37" class="wsp"/><line x1="0" y1="-42" x2="0" y2="-50" class="wh'+(k?'':' king')+'"/></g>';
    return '<svg viewBox="-53 -53 106 106" aria-hidden="true"><g class="wrot">'+sp+'<circle r="38.5" class="wrim"/><circle r="38.5" class="wrim2"/><rect x="-2.5" y="-42.3" width="5" height="7.6" rx="1" class="wmark"/><circle r="10" class="whub"/><circle r="4.5" class="whub2"/></g></svg>';};
  const bindWheel=el=>{if(!el)return;el.innerHTML=wheelSVG();const rot=el.querySelector('.wrot');let drg=false,last=0,acc=0,tap=0;
    const pol=e=>{const r=el.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);return {a:Math.atan2(dx,-dy)*180/Math.PI,d:Math.hypot(dx,dy)/r.width};};
    el.addEventListener('pointerdown',e=>{if(!P||mode!=='helm')return;e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(_){}
      drg=true;el.classList.add('drag');last=pol(e).a;acc=P.rudCmd/35*WMAX;
      const t=performance.now();if(t-tap<300){setRud(0);acc=0;rot.style.transform='rotate(0deg)';}tap=t;});
    el.addEventListener('pointermove',e=>{if(!drg||!P)return;const q=pol(e);if(q.d<0.12)return;let d=q.a-last;if(d>180)d-=360;if(d<-180)d+=360;last=q.a;
      acc=clamp(acc+d,-WMAX,WMAX);setRud(acc/WMAX*35);rot.style.transform='rotate('+acc+'deg)';el.setAttribute('aria-valuenow',Math.round(P.rudCmd));});
    const up=()=>{drg=false;el.classList.remove('drag');};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
    wheels.push({rot,busy:()=>drg});};
  bindWheel($('#cnWheel'));bindWheel($('#clWheel'));
  setInterval(()=>{if(!P)return;for(const w of wheels)if(!w.busy())w.rot.style.transform='rotate('+(P.rudCmd/35*WMAX)+'deg)';},60);
  document.querySelectorAll('[data-chold]').forEach(b=>{const k=b.dataset.chold;
    const on=e=>{e.preventDefault();hold[k]=1;b.classList.add('on');try{b.setPointerCapture(e.pointerId)}catch(_){}};
    const off=()=>{hold[k]=0;b.classList.remove('on');};
    b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);b.addEventListener('contextmenu',e=>e.preventDefault());});
  $('#pCtrl').addEventListener('click',e=>{e.preventDefault();setCtrl(!ctrlConsole);});
  $('#console').addEventListener('click',e=>{const b=e.target.closest('[data-cact]');if(!b||!P)return;const a=b.dataset.cact;
    if(a==='mid')setRud(0);else act(a);});
  let tk={};try{tk=JSON.parse(localStorage.getItem('harborline-hud-tucked')||'{}')||{}}catch(e){}
  const tuck=on=>{$('#console').classList.toggle('tuck',on);$('#cnTab').setAttribute('aria-expanded',String(!on));};tuck(!!tk.console);
  $('#cnTab').addEventListener('click',e=>{e.preventDefault();const on=!$('#console').classList.contains('tuck');tuck(on);
    try{const t=JSON.parse(localStorage.getItem('harborline-hud-tucked')||'{}')||{};t.console=on;localStorage.setItem('harborline-hud-tucked',JSON.stringify(t))}catch(_){}});
  const tx=id=>{const e=document.getElementById(id);return e?e.textContent:''};
  setInterval(()=>{if(!ctrlConsole||!P)return;
    lev.style.top=(8+(N-1-P.ord)/(N-1)*(slot.clientHeight-16))+'px';eng.setAttribute('aria-valuenow',P.ord);
    const o=ORDERS[P.ord],od=$('#cnOrd');od.textContent=o.n;od.className='cn-ord'+(o.v>0?' ah':o.v<0?' as':'');
    $('#cnSpd').textContent=tx('hSpd');$('#cnHdg').textContent=tx('hHdg');$('#cnRot').textContent=tx('hRot');
    $('#cnHull').textContent=tx('hHull');$('#cnFuel').textContent=tx('hFuel');$('#cnSpdW').hidden=$('#hSpeedChip').hidden;
    $('#cnRudA').style.left=(50+P.rud/35*50)+'%';$('#cnRudC').style.left=(50+P.rudCmd/35*50)+'%';
    til.setAttribute('aria-valuenow',Math.round(P.rudCmd));
    const th=tx('thrH'),zd=th.startsWith('Z');$('#cnThrH').textContent=th;$('#cnBowL').lastChild.textContent=zd?'◀ Walk':'◀ Bow';$('#cnBowR').lastChild.textContent=zd?'Walk ▶':'Bow ▶';$('#cnTugH').textContent=tx('tugH');
    $('#cnTugRow').hidden=$('#tugRow').hidden;$('#cnLineRow').hidden=$('#lineRow').hidden;
    $('#cnFast').disabled=$('#fastBtn').disabled;$('#cnLetgo').disabled=$('#letgoBtn').disabled;
    $('#cnTabVal').textContent=$('#console').classList.contains('tuck')?o.n+' · '+tx('hSpd')+' kn · rudder '+Math.round(P.rudCmd)+'°':'';
  },80);
})();
`;
const end = s.lastIndexOf('</script>');
const close = s.lastIndexOf('})();', end);
if (end < 0 || close < 0 || s.slice(close + 5, end).trim() !== '') fail('end of game script not found');
s = s.slice(0, close) + glue + s.slice(close);

writeFileSync(FILE, s);
console.log('console-controls: helm console and wheelhouse restyle added');
