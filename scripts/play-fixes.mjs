// Google Play "for your next release" fixes. Run after `npx cap sync android`. Safe to run more than once.
//  1. Full screen: MainActivity turns on edge-to-edge, hides the status and navigation bars (immersive; a swipe from
//     the edge shows them briefly), hides them again when you come back to the game, lets the game use the area beside a
//     camera notch, and paints the window behind the game dark so the launch logo can never show in a strip at the top.
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

/* 2. MainActivity: edge-to-edge + immersive full screen */
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
if (!act.endsWith('.java')) fail('MainActivity is Kotlin; add the full-screen code by hand');
let src = readFileSync(act, 'utf8');
if (src.includes('hideSystemBars')) console.log('play-fixes: full screen already set up');
else if (/onCreate\s*\(/.test(src)) fail('MainActivity already has its own onCreate; merge the full-screen code by hand');
else {
  src = src.replace(/(package [^;]+;\s*)/, `$1
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.activity.EdgeToEdge;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
`);
  src = src.replace(/(class MainActivity extends BridgeActivity\s*\{)/, `$1
    @Override
    public void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        // dark window behind the game (never the launch logo)
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.parseColor("#08131d")));
        // use the area beside a camera notch
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        hideSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    // immersive full screen: status and navigation bars hidden, a swipe from the edge shows them briefly
    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
`);
  if (!src.includes('hideSystemBars();')) fail('could not patch MainActivity.java');
  writeFileSync(act, src);
  console.log('play-fixes: edge-to-edge and immersive full screen in ' + act);
}
