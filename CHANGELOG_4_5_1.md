# Flip Cars 4.5.1 — All-in-One Hybrid Multiplayer + Menu Redesign

This package supersedes ALL previous Flip Cars 4.5 archives. The release includes the **unuploaded 4.5** Hybrid Party + Pit Wars release AND the **4.5.1** menu/interface improvements. Use one deployment; you do NOT need to deploy 4.5 first.

## New navigation

**Play → Classic Race or Pit Wars → On This Device or Online Party.**

Online Party → **Host Party / Join Party** → **1 or 2 racers on this device** → private 4-racer lobby. In Pit Wars, the host starts a fixed 2-lap relay; the active leader must cross the checkered line, park at pit entrance, and the teammate enters from PIT 2. Same-device partners automatically exchange; remote partners use Gear Sync, and an opponent reserve can intercept. AI does not guess the human code. One team's handoff never holds up the other team's race.

## Cleaned UI

- Symmetrical home screen: Play, Friends, Garage, Options, How to Play.
- Mode-specific race setup and collapsed race rules / car paint where appropriate.
- Four clear **racer seat** tiles in online lobby rather than four device boxes. Host-only race settings and Start.
- Friends Garage shortened to Crew / Chats / Activity / Requests & Invites, with contextual Find, Invitations, and Privacy.
- Audio, race rules, display and taunt accessibility grouped in Options.
- Compact in-game header and practical Pause / Race Menu. No redundant toolbar actions.
- Board remains prominent and existing 4.5 seating, duo input, PWA and combat/fullscreen remain intact.

## Limitations and live verification

Local browser menu navigation was checked at 1280x800, 390x844, and 800x480. Simulated Cloudflare room creation showed two seats for a duo and that the Pit Wars start request carries mode='team', laps=2, and remaining AI seats. Automated server gameplay tests pass. **A real deployed two-device live race, Gear Sync handoff, and install/update propagation still need manual verification after GitHub Pages + Cloudflare deployment.**

Driver profiles stored in one browser do not synchronize automatically to a different device. A duo consumes two seats, not two separate accounts.
