# Development tracker

Last updated: 2026-10-03

Current status: Phases 1–17 remain **Accepted** and owner-reviewed. Phase 18 is **Awaiting owner playtest**. Its implementation, regression tests and deployment/UI smoke checks are complete; the full extraction/escort/interior flow and reference-desktop performance review remain open for the owner. No earlier phase gate is reopened.

Phase 10 accepted scope: the camp and field use the same shaped backpack without adding items on deployment. Extraction preserves contents and layout; death loses carried contents and reissues the starter rifle and three grenades while banked resources and safe-reserve items remain protected. The inventory supports item dragging, ground drops/pickups, equipped firearms, field cache items, a scrap-to-credit service, and a food buy/sell stand. The scrap hut, worker, piles, and navigation colliders were moved to the east side of camp, clear of the chopper pad. The 2026-09-27 follow-up reports a passing build, 55 tests, and browser checks of both inventory screens, a dropped grenade carried through deployment, and the relocated vendor. The owner completed the Phase 10 playtest and accepted it on 2026-09-29 after the reported fixes.

Next: playtest Phase 18 using the checklist in `README.md`. Optional phone testing remains outside this desktop phase.

## Phase status

| Phase | Outcome                                                           | Status   | Owner playtest | Notes                                                                                                                                                                                                                                                 |
| ----- | ----------------------------------------------------------------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Runnable project, seeded world, player, cameras, asset foundation | Accepted | Accepted       | Owner feedback: “Playtest was good.” Phase 2 explicitly requested on 2026-09-25.                                                                                                                                                                      |
| 2     | Controls, combat, simple enemies                                  | Accepted | Accepted       | Phase 2 targeting and camera revisions were playtested; the owner requested Phase 3 on 2026-09-25.                                                                                                                                                    |
| 3     | Complete extraction loop                                          | Accepted | Accepted       | Owner reported “All green lights from my site” on 2026-09-25 and authorized the next phase.                                                                                                                                                           |
| 4     | Better procedural maps                                            | Accepted | Accepted       | Owner approved the seeded city/forest orientation revision and map quality on 2026-09-25.                                                                                                                                                             |
| 5     | Better player navigation                                          | Accepted | Accepted       | Owner: “Playtest 5 - all fine! I tested and everything works.” Approved on 2026-09-25.                                                                                                                                                                |
| 6     | 10,000-agent simulation                                           | Accepted | Accepted       | Owner playtest was good; reported stable 60 FPS and 17 ms or less per frame with 10,000 enemies on 2026-09-25. Environment unspecified.                                                                                                               |
| 7     | Rendering and performance pass                                    | Accepted | Accepted       | Owner closed Phase 7 on 2026-10-01 after the three-tier approved-catalog LOD rollout and a 20-minute session reporting mostly 50+ FPS; the busiest 10k-horde/map combination was typically 40+ FPS with two brief dips to 35. Phone testing deferred. |
| 8     | Enterable buildings                                               | Accepted | Accepted       | Owner reported the Phase 8 playtest succeeded on 2026-09-26 after the entry-clearance fix.                                                                                                                                                            |
| 9     | Separate asset editor                                             | Accepted | Accepted       | Owner confirmed the native color picker now updates the editor and marked Phase 9 complete on 2026-09-26.                                                                                                                                             |
| 10    | Walkable base camp and shared inventory/economy                   | Accepted | Accepted       | Owner completed the combined camp, inventory, vendor, persistence, map-availability, departure, and extraction/death review on 2026-09-29; reported issues were fixed.                                                                                |
| 11    | Weather, lighting, effects                                        | Accepted | Accepted       | Owner completed the combined atmosphere, accessibility, visual comfort, effects, and audio review on 2026-09-29; reported issues were fixed.                                                                                                          |
| 12    | Candidate asset review and integration                            | Accepted | Accepted       | Owner reviewed the 38 integrated approved models in game as part of the completed Phase 13 regional review on 2026-09-29.                                                                                                                             |
| 13    | Seeded themed regions and asset placement                         | Accepted | Accepted       | Owner completed all four rotations, both camera views, themed placements, approaches, and cache routes on 2026-09-29; reported issues were fixed.                                                                                                     |

| 14 | Extraction horde pressure | Accepted | Accepted | Owner reviewed the seeded pressure curve, unified combat routing, dead-agent removal, far cylinder LOD, and indoor pause/resume flow; gate closed 2026-10-03. |
| 15 | Dormant horde and noise awareness | Accepted | Accepted | Owner reviewed dormant activation, local roaming, noise response, focus decay, and pause behavior; gate closed 2026-10-03. |
| 16 | Combat feedback and field interaction polish | Accepted | Accepted | Owner reviewed combat and pickup feedback, movement abilities, pointer behavior, explosive barrels, blood trails, and world LOD changes; gate closed 2026-10-03. |
| 17 | Camp atmosphere, settlement density, and first-person view | Accepted | Accepted | Owner reviewed camp presentation, panorama, gate and service routes, all three camera views, controls, and performance; gate closed 2026-10-03. |

| 18 | Aim, progression tree, companion/rescues, sorties, camp edge and mission scenery | Awaiting owner playtest | Pending | Automated regressions and production build pass; camp/menu/deployment/all-view smoke passed. Full extraction/escort/interior gameplay and reference-desktop profiling require owner review. |

## Phase 18 checklist — 2026-10-03

Implementation commit: `3117b5f`.

- [x] Perspective-only held aim, enlarged top-down target assistance, persistent engagement, and distinct bounded procedural firearm sounds.
- [x] Connected, pannable/zoomable progression web; permanent credit-funded SMG/M4A; point-funded character, grenade, turret and companion branches; free skill-point respec.
- [x] Handgun starter, free capacity-based grenade refill, capped non-stacking incendiary patches, readable item list, and separate Armory/Skill Tree tabs.
- [x] Save migration retains credits, gear, reserve, grenade capacity and legacy firearms as permanent unlocks; extraction grants permanent points and first-clear bonuses; death preserves banked progression.
- [x] Run-only companion hire, navigation/follow/regroup, scout-target mirroring and bounded local defense; survivor escort retains health/context across door transitions without teleporting distant survivors into safety.
- [x] Seeded alarm event and occasional survivor event at reachable cache/landmark approaches, extraction-only objective rewards and permanent named resident contributions.
- [x] Free standard and 2-fuel high-yield previews/deployment; doubled reachable crates, initial population, reinforcement pace and indoor encounters; higher-value loot; unchanged hostile health/damage and 10,000 cap.
- [x] Closed/open animated camp gates, synchronized collision/navigation and a walkable exterior with shared tree colliders and LODs.
- [x] Mission panorama, player-centered 150–200 m fog, close-only batched ground dressing, denser route-safe forest, shoreline-preserving waves and 60-second floating-arrow delay.
- [x] Regression suite: 35 files / 108 tests; production build, scoped formatting and whitespace checks pass. The local 10,000-agent + companion/fire simulation sample measured 0.90 ms mean / 4.20 ms p95; rendering and reference-desktop validation are excluded.
- [x] Browser smoke: camp inventory/Armory/tree, hire, risk/fuel previews, high-yield launch, all three views, delayed guidance, no console warnings/errors, and zero-fuel standard availability.
- [ ] Owner verifies successful extraction summary, respec/weapon handling, fire, escorted rescues, alarm shutdown, interior transitions, gate traversal and return routes.
- [ ] Owner profiles high-yield horde/companions/scenery/effects on the Phase 7 reference desktop and reviews pacing, audio and scenery.
- [ ] Owner explicitly accepts Phase 18.


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
- [x] Owner playtests navigation in several layouts, including an interaction approach and moving-hostile pressure; owner reports all fine and authorizes Phase 6 on 2026-09-25.

## Phase 6 checklist

### 6.1 Reproducible stress scene

- [x] Add count controls for 100, 1,000, 5,000, and 10,000 tracked agents.
- [x] Add seed, wide-ring/eight-cluster/grid spawn patterns, and third-person/top-down camera selection.
- [x] Render horde bodies through an instanced batch and provide a clear end-stress action back to camp.

### 6.2 Scalable behavior and stable tiers

- [x] Keep agent IDs, positions, health, attack counts, and alive state in stable per-agent arrays.
- [x] Add near/mid/far simulation cadences, local spatial-grid queries, crowd separation, and local obstacle deflection without individual A* paths.
- [x] Add targeted-agent query, tier counts, nearest-agent display, attack pressure, and per-step simulation timing.
- [x] Let a click damage a visible agent through the instanced batch; remove defeated agents from queries without reusing their identity.
- [x] Test deterministic spawns, 10,000 finite tracked agents, state retention across a tier change, pursuit, and nearby attacks.

### 6.3 Benchmark and phase gate

- [x] Measure fixed simulation steps at 100, 1,000, 5,000, and 10,000 agents with a repeatable seed/pattern; exclude scene creation and rendering.
- [x] Complete automated tests, production build, and formatting check.
- [x] Browser smoke confirms a 10,000-agent horde loads and updates; nearby agents reach and attack the player; no console warnings/errors.
- [x] Owner playtests the horde; owner reports a good playtest and stable 60 FPS / 17 ms or less per frame with 10,000 enemies on 2026-09-25. Phase 6 accepted; no issues reported.

## Phase 7 completion record

- [x] Add three distance-based LOD levels for every approved world-catalog asset; retain hand-authored low models for pine trees and burned-tree clusters.
- [x] Owner reports a 20-minute post-LOD session with FPS mostly above 50; the heaviest horde/busiest-map combination was typically 40+ FPS, with two brief dips to 35.
- [x] Owner accepted and closed Phase 7 on 2026-10-01. Phone testing is deferred and is not part of this acceptance.

## Parked follow-ups (non-blocking)

- If a later performance regression or optimization need arises, collect more detailed frame-time and capture-condition data. This is optional and does not reopen Phase 7 by itself.
- Profile a Pixel-class phone when the owner begins mobile testing; no phone performance claim is made yet.

## Phase 8 checklist

### 8.1 Seeded interiors

- [x] Generate deterministic, connected 2–4 room layouts from the world seed and building ID.
- [x] Build reusable room floors, walls, exit framing, and furnishing pieces with matching collision data.
- [x] Keep the entrance, room centers, loot, and infected encounter reachable in a multi-seed navigation test.

### 8.2 Run integration

- [x] Make generated city building doors selectable and usable with F; support top-down click-to-approach.
- [x] Enter a building, switch to the interior collision/navigation/camera context, and return to the saved outdoor position.
- [x] Add interior loot and an infected encounter; preserve collected loot and defeated infected for the rest of the run.
- [x] Pause the outdoor run timer and horde while inside; keep player health and ability cooldowns active.
- [x] Preserve the selected camera view and heading across entry/exit; constrain the camera to interior walls.

### 8.3 Verification and owner gate

- [x] Add deterministic layout and room-navigation tests; verify generated exterior entrances across the seed regression batch.
- [x] Complete `npm test`, production build, and formatting checks.
- [ ] Browser smoke confirms building-door entry, interior camera/navigation/combat/loot, same-position exit, and resumed outdoor simulation.
- [ ] Owner playtests room clarity, controls in both views, encounter/loot persistence, and exterior pause/resume; record acceptance or revisions.

## Phase 9 checklist

### 9.1 Shared asset editing

- [x] Build a separate Asset Bench page from the same five authored asset definitions used by the game.
- [x] Preview asset variants with orbit and zoom controls, plus near and far camera presets.
- [x] Inspect and edit placement dimensions, optional collision, interaction points, material color, roughness, and metalness.
- [x] Save and reopen a versioned portable JSON document; reject unsupported versions and invalid values with clear messages.

### 9.2 Game integration and gate

- [x] Apply a valid Asset Bench document before game world generation so its bounds, collision, materials, and building interaction points are used directly.
- [x] Provide a direct Asset Bench action to apply the current document and enter the game.
- [x] Automated coverage passes: 9 files, 37 tests; production build and formatting pass.
- [x] Local browser smoke imported an asset JSON document, applied the boulder material edit, opened Last Light, and started a generated run; console warning/error capture was empty.
- [x] Owner confirmed the OS color picker now updates the swatch and preview; Phase 9 playtest accepted on 2026-09-26.

## Phase 10 checklist

### 10.1 Walkable hub and services

- [x] Build a bounded, gated camp with guard towers, guards, friendly NPCs, barracks, clinic, storage, quartermaster, operations board, and chopper pad.
- [x] Add camp-specific collision/navigation and top-down click-to-route; keep both camera views and the quick terminal available.
- [x] Connect quartermaster buy/sell and one-time cargo upgrade to the existing save data and item rules.
- [x] Add reachable building entrances that reuse the generated interior system and return to the camp without starting a run.
- [x] Keep Greywood (city–forest) available; show military base and large city as unavailable; do not charge fuel for Greywood.
- [x] Add tests for camp service/building reachability, gate/fence navigation, shop transactions, credit limits, and upgrade constraints.
- [x] Add a shared shaped backpack, firearm equipping, ground drops/pickups, field-cache items, starter-kit migration, and extraction/death persistence.
- [x] Add reachable scrap-yard and food-stand transactions; keep item placement and saved currencies consistent across camp and field.
- [x] Complete `npm test`, production build, and formatting checks.
- [x] Browser smoke confirms camp load, route to a service and interact, enter/exit a camp building, open the terminal, and deploy into Greywood.
- [x] Follow-up verification reported 55 tests and browser checks of the camp/field inventory, a grenade dropped in camp and retained through deployment, and the relocated scrap vendor; build passed.
- [x] Owner completed the camp navigation, service-menu, economy, backpack drag/drop/pickup, persistence, map availability, departure, and extraction/death-loss review on 2026-09-29; reported issues were fixed and Phase 10 accepted.

### 10.2 Decisions

- The camp is a separate safe scene and navigation context. Its two enterable buildings use the Phase 8 interior generator; the run timer, threats, and carried cargo do not apply in the camp.
- The world terminal is available with M, while nearby physical services and doors use F. Greywood has no fuel charge; unavailable destinations remain disabled until their maps are built.
- First-pass prices: field gear 50 credits, two medical supplies 35, cargo harness 90 once; the quartermaster pays 25 for gear and 12 per supply. Final economy feel is for owner playtest.
- Existing save schema remains version 1. Camp stock and cargo upgrade use the current saved inventory/upgrade fields.

## Phase 11 checklist

### 11.1 Atmosphere and feedback

- [x] Add seeded-per-run low-sun/high-moon lighting and clear/mist/rain weather presets; keep the selected preset fixed for the run.
- [x] Add outdoor rain and distant thunder, restrained camera shake, pooled firing/ability/hit particles, damage vignette, and quiet synthesized action/weather cues.
- [x] Add persistent options for time/weather preferences, reduced motion and shake, reduced flashes, rain visibility, audio cues, and shake intensity.
- [x] Make accessibility controls apply immediately; apply lighting and weather selection to the next deployment.
- [x] Add tests for settings defaults/sanitization/persistence, stable preset selection, atmosphere modes/reduced flashes, and bounded camera shake.
- [x] Complete `npm test`, production build, formatting, and whitespace checks.
- [x] Browser smoke covers settings interaction, preset stability, rain toggle, a normal rainy field run, and the 10,000-agent stress scene.
- [x] Owner completed the visual comfort, atmosphere, accessibility, effects, and audio review together with Phase 10 on 2026-09-29; reported issues were fixed and Phase 11 accepted.

### 11.2 Decisions

- Lighting and weather can be set to a named preset or selected deterministically from the run seed. Changing a visual preset never changes the active run; it takes effect on the next deployment.
- Reduced motion removes camera shake and motion-driven burst effects. Reduced flashes suppresses brief impact flashes and thunder flashes. Rain visuals and audio cues can be disabled independently.
- The rain renderer and hit particles use one instanced draw call each. Thunder and action cues are synthesized locally through Web Audio; no external audio assets were added.
- Atmosphere preferences use `last-light-atmosphere-options`, version 1, separate from campaign save data. Reduced motion follows the operating-system preference when no saved value exists.

## Phase 12 checklist

- [x] Review and record dispositions for the owner-approved asset batches: 16 initial models and 22 additional models.
- [x] Integrate the 38 approved models into `src/assets/`, register them in the catalog, and keep review sheets in `docs/asset-reviews/`.
- [x] Place the approved assets in eligible Phase 13 theme pools and validate bounds, collisions, landmarks, and interaction approaches.
- [x] Owner confirmed the integrated models' appearance and usability during the completed Phase 13 four-rotation review on 2026-09-29; Phase 12 accepted.

## Phase 13 checklist

### 13.1 Seeded layout and placement pools

- [x] Define urban, forest, farm, military, coastal, and survival-camp pools with role weights, terrain colors, density, spacing, and per-asset variant counts in `src/world/regionThemes.ts`.
- [x] Generate connected city/forest footprints and four outer themed regions before asset placement; rotate districts, roads, water, landmarks, loot zones, spawn, and placements together by seed.
- [x] Place the 38 owner-approved models in their intended theme pools, with weighted local dressing and a coastal water boundary; the second batch includes dedicated utility, street, rural, military, coastal, and camp infrastructure.
- [x] Check region eligibility and bounds, asset and collider overlap, chopper clearance, landmark approaches, existing building entrances, and authored interaction approaches.
- [x] Add deterministic same-seed, rotation, theme-pool, connected-footprint, objective-route, and 16-seed regression coverage; retain the 24-seed generation-time report.
- [x] Add a canonical region schematic and Phase 13 owner checklist to the README and `docs/world-themes.md`.
- [x] Owner completed the four-rotation, both-camera review of themed set pieces, interaction approaches, and cache routes on 2026-09-29; reported issues were fixed and Phase 13 accepted.

## Phase 14 checklist

- [x] Initialize regular outdoor runs with 20 seeded, walkable horde agents; schedule one additional agent every two outdoor seconds, up to the established 10,000-agent capacity.
- [x] Route outdoor simulation through the scalable near/mid/far horde tiers; pause its movement and spawn clock inside buildings and while the backpack pauses gameplay.
- [x] Connect field horde agents to weapon ray hits, top-down assist, turret, artillery, grenades, player damage, and extraction interruption.
- [x] Share the zombie design across the Horde Lab, field horde, and indoor encounters; expose living/spawned counts in the run HUD.
- [x] Verify near/mid multipart and far cylinder LODs, including correct hit-to-agent mapping during tier changes.
- [x] Verify dead horde instances leave their render pools and defeated indoor views leave the scene.
- [x] Production build passes after the Phase 15 implementation.
- [x] Run automated checks and browser smoke for both views, abilities, extraction, and building pause/resume.
- [x] Repeat owner playtest for dead-agent despawning, cylinder readability, pressure curve, and performance; fix issues and repeat playtest as needed.

### Phase 14 implementation notes (historical checkpoint; phase later accepted)

- The initial 20 positions use the world seed and the Phase 6 ring distribution. Later agents use the same seeded random stream and appear 82–128 m from the scout at a walkable map position.
- The existing 12-second insertion grace remains. Once awake, agents use the Phase 6 no-per-agent-A* steering and 30 Hz / 6.25 Hz / 2 Hz near/mid/far update cadence. Phase 15 now leaves agents beyond 92 m dormant rather than running those behavior updates. Capacity remains 10,000.
- Third-person aim now checks the camera ray against live horde positions as well as rendered geometry, so multipart gaps and LOD changes do not make an aimed zombie unhittable.
- The outdoor timer and spawn clock pause in interiors, matching Phase 8; backpack pause behavior also pauses the horde simulation. Agents retain health, location, and identity while paused.
- Indoor encounters and near/mid horde agents share the multipart low-poly zombie model. The far horde tier uses simple instanced cylinders, and compact per-tier instance slots remove dead agents from rendering and preserve correct hit-to-agent identity.
- The owner reported that dead zombies remain visible after death and requested cylinder far LODs. Those revisions and a Phase 15 plan for dormant agents, local roaming, and noise-based awareness are recorded on 2026-10-01.
- The production build passes with the Phase 14 revisions and Phase 15 implementation. Automated checks, browser smoke, and the repeat owner playtest have not yet been run for Phase 14.

## Phase 15 checklist

- [x] Keep far agents dormant in a spatial index with their position, health, identity, and render tier intact; update only the active simulation roster.
- [x] Wake agents inside the 92 m proximity radius; use deterministic local roaming and return them to dormancy when they leave that radius.
- [x] Add a field noise meter: walking maintains a 10 m radius while moving, while rifle fire, dash, turret fire, artillery, and grenades can raise it up to 140 m; noise decays at 0.12 per second after movement and loud actions stop.
- [x] Draw a subtle terrain-following circle around the scout that grows and fades with the current noise awareness radius.
- [x] Have aware agents investigate the latest noise location, then focus on the scout; let focus fade after the awareness radius contracts past them.
- [x] Preserve targeting, health, identity, and near/mid/far visuals as agents move between dormant and active state.
- [x] Verify that building entry and backpack pause freeze outdoor behavior and noise decay; verify seeded positions and local roaming on repeated runs.
- [x] Production build passes after the Phase 15 implementation.
- [x] Run focused regressions, the full automated checks, and browser smoke in both camera views.
- [x] Owner playtests quiet travel, noise response, extraction pressure, and performance; resolve feedback and repeat before acceptance.

### Phase 15 implementation notes (historical checkpoint; phase later accepted)

- The simulation activates agents at 92 m, matching the existing far-to-mid visual boundary so dormant agents remain in the cylinder tier. Active agents that leave the radius sleep at their current location; their health and numeric ID remain in the same typed-array slot.
- Each agent's local roaming stream is derived from the world/horde seed and stable ID. Its waypoints stay within a 16 m patch around its activation/roam anchor.
- Noise level is normalized from 0 to 1 and maps linearly to a 0–140 m radius. Walking refreshes a 10 m floor only when the scout is moving and the existing radius has decayed below that floor; after movement stops, noise decays by 0.12 per second. Investigating lasts up to 1.1 seconds before focused pursuit; focus decays over 1.6 seconds after leaving the awareness radius.
- These were initial tuning values before owner review. Outdoor simulation and noise decay pause inside buildings and while the backpack is open.
- At this checkpoint, the production build passed while automated checks, browser smoke, and owner playtest were pending; the phase was later verified and accepted.

## Phase 16 checklist — accepted 2026-10-03

- [x] Add pooled, efficient blood particles on enemy shot hits, a subtle hit flash, and modest directional knockback; test effects and damage behavior at relevant LODs.
- [x] Confirm artillery ground impacts produce slight camera shake; add it only if absent, and test shake intensity and reduced-motion behavior.
- [x] Add low-poly blood marks trailing shot-wounded moving enemies; fade each after 10 seconds, disable creation above 500 living enemies, and re-enable only below 100.
- [x] Show an animated F keycap above pickup items only inside pickup range; test range changes and press feedback.
- [x] Add hold-Shift sprint and raise adrenaline's current +50% bonus by about three times, targeting +150% bonus / 2.5× base speed; test the combined speed behavior.
- [x] Add the nearby-character pickup feed: FIFO ordering, newest at the bottom, three-second visible lifetime, fade/removal, and upward movement of remaining entries.
- [x] In third person, automatically request pointer lock, unlock with Escape or one Ctrl press, and relock on game-scene clicks while excluding HUD clicks; cover browser denial fallback.
- [x] Add an approved low-poly explosive barrel with detailed, low, and very-low LODs; a shot causes two red blinks across a two-second fuse and then the shared artillery explosion and damage.
- [x] Change the lowest approved world-asset LOD transition from 200 m to 120 m, keep the middle transition at 58 m and preserve its hysteresis; test boundary behavior.
- [x] Run focused regression tests for the features and edge cases above, then the full test suite and production build.
- [x] Brief browser smoke touched both camera views, top-down movement/fire, and the denied Pointer Lock fallback; a fresh reload after the console fix added no new Three.js errors. The owner later completed the visual review and accepted the phase.
- [x] Owner visual gameplay review of pickup/combat flow, effects, sprint/adrenaline, barrels, pointer-lock controls, and performance. The owner asked to defer further visual gameplay testing until this review.

### Phase 16 owner revisions — 2026-10-03 (historical checkpoint)

- Implemented requested background-free pickup list directly left of the character, dark-red barrel shell/cap blinks with a red halo, and removal of the exploded barrel placement.
- Raised the third-person follow pivot by 0.9 m for a clearer view and aim.
- Verification: `npm test` passed (24 files, 76 tests); production build passed with the existing shared-chunk size advisory. Targeted formatting checks and `git diff --check` passed.
- At this checkpoint the repeat owner playtest was pending; the final owner review below records acceptance.

### Phase 16 implementation notes (historical checkpoint; phase later accepted)

- Artillery ground impact already called the camera-shake effect. It now uses the existing reduced-motion gate and configured intensity; the helper returns zero for reduced motion and caps shake at 0.16.
- “Three times the current adrenaline boost” is implemented as tripling the existing +50% bonus to +150%, or 2.5× base movement speed. Shift sprint is 1.45×; the modifiers multiply to 3.625× together and need feel review during owner playtest.
- The embedded browser denied Pointer Lock, so the drag-to-look fallback appeared. A brief smoke reached both camera modes and top-down movement/firing; the user asked that further visual gameplay checks wait for their review.
- Console review found a pre-existing empty-spread `Group.add(...[])` in generic world LOD generation. Guarded the empty case and added a regression test. A fresh browser reload emitted no new Three.js errors; the console log still contains earlier entries from before the fix.
- Pickup feed entries remain fully visible for three seconds, then fade for 0.42 seconds before removal.

## Phase 17 checklist — accepted 2026-10-03

- [x] Warm the direct sun and cool the ambient fill using existing lights; keep the lighting change outside the post-processing pipeline.
- [x] Distinguish packed earth from grass with a beige/gray palette and one reusable 64×64 grit texture on camp paths and field trails.
- [x] Add low-poly grass and stone dressing in four instanced batches; update detailed clumps within 20 m, one-shape far LOD beyond 20 m, and cull beyond 60 m.
- [x] Make Wayfarer Camp denser with six tents, civilian residents and seated survivors, a communal fire, crate/supply dressing, bolted scrap panels, collidable reinforced gate leaves, and barbed wire.
- [x] Load the supplied 1800×1024 `skybox_hub.png` as the camp's equirectangular-style panorama background.
- [x] Replace the capsule scout with separate torso, head, arms, legs, boots, equipment, and an animated walk rig.
- [x] Add first-person as the third Tab view, hide the player body after the camera transition, and show the camera-mounted rifle with center-reticle fire and direct camera-relative movement.
- [x] Production build passes: `npm run build`.
- [x] Regression coverage passes for first-person camera/input/presentation, perspective dash, panorama reuse, decoration tiers/batching/culling, dirt texture/UVs, and expanded camp/gate reachability: 27 files, 84 tests; production build passes.
- [x] Owner playtest camp density, dirt/grass readability, panorama framing, gate appearance/navigation, all three camera views, controls, and desktop frame rate.

### Phase 17 implementation notes (historical checkpoint; phase later accepted)

- The source panorama is a 1800×1024 wide sunset landscape, not a six-face cubemap. A standard equirectangular mapping works as a first pass and may stretch the sides slightly.
- The packed-dirt image is a deterministic 64×64 `DataTexture` shared between the camp paths and generated field trails. It adds a sampler but no extra geometry or render pass.
- Ground details swap at 20 m; one-shape far instances remain through 60 m. Grass, far grass, nearby stones, and far stones use four instanced draw batches with shadows disabled.
- The reinforced gate leaves have matching navigation colliders and leave a 2.7 m pedestrian opening aligned with the camp entrance. Ground decorations do not add path obstacles; tents and the communal fire also have matching navigation colliders.
- `Tab` cycles third-person → top-down → first-person → third-person. First-person shares direct movement and ability bindings with third-person, uses a center reticle, and has a camera-mounted weapon viewmodel.
- At this checkpoint, the production build and scoped formatting passed. Automated tests and visual review were still pending; the later code review and owner acceptance are recorded above.

## Historical evidence and playtest log

| Date       | Phase                            | Build/commit       | Verification and result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Owner feedback / next action                                                                                                                                                                                                   |
| ---------- | -------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-10-01 | 16 implementation                | `3b63ee8`          | `npm test` passed: 23 files, 75 tests, using one worker so the existing world-generation p95 benchmark runs without concurrent test-file load. `npm run build` passed; Vite retains its advisory for the shared ~736 kB asset-document chunk. Targeted Prettier checks passed for changed source, README, and handoff files; `tracker.md` keeps its existing table layout. `git diff --check` passed. Browser smoke briefly covered both camera views, top-down route/fire, and the pointer-lock denial fallback. After guarding the empty mesh list in world LOD generation, a fresh browser reload added no new Three.js console errors. Full visual pickup/combat-flow testing is deferred to the owner.                      | Phase 16 implementation is complete and awaits owner gameplay review. Phase 14/15 acceptance gates remain separately unresolved.                                                                                               |
| 2026-10-03 | 17 implementation                | In progress        | Added warm/cool lighting, a shared packed-dirt texture, batched grass/stone LODs, a denser reinforced camp, the supplied panorama background, an articulated scout, and a camera-mounted first-person rifle. `npm run build` passed; Vite emits the imported skybox asset and retains the existing shared asset-document chunk advisory. No automated tests or browser gameplay checks were run.                                                                                                                                                                                                                                                                                                                                 | The owner explicitly requested Phase 17 while Phases 14–16 remain open. Add regression coverage and complete the owner visual playtest.                                                                                        |
| 2026-10-01 | 16 planning                      | —                  | Scoped combat feedback and pickup presentation, sprint/adrenaline tuning, third-person pointer lock, explosive barrels, blood-trail population hysteresis, and the lowest world-asset LOD transition at 120 m. Added future regression-test, build, browser-smoke, and owner-playtest gates. No code changes or tests were made for Phase 16.                                                                                                                                                                                                                                                                                                                                                                                    | Phase 16 is planned and not started. Phase 14 remains the current open gate; Phase 15 precedes Phase 16.                                                                                                                       |
| 2026-10-01 | 15 implementation                | —                  | Added dormant and active horde rosters, seeded local roaming, noise-driven investigation/focus, field noise sources, and the HUD meter. `npm run build` passed. Automated checks, browser smoke, and owner playtest have not been run. Updated README and handoff.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Owner explicitly requested Phase 15 while Phase 14's review gate remains open. Phase 15 stays In progress pending verification and owner playtest.                                                                             |
| 2026-10-01 | 14 revisions / 15 planning       | In progress        | Reworked crowd visuals into compact near/mid multipart and far cylinder instance pools; third-person reticle hits also resolve against live simulation positions to cover LOD geometry gaps, and top-down assisted shots carry the resolved horde index through damage. Dead instances leave the pools, and indoor defeated views leave their scene. Added Phase 15 for dormant saved positions, proximity activation/local roaming, and noise-defined awareness/focus. No build, automated checks, browser smoke, or repeat playtest were run.                                                                                                                                                                                  | Owner feedback: dead zombies remain after death; far LOD may be a simple cylinder; shooting stopped applying damage after agents began chasing. Phase 14 remains open for review and repeat playtest; Phase 15 is not started. |
| 2026-10-01 | 14                               | In progress        | Integrated the scalable 10,000-agent simulation into regular field runs: 20 seeded initial hostiles, one additional spawn every two outdoor seconds, indoor/backpack pause, shared multipart zombie rendering, and field weapon/ability/extraction routing. Updated plan, README, tracker, and handoff. No build, automated checks, or browser smoke were run in this turn; no commit yet.                                                                                                                                                                                                                                                                                                                                       | Implementation review and gameplay verification remain open before owner playtest.                                                                                                                                             |
| 2026-09-25 | Planning                         | Documentation only | `plan.md`, `tracker.md`, and `HANDOFF.md` prepared. No game code or tests yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Start phase 1 when ready.                                                                                                                                                                                                      |
| 2026-09-25 | 1                                | `03b2736`          | `npm run build` passed (554.45 kB minified bundle, 140.38 kB gzip; Vite advisory above 500 kB); `npm test` passed (3 tests); `npm run format:check` passed. Browser smoke in Codex in-app browser: scene rendered at 60 FPS / 16.7 ms in a 640×700 preview; same seed preserved layout/count (84), `MILL-ALPHA` changed it (81), view button and Tab toggled modes, drag-to-look rotated the camera. Pointer Lock was denied by the embedded browser; fallback verified. Host GPU/model unavailable.                                                                                                                                                                                                                             | At the time, awaiting owner playtest; the later `608776f` entry records owner acceptance.                                                                                                                                      |
| 2026-09-25 | 1                                | `608776f`          | Owner reported “Playtest was good” and explicitly asked to continue with phase 2. Phase 1 accepted; no revisions recorded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Proceed with phase 2.                                                                                                                                                                                                          |
| 2026-09-25 | 2                                | `66a254c`          | `npm test` passed (11 tests); `npm run build` passed; `npm run format:check` passed. Embedded-browser smoke rendered both views at 59–60 FPS / 16.7 ms, confirmed top-down click routing and a ray-based hostile hit, and observed death/restart feedback. Embedded-browser Pointer Lock remains unavailable; drag-to-look works.                                                                                                                                                                                                                                                                                                                                                                                                | Awaiting owner playtest of input responsiveness, encounter pacing, dash, and ability feel in both views.                                                                                                                       |
| 2026-09-25 | 2 revisions                      | `fad74b5`          | Owner feedback: top-down Q should dash toward the cursor, show a brief direction cue, and resume the planned route without backtracking; the player should face top-down shots; enemy hover should use a rectangular cursor; third-person aim should reach above the horizon; and the third-person camera should sit slightly right. Changes implemented. `npm run build` passed; formatting was applied. Automated tests and browser smoke were not rerun for this revision.                                                                                                                                                                                                                                                    | Awaiting repeat owner playtest of the fixes before Phase 2 acceptance.                                                                                                                                                         |
| 2026-09-25 | 2 follow-up                      | `658fb32`          | Owner requested forgiving top-down enemy clicks, continued attacks until a move/dash/empty click/view switch, and a third-person shoulder that does not swap sides during mouse orbit. Added an invisible 44 px screen-space assist for visible enemies, cooldown-paced fire while a target remains selected, target switching or cancellation on subsequent clicks, and a shoulder offset based on player facing. `npm run build` passed; automated tests and browser smoke were not rerun.                                                                                                                                                                                                                                     | Awaiting repeat owner playtest of targeting, cancellation, and shoulder stability.                                                                                                                                             |
| 2026-09-25 | 2 camera                         | `841b6ff`          | Owner reported the third-person orbit still felt elliptical and asked to keep the camera over the right shoulder while the character looks where the camera points. The camera now follows a fixed-radius horizontal orbit with a camera-right shoulder offset, and the character faces the camera's horizontal look direction. Third-person follow lag is removed after the view transition. `npm run build` passed; automated tests and browser smoke were not rerun.                                                                                                                                                                                                                                                          | Awaiting repeat owner playtest of the orbit and facing behavior.                                                                                                                                                               |
| 2026-09-25 | 2 pivot                          | `ac296d4`          | Owner clarified that pitch should orbit around the character's head, with the horizontal sweep staying on the right shoulder. Camera position now follows a fixed-radius sphere centered at head height; low camera height is clamped near the ground while upward aim remains available. The retest checklist now covers vertical pivot behavior. `npm run build` passed; automated tests and browser smoke were not rerun.                                                                                                                                                                                                                                                                                                     | Awaiting owner retest of the head-centered orbit.                                                                                                                                                                              |
| 2026-09-25 | 2 acceptance                     | Phase 2            | Owner said Phase 2 had just been playtested and improved, then directly requested Phase 3. This is recorded as Phase 2 acceptance and authorization to begin Phase 3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Phase 2 accepted; begin Phase 3.                                                                                                                                                                                               |
| 2026-09-25 | 3                                | `bbfb321`          | `npm test` passed (5 files, 16 tests); `npm run build` passed (602.93 kB minified, 154.97 kB gzip; Vite advisory above 500 kB); `npm run format:check` passed. Embedded-browser smoke confirmed camp stock UI, touchdown and enabled disembark, smooth outward disembark and top-down transition, 14 m extraction guidance, full health through the 12-second insertion window, 60 FPS / 16.7 ms, and no browser console errors. At this checkpoint, full owner playtest was still pending; later accepted below.                                                                                                                                                                                                                | Historical smoke evidence; owner acceptance follows.                                                                                                                                                                           |
| 2026-09-25 | 3 acceptance                     | Phase 3            | Owner reported “All green lights from my site” after the Phase 3 playtest and authorized the next phase. Phase 3 accepted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Begin Phase 4.                                                                                                                                                                                                                 |
| 2026-09-25 | 4                                | `4ff3475`          | Added five seeded districts, jittered city streets and forest trails, two landmarks including a new relay mast asset, and five region-based cache zones. `npm test` passed (5 files, 20 tests), including a 24-seed layout/navigation batch and four cache-route seeds. World-data generation across 24 seeds measured p95 1.93 ms, max 2.16 ms against a 50 ms p95 budget. `npm run build` passed (607.24 kB minified, 156.26 kB gzip; existing Vite advisory above 500 kB); formatting passed. Browser smoke on `PHASE4-00` confirmed landing, disembark, top-down view, 14 m extraction guide, 60 FPS / 16.7 ms, and no console warnings/errors.                                                                              | Owner playtested and accepted, then requested biome-side variation by seed.                                                                                                                                                    |
| 2026-09-25 | 4 revision                       | e8a443b            | Rotated districts, roads, loot zones, landmarks, placements, colliders, and spawn together in four deterministic orientations. Terrain shading follows district data. The complete 23-test suite passed after the final 24-seed assertion adjustment; build and formatting passed. The owner then playtested the revised map and approved Phase 4.                                                                                                                                                                                                                                                                                                                                                                               | Phase 4 accepted; proceed with Phase 5.                                                                                                                                                                                        |
| 2026-09-25 | 5                                | e8a443b            | Added walkable-cell route smoothing and validation, range-based interaction approaches, refreshed hostile blockers on the player navigation grid, route replacement/cancel, bounded stuck recovery, automatic cache/pickup interaction, and route timing/status telemetry. `npm test` passed (5 files, 23 tests); `npm run build` passed (613.60 kB minified, 158.10 kB gzip; existing Vite advisory above 500 kB); formatting passed. Browser smoke confirmed deploy/disembark, route completion, Escape cancellation, 0.20 ms latest/max route request, and 60 FPS / 16.7 ms.                                                                                                                                                  | Awaiting owner playtest of dense routes, interaction approach, and moving-hostile pressure.                                                                                                                                    |
| 2026-09-25 | 5 acceptance                     | Phase 5            | Owner reported “Playtest 5 - all fine! I tested and everything works.” Phase 5 accepted with no further revisions; owner authorized Phase 6.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Begin Phase 6.                                                                                                                                                                                                                 |
| 2026-09-25 | 6                                | `13093c8`          | Added deterministic 100/1,000/5,000/10,000-agent stress scenarios, instanced visuals and visible-agent damage, stable typed state, near/mid/far update tiers, spatial-grid crowd steering/targeting, local obstacle deflection, and a repeatable simulation-only benchmark. `npm test` passed (6 files, 29 tests); `npm run build` passed (630.26 kB minified, 163.03 kB gzip; existing Vite advisory above 500 kB); formatting passed. Browser smoke loaded 10k living agents, observed near-field attack pressure and camera switching, damaged a visible instance, and confirmed small-screen stop/reopen cleanup with no console warnings/errors. Two benchmark runs are in README and handoff.                              | Awaiting owner playtest of threat readability, tiers, crowding, and repeatability.                                                                                                                                             |
| 2026-09-25 | 6 acceptance                     | Phase 6            | Owner reported “Playtest was good” and observed stable 60 FPS with 10,000 enemies, with each frame taking 17 ms or less. Phase 6 accepted; environment/browser/hardware were not specified. This is owner-playtest frame-rate evidence, separate from the simulation-only benchmark above.                                                                                                                                                                                                                                                                                                                                                                                                                                       | Phase 7 remains not started; await the owner's explicit instruction to begin it.                                                                                                                                               |
| 2026-09-25 | 7                                | `f675799`          | Added rolling frame, CPU, simulation, GPU-query, renderer-counter, heap, camera, canvas, effect, and navigation diagnostics. Changed horde rendering to prepare and upload only agents whose visual state changed. `npm test` passed (7 files, 33 tests); `npm run build` passed (634.94 kB minified, 164.56 kB gzip; existing Vite advisory above 500 kB); formatting passed. Steady-state embedded-browser idle-camp profile at 1280×720, third-person: 60 FPS, 16.7 ms p95 RAF interval, 4.40 ms JS frame p95, 0.00 ms mean fixed-update work/frame (rounded), 4.66 ms GPU p95, 468 calls, 17,490 triangles, 23 MB JS heap, 111 geometries, 3 textures. GPU query was available. This is not an active-run or stress profile. | Awaiting owner playtest.                                                                                                                                                                                                       |
| 2026-09-26 | 7 acceptance                     | Owner approval     | Owner explicitly approved Phase 7 and authorized the next phase (“green lights for next phase”). No revisions reported. The existing active-run and 10k reference profiles remain undocumented; no browser/hardware claim added.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Phase 7 accepted; Phase 8 authorized.                                                                                                                                                                                          |
| 2026-09-26 | 8                                | `cf41524`          | Added seeded 2–4 room interiors, wall/furniture collision and navigation, usable building entrances, loot, one infected encounter, persistent per-run room state, and outdoor timer/horde pause/resume. `npm test` passed (8 files, 34 tests); `npm run build` passed (645.89 kB minified, 168.19 kB gzip; Vite advisory above 500 kB); `npm run format:check` passed. Browser launch, deployment/disembark and route interaction worked at 639×698 / 1×; console warnings/errors were empty. The full interior interaction was not reached during the smoke.                                                                                                                                                                    | Awaiting owner playtest of the complete entry/exit flow and both camera modes.                                                                                                                                                 |
| 2026-09-26 | 8 revision                       | `e20fa6d`          | Owner playtest found that entry placed the player inside the center divider and blocked movement. The front-divider opening now aligns with the entry/exit position, creating a clear passage. Automated and browser checks were not rerun for this correction.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Awaiting owner retest of spawn clearance and interior movement.                                                                                                                                                                |
| 2026-09-26 | 8 acceptance                     | Owner approval     | Owner reported “Playtest was successful” and authorized the next phase (“start with the next phase”). Phase 8 accepted; no additional issue reported.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Phase 8 accepted; Phase 9 authorized.                                                                                                                                                                                          |
| 2026-09-26 | 9                                | `3825cb5`          | Added a separate editor for the shared five-asset catalog; editable dimensions, collision, interaction points, and materials; versioned JSON import/export and validation; orbit/zoom and near/far previews; and a direct game handoff. `npm test` passed (9 files, 37 tests); build and format checks passed. Browser smoke imported the boulder JSON, applied it to the game, started a generated run, and had no console warnings/errors.                                                                                                                                                                                                                                                                                     | Awaiting owner playtest of the Asset Bench workflow.                                                                                                                                                                           |
| 2026-09-26 | 9 revision                       | `5042f7e`          | Owner reported that choosing a color in the OS picker and pressing Select did not update the editor. Color controls now handle `input` and `change` directly and refresh the preview without rebuilding the inspector. Production build passed; browser interaction changed the bark swatch to `#ca9d4f`, then source defaults were restored. The OS picker flow still needs owner retest.                                                                                                                                                                                                                                                                                                                                       | Awaiting owner retest of color selection and the Phase 9 workflow before acceptance.                                                                                                                                           |
| 2026-09-26 | 9 acceptance                     | Owner approval     | Owner confirmed “Works now!” and marked Phase 9 complete after retesting the native color picker. Phase 9 accepted. Owner said Phase 10 will start later.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Phase 9 accepted; wait for the owner to start Phase 10.                                                                                                                                                                        |
| 2026-09-26 | 10                               | `00bb345`          | Added the walkable Wayfarer camp, bounded navigation, service markers and NPCs, enterable barracks/clinic interiors, a camp terminal, quartermaster transactions, cargo upgrade, and Greywood deployment. Automated coverage includes camp routes and transaction guards. `npm test` passed (11 files, 41 tests); `npm run build` and `npm run format:check` passed; `git diff --check` passed. Browser smoke at 639×698 / 1× reached the quartermaster with F, opened the terminal, entered/exited a building, and deployed to Greywood. The browser console showed no warnings or errors.                                                                                                                                      | Phase 10 implementation is authorized after Phase 9 approval; awaiting owner playtest.                                                                                                                                         |
| 2026-09-26 | 10 playtest deferral             | Owner direction    | Owner asked to skip the Phase 10 playtest for now and combine it with the Phase 11 playtest later, while explicitly authorizing continued work on the next phase. Phase 10 remains unaccepted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Keep Phase 10 pending; review it with Phase 11.                                                                                                                                                                                |
| 2026-09-26 | 11                               | `f4a1252`          | Added per-run atmosphere presets, persistent accessibility controls, rain/thunder, pooled particles, combat feedback/audio cues, and bounded camera shake. `npm test` passed (14 files, 50 tests); `npm run build` and `npm run format:check` passed. Browser smoke at 639×698 / 1× covered a rainy normal field run and 10,000-agent stress scene; no browser warnings/errors. Local preview measurements and conditions are recorded in `HANDOFF.md`.                                                                                                                                                                                                                                                                          | Await combined owner playtest for Phases 10 and 11.                                                                                                                                                                            |
| 2026-09-27 | 10/11 first playtest feedback    | `61724bf`          | Owner reported the operations board was separated from its north-side interaction point, tower ladder rungs did not follow their tilted backplates, the camp helicopter model needed improvement, and the quartermaster/storage opened the same menu. Moved the board to the marker, parented rungs to the tilted ladder group, built and animated a shared detailed helicopter model, and added separate quartermaster, storage, and operations menus while retaining the combined M terminal. `npm run build`, formatting, and `git diff --check` passed; tests/browser smoke were not rerun. Awaiting owner retest; combined playtest remains active.                                                                         | Phases 10 and 11 remain in progress and unaccepted.                                                                                                                                                                            |
| 2026-09-27 | 10/11 chopper follow-up          | `01f3abc`          | Owner clarified the chopper should be slightly larger and provided an image highlighting the protruding windscreen and backwards-facing tail rotor. Scaled the shared model 12%, fitted the windscreen and cabin glazing to the curved shells, and rotated the tail rotor 90 degrees so its plane faces sideways and it spins around the lateral axle. `npm run build` and formatting passed; browser playtest and automated tests were not rerun. Awaiting owner retest.                                                                                                                                                                                                                                                        | Phases 10 and 11 remain in progress and unaccepted.                                                                                                                                                                            |
| 2026-09-27 | 10/11 open cabin chopper         | `87c3e9d`          | Owner said the helicopter remained small beside the character and requested a further scale increase, open troop doors on both sides, and seating. Increased model scale from 1.12 to 1.35, cut openings into both sides of the cabin, added a cabin floor and longitudinal benches, and removed side glazing and door panels. `npm run build`, formatting, and `git diff --check` passed; browser playtest and automated tests were not rerun. Awaiting owner retest.                                                                                                                                                                                                                                                           | Phases 10 and 11 remain in progress and unaccepted.                                                                                                                                                                            |
| 2026-09-27 | 10/11 cabin fit follow-up        | `ecb8241`          | Owner screenshot showed benches crowding the side exit and insufficient clearance for a character. Increased scale from 1.35 to 1.85, yielding an approximately 13.3 m main rotor; repositioned benches across the cabin at the forward/rear ends; enlarged the open side aperture to approximately 2.2 m high by 2.3 m long. `npm run build`, formatting, and `git diff --check` passed; browser playtest and automated tests were not rerun. Awaiting owner retest.                                                                                                                                                                                                                                                            | Phases 10 and 11 remain in progress and unaccepted.                                                                                                                                                                            |
| 2026-09-27 | 10/11 camp and weather revisions | `9ec8283`          | Refined towers and guard placement, updated friendly NPC models and added slow hub wandering, moved and reoriented the paired operations boards at their northern interaction point, and added a hand-drawn map/notes board. Improved the arrival rappel and extraction boarding sequence, added wheel zoom in both views, replaced player-following fog spheres with slowly drifting irregular volumetric banks plus distance haze, and doubled varied rain puddles. `npm test` passed (14 files, 50 tests); `npm run build`, `npm run format:check`, and `git diff --check` passed. No browser playtest was repeated.                                                                                                          | Awaiting owner retest; Phases 10 and 11 remain in progress and unaccepted.                                                                                                                                                     |
| 2026-09-29 | 12/13 themed asset placement     | Implementation     | Added six seeded region themes, the first 16 approved models, weighted placement metadata, four rotated layouts, themed terrain/roads, a collidable coastal water edge, per-asset interaction approaches, and a region schematic/checklist. `npm run build` passed; `npm test` passed (15 files, 56 tests); the 9-test world suite passed with connected-ellipse, 16-theme-seed, route, and rotation coverage. One 24-seed load batch measured 14.24 ms p95 / 14.61 ms max generation time. Scoped Prettier and `git diff --check` passed. In-app smoke loaded `PHASE13-00`, reached Greywood, and rendered at about 59–60 FPS after insertion; scout was downed before all regions were traversed.                              | Phases 12 and 13 await owner review of in-game asset appearance, theme coherence, both cameras, approaches, and routes.                                                                                                        |

## Open issues and revisions

| ID   | Phase | Issue or requested change                                                                                                                   | Priority | Status   | Resolution/evidence                                                                                                                                                                                                              |
| ---- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | 2     | Verify all requested targeting, sustained fire, dash, aiming, and shoulder changes in a repeat playtest.                                    | Medium   | Resolved | Owner requested Phase 3 after the Phase 2 playtest revisions; Phase 2 is accepted.                                                                                                                                               |
| 3.1  | 3     | Owner playtests repeated extraction, death loss, banking, save reload, and camp shopping.                                                   | Medium   | Resolved | Owner reported all green lights and authorized Phase 4 on 2026-09-25.                                                                                                                                                            |
| 4.1  | 4     | Verify varied routes, cache accessibility, landmark navigation, and chopper clearance over owner seeds.                                     | Medium   | Resolved | Owner confirmed Phase 4 playtest passes on 2026-09-25.                                                                                                                                                                           |
| 4.2  | 4     | Guarantee both city and forest areas while changing their map-side placement by seed.                                                       | Medium   | Resolved | Four deterministic map rotations move districts and map content; full 23-test suite passed and owner approved the retest.                                                                                                        |
| 5.1  | 5     | Verify click-to-move route recovery, dynamic obstruction, and automatic interaction approaches.                                             | Medium   | Resolved | Owner said “Playtest 5 - all fine! I tested and everything works.” and authorized Phase 6 on 2026-09-25.                                                                                                                         |
| 6.1  | 6     | Owner assesses horde threat readability, tier transitions, crowd behavior, and repeatability.                                               | Medium   | Resolved | Owner reported a good playtest and stable 60 FPS / 17 ms or less per frame with 10,000 enemies on 2026-09-25; no issues reported.                                                                                                |
| 7.1  | 7     | Capture representative performance on the reference desktop and apply an appropriate rendering improvement.                                 | High     | Resolved | Owner accepted Phase 7 on 2026-10-01 after the three-tier LOD rollout and a 20-minute session reporting mostly 50+ FPS; two brief dips to 35 occurred in the heaviest horde/map combination.                                     |
| 7.2  | 7.1   | Add far LODs for approved catalog assets and preserve gameplay interactions.                                                                | High     | Resolved | All approved catalog assets have three distance tiers at 0/58/200 m with 12% hysteresis; tree pilots use authored low models and other assets generate low/very-low models from their detailed variants. Owner accepted Phase 7. |
| 7.3  | 7.1   | Add a very-low-detail model for approved catalog assets and preserve distant silhouettes.                                                   | High     | Resolved | Implemented for all approved catalog assets. Very-low geometry uses 3-segment round primitives, a 0.45 m default feature cutoff, per-asset filters, indexed material merging, and no cast shadows. Owner accepted Phase 7.       |
| 8.1  | 8     | Verify the full building entry/interior/exit flow in the browser and owner playtest.                                                        | Medium   | Resolved | Owner reported a successful Phase 8 playtest on 2026-09-26 after the entry-clearance correction.                                                                                                                                 |
| 9.1  | 9     | Owner playtests editing, invalid-value feedback, save/reopen, and generated-run integration.                                                | Medium   | Resolved | Owner retested the native color picker, confirmed it works, and accepted Phase 9 on 2026-09-26.                                                                                                                                  |
| 10.1 | 10    | Owner playtests camp navigation, economy, persistence, map availability, and deployment.                                                    | Medium   | Resolved | Owner completed the combined review and accepted Phase 10 on 2026-09-29 after fixes.                                                                                                                                             |
| 12.1 | 12    | Owner reviews all 38 integrated approved models in the game and confirms appearance and usability.                                          | Medium   | Resolved | Owner reviewed the integrated assets during the completed Phase 13 playtest and accepted Phase 12 on 2026-09-29.                                                                                                                 |
| 13.1 | 13    | Owner checks all four map orientations, both cameras, approaches to authored interactions, cache routes, and theme coherence.               | Medium   | Resolved | Owner completed the four-rotation review and accepted Phase 13 on 2026-09-29 after fixes.                                                                                                                                        |
| 11.1 | 11    | Owner playtests atmosphere, visual comfort, audio, accessibility controls, and effects, together with Phase 10.                             | Medium   | Resolved | Owner completed the combined review and accepted Phase 11 on 2026-09-29 after fixes.                                                                                                                                             |
| 14.1 | 14    | Review horde integration in both cameras, weapons/abilities, extraction, indoor pause/resume, and desktop performance; then owner playtest. | High     | Open     | The feature is wired into the regular run, but build/checks, browser smoke, and owner feedback are still pending.                                                                                                                |

## Decisions to record

| Decision                                                   | When needed                  | Current state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference browser/hardware and accepted performance result | Phase 7, accepted 2026-10-01 | Desktop: Ubuntu Linux, Intel Core i5-3570K at 3.40 GHz, Nvidia GTX 1650 4 GB, 16 GB RAM, Firefox latest as reported, 1920×1080 display. Owner reports post-LOD FPS mostly above 50 and typically 40+ in the heaviest 10k-horde/busiest-asset area, with two brief 35 FPS dips over 20 minutes. Earlier per-camera means are historical; more detailed profiling is a parked optional follow-up. Phone target remains Pixel 10a class; testing deferred.                                                              |
| Third-person ability bindings                              | Phase 2                      | Resolved: 1/2/3 map to field dressing, shock pulse, and adrenaline; the live controls panel mirrors the active view.                                                                                                                                                                                                                                                                                                                                                                                                 |
| Run pacing, starting gear, inventory/economy values        | Phase 3 / 14                 | First pass: take one gear kit and one medical supply from camp if available; weighted cargo capacity is 10, or 15 with the 90-credit harness. Credits are weightless. City–forest deployment is free. Phase 14 replaces the original 50/110-second warnings and 90/150-second waves with 20 initial field hostiles and one new spawn every two outdoor seconds. Extract after collecting at least one cache item, inside 6.5 m, with no hostile within 3.5 m, then hold for four seconds. Tune after owner playtest. |
| Phase 14 horde placement and pressure                      | Phase 14                     | Initial 20 use the seeded Phase 6 ring distribution over walkable map points. Later agents spawn 82–128 m from the scout, also at walkable points, using the continuing seeded random stream. Spawn/movement pause inside buildings and during backpack pause; the established 12-second insertion grace is retained.                                                                                                                                                                                                |
| Phase 4 procedural route limits                            | Phase 4                      | Five named districts shape building/vegetation placement; nine seed-jittered road/trail segments remain in bounds. Seven cache sites are spread over five named loot zones; placement rejects routes over 145 m from the chopper. A 24-seed test checks collider overlap, landing clearance, disembark, and landmark routes.                                                                                                                                                                                         |
| Phase 4 map generation budget                              | Phase 4                      | The world-data generation budget is 50 ms at p95, measured before Three.js visual construction. The orientation-revision 24-seed sample measured p95 1.86 ms and maximum 2.26 ms on the current development host.                                                                                                                                                                                                                                                                                                    |
| Phase 6 horde simulation benchmark                         | Phase 6                      | Two 36-sample runs after eight warm-up steps at seed `PHASE6-SMOKE` / Eight clusters measured 10,000-agent simulation mean 1.547/1.517 ms and p95 11.300/11.900 ms per 1/60-second step. Spawn and rendering are excluded; reference hardware remains undecided for Phase 7.                                                                                                                                                                                                                                         |
| Exterior simulation behavior while inside a building       | Phase 8                      | Resolved: pause the outdoor timer and hostiles; player health/weapon/ability cooldowns and room encounters continue. Room loot and enemy state persist until that run ends.                                                                                                                                                                                                                                                                                                                                          |
| Art/audio licenses for public release                      | Before public release        | Open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

| 2026-09-29 | Phase 7 LOD pilot | Local implementation | Added an optional low-detail visual factory, runtime `LOD` evaluation, and pilot models for pine trees and burned-tree clusters at a 58 m switch with hysteresis. The production build passed. Short Codex in-app preview samples showed high draw-call/JavaScript cost but varied too much for a controlled before/after claim. | Keep the two-asset prototype for reference-desktop comparison; expand only through planned Phase 7.1 and measured asset priorities. No broad fog or draw-distance change. |
| 2026-09-29 | Approved catalog LOD rollout | Local implementation | Added generated far representations for all remaining approved catalog assets; retained the hand-authored pine and burned-tree LODs. Low representations reduce round-primitive tessellation, omit sub-0.08 m parts, and merge compatible geometry by material. Repaired building-door ID attachment to target the near model. `npm run build` passes. No assets in `unapproved-assets/` were changed. | Compare broad/normal views and near/far transitions in both cameras on the reference desktop; performance gain and visual acceptance remain unverified. Fog and draw distance remain unchanged. |
| 2026-09-29 | Ultra-far asset LOD stage | Local implementation | Added a third player-distance LOD for all approved catalog assets at 300 m / 12% hysteresis. The generated model caps round primitives at three segments, drops parts below 0.25 m, merges compatible geometry by material, and disables shadow casting. Transition checks cover both tree pilots and a generic catalog fallback. | Review silhouettes/readability in both camera modes and compare on reference hardware; this does not establish a performance gain. Fog, draw distance, and `unapproved-assets/` are unchanged. |

## Tracker rules

The owner reported on 2026-10-03 that all Phases 1–17 are done and reviewed. This final acceptance supersedes earlier open-gate notes in the dated implementation journal.

- Use the phase status names in `plan.md`; change status only when its evidence supports it.
- Keep failing checks open and log fixes with the next test/playtest result.
- Add new scoped backlog work here before implementing it.
- Record each owner playtest result explicitly. Only the owner can accept a phase and initiate the next one.

| 2026-09-29 | 12/13 approved asset expansion | `0e7a304` | Moved the owner's additional 21 approved candidate source/review pairs into `src/assets/` and `docs/asset-reviews/`, added the abandoned-substation placement wrapper, registered all 22 model identities, and extended urban, forest, farm, military, coastal, and survival-camp pools. `npm run build` passed; no tests were added or run for this follow-up. | Phases 12/13 await owner review of the new set pieces, both views, approaches, and routes across four seed orientations. |
| 2026-09-27 | Phase 10 inventory follow-up | `a04da21` | Kept the camp/field backpack contents and item positions consistent through deployment; extraction saves them and death restores the starter kit while preserving banked resources. Moved the scrap hut, worker, enlarged piles, and colliders clear of the chopper pad. Handoff reports a passing build, 55 tests, and browser checks of both inventory screens, a dropped grenade through deployment, and the relocated vendor. | Owner retest remains open for item drag/drop/pickup, vendors, extraction, and death loss. |
| 2026-09-29 | Owner playtest acceptance | Owner report | Owner reports that Phase 10 and Phase 11 playtests are complete, Phase 13 is completely playtested, and all reported issues have been fixed. Phases 10–13 are accepted; Phase 12's integrated-asset review is included in the completed Phase 13 review. | All phase acceptance gates through Phase 13 are closed. Select and scope the next backlog milestone before starting further phase work. |
| 2026-09-29 | Phase 7 reopened | Owner report | The owner sees the empty map's corner-to-corner view fall from 60 to about 18 FPS and the 10k-agent scene run about 18–30 FPS depending on position. A newer-CPU laptop reportedly performs similarly. Product target includes a recent Android phone in the Pixel 10a class. At the time of reopening, the exact desktop CPU, browser/version, display and canvas resolution, pixel ratio, seed, and camera path had not yet been supplied. | Reopened Phase 7 as Revisions needed. Capture repeatable desktop baselines and profile before optimizing; phone testing is deferred. |
| 2026-09-29 | Phase 7 baseline details | Owner report + CPU Monkey image | Owner confirmed Intel Core i5-3570K @ 3.40 GHz, Firefox latest, and 1920×1080 display resolution. Exact Firefox version, in-game canvas/backing resolution, device pixel ratio, seed, camera path, and metric telemetry remain unrecorded. The shared CPU Monkey chart ranks Tensor G4 above the i5 in its relative single/multi-core comparison; it does not establish game performance. | Proceed with repeatable desktop baseline capture. Phone testing is explicitly deferred until later. |
| 2026-09-29 | Phase 7 FPS observations | Owner report | Few-second on-screen FPS-counter means, in empty scene / corner-to-corner / 10,000-agent order: third person ~40 / ~18 / ~18–35 FPS depending on location; top-down ~38 / ~30 / ~24 FPS. GPU timing (the current panel labels this P95; owner referred to it as p92) and heap were N/A. These are rough averages rather than repeatable p95 profiles. | Use as the pre-LOD reference; a post-change comparison is recorded separately. |
| 2026-10-01 | Ultra-far LOD refinement | Local implementation | Raised the default ultra-far component cutoff from 0.25 m to 0.45 m, then added per-asset size and thin-detail filtering for the dry-dock crane, both substations, fire lookout, radar dish, water-treatment tanks, cargo containers, aircraft hangar, and wind pump. Long thin spans can remain to preserve primary silhouettes. Merged geometry stays indexed to reduce duplicate vertex storage across generated catalog LOD3 models. LOD1 and LOD2 generation paths were left unchanged. `npm run build` passed; no matched performance capture or visual review was run. | Review silhouettes or gather more detailed profiles only if later work calls for it; Phase 7 was subsequently accepted and closed below. |
| 2026-10-01 | Phase 7 post-LOD performance report | Owner report | After the three-tier approved-catalog LOD rollout, owner reports FPS mostly above 50. In the heaviest combination (10,000 agents plus the busiest asset area), FPS is typically 40+; two brief dips reached 35 during a 20-minute session. The report does not include detailed frame-time telemetry. | Phase 7 acceptance follows below; any additional profiling is optional future work. |
| 2026-10-01 | Phase 7 acceptance | Owner report | Owner explicitly requested that Phase 7 be marked complete and closed after the LOD rollout and 20-minute performance session. | Phase 7 accepted and closed. More detailed profiling and phone testing are optional future work, not acceptance blockers. |

### Camp shadow correction — 2026-10-03

- Fixed the camp helper’s disabled shadows for solid geometry (markets, tents, tower supports, and other hub props), enabled parked helicopter shadows, and allowed ground/path/pad overlays to receive them. Ground-decoration batch settings are preserved.
- Verification: 27 test files / 85 tests passed; production build passed with the existing chunk-size advisory; targeted formatting and diff checks passed. At the time this entry was written, owner visual review was pending; the later final owner review below closes all phase gates.

### Final owner review — 2026-10-03

- Owner confirmed that Phases 1–17 are complete and reviewed. Marked Phase 14–17 status rows and remaining checklist gates accepted.
- Phase 14 covered regular-run horde pressure, combat integration, dead-agent cleanup, far LOD, and indoor pause/resume. Phase 15 covered dormancy, local roaming, and noise awareness. Phase 16 covered combat/pickup feedback and interaction polish. Phase 17 covered camp atmosphere and density, gate/service navigation, and first-person presentation.
- No phase gates remain open. Optional phone testing and future backlog ideas remain outside the completed phase set.
