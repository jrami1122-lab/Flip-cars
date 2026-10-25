# Flip Cars 4.5.3 — Two-Device Voice & Open Text Chat

This release is **cumulative**. It contains the complete 4.5.2 client/server, including the 4.5 hybrid party, Pit Wars, menu redesign, and 27-card movement rebalance.

## New
- Optional **WebRTC audio voice chat** inside the current party when **exactly two devices** (not two racers) are connected, including duo-vs-duo on two screens.
- Microphones stay OFF until **Join Voice** is pressed on each device and browser permission is granted. `Mute Mic`, `Deafen` (incoming audio), `Leave`, and a visible connection status are provided.
- If a third device joins, both clients shut down their voice connection and release microphone tracks. AI does not count as a device.
- Cloudflare Worker relays authenticated WebRTC offer/answer/ICE messages to the other opted-in device only; it does NOT relay or store audio.
- Existing text chat (180 characters per message, temporary per room) works across **2, 3, or 4 connected devices**, rather than only two. One seat per device sends; duos share their room chat.
- PWA cache bumped to `flipcars-v4.5.3-static-1`.

## Technical / limitations
- WebRTC uses public STUN servers. Restricted carrier/office networks or symmetric NAT may need a separately provisioned TURN relay. Without TURN, audio is not guaranteed to connect on every network.
- Real simultaneous microphone calls on separate physical devices have NOT been verified in this environment. Use the live test checklist after deployment.
- Voice is NOT background-calling and does not automatically ring the other user. Both players click Join Voice. No recordings or transcripts are created.
- Some browsers require a tap to begin audio playback, and microphone permission requires HTTPS and a compatible browser.
- Text is broadcast as room events but not stored as message history.

## Tests
- `cd worker && npm test` or `cd worker && node --test ../tests/*.test.mjs`
- 73 automated tests passed in the build environment.
- Chromium loaded the generated client at 1280×800, 800×480, and 390×844 with no JavaScript page exceptions. Localhost navigation was blocked by this environment, so UI was loaded directly for those checks.
