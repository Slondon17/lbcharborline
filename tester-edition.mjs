// TESTER BUILD ONLY. Unlocks the whole game with no purchase so closed-test testers can play everything.
// Codemagic runs this only in the "android-tester" workflow. Never upload a tester build to Production.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* TESTER BUILD: full game unlocked */';
if (s.includes(MARK)) { console.log('tester-edition: already applied'); process.exit(0); }

const ed = s.match(/const EDITION=\(\(\)=>\{try\{return localStorage[^\n]*/);
if (!ed) { console.error('tester-edition: EDITION line not found (run app-edition.mjs first)'); process.exit(1); }
s = s.replace(ed[0], `${MARK}\nconst EDITION='complete';`);

// A small "Tester build" badge in the office, so a tester build is never mistaken for the store version
const badge = `<script>addEventListener('load',()=>{const e=document.querySelector('.mast .eyebrow');if(e)e.textContent+=' · Tester build: full game unlocked';});</script>\n`;
s = s.replace('<script src="store.js"></script>\n<script src="lib/three.min.js">', badge + '<script src="store.js"></script>\n<script src="lib/three.min.js">');

writeFileSync(FILE, s);
console.log('tester-edition: full game unlocked for testers');
