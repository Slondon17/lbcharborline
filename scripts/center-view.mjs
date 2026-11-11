// Keeps the ship centred in the part of the screen you can actually see:
// the camera aims at the middle of the open area (above the console / bottom panels,
// right of the Options column) instead of the middle of the whole screen, and pulls back
// a little when the panels take up a lot of room. Follows panels as they tuck and open.
// Chase and overhead cameras only; the wheelhouse view is left as it is. Safe to run more than once.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'www/index.html';
let s = readFileSync(FILE, 'utf8');
const MARK = '/* CENTER VIEW */';
if (s.includes(MARK)) { console.log('center-view: already applied'); process.exit(0); }
const fail = (m) => { console.error('center-view: ' + m); process.exit(1); };
const must = (from, to) => { const n = s.split(from).length - 1; if (n !== 1) fail(`expected 1 match, found ${n}: ${from.slice(0, 70)}`); s = s.replace(from, to); };

must('function updateCamera(dt,t){',
`${MARK}
const vo={x:0,y:0,tx:0,ty:0,k:1,tk:1,n:0};
function measureFree(){const W=innerWidth,H=innerHeight;vo.tx=0;vo.ty=0;vo.tk=1;
  if($('#hud').hidden||document.body.classList.contains('photo'))return;
  let left=0,bottom=H;
  const els=[...document.querySelectorAll('#hudBottom > section')];const cn=document.getElementById('console');if(cn&&!cn.hidden)els.push(cn);
  for(const e of els){const r=e.getBoundingClientRect();if(r.width<2||r.height<2)continue;
    if(r.left<W*0.2&&r.right<W*0.3&&r.top<H*0.45)left=Math.max(left,r.right);   // side column (Options)
    else if(r.bottom>H*0.6)bottom=Math.min(bottom,r.top);}                        // bottom panels / console
  bottom=Math.max(bottom,H*0.45);
  const cx=(left+W)/2,cy=bottom/2;vo.tx=W/2-cx;vo.ty=H/2-cy;
  vo.tk=clamp(Math.sqrt(H/bottom),1,1.35);}
function applyViewOffset(dt){
  if((vo.n-=dt)<=0){vo.n=0.25;measureFree();}
  const on=cam.mode!==1&&mode==='helm',f=1-Math.exp(-dt*5);
  vo.x+=((on?vo.tx:0)-vo.x)*f;vo.y+=((on?vo.ty:0)-vo.y)*f;vo.k+=((on?vo.tk:1)-vo.k)*f;
  if(Math.abs(vo.x)+Math.abs(vo.y)<0.5){if(camera.view&&camera.view.enabled)camera.clearViewOffset();}
  else camera.setViewOffset(innerWidth,innerHeight,vo.x,vo.y,innerWidth,innerHeight);}
function updateCamera(dt,t){applyViewOffset(dt);`);

// pull the chase and overhead cameras back a touch when the visible area is small
must('const D=(c.L*1.25+Math.min(60,c.L*0.8))*cam.dist,a=P.h+cam.yaw;', 'const D=(c.L*1.25+Math.min(60,c.L*0.8))*cam.dist*vo.k,a=P.h+cam.yaw;');
must('*1.8*cam.dist,300,4200)', '*1.8*cam.dist*vo.k,300,4200)');
must('else{const D=c.L*4*cam.dist;', 'else{const D=c.L*4*cam.dist*vo.k;');

writeFileSync(FILE, s);
console.log('center-view: ship stays centred in the open part of the screen');
