# Guest authentication audit

Guests use nicknames and private room invitations; there are no passwords, accounts, OAuth tokens, or identity verification. A room code permits joining an available seat; it is not a password.

## Request flow

1. The static client POSTs a nickname to `/api/rooms` or `/api/rooms/CODE/join`.
2. The Worker routes to a Durable Object keyed by the room code. It issues a seat bearer credential made from two cryptographically random UUIDs.
3. The browser remembers the room, backend, seat ID and credential in `localStorage` for rejoining. Storage failures are tolerated, but rejoining after closing the page then cannot work.
4. WebSocket connections send `flipcars` and `seat.<credential>` subprotocol headers. The server validates the credential and selects only `flipcars` in its response. Credentials are no longer put in request URLs or invite links.
5. The server attaches the authenticated seat ID to the socket. Messages cannot select another player's identity. Only the host can start; only the active driver can choose a route. Decks, movement and race results remain server controlled.
6. HTTP snapshots now require `Authorization: Bearer <credential>`. Public responses exclude member credentials and card decks.

## Fixes in this revision

- Require a seat credential for HTTP snapshots.
- Remove WebSocket bearer credentials from query strings; disallow legacy query-only authentication.
- Serialize room HTTP operations, preventing concurrent joins from overwriting seats.
- Ignore malformed, null, array and oversized WebSocket messages.
- Detach old socket callbacks when leaving, preventing stale disconnect screens.
- Restore the ZIP's newer guest lobby, including its missing rejoin container fix.
- Correct clipboard fallback so copying a room code copies the code, not the invite link.

## Remaining limitations

Possession of a seat credential permits rejoining that seat. Credentials stay valid until the room is deleted, approximately 24–48 hours after last activity with the daily cleanup alarm. They are stored in plaintext Durable Object state and browser localStorage; an origin-level XSS or local browser access could steal them. Do not log WebSocket protocol or Authorization headers.

Invites can specify a different HTTPS server. A server URL is a trust decision; credentials are only sent back to the saved backend that issued them. There is no public matchmaking, bot protection, per-IP rate limiting, token rotation, seat revocation or host kick feature. Open joining and permissive CORS suit friend invitations, not a hardened public competitive service. Do not put Cloudflare deployment credentials in the client, ZIP or source.
