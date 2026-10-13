# Release notes: 4.2

See **CHANGELOG_4_2.md** for menu, profile, options and 1st–4th finish updates. **INSTALL_FIRST.txt** provides deployment instructions. The worker MUST be updated alongside index.html.

# Release notes: 4.2

See **CHANGELOG_4_2.md** for menu, profile, options and 1st–4th finish updates. **INSTALL_FIRST.txt** provides deployment instructions. The worker MUST be updated alongside index.html.

# Release notes: 4.2

See **CHANGELOG_4_2.md** for menu, profile, options and 1st–4th finish updates. **INSTALL_FIRST.txt** provides deployment instructions. The worker MUST be updated alongside index.html.

# Flip Cars 4.2 — Podium & Player Garage

**Built on the original 4.1 Combat Circuit build.** This 4.2 package keeps the existing 4.0 combat systems, audio, multiplayer Worker, guest features, and tests. New client updates: readable unscaled tablet stations on all four sides; the deck, flipped card, two combat slots, status and actions contained in every placemat; clickable combat information windows; cleaner board signage; visible oil puddles; engine audio at movement; default background music after starting; and proper selected-color labels and distinct car paints for local racers. The Worker is updated to enforce room options and all-racer standings. The old 4.1 Worker must be replaced to run 4.2 online features.

**Included:** playable local game, online guest rooms, an authoritative Cloudflare Worker, uncommon defensive bubbles, 6 combat-card types, two-card hands, oil traps, pit/repair effects, animated collision smoke/spin-outs, eight paint choices, tablet tabletop controls, original racing menu art, five original looped instrumentals, your supplied car/card audio, guest friend codes, and server-verified online race XP/levels.

**Important deployment status:** The files in this ZIP are prepared and local game/UI automated tests passed. This ZIP **does not itself deploy** a Cloudflare Worker or turn on online play. Online rooms and server-side profiles need a real Cloudflare Worker address entered once in `server-config.json`. No player or host needs to name/configure a server after that. Do not claim production multiplayer is tested until you verify the `/api/health` endpoint and complete a race on two separate devices.

## Exactly where files go

Copy the **contents** of this ZIP (not the ZIP itself) to the root of your GitHub repository `jrami1122-lab/Flip-cars` on branch `main`:

```text
Flip-cars/ (repository root)
├── index.html                      ← REPLACE your current root index.html
├── server-config.json              ← ADD at root; fill serverUrl AFTER Worker deploy
├── .nojekyll                       ← ADD/KEEP at root for GitHub Pages
├── audio/
│   ├── flip.mp3
│   ├── crash.mp3
│   ├── engine.mp3
│   ├── boost.mp3
│   └── burnout.mp3
├── music/
│   ├── lofi.ogg
│   ├── rock.ogg
│   ├── cruise.ogg
│   ├── relax.ogg
│   └── retro.ogg
├── worker/
│   ├── package.json
│   ├── wrangler.toml
│   └── src/index.js               ← REPLACE existing backend
├── .github/workflows/
│   └── deploy-worker.yml           ← Automated Cloudflare deployment on push to main
├── tests/
│   ├── combat.test.mjs
│   └── profile.test.mjs
├── README.md
└── AUDIO_NOTICES.md
```

You can safely keep other existing repository files, including older ZIP archives, provided the new root `index.html` takes precedence and the new `worker/src/index.js` replaces the old version. **Do not add the original 4 sound-file uploads separately:** their edited clips are already in `audio/`.

## Deploy in this order

1. On GitHub, open `jrami1122-lab/Flip-cars` → upload all extracted files (including their folders) and commit to `main`. If editing files individually, **replace `index.html` and `worker/src/index.js`** rather than creating a second copy with another name.
2. In GitHub → Repository Settings → Secrets and variables → Actions, verify **two repository secrets** exist exactly as named: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The former is a token created **inside Cloudflare** with permission to deploy the Worker; the latter is the public Cloudflare account ID. Never paste the API token into HTML, JSON, chat, or a commit. If you already saved both, do not create duplicates.
3. GitHub → **Actions** → `Deploy Flip Cars multiplayer worker`. The push to main should trigger it automatically; otherwise choose **Run workflow**. Watch for a successful deployment. The workflow runs Wrangler for `worker/src/index.js` and the Cloudflare Durable Object migration in `worker/wrangler.toml`.
4. Cloudflare dashboard → Workers & Pages → `flip-cars-server`: copy its actual address, e.g. `https://flip-cars-server.YOUR-SUBDOMAIN.workers.dev`. Open `YOUR-ADDRESS/api/health`. It must respond with `ok: true`, `version: 4.2.2.2`, `combat: true`, and `social: true`.
5. On GitHub, edit **only** the root `server-config.json` to replace the empty value with that HTTPS Worker URL:

   ```json
   {"serverUrl":"https://flip-cars-server.YOUR-SUBDOMAIN.workers.dev"}
   ```

   Keep the rest of `index.html` unchanged. This is a **one-time site publisher setting**, not a server field players must fill in.
6. GitHub Settings → Pages: deploy from branch `main`, `/(root)` (if not already enabled). Open `https://jrami1122-lab.github.io/Flip-cars/`, hard-refresh, and test. Host on one device, open the invite on a different device/network, join, flip cards, use combat, and complete a race.

**Fallback if GitHub Actions cannot deploy:** On a computer with Node.js, `cd worker && npm install && npx wrangler login && npm run deploy`; you authorize Wrangler locally in the browser. Then resume at step 4 above.

**On your desktop:** You can extract this ZIP and double-click `index.html` to play local/CPU mode even before publishing. Use a local HTTP server (`python -m http.server 8000`) when testing online configuration and assets in a development browser.

## How to play Combat Circuit

- Move with the familiar fair 27-card deck: 1×8, 2×7, 3×5, 4×4, 5×3. Everyone flips, then positions are updated server-side in an online game.
- Land **on** a square marked 🎴 to draw **one** combat card from the second deck. The deck appears at the center of the board. Players may hold **at most two** combat cards. With a full hand, choose a card to replace or decline the new pickup **before your next flip**.
- Use your card during the pre-flip phase. Tap the card next to your movement controls; attacks offer only eligible targets. Oil and bubble do not require a target.
- **Oil slick (rear trap):** placed at your current tile, remains visibly there until another car finishes a move **on that tile**; victim spins out and misses next flip.
- **Spikes (rear, up to 3 spaces):** pop a trailing rival's tires, −1 movement per flip until repaired by a repair flag or pit. The victim must pit unless repaired first.
- **Missile (forward, up to 5):** a direct hit counts as a crash; skip next flip and pit unless protected or repaired.
- **Sniper rocket (forward, up to 10):** missile-style crash plus tire damage.
- **Engine stall (very rare):** all other racers miss their next flip unless a bubble blocks it.
- **Defensive bubble (uncommon):** activate it before flipping. It blocks the **first harmful effect** and disappears. It also expires upon crossing the lap line or entering the pit; it does not stay up permanently. Flag Guard Rail items are separate.
- **CPU racers** race without requiring internet and may deploy combat cards. **Tabletop** button is intended for landscape tablets: top player's face rotates 180°, and left/right stations rotate toward their own seats while the board stays upright.
- **Radio** button provides 5 original looping tracks: Lo-fi Sunset, Garage Rock, Midnight Cruise, Coastal Calm, Neon Freeway. **Sound** button toggles sound effects. Browsers require a tap/click before audio playback.
- **Driver Card** lets an online guest create or reuse a profile, view XP/level/wins/races and add friend codes. Guest profile access is saved **in that browser**; deleting browser data can lose access. Friend relationships are not mutual until each side adds the other's code. No passwords or sign-in recovery are implemented. Server-awarded online race results are verified by the authoritative game room.

## Quality checks performed

- Browser load, local game start, and control rendering at desktop (1320×900), landscape tablet (1024×768), and mobile (390×844) via installed Chromium, with **no JavaScript page errors**.
- ECMAScript syntax checks for frontend and Worker.
- 11 Node tests passed for bubbles, combat targeting, oil, hand replacement, hidden opponent hands, profile bearer checks, idempotent awards, and lap expiry.
- Sound file samples were trimmed/re-encoded and the five new background tracks generated into the appropriate relative paths.

**Not yet checked here:** Actual Cloudflare production deploy (requires your authorized account), full internet multiplayer on two physical devices, cross-device browser compatibility, latency/reconnection in production, or legal licenses for user-supplied sound effects. Those are required before calling the online version fully launched.

## Versioning / future content

Garages, collectible vehicles, cosmetics, additional tracks and car unlocks are intentionally left for later updates. Keep this game as the stable launch branch and develop future changes on a separate branch. Do not overwrite `worker/wrangler.toml` migrations with old copies, and never put API tokens in public files.
