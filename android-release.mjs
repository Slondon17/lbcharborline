// Prepares the generated Android project for a signed Google Play release.
// Runs on Codemagic after `npx cap add android` (see codemagic.yaml). Safe to run more than once.
//  - targets Android 16 (API 36), which Google Play requires for new apps and updates
//  - version name comes from package.json, version code from the build number
//  - signs release builds with the upload key from Codemagic (CM_KEYSTORE_* variables)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const fail = (m) => { console.error('android-release: ' + m); process.exit(1); };
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const vars = 'android/variables.gradle', app = 'android/app/build.gradle';
if (!existsSync(app)) fail(`${app} not found. Run "npx cap add android" first.`);

// 1. API levels: never lower than 36
if (existsSync(vars)) {
  let v = readFileSync(vars, 'utf8');
  for (const k of ['compileSdkVersion', 'targetSdkVersion']) {
    v = v.replace(new RegExp(`(${k}\\s*=\\s*)(\\d+)`), (m, a, n) => a + Math.max(36, +n));
  }
  writeFileSync(vars, v);
  console.log('API levels:', (v.match(/(compileSdkVersion|targetSdkVersion|minSdkVersion)\s*=\s*\d+/g) || []).join(', '));
}

let g = readFileSync(app, 'utf8');

// 2. Version
const code = parseInt(process.env.BUILD_NUMBER || '1', 10);
if (!/versionCode\s+\d+/.test(g)) fail('could not find versionCode in build.gradle');
g = g.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${pkg.version}"`);

// 3. Signing
if (!g.includes('signingConfigs {')) {
  const block = `    signingConfigs {
        release {
            if (System.getenv("CM_KEYSTORE_PATH")) {
                storeFile file(System.getenv("CM_KEYSTORE_PATH"))
                storePassword System.getenv("CM_KEYSTORE_PASSWORD")
                keyAlias System.getenv("CM_KEY_ALIAS")
                keyPassword System.getenv("CM_KEY_PASSWORD")
            }
        }
    }
    buildTypes {`;
  if (!/\n\s*buildTypes\s*\{/.test(g)) fail('could not find buildTypes in build.gradle');
  g = g.replace(/\n\s*buildTypes\s*\{/, '\n' + block);
  g = g.replace(/(buildTypes\s*\{[\s\S]*?release\s*\{)/, `$1\n            signingConfig signingConfigs.release`);
}
writeFileSync(app, g);

// 4. Google Play Billing permission (needed for the "full_game" in-app purchase)
const manifest = 'android/app/src/main/AndroidManifest.xml';
if (existsSync(manifest)) {
  let m = readFileSync(manifest, 'utf8');
  if (!m.includes('com.android.vending.BILLING')) {
    m = m.replace(/<application\b/, '<uses-permission android:name="com.android.vending.BILLING" />\n    <application');
    writeFileSync(manifest, m);
  }
  console.log('Billing permission:', m.includes('com.android.vending.BILLING') ? 'yes' : 'MISSING');
}
if (process.env.CI && !process.env.CM_KEYSTORE_PATH) fail('no upload key found. Add the keystore in Codemagic and check the reference name in codemagic.yaml.');
console.log(`Android release ready: version ${pkg.version} (code ${code})`);
