# Development tracker

Last updated: 2026-09-25  
Current gate: Phases 1–4 are accepted. Phase 5 navigation is implemented and awaiting owner playtest.

Next authorized work: Owner playtests Phase 5 navigation in several city/forest layouts. Keep Phase 6 closed until Phase 5 is accepted.

## Phase status

| Phase | Outcome                                                           | Status                  | Owner playtest | Notes                                                                                              |
| ----- | ----------------------------------------------------------------- | ----------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| 1     | Runnable project, seeded world, player, cameras, asset foundation | Accepted                | Accepted       | Owner feedback: “Playtest was good.” Phase 2 explicitly requested on 2026-09-25.                   |
| 2     | Controls, combat, simple enemies                                  | Accepted                | Accepted       | Phase 2 targeting and camera revisions were playtested; the owner requested Phase 3 on 2026-09-25. |
| 3     | Complete extraction loop                                          | Accepted                | Accepted       | Owner reported “All green lights from my site” on 2026-09-25 and authorized the next phase.        |
| 4     | Better procedural maps                                            | Accepted                | Accepted       | Owner approved the seeded city/forest orientation revision and map quality on 2026-09-25.          |
| 5     | Better player navigation                                          | Awaiting owner playtest | Pending        | Dense-space routing, interactions, dynamic blockers, and recovery.                                 |
| 6     | 10,000-agent simulation                                           | Not started             | Pending        | Simulation benchmark.                                                                              |
| 7     | Performance and LOD                                               | Not started             | Pending        | Set final target after measurements.                                                               |
| 8     | Enterable buildings                                               | Not started             | Pending        | 2–4 room interiors.                                                                                |
| 9     | Separate asset editor                                             | Not started             | Pending        | Shared asset format.                                                                               |
| 10    | Walkable base camp                                                | Not started             | Pending        | Hub, shops, upgrades, destinations.                                                                |
| 11    | Weather, lighting, effects                                        | Not started             | Pending        | Preserve performance.                                                                              |

## Phase 1 checklist

Update a checkbox only when the work and its verification are complete. Add the commit reference and evidence below.

### 1.1 Project setup

- [x] Initialize Git and create an appropriate `.gitignore`.
- [x] Choose and lock the TypeScript/Three.js build and test toolchain.
- [x] Add development, build, test, and format commands.
- [x] Add a README with setup, controls, and supported browser.
- [x] Create a maintainable source layout and a launchable blank scene.

### 1.2 Seeded world

- [x] Generate a bounded city–forest prototype from an explicit seed.
- [x] Add terrain, roads/paths, obstacles, and at least one landmark.
- [x] Show the seed and allow repeatable reload.
- [x] Store/use collision data separately from visuals.
- [x] Add a deterministic generation test.

### 1.3 Player and cameras

- [x] Add a visible player with basic movement and obstacle collision; owner accepted the phase 1 playtest.
- [x] Add third-person follow/orbit and angled top-down follow.
- [x] Animate transitions in both directions without moving the player.
- [x] Handle resize, focus loss, pointer release, and camera obstruction safely; owner accepted the phase 1 playtest.
- [x] Show the current view and basic controls in the UI.
- [x] Play the movement-and-camera manual checklist while walking; owner reported the playtest was good.

### 1.4 Asset foundation and diagnostics

- [x] Define small authored asset files/modules with collision and interaction metadata.
- [x] Create two reusable props and one building shell; place them via generation.
- [x] Document the path for adding assets and future editor compatibility.
- [x] Add development diagnostics for FPS/frame time, entity count, and seed.
- [x] Record an initial normal-scene performance baseline.

### 1.5 Verification and owner gate

- [x] Build succeeds.
- [x] Automated tests pass.
- [x] Playable browser smoke check passes for rendering, seed reload, camera switching, and drag-to-look.
- [x] Changes are committed to Git (`03b2736`).
- [x] `HANDOFF.md` is updated with commands, results, commit, and known issues.
- [x] Owner playtests movement, camera comfort, and map readability.
- [x] Owner accepts phase 1 or revisions are recorded and completed.

## Phase 2 checklist

Update a checkbox only when the work and its verification are complete. Add the implementation commit and evidence below.

### 2.1 Controls and abilities

- [x] Show and enforce view-specific maps: third-person WASD/arrows and 1/2/3; top-down right-click pathing and W/E/R.
- [x] Keep Q as a 0.22-second dash with a 2.5-second cooldown and no energy cost in both views.
- [x] Add representative heal, shock/stun, and adrenaline abilities with visible cooldowns.
- [x] Preserve player position and active dash direction during camera switches; clear held movement keys on the switch.
- [x] Keep optional Pointer Lock, drag-to-look fallback, click aiming, static-world hit priority, and HUD input focus coherent.

### 2.2 Combat and enemies

- [x] Add a single hitscan rifle, static obstruction priority, damage, hit/death feedback, tracer, and muzzle flash.
- [x] Add three pursuers with obstacle-aware route pursuit and melee attacks.
- [x] Add player health, death overlay, restart, and a beatable encounter.

### 2.3 Movement and verification

- [x] Add top-down pathfinding around static colliders; keep direct third-person movement and collision.
- [x] Add tests for player damage/death, weapon and ability/dash cooldowns, input modes, and routing around an obstacle.
- [x] Build, automated tests, and formatting checks pass.
- [x] Browser smoke check confirms both control layouts, top-down route command, hostile ray hit, death/restart, and readable combat HUD.
- [x] Record the Phase 2 implementation commit and handoff.
- [x] Apply Phase 2 playtest revisions: cursor-directed top-down dash and route replanning, shot-facing, enemy-hover cursor and nearby-target assist, sustained fire with explicit cancellation, upward third-person aim, and a head-centered right-shoulder orbit with camera-aligned character facing.
- [x] Owner retests responsiveness and combat feel in both views, including targeting and shoulder stability.
- [x] Owner accepts phase 2 by requesting phase 3 after the revisions.

## Phase 3 checklist

### 3.1 Arrival and run navigation

- [x] Add an animated low-poly chopper approach and landing; begin in third person.
- [x] Let the player disembark into top-down view without changing world position unexpectedly.
- [x] Add a landing ring, world pointer, HUD direction arrow, and distance readout.
- [x] Provide a 12-second insertion window before initial hostiles pursue.

### 3.2 Loot and carrying

- [x] Place seven reproducible caches from the run seed, clear of static colliders and the landing zone.
- [x] Search a cache and create reproducible gear, supplies, credits, or fuel pickups.
- [x] Support click/F interactions, top-down approach routes, capacity limits, and partial pickup when cargo is nearly full.
- [x] Show cargo capacity and carried resource counts; credits are weightless.
- [x] Add a carried medical supply action and a minimal starter kit from available camp stock.

### 3.3 Horde pressure and extraction

- [x] Warn before two small reinforcement waves at 50/90 seconds and 110/150 seconds.
- [x] Keep extraction available after recovering at least one cache item; require the landing ring, no hostile within 3.5 m, and a four-second boarding hold.
- [x] Interrupt boarding when a hostile closes in; animate takeoff after a successful hold.

### 3.4 Death, camp, persistence, and phase gate

- [x] Lose carried items on death while preserving previously banked camp stock.
- [x] Bank carried items after extraction and return to camp for the next run.
- [x] Add a minimal quartermaster for gear, medical supplies, and a one-time cargo upgrade.
- [x] Validate versioned local save data and fall back safely for invalid or unavailable browser storage.
- [x] Add automated checks for cargo/banking, save recovery, deterministic loot, and tracked reinforcements.
- [x] Build, tests, formatting, and an embedded-browser arrival/disembark smoke pass.
- [x] Owner reports all green lights and authorizes Phase 4.

## Phase 4 checklist

### 4.1 Seeded districts and routes

- [x] Add named urban/forest districts with seed-specific building and vegetation placement.
- [x] Generate a varied road and trail network while keeping each road inside map bounds.
- [x] Add distributed loot regions and route the cache sites through them.
- [x] Add a second authored landmark and keep approaches readable and reachable.
- [x] Rotate the generated layout by seed so guaranteed urban/forest regions appear in different directions.
- [x] Color terrain from generated district data rather than a fixed west-to-east gradient.

### 4.2 Layout safety and route validation

- [x] Validate map bounds, collider overlap, chopper landing clearance, landmark approach points, and road bounds.
- [x] Check spawn, disembark, landmarks, and loot routes with the navigation grid.
- [x] Keep seven cache routes at or below the 145 m generation cap.

### 4.3 Seed regression and phase gate

- [x] Add a deterministic 24-seed layout and navigation regression batch; failing seed names are reported directly by the test.
- [x] Cover all four map orientations and assert both district types contain generated props in every regression seed.
- [x] Add multi-seed cache distribution and route-length checks.
- [x] Measure world-data generation over 24 seeds against a 50 ms p95 budget; orientation sample measured p95 1.86 ms and maximum 2.26 ms.
- [x] Complete the production build and formatting check; browser smoke on `PHASE4-00` regenerated from camp without console warnings/errors.
- [x] Rerun the full automated suite after the final 24-seed assertion adjustment (23 tests passed across five files).
- [x] Owner playtests multiple seeds and approves map orientation, route clarity, and chopper/loot accessibility on 2026-09-25.

## Phase 5 checklist

### 5.1 Dense-space routing

- [x] Smooth grid routes only across sampled walkable cells and preserve obstacle clearance at corners.
- [x] Route toward a reachable interaction radius instead of the center of blocked caches or extraction objects.
- [x] Rebuild a separate temporary navigation obstacle map from nearby moving hostiles without changing zombie pursuit routing.
- [x] Show latest/maximum route calculation time and current route state in development diagnostics.

### 5.2 Route recovery and interactions

- [x] Let a new destination replace the current route and Escape cancel it.
- [x] Replan after camera changes, dashes, and newly blocked route segments.
- [x] Detect lack of route progress, retry a bounded number of times, and report blocked/unreachable destinations.
- [x] Approach clicked or F-selected caches and pickups, then automatically complete the interaction from sensible range.

### 5.3 Verification and phase gate

- [x] Cover obstacle detours, interaction-range destinations, dynamic blockers, and route-clearance checks with deterministic tests.
- [x] Complete the full automated suite, production build, and formatting check.
- [x] Browser smoke confirms deployment/disembark, top-down controls, click-to-move routing, route telemetry, and arrival status.
- [ ] Owner playtests navigation in several layouts, including an interaction approach and moving-hostile pressure.

## Evidence and playtest log

| Date       | Phase        | Build/commit            | Verification and result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Owner feedback / next action                                                                             |
| ---------- | ------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 2026-09-25 | Planning     | Documentation only      | `plan.md`, `tracker.md`, and `HANDOFF.md` prepared. No game code or tests yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Start phase 1 when ready.                                                                                |
| 2026-09-25 | 1            | `03b2736`               | `npm run build` passed (554.45 kB minified bundle, 140.38 kB gzip; Vite advisory above 500 kB); `npm test` passed (3 tests); `npm run format:check` passed. Browser smoke in Codex in-app browser: scene rendered at 60 FPS / 16.7 ms in a 640×700 preview; same seed preserved layout/count (84), `MILL-ALPHA` changed it (81), view button and Tab toggled modes, drag-to-look rotated the camera. Pointer Lock was denied by the embedded browser; fallback verified. Host GPU/model unavailable.                                                                                                                                                | At the time, awaiting owner playtest; the later `608776f` entry records owner acceptance.                |
| 2026-09-25 | 1            | `608776f`               | Owner reported “Playtest was good” and explicitly asked to continue with phase 2. Phase 1 accepted; no revisions recorded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Proceed with phase 2.                                                                                    |
| 2026-09-25 | 2            | `66a254c`               | `npm test` passed (11 tests); `npm run build` passed; `npm run format:check` passed. Embedded-browser smoke rendered both views at 59–60 FPS / 16.7 ms, confirmed top-down click routing and a ray-based hostile hit, and observed death/restart feedback. Embedded-browser Pointer Lock remains unavailable; drag-to-look works.                                                                                                                                                                                                                                                                                                                   | Awaiting owner playtest of input responsiveness, encounter pacing, dash, and ability feel in both views. |
| 2026-09-25 | 2 revisions  | `fad74b5`               | Owner feedback: top-down Q should dash toward the cursor, show a brief direction cue, and resume the planned route without backtracking; the player should face top-down shots; enemy hover should use a rectangular cursor; third-person aim should reach above the horizon; and the third-person camera should sit slightly right. Changes implemented. `npm run build` passed; formatting was applied. Automated tests and browser smoke were not rerun for this revision.                                                                                                                                                                       | Awaiting repeat owner playtest of the fixes before Phase 2 acceptance.                                   |
| 2026-09-25 | 2 follow-up  | `658fb32`               | Owner requested forgiving top-down enemy clicks, continued attacks until a move/dash/empty click/view switch, and a third-person shoulder that does not swap sides during mouse orbit. Added an invisible 44 px screen-space assist for visible enemies, cooldown-paced fire while a target remains selected, target switching or cancellation on subsequent clicks, and a shoulder offset based on player facing. `npm run build` passed; automated tests and browser smoke were not rerun.                                                                                                                                                        | Awaiting repeat owner playtest of targeting, cancellation, and shoulder stability.                       |
| 2026-09-25 | 2 camera     | `841b6ff`               | Owner reported the third-person orbit still felt elliptical and asked to keep the camera over the right shoulder while the character looks where the camera points. The camera now follows a fixed-radius horizontal orbit with a camera-right shoulder offset, and the character faces the camera's horizontal look direction. Third-person follow lag is removed after the view transition. `npm run build` passed; automated tests and browser smoke were not rerun.                                                                                                                                                                             | Awaiting repeat owner playtest of the orbit and facing behavior.                                         |
| 2026-09-25 | 2 pivot      | `ac296d4`               | Owner clarified that pitch should orbit around the character's head, with the horizontal sweep staying on the right shoulder. Camera position now follows a fixed-radius sphere centered at head height; low camera height is clamped near the ground while upward aim remains available. The retest checklist now covers vertical pivot behavior. `npm run build` passed; automated tests and browser smoke were not rerun.                                                                                                                                                                                                                        | Awaiting owner retest of the head-centered orbit.                                                        |
| 2026-09-25 | 2 acceptance | Phase 2                 | Owner said Phase 2 had just been playtested and improved, then directly requested Phase 3. This is recorded as Phase 2 acceptance and authorization to begin Phase 3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Phase 2 accepted; begin Phase 3.                                                                         |
| 2026-09-25 | 3            | `bbfb321`               | `npm test` passed (5 files, 16 tests); `npm run build` passed (602.93 kB minified, 154.97 kB gzip; Vite advisory above 500 kB); `npm run format:check` passed. Embedded-browser smoke confirmed camp stock UI, touchdown and enabled disembark, smooth outward disembark and top-down transition, 14 m extraction guidance, full health through the 12-second insertion window, 60 FPS / 16.7 ms, and no browser console errors. At this checkpoint, full owner playtest was still pending; later accepted below.                                                                                                                                   | Historical smoke evidence; owner acceptance follows.                                                     |
| 2026-09-25 | 3 acceptance | Phase 3                 | Owner reported “All green lights from my site” after the Phase 3 playtest and authorized the next phase. Phase 3 accepted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Begin Phase 4.                                                                                           |
| 2026-09-25 | 4            | `4ff3475`               | Added five seeded districts, jittered city streets and forest trails, two landmarks including a new relay mast asset, and five region-based cache zones. `npm test` passed (5 files, 20 tests), including a 24-seed layout/navigation batch and four cache-route seeds. World-data generation across 24 seeds measured p95 1.93 ms, max 2.16 ms against a 50 ms p95 budget. `npm run build` passed (607.24 kB minified, 156.26 kB gzip; existing Vite advisory above 500 kB); formatting passed. Browser smoke on `PHASE4-00` confirmed landing, disembark, top-down view, 14 m extraction guide, 60 FPS / 16.7 ms, and no console warnings/errors. | Owner playtested and accepted, then requested biome-side variation by seed.                              |
| 2026-09-25 | 4 revision   | Phase 4                 | Rotated districts, roads, loot zones, landmarks, placements, colliders, and spawn together in four deterministic orientations. Terrain shading follows district data. The complete 23-test suite passed after the final 24-seed assertion adjustment; build and formatting passed. The owner then playtested the revised map and approved Phase 4.                                                                                                                                                                                                                                                                                                  | Phase 4 accepted; proceed with Phase 5.                                                                  |
| 2026-09-25 | 5            | Awaiting owner playtest | Added walkable-cell route smoothing and validation, range-based interaction approaches, refreshed hostile blockers on the player navigation grid, route replacement/cancel, bounded stuck recovery, automatic cache/pickup interaction, and route timing/status telemetry. `npm test` passed (5 files, 23 tests); `npm run build` passed (613.60 kB minified, 158.10 kB gzip; existing Vite advisory above 500 kB); formatting passed. Browser smoke confirmed deploy/disembark, route completion, Escape cancellation, 0.20 ms latest/max route request, and 60 FPS / 16.7 ms.                                                                     | Awaiting owner playtest of dense routes, interaction approach, and moving-hostile pressure.              |

## Open issues and revisions

| ID  | Phase | Issue or requested change                                                                                | Priority | Status                  | Resolution/evidence                                                                                                       |
| --- | ----- | -------------------------------------------------------------------------------------------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | 2     | Verify all requested targeting, sustained fire, dash, aiming, and shoulder changes in a repeat playtest. | Medium   | Resolved                | Owner requested Phase 3 after the Phase 2 playtest revisions; Phase 2 is accepted.                                        |
| 3.1 | 3     | Owner playtests repeated extraction, death loss, banking, save reload, and camp shopping.                | Medium   | Resolved                | Owner reported all green lights and authorized Phase 4 on 2026-09-25.                                                     |
| 4.1 | 4     | Verify varied routes, cache accessibility, landmark navigation, and chopper clearance over owner seeds.  | Medium   | Resolved                | Owner confirmed Phase 4 playtest passes on 2026-09-25.                                                                    |
| 4.2 | 4     | Guarantee both city and forest areas while changing their map-side placement by seed.                    | Medium   | Resolved                | Four deterministic map rotations move districts and map content; full 23-test suite passed and owner approved the retest. |
| 5.1 | 5     | Verify click-to-move route recovery, dynamic obstruction, and automatic interaction approaches.          | Medium   | Awaiting owner playtest | Unit tests and browser smoke pass; owner visual/play feel review remains.                                                 |

## Decisions to record

| Decision                                                | When needed                                | Current state                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference browser/hardware and final performance limits | Baseline in phase 1; final gate in phase 7 | Preliminary overlay baseline is 60 FPS / 16.7 ms in the Codex in-app browser at 640×700; host GPU/model is not exposed. Agree reference hardware before phase 7.                                                                                                                                                                                                                                                        |
| Third-person ability bindings                           | Phase 2                                    | Resolved: 1/2/3 map to field dressing, shock pulse, and adrenaline; the live controls panel mirrors the active view.                                                                                                                                                                                                                                                                                                    |
| Run pacing, starting gear, inventory/economy values     | Phase 3                                    | First pass: take one gear kit and one medical supply from camp if available; weighted cargo capacity is 10, or 15 with the 90-credit harness. Credits are weightless. City–forest deployment is free. Warnings come at 50/110 seconds and waves at 90/150 seconds. Extract after collecting at least one cache item, inside 6.5 m, with no hostile within 3.5 m, then hold for four seconds. Tune after owner playtest. |
| Phase 4 procedural route limits                         | Phase 4                                    | Five named districts shape building/vegetation placement; nine seed-jittered road/trail segments remain in bounds. Seven cache sites are spread over five named loot zones; placement rejects routes over 145 m from the chopper. A 24-seed test checks collider overlap, landing clearance, disembark, and landmark routes.                                                                                            |
| Phase 4 map generation budget                           | Phase 4                                    | The world-data generation budget is 50 ms at p95, measured before Three.js visual construction. The orientation-revision 24-seed sample measured p95 1.86 ms and maximum 2.26 ms on the current development host.                                                                                                                                                                                                       |
| Exterior simulation behavior while inside a building    | Phase 8                                    | Open.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Art/audio licenses for public release                   | Before public release                      | Open.                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Tracker rules

- Use the phase status names in `plan.md`; change status only when its evidence supports it.
- Keep failing checks open and log fixes with the next test/playtest result.
- Add new scoped backlog work here before implementing it.
- Record each owner playtest result explicitly. Only the owner can accept a phase and initiate the next one.
