# Flip Cars 4.4 — installable online edition

## Replace the live release

Upload the **contents** of this project folder to the ROOT of `jrami1122-lab/Flip-cars` on branch `main`. Preserve folders and replace the root `index.html`, `worker/src/index.js` and `tests/placements_options.test.mjs` with these versions. Add `manifest.webmanifest`, `sw.js`, `icons/` and `tests/laps_rematch.test.mjs`. Keep your existing `server-config.json`, which points to `https://flip-cars-server.jrami1122.workers.dev`.

After committing, GitHub Pages should publish the new web app and the workflow should deploy the updated Cloudflare Worker. Both must succeed for online 5/10-lap races and same-room rematches to work. Check `...workers.dev/api/health` returns version 4.4 and perform a real two-device race.

## Install on devices

Open `https://jrami1122-lab.github.io/Flip-cars/` using Chrome on Android, Safari on iPhone/iPad, or Edge/Chrome on Windows. Tap the game's **INSTALL APP** button and follow the browser/device prompt. On iOS use Safari **Share → Add to Home Screen**; Windows Edge **… → Apps → Install this site as an app**. The app uses your existing online multiplayer server and requires internet for rooms, friends, and chat.

## What changed

- PWA manifest with icons, maskable icon, Apple icon, standalone display, service worker, no in-race forced reloads.
- Card details and action dialogs stay inside the actual full-screen game element.
- 3-, 5-, and 10-lap local and online racing with server-controlled finish conditions.
- Replay local race with same settings; host online rematch reopens the same party lobby.

## Important limitations

- This is an installable website, not an App Store IPA, Play Store APK, or Windows EXE.
- Browser profile tokens do not automatically transfer to another device. Online services need connectivity; offline caching is for local play and assets only.
- New gameplay options have tests, but production multiplayer still needs an actual two-device verification after deployment.
