# Game development plan

## Vision

Build a single-player browser game and technical demo in Three.js: land in a zombie apocalypse zone, scavenge under growing pressure, and reach the chopper before a horde overwhelms you. The signature features are a smooth, usable transition between top-down and third-person cameras and a measurable simulation of up to 10,000 active hostile agents. Runs feed a persistent, walkable base camp.

The game should feel responsive before it becomes large. Each phase below ends in a playable build, an automated verification pass, and a playtest by the project owner. Only the owner starts the next phase after requested fixes are complete.

## Product decisions and resolved ambiguities

- **Initial platform:** desktop browser with keyboard and mouse. Mobile, multiplayer, and networked accounts are outside the initial scope.
- **Initial vehicle:** chopper. It handles arrival and extraction in the first complete loop. A plane can be added later as a vehicle variant.
- **Camera during a run:** arrival begins in third person; disembarking moves smoothly to the angled top-down camera. The player can switch views while on foot. The transition must preserve the player's position, heading, and current action as far as possible. Interior spaces have their own camera constraints.
- **Controls:** third person uses WASD and mouse aim/look; top-down uses right-click to move and context-sensitive left-click to attack or interact. Q is a short, free dash with a 2-second cooldown. Top-down W/E/R deploy a hold-to-place turret, call cursor-aimed artillery, and activate adrenaline; third-person 1/2/3 mirror those abilities. G throws a carried grenade when one remains in the backpack.
- **Persistence:** carried loot and equipment are lost on death. Items and fuel deposited at base are safe. A successful extraction transfers carried loot to base. Exact starting gear, recoverability, and economic balance are tuning decisions, not blockers for the first loop.
- **Time and weather:** each run chooses one time of day and one weather preset at creation. They remain stable during that run. Atmospheric effects may animate without changing the preset.
- **Horde target:** 10,000 means 10,000 individually tracked agents in a benchmark scene. Nearby agents need believable movement and combat; distant agents can update less often and use simplified rendering. The target is not a promise that 10,000 full-detail animated models are simultaneously visible. Phase 6 proves simulation scale; phase 7 proves an acceptable playable frame rate.
- **Procedural generation:** generate layout from a saved seed, then place reusable authored buildings and props. Start with a city–forest region. Military base and large city maps come later; the starting map is free, other maps can require safely banked fuel after the economy exists.
- **Visual direction:** stylized, low-poly, readable at both camera distances. Mood and effects must not obscure attacks, interactables, or the extraction direction.

## Success criteria

1. A new player can complete a run: arrive, move, loot, fight or evade, find the chopper, extract, and see recovered items at base.
2. Switching cameras feels continuous and never changes the underlying simulation or control ownership unexpectedly.
3. The horde benchmark can spawn and track 10,000 agents without a crash; the phase 7 performance gate records frame time, simulation time, draw calls, memory, and hardware/browser used. A provisional goal is 60 FPS in normal runs and at least 30 FPS in the stress scene on an agreed reference desktop. Set the actual reference machine and final limits after the first benchmarks.
4. Generated runs are reproducible from a seed, including map layout and initial loot placement. Random events after start can use a separately recorded seed.
5. Every phase can be launched, tested, and playtested independently. Broken acceptance criteria remain open in the tracker.

## Scope and priorities

### First playable loop

One city–forest map, one chopper, one player, a small set of loot and weapons, basic zombies, one extraction point, death/loss, and a simple base inventory/shop. Use placeholder art where needed. Prioritize control feel, readability, and the loop before content volume.

### Later content, after the core loop and performance gates

Military base and large city maps with fuel costs; mutated animals, giant spiders, janky robots, human survivors, and bandits; gates and fences; exploding barrels; blood trails; a companion bot; a noise/discovery meter; rain puddles and wet-ground reflections. These are candidate milestones in the backlog, not hidden requirements for earlier phase acceptance.

## Proposed technical shape

- **Application:** TypeScript and Three.js, with a lightweight development/build tool selected in phase 1. Keep gameplay systems separate from renderer and UI so the horde simulation can be profiled independently.
- **Core state:** explicit run state (`arrival → active → extracting → success/death → base`), entity IDs, inventory and currency, seeded generation, and save-data versioning.
- **Fixed simulation step:** update movement/combat at a stable step; interpolate visuals. Define one source of truth for entity transforms, independent of camera mode.
- **Camera and input:** separate input mappings and camera rigs over the same player controller. The view transition should be interruptible or safely complete before accepting another switch.
- **Navigation:** a shared obstacle representation, with a more accurate player route and cheap local horde steering. Start simple, measure, then introduce a worker, grid, flow field, or spatial partition where profiling justifies it. Do not put one expensive full path search on every zombie.
- **Rendering:** reuse geometry/materials, batch repeated props/enemies where possible, and use distance-based animation/update/render tiers. Preserve collision and entity identity when representation changes. Camera-specific visibility settings may differ, but gameplay rules may not.
- **Asset pipeline:** one small source module/data file per authored asset or logical asset family, with metadata for size, collision, interaction points, and LOD. A shared asset schema should serve the game and later editor. Keep generated map data separate from authored assets.
- **Diagnostics:** development overlay for FPS, frame/simulation time, draw calls, entity count by tier, navigation time, and seed. Support a reproducible stress scene and quick reset.
- **Testing:** automated tests for deterministic generation, input/state transitions, inventory/extraction/death rules, navigation edge cases, and save migration where applicable; browser smoke checks for rendering and interaction; repeatable performance measurements. Avoid brittle tests tied to visual implementation details.

The exact libraries, data structures, and numeric budgets are phase 1 or later implementation choices. Record chosen versions and benchmark hardware in the handoff when work begins.

## Phase workflow

For each subphase, the coding agent reads `plan.md`, `tracker.md`, and `HANDOFF.md`; inspects the current code; implements only the active scope; adds meaningful tests; runs them and a playable smoke check; commits the work to Git; updates the tracker; and writes a concise handoff with changed files, test results, known issues, and the next action. Phase 1 must initialize Git before the first commit because this folder is not currently a repository.

At a phase gate, mark the phase **Awaiting owner playtest**. The owner plays the build and records pass/fail feedback. Fixes and a repeat playtest happen inside that phase. Mark **Accepted** only after the owner explicitly accepts it. Do not start the next phase automatically.

Status vocabulary: **Not started**, **In progress**, **Awaiting owner playtest**, **Revisions needed**, **Accepted**, **Blocked**. Keep the detailed checklist and evidence in `tracker.md`.

## Phase 1 — Foundation and first explorable scene

**Goal:** establish a runnable, testable project with seeded terrain, a visible player, basic asset loading, and both camera rigs. Combat and extraction are not required yet.

1. **Project setup:** initialize Git; select/package-lock the toolchain; add scripts for development, build, tests, and formatting; document startup commands and browser target; add a clear source layout and ignore generated files.
2. **World prototype:** generate a repeatable city–forest block from a seed, with terrain, paths/roads, obstacles, and recognizable landmarks. Show the seed and allow reload with the same seed. Keep map bounds and collision data explicit.
3. **Player and cameras:** add a player avatar/capsule and basic walk movement. Implement third-person orbit/follow and angled top-down follow, smooth transitions both ways, camera collision or obstruction handling where feasible, and a visible mode indicator. Use temporary controls only where final mappings depend on phase 2.
4. **Asset foundation:** define authored asset modules and metadata; create at least two reusable placeholder props and one building shell; instance or reuse them in the generated map; document how a new asset is added. Keep a future editor import/export path in mind without building the editor now.
5. **Diagnostics and quality:** add a small debug overlay and deterministic test fixtures. Check resizing, focus loss, pointer lock release, and a route around obstacles manually.

**Acceptance:** one command starts the game; a named seed reproduces the same layout; player movement and both camera views work without teleporting; repeated props share the asset pipeline; build and automated tests pass; basic diagnostics are visible in development mode; README explains setup. Then the owner playtests movement, camera comfort, and map readability.

## Phase 2 — Controls, combat, and simple enemies

**Goal:** a small encounter feels good in either view.

1. Finalize view-specific input maps, pointer lock/focus behavior, click hit priority, on-screen controls, and camera switch rules during attacks/dash.
2. Add Q dash with a short cooldown and no energy cost; establish W/E/R ability slots with simple representative abilities and sensible third-person bindings.
3. Add one weapon, hit detection, damage, health, death feedback, basic firing effects, and a few zombies with simple pursuit/attack behavior.
4. Add player navigation around static obstacles in top-down mode and direct movement/collision in third person.

**Acceptance:** attack/interact/move commands are unambiguous; zombies chase and can damage/kill the player; dash works in both views; a small encounter is beatable and legible; tests cover damage, cooldown, input modes, and navigation around an obstacle. Owner playtests responsiveness and combat feel.

## Phase 3 — First complete extraction run

**Goal:** complete the arrival-to-base loop with minimal content.

1. Add chopper arrival, disembark, extraction marker/arrow, boarding conditions, takeoff, and a short transition to base.
2. Place loot containers and pickups; add carried inventory, capacity rules, basic resource categories (gear, supplies, money, fuel), and a simple UI.
3. Increase enemy pressure over run time with a clear warning and a fair escape window. Limit initial enemy scale; large hordes come in phase 6.
4. Implement death loss, successful banking, a minimal base inventory/shop/upgrade screen, and a next-run action. Save and load safely.

**Acceptance:** the full loop can be completed repeatedly; extraction banks carried items; death loses carried items while prior banked items remain; the arrow consistently points to extraction; save reload preserves base state; tests cover these state transitions. Owner playtests pacing and clarity.

## Phase 4 — Procedural map quality

**Goal:** runs vary meaningfully while remaining navigable and playable.

1. Expand city–forest generation with districts, roads, landmarks, vegetation, loot zones, spawn rules, and safe chopper placement.
2. Add validation for reachable key points, no blocked spawn/extraction, practical route lengths, and prop overlap limits.
3. Generate/replay a batch of seeds and save failure seeds for regression tests. Improve visual composition and points of interest.

**Acceptance:** the seed suite has no known unwinnable map; different seeds produce visibly distinct routes; map generation stays within a measured load-time budget. Owner playtests several seeds and flags repetition or confusing routes.

## Phase 5 — Player navigation quality

**Goal:** point-and-click movement feels reliable in dense spaces.

1. Improve path selection around buildings, narrow passages, doors/gates when present, and dynamic obstruction.
2. Add route cancellation/replanning, near-target interaction positioning, stuck detection, and clear unreachable-target feedback.
3. Profile route requests and keep responsiveness during enemy pressure.

**Acceptance:** the player reaches valid clicked destinations or clearly reports failure; no frequent oscillation/stuck behavior in a navigation test map; click-to-attack/interact works from sensible range. Owner playtests navigation in several layouts.

## Phase 6 — Large horde simulation

**Goal:** prove 10,000 tracked agents with believable near-field threats.

1. Add a reproducible stress scenario with controls for count, seed, spawn pattern, and camera mode.
2. Build scalable targeting/steering, spatial queries, obstacle avoidance, and simulation tiers. Preserve agent identity, health, and location as tiers change.
3. Add crowd behaviors that create growing horde pressure without expensive individual route searches.
4. Record simulation cost across 100, 1,000, 5,000, and 10,000 agents; identify bottlenecks for phase 7.

**Acceptance:** 10,000 agents can exist and update without crashes or corrupted state; nearby agents can pursue and attack; tier transitions are stable; the benchmark is repeatable and documented. Owner playtests whether the horde reads as a threat.

## Phase 7 — Rendering and performance pass

**Goal:** meet the agreed performance target while preserving gameplay clarity.

1. Profile CPU, GPU, memory, draw calls, pathfinding, particles, and camera-specific visibility. Optimize the measured bottleneck first.
2. Apply instancing/batching, simplified materials and animation, distance tiers, culling, reduced updates, and optional impostors/sprites where quality holds up.
3. Set draw distance and fog based on visual and measured needs. Reuse assets with color/orientation variants only when it actually improves cost or visual variety.
4. Measure normal runs and stress scene on the reference machine in both camera modes; log known tradeoffs.

**Acceptance:** normal play meets the final agreed frame-time target, stress scene meets its separate target, memory stays stable during repeated runs, and both camera modes remain readable. If a numeric target is missed, keep the phase open with a measured revised plan. Owner playtests appearance and responsiveness.

### Phase 7 follow-up — broad-view and mobile performance (reopened 2026-09-29)

On the reference desktop, the owner reports approximate few-second FPS-counter means for empty scene / corner-to-corner view / 10,000-agent horde: third person ~40 / ~18 / ~18–35 FPS (location dependent), and top-down ~38 / ~30 / ~24 FPS. These are the initial comparison baseline, not p95 measurements; do not ask the owner to rerun the unchanged build. The owner supplied Firefox (latest version; exact version unknown) and a 1920×1080 display resolution, but the game canvas/backing resolution, pixel ratio, seed, camera path, and comparable telemetry are not recorded. GPU time and heap showed N/A in the reported telemetry. The current dev panel labels its GPU metric P95, queries `EXT_disjoint_timer_query_webgl2`, and reads heap through optional `performance.memory`; establish whether either API is unsupported or simply has no available sample before interpreting N/A. The reference desktop is Ubuntu Linux with an Intel Core i5-3570K at 3.40 GHz, GeForce GTX 1650 4 GB, and 16 GB RAM; a second laptop has a newer CPU and reportedly similar performance, but its specifications are unknown. The product should also run in a recent mobile browser on a device in the Pixel 10a class, but phone testing is deferred until later.

**Provisional goals:** desktop normal play should sustain 60 FPS (16.7 ms frame interval p95), and the 10,000-agent stress scene should sustain at least 30 FPS (33.3 ms p95). For a Pixel 10a-class phone, the provisional normal-play goal is at least 30 FPS using adaptive quality; actual phone testing and a firm mobile gate are deferred until a device is available. The owner shared a CPU Monkey comparison that ranks Tensor G4 above the i5-3570K in its aggregate single/multi-core scores; that synthetic comparison does not predict this game's browser frame rate. The 10,000-agent benchmark on phones remains a separate decision.

**Optimization sequence:**

1. **Preserve the baseline and inspect diagnostics.** Use the supplied FPS readings as the before-state. In code, determine whether the GPU timer extension is present and whether queries are pending, disjoint, or producing samples; make the telemetry distinguish those states instead of a generic N/A where possible. Firefox may not expose the optional JavaScript heap API, so treat Three.js geometry/texture counts as the available object-count signal. The panel already reports the actual drawing-buffer resolution and pixel ratio, JS-frame p95, simulation time, draw calls, triangles, active effects, and horde instance-sync time.
2. **Classify the broad-view loss before choosing an optimization.** The wide view is ~18 FPS in third person versus ~30 FPS top-down, while the empty-scene readings are similar (~40/~38). This points to camera-dependent scene/render work as a useful first lead, not a proven cause. Compare existing counters for the two views and inspect per-placement scene construction: `buildWorld.ts` deep-clones an authored object hierarchy for each placement. If draw-call/scene traversal cost is high, prototype batching repeated static geometry/material pairs or spatially grouped scenery; preserve unique doors, landmarks, colliders, shadows, and interaction identity. If pixel/render cost dominates, test render scale, shadow coverage, and effects instead.
3. **Handle the 10,000-agent result as its own case.** The horde is already a single `InstancedMesh`, but `frustumCulled` is disabled. If its render or sync cost is significant, split the visual batch into spatially bounded chunks and verify that off-screen chunks are culled without changing simulation IDs, tier updates, visible-agent targeting, or results. Keep horde simulation cost separate from rendering cost.
4. **Change one measured cost at a time.** Candidate follow-ups are static world instancing/batching, spatial visibility chunks, distance-based detail, smaller/tighter shadows, reduced fog/rain/post effects, and a capped/adaptive render scale. Current renderer settings include a 2048×2048 shadow map and a device pixel ratio cap of 2; only change these if the counters or an isolated A/B show a gain.
5. **Compare only after a code change.** Then rerun the same empty scene, corner-to-corner view, normal run, and 10,000-agent horde in both camera modes with the same browser, resolution, pixel ratio, seed, weather, and camera path. Use longer captures than the initial few-second means and record FPS plus frame-interval p95, JS-frame p95, available GPU P95, simulation and instance-sync time, draw calls, triangles, and object counts. Keep or revert the change based on measured gain and visual/readability checks. Phone measurement is a later follow-up.

Keep Phase 7 **Revisions needed** until the broad-view and 10,000-agent targets are met on the reference desktop and the owner accepts the retest. The current baseline is captured; no further owner run is needed until a code change is ready for comparison. Actual phone testing is deferred by the owner and does not block this desktop performance gate; keep the mobile target explicitly unverified and complete that separate follow-up before claiming mobile performance support. If the desktop goals prove impractical, agree revised limits from repeatable measurements and record the decision here before closing the phase.

### Phase 7.1 — Approved catalog LOD rollout (in progress)

**Goal:** reduce distant world-render work while keeping close asset quality, map readability, collision, and interactions intact.

1. Provide far representations for every approved asset in `assetCatalog`, and do not add assets from `unapproved-assets/`. Pine trees and burned-tree clusters keep their hand-authored 58 m models; remaining assets use a fallback generated from the selected asset variant.
2. Add an ultra-far representation starting at 200 m, generated from each selected detailed asset variant. Cap cylinder/cone/toroid roundness at three segments, spheres at 3×2 segments, omit parts under 0.25 m, merge compatible geometry by material, and disable its shadow casting. Keep the 58 m tier's 0.08 m cutoff and hand-authored models intact.
3. Keep each placement's transform, identity, collision, interaction points, and close-range model. Building interaction IDs remain on the near model. LOD uses player-to-asset distance with 12% hysteresis at the 58 m and 200 m switches; tune these values only after checking both camera modes.
4. Compare asset LOD separately from other changes such as spatial culling, shadow changes, fog, and render scale. Keep the current fog and draw distance unchanged unless an isolated measurement shows otherwise.
5. Compare normal and broad views on the reference desktop and check transitions, landmarks, threats, and routes in both cameras before claiming a performance gain.

**Acceptance:** measured broad-view draw-call and JavaScript-frame costs improve on the reference desktop; all three detail levels transition unobtrusively; both camera modes preserve landmark, threat, and route readability; and repeated world rebuilds release all LOD levels cleanly. The owner reviews the visual changes before marking this follow-up accepted.

## Phase 8 — Enterable buildings

**Goal:** add short interior scavenging spaces without losing the run flow.

1. Enter a building through an interactive door; generate a small 2–4 room interior from a seed and authored room pieces.
2. Handle interior navigation, interactive doors, loot, encounters, and a clear exit back to the same outdoor position.
3. Hide/replace the exterior visually while inside, using black outside the interior walls as intended, and define how outdoor simulation advances during the visit.

**Acceptance:** entry/exit preserves run state; rooms and doors are navigable; camera and controls remain predictable; interior generation is reproducible. Owner playtests clarity and loading feel.

## Phase 9 — Simple asset editor

**Goal:** a separate small app for reviewing and adjusting authored assets.

1. Load the same asset definitions as the game; orbit/zoom, select, inspect materials and collision/interaction metadata.
2. Edit a bounded set of properties, save to a versioned portable format, validate values, and preview both camera distances.
3. Confirm exported assets load in the game without manual conversion.

**Acceptance:** an asset can be opened, edited, saved, reopened, and used in a generated run; invalid metadata is rejected clearly. Owner playtests the editing workflow.

## Phase 10 — Walkable base camp

**Goal:** replace the minimal base screen with a safe, navigable hub.

1. Build the gated camp, guards, towers, friendly NPCs, and a few enterable buildings.
2. Place shops, inventory/storage, upgrades, mission/map selection, and chopper departure in the world. Preserve a quick path through these actions.
3. Keep the city–forest run free. Show future destinations as unavailable until their maps exist; then add fuel-cost selection, starting with military base and then large city.

**Acceptance:** a player can manage gear, buy/sell/upgrade, select an available run, and depart from the hub; persistence and death-loss rules remain correct. Owner playtests navigation and economy friction.

## Phase 11 — Atmosphere and effects

**Goal:** finish the intended mood and action feedback within performance budgets.

1. Add low sun or high moon lighting presets, mist/fog, rain, distant thunder, and stable per-run weather/time selection.
2. Add restrained screen shake, firing/ability particles, hit feedback, and audio cues; expose intensity controls where helpful.
3. Measure each effect in normal and stress scenes; make expensive effects scalable or optional.

**Acceptance:** atmosphere enhances orientation and combat feedback, presets stay fixed within a run, accessibility settings work, and phase 7 performance gates still pass. Owner playtests visual comfort and mood.

## Phase 12 — Candidate asset review and integration

**Goal:** review the models collected in `unapproved-assets/`, select the ones that fit the game, and integrate only owner-approved candidates into the live asset pipeline. Candidate creation can continue in the staging folder before this phase; staging work does not change the game or advance the integration gate.

**Owner approval recorded 2026-09-29:** the original 16-model batch (ambulance wreck, barn shell, burned corner store, burned tree cluster, city bus wreck, communication truck, totaled car, fire bin, portable floodlight tower, farm grain silo, aircraft hangar, helipad, coastal lighthouse, transit shelter, wind pump, and basic camping tent) and a second 22-model batch (dry dock crane, electrical substation, fire lookout tower, abandoned substation appearance, radar dish, rock outcrop, rooftop water tank, damaged row house, scrap sorting station, street light, timber stacks, vehicle checkpoint, water treatment tanks, barricade gate, abandoned farm tractor, makeshift lookout platform, oil pumpjack, forest ranger cabin, wooden power pylon, weather station hut, portable generator, and cargo container stack) are approved for integration. Their authored modules and review sheets are in `src/assets/` and `docs/asset-reviews/`, and the themes in Phase 13 now place the approved models in their matching regions.

1. Inventory each candidate and review its source/model, dimensions, scale beside the player, silhouette at near and far camera distances, palette, material count, collision proposal, interaction points, and author-provided notes. Record a disposition for each: revise, approved for integration, or not selected.
2. Work through requested visual or metadata revisions in the staging folder. Keep the original source and review notes with each candidate so the final decision is traceable.
3. Port each selected model into a project-native authored module under `src/assets/`. Give it a stable ID, named materials, meter-based dimensions, an appropriate collider and interaction points, and a deterministic visual factory. Register it in `src/assets/catalog.ts`. Add procedural placement only when the current map supports that asset's intended theme; otherwise record the placement work in a dedicated phase, as Phase 13 does for the newly approved batch.
4. Check placement clearance and navigation for any new collision. Add deterministic generation or asset-document coverage where the integration changes those behaviors, and update README, tracker, and handoff notes.
5. Review integrated candidates in the Asset Bench and in their intended game context, including near/far readability and both camera modes where applicable. Keep staging files separate from the runtime catalog unless they are explicitly needed as source references.

**Acceptance:** every candidate has an owner-reviewed disposition; selected assets are integrated with valid metadata and either have a coherent in-game placement or a named placement phase; builds and relevant automated checks pass; the owner confirms their appearance and usability in game. Candidates not selected remain in `unapproved-assets/` and are not loaded by the game.

## Phase 13 — Seeded themed regions and asset placement

**Goal:** extend the current city–forest generator so large, seed-driven map regions have a coherent theme and draw only from that theme's authored asset pool. Use the 38 owner-approved models cataloged in Phase 12; keep the current city–forest map as the default destination while adding rural/farm, military, coastal, and survival-camp themes as supported region types.

1. Define region themes and their eligible buildings, landmarks, and props in authored metadata or a centralized placement table. Keep asset geometry and procedural placement data separate; expose a clear place for per-theme weights, density, and variant selection.
2. Generate and seed the region layout before placing assets. Give each region a contiguous footprint, meaningful transition edges, roads or trails suited to the theme, and enough room for its landmarks. Preserve seed reproducibility and map rotations.
3. Populate each region only from its eligible theme pool: city shells, utility plant, street props, and wrecks in urban areas; burned trees, lookout structures, ranger cabin, pylon, timber, and rock in forest; barn, silo, tractor, pumpjack, and wind pump in farm; hangar, helipad, radar, checkpoint, barricades, communication truck, and floodlights in military; lighthouse, dock crane, and containers on the coast; and tent, fire bin, generator, and abandoned substation at survival camps. Use regional landmarks as anchors, then add weighted local dressing.
4. Adapt placement clearance and collision validation to asset size, open structures, interaction points, and existing single-box collider limits. Keep spawn, extraction, cache routes, building entrances, and landmark approaches reachable; reject or retry blocked seeds.
5. Add deterministic tests for region coverage, theme-pool eligibility, same-seed layouts, rotated layouts, collision/overlap limits, and reachable objectives. Add a batch-of-seeds report and update the map preview/docs with each supported theme.

**Acceptance:** generated maps contain readable, contiguous, seed-reproducible themed regions; placed assets always belong to their region's pool; all required routes and interactions remain reachable across the seed regression set; city–forest remains playable; and the owner playtests several maps and approves their visual coherence and navigation.

**Implementation decision (2026-09-29):** each seeded Greywood run now includes all six themes on the existing 280 m map. The original city–forest route remains central; farm, coastal, field-base, and survival-camp regions form outer routes. All map data rotates through the existing four quarter-turn orientations. The field-base theme does not unlock the separate Military Base destination.

## Backlog after phase 13

Prioritize by playtest value and measured cost: military-base and large-city destination generation, props, loot, and fuel pricing; explosive barrels with fire/shake; noise meter and discovery radius; fences and interactive gates; blood decals/trails with pooling and limits; companion bot; additional enemy families and survivor/bandit behavior; optimized rain puddles/wet reflections; plane variant. Promote an item to a scoped phase or subphase before implementing it, with acceptance criteria and tests recorded in `tracker.md`.

## Open choices to settle during implementation

- Reference desktop/browser and final FPS/frame-time/memory targets, after baseline measurements.
- Whether the camera switch key should be rebindable; it is Tab in the phase 2 field test.
- Run duration, extraction countdown, inventory capacity, starter kit, and fuel/economy values, after phase 3 playtests.
- Final art/audio sources and licenses, before shipping public builds.
- Exterior simulation behavior during interiors (resolved in phase 8): pause the outdoor timer and hostiles while inside; keep player health and ability/weapon cooldowns active, and run the interior encounter normally.

These decisions should be recorded in `HANDOFF.md` when made and reflected here if they change the roadmap.
