# Development tracker

Last updated: 2026-09-25  
Current gate: Phase 2 playtest revisions are implemented and ready for a repeat owner playtest. Phase 1 was accepted by the owner.

Next authorized work: Owner retests the Phase 2 revisions and records acceptance or further feedback. Do not begin phase 3 until the owner accepts phase 2 and initiates it.

## Phase status

| Phase | Outcome                                                           | Status                  | Owner playtest | Notes                                                                                                                                                                                           |
| ----- | ----------------------------------------------------------------- | ----------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Runnable project, seeded world, player, cameras, asset foundation | Accepted                | Accepted       | Owner feedback: “Playtest was good.” Phase 2 explicitly requested on 2026-09-25.                                                                                                                |
| 2     | Controls, combat, simple enemies                                  | Awaiting owner playtest | Pending        | Owner requested five control/readability fixes after the first playtest. Revisions committed as `fad74b5`; build and formatting pass. Repeat the targeted playtest checklist before acceptance. |
| 3     | Complete extraction loop                                          | Not started             | Pending        | First playable run.                                                                                                                                                                             |
| 4     | Better procedural maps                                            | Not started             | Pending        | Seed regression suite.                                                                                                                                                                          |
| 5     | Better player navigation                                          | Not started             | Pending        | Dense-space click movement.                                                                                                                                                                     |
| 6     | 10,000-agent simulation                                           | Not started             | Pending        | Simulation benchmark.                                                                                                                                                                           |
| 7     | Performance and LOD                                               | Not started             | Pending        | Set final target after measurements.                                                                                                                                                            |
| 8     | Enterable buildings                                               | Not started             | Pending        | 2–4 room interiors.                                                                                                                                                                             |
| 9     | Separate asset editor                                             | Not started             | Pending        | Shared asset format.                                                                                                                                                                            |
| 10    | Walkable base camp                                                | Not started             | Pending        | Hub, shops, upgrades, destinations.                                                                                                                                                             |
| 11    | Weather, lighting, effects                                        | Not started             | Pending        | Preserve performance.                                                                                                                                                                           |

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
- [x] Apply Phase 2 playtest revisions: cursor-directed top-down dash with a cast cue and route replanning, shot-facing and enemy-hover cursor feedback, upward third-person aim, and right-shoulder framing.
- [ ] Owner retests responsiveness and combat feel in both views, including each requested revision.
- [ ] Owner accepts phase 2 or records further revisions.

## Evidence and playtest log

| Date       | Phase       | Build/commit       | Verification and result                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Owner feedback / next action                                                                             |
| ---------- | ----------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 2026-09-25 | Planning    | Documentation only | `plan.md`, `tracker.md`, and `HANDOFF.md` prepared. No game code or tests yet.                                                                                                                                                                                                                                                                                                                                                                                                                       | Start phase 1 when ready.                                                                                |
| 2026-09-25 | 1           | `03b2736`          | `npm run build` passed (554.45 kB minified bundle, 140.38 kB gzip; Vite advisory above 500 kB); `npm test` passed (3 tests); `npm run format:check` passed. Browser smoke in Codex in-app browser: scene rendered at 60 FPS / 16.7 ms in a 640×700 preview; same seed preserved layout/count (84), `MILL-ALPHA` changed it (81), view button and Tab toggled modes, drag-to-look rotated the camera. Pointer Lock was denied by the embedded browser; fallback verified. Host GPU/model unavailable. | At the time, awaiting owner playtest; the later `608776f` entry records owner acceptance.                |
| 2026-09-25 | 1           | `608776f`          | Owner reported “Playtest was good” and explicitly asked to continue with phase 2. Phase 1 accepted; no revisions recorded.                                                                                                                                                                                                                                                                                                                                                                           | Proceed with phase 2.                                                                                    |
| 2026-09-25 | 2           | `66a254c`          | `npm test` passed (11 tests); `npm run build` passed; `npm run format:check` passed. Embedded-browser smoke rendered both views at 59–60 FPS / 16.7 ms, confirmed top-down click routing and a ray-based hostile hit, and observed death/restart feedback. Embedded-browser Pointer Lock remains unavailable; drag-to-look works.                                                                                                                                                                    | Awaiting owner playtest of input responsiveness, encounter pacing, dash, and ability feel in both views. |
| 2026-09-25 | 2 revisions | `fad74b5`          | Owner feedback: top-down Q should dash toward the cursor, show a brief direction cue, and resume the planned route without backtracking; the player should face top-down shots; enemy hover should use a rectangular cursor; third-person aim should reach above the horizon; and the third-person camera should sit slightly right. Changes implemented. `npm run build` passed; formatting was applied. Automated tests and browser smoke were not rerun for this revision.                        | Awaiting repeat owner playtest of the fixes before Phase 2 acceptance.                                   |

## Open issues and revisions

| ID  | Phase | Issue or requested change                                                      | Priority | Status                | Resolution/evidence                                        |
| --- | ----- | ------------------------------------------------------------------------------ | -------- | --------------------- | ---------------------------------------------------------- |
| 2.1 | 2     | Verify the five owner-requested control and aiming fixes in a repeat playtest. | Medium   | Awaiting owner retest | Implemented in `fad74b5`; owner confirmation remains open. |

## Decisions to record

| Decision                                                | When needed                                | Current state                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference browser/hardware and final performance limits | Baseline in phase 1; final gate in phase 7 | Preliminary overlay baseline is 60 FPS / 16.7 ms in the Codex in-app browser at 640×700; host GPU/model is not exposed. Agree reference hardware before phase 7. |
| Third-person ability bindings                           | Phase 2                                    | Resolved: 1/2/3 map to field dressing, shock pulse, and adrenaline; the live controls panel mirrors the active view.                                             |
| Run pacing, starting gear, inventory/economy values     | Phase 3                                    | Open.                                                                                                                                                            |
| Exterior simulation behavior while inside a building    | Phase 8                                    | Open.                                                                                                                                                            |
| Art/audio licenses for public release                   | Before public release                      | Open.                                                                                                                                                            |

## Tracker rules

- Use the phase status names in `plan.md`; change status only when its evidence supports it.
- Keep failing checks open and log fixes with the next test/playtest result.
- Add new scoped backlog work here before implementing it.
- Record each owner playtest result explicitly. Only the owner can accept a phase and initiate the next one.
