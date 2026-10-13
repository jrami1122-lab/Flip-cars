# INSTALL FIRST — FLIP CARS 4.5.1

This ONE release replaces the earlier unuploaded 4.5 builds. **Do not upload the old 4.5 ZIP first.**

## Recommended: upgrade your existing `jrami1122-lab/Flip-cars` GitHub repo

Extract `Flip_Cars_4_5_1_All_In_One_Upgrade.zip`. It contains exactly three REQUIRED deployment files (plus documentation and optional tests):

1. `index.html` → replace the file at the **repository root**.
2. `worker/src/index.js` → replace the existing file at **worker/src/index.js**.
3. `sw.js` → replace the file at the **repository root** (new cache version forces installation updates).

Copy the paths exactly. Do not upload the `worker/src` file at the root. Do not nest the entire extracted ZIP inside a newly named directory. Keep the existing `worker/src/social.js`, `worker/wrangler.toml`, `.github/workflows/deploy-worker.yml`, `server-config.json`, icons/audio/music/manifest files unless you are using the complete project from scratch.

## Simple sequence

1. Open https://github.dev/jrami1122-lab/Flip-cars/ .
2. Replace or paste `index.html`, `worker/src/index.js` and `sw.js` using the folder tree.
3. Save all files, open Source Control, enter `Flip Cars 4.5.1 hybrid multiplayer and unified menus`, and commit/push to `main`.
4. In https://github.com/jrami1122-lab/Flip-cars/actions wait for BOTH Pages and Worker deployment workflows to succeed. If one fails, do not test the new online features until you resolve it.
5. Open https://jrami1122-lab.github.io/Flip-cars/ , hard-refresh (Ctrl+Shift+R). An already-installed PWA may require closing/reopening or checking for updates before it shows 4.5.1.

## Suggested live test

A: Host Pit Wars as a solo racer; B: Join as solo on another device, with AI filling remaining seats. Confirm Gear Sync and opponent interruption rules. Then A: host as duo, B: join as duo; both duos occupy all four race seats and same-device teammates hand off without Gear Sync. Test the finish line, Pit 2 entry, rematch, Friend invitations and notifications. Repeat in full screen.

**Not deployed automatically by this download.** GitHub connector write operations currently reject changes, so user will need to upload via GitHub editor.
