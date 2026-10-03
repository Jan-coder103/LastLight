# Last Light — procedural extraction runs

A desktop browser survival run on a seeded map with city, forest, farm, military, coastal, and survival-camp regions. Deploy from camp, search caches, carry what fits, and return to the chopper before the horde grows. A successful extraction banks carried resources; death loses cargo while camp storage stays safe.

## Run locally

Requirements: Node.js 22.12+ (or 20.19+) and npm 10+.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. The target is a desktop Chromium browser (Chrome or Edge) or Firefox with WebGL2. Third-person and first-person ask for pointer lock when play starts or the view is selected; Escape or Ctrl releases it, clicking the scene captures it again, and drag-to-look remains available if browser policy blocks capture. HUD clicks never request capture.

## Controls

| Input                          | Third person                                         | Top-down                                             | First person                                             |
| ------------------------------ | ---------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| W / A / S / D or arrow keys    | Move relative to the camera                          | —                                                    | Move relative to the camera                              |
| Shift                          | Hold to sprint                                       | Hold to sprint along the route                       | Hold to sprint                                           |
| Right-click                    | —                                                    | Move around static obstacles                         | —                                                        |
| Left-click                     | Fire at the cursor                                   | Attack with cursor assist                            | Fire through the center reticle                          |
| Drag on the scene              | Look and aim if pointer lock is unavailable          | —                                                    | Look if pointer lock is unavailable                      |
| Mouse wheel                    | Zoom camera in or out                                | Zoom camera in or out                                | Zoom camera in or out                                    |
| Q                              | Dash; 2-second cooldown, no cost                     | Dash; 2-second cooldown, no cost                     | Dash; 2-second cooldown, no cost                         |
| 1 / 2 / 3                      | Turret / artillery / adrenaline (2.5× speed for 5 s) | —                                                    | Turret / artillery / adrenaline (2.5× speed for 5 s)    |
| W / E / R                      | —                                                    | Turret / artillery / adrenaline (2.5× speed for 5 s) | —                                                        |
| G                              | Throw grenade                                        | Throw grenade                                        | Throw grenade                                            |
| I                              | Open shaped backpack                                 | Open shaped backpack                                 | Open shaped backpack                                     |
| X                              | Use one carried supply to heal                       | Use one carried supply to heal                       | Use one carried supply to heal                           |
| F                              | Interact, enter/exit, or board nearby                | Interact, enter/exit, or board nearby                | Interact, enter/exit, or board nearby                    |
| Tab                            | Cycle camera mode                                    | Cycle camera mode                                    | Cycle camera mode                                        |
| World Seed field + reload icon | Rebuild the map and encounter                        | Rebuild the map and encounter                        | Rebuild the map and encounter                            |

Tab cycles through third-person, top-down, then first-person and back to third-person. First-person hides the scout body and shows a camera-mounted firearm. The player still uses direct camera-relative movement and third-person ability keys.

Press **O** or choose **Atmosphere** to open lighting, weather, and accessibility options. Lighting is seeded per run by default, with low sun and high moon alternatives. Weather is also seeded by default, with clear, mist, and rain options. Mist adds slowly drifting, irregular volumetric fog banks, light scattering, and denser distance haze; rain adds a lighter haze and reflective puddles of varied sizes along roads. Changing these presets affects your next deployment; the current run's sky stays fixed. Reduce motion/camera shake, reduce flashes, hide rain particles, disable audio cues, or adjust impact-shake intensity at any time. Accessibility options apply immediately and persist separately from camp inventory.

At camp, use **W/A/S/D** to walk in either perspective view, right-click in top-down view to route, **F** at a marked service or building, **M** for the camp terminal, **I** for the backpack, and **Tab** to cycle camera modes. Wayfarer Camp now has packed-earth paths, nearby grass and stone detail, civilian tent areas, and a reinforced perimeter with barbed wire and scrap-plated gates. The quartermaster opens its trade menu, camp storage opens the resource ledger, and the operations board opens destination selection. **M** keeps the combined terminal available from anywhere in camp.

The backpack has an 8×6 grid, with the scout shown on the left. Drag shaped items between cells; drop one on the bottom arrow to put it on the ground for later pickup. Click a firearm in the backpack to equip it. A rifle occupies 4×2 cells, a tire 5×5, and smaller items as little as 1×1. The 90-credit backpack and cargo-harness upgrade expands the grid to 8×8 and the existing cargo limit from 10 to 15. Opening the backpack pauses an active encounter. **The same backpack, including item positions, travels from camp into a mission and back.** New and migrated saves start with a rifle and three grenades; deployment does not add items. Field caches reveal one shaped item alongside their existing resource pickups. Extraction saves the updated backpack. Death loses its contents and reissues the starter rifle and grenades at camp. Banked camp resources and items in the safe reserve list remain protected.

The scrap hut and two large, overlapping scrap piles are along the east edge of camp, clear of the chopper pad. Speak with the worker there to break scrap items into weightless scrap currency, then exchange five scrap for ten credits. Scrap items cannot be sold. The food stand near the west path buys and sells all eight food items for credits; food has no consumption effect yet. Both vendors use the same backpack grid, so a purchase needs a fitting space. Simple glyphs and colored tiles stand in for later item sprites.

## Current project status

Phases 1–13 are accepted. Phase 14 remains open for revisions after owner feedback about dead-zombie despawning and far-tier visuals; the revision removes defeated agents from rendering and uses cylinder instances for the far horde tier. Phase 15, dormant horde and noise awareness, is in progress at the owner's direction while Phase 14's review gate remains unresolved. Phase 16 combat feedback and field interaction polish is implemented and awaiting owner playtest; it covers hit effects, pickup UI/feed, sprint/adrenaline, pointer lock, explosive barrels, blood trails, and the lowest world-asset LOD transition at 120 m. Phase 17, camp atmosphere and first-person view, is in progress at the owner's request; its build passes and owner visual review remains open. Phase 7 closed on 2026-10-01 after the approved-catalog LOD rollout and desktop performance review; phone testing is deferred until later. Implementation details and acceptance history are in `tracker.md`.

The compact HUD at the bottom center shows health as a red ring and Q/W/E/R/G abilities with cooldown timers. Recent pickups appear FIFO directly left of the on-screen character, with no panel background. In-range ground items show an animated **F** keycap above them. Third-person slot keys display as 1/2/3 to match the field controls. The current camera view is listed in the right-side dev telemetry panel; the left controls panel lists **Tab** for switching views.

Depart from the operations board, camp terminal, or chopper. The camera follows the inbound chopper; after it hovers, the scout rappels down automatically and controls unlock on landing. The chopper lowers a rope again for extraction, lifts the scout aboard, and flies out. Search a cache with F when close or left-click its crate; collect the revealed pickups with F or by clicking them. Top-down clicks on distant loot set a route. Recover at least one cache item before the chopper clears extraction. Gear, supplies, and fuel use carrying capacity; credits do not. X consumes a carried medical supply to restore up to 35 health. F boards when you are in the landing ring and no hostile is close; hold position for four seconds while the chopper is vulnerable to interruption.

The extraction arrow and distance remain on screen during the run. A run begins with 20 seeded infected spread across the map; one more joins every two seconds while you remain outdoors. After the 12-second insertion grace, agents beyond 92 m remain dormant with their position, health, and identity preserved. They wake inside the local radius and roam around a seeded nearby point instead of immediately homing in. Walking maintains a 10 m noise radius while moving; sprinting raises it to 20 m, while rifle fire, dash, turret shots, artillery, and grenades raise it further, up to 140 m. Noise fades after you stop, and a subtle terrain-following circle around the scout shows the current radius. Active infected in range investigate the latest noise location before focusing on the scout, and lose focus as the noise dies down. The outdoor horde and spawn clock pause while you scavenge inside a building. The field HUD shows living and spawned counts plus noise and awareness radius. Near and mid hostiles use the shared multipart model; far hostiles use a simple cylinder LOD. Defeated hostiles disappear from the rendered scene. Shots cause restrained red hit particles, a brief hit tint, and a small walkable knockback. Wounded moving infected can leave pooled low-poly blood marks that fade after 10 seconds; trail creation stops above 500 living enemies and resumes below 100. You can extract at any time, but nearby hostiles interrupt boarding. The camp quartermaster sells gear and medical supplies, and can install a one-time cargo harness upgrade. One gear kit and one medical supply are taken from camp at deployment if available. Banked items and shop purchases are saved in browser storage; carried items are lost on death.

Building doors become usable during an active run. Press **F** or click a door, then use **F** or the lit exit marker to return to the same outdoor position. The generated 2–4 room layout, loot, and infected encounter repeat for that building and world seed. Collected interior loot and defeated infected remain cleared for the rest of that run. The outdoor horde and run timer pause while inside; player health and ability cooldowns continue normally.

In top-down view, clicking near a visible hostile keeps firing until you move, dash, click empty space, switch views, or the hostile dies. Q dashes toward the cursor and briefly shows its direction; the player replans the remaining click-to-move route after landing. A dash already in progress keeps its world direction through a camera change. Hold W (or 1 in third-person) to preview a turret inside the 18 m placement circle; release to place it, or click either mouse button / press Escape to cancel. The turret attacks nearby hostiles for five seconds, collapses, and has a 10-second cooldown. E (or 2) marks the cursor's ground position and calls artillery after a 1.2-second warning; its blast leaves a scorch decal for 10 seconds and has a 20-second cooldown. Shooting an explosive barrel starts two dark-red whole-barrel blinks with a red halo during a two-second fuse, then removes the barrel and reuses the artillery blast and damage. R (or 3) activates adrenaline, increasing movement speed by 150% for five seconds; hold Shift to sprint, and the modifiers multiply together. The grenade count comes from the shared backpack; G throws one toward the cursor, with a one-second cooldown and a 38 m throw limit. Grenades occupy backpack cells but do not use the separate resource cargo capacity.

## Project commands

```sh
npm run dev          # Start the local development server
npm run build        # Type-check and make a production build in dist/
npm test             # Run automated gameplay and map checks once
npm run test:watch   # Run tests in watch mode
npm run format       # Format project files
npm run format:check # Check formatting without changing files
```

The package manifest and `package-lock.json` pin exact versions of Three.js, Vite, TypeScript, Vitest, the Three.js types, and Prettier.

## Source layout

- `src/world/generateWorld.ts` builds seeded themed districts, roads, shoreline, loot regions, landmarks, reachable interaction approaches, placements, collision boxes, chopper spawn, and terrain height without depending on rendering.
- `src/world/regionThemes.ts` defines each region's asset pools, per-role weights, placement density and spacing, visual palette, and deterministic variant counts.
- `src/world/buildWorld.ts` turns generated data into Three.js terrain and scene objects.
- `src/camp/` defines the walkable camp, its navigation/services, and quartermaster transaction rules.
- `src/interiors/interiorLayout.ts` creates reproducible room layouts, loot, encounter positions, and collision data; `src/interiors/buildInterior.ts` assembles the reusable room pieces.
- `src/assets/` contains authored asset modules and shared versioned metadata; `docs/asset-reviews/` keeps owner-approved model review sheets; `helicopter.ts` builds the shared detailed camp/deployment helicopter.
- `asset-editor.html` and `src/assetEditor/` provide the separate Asset Bench for reviewing and adjusting the same authored definitions.
- `unapproved-assets/` is an isolated staging area for candidate models and includes a lightweight Three.js viewer. Its `AGENTS.md` contains the asset authoring guide, and `examples/` has copies of the current building and water tower modules. Nothing in this folder is loaded by the game.
- `src/player/PlayerController.ts` owns direct perspective movement, top-down route following, and dash movement; `src/player/playerVisual.ts` builds the articulated gameplay scout and camera-mounted first-person firearm.
- `src/navigation/GridNavigator.ts` routes the player around static colliders and refreshed hostile positions; combat pursuers use a separate static navigation map.
- `src/game/CombatSimulation.ts` owns health, firing and ability cooldowns, damage, and zombie pursuit/attacks.
- `src/game/CombatFeedback.ts`, `PickupFeed.ts`, and `ExplosiveBarrel.ts` own pooled blood trails, pickup-feed/prompt timing, and deterministic barrel fuses.
- `src/game/HordeSimulation.ts` owns the seeded 10,000-agent simulation, dormant/active rosters, noise awareness, spatial queries, obstacle deflection, and near/mid/far update tiers; `src/game/HordeBenchmark.ts` measures fixed simulation steps without rendering.
- `src/game/loot.ts` places reproducible caches across generated regions and creates deterministic cache contents.
- `src/game/saveData.ts` validates versioned camp saves, cargo capacity, and banking rules.
- `src/input/controlMap.ts` defines the view-specific keyboard actions.
- `src/camera/CameraRig.ts` owns both camera views and their transition.
- `src/atmosphere/` manages seeded lighting/weather, accessibility preferences, rain and particle rendering, and synthesized audio feedback.
- `src/main.ts` assembles the scene, UI, renderer, and diagnostics.

## Asset Bench

From the camp panel, open **Asset Bench**. Select any of the 44 catalog assets, orbit or zoom the preview, and compare the near and far camera presets. Edit placement bounds, collision, interaction points, or named material color/roughness/metalness. The inspector limits values and blocks saving when metadata is invalid. The Bench previews source-defined geometry; its JSON format only edits metadata and materials for an asset already in the catalog. It does not create or import a new mesh.

**Save JSON** exports a versioned `last-light-authored-asset` document. **Open JSON** validates and reopens that file. **Try in Game** stores the validated document for this browser and opens Last Light; start a run to use the edited bounds, collision, materials, or building interaction point. **Restore Source** clears the saved game override and resets the selected asset in the editor.

## Adding an authored asset

Create a small module in `src/assets/` that exports an `AuthoredAsset` with a stable ID, schema version, dimensions, optional collider, interaction points, named materials, and a visual factory. The catalog supplies merged low and very-low models automatically unless the asset defines `createLowDetailVisual(variant)` or `createVeryLowDetailVisual(variant)`. Register it in `src/assets/catalog.ts`, then place its ID from `src/world/generateWorld.ts`; keep generated position/rotation/scale/variant values in `AssetPlacement`, not in the asset definition. Add deterministic coverage if the placement changes generation behavior.

## Generated world regions

Each seeded Greywood run contains six connected region themes. The full region layout rotates through four orientations by seed; roads, water, terrain color, cache zones, landmarks, and authored placement rotate together. The existing city–forest route remains the core map, with farm, field-base, coastal, and survival-camp areas along the outer routes. The Military Base destination shown as unavailable at camp is still a later full destination; the field-base sector here is part of Greywood.

| Region        | Generated set pieces and dressing                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Urban         | City shells, row house, burned corner store, utility plant, street props, vehicle wrecks, and explosive barrels |
| Forest        | Pine trees, boulders, burned trees, fire lookout, ranger cabin, and timber props                                |
| Farm          | Barn, grain silo, wind pump, tractor, and oil pumpjack                                                          |
| Military      | Hangar, helipad, communications truck, floodlights, radar, checkpoint, and barricade                            |
| Coastal       | Lighthouse, dry dock crane, containers, and a blocked water edge                                                |
| Survival camp | Tent, fire bin, generator, and abandoned substation                                                             |

Every placement carries its region ID and theme. The centralized pools in [`regionThemes.ts`](src/world/regionThemes.ts) restrict which assets can appear in each theme and set the region's dressing weights, density, spacing, palette, and variant range. The generator checks full asset bounds and collision boxes, keeps authored interaction approaches walkable, and rejects the map if a required set piece cannot be placed. The schematic and seed checklist are in [`docs/world-themes.md`](docs/world-themes.md) and [`docs/world-themes.svg`](docs/world-themes.svg).

### Candidate assets and approved models

New model work belongs in [`unapproved-assets/`](unapproved-assets/). Read its [`AGENTS.md`](unapproved-assets/AGENTS.md) before authoring; it documents the project's geometry conventions, scale, palette, review files, and staging boundary. The `examples/` subfolder contains copies of `buildingShell.ts` and `waterTower.ts` from `src/assets/` as style and structure references.

The game builds authored models from Three.js geometry and materials in TypeScript modules. Review-pending candidates and their notes stay in `unapproved-assets/`; the runtime does not read that folder. On 2026-09-29, the owner approved 16 models in the first batch and 22 more in a second batch. The approved sources are in `src/assets/`, registered in the catalog, and their review sheets are in `docs/asset-reviews/`. Phase 13 places the approved set into seeded urban, forest, farm, military, coastal, and survival-camp regions; the themes rotate with the layout and use separate eligible asset pools. The abandoned substation is a distinct placement ID that reuses the electrical yard's stripped visual variant.

To preview the reference models and top-level `candidate-*.ts` drafts, start `npm run dev` and open `/unapproved-assets/viewer.html`. Drag to orbit, scroll to zoom, and use the X/Y/Z sliders to move the directional key light. The exact gameplay scout model is shown beside each asset by default; toggle it or adjust its safe distance from the asset center. The page uses the game's base camp renderer settings and daylight; it omits gameplay weather and effects. Refresh after adding a candidate module.

## Phase 7 performance result

Phases 1–13 are accepted. The owner closed Phase 7 on 2026-10-01 after adding three distance-based LOD tiers to every approved world-catalog asset and reviewing performance in a 20-minute session.

On the reported desktop (Ubuntu Linux, Intel Core i5-3570K @ 3.40 GHz, Nvidia GTX 1650 4 GB, 16 GB RAM, Firefox latest), FPS was mostly above 50. In the heaviest combination—10,000-agent horde plus the busiest asset area—it was typically 40+ FPS, with two brief dips to 35. Before LOD, the owner's short-window estimates were third person ~40/~18/~18–35 and top-down ~38/~30/~24 FPS for empty/wide/10k views.

The accepted Phase 7 LOD pass used 58 m and 200 m with 12% hysteresis. Phase 16 moves the ultra-far transition to 120 m and keeps the 58 m middle boundary and both hysteresis values. Pine trees and burned-tree clusters retain hand-authored low models; other approved assets generate low and very-low models from their detailed variants. Very-low models simplify round primitives, filter small details, merge compatible indexed geometry by material, and do not cast shadows. Fog and draw distance were unchanged.

Phone testing remains deferred. The owner has not reported a phone performance result.

Save data uses schema version 1 under the `last-light-save` browser storage key; invalid or unreadable data loads safe default camp supplies.
