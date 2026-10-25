# Install Flip Cars 4.5.3 on GitHub (one upload)

**This release replaces the unuploaded 4.5/4.5.1/4.5.2 packages.** Use the *All-In-One Upgrade* if the repository already has your game and assets. Do NOT replace the entire repository with the upgrade ZIP.

## Required files
Replace these files in repository `jrami1122-lab/Flip-cars` on branch `main`:

1. `index.html` — game page, voice and text chat buttons, microphone controls.
2. `worker/src/index.js` — chat eligibility and authenticated WebRTC signaling.
3. `sw.js` — app-cache refresh to display the new buttons.
4. `worker/package.json` — version label only (recommended).

Optional: upload `tests/chat_movement.test.mjs`, `tests/menu_navigation.test.mjs`, `CHANGELOG_4_5_3.md`, and this guide. **Do not move or rename paths.** Leave `worker/src/social.js`, `worker/wrangler.toml`, the icons, audio and music alone.

### Deploy
1. Extract the Upgrade ZIP on your computer.
2. Open https://github.dev/jrami1122-lab/Flip-cars or use the GitHub file editor.
3. Replace the files at their correct paths.
4. Commit and push to `main`.
5. Confirm GitHub Actions show successful **pages build and deployment** and **Deploy Flip Cars multiplayer worker**.
6. Open https://jrami1122-lab.github.io/Flip-cars/ and refresh. Installed PWA users may need to fully close and reopen the app once.

### Test on two devices
1. Device A creates an online party; Device B joins the SAME party (as solo or duo).
2. Confirm the 💬 text-chat and 🎙 voice buttons show in the online lobby/race toolbar.
3. Send text in both directions.
4. On A press 🎙 Voice → Join Voice, approve microphone permission. On B do the same.
5. Check audio in both directions; test Mute Mic, Deafen, Leave Voice.
6. In a new three- or four-device party, confirm text chat remains open to everyone and voice is unavailable.
7. Test a local race and Pit Wars to confirm their movement and controls still work.

**Important:** Audio goes peer-to-peer over WebRTC, which relies on STUN. Some networks require a TURN server; no paid TURN service or authentication credentials are bundled with the game. The Worker is NOT a voice streaming server.

**Do not label GitHub commit “voice chat complete” as proof calls work:** GitHub green checks verify deployments, not cross-device audio. Live test the feature.
