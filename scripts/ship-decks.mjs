// Closes ship models that had gaps in the top deck, so you can no longer see down through them to the water.
//   Ro-Ro car carrier: grey steel weather deck across the top of the car decks.
//   Every lofted hull (container ships, tanker, bulk, LNG, livestock, heavy-lift, reefer, yacht, both heritage liners
//   and the rest that share the hull builder): a full-length steel deck sealing the top of the hull, just under the
//   existing deck plates, so the open bow and stern corners are closed.
// Safe to run more than once.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* SHIP DECKS */';
if (s.includes(MARK)) { console.log('ship-decks: already applied'); process.exit(0); }
const fail = (m) => { console.error('ship-decks: ' + m); process.exit(1); };
const must = (from, to) => { const n = s.split(from).length - 1; if (n !== 1) fail(`expected 1 match, found ${n}: ${from.slice(0, 70)}`); s = s.replace(from, to); };

const deckMat = '';

// Ro-Ro: weather deck, shaped to the hull outline
must('  mk(loftHull(s,H,D,{bulb:1,y0:9}),white,0,0,0);\n  const sideMat=new THREE.MeshLambertMaterial({map:roroSideTex(opts.name),transparent:true});',
     '  mk(loftHull(s,H,D,{bulb:1,y0:9}),white,0,0,0);\n' +
     '  {const dk=new THREE.ExtrudeGeometry(s,{depth:0.6,bevelEnabled:false,curveSegments:12});dk.rotateX(-Math.PI/2);dk.scale(0.994,1,0.996);dk.translate(0,deckY-0.6,0);mk(dk,buildRoro.dm||(buildRoro.dm=new THREE.MeshLambertMaterial({color:0x8e9498})),0,0,0);}\n' +
     '  const sideMat=new THREE.MeshLambertMaterial({map:roroSideTex(opts.name),transparent:true});');
must('function buildRoro(cfg,opts={}){', `${MARK}\n${deckMat}function buildRoro(cfg,opts={}){`);

// Full-length deck seal for lofted hulls
const seal = 'function hullSeal(mk,s,H,D){const {u0,u1}=planHalf(s),len=(u1-u0)*0.998,c=(u0+u1)/2;const m=hullSeal.m||(hullSeal.m=new THREE.MeshLambertMaterial({color:0x6d7270}));mk(deckFit(s,1e4,0.4,len,c,0.985),m,0,H-D-0.2,c,false);}\n';
must('function hullPair(mk,s,H,D,hullMat,o={}){', seal + 'function hullPair(mk,s,H,D,hullMat,o={}){');
must("  mk(loftHull(s,H,D,q),hullMat,0,0,0);const bg=loftHull(s,H,D,Object.assign({},q,{y1:0.9}));", "  mk(loftHull(s,H,D,q),hullMat,0,0,0);hullSeal(mk,s,H,D);const bg=loftHull(s,H,D,Object.assign({},q,{y1:0.9}));");
must("  mk(loftHull(s,H,D,{bulb:1}),hullMat,0,0,0);\n  const bg=loftHull(s,H,D,{bulb:1,y1:0.9});bg.scale(1.006,1,1.004);mk(bg,bootMat,0,0,0,false);bulbFor(mk,s,D,bootMat);\n  const deckY=H-D,bridgeLon=",
     "  mk(loftHull(s,H,D,{bulb:1}),hullMat,0,0,0);hullSeal(mk,s,H,D);\n  const bg=loftHull(s,H,D,{bulb:1,y1:0.9});bg.scale(1.006,1,1.004);mk(bg,bootMat,0,0,0,false);bulbFor(mk,s,D,bootMat);\n  const deckY=H-D,bridgeLon=");

writeFileSync(FILE, s);
console.log('ship-decks: Ro-Ro deck closed, all lofted hulls sealed');
