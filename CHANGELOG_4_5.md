# Flip Cars 4.5 — Hybrid Party & Team Racer: Pit Wars

Built on Flip Cars 4.4.1. This release changes **both the online client and Cloudflare Worker**.

## Hybrid party / couch + online
- One or two independently controlled racing seats can join from a single device, with separate WebSocket seat credentials and separate hidden combat hands.
- Room capacity is still four total racers, regardless of number of devices.
- Supports 2+2, 2+1+1, four solos, and AI filling unused seats.
- Reconnect persists both seat credentials on the hosting/joining device.
- Car paint names and nickname collision handling from 4.4.1 remain in place.
- A second player on the same device is a guest seat in this initial implementation and does not have a separate persistent driver account.

## Team Racer: Pit Wars
- Optional **two-lap relay**: two teams of two racers, with four distinct on-board cars.
- One lead car from each team starts on the track. The reserve waits near the pit lane.
- The handoff is triggered **only when the lead racer reaches/crosses the actual checkered start/finish line**. The lead pulls off into the pit. The reserve enters from the game's existing pit-exit merge node, downstream of the checkered line, with lap one credited.
- If teammates share a device, the reserve swaps in automatically, without Gear Sync or interception.
- If teammates play on separate devices, the lead chooses a secret four-position gear order, each position once. Then the teammate and opposing reserve racer get the animated 1-2/3-4 gear control simultaneously; one locked guess each. A matched teammate sequence gives a seamless launch unless the opponent correctly intercepts first. Wrong or intercepted shifts cost one flip round.
- Repeating the team's prior handoff sequence causes shift failure; this history persists on same-room rematches.
- AI teams never guess/intercept human shift combinations. An AI or shared-screen relay automatically hands off.
- Public quick signals (Ascending/Descending/Mixed/Ready) may tip off rivals.
- Waiting human racers can send one cosmetic taunt every two flip rounds. Effects may be toggled off entirely by individual players, and reduced-motion is respected. Taunts do not block controls or alter race outcomes.
- Relay standings identify the winning team. Both teammates receive the team result when the Worker awards profile race statistics (where they have persistent profiles).

## Final 4.5 revision — Start-Line Perspective & Clockwise Tabletop Seating
- Player 1 always controls from the **bottom/base** of the screen, closest to the track start/finish line, independently of car color, nickname, or online room seat ID.
- With two local players on one device, Player 2 controls from the **top/opposite** station.
- With three local players, Player 2 is **left** and Player 3 is **top/opposite**; with four, Player 4 is **right**.
- Default shared-device sessions enable tabletop orientation. The TABLE button remains a manual toggle.
- Both local and online games open in **FIT** mode to show the full circuit from the start-line-facing orientation; FOLLOW remains available manually.
- Duo members joining an online room late are arranged as local Player 1 and Player 2 on their own screen, rather than inheriting the server's global seat numbers.
- AI and remote racers remain represented on the board/leaderboard without occupying inactive local control stations.
- On narrow phone screens, station controls stack in numbered order under the board without reserving empty tabletop rows.
- PWA cache version incremented to ensure installed versions receive the new client.

## Validation performed
- 52/52 Node automated tests passed, including room-level duo creation/join, relay trigger and entry position, shift sequence validation, interception, AI behavior, privacy, and classic race regression tests.
- The online form and Duo fields loaded in local headless browser layouts at 1280×800, 390×844, and 800×480 with no JavaScript page errors.
- The interactive shifter was exercised in local browser previews at mobile and desktop dimensions and visually inspected.
- The actual hosted two-device Cloudflare multiplayer deployment has **not yet been tested**; do not treat this as production-verified until deployed and playtested on two devices.
