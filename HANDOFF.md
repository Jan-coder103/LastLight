# Coding handoff

Updated: 2026-10-03

## Inventory and scrap-yard follow-up

The hub and mission inventory now share one grid and retain the same item positions on deployment. There is no mission-only rifle/grenade injection. New saves and saves from before this fix receive a starter rifle and three grenades once; after a death, the carried backpack is lost and that starter kit is reissued in camp. A successful extraction saves the updated backpack. Banked resources and the camp reserve remain safe. The scrap service marker, worker, and hut moved to the east side of camp at approximately `(18, -4.5)` and `(23, -5)`; two irregular, enlarged piles overlap near `(21, 0)` and `(25, 1)`, well north of the chopper landing ring. Navigation colliders follow the new geometry. Build and 55 tests pass; browser checks showed the same rifle and grenades in the camp and field menus, including after dropping a grenade in camp, and a reachable scrap vendor beside the larger piles. The owner completed Phase 10's playtest and accepted it on 2026-09-29 after fixing reported issues.

## Current position

Phases 1–13 are **Accepted**. Phase 14, extraction horde pressure, is **Revisions needed** after owner feedback that dead zombies remain visible and that the far tier can use cylinders. The revisions remove dead enemies from render pools and add a compact cylinder LOD for far horde agents; verification and repeat owner playtest remain open. At the owner's explicit direction, Phase 15, dormant horde and noise awareness, is **In progress** while Phase 14's review gate remains unresolved; its automated checks, browser smoke, and owner playtest remain open. Phase 16 (combat feedback and field interaction polish) is implemented and **Awaiting owner playtest**. Its production build and full suite pass (24 files, 76 tests); the test scripts run Vitest with one worker so the world-generation p95 benchmark is measured without concurrent test-file load. The embedded browser denied Pointer Lock; its drag fallback appeared, and a fresh reload after the console fix added no new Three.js errors. Per the owner's direction, visual pickup/combat-flow testing is deferred to their playtest. Phase 17 (camp atmosphere, hub dressing, and first-person view) is implemented and **Awaiting owner playtest**. Its production build and regression suite pass (27 files, 84 tests). No further browser gameplay checks were run, following the existing owner review instruction. See `plan.md` and `tracker.md` for scope. On 2026-09-29, the owner completed the combined Phase 10/11 playtests and the Phase 13 four-rotation review, confirming fixes and acceptance. Phase 7 closed on 2026-10-01 after the approved-catalog LOD rollout and the reported 20-minute desktop performance session. Phone testing remains deferred.

## Phase 14 implementation in progress

- The field run uses the Phase 6 scalable simulation with a 10,000-agent capacity, 20 initial seeded ring placements, and one new seeded walkable placement every two seconds around the scout's current position. New agents enter from 82–128 m out; Phase 15 keeps them dormant until they enter the 92 m activation radius.
- The existing 12-second insertion grace remains. Once active, nearby aware enemies investigate noise and focus on the scout; active but unaware enemies roam locally. Outdoor movement, awareness/noise decay, and spawn time pause inside buildings and while the backpack pauses gameplay; outdoor state resumes on exit. The extraction phase continues to be vulnerable to nearby hostiles.
- Rifle ray hits, top-down assisted targeting, turret, artillery, grenade damage, player damage, and extraction danger now route through the field horde. Third-person aim resolves against live horde positions as well as rendered geometry, covering gaps in multipart LODs; it passes the selected horde index through damage rather than depending on a second muzzle-ray lookup. Top-down assisted shots do the same. Near/mid agents and indoor encounters use the shared multipart zombie; far horde agents use simple cylinders. Compact tier pools preserve hit-to-agent mapping. Dead agents leave the render pool, and indoor defeated zombies leave their current scene.
- The field HUD displays living/spawned counts. A restrained radio line appears at periodic reinforcements.
- The production build now passes with these revisions and the Phase 15 implementation. Automated checks, browser smoke, and the repeat owner playtest remain open. The horde remains capped at its existing 10,000-agent capacity; regular-run desktop performance and the combined indoor/outdoor flow still need review.

## Phase 15 implementation in progress

- The regular field horde uses separate active and dormant spatial rosters. Agents farther than 92 m from the scout stay dormant at their saved position, health, identity, and far cylinder tier. They wake inside 92 m, roam within a seeded 16 m local patch, and return to dormancy at their current position after leaving the radius.
- Walking maintains a 10 m field noise radius while the scout is moving. Rifle fire, dash, turret shots, artillery, and grenade throws/impacts can raise it up to 140 m. Noise decays at 0.12 per second after movement and loud actions stop. Aware agents investigate the latest noise location for up to 1.1 seconds, then focus on the scout. Focus decays over 1.6 seconds after the agent leaves the shrinking awareness radius.
- The field HUD shows noise level and its current radius, with a subtle terrain-following circle around the scout showing the same radius. The same ID and typed-array slots remain in use for targeting, damage, LOD, and render-pool mapping as agents switch state.
- The initial 92 m activation radius matches the current far/mid LOD boundary. The local roaming anchor keeps waypoints within 16 m. These ranges and response timings are first-pass tuning for owner review.
- Building entry and backpack pause still skip the outdoor horde tick, so movement, focus decay, and noise decay pause with the rest of the outdoor simulation.
- `npm run build` passes. Automated checks, browser smoke, and owner playtest have not been run for Phase 15. Phase 14 verification and the repeat owner playtest also remain open.

## Phase 16 implementation — awaiting owner playtest

- Implementation commit: `3b63ee8`.
- Shot hits now emit bounded pooled blood feedback, briefly tint the struck enemy, and apply modest navigation-safe knockback. Artillery uses the existing ground-impact shake through the reduced-motion and shake-intensity settings.
- Moving shot-wounded enemies can leave pooled ground marks. Marks expire after 10 seconds; creation disables above 500 living hostiles and resumes below 100.
- In-range pickups show an animated F keycap. A FIFO pickup feed stays visible for three seconds and fades entries before removing them. Shift sprint is 1.45× base speed; adrenaline is 2.5× base speed, and both multiply to 3.625× when combined.
- Third-person automatically requests Pointer Lock when permitted. Escape/Ctrl unlocks; scene click relocks; HUD click targets are excluded. Embedded-browser denial displays the drag-to-look fallback.
- Added an approved low-poly explosive barrel with detailed/low/very-low LODs, two red blink windows over its deterministic two-second fuse, and the shared artillery blast/damage behavior. The world-asset very-low transition is now 120 m; the middle threshold remains 58 m with hysteresis.
- Fixed a console error in `src/assets/lowDetailVisual.ts`: Three.js 0.186 logs an error for `Object3D.add()` with zero arguments, reached when a generated low-detail group has no unmerged meshes. The empty-list guard is covered by a regression test. A fresh embedded-browser reload after the fix added no new Three.js console errors; earlier historical console entries remain in the browser log.
- Focused feature regressions pass. The existing 24-seed world-generation timing check now warms the generator before collecting samples. `npm test` passes (23 files, 75 tests); both `test` and `test:watch` use one Vitest worker to keep unrelated test files from distorting the p95 timing sample. `npm run build` passes. Vite retains its advisory for the shared ~736 kB asset-document chunk. Targeted Prettier checks pass for changed source, README, and handoff files; `tracker.md` retains the project's existing table layout. `git diff --check` passes.
- The user requested that visual gameplay testing wait until their review. A brief prior smoke verified both camera modes, top-down route/fire, and the pointer-lock denial fallback; do not perform additional gameplay checks before the owner playtest. Phase 16 remains open until the owner reviews pickup/combat feedback, sprint/adrenaline, barrels, pointer controls, and performance. Phases 14/15 remain separate open gates.

## Phase 16 owner revisions — 2026-10-03

- Pickup feed moved out of the bottom HUD and follows the projected character position, 34 px to its left, with no background or border. FIFO timing is unchanged.
- Barrel shells and fuse caps blink dark red at every LOD with a lightweight additive red halo. Detonation detaches and hides the entire placement, preventing the LOD updater from making it visible again or raycasts from hitting it.
- Raised the third-person orbit pivot/follow position by 0.9 m (1.75 m to 2.65 m), retaining mouse pitch, shoulder offset, and aiming direction.
- Verification: production build passed with the existing shared-chunk size advisory. Updated material-isolation regression for whole-barrel blinking and added coverage for color restoration, LOD updates after detonation, and absence from scene raycasts. `npm test` passed: 24 files, 76 tests. Targeted Prettier checks and `git diff --check` passed.
- Repeat owner playtest remains open; no additional browser gameplay checks, following the existing owner instruction.

## Phase 17 implementation — awaiting owner playtest — 2026-10-03

- Changed the existing direct sun to a warmer low-sun color and ambient fill to a cool blue tint. The pass adds no lights, shadow maps, or post-processing stages; low-sun field presets use the same warm/cool palette.
- Replaced camp-path and generated-trail colors with a beige/gray packed-earth palette and one shared deterministic 64×64 `DataTexture`. UVs tile it at roughly 2.8 m per image; this adds a reusable sampler without adding geometry or a draw call.
- Added deterministic low-poly grass tufts and pebbles as four shadowless instanced batches. Detailed blades/icosahedral stones are used within 20 m, single low-poly shapes per spot from 20–60 m, and instances are omitted beyond 60 m. Batches refresh at 4 Hz.
- Expanded the hub with six bivouac tents, resident and seated civilian figures, a communal fire, and scattered supply crates. Added colliders for all six tents, both gate leaves, and the fire so the existing service routes remain a pathfinding requirement for review.
- Rebuilt the perimeter as tall scrap-plated fence panels with instanced bolt heads, barbed wire, reinforced pillars, and two scrap-plated gate leaves. The central entrance remains walkable through a narrowed opening; owner navigation review remains open.
- Imported the supplied 1800×1024 `skybox_hub.png` and assigned it an equirectangular background mapping while in camp. It is a wide landscape panorama, not a six-face cubemap, so the first pass can stretch horizontally slightly. Vite includes it as a 1.14 MB build asset.
- Replaced the capsule scout with a low-poly torso, head/helmet, separate arms and legs, boots, equipment, and a gait rig. Added a low-poly rifle viewmodel parented to the camera; Tab cycles third-person, top-down, and first-person. First-person hides the body after the camera transition, uses center-reticle firing, keeps camera-relative WASD and 1/2/3 abilities, and zooms with the mouse wheel by adjusting FOV.
- `npm run build` passed after the implementation. The shared asset-document chunk remains above Vite's 500 kB advisory; the panorama is emitted separately. Automated tests and browser gameplay checks have not been run. Targeted Prettier checks and `git diff --check` pass. The previously recorded owner preference defers additional gameplay checks until owner review.
- Next after the code review below: have the owner review panorama framing, density, gate and service reachability, all three camera modes, and frame rate. Phase 16's distinct review and Phases 14/15's open gates remain unchanged.

## Phase 17 code review — 2026-10-03

- Reviewed implementation commit `9a91571`. Attached the gameplay camera to the scene so its first-person weapon renders, and attached the previously orphaned rifle to the scout.
- Fixed the Horde Lab selector to reach its requested camera mode through the three-mode cycle. Corrected idle perspective dash direction at nonzero yaw, including first-person.
- The existing gate regression failed: the narrow new opening blocked both central navigation-grid columns. Widened the visual gate opening and matching colliders to 4.2 m; added a route check from outside the entrance to camp spawn. Existing service/building reachability tests pass.
- Camp returns reuse the loaded panorama texture instead of allocating another texture clone. Extracted presentation rules to cover body/viewmodel visibility during transitions and run phases.
- Added camera cycle/eye-height/FOV, perspective input/capture, dash direction, scout rifle attachment, presentation, panorama reuse/late loading, deterministic batched decoration tiers/culling, and packed-earth texture/UV regressions.
- Verification: `npm test` passed (27 files, 84 tests); `npm run build` passed with the existing shared asset-document chunk advisory. Scoped formatting and `git diff --check` passed. No additional browser gameplay checks, following the recorded owner preference.
- Phase 17 is awaiting owner playtest. Review panorama framing, camp density, all three camera modes, weapon appearance/aiming, gate/service navigation, and desktop frame rate; Phases 14–16 retain their separate review gates.

## Phase 7 performance result — accepted 2026-10-01

Owner-reported desktop: Ubuntu Linux, Intel Core i5-3570K @ 3.40 GHz, Nvidia GTX 1650 4 GB, 16 GB RAM; Firefox latest (exact version unknown) on a 1920×1080 display. Pre-LOD, few-second FPS-counter means for empty scene / corner-to-corner / 10,000-agent horde were third person ~40 / ~18 / ~18–35 FPS depending on location and top-down ~38 / ~30 / ~24 FPS. After the catalog LOD rollout, the owner reports FPS mostly above 50; the busiest map section with 10,000 agents is typically 40+ FPS, with two brief dips to 35 during 20 minutes. GPU time and heap showed N/A; the current dev panel labels GPU as P95 and reads heap from optional `performance.memory`. Game canvas/backing resolution, pixel ratio, seed, and camera path remain missing. A second laptop with a newer CPU reportedly performs similarly, but its full specs are unknown.

The owner accepts the post-LOD performance and closes Phase 7. More detailed telemetry and Pixel-class phone testing can be considered if useful later; neither is an acceptance blocker. No unchanged-build rerun is needed.

The Phase 7 path uses player-distance `LOD` levels at 58 m and 200 m, with 12% hysteresis. Pine trees and burned-tree clusters retain hand-authored low models; other approved world-catalog assets generate low and ultra-low versions from their detailed variant. The ultra-far model caps round primitives at three segments, uses a 0.45 m default feature cutoff, applies per-asset size/thin-detail filtering while preserving important long spans, merges compatible indexed geometry by material, and does not cast shadows. Building interaction IDs remain on the near model. Nothing in `unapproved-assets/` was changed; fog and draw distance remain unchanged. The owner reports FPS mostly above 50, typically 40+ in the busiest map section with 10,000 agents, and two brief 35 FPS dips in 20 minutes. Phase 7 is accepted and closed.

The shaped-item inventory extension is implemented and accepted after the Phase 10 owner playtest. **I** opens an 8×6 backpack with scout silhouette, item glyphs, drag placement, and a ground-drop arrow. The existing 90-credit cargo harness also expands it to 8×8. Field caches yield one seeded shaped item each. The same backpack is carried from camp into the field; extraction saves its changes, while death loses carried items and restores a basic rifle and three grenades. Camp resources and the safe reserve list stay protected. Firearms can be equipped from the grid; grenades occupy cells and are consumed by G. The camp has an east-side scrap hut, two enlarged intersecting piles, and a worker who converts scrap items to weightless scrap currency and trades five scrap for ten credits. A food stand buys and sells eight food items. Saved version-1 games migrate to the starter backpack once when needed.

Phase 8 adds generated 2–4 room interiors for city buildings, interactive doors, room loot and one infected, a return to the same outdoor position, and a pause for the outdoor timer/horde while inside. Implementation commit: `cf41524`; entry-clearance correction: `e20fa6d`. The owner reported the retest succeeded and accepted Phase 8.

Phase 9 adds a separate Asset Bench at `/asset-editor.html`, using the game’s shared five-asset catalog. It previews asset variants with orbit/zoom and near/far cameras; edits dimensions, collision, interaction points, and named material color/roughness/metalness; validates and imports/exports versioned JSON; and applies the active document to the game before world generation. Implementation commit: `3825cb5`. The owner found that the OS color picker’s Select action did not update the editor; commit `5042f7e` added direct `input` and `change` handling and preview updates without rebuilding the inspector. The owner retested and confirmed it works, accepting Phase 9 on 2026-09-26.

Phase 10 adds a separate walkable camp scene with a gate, perimeter fence, towers/guards, friendly NPCs, physical service stations, barracks and clinic interiors, a map/mission board, and a chopper pad. M opens the quick camp terminal; F uses nearby services and doors. Quartermaster buy/sell and the one-time cargo harness update existing saved camp data. Greywood is available at no fuel cost; Military Base and Large City are disabled. Camp buildings reuse the Phase 8 room/interior system. Implementation commit: `00bb345`. Initial playtest feedback aligned the operations board with its north-side service point, corrected the slanted tower ladder rungs, requested a more detailed helicopter, and requested separate quartermaster/storage menus. The owner completed the follow-up playtest and accepted Phase 10 on 2026-09-29 after the reported issues were fixed.

Phase 11 adds deterministic per-run low-sun/high-moon and clear/mist/rain presets, persistent accessibility options, instanced rain and hit particles, distant thunder, bounded camera shake, damage feedback, and synthesized action/weather audio cues. **O** opens Atmosphere & Accessibility. Presets take effect on the next deployment; accessibility options apply immediately. Implementation commit: `f4a1252`. Phase 11 acceptance history is in `tracker.md`; its completed walkthrough was removed from `README.md`.

## Phase 12/13 themed asset placement

The original 16-asset batch and the newly approved 22-model batch are registered in `src/assets/catalog.ts`; their source reviews are in `docs/asset-reviews/`. The second batch maps damaged row house, utility assets, and street props to urban; the fire lookout, ranger cabin, rock, timber, lookout platform, weather hut, and pylon to forest; tractor and pumpjack to farm; radar, checkpoint, and barricade to military; dock crane and containers to coastal; and generator plus abandoned substation to the survival camp. The abandoned substation has its own ID and uses variant 2 of the approved electrical substation module. `src/world/regionThemes.ts` defines urban, forest, farm, military, coastal, and survival-camp asset pools, role weights, terrain colors, density/spacing, and per-asset variant counts. Each Greywood seed generates all six themes on the 280 m map, with the original city–forest route at the center and four outer theme areas. The seeded quarter-turn rotates districts, roads, water, landmarks, loot, placements, and spawn together. The coastal water strip has matching visual and navigation collision data.

Every placement carries a theme and region ID. The generator validates eligible pools, full asset bounds, collider overlaps, landing clearance, landmark approaches, and a reachable approach for every authored interaction point. The generator keeps the existing enterable city-shell entrances separate from the new decorative building shells; those new interiors are not implemented in this phase. The owner completed the `PHASE13-00` through `PHASE13-03` review and accepted Phases 12/13 on 2026-09-29. The canonical schematic is `docs/world-themes.svg`.

Earlier Phase 13 verification on 2026-09-29, before the second approved batch: `npm run build` passed; `npm test` passed (15 files, 56 tests); the focused world suite passed (9 tests), including 16 theme seeds, same-seed replay, interaction routes, four map rotations, and seven-cache routing. The second batch extended the catalog and theme pools; its integration build passed, with no tests added or run for that follow-up. The development browser preview loaded `PHASE13-00`, deployed to Greywood, rendered at approximately 59–60 FPS after insertion, then the idle scout was downed before visual traversal. This confirms launch/deployment and renderer startup, not owner visual acceptance. A repo-wide format check still reports pre-existing review-draft files under `unapproved-assets/`; touched runtime and documentation files were formatted separately.

## Read first

1. `plan.md` for the vision, technical direction, phase scope, and acceptance criteria.
2. `tracker.md` for phase status, verification evidence, decisions, and the owner playtest log.
3. `README.md` for startup commands, controls, and the current project status.

## Phase 2 decisions and tuning

- Third-person abilities use `1/2/3`. Top-down abilities use `W/E/R`; the active map is shown in the field controls and HUD. `Tab` switches views.
- `Q` dashes for 0.22 seconds at 20 m/s (about 4.4 m) with a 2-second cooldown and no resource cost. Switching views preserves the dash direction; switching clears held movement keys.
- In top-down view, Q takes its direction from the current cursor position and briefly displays a ring-and-arrow cue. When the dash ends, the click-to-move route is recalculated from the landing point to its saved destination to avoid backtracking.
- A top-down shot turns the player toward its aim point and briefly preserves that facing while moving. Hovering a live hostile changes the cursor/reticle to a square target mark.
- Top-down left-click assist selects a visible living hostile within an invisible 44 CSS-pixel radius of the pointer. It keeps firing on the rifle cooldown until the player issues a move or dash, clicks empty space, switches views, or the hostile dies. Clicking another hostile changes the target. Selecting a hostile clears the previous move route.
- Third-person pitch now permits aiming above the horizon. Camera position orbits a fixed 9.3 m sphere centered 1.75 m above the terrain at the player, with a small right-side bias; the low edge is clamped above the ground while the upward view angle remains available.
- The camera aims along its yaw and pitch, and the player faces that horizontal look direction. Third-person follow updates directly after view transitions, so mouse orbit does not trail.
- Field ability bindings are top-down W/E/R and third-person 1/2/3. Slot 1 is a hold-to-place turret: preview radius 18 m, five seconds of firing at targets within 10 m, 22 damage every 0.82 seconds, then a 0.6-second collapse; cooldown is 10 seconds. Slot 2 calls artillery at the cursor with a 1.2-second warning, a 7 m blast radius, 100 damage, and a scorch decal that lasts 10 seconds; cooldown is 20 seconds. Slot 3 remains adrenaline, raising movement speed by 50% for 5 seconds; cooldown is 14 seconds. Either mouse button or Escape cancels a turret preview. G throws cursor-aimed grenades; deployments start with three, each has a one-second cooldown, a 38 m throw limit, a 4.2 m blast radius, and 100 damage.
- The rifle deals 50 damage with a 0.24-second firing cooldown. Hostiles have 100 health. The three-hostile encounter is intentionally small and uses A* repaths around static colliders every 0.7 seconds.
- Player health is 100. Each hostile attack deals 8 damage every 1.3 seconds while in melee range. Phase 3 replaces the Phase 2 restart overlay with a run-loss result and return-to-camp action.
- Top-down player movement uses a 2 m A* grid with static collider clearance. Phase 5 adds walkable route smoothing, moving-hostile blockers, interaction approaches, route cancellation, and stuck recovery. Third-person movement remains direct, camera-relative, and collision-aware.
- Aim uses the cursor (or screen center under Pointer Lock); the nearest static geometry blocks a shot before a hostile. Firing uses a short tracer and muzzle flash.

## What changed

- Added the view-specific input map and a visible control panel that changes with camera mode.
- Replaced the field dressing and shock pulse key actions with a hold-to-place auto turret and cursor-aimed artillery; shortened the dash cooldown to two seconds; initially added three carried grenades per deployment on G (later superseded by the shared backpack); and updated the field controls and playtest checklist.
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

## Phase 7 diagnostics and historical evidence

- Frame-time p95 is a rolling nearest-rank p95 of the last 120 `requestAnimationFrame` intervals. JavaScript frame p95 includes the animation callback's JavaScript work; simulation time measures the fixed-update block per display frame.
- GPU p95 uses `EXT_disjoint_timer_query_webgl2` without waiting for the GPU. It reports unavailable on browsers without that extension; disjoint samples are discarded.
- `renderer.info` draw calls and triangles are for the currently selected camera. Geometry and texture figures are renderer object counts, not byte estimates. JavaScript heap is reported only where the browser exposes its optional heap API.
- Sparse horde transform/color changes are coalesced in sorted index order. When fewer than 30% of instances change and there are at most 64 ranges, Three.js receives partial buffer update ranges; otherwise the attribute falls back to a full upload.
- Initial steady-state local preview profile: Codex in-app browser, idle camp, third-person, 1280×720 canvas at 1.00×: 60 FPS, 16.7 ms frame-interval p95, 4.40 ms JS-frame p95, 0.00 ms mean fixed-update time per frame (rounded to two decimals), 4.66 ms GPU p95, 468 draw calls, 17,490 triangles, 23 MB JavaScript heap, 111 geometries, 3 textures. This is not an active run or stress profile, and host hardware is not exposed.
- The owner initially approved Phase 7 on 2026-09-26, reopened it on 2026-09-29 for performance work, then accepted and closed it on 2026-10-01 after the LOD rollout and updated desktop performance report.

## Phase 8 decisions and current evidence

- Every generated city building with a walkable exterior approach gets a stable entrance ID derived from its placement index. The door mesh and building body resolve to that entrance, so top-down clicks on a roof/body can route to the front door even when the roof occludes the door mesh.
- An interior layout uses `${worldSeed}:${buildingId}` plus the `interior-v1` generator stream. Room count is 2–4. The selected building and world seed reproduce the same room themes, furnishings, loot, and infected spawn.
- The interior uses its own 24 m collision/navigation map and a flat floor. Authored furniture pieces are assembled from shared room themes; wall openings and collision boxes come from the same layout data.
- Owner playtest found that the entry point overlapped the front center divider. Commit `e20fa6d` aligns that divider opening with the entry/exit coordinate, creating a clear passage. Owner retest is pending; checks were not rerun for this correction.
- Entering stores the current outdoor position, hostiles, camera view/yaw/pitch, and navigation contexts. Exit returns to that outdoor position and restores the outdoor hostile objects. Camera mode and heading persist; the camera snaps to the new scene's follow position to avoid drifting across the map.
- The outdoor timer and hostiles pause inside. Player health, ammo cooldown, dash/ability cooldowns, and the room encounter continue. Room hostiles and remaining loot persist for the rest of the run; a new run clears that progress.
- Browser preview launch, deploy/disembark, and top-down route were observed at 639×698 / 1.00× in the Codex in-app browser. Console warning/error capture was empty. The full door/room/exit flow remains unverified in browser and is specifically included in the owner playtest checklist.

## Phase 9 decisions and current evidence

- The Asset Bench is a separate Vite page that imports the same `assetCatalog` and asset visual factories as the game.
- `last-light-authored-asset` version 1 stores an asset ID, placement dimensions, optional collider, up to 16 interaction points, and the complete named material palette. Validation rejects unsupported versions, unknown assets/materials, out-of-range numbers, invalid colors, and duplicate point IDs.
- The game reads an active document from browser storage before generating its world. Dimensions and collision affect generated placement/navigation; material values affect rendered prototypes; the building shell’s `front-door` point sets its interaction approach.
- Local browser smoke at 639×698: selected and edited the boulder, saw an invalid dimension disable save/use, reopened an asset JSON document, applied it to Last Light, started a generated run, and captured no console warnings/errors. The test override was cleared afterward.
- The owner retested the OS picker after the correction and confirmed that color selection updates the editor; Phase 9 was accepted on 2026-09-26.
- Browser interaction changed the bark swatch to `#ca9d4f`, then restored source defaults. Production build passed; the owner confirmed the native picker flow in playtest. See the checklist in `README.md`.

## Phase 10 decisions and current evidence

- The hub uses its own flat scene/collider/navigation context; it does not generate the large field world. Its entrances use the established seeded interior builder and return to the saved camp position/view.
- Services are reachable in both camera modes. Physical interactions use F; M opens the quick terminal. Greywood is available and free; future destination cards remain disabled. Fuel selection is deferred until those destinations exist.
- First-pass quartermaster prices are 50 credits for field gear, 35 for two medical supplies, and 90 for the one-time cargo harness; sales return 25 for gear and 12 per supply. These prices require owner feedback.
- Browser smoke at 639×698 / 1.00× confirmed camp rendering, route arrival at the quartermaster, F interaction and terminal opening, entrance into and return from a camp building, and Greywood deployment. No purchase was made during smoke, so storage/save round-trip still needs the owner’s playtest.
- `npm test` passed (11 files, 41 tests). `npm run build` and `npm run format:check` passed. Vite reports the existing 555.71 kB asset-document chunk above its 500 kB advisory threshold.

## Phase 11 decisions and current evidence

- Run lighting can be seeded, low sun, or high moon. Weather can be seeded, clear, mist, or rain with distant thunder. Seeded picks are deterministic; the current deployment keeps its selected preset until the next deployment.
- **O** opens the options panel. Reduced motion follows the operating-system preference by default when there is no saved preference; users can also reduce flashes, hide rain particles, disable audio cues, and tune camera shake. Accessibility changes are live. Preferences are versioned in `last-light-atmosphere-options`, separate from `last-light-save`.
- Rain and burst particles use fixed-capacity instanced batches. Combat impacts use bounded shake, a short reticle/damage feedback cue, and optional synthesized audio. Rain and thunder cues use Web Audio and start only after browser interaction.
- `npm test` passed (14 files, 50 tests); `npm run build`, `npm run format:check`, and `git diff --check` passed. Build outputs the 130.68 kB game chunk (41.34 kB gzip) and existing 555.73 kB asset-document chunk (Vite's existing advisory above 500 kB).
- Local preview smoke at 639×698 / 1× covered options open/close, preset lock during a deployment, immediate rain/accessibility toggles, a normal high-moon/rain field run, and the 10,000-agent high-moon/rain stress scene. The browser reported no console warnings or errors. The returned preview is reset to camp with seeded presets and default accessibility values.
- Normal field sample, top-down after disembark: 59 FPS, 16.8 ms frame-interval p95, 4.70 ms JavaScript frame p95, 0.02 ms simulation/frame, 1.75 ms GPU p95, 451 draw calls, 20,454 triangles, 30 MB heap, 250 geometries, 3 textures, and one active effect. Conditions: Codex in-app browser, 639×698 at 1×, seed `RAVEN-07`, three hostiles, rain enabled.
- Stress sample, third-person with 10,000 living agents: 60 FPS, 16.7 ms frame-interval p95, 9.20 ms JavaScript frame p95, 1.27 ms simulation/frame, 2.84 ms GPU p95, 409 draw calls, 256,946 triangles, 32 MB heap, 195 geometries, 3 textures, and one active effect. Conditions: Codex in-app browser, 639×698 at 1×; these are preview observations, not reference-hardware claims.
- The owner requested that the Phase 11 visual comfort, mood, audio, and accessibility review happen together with the Phase 10 camp/economy/persistence/deployment playtest. The combined review concluded on 2026-09-29; both phases were accepted after the reported issues were fixed.

## Combined Phase 10/11 playtest revisions (2026-09-27)

- Moved the operations board visual to the same north-side coordinates as its service marker.
- Grouped each tower's ladder backing and rungs so the rungs inherit the backing's slight tilt.
- Replaced the blocky camp and field helicopters with a shared low-poly model featuring cockpit framing/glazing, a shaped fuselage and tail boom, tail rotor, lights, tubular skids, and separately animated main/tail rotors. The camp rotors turn slowly while parked; the field rotors spin during deployment/extraction.
- After the owner's screenshot follow-up, scaled the helicopter 12% larger, fitted the windscreen to the curved nose, and rotated the tail rotor plane 90 degrees so it faces sideways and spins around its lateral axle.
- After the next scale review, increased the whole model again and opened troop-door apertures on both sides, with visible longitudinal bench seats and floor space for disembarking. Removed the side glazing and door panels that covered the openings.
- The owner's next screenshot showed the openings still too small beside the character and the longitudinal benches crowding the doorway. Increased the model from 1.35 to 1.85 scale (about a 13.3 m main-rotor diameter), changed the seats to transverse benches at the front/rear of the cabin, and enlarged the open side aperture to roughly 2.2 m high by 2.3 m long so a character can fit through.
- Split service menus: F at the quartermaster opens trade actions; camp storage opens a banked-inventory view; the operations board opens destination selection. M still opens the combined terminal.
- Improved the tower silhouettes and guard placement so the guard stands on the platform clear of the roof; refreshed friendly NPC shapes and gave selected camp NPCs slow routes around the hub.
- Returned both operations boards to their north-side interaction point, corrected their facing, and placed a companion board beside the map board with a hand-drawn map, notes, pins, and arrows.
- Reworked field arrival so the camera follows the incoming chopper, holds during the hover, shows a quick rappel, and gives movement control on touchdown without an arrival menu. Extraction now removes the rope and boards the scout before takeoff.
- Added mouse-wheel zoom to both field camera views.
- Replaced player-following fog spheres with animated, irregular world-space fog banks that drift slowly over the map and respond to scene lights; restored distance-based haze to soften distant scenery. Rain now places about twice as many road puddles with more varied sizes.
- `npm test` passed (14 files, 50 tests); `npm run build` passed and emits the 163.46 kB game chunk and existing 562.77 kB asset-document chunk (Vite's advisory above 500 kB); `npm run format:check` and `git diff --check` passed. A browser playtest was not repeated for this combined revision; the owner is continuing the combined playtest.
- Implementation commit: `9ec8283`.

## Field ability revision (2026-09-27)

- Kept the established view-specific bindings: W/E/R in top-down and 1/2/3 in third-person. Q remains dash with a two-second cooldown; R/3 remains adrenaline.
- W/1 starts a turret preview at the cursor and shows the 18 m placement ring. Releasing places it on walkable ground; left-click, right-click, or Escape cancels. The turret fires at hostiles within 10 m for five seconds, then collapses over 0.6 seconds. Successful placement starts a 10-second cooldown.
- E/2 places a warning circle at the cursor and impacts after 1.2 seconds. The 7 m blast deals 100 damage and leaves its scorched-ground decal for 10 seconds. Cooldown is 20 seconds.
- G throws one of three per-deployment grenades toward visible ground within 38 m. Grenades have a one-second cooldown and a 4.2 m, 100-damage blast; grenade use is separate from cargo capacity.
- Fixed top-down pursuit: player routing and hostile pathfinding now keep distinct navigation grids in both outdoor and building scenes. The player grid's moving-hostile blockers no longer make enemies path around or block one another while chasing.
- Updated the README controls and combined playtest checklist. `npm run build` passed after the pursuit-grid correction. Automated tests and browser playtest were not run for this revision.

## HUD refinement (2026-09-27)

- Removed the wide bottom control strip, including its view toggle hint, mouse-capture button, and camp-terminal button. Tab and M remain listed in the left controls panel.
- Moved the current camera view into the right-side dev telemetry panel. The controls panel remains the source for the Tab view-switch hint.
- Added a compact centered lower HUD with a red circular health meter and Q/W/E/R/G ability tiles. Ability labels show the active bindings (W/E/R in top-down, 1/2/3 in third-person); cooldown tiles dim and show a live timer, and G shows the remaining grenade count.
- Removed the duplicate health bar and ability cooldown text from the right-side field-status panel. Updated README controls and HUD notes.
- Verification: `npm test` passed (14 files, 50 tests); `npm run build` passed with the existing asset-document chunk-size advisory. A browser preview could not be started in this sandbox because local port binding is unavailable.

## Verification

- `npm test` — passed: 8 files, 34 tests. Includes deterministic 2–4 room generation, room/loot/encounter route reachability, and walkable exterior entrances in the existing 24-seed regression.
- `npm run build` — passed; 645.89 kB minified (168.19 kB gzip). Vite still emits its default advisory above 500 kB.
- `npm run format:check` — passed.
- Browser preview — game rendered at 60 FPS / 16.7 ms in the 639×698 embedded-browser viewport; deploy, touchdown, disembark, and click-to-move route telemetry worked. The attempted field traversal ended in death before door entry; console error/warning capture was empty. Owner should verify the full new interaction flow.
- Phase 9 `npm test` — passed: 9 files, 37 tests. Portable asset JSON round-trips and rejects invalid dimensions, collision, interaction points, and material settings; an override changes the shared game definition.
- Phase 9 `npm run build` — passed and emits both `index.html` and `asset-editor.html`. Vite warns that the shared Three.js chunk exceeds 500 kB.
- Phase 9 `npm run format:check` — passed.
- Phase 9 color-picker correction `npm run build` — passed and emits both pages; the shared Three.js chunk advisory remains.

## Known limits and next action

- Phases 1–13 are accepted; Phase 14 needs revisions and a repeat playtest. Phase 7 is closed and does not block the horde work.
- Next: the owner visually reviews Phase 16 pickup/combat feedback, sprint/adrenaline, barrels, pointer controls, and performance. Phase 14's revision review/repeat playtest and Phase 15's verification/playtest remain separate open gates. Optional per-scene profiling and Pixel-class phone testing remain parked follow-ups for Phase 7.
- Stress visuals are intentionally simplified low-poly instances; Phase 6 proves tracked simulation and horde behavior. Optional performance profiling can be resumed if a future regression or optimization task calls for it.
- Local obstacle steering is a short deflection check rather than full route planning. The owner should flag groups that stall at blocked cells or bunch in narrow spaces.
- The regular run's new horde path now has a passing production build, but has not had automated checks, browser smoke, or owner playtest. Measure normal-run performance after verification, especially with several hundred spawned and nearby active agents.
- Phase 4 generation timing excludes scene construction. Phase 5 route timing, the Phase 6 simulation benchmark, and the Phase 7 idle-camp sample are local preview measurements, not reference-hardware performance claims.

## Handoff format for future coding sessions

Keep factual evidence and the next exact task here. For later phases, include changed systems, decisions, commands and results, manual/browser checks, performance conditions, known issues, owner feedback, and commits.
