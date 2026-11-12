// Google Play "for your next release" fixes. Run after `npx cap sync android`. Safe to run more than once.
//  1. Edge-to-edge: call EdgeToEdge.enable() in MainActivity so the app draws edge-to-edge on every Android version
//     (the game already hides the system bars and keeps its HUD inside the safe areas).
//  2. Large screens: mark the app as a game (android:appCategory="game"). From Android 16, large screens ignore
//     orientation locks for ordinary apps, but games are exempt, so Harborline keeps its landscape lock.
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const fail = (m) => { console.error('play-fixes: ' + m); process.exit(1); };

/* 1. Manifest: app category = game */
const manifest = 'android/app/src/main/AndroidManifest.xml';
if (!existsSync(manifest)) fail('AndroidManifest.xml not found (run npx cap add android first)');
let xml = readFileSync(manifest, 'utf8');
if (!xml.includes('android:appCategory')) {
  if (!/<application\b/.test(xml)) fail('<application> tag not found');
  xml = xml.replace(/<application\b/, '<application android:appCategory="game"');
  writeFileSync(manifest, xml);
  console.log('play-fixes: marked as a game (appCategory="game")');
} else console.log('play-fixes: app category already set');

/* 2. MainActivity: EdgeToEdge.enable(this) */
const find = (dir) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { const r = find(p); if (r) return r; }
    else if (n === 'MainActivity.java' || n === 'MainActivity.kt') return p;
  }
  return null;
};
const act = find('android/app/src/main/java');
if (!act) fail('MainActivity not found');
let src = readFileSync(act, 'utf8');
if (src.includes('EdgeToEdge.enable')) console.log('play-fixes: edge-to-edge already enabled');
else if (/onCreate\s*\(/.test(src)) console.log('play-fixes: MainActivity already has onCreate; left unchanged (add EdgeToEdge.enable(this) by hand)');
else if (act.endsWith('.java')) {
  src = src.replace(/(package [^;]+;\s*)/, '$1\nimport android.os.Bundle;\nimport androidx.activity.EdgeToEdge;\n');
  src = src.replace(/(class MainActivity extends BridgeActivity\s*\{)/,
    '$1\n    @Override\n    public void onCreate(Bundle savedInstanceState) {\n        EdgeToEdge.enable(this);\n        super.onCreate(savedInstanceState);\n    }\n');
  if (!src.includes('EdgeToEdge.enable')) fail('could not patch MainActivity.java');
  writeFileSync(act, src);
  console.log('play-fixes: edge-to-edge enabled in ' + act);
} else fail('MainActivity is Kotlin; add enableEdgeToEdge() by hand');
