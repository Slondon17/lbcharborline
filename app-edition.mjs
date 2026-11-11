// Turns the Harborline game (any edition) into the app edition:
// free demo until the player buys the "full_game" unlock in Google Play, then the whole fleet.
// Runs on every Codemagic build, so you can drop a new game build into www/index.html at any time.
// Safe to run more than once.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* APP EDITION: in-app unlock */';
if (s.includes(MARK)) { console.log('app-edition: already applied'); process.exit(0); }

const fail = (m) => { console.error('app-edition: ' + m); process.exit(1); };
const must = (from, to) => { const n = s.split(from).length - 1; if (n !== 1) fail(`expected 1 match, found ${n}: ${String(from).slice(0, 70)}`); s = s.replace(from, to); };
const maybe = (from, to) => { if (s.includes(from)) s = s.replace(from, to); };

// 1. Edition decided by the purchase (cached on the device, confirmed with Google Play at start-up)
const ed = s.match(/const EDITION='(demo|standard|complete)';[^\n]*/);
if (!ed) fail('EDITION line not found');
s = s.replace(ed[0], `${MARK}
const UNLOCK_KEY='harborline-full-unlock';
const EDITION=(()=>{try{return localStorage.getItem(UNLOCK_KEY)==='1'?'complete':'demo'}catch(e){return 'demo'}})();
const APP_IAP=true;let IAP_PRICE='';`);

// 2. One tier: everything locked in the demo comes with the full game
must(/const lockLabel=k=>[^;]*;/, "const lockLabel=k=>'the full game';");

// 3. "Get the full game" buttons open Google Play's purchase screen instead of a web store
must(/const storeBtn=\(label,cls='btn'\)=>`[^`]*`;/,
  "const storeBtn=(label,cls='btn')=>`<button type=\"button\" class=\"${cls}\" data-iap=\"buy\">${label}${IAP_PRICE?' · '+IAP_PRICE:''}</button>`;");

// 4. Wording and web-only extras
maybe('Complete Fleet has all ${Object.keys(SHIPS).length} ships, from harbor tugs and electric ferries to the super-heavy fleet.',
      'One purchase unlocks all ${Object.keys(SHIPS).length} ships, from harbor tugs and electric ferries to the super-heavy fleet.');
maybe('ships</b> in Complete Fleet:', 'ships</b> in the full game:');
maybe('    ${codeBox()}\n', '');
s = s.split('<a class="btn ghost" href="${STORE_URL}#comments" target="_blank" rel="noopener">Tell us which ship you want next</a>').join('');
s = s.split('<div class="runend">${codeBox()}').join('<div class="runend">');
maybe("${!DEMO?(G.demoImported?", "${!DEMO&&!APP_IAP?(G.demoImported?");
maybe('else if(!DEMO&&!OWNER&&!G.voyages&&!G.demoImported)', 'else if(!DEMO&&!OWNER&&!APP_IAP&&!G.voyages&&!G.demoImported)');
maybe('Progress saves in this browser.', 'Progress saves on this device.');
// office banner: add "Restore purchase" next to the buy button
maybe("${storeBtn(EDITION==='demo'?'Get the full game':'Upgrade to Complete Fleet')}",
      "${storeBtn('Get the full game')}<button type=\"button\" class=\"btn ghost\" data-iap=\"restore\">Restore purchase</button>");
if (/href="\$\{STORE_URL\}/.test(s)) fail('a link to the web store is still in the game');

// 5. Purchase glue, at the end of the game script
const glue = `
/* ---- in-app purchase (app edition) ---- */
(function(){
  const S=()=>window.HLStore;
  const unlockNow=()=>{try{localStorage.setItem(UNLOCK_KEY,'1')}catch(e){}try{save()}catch(e){}
    toast('Full game unlocked! Loading the whole fleet…','good');setTimeout(()=>location.reload(),1400);};
  async function buy(){const st=S();if(!st||!st.native){toast('Purchases work in the app from Google Play.');return;}
    toast('Opening Google Play…');
    try{const r=await st.buy();
      if(r==='owned')unlockNow();
      else if(r==='pending')toast('Payment pending. The full game unlocks as soon as Google Play confirms it.');
      else toast('The purchase was not completed.');}
    catch(e){const m=String((e&&e.message)||e||'').toLowerCase();
      toast(m.includes('cancel')?'Purchase cancelled.':'Google Play could not complete the purchase. Please try again.');}}
  async function restore(){const st=S();if(!st||!st.native){toast('Restore works in the app from Google Play.');return;}
    toast('Checking Google Play…');const o=await st.restore();
    if(o===true){if(EDITION==='complete')toast('The full game is already unlocked.','good');else unlockNow();}
    else if(o===false)toast('No full-game purchase found for this Google account.');
    else toast('Could not reach Google Play. Check your connection and try again.');}
  document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-iap]');if(!b)return;
    e.preventDefault();e.stopPropagation();(b.dataset.iap==='restore'?restore:buy)();},true);
  window.addEventListener('load',async()=>{const st=S();if(!st||!st.native)return;
    if(EDITION==='demo'){const o=await st.owned();if(o===true){unlockNow();return;}}
    const p=await st.price();if(p){IAP_PRICE=p;document.querySelectorAll('[data-iap="buy"]').forEach(b=>{if(!b.textContent.includes(p))b.textContent+=' · '+p;});}});
})();
`;
// the game runs inside one (()=>{ ... })(); block: the glue goes just before it closes
const end = s.lastIndexOf('</script>');
const close = s.lastIndexOf('})();', end);
if (end < 0 || close < 0 || s.slice(close + 5, end).trim() !== '') fail('end of game script not found');
s = s.slice(0, close) + glue + s.slice(close);

// 6. Load the purchase bridge before the game
must('<script src="lib/three.min.js"></script>', '<script src="store.js"></script>\n<script src="lib/three.min.js"></script>');

writeFileSync(FILE, s);
console.log('app-edition: applied (demo until "full_game" is purchased)');
