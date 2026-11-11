# Harborline: phone app project

**Publishing on Google Play? Follow `GOOGLE PLAY GUIDE.md`.** It builds the app in the cloud with Codemagic, so you don't need Android Studio. The steps below are for building on your own computer instead.

This folder turns the Harborline game into a real iPhone and Android app using Capacitor (free). The game itself lives in `www/` and works fully offline.

```
harborline-app/
  www/                  the game (index.html, 3D engine, fonts)
  assets/               app icon + splash screen (sizes are generated for you)
  scripts/landscape.mjs locks the app to landscape, full screen
  privacy-policy.html   host this publicly; both stores ask for its link
  licenses/             open-source licenses that ship with the game
```

## Before you start

1. **Pick your app ID.** Open `capacitor.config.json` and change `com.harborline.game` to something unique you own, like `com.yourname.harborline`. You cannot change it after the app is published.
2. **Install on your computer:**
   - [Node.js](https://nodejs.org) (the LTS version)
   - [Android Studio](https://developer.android.com/studio) (for Android)
   - Xcode from the Mac App Store (for iPhone, Mac only)
3. **Developer accounts:** Google Play Console ($25 one time) and Apple Developer Program ($99 per year).

## 1. Install and try it

Open a terminal in this folder and run:

```
npm install
npm run preview
```

Open http://localhost:8080 in your browser to check that the game runs from these files.

## 2. Android

```
npm run add:android
npm run icons
npm run sync
npm run open:android
```

Android Studio opens. To play on your own phone, turn on **Developer options → USB debugging** on the phone, plug it in, and press the green **Run** button.

**Release build for Google Play:** in Android Studio, choose **Build → Generate Signed App Bundle**, create a new keystore, and build the `.aab` file.

> Back up the keystore file and its passwords somewhere safe. Every future update must be signed with the same key.

## 3. Google Play Console

1. Create the app and fill in the store listing with the screenshots and the 1024×500 feature graphic.
2. Paste the public link to your privacy policy.
3. Complete the content rating questionnaire, Data safety (answer: no data collected), and target audience.
4. **Closed test:** new personal developer accounts must run a closed test with at least 12 testers for 14 days in a row before applying for production. Upload the `.aab` to a closed testing track and invite friends by email.
5. After the 14 days, apply for production access and release.

## 4. iPhone

**With a Mac:**

```
npm run add:ios
npm run icons
npm run sync
npm run open:ios
```

In Xcode, select the **App** target, open **Signing & Capabilities**, and choose your Apple Developer team. Plug in your iPhone and press Run to test. To publish: **Product → Archive → Distribute App → App Store Connect**. The build appears in TestFlight for testing, and then you submit it for review in App Store Connect.

**Without a Mac:** put this folder in a GitHub repository and use a cloud build service such as Capawesome Cloud or Codemagic. Follow their Capacitor iOS guide to sign the app and upload it to TestFlight.

## Launch checklist: free app with a full-game unlock

The app is **free**. Players get the Harbor Run demo, and a one-time in-app purchase with the product ID **full_game** unlocks all 32 ships. The purchase code (`scripts/store-entry.mjs` and `scripts/app-edition.mjs`) is added on every cloud build, so you can drop a new game build into `www/index.html` and it still works. The app shows no links to other stores.

**Google Play:** follow `GOOGLE PLAY GUIDE.md`, including the section "Free app with a full-game unlock".

**Apple App Store (later, no Mac needed):** the same purchase plugin works on iPhone.
1. Join the Apple Developer Program ($99 per year), and in App Store Connect sign the **Paid Apps agreement** (needed for in-app purchases) with your bank and tax details.
2. Build with Codemagic (an iOS workflow can be added next to the Android one).
3. Create a **non-consumable** in-app purchase with the product ID **full_game**, set its price, and submit it with the app.
4. Screenshots: iPhone 2868 × 1320 (landscape), plus 13-inch iPad if the app runs on iPad.

**Both stores**
- Host `privacy-policy.html` at a public web address after adding your contact email.
- Age rating: no violence, no user content. Answer **yes** to "in-app purchases".
- Data safety and privacy labels: "No data collected". Purchases are handled by Google and Apple.

## Updating the game later

1. Replace `www/index.html` with the new version.
2. Run `npm run sync`.
3. Raise the version number: `versionCode` and `versionName` in `android/app/build.gradle`, and **Version / Build** in Xcode.
4. Build and upload as above.

## Licenses

three.js (MIT) and the Big Shoulders Display, Barlow and IBM Plex Mono fonts (SIL Open Font License) are included in `licenses/`. Both licenses allow use in commercial apps.
