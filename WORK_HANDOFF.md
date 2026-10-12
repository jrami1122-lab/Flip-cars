# Flip Cars 3.1 — Work Mode Deployment Handoff

## User authorization and target
The user wants to publish the fully extracted Flip Cars files to their OWN GitHub repository and enable GitHub Pages, then help deploy multiplayer using Cloudflare Workers. Do not modify any other repositories.

- Confirmed GitHub owner: `jrami1122-lab`
- Confirmed existing public repository: `https://github.com/jrami1122-lab/Flip-cars`
- Desired default branch: `main`
- Package homepage: `index.html` at repository root (3.1 guest-ready upload)
- Server: `worker/src/index.js` (Cloudflare Durable Objects)
- Config: `worker/wrangler.toml`
- Automated tests: `tests/*.test.mjs`
- GitHub Pages expected URL: `https://jrami1122-lab.github.io/Flip-cars/` (verify, don't assume live).

## Tasks for Work mode
1. Open repository via connected GitHub or browser. If app integration is blocked, ask the user to approve its access to this repository or to sign in via Work browser. Earlier API upload returned 403 and GitHub App installations were empty. Never assume access is fixed.
2. Upload everything in the extracted package to the repository root **as files and directories, not a ZIP**, preferably in a single commit. The new 3.1 `index.html` takes precedence over any 3.0 version.
3. In GitHub repository Settings > Pages, configure branch `main`, folder `/(root)`. Confirm deployment finished and load live homepage on phone-size and desktop viewports.
4. Obtain the user's sign-in/consent for their Cloudflare account (never ask for a password, tokens, or secrets in chat). Deploy from `worker/` using `npm install`, `npx wrangler login` if required in an authorized environment, and `npm run deploy`; alternatively use an equivalent authorized Cloudflare UI workflow. Cloudflare account binding and any plan selection require user approval.
5. Test `https://<deployed-worker-domain>/api/health`, then edit `DEFAULT_SERVER_URL` in `index.html` to the real HTTPS Worker URL and push a new commit to GitHub. Do not put credentials in public source.
6. Check live site with two different clients: create private room, join as guest, start, reveal flips, branch selection, disconnect and reconnect, and verify 3-lap race. Report actual URLs and test results.

## Known test status
From extracted package, `node --test tests/*.test.mjs`: 6 passed, 0 failed (2026-10-11). These are simulation/unit tests, **not** proof of a deployed multiplayer race.

## User-facing update
Clarify what's complete versus pending. Do not say GitHub Pages or online multiplayer is live without checking.
