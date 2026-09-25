# Development tracker

Last updated: 2026-09-25  
Current gate: Phase 1 implementation is ready for owner playtest.  
Next authorized work: Owner playtest and any phase 1 revisions. Do not begin phase 2 until the owner accepts phase 1 and initiates it.

## Phase status

| Phase | Outcome                                                           | Status                  | Owner playtest | Notes                                                                                                                               |
| ----- | ----------------------------------------------------------------- | ----------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Runnable project, seeded world, player, cameras, asset foundation | Awaiting owner playtest | Pending        | Code, build, tests, formatting, and browser smoke check are complete. Play movement/collision, camera comfort, and map readability. |
| 2     | Controls, combat, simple enemies                                  | Not started             | Pending        | Depends on phase 1 acceptance.                                                                                                      |
| 3     | Complete extraction loop                                          | Not started             | Pending        | First playable run.                                                                                                                 |
| 4     | Better procedural maps                                            | Not started             | Pending        | Seed regression suite.                                                                                                              |
| 5     | Better player navigation                                          | Not started             | Pending        | Dense-space click movement.                                                                                                         |
| 6     | 10,000-agent simulation                                           | Not started             | Pending        | Simulation benchmark.                                                                                                               |
| 7     | Performance and LOD                                               | Not started             | Pending        | Set final target after measurements.                                                                                                |
| 8     | Enterable buildings                                               | Not started             | Pending        | 2–4 room interiors.                                                                                                                 |
| 9     | Separate asset editor                                             | Not started             | Pending        | Shared asset format.                                                                                                                |
| 10    | Walkable base camp                                                | Not started             | Pending        | Hub, shops, upgrades, destinations.                                                                                                 |
| 11    | Weather, lighting, effects                                        | Not started             | Pending        | Preserve performance.                                                                                                               |

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

- [ ] Add a visible player with basic movement and obstacle collision; verify movement/collision in the owner playtest.
- [x] Add third-person follow/orbit and angled top-down follow.
- [x] Animate transitions in both directions without moving the player.
- [ ] Handle resize, focus loss, pointer release, and camera obstruction safely; owner to test focus/capture and obstruction.
- [x] Show the current view and basic controls in the UI.
- [ ] Play the movement-and-camera manual checklist while walking.

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
- [ ] Changes are committed to Git.
- [ ] `HANDOFF.md` is updated with commands, results, commit, and known issues.
- [ ] Owner playtests movement, camera comfort, and map readability.
- [ ] Owner accepts phase 1 or revisions are recorded and completed.

## Evidence and playtest log

| Date       | Phase    | Build/commit              | Verification and result                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Owner feedback / next action                                                                                                                                                       |
| ---------- | -------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-25 | Planning | Documentation only        | `plan.md`, `tracker.md`, and `HANDOFF.md` prepared. No game code or tests yet.                                                                                                                                                                                                                                                                                                                                                                                                                       | Start phase 1 when ready.                                                                                                                                                          |
| 2026-09-25 | 1        | Commit references pending | `npm run build` passed (554.45 kB minified bundle, 140.38 kB gzip; Vite advisory above 500 kB); `npm test` passed (3 tests); `npm run format:check` passed. Browser smoke in Codex in-app browser: scene rendered at 60 FPS / 16.7 ms in a 640×700 preview; same seed preserved layout/count (84), `MILL-ALPHA` changed it (81), view button and Tab toggled modes, drag-to-look rotated the camera. Pointer Lock was denied by the embedded browser; fallback verified. Host GPU/model unavailable. | Awaiting owner playtest: walk in both views, check collision and switching while walking, assess comfort/readability; test pointer capture/release in target browser if available. |

## Open issues and revisions

| ID  | Phase | Issue or requested change | Priority | Status | Resolution/evidence |
| --- | ----- | ------------------------- | -------- | ------ | ------------------- |
| —   | —     | None recorded yet.        | —        | —      | —                   |

## Decisions to record

| Decision                                                | When needed                                | Current state                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference browser/hardware and final performance limits | Baseline in phase 1; final gate in phase 7 | Preliminary overlay baseline is 60 FPS / 16.7 ms in the Codex in-app browser at 640×700; host GPU/model is not exposed. Agree reference hardware before phase 7. |
| Third-person ability bindings                           | Phase 2                                    | Open.                                                                                                                                                            |
| Run pacing, starting gear, inventory/economy values     | Phase 3                                    | Open.                                                                                                                                                            |
| Exterior simulation behavior while inside a building    | Phase 8                                    | Open.                                                                                                                                                            |
| Art/audio licenses for public release                   | Before public release                      | Open.                                                                                                                                                            |

## Tracker rules

- Use the phase status names in `plan.md`; change status only when its evidence supports it.
- Keep failing checks open and log fixes with the next test/playtest result.
- Add new scoped backlog work here before implementing it.
- Record each owner playtest result explicitly. Only the owner can accept a phase and initiate the next one.
