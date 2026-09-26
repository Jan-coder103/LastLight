# Coding handoff

Updated: 2026-09-26

## Current position

Phases 1–7 are **Accepted**; Phase 8 implementation is complete and **Awaiting owner playtest**. The owner approved Phase 7 and authorized Phase 8 on 2026-09-26 (“green lights for next phase”). Phase 7 active-run and 10,000-agent profiles on reference hardware remain undocumented because the reference setup was not supplied.

Phase 8 adds generated 2–4 room interiors for city buildings, interactive doors, room loot and one infected, a return to the same outdoor position, and a pause for the outdoor timer/horde while inside. Implementation commit: `cf41524`; entry-clearance correction: `e20fa6d`. The owner playtest found the player spawned against the center divider and could not move; the front-divider opening now aligns with the entry/exit point. Owner retest is pending. The earlier automated coverage, build, and formatting passed before this correction; it has not been rerun. Browser console error/warning capture was empty during the earlier smoke, which did not reach the interior flow.

## Read first

1. `plan.md` for the vision, technical direction, phase scope, and acceptance criteria.
2. `tracker.md` for phase status, verification evidence, decisions, and the owner playtest log.
3. `README.md` for startup commands, controls, simulation benchmark measurements, and the Phase 8 playtest checklist.

## Phase 2 decisions and tuning

- Third-person abilities use `1/2/3`. Top-down abilities use `W/E/R`; the active map is shown in the field controls and HUD. `Tab` switches views.
- `Q` dashes for 0.22 seconds at 20 m/s (about 4.4 m) with a 2.5-second cooldown and no resource cost. Switching views preserves the dash direction; switching clears held movement keys.
- In top-down view, Q takes its direction from the current cursor position and briefly displays a ring-and-arrow cue. When the dash ends, the click-to-move route is recalculated from the landing point to its saved destination to avoid backtracking.
- A top-down shot turns the player toward its aim point and briefly preserves that facing while moving. Hovering a live hostile changes the cursor/reticle to a square target mark.
- Top-down left-click assist selects a visible living hostile within an invisible 44 CSS-pixel radius of the pointer. It keeps firing on the rifle cooldown until the player issues a move or dash, clicks empty space, switches views, or the hostile dies. Clicking another hostile changes the target. Selecting a hostile clears the previous move route.
- Third-person pitch now permits aiming above the horizon. Camera position orbits a fixed 9.3 m sphere centered 1.75 m above the terrain at the player, with a small right-side bias; the low edge is clamped above the ground while the upward view angle remains available.
- The camera aims along its yaw and pitch, and the player faces that horizontal look direction. Third-person follow updates directly after view transitions, so mouse orbit does not trail.
- Field dressing restores 35 health and has a 12-second cooldown. Shock pulse deals 40 damage and stuns hostiles within 9 m for 1.8 seconds; cooldown is 9 seconds. Adrenaline raises movement speed by 50% for 5 seconds; cooldown is 14 seconds.
- The rifle deals 50 damage with a 0.24-second firing cooldown. Hostiles have 100 health. The three-hostile encounter is intentionally small and uses A* repaths around static colliders every 0.7 seconds.
- Player health is 100. Each hostile attack deals 8 damage every 1.3 seconds while in melee range. Phase 3 replaces the Phase 2 restart overlay with a run-loss result and return-to-camp action.
- Top-down player movement uses a 2 m A* grid with static collider clearance. Phase 5 adds walkable route smoothing, moving-hostile blockers, interaction approaches, route cancellation, and stuck recovery. Third-person movement remains direct, camera-relative, and collision-aware.
- Aim uses the cursor (or screen center under Pointer Lock); the nearest static geometry blocks a shot before a hostile. Firing uses a short tracer and muzzle flash.

## What changed

- Added the view-specific input map and a visible control panel that changes with camera mode.
- Added player dash, top-down click-to-move, direct third-person movement, collision checks, and the visible rifle.
- Added `CombatSimulation` for health, rifle fire rate, abilities, hostile damage, pursuit, stun, death, and restart state.
- Added three low-poly zombies, obstacle-aware pursuit, and combat feedback HUD/effects.
- Added unit tests for damage/death, rifle and ability/dash cooldowns, input maps, and routes around generated obstacles.
- Updated the roadmap decision, README controls, and Phase 2 playtest instructions.
- Addressed the owner's Phase 2 playtest feedback with cursor-directed top-down dash, dash direction cue and route recovery, top-down shot-facing, enemy-hover cursor, forgiving enemy target assist and sustained fire, upward third-person aim, and a head-centered right-shoulder orbit with camera-aligned character facing.
- Added the Phase 3 run loop: animated chopper arrival and disembark, deterministic loot caches and pickups, capacity-limited cargo, timed reinforcement warnings, guarded extraction and takeoff, death loss, and return to camp.
- Added a quartermaster, starter gear and supplies, a medical-supply action, a cargo harness upgrade, and versioned browser persistence for safe camp stock.
- Added Phase 3 coverage for save recovery, cargo capacity, outcome banking/loss, deterministic loot, and individually tracked reinforcements.
- Started Phase 4 with five named, seeded districts; jittered city roads and forest trails; region-based loot zones; and two seed-varied landmarks, including the new radio mast authored asset.
- Kept building and vegetation placement inside their districts with road, landing-ring, landmark, map-edge, and prop-spacing exclusions. Loot caches are distributed among five zones and reject routes over 145 m from the chopper.
- Added `validateWorld` for collider overlap, placement/road bounds, landing clearance, and landmark approach checks. Added a 24-seed automated batch for layout, landing/disembark, and landmark routing plus four seeds checking seven-cache distribution and route lengths.
- Applied a seed-selected quarter-turn to the complete generated layout, including districts, roads, loot zones, landmarks, placements, collision boxes, and spawn. Placement heights are sampled again at their transformed positions. Four deterministic test seeds cover the four directions; the regression now asserts city buildings and forest props exist for each seed.
- Changed terrain shading to use the generated district regions, so the visible city/forest split moves with the layout instead of staying tied to the world X coordinate. The map-location label is now direction-neutral.
- Completed the Phase 4 follow-up: rotate the full map by seed, shade terrain from district data, and verify all four orientation seeds; the owner playtested and accepted the revision.
- Added Phase 5 route smoothing with walkability checks, range-based cache/pickup approaches, automatic interactions, and a temporary moving-hostile overlay on the player-only route map.
- Added route replacement and Escape cancellation, camera/dash/obstacle replanning, bounded stuck detection, unreachable-route feedback, and live route timing/state telemetry.

- Recorded the owner’s Phase 5 approval and began Phase 6.
- Added the camp-accessible Horde Simulation Lab with 100/1,000/5,000/10,000 counts, a spawn seed, wide-ring/eight-cluster/grid layouts, and camera selection. Its stress scene returns to camp without changing saved run inventory.
- Added stable numeric agent IDs and typed state arrays; near/mid/far update tiers, a local spatial grid for separation and nearest-target queries, local deflection around static obstacles, and simple near-field pursuit/attacks. Horde bodies use one instanced render batch without shadows.
- Added visible-agent click damage through the instanced batch. Damaged agents retain health and ID across tiers; defeated agents disappear from spatial queries without reusing their ID.
- Added a local fixed-step benchmark with eight warm-up steps and 36 samples at each target count. It reports mean and p95 simulation time and excludes scenario construction and rendering.
- Added deterministic-spawn, 10,000-agent integrity, tier-transition state-retention, pursuit, and attack tests; added Phase 6 setup, benchmark evidence, and owner playtest instructions.
- Added rolling frame-interval p95, JavaScript frame p95, fixed-update CPU timing, optional asynchronous WebGL2 GPU timer queries, draw-call/triangle counts, heap and renderer object counts, camera/canvas information, effect counts, and navigation timing to the development telemetry.
- Changed horde visuals to queue only transform or tier-color changes; sparse updates upload coalesced instance-buffer ranges, with a full-buffer fallback for dense updates or more than 64 ranges.
- Added Phase 7 profiling instructions and logged a local idle-camp profile. The stress scene reports per-frame instance-sync time and changed-agent count while its lab panel is open.

## Phase 3 decisions and tuning

- Each run begins in third person while the chopper approaches and lands. Disembarking moves the player 14 m from the landing zone and automatically transitions to top-down view.
- Hostile pursuit is held for the first 12 seconds after disembarking. Radio warnings occur at 50 and 110 seconds; two reinforcements arrive at 90 and 150 seconds. The encounter caps at seven hostiles.
- Seven reproducible cache sites are placed from the world seed, outside the landing ring. A cache drops two or three reproducible gear, supply, credit, or fuel pickups.
- Gear, supplies, and fuel each use one cargo unit; credits are weightless. Capacity starts at 10 units. A 90-credit harness raises it to 15. Partial pickup is allowed; an uncollected remainder stays in the world.
- If available, one gear kit and one medical supply are taken from camp at deployment. X consumes one carried supply and restores up to 35 health. The quartermaster sells a gear kit for 50 credits and two medical supplies for 35 credits.
- Extraction requires at least one item collected from a cache, the landing ring (within 6.5 m), no hostile within 3.5 m, and four uninterrupted seconds. A nearby hostile interrupts boarding. The city–forest run has no fuel charge.
- Camp save schema version 1 is stored under `last-light-save`. Camp resources and the cargo upgrade persist; unbanked cargo does not.

## Verification

- `npm test` — passed: 4 test files, 11 tests.
- `npm run build` — passed TypeScript checking and Vite production build. Minified bundle is 576.81 kB (147.21 kB gzip); Vite reports its existing/default advisory above 500 kB.
- `npm run format:check` — passed.
- Embedded-browser smoke — 59–60 FPS / 16.7 ms in the 1280×720 in-app preview; control panel and status HUD rendered; top-down mode and right-click route displayed; a cursor shot registered “Hostile hit”; zombie damage and the death/restart overlay appeared. The observed FPS is a preview reading, not a reference-hardware performance claim.
- After the playtest revisions, `npm run build` passed; current minified bundle is 581.77 kB (148.61 kB gzip), with the same Vite advisory above 500 kB. Formatting was applied to the changed source files. Automated tests and browser smoke were not rerun for this revision.
- After the follow-up targeting/camera revision, `npm run build` passed; current minified bundle is 583.01 kB (148.94 kB gzip), with the same Vite advisory above 500 kB. Automated tests and browser smoke were not rerun.
- After the shoulder orbit revision, `npm run build` passed; current minified bundle is 583.19 kB (149.00 kB gzip), with the same Vite advisory above 500 kB. Automated tests and browser smoke were not rerun.
- After the head-pivot revision, `npm run build` passed; current minified bundle is 583.39 kB (149.05 kB gzip), with the same Vite advisory above 500 kB. Automated tests and browser smoke were not rerun.
- Phase 3 `npm test` — passed: 5 test files, 16 tests.
- Phase 3 `npm run build` — passed; bundle is 602.93 kB minified (154.97 kB gzip). Vite reports its existing/default advisory above 500 kB.
- Phase 3 `npm run format:check` — passed.
- Embedded-browser Phase 3 smoke — camp stock displayed; the chopper touched down and enabled disembark; scout moved outward while the camera changed to top-down; extraction guide showed 14 m; health stayed at 100 through 7 seconds of the 12-second insertion window; preview showed 60 FPS / 16.7 ms; no browser console errors. At that checkpoint, the full owner playtest remained pending; the owner later reported all green lights and accepted Phase 3.
- Phase 4 `npm test` — passed: 5 test files, 20 tests, including a 24-seed layout/navigation suite and four loot-distribution seeds.
- World-data generation measured across 24 seeds at p95 1.93 ms and maximum 2.16 ms, against a 50 ms p95 budget. Measurement excludes Three.js visual construction; the benchmark ran in Vitest on the development host.
- Phase 4 `npm run build` — passed; bundle is 607.24 kB minified (156.26 kB gzip), with Vite's existing advisory above 500 kB.
- `npm run format:check` — passed.
- Embedded-browser smoke on `PHASE4-00` — world generated and rendered, chopper touched down, disembark transitioned to top-down view, extraction guide showed 14 m, frame diagnostics showed 60 FPS / 16.7 ms, and the console had no warnings or errors.
- Orientation revision: `npm run build` passed (608.66 kB minified, 156.70 kB gzip); `npm run format:check` passed. The preview regenerated `PHASE4-00` from camp and showed no console warnings or errors. The earlier rotated-map smoke also confirmed touchdown and disembark at 60 FPS / 16.7 ms.
- The full suite was rerun after relaxing the 24-seed assertion; all 23 tests passed, including the four orientation seeds and Phase 5 routing coverage.
- Phase 5 `npm run build` — passed; bundle is 613.60 kB minified (158.10 kB gzip), with Vite's existing advisory above 500 kB.
- Phase 5 `npm run format:check` — passed.
- Embedded-browser Phase 5 smoke — deploy/touchdown and top-down disembark worked; a right-click route showed `ROUTING` then `ARRIVED`; a second active route cancelled with Escape and showed `CANCELLED`; path calculation read 0.20 ms (1 request); preview showed 60 FPS / 16.7 ms at 640×700.
- Phase 6 `npm test` — passed: 6 files, 29 tests, including 10,000-agent updates, stable state across tier changes, and defeated-agent removal.
- Phase 6 `npm run build` — passed; bundle is 630.26 kB minified (163.03 kB gzip). Vite reports its existing advisory above 500 kB.
- Phase 6 `npm run format:check` — passed.
- Embedded-browser smoke on the local preview — 10,000 agents loaded with stable IDs and all 10,000 living; near/mid/far counters changed as the horde converged. The player took 57 recorded attacks and reached zero health while all agents remained alive. The scene ended cleanly and returned to camp; a separate 100-agent run verified live third-person to top-down camera switching. Browser console had no warnings or errors.
- Hit-test smoke — a visible instanced agent took a left-click hit and showed 50 health remaining. On the narrow preview, closing the lab exposed persistent reopen/end controls while diagnostics were hidden; ending the scene returned to camp and hid stress telemetry. Browser console had no warnings or errors.
- Two 36-sample benchmark runs (eight warm-ups each) used `PHASE6-SMOKE`, Eight clusters, fixed 1/60-second updates, Codex in-app browser preview at 640×697. Mean/p95 milliseconds: 100 agents 0.011/0.100 and 0.008/0.100; 1,000 0.108/0.700 and 0.078/0.500; 5,000 0.792/4.800 and 0.586/4.300; 10,000 1.547/11.300 and 1.517/11.900. These measure simulation only, excluding scene creation, rendering, and UI; host GPU/model is not exposed.
- Pointer Lock was denied in the embedded browser during Phase 1. Phase 2 retains drag-to-look and click aiming; use a desktop target browser if testing Pointer Lock itself.
- Build/runtime used Three.js 0.186.1, Vite 8.3.1, TypeScript 7.0.2, Vitest 5.0.2, Node 22.19.0, and npm 11.6.0.

## Phase 4 decisions

- The chopper spawn remains at the central crossing so the Phase 3 run state and extraction point stay in one place. Generated placements must leave an 18 m collider-free radius; the disembark point 14 m east must remain walkable.
- Five named districts use independent seed streams for position jitter and asset placement. Roads and forest trails vary per seed but remain axis-aligned in the current renderer.
- A stable seed hash chooses one of four quarter-turn orientations for all map areas and content. `PHASE4-00` through `PHASE4-03` cover all four; urban and forest district sets are always generated, and the regression asserts each seed includes city buildings and forest props.
- Seven cache sites are distributed across five named loot zones. The generator rejects a site if it is blocked, too near another cache or the landing zone, unreachable, or more than 145 m of grid route from the chopper.
- Each generated map includes a water tower and radio mast landmark, each with an exposed approach point for navigation checks.
- World-data generation has a 50 ms p95 budget, excluding scene rendering. The orientation-revision 24-seed sample measured p95 1.86 ms and maximum 2.26 ms on the development host.

## Phase 5 decisions

- Player navigation and zombie pursuit use separate `GridNavigator` instances, so dynamic hostile blockers affect player routes only.
- The player navigation grid remains 2 m per cell. Route smoothing samples at 0.6 m intervals and skips waypoints only when the segment remains walkable.
- Living hostiles farther than 3.2 m from the player become temporary player-route blockers with a 0.8 m radius; this overlay refreshes every 0.3 seconds. Closer hostiles stay in immediate combat movement and do not block the player's current cell.
- Cache/pickup approach routes target 2.1 m from the object; extraction approach routes target 5 m. Existing use ranges remain 3.6 m and 6.5 m, leaving room for waypoint arrival tolerance.
- Lack of route progress for 0.55 seconds triggers replanning. Two stuck retries are allowed before cancellation and feedback. Escape cancels a route; a new right-click replaces it.
- Diagnostics show the latest and maximum route-request time in milliseconds and the number of requests.

## Phase 6 decisions

- Agent identity is the stable numeric ID `index + 1`; health, alive state, position, facing, attack count, and tier cadence remain in fixed typed arrays for the scenario lifetime.
- Tier ranges are near at 34 m, mid at 92 m, and far beyond 92 m. Tiers refresh every 0.25 seconds; near/mid/far movement updates run at about 30 Hz, 6.25 Hz, and 2 Hz.
- A 4 m local grid serves neighbor separation and nearest-agent queries. Steering checks the 2 m static walkability grid and deflects left/right when the direct step is blocked; zombies do not run individual A* routes.
- Near attackers deal 8 damage every 1.3 seconds within 1.7 m. Crowd separation considers nearby agents and caps work at 12 neighbors per update.
- Benchmark cost is the simulation step only. It uses eight warm-ups and 36 samples per count; browser scheduling can shift p95, so compare repeated runs on the eventual Phase 7 reference machine.

## Phase 7 decisions and current evidence

- Frame-time p95 is a rolling nearest-rank p95 of the last 120 `requestAnimationFrame` intervals. JavaScript frame p95 includes the animation callback's JavaScript work; simulation time measures the fixed-update block per display frame.
- GPU p95 uses `EXT_disjoint_timer_query_webgl2` without waiting for the GPU. It reports unavailable on browsers without that extension; disjoint samples are discarded.
- `renderer.info` draw calls and triangles are for the currently selected camera. Geometry and texture figures are renderer object counts, not byte estimates. JavaScript heap is reported only where the browser exposes its optional heap API.
- Sparse horde transform/color changes are coalesced in sorted index order. When fewer than 30% of instances change and there are at most 64 ranges, Three.js receives partial buffer update ranges; otherwise the attribute falls back to a full upload.
- Initial steady-state local preview profile: Codex in-app browser, idle camp, third-person, 1280×720 canvas at 1.00×: 60 FPS, 16.7 ms frame-interval p95, 4.40 ms JS-frame p95, 0.00 ms mean fixed-update time per frame (rounded to two decimals), 4.66 ms GPU p95, 468 draw calls, 17,490 triangles, 23 MB JavaScript heap, 111 geometries, 3 textures. This is not an active run or stress profile, and host hardware is not exposed.
- The final reference machine and final targets remain open. The plan's provisional targets are 60 FPS for normal play and at least 30 FPS in the stress scene; the owner previously observed 60 FPS at 10,000 enemies on an unspecified setup.
- The owner explicitly approved Phase 7 on 2026-09-26 and authorized Phase 8. This approval is the phase gate; it does not fill in the missing reference-machine measurements above.

## Phase 8 decisions and current evidence

- Every generated city building with a walkable exterior approach gets a stable entrance ID derived from its placement index. The door mesh and building body resolve to that entrance, so top-down clicks on a roof/body can route to the front door even when the roof occludes the door mesh.
- An interior layout uses `${worldSeed}:${buildingId}` plus the `interior-v1` generator stream. Room count is 2–4. The selected building and world seed reproduce the same room themes, furnishings, loot, and infected spawn.
- The interior uses its own 24 m collision/navigation map and a flat floor. Authored furniture pieces are assembled from shared room themes; wall openings and collision boxes come from the same layout data.
- Owner playtest found that the entry point overlapped the front center divider. Commit `e20fa6d` aligns that divider opening with the entry/exit coordinate, creating a clear passage. Owner retest is pending; checks were not rerun for this correction.
- Entering stores the current outdoor position, hostiles, camera view/yaw/pitch, and navigation contexts. Exit returns to that outdoor position and restores the outdoor hostile objects. Camera mode and heading persist; the camera snaps to the new scene's follow position to avoid drifting across the map.
- The outdoor timer and hostiles pause inside. Player health, ammo cooldown, dash/ability cooldowns, and the room encounter continue. Room hostiles and remaining loot persist for the rest of the run; a new run clears that progress.
- Browser preview launch, deploy/disembark, and top-down route were observed at 639×698 / 1.00× in the Codex in-app browser. Console warning/error capture was empty. The full door/room/exit flow remains unverified in browser and is specifically included in the owner playtest checklist.

## Verification

- `npm test` — passed: 8 files, 34 tests. Includes deterministic 2–4 room generation, room/loot/encounter route reachability, and walkable exterior entrances in the existing 24-seed regression.
- `npm run build` — passed; 645.89 kB minified (168.19 kB gzip). Vite still emits its default advisory above 500 kB.
- `npm run format:check` — passed.
- Browser preview — game rendered at 60 FPS / 16.7 ms in the 639×698 embedded-browser viewport; deploy, touchdown, disembark, and click-to-move route telemetry worked. The attempted field traversal ended in death before door entry; console error/warning capture was empty. Owner should verify the full new interaction flow.

## Known limits and next action

- Phase 7 remains owner-accepted, but its regular-run and 10,000-agent reference-hardware profiles were not documented. The reference browser/machine and numeric final limits remain open.
- Next: owner retests Phase 8 entry clearance and movement, then checks door targeting, camera behavior, loot/encounter persistence, same-position exit, and outdoor pause/resume. Repeat verification before marking Phase 8 Accepted.
- Stress visuals are intentionally simplified low-poly instances; this phase proves tracked simulation and horde behavior, while Phase 7 owns draw-call, memory, frame-time, and reference-hardware targets.
- Local obstacle steering is a short deflection check rather than full route planning. The owner should flag groups that stall at blocked cells or bunch in narrow spaces.
- The regular run still caps at seven hostiles and remains separate from the Horde Simulation Lab.
- Phase 4 generation timing excludes scene construction. Phase 5 route timing, the Phase 6 simulation benchmark, and the Phase 7 idle-camp sample are local preview measurements, not reference-hardware performance claims.

## Handoff format for future coding sessions

Keep factual evidence and the next exact task here. For later phases, include changed systems, decisions, commands and results, manual/browser checks, performance conditions, known issues, owner feedback, and commits.
