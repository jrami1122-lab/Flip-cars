# Flip Cars 4.4.1 — Driver Identity & Compact Cockpit

This update builds on Flip Cars **4.4**. It preserves existing lap options, replay/rematch, full-screen combat dialogs, the Friends Garage, the PWA app setup and audio assets.

## Install from the upgrade ZIP

In the GitHub repository `jrami1122-lab/Flip-cars`, on branch `main`:

1. Replace **root** `index.html`.
2. Replace `worker/src/index.js` (inside the existing `worker/src` directory).
3. Replace **root** `sw.js` (important: updates the installed app's cache).
4. Optional: add `tests/names_two_tone.test.mjs` to `tests/` to run the new identity/cosmetics checks.
5. Commit to `main` and wait for both the GitHub Pages and Cloudflare Worker deployments to succeed. Refresh the game or reopen the installed PWA to load the new service-worker version.

**Do not** create a nested `Flip_Cars_4_4_1_Project` folder in the repository; copy the files *inside* the ZIP to their listed paths. Keep `server-config.json` and existing `.github/workflows`, social.js, icons, audio and music unchanged.

## What changes

- Empty seat placemats are not rendered at all, including in online/full-screen/mobile play. The active driver's station remains and the board grows into the available space. Rivals and AI remain visible in the board's racing HUD.
- Race commentary now uses player nicknames/tags rather than color names. NPCs are named `AI Racer 1`, `AI Racer 2`, etc. Single-player local uses the stored tag for Player 1 and labeled AI drivers for others.
- Online race nicknames are unique **within their party**, regardless of letter case. Example: `SpeedRacer`, `SpeedRacer-2`, `SpeedRacer-3`. This does not replace the Friends Garage's globally unique searchable public tags.
- Select primary paint plus an optional secondary BLACK/WHITE/SILVER/GOLD trim (or AUTO). AUTO chooses a different two-tone finish when someone else in the room already chose the same primary color. The paired finish shows up on the physical canvas cars, HUD, lobby and results.
- The Cloudflare Worker enforces naming/secondary colors for all connected guests and AI cars so all devices see the same result.

## Validation

Automated suite: **35 passed** (including 4 new identity/color tests). Client JS syntax checked. Chromium visual/interface check in 390×844, 800×480 and 1280×800 viewports passed, and 2-local-human layout checked.

**Not yet verified live:** simultaneous two-device online race with same-color cars and same nickname after GitHub/Cloudflare deploy. Run that smoke test before advertising this update as production verified.
