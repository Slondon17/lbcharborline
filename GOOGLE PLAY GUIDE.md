# Harborline on Google Play: step by step

Everything happens in your web browser. Nothing big gets installed on your PC: Codemagic builds the app in the cloud.

**What you need:** a Google account, about $25 for the Play developer account, and the two files from the **Harborline upload key** zip (`harborline-upload.jks` and `UPLOAD KEY - KEEP SAFE.txt`).

**Rough timeline:** about an hour of setup, then 14 days of closed testing, then a production review of a few days.

---

## Step 0. Start the Play developer account today

Identity checks can take a few days, so start this first.

1. Go to **play.google.com/console** and sign up as a **personal** account ($25, one time).
2. Verify your identity when asked. Google may also ask you to confirm with an Android phone.

## Step 1. Choose your app ID (2 minutes)

Open `capacitor.config.json` in Notepad and change `"appId": "com.harborline.game"` to something unique, for example `com.yourname.harborline` (lowercase letters, dots, no spaces). It is permanent once the app is on Google Play.

## Step 2. Put the project on GitHub (10 minutes)

1. Make a free account at **github.com**.
2. Click **New repository**. Name it `harborline-app`, choose **Private**, and click **Create repository**.
3. On the new page, click **uploading an existing file**.
4. Unzip `harborline-app.zip`. Open the `harborline-app` folder, select **everything inside it**, and drag it onto the GitHub page. Drag the contents, not the zip or the outer folder.
5. Click **Commit changes**.

Check that `codemagic.yaml`, `package.json` and the `www` folder appear at the top level of the repository.

> Never upload the upload key (`.jks`) or its password file to GitHub.

## Step 3. Set up Codemagic (10 minutes)

1. Go to **codemagic.io** and sign up with your GitHub account. Choose the **personal** account; the 500 free build minutes a month only apply to personal accounts.
2. Click **Add application**, pick **GitHub**, and choose `harborline-app`. When asked for the project type, choose **Other** or **codemagic.yaml**.
3. Add your upload key: open the **Team settings** (or Personal account settings) → **codemagic.yaml settings** → **Code signing identities** → **Android keystores** → **Upload keystore**, and fill in:
   - Keystore file: `harborline-upload.jks`
   - Keystore password, key alias and key password: from `UPLOAD KEY - KEEP SAFE.txt`
   - Reference name: **harborline_upload** (exactly this)

## Step 4. Build the app (about 10 minutes, mostly waiting)

1. In Codemagic, open the app and click **Start new build**.
2. Choose the **main** branch and the **Harborline - Android release** workflow, then **Start new build**.
3. When it turns green, open **Artifacts** and download the `.aab` file (for example `app-release.aab`).

If a step goes red, open it and copy the last 30 lines of the log. Send them to me and I'll fix it.

## Step 5. Create the app in Play Console (20 minutes)

1. Click **Create app**.
   - App name: `Harborline: Ship Docking Sim`
   - Default language: English (United States)
   - App or game: **Game**
   - Free or paid: **Free**. Players get the demo free, and one in-app purchase unlocks the full game.
2. **Set up a payments profile** if Play Console asks. You need one before you can sell.
3. Fill in **App content** (left menu, under Policy):
   - **Privacy policy**: the public link to `privacy-policy.html`.
   - **Ads**: No ads.
   - **App access**: All functionality is available without special access.
   - **Content rating**: answer the questionnaire. There is no violence, gambling, user content or purchases inside the game.
   - **Target audience**: choosing ages under 13 adds Google's Families policy checks. "13 and over" keeps review simpler.
   - **Data safety**: the app collects no data and shares no data.
4. **Store listing** (left menu → Grow → Store presence → Main store listing). Use the `store-listing/google-play` folder:
   - Text: `LISTING TEXT.txt`
   - App icon: `icon_512.png`
   - Feature graphic: `feature_graphic_1024x500.png`
   - Phone screenshots: any 2 to 8 from `screenshots/`
5. **The full-game unlock**: see "Free app with a full-game unlock" below.

## Step 6. Closed test (14 days)

New personal accounts must run a closed test with **at least 12 testers who stay opted in for 14 days in a row** before they can release to everyone.

1. **Test and release → Testing → Closed testing → Create track**.
2. **Testers**: create an email list with at least 12 Google account emails (friends and family, or a tester exchange community).
3. **Create new release**: upload the `.aab` from Codemagic. Google Play App Signing is turned on automatically; accept it. Release name: `1.0.0`.
4. **Review and roll out**. After Google's review, copy the **join link** and send it to your testers.

Testers download the app free, like everyone else. To let them try the unlock without paying, add them as **license testers** (below).

Ask testers to open the game a few times over the 14 days, and to tell you about anything hidden under the camera notch or the edges of the screen.

## Step 7. Go live

After 14 days, Play Console shows **Apply for production**. Answer the questions about your test, wait for approval (usually a few days), then create a **Production** release with the same `.aab` and roll it out.

## Updating the game later

1. Change `"version"` in `package.json` (for example `1.0.0` → `1.1.0`) and replace `www/index.html` with the new game. You can edit and upload files on the GitHub website.
2. In Codemagic, click **Start new build**. The build number goes up by itself, which Google Play needs for every new upload.
3. Upload the new `.aab` in Play Console as a new release.

---

## Free app with a full-game unlock

Harborline is a **free** app. Everyone can play the Harbor Run demo, and a one-time purchase called **full_game** unlocks all 32 ships. Progress carries straight over. The buttons show the price in each player's own currency, and **Restore purchase** brings the unlock back on a new phone.

**If your app is already set up as Paid:** go to **Monetize → Products → App pricing** and choose **Make free**. You can't go back to paid afterwards, which is fine because the money now comes from the unlock.

**1. Upload the new build first.** Google only lets you create in-app products after you've uploaded a build that can take payments. In Codemagic, click **Start new build**, download the new `.aab`, and upload it as a new release on your **closed testing** track (Create new release → upload → Review → Roll out). It replaces the paid build that's waiting for review.

**2. Create the product.** Go to **Monetize → Products → One-time products** (older layouts call it **In-app products**) → **Create**:
- Product ID: **full_game**. It must be exactly this; the app looks for this ID.
- Name: `Full game`
- Description: `Unlocks all 32 ships, every berth and the full career.`
- Price: $9.99. Google fills in other countries, and you can adjust them.
- Save, then **Activate**. A product that isn't active doesn't show up in the app.

**3. Set up the 15% fee.** Go to **Settings → Account groups** and set up the group, so Google charges you 15% instead of 30% on your first $1 million a year.

**4. Test the purchase without paying.** Go to **Settings → License testing** and add your own Google account (and any testers). License testers see "test card, always approves" in the purchase screen and aren't charged. On your phone:
- Install the app from the closed-test link, play a little and tap **Get the full game**.
- Buy with the test card. The game should say "Full game unlocked!", restart and show the whole fleet.
- Uninstall, reinstall and open the app again. It should unlock by itself, and **Restore purchase** should also work.

If anything there doesn't behave, tell me what you saw and I'll fix it.
