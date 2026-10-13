# 4.4 Installable Edition

- PWA manifest, 192/512/maskable icons, Apple home-screen icon, native splash theme and short installed startup graphic.
- In-game install CTA and device-specific install instructions.
- Offline network-status badge and same-origin cache, with online APIs never cached.
- Service worker uses network-first HTML and versioned cache cleanup without forced in-race reloads.
- Preserves 4.3.2 game, social, Cloudflare Worker, and existing audio/music.

- Fullscreen combat fix: card dialogs are descendants of game fullscreen element, including use/target/back controls.
- Local and online host race lengths: 3 / 5 / 10 laps (server enforced).
- Replay from podium: same-setup local replay; host online rematch returns the same players to the existing lobby, with guest seats retained.

- Server updated to validate lap length and host-only same-room rematch.
- Explicit production two-device verification still required after deployment.
