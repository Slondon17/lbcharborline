// Locks Harborline to landscape and full screen in the native projects.
// Run after `npx cap add android` / `npx cap add ios` (the npm scripts do this for you).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const manifest = 'android/app/src/main/AndroidManifest.xml';
if (existsSync(manifest)) {
  let xml = readFileSync(manifest, 'utf8');
  if (!xml.includes('android:screenOrientation')) {
    xml = xml.replace(/<activity\b/, '<activity android:screenOrientation="sensorLandscape"');
    writeFileSync(manifest, xml);
    console.log('Android: locked to landscape');
  } else console.log('Android: orientation already set');
}

const plist = 'ios/App/App/Info.plist';
if (existsSync(plist)) {
  let xml = readFileSync(plist, 'utf8');
  const land = '<array>\n\t\t<string>UIInterfaceOrientationLandscapeLeft</string>\n\t\t<string>UIInterfaceOrientationLandscapeRight</string>\n\t</array>';
  xml = xml.replace(/(<key>UISupportedInterfaceOrientations(?:~ipad)?<\/key>\s*)<array>[\s\S]*?<\/array>/g, `$1${land}`);
  const add = (key, val) => { if (!xml.includes(`<key>${key}</key>`)) xml = xml.replace(/<\/dict>\s*<\/plist>\s*$/, `\t<key>${key}</key>\n\t${val}\n</dict>\n</plist>\n`); };
  add('UIRequiresFullScreen', '<true/>');
  add('UIStatusBarHidden', '<true/>');
  add('UIViewControllerBasedStatusBarAppearance', '<false/>');
  add('ITSAppUsesNonExemptEncryption', '<false/>');
  writeFileSync(plist, xml);
  console.log('iOS: locked to landscape, full screen');
}
