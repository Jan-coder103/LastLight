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
3. The horde benchmark can spawn and track 10,000 agents without a crash. Phase 7 recorded desktop performance and applied distance-based LOD; future profiling may add frame-time, simulation, draw-call, memory, and hardware/browser detail if needed.
4. Generated runs are reproducible from a seed, including map layout and initial loot placement. Random events after start can use a separately recorded seed.
5. Every phase can be launched, tested, and playtested independently. Broken acceptance criteria remain open in the tracker.

## Scope and priorities

### First playable loop

One city–forest map, one chopper, one player, a small set of loot and weapons, basic zombies, one extraction point, death/loss, and a simple base inventory/shop. Use placeholder art where needed. Prioritize control feel, readability, and the loop before content volume.

### Later content, after the core loop and performance gates

Military base and large city maps with fuel costs; mutated animals, giant spiders, janky robots, human survivors, and bandits; gates and fences; a companion bot; rain puddles and wet-ground reflections. These are candidate milestones in the backlog, not hidden requirements for earlier phase acceptance. Noise awareness, exploding barrels, and combat/readability feedback are scoped in Phases 15 and 16.

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
4. Review desktop performance and visual quality in representative gameplay; record any known tradeoffs.

**Acceptance:** the owner confirms the desktop performance and visual quality are acceptable after the rendering changes. Additional per-case profiling or mobile validation can be scheduled later without holding this phase open.

### Phase 7 performance review — accepted 2026-10-01

Reference desktop: Ubuntu Linux, Intel Core i5-3570K at 3.40 GHz, Nvidia GTX 1650 4 GB, 16 GB RAM, Firefox latest as reported, 1920×1080 display. After the three-tier approved-catalog LOD rollout, the owner reports FPS mostly above 50; the busiest map area with 10,000 agents is typically above 40 FPS, with two brief dips to 35 during a 20-minute session. The owner accepts Phase 7 as complete and closed on 2026-10-01. Earlier camera-specific means are retained in the tracker as historical pre-LOD context.

The LOD path has three levels at 0/58/200 m with 12% hysteresis. Pine trees and burned-tree clusters use hand-authored lower-detail models; other approved assets generate low and very-low visuals from the detailed selected variant. Very-low geometry uses at most three round-primitive segments, a 0.45 m default feature cutoff plus per-asset filters, material merging with indexed geometry, and no cast shadows. Fog and draw distance remain unchanged. No assets in `unapproved-assets/` are included.

Phone testing remains deferred and is not part of the completed desktop phase. If future performance work is prioritized, collect more detailed profiling and a phone profile as useful diagnostics; these are follow-ups, not remaining Phase 7 acceptance requirements. Optional profiling notes are tracked separately in `tracker.md`.

**Acceptance record:** owner accepted Phase 7 and closed its rendering/performance gate on 2026-10-01 after the reported 20-minute LOD session. Phone testing is explicitly deferred; more detailed profiling can be considered later if needed.

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
3. Add a shaped backpack shared between camp and field, with drag placement, ground drop/pickup, equipment selection, and persistent extraction/death rules. Keep camp resources and safe-reserve items protected.
4. Add the scrap yard exchange and food stand as reachable camp services; make vendor purchases respect backpack space and saved credits/scrap.
5. Keep the city–forest run free. Show future destinations as unavailable until their maps exist; then add fuel-cost selection, starting with military base and then large city.

**Acceptance:** a player can manage and arrange gear, buy/sell/upgrade, use the camp vendors, select an available run, and depart from the hub; the same backpack persists into and out of a run, extraction banks it, and death replaces it with the starter kit without touching banked storage. Owner playtests navigation, item interactions, and economy friction.

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
3. Populate each region only from its eligible theme pool: city shells, utility plant, street props, and wrecks in urban areas; burned trees, lookout structures, ranger cabin, weather station, pylon, timber, and rock in forest; barn, silo, tractor, pumpjack, and wind pump in farm; hangar, helipad, radar, checkpoint, barricades, communication truck, and floodlights in military; lighthouse, dock crane, and containers on the coast; and tent, fire bin, generator, and abandoned substation at survival camps. Use regional landmarks as anchors, then add weighted local dressing.
4. Adapt placement clearance and collision validation to asset size, open structures, interaction points, and existing single-box collider limits. Keep spawn, extraction, cache routes, building entrances, and landmark approaches reachable; reject or retry blocked seeds.
5. Add deterministic tests for region coverage, theme-pool eligibility, same-seed layouts, rotated layouts, collision/overlap limits, and reachable objectives. Add a batch-of-seeds report and update the map preview/docs with each supported theme.

**Acceptance:** generated maps contain readable, contiguous, seed-reproducible themed regions; placed assets always belong to their region's pool; all required routes and interactions remain reachable across the seed regression set; city–forest remains playable; and the owner playtests several maps and approves their visual coherence and navigation.

**Implementation decision (2026-09-29):** each seeded Greywood run now includes all six themes on the existing 280 m map. The original city–forest route remains central; farm, coastal, field-base, and survival-camp regions form outer routes. All map data rotates through the existing four quarter-turn orientations. The field-base theme does not unlock the separate Military Base destination.

## Phase 14 — Extraction horde pressure

**Goal:** make the scalable horde part of a normal extraction run and create rising pressure the longer the scout stays outside.

1. Start an outdoor run with 20 seeded, walkable hostiles distributed across the map; add one more every two seconds while the scout is outside, up to the existing 10,000-agent capacity.
2. Use the scalable horde simulation for field movement and combat. Preserve the arrival grace period, pause outdoor horde movement and spawn time inside buildings, and resume from the same state on exit.
3. Route rifle fire, top-down target assist, turret, artillery, grenades, player damage, and extraction interruption through the same hostile state.
4. Share one zombie design between the Horde Lab, field horde, and building encounters. Keep the detailed model for near/mid agents and use compact cylinder instances for the far tier.
5. Remove defeated hostiles from the rendered scene and instance pools; do not leave dead models standing on the map.
6. Show the growing threat in the field HUD and record performance and known limits.

**Acceptance:** an owner can deploy, confirm 20 dispersed hostiles, observe one new hostile every two seconds during outdoor play, and feel the rising pressure; field weapons and abilities can damage the horde; defeated hostiles disappear from play; far agents use the cylinder LOD; extraction remains interruptible by nearby enemies; building visits pause and resume outdoor activity; seeded runs reproduce initial and later spawn locations; and the horde remains readable and performant at the intended desktop target. Owner playtests the full extraction loop.

## Phase 15 — Dormant horde and noise awareness

**Goal:** make distant enemies add to the dread of the map without paying the cost of simulating every agent continuously, then let player noise determine when they focus on the scout.

1. Keep far-away agents dormant at their saved seeded position, health, and identity. Dormant agents do not move or run behavior updates.
2. Activate agents when the scout enters a defined proximity radius. Active but unaware agents roam locally using seeded random movement, then return to dormancy when the scout leaves the activation area.
3. Add a player noise meter driven by loud actions. Its current level defines the radius where enemies can notice, investigate, and gain focus on the scout; show that awareness radius as a subtle ground circle around the player, separate from the proximity radius used to activate simulation.
4. Preserve near/mid detailed rendering, the far cylinder LOD, stable targeting, and horde capacity while agents change between dormant, roaming, aware, and focused states.
5. Tune the transition ranges, noise decay, and response timing in a playable extraction run so quiet travel feels tense and loud play pulls pressure toward the player.

**Acceptance:** the same seeded run preserves distant agents while dormant; nearby agents wake and roam without immediately homing in; loud actions expand enemy awareness and pull focused enemies toward the scout; quieting down lets focus decay; building entry still pauses outdoor activity; and the owner playtests the stealth-to-horde pressure loop and its performance.

**Implementation decision (2026-10-01):** at the owner's explicit request, Phase 15 implementation is proceeding while Phase 14's revision review remains open. The field activation radius is 92 m, aligned with the existing mid/far LOD boundary. Per-agent local roaming is seeded from the stable agent ID and stays within a 16 m patch. Noise decays at 0.12 per second and maps linearly to a 140 m maximum awareness radius from the latest loud action; aware agents investigate for up to 1.1 seconds, then focus on the scout. Focus fades over 1.6 seconds after awareness ends. These are first-pass values for owner tuning, not phase acceptance evidence.

## Phase 16 — Combat feedback and field interaction polish

**Goal:** make hits, pickups, movement, and cursor behavior more readable and responsive while keeping effects lightweight at horde scale.

1. Add pooled, low-cost blood particles when a shot hits an enemy, a subtle hit flash on the struck enemy, and a small directional knockback that does not launch enemies or break navigation. Audit artillery ground-impact feedback: retain the existing slight camera shake if confirmed; add it only if missing. Respect reduced-motion and shake-intensity settings.
2. Add pooled and capped low-poly ground blood trails behind shot-wounded enemies as they move; each mark fades out after 10 seconds. Disable trail creation when more than 500 living enemies are present, and re-enable it only after the count drops below 100.
3. Add a pickup prompt above an item only inside its pickup range. Style it as an **F** keycap and animate its press state when F is used to collect the item.
4. Add hold-Shift sprinting. Increase adrenaline's current +50% movement-speed bonus by about three times, targeting a +150% bonus (2.5× base speed); tune duration and handling so it combines predictably with sprinting.
5. Add a compact pickup feed beside the character HUD. Append pickups at the bottom; keep each entry visible for three seconds, then fade it out and remove it. When an older entry leaves, move newer entries up while preserving their FIFO order.
6. In third-person, request pointer lock automatically when the browser permits it. Escape or one Ctrl press unlocks; clicking the game scene relocks, while clicks on HUD controls do not. Keep a clear fallback when browser policy denies pointer lock.
7. Add an approved low-poly explosive-barrel asset with detailed, low, and very-low LODs. A shot starts two visible red blinks over a two-second fuse, then triggers the shared artillery explosion and damage effect.
8. Move the lowest approved world-asset LOD transition from 200 m to 120 m; preserve the middle transition at 58 m and its existing hysteresis. Cover the new threshold in transition tests.
9. Add automated regression tests for effect lifetimes/pooling, hit feedback and knockback, artillery impact shake and accessibility settings, pickup-prompt range/press animation, sprint/adrenaline speed combination, pickup-feed FIFO/fade timing, pointer-lock eligibility and HUD exclusions, barrel fuse/blinks/explosion/damage/LOD, blood-trail expiry and the 500/100 hysteresis, and the 120 m world LOD boundary. Run the tests and build, then smoke-test both camera modes and the full pickup/combat flow in a browser.

**Acceptance:** all features above work in both camera modes; controls remain responsive through pointer-lock changes; effects stay within the particle/trail budgets and obey accessibility settings; barrel timing and blast behavior are deterministic; the world LOD switches at the approved distances; automated tests and build pass; and the owner playtests combat readability, pickups, sprint/adrenaline, barrels, and performance.

**Tuning note:** “three times the current adrenaline boost” is interpreted as tripling the current +50% bonus to +150%, for 2.5× base movement speed. Confirm the feel during the owner playtest before acceptance.

## Backlog after phase 16

Prioritize by playtest value and measured cost: military-base and large-city destination generation, props, loot, and fuel pricing; fences and interactive gates; companion bot; additional enemy families and survivor/bandit behavior; optimized rain puddles/wet reflections; plane variant. Promote an item to a scoped phase or subphase before implementing it, with acceptance criteria and tests recorded in `tracker.md`.

## Open choices to settle during implementation

- Reference desktop/browser and final FPS/frame-time/memory targets, after baseline measurements.
- Whether the camera switch key should be rebindable; it is Tab in the phase 2 field test.
- Run duration, extraction countdown, inventory capacity, starter kit, and fuel/economy values, after phase 3 playtests.
- Final art/audio sources and licenses, before shipping public builds.
- Exterior simulation behavior during interiors (resolved in phase 8): pause the outdoor timer and hostiles while inside; keep player health and ability/weapon cooldowns active, and run the interior encounter normally.

These decisions should be recorded in `HANDOFF.md` when made and reflected here if they change the roadmap.
