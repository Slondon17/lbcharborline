// Fold tabs for the top of the screen: the mission card folds to just its weather/clock line,
// and the chart folds to a small "Chart" tab. Remembered on the device. Safe to run more than once.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* TOP TABS */';
if (s.includes(MARK)) { console.log('top-tabs: already applied'); process.exit(0); }
const fail = (m) => { console.error('top-tabs: ' + m); process.exit(1); };
const must = (from, to) => { const n = s.split(from).length - 1; if (n !== 1) fail(`expected 1 match, found ${n}: ${from.slice(0, 70)}`); s = s.replace(from, to); };

const chev = (k, label) => `<button type="button" class="foldtab" data-fold="${k}" aria-expanded="true" aria-label="${label}"><span>${k === 'chart' ? 'Chart' : ''}</span></button>`;
must('<div class="panel brief">\n      <div class="brief-row"><span class="chip" id="hWx">Calm</span><span id="hClock">00:00</span></div>',
     `<div class="panel brief" data-top="mission">\n      <div class="brief-row"><span class="chip" id="hWx">Calm</span><span id="hClock">00:00</span>${chev('mission', 'Fold the mission card')}</div>`);
must('<div class="panel mapbox"><canvas id="mini"',
     `<div class="panel mapbox" data-top="chart">${chev('chart', 'Fold the chart')}<canvas id="mini"`);

const css = `
${MARK}
.brief-row{align-items:center}
.foldtab{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:28px;height:24px;margin-left:8px;padding:0 6px;border:1px solid var(--line);border-radius:4px;background:rgba(0,0,0,.25);
  color:var(--muted);font:600 10px/1 var(--body);letter-spacing:.12em;text-transform:uppercase;cursor:pointer;touch-action:manipulation;pointer-events:auto;flex:none}
.foldtab::after{content:"";width:6px;height:6px;border-right:2px solid var(--amber);border-bottom:2px solid var(--amber);transform:translateY(2px) rotate(-135deg)}
.foldtab span:empty{display:none}
.mapbox{position:relative}
.mapbox>.foldtab{position:absolute;right:8px;top:8px;margin:0;z-index:2;background:rgba(8,18,26,.75)}
.mapbox>.foldtab span{display:none}
[data-top].fold .foldtab::after{transform:translateY(-2px) rotate(45deg)}
.brief.fold #hBerth,.brief.fold #hNav{display:none}
.brief.fold{padding-block:6px}
.mapbox.fold{padding:0;border:0;background:none;box-shadow:none}
.mapbox.fold #mini{display:none}
.mapbox.fold>.foldtab{position:static;height:30px;padding:0 10px;background:var(--panel,rgba(8,18,26,.85));color:var(--fg)}
.mapbox.fold>.foldtab span{display:inline}
`;
must('</style>\n\n<canvas id="gl"', css + '</style>\n\n<canvas id="gl"');

const js = `<script>
(()=>{const KEY='harborline-hud-tucked';let t={};try{t=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
  document.querySelectorAll('#hud [data-top]').forEach(p=>{const k=p.dataset.top,b=p.querySelector('.foldtab');
    const set=on=>{p.classList.toggle('fold',on);b.setAttribute('aria-expanded',String(!on));};set(!!t[k]);
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const on=!p.classList.contains('fold');set(on);
      try{const c=JSON.parse(localStorage.getItem(KEY)||'{}')||{};c[k]=on;localStorage.setItem(KEY,JSON.stringify(c))}catch(_){}});});
})();
</script>
`;
const anchor = '<script src="lib/three.min.js">';
if (s.split(anchor).length !== 2) fail('three.js script tag not found');
s = s.replace(anchor, js + anchor);

writeFileSync(FILE, s);
console.log('top-tabs: mission card and chart can fold');
