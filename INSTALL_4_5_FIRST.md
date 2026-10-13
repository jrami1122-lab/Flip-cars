# INSTALL THIS FIRST — Flip Cars 4.5

This release requires changing both GitHub Pages (game client) and Cloudflare Worker (multiplayer server). The live website is NOT upgraded just because you download the ZIP.

Repo: https://github.com/jrami1122-lab/Flip-cars
Live game: https://jrami1122-lab.github.io/Flip-cars/

## Simplest safe upgrade from 4.4.1

1. Download and unzip `Flip_Cars_4_5_Upgrade_Only.zip`.
2. Open https://github.dev/jrami1122-lab/Flip-cars in your browser.
3. Replace these *exact paths* in the main repository:
   - `index.html` (root, NOT in an extra uploaded ZIP folder)
   - `worker/src/index.js` (same nested path)
   - `sw.js` (root, cache version upgraded)
4. Optional but recommended: add `tests/hybrid_team.test.mjs`, `tests/hybrid_room.test.mjs`, `tests/seating_layout.test.mjs`, and `CHANGELOG_4_5.md`.
5. Commit and push ALL modifications to `main`.
6. Verify both GitHub Pages and Cloudflare Worker workflow runs have passed before testing:
   https://github.com/jrami1122-lab/Flip-cars/actions
7. Hard-refresh or reopen the installed Flip Cars application. Service-worker cache now uses the new 4.5 version.
8. Verify Create/Join Online: choose `2 — DUO (+1)` for two local racers or `1 — SOLO` for one. Create room, share code, and use a second device to join.
9. For Team Racer, in the host lobby choose **PIT WARS**; it forces two laps and fills missing seats with AI. For regular 3/5/10 laps keep CLASSIC.

## First live tests
- Device A hosts as Duo, Device B joins as Duo -> 4 racers, 2 devices.
- Device A hosts as Duo, Devices B and C join as Solo -> 4 racers, 3 devices.
- Each local racer should see their own private combat hand and be able to flip independently.
- In team mode verify each first driver reaches the real checkered line before the reserve appears at pit-exit merge.
- For two separate-device teammates verify the four-gear selector, opponent interception, wrong-guess delays, and public communication signals.
- For same-device teammates verify NO gear challenge and immediate handoff.
- Verify optional taunts ON/OFF and same-room rematches.
- Verify regular classic combat and multiplayer remain functional.

Do not upload ZIP archives intact to GitHub Pages. Extract, preserve the tree and replace the files.

The original 4.4.1 deployment is untouched until the user commits. If Cloudflare Worker deployment fails, fix its Actions job before inviting online players. Room schemas use only existing Durable Object classes; no new wrangler migrations are required.

## Updated controls before first 4.5 deployment
The same 4.5 ZIP includes the new Start-Line Perspective & Clockwise Tabletop Seating changes. Do not upload any older 4.5 ZIP. In local or shared-device play: 1 player = bottom; 2 = bottom/top; 3 = bottom/left/top; 4 = bottom/left/top/right. FIT starts with the whole track and the checkered line at the bottom.
