// Ship colours: no more blue hulls that blend into the water and make ships look see-through.
//   Ro-Ro car carrier  blue  -> deep red (under the white upper decks)
//   Feeder             navy  -> burnt orange
//   Livestock carrier  teal  -> olive khaki
//   Heavy-lift ship    blue  -> heavy-lift yellow
//   Traffic ships' random hull colours: navy -> slate grey, indigo -> plum
// Funnels and superstructures keep their colours. Safe to run more than once.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* SHIP COLOURS */';
if (s.includes(MARK)) { console.log('ship-colors: already applied'); process.exit(0); }
const fail = (m) => { console.error('ship-colors: ' + m); process.exit(1); };
const swap = (from, to, n = 1) => { const c = s.split(from).length - 1; if (c !== n) fail(`expected ${n} match(es), found ${c}: ${from}`); s = s.split(from).join(to); };

swap("hull:0x24406b,note:'A floating multi-storey car park", "hull:0x8c2a24,note:'A floating multi-storey car park");
swap('hull:0x1d3b5a', 'hull:0xa8541f');
swap('hull:0x245a5a', 'hull:0x6b6a2e');
swap('hull:0x1f4e8a', 'hull:0xd8a21c');
swap('hull:hull??pick([0x2a2f36,0x5a1f22,0x1f3f5c,0x3d4a2f,0x2f2f6a])', 'hull:hull??pick([0x2a2f36,0x5a1f22,0x4a4f55,0x3d4a2f,0x6a2a4a])');
swap('hull:pick([0x2a2f36,0x5a1f22,0x1f3f5c,0x3d4a2f,0x2f2f6a])', 'hull:pick([0x2a2f36,0x5a1f22,0x4a4f55,0x3d4a2f,0x6a2a4a])');

const css = '</style>\n\n<canvas id="gl"';
if (s.split(css).length !== 2) fail('style anchor not found');
s = s.replace(css, `${MARK}\n${css}`);

writeFileSync(FILE, s);
console.log('ship-colors: blue hulls repainted (Ro-Ro, Feeder, Livestock, Heavy-lift, traffic)');
