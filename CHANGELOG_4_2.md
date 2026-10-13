# Flip Cars 4.2 — Podium & Player Garage

Built directly on Flip Cars **4.1 Combat Circuit**. No old 3.x code was used as the release base.

## User-facing improvements
- Redesigned arcade-style front menu: PLAY, RULES / CONTROLS, OPTIONS, STATS. Removed dense rules paragraphs from the main launch screen. Tablet/mobile responsive scrollable panels.
- Five options persisted locally: SFX, music, combat pickups/cards, flag random events, turbos/boosts. Audio changes apply immediately; game mechanic settings are snapshotted when a new race starts. Music library and manual radio stations remain.
- Online host supplies the match's combat/flag/turbo rules; the server sanitizes and enforces them for all connected players. A member's local preferences do not affect the host's match rules.
- Every racer continues to run three laps after first place finishes. The first/second/third/fourth-place standings are decided by finishing round and unused movement as tiebreak, then stable seat number. Drivers that finish early stop participating in collisions or hazards.
- Completed podium displays all racers and placings. Main STATS tab tracks the local device's races, wins, flip count, four-place trophies, and recent completed races.
- New persistent driver tag defaults to the first local player's name and prefills the online nickname, with a per-room display name override. The backend can update the authenticated online friend profile's name to the chosen tag.
- Server-verified private-room race rewards include accurate 1st–4th placements, credited once per race. Online friends and XP remain available.

## Testing / boundaries
- Client and Worker JavaScript syntax checks pass.
- Existing eleven combat/social tests plus six new placement and rule-option checks passed (17 total tests).
- Menu/Options/Rules/Stats/player-start browser smoke checks passed at 1280x800, 1024x600, 800x480, 640x360, 390x844.
- Server simulated completed races of 2, 3, 4 competitors with options off. Private hands remain hidden in multiplayer snapshots.
- Cloudflare production deployment and real two-device WebSocket play NOT tested or performed by this package.
- Local stats and tag are stored in browser localStorage and can disappear when browser data is cleared. Guest online profile access tokens are browser-bound; do not share them.
