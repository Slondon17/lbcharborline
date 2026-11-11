// Turns the bridge panels (engine order, rudder, thrusters/tugs, options) into tabs
// that tuck away with one tap, to free up the screen. Safe to run more than once.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* HUD TABS */';
if (s.includes(MARK)) { console.log('hud-tabs: already applied'); process.exit(0); }
const fail = (m) => { console.error('hud-tabs: ' + m); process.exit(1); };
const must = (from, to) => { const n = s.split(from).length - 1; if (n !== 1) fail(`expected 1 match, found ${n}: ${from.slice(0, 70)}`); s = s.replace(from, to); };
const tab = (k, label) => `<button type="button" class="tucktab" data-tuck="${k}" aria-expanded="true"><span>${label}</span></button>`;

// 1. A tab at the top of each panel
must('<section class="panel inst tele"><h3>Engine order</h3>',
     `<section class="panel inst tele" data-panel="engine">${tab('engine', 'Engine')}<h3>Engine order</h3>`);
must('<section class="panel inst gauges">',
     `<section class="panel inst gauges" data-panel="rudder">${tab('rudder', 'Rudder')}`);
must('<section class="panel inst"><h3 id="thrH">',
     `<section class="panel inst thr" data-panel="thrust">${tab('thrust', 'Thrusters · tugs')}<h3 id="thrH">`);
must('<section class="panel inst util">',
     `<section class="panel inst util" data-panel="options">${tab('options', 'Options')}`);

// 2. Styles
const css = `
${MARK}
.tucktab{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:26px;margin:-2px 0 0;padding:2px 2px 4px;background:none;border:0;border-bottom:1px solid var(--line);color:var(--muted);font:600 10px/1.1 var(--body);letter-spacing:.12em;text-transform:uppercase;cursor:pointer;touch-action:manipulation}
.tucktab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tucktab::after{content:"";flex:none;width:7px;height:7px;border-right:2px solid var(--amber);border-bottom:2px solid var(--amber);transform:translateY(-2px) rotate(45deg)}
.tele>h3{display:none}
.inst.tuck>*:not(.tucktab){display:none!important}
.inst.tuck{display:flex!important;width:auto!important;min-width:0!important;max-width:none!important;flex:0 0 auto!important;padding:4px 10px!important;gap:0!important;opacity:.92}
.inst.tuck .tucktab{border:0;padding:4px 0;min-height:30px;color:var(--fg);font-size:11px}
.inst.tuck .tucktab::after{transform:translateY(2px) rotate(-135deg)}
.inst.tuck .tucktab b{color:var(--amber);font-family:var(--mono);font-weight:500;letter-spacing:0;margin-left:6px}
@media (orientation:landscape) and (max-height:520px){
  .tucktab{min-height:22px;font-size:9px;padding:0 0 3px}
  .inst.tuck .tucktab{min-height:28px;font-size:10px}
  .util.tuck{width:auto!important}
}
`;
must('</style>\n\n<canvas id="gl"', css + '</style>\n\n<canvas id="gl"');

// 3. Behaviour: tap a tab to tuck or open its panel; remembered on the device.
//    A tucked panel's tab still shows the key number (engine order, rudder angle and speed).
const js = `<script>
(()=>{
  const KEY='harborline-hud-tucked';
  let t={};try{t=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
  const panels=[...document.querySelectorAll('#hud [data-panel]')];
  const set=(p,on)=>{p.classList.toggle('tuck',on);const b=p.querySelector('.tucktab');if(b)b.setAttribute('aria-expanded',String(!on));};
  panels.forEach(p=>{set(p,!!t[p.dataset.panel]);
    p.querySelector('.tucktab').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();
      const on=!p.classList.contains('tuck');set(p,on);t[p.dataset.panel]=on;
      try{localStorage.setItem(KEY,JSON.stringify(t))}catch(e){}live();});});
  const txt=s=>{const e=document.querySelector(s);return e?e.textContent.trim():''};
  const label={engine:()=>{const li=document.querySelector('#teleList li.on');return li?li.textContent.trim():''},
    rudder:()=>txt('#hRud')+' · '+txt('#hSpd')+' kn'};
  function live(){panels.forEach(p=>{const f=label[p.dataset.panel];const sp=p.querySelector('.tucktab span');if(!sp)return;
    const base=sp.dataset.base||(sp.dataset.base=sp.textContent);
    if(f&&p.classList.contains('tuck')){const v=f();sp.innerHTML=base+(v?'<b></b>':'');if(v)sp.querySelector('b').textContent=v;}
    else if(sp.textContent!==base)sp.textContent=base;});}
  setInterval(live,250);
})();
</script>
`;
must('<script src="store.js"></script>\n<script src="lib/three.min.js">', js + '<script src="store.js"></script>\n<script src="lib/three.min.js">');

writeFileSync(FILE, s);
console.log('hud-tabs: bridge panels can now be tucked away');
