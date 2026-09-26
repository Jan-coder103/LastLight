# Last Light — procedural extraction runs

A desktop browser survival run on the seeded city–forest map. Deploy from camp, search caches, carry what fits, and return to the chopper before the horde grows. A successful extraction banks carried resources; death loses cargo while camp storage stays safe.

## Run locally

Requirements: Node.js 22.12+ (or 20.19+) and npm 10+.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. The target is a desktop Chromium browser (Chrome or Edge) or Firefox with WebGL2. Pointer Lock is optional; third-person drag-to-look works without it.

## Controls

| Input                          | Third person                          | Top-down                              |
| ------------------------------ | ------------------------------------- | ------------------------------------- |
| W / A / S / D or arrow keys    | Move relative to the camera           | —                                     |
| Right-click                    | —                                     | Move around static obstacles          |
| Left-click                     | Fire at the cursor                    | Attack with cursor assist             |
| Drag on the scene              | Orbit camera and aim                  | —                                     |
| Optional **Capture Mouse**     | Continuous look; Escape releases it   | Not available                         |
| Q                              | Dash; 2.5-second cooldown, no cost    | Dash; 2.5-second cooldown, no cost    |
| 1 / 2 / 3                      | Heal / shock pulse / adrenaline       | —                                     |
| W / E / R                      | —                                     | Heal / shock pulse / adrenaline       |
| X                              | Use one carried supply to heal        | Use one carried supply to heal        |
| F                              | Interact, enter/exit, or board nearby | Interact, enter/exit, or board nearby |
| Tab or **Change View**         | Switch camera without moving player   | Switch camera without moving player   |
| World Seed field + reload icon | Rebuild the map and encounter         | Rebuild the map and encounter         |

Start a run from the camp panel. The chopper arrives in third person; pressing **Disembark** switches to the angled top-down camera. Search a cache with F when close or left-click its crate; collect the revealed pickups with F or by clicking them. Top-down clicks on distant loot set a route. Recover at least one cache item before the chopper clears extraction. Gear, supplies, and fuel use carrying capacity; credits do not. X consumes a carried medical supply to restore up to 35 health. F boards when you are in the landing ring and no hostile is close; hold position for four seconds while the chopper is vulnerable to interruption.

The extraction arrow and distance remain on screen during the run. A radio warning arrives before each small reinforcement wave, leaving time to head back. You can extract at any time. The camp quartermaster sells gear and medical supplies, and can install a one-time cargo harness upgrade. One gear kit and one medical supply are taken from camp at deployment if available. Banked items and shop purchases are saved in browser storage; carried items are lost on death.

Building doors become usable during an active run. Press **F** or click a door, then use **F** or the lit exit marker to return to the same outdoor position. The generated 2–4 room layout, loot, and infected encounter repeat for that building and world seed. Collected interior loot and defeated infected remain cleared for the rest of that run. The outdoor horde and run timer pause while inside; player health and ability cooldowns continue normally.

The Phase 2 camera and combat rules still apply. In top-down view, clicking near a visible hostile keeps firing until you move, dash, click empty space, switch views, or the hostile dies. Q dashes toward the cursor and briefly shows its direction; the player replans the remaining click-to-move route after landing. A dash already in progress keeps its world direction through a camera change. The shock pulse damages and briefly stuns nearby hostiles; adrenaline increases movement speed for five seconds; field dressing restores health when injured.

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

- `src/world/generateWorld.ts` builds seeded districts, roads, loot regions, landmarks, placements, collision boxes, chopper spawn, and terrain height without depending on rendering.
- `src/world/buildWorld.ts` turns generated data into Three.js terrain and scene objects.
- `src/interiors/interiorLayout.ts` creates reproducible room layouts, loot, encounter positions, and collision data; `src/interiors/buildInterior.ts` assembles the reusable room pieces.
- `src/assets/` contains authored asset modules and shared versioned metadata.
- `asset-editor.html` and `src/assetEditor/` provide the separate Asset Bench for reviewing and adjusting the same authored definitions.
- `src/player/PlayerController.ts` owns direct third-person movement, top-down route following, dash movement, and the player visual.
- `src/navigation/GridNavigator.ts` routes the player around static colliders and refreshed hostile positions; combat pursuers use a separate static navigation map.
- `src/game/CombatSimulation.ts` owns health, firing and ability cooldowns, damage, and zombie pursuit/attacks.
- `src/game/HordeSimulation.ts` owns the seeded 10,000-agent stress simulation, spatial queries, obstacle deflection, and near/mid/far update tiers; `src/game/HordeBenchmark.ts` measures fixed simulation steps without rendering.
- `src/game/loot.ts` places reproducible caches across generated regions and creates deterministic cache contents.
- `src/game/saveData.ts` validates versioned camp saves, cargo capacity, and banking rules.
- `src/input/controlMap.ts` defines the view-specific keyboard actions.
- `src/camera/CameraRig.ts` owns both camera views and their transition.
- `src/main.ts` assembles the scene, UI, renderer, and diagnostics.

## Asset Bench

From the camp panel, open **Asset Bench**. Select one of the five shared assets, orbit or zoom the preview, and compare the near and far camera presets. Edit placement bounds, collision, interaction points, or material color/roughness/metalness. The inspector limits values and blocks saving when metadata is invalid.

**Save JSON** exports a versioned `last-light-authored-asset` document. **Open JSON** validates and reopens that file. **Try in Game** stores the validated document for this browser and opens Last Light; start a run to use the edited bounds, collision, materials, or building interaction point. **Restore Source** clears the saved game override and resets the selected asset in the editor.

## Adding an authored asset

Create a small module in `src/assets/` that exports an `AuthoredAsset` with a stable ID, schema version, dimensions, optional collider, interaction points, named materials, and a visual factory. Register it in `src/assets/catalog.ts`, then place its ID from `src/world/generateWorld.ts`; keep generated position/rotation/scale/variant values in `AssetPlacement`, not in the asset definition. Add deterministic coverage if the placement changes generation behavior.

## Phase 3 playtest checklist

1. Run `npm run dev`; confirm the camp panel shows stored gear, supplies, credits, fuel, and the deployment button.
2. Start a run. Confirm the chopper descends, the disembark button enables, and leaving the chopper transitions smoothly from third person to top-down.
3. Follow the extraction arrow, search a cache, collect pickups, and check that the cargo counter changes. Fill capacity and confirm further weighted pickups remain available; credits should not use capacity. Use X while injured and verify a carried supply is consumed.
4. Return to the chopper and press F. Confirm boarding requires the landing ring and nearby hostiles interrupt it. Complete the four-second boarding and takeoff; check that cargo is banked at camp.
5. Start another run and let a hostile kill the scout. Confirm carried loot is lost, prior camp resources remain, and returning to camp enables another deployment.
6. Buy supplies and the harness; reload the page and confirm base inventory and upgrade persist. Verify a new seed changes cache layout reproducibly, then check resize, focus loss, and mouse capture/release.

## Phase 4 playtest checklist

1. Start the game with `PHASE4-00` through `PHASE4-03`; these four regression seeds cover every city/forest orientation. Reload each seed and confirm its layout repeats.
2. Compare the map directions: city blocks and forest must both remain present, their sides should rotate by seed, and terrain color should follow the generated districts. Local streets, trails, tree cover, loot regions, and landmarks should remain readable.
3. Confirm the chopper can land and disembark into a clear area. Visit the landmark approaches and at least one cache from each visible region; the extraction guide should remain usable from the longest route.
4. Report any blocked cache, landmark, landing zone, visually crowded street, or seed that repeats another map's route shape.

## Phase 5 playtest checklist

1. Start a run, disembark, and switch to top-down view. Right-click open ground and confirm the route follows walkable ground; a new right-click should replace it.
2. Press Escape during an active route and confirm the route clears. Switch to third person and back, then confirm an unfinished route resumes from the player's current position.
3. Click a cache or pickup from beyond interaction range. The scout should approach a clear position and search or collect without requiring a second click. Use F nearby and confirm the same approach behavior.
4. Try destinations in a dense city block and around narrow passages. The scout should not cut through buildings or repeatedly oscillate; an unreachable destination should report that clearly.
5. Let hostiles begin moving while following a route. Check that distant moving hostiles cause a detour when needed, the route recovers after a dash, and combat pursuers keep moving normally.
6. Read the path timing and route status in the development telemetry. Report any route that stalls, ends outside interaction range, or takes an unexpectedly long time to calculate.

## Phase 6 playtest checklist

1. From camp, open **Horde Simulation Lab**. Try 100 agents first, then start 10,000 with a memorable seed and each spawn pattern. Confirm the same seed and pattern restore the same initial layout.
2. Try both camera modes. In third person, walk with WASD and look around; in top-down mode, right-click to route around buildings. Confirm the agents close in without passing through static obstacles.
3. Watch the near/mid/far counts shift as agents approach. Check nearest-target distance, simulation step time, and player health/attack count; nearby agents should reach and attack the player. Click a visible agent to damage it and confirm its health/identity persists until defeated.
4. End the scene and repeat the same seed and pattern. Run the 100/1,000/5,000/10,000 benchmark twice and note mean and p95 simulation-step cost for each count.
5. Report whether the crowd reads as growing pressure, whether tier changes look continuous, and any visible bunching, blocked groups, or unexpected state changes.

## Phase 8 playtest checklist

1. Start a run and approach a city building. Confirm its front door shows the enter prompt; try both **F** and clicking the door from outside interaction range in top-down view.
2. Enter and verify the interior has 2–4 rooms, clear door openings, visible furniture, loot, and an infected encounter. Move with WASD in third person and route with right-click in top-down view.
3. Switch camera views indoors and confirm the selected view, player heading, collision, and controls remain predictable. Try a route through each room and around furniture.
4. Collect an item and clear the infected, then exit. Confirm the scout returns to the same outdoor position and the horde/run clock resume. Re-enter the same building and check that collected loot and defeated infected stay cleared.
5. Change the world seed from camp and revisit a building. Confirm its interior repeats from that seed and that the run remains playable after leaving it.

## Phase 9 playtest checklist

1. Open **Asset Bench** from camp. Select the building shell and a prop; orbit each preview, zoom with the wheel, and compare **Near** and **Far** camera views.
2. Choose a new material color in the OS color picker and press **Select**. Confirm the color swatch and 3D preview update. Then edit collision size and a building interaction point.
3. Set a dimension outside the allowed range and confirm the validation message appears and JSON save/game actions are disabled. Restore a valid value.
4. Save the asset JSON, reopen that file, and confirm the edited values return. Use **Try in Game**, start a run, and check the selected asset in the generated field.
5. Use **Restore Source**, reload the game, and confirm the test override is cleared.

The regular encounter is intentionally capped at seven hostiles. For Phase 6, open **Horde Simulation Lab** from camp or the dev telemetry button. Choose 100, 1,000, 5,000, or 10,000 agents; set a spawn seed, layout, and camera; then start the isolated stress scene. WASD movement and top-down click-to-move let the horde pursue the player. The lab shows near/mid/far tier counts, the nearest-agent query, player attacks received, and simulation time. End the scene to return to camp.

The lab benchmark measures fixed 1/60-second simulation steps after eight warm-up steps, using 36 samples per count. Spawn creation, rendering, world construction, and UI are excluded. Two local runs in the Codex in-app browser at a 640×697 preview viewport, using seed `PHASE6-SMOKE` and the Eight clusters pattern, measured:

| Agents | Run 1 mean / p95 (ms) | Run 2 mean / p95 (ms) |
| -----: | --------------------: | --------------------: |
|    100 |         0.011 / 0.100 |         0.008 / 0.100 |
|  1,000 |         0.108 / 0.700 |         0.078 / 0.500 |
|  5,000 |         0.792 / 4.800 |         0.586 / 4.300 |
| 10,000 |        1.547 / 11.300 |        1.517 / 11.900 |

These are simulation-only preview measurements; browser scheduling changes individual samples. The owner later reported a successful 10,000-enemy playtest at stable 60 FPS and 17 ms or less per frame. That owner-observed result is not a hardware profile; browser and hardware were unspecified.

## Phase 7 performance profile

The development telemetry reports the rolling FPS, p95 request-animation-frame interval, p95 JavaScript frame work, fixed simulation work per frame, current camera and canvas size, draw calls and triangles, active effects, navigation timing, and scene seed. GPU p95 uses `EXT_disjoint_timer_query_webgl2` when the browser exposes it; otherwise it reads `N/A`. Heap size uses Chromium's optional JavaScript heap API. Geometry and texture values are renderer object counts, not GPU memory in bytes. `INSTANCE SYNC` in the Horde Lab measures CPU time and changed-agent count for preparing the instanced transforms.

For a profile, record the browser/OS and hardware, canvas dimensions and pixel ratio, seed/pattern, agent count, camera, and whether a regular run or the stress scene is active. Check a regular field run and the 10,000-agent scene in both camera modes, repeat each measurement, and end/restart the stress scene several times to check that heap and renderer object counts settle. The rendering counters are camera-specific, so read them after each view is selected. Compare the p95 interval with the frame-rate target; JavaScript and GPU timings describe work inside their respective clocks and do not include browser compositing.

The first steady-state local preview baseline was recorded in the Codex in-app browser while at camp, third-person, with a 1280×720 canvas at 1.00× pixel ratio: 60 FPS, 16.7 ms p95 frame interval, 4.40 ms p95 JavaScript work, 0.00 ms mean fixed-update work per frame (rounded to two decimals), 4.66 ms p95 GPU time, 468 draw calls, 17,490 triangles, 23 MB JavaScript heap, 111 geometries, and 3 textures. This is an idle camp baseline, not a normal active run or stress-scene profile. The browser host and GPU are not exposed, so final targets remain open until measurements are repeated on the agreed reference machine.

Phase 7 updates the horde instance buffers only when an agent's transform, health scale, life state, or tier color changes. Sparse changes use merged instance-buffer update ranges; dense changes fall back to a full buffer update. This avoids rebuilding and uploading all 10,000 transforms on every display frame. Use the live `INSTANCE SYNC` and frame/GPU telemetry to check the effect on the owner machine.

Save data uses schema version 1 under the `last-light-save` browser storage key; invalid or unreadable data loads safe default camp supplies.
