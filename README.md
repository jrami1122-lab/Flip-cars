# Flip Cars 3.1 — Guest-Ready Circuit Racing, Local + Online

**Status:** The 3.1 guest-ready local game runs immediately. The private-room multiplayer frontend and Cloudflare Durable Objects server are implemented, but **are not live until the Worker is deployed**. Online functionality has been tested with simulated clients and game-engine tests, not an actual production deployment.

## What's here

- `index.html` — GitHub Pages entry point, an entirely self-contained offline-capable racing game with optional online mode. No external JS libraries required.
- `worker/src/index.js` — server-authoritative multiplayer rooms, real-time WebSockets, persistent game states, and private card decks.
- `worker/wrangler.toml` — Cloudflare Workers Durable Object (SQLite) configuration.
- `worker/package.json` — deployment dependencies and commands.
- `tests/*.test.mjs` — unit tests for route graph, deck fairness, simulated races, and room synchronization.

## Step 1: Run the local game

Open `index.html` in a browser. The offline/local game works before you set up any accounts or server.

## Step 2: Create the GitHub repository (requires your authorization)

1. Use the already created public repository: **https://github.com/jrami1122-lab/Flip-cars**.
2. Add the **contents** of this folder to repository root on `main`. The critical file is **`index.html` at the root**. Also commit the `worker/`, `tests/`, and `.nojekyll` files.
3. Under **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, `main`, and `/(root)`, then Save.
4. After publishing succeeds, verify the actual site address (expected `https://jrami1122-lab.github.io/Flip-cars/` but **not confirmed live**).

The connected ChatGPT GitHub integration currently reports no authorized GitHub App installations and an attempted upload returned HTTP 403. Re-authorize the integration for this repository, use Work mode with access to GitHub, or upload the extracted files manually.

## Step 3: Deploy the real-time multiplayer Worker

This requires a Cloudflare account with Workers enabled and a computer with Node.js available (or another environment in which you can run Wrangler).

1. Open https://dash.cloudflare.com and create/sign into an account.
2. Open a terminal in the `worker` directory.
3. Run:

```bash
npm install
npx wrangler login
npm run deploy
```

4. Wrangler should return a URL similar to `https://flip-cars-server.ACCOUNT.workers.dev` (this is only an example).
5. Test `https://YOUR-WORKER-URL/api/health`; it should return JSON indicating `ok: true`.
6. **For a seamless public game:** edit the `DEFAULT_SERVER_URL` constant inside the script in `index.html` to your real Worker URL. This is required for guest-friendly online play without manually entering a server address. Commit the change and allow Pages to redeploy. Otherwise, each player may enter the Worker URL in the Online menu; their browser remembers it if storage is available.

Cloudflare Durable Objects with SQLite storage are available on Workers Free plans subject to quotas; limits and terms may change. See https://developers.cloudflare.com/durable-objects/platform/pricing/ .

## Step 4: Invite players

1. Each player opens the GitHub Pages link on their device. The updated 3.1 frontend supports guest nicknames and invite-link sharing.
2. One player taps **ONLINE → CREATE ROOM** and gets a 6-character room code.
3. Other players tap **ONLINE → JOIN ROOM** and enter that code.
4. The host fills unused seats with CPUs if desired and starts the race.
5. All players flip; once everyone's flip is received, cards reveal and cars race automatically. On forks, only the relevant driver can make their route choice. The server manages collisions, flag events, pit stops, and lap counts.

Players can reconnect from the same tab during a network interruption. The menu also provides a **Rejoin Previous Race** option if their browser retained the room credentials. If a competitor disconnects, the server can let a CPU take over pending moves and keep the race running.

## How it works

- Up to 4 cars, any mixture of 2–4 humans/CPUs (at least two racers total).
- Each car starts with the same weighted 27-card deck: 1 × 8, 2 × 7, 3 × 5, 4 × 4, 5 × 3.
- All movement cards remain hidden until all participating racers are ready.
- Three circuit forks, risky longer routes, boost spaces, event cards, defensive items, pit stops, and simultaneous collision evaluation are included.
- The server authoritatively draws cards, processes actions, and persists room state. Clients cannot set their own move distance, items, or lap count.
- Rooms expire after approximately a day of inactivity; private invite codes are not passwords. There is no account login or public matchmaking in this version.
- Keep the `worker` source in your repository: **GitHub Pages cannot run it**, so a separate Cloudflare deployment is necessary.

## Tests

From this repository root:

```bash
node --test tests/*.test.mjs
```

These tests cover simulated gameplay and room state. Before announcing a public launch, test a real remote race on two different devices against a deployed Worker.
