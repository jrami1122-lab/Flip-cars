# Flip Cars 4.1 — Tablet / UI polish

- Built directly on the full original **Flip Cars 4.0 Combat Circuit** ZIP (not 3.1/3.2).
- Replaced shrinking tabletop seat faces: rotated stations now use measured full available dimensions, without 0.70 scaling.
- All four local-player placemats contain movement deck, current flip, exactly two combat card positions, status/laps, and flip/route controls.
- New friendly, rounded card design and detailed inspect/Use Card/Back to Game interaction. Cards can be inspected when unavailable without consuming them.
- Moved full-hand choice into combat placemat.
- Cleaned board route signage; oil puddles now draw as highlighted black splashes on the space.
- Music begins with the first start click, defaulting to Retro unless an existing saved selection/off preference is set. Rev sample replaces movement reveal beep.
- Fixes selected Player 1 car color and prevents duplicate default paint colors in local races.
- Preserves version 4 combat distribution, online Worker, profile/guest support, combat outcomes, original media, and files.
- Tested responsive layouts in Chromium at 1280×800, 1024×600, 800×480, 640×360, 390×844, solo and four-player; tested local bubble, oil, full-hand replacement, color selection; original 11 backend tests passed.

**Not verified:** live Cloudflare deployment and two-device online racing. Site and Worker are not automatically updated by downloading this ZIP.
