// TESTER BUILD ONLY. Unlocks the whole game with no purchase, and turns on the owner's copy (all ships in the fleet, all contracts open), so closed-test testers can play everything.
// Codemagic runs this only in the "android-tester" workflow. Never upload a tester build to Production.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* TESTER BUILD: full game unlocked */';
if (s.includes(MARK)) { console.log('tester-edition: already applied'); process.exit(0); }

const ed = s.match(/const EDITION=\(\(\)=>\{try\{return localStorage[^\n]*/);
if (!ed) { console.error('tester-edition: EDITION line not found (run app-edition.mjs first)'); process.exit(1); }
s = s.replace(ed[0], `${MARK}\nconst EDITION='complete';`);

// Owner's copy for testers: every ship free and already in the fleet, every contract open (no reputation needed), both ports open
const sw = (from, to) => { if (s.split(from).length !== 2) { console.error('tester-edition: not found: ' + from); process.exit(1); } s = s.replace(from, to); };
sw('const OWNER=false;', 'const OWNER=true;');
sw('if(G.rep<c.repReq)why=', 'if(!OWNER&&G.rep<c.repReq)why=');

// A small "Tester build" badge in the office, so a tester build is never mistaken for the store version
const badge = `<script>addEventListener('load',()=>{const e=document.querySelector('.mast .eyebrow');if(e)e.textContent+=' · Tester build: every ship and mission open';});</script>\n`;
const anchor = '<script src="lib/three.min.js">';
if (s.split(anchor).length !== 2) { console.error('tester-edition: three.js script tag not found'); process.exit(1); }
s = s.replace(anchor, badge + anchor);

writeFileSync(FILE, s);
console.log('tester-edition: full game unlocked for testers');
