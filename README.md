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

| Input                          | Third person                        | Top-down                            |
| ------------------------------ | ----------------------------------- | ----------------------------------- |
| W / A / S / D or arrow keys    | Move relative to the camera         | —                                   |
| Right-click                    | —                                   | Move around static obstacles        |
| Left-click                     | Fire at the cursor                  | Attack with cursor assist           |
| Drag on the scene              | Orbit camera and aim                | —                                   |
| Optional **Capture Mouse**     | Continuous look; Escape releases it | Not available                       |
| Q                              | Dash; 2.5-second cooldown, no cost  | Dash; 2.5-second cooldown, no cost  |
| 1 / 2 / 3                      | Heal / shock pulse / adrenaline     | —                                   |
| W / E / R                      | —                                   | Heal / shock pulse / adrenaline     |
| X                              | Use one carried supply to heal      | Use one carried supply to heal      |
| F                              | Search, collect, or board nearby    | Search, collect, or board nearby    |
| Tab or **Change View**         | Switch camera without moving player | Switch camera without moving player |
| World Seed field + reload icon | Rebuild the map and encounter       | Rebuild the map and encounter       |

Start a run from the camp panel. The chopper arrives in third person; pressing **Disembark** switches to the angled top-down camera. Search a cache with F when close or left-click its crate; collect the revealed pickups with F or by clicking them. Top-down clicks on distant loot set a route. Recover at least one cache item before the chopper clears extraction. Gear, supplies, and fuel use carrying capacity; credits do not. X consumes a carried medical supply to restore up to 35 health. F boards when you are in the landing ring and no hostile is close; hold position for four seconds while the chopper is vulnerable to interruption.

The extraction arrow and distance remain on screen during the run. A radio warning arrives before each small reinforcement wave, leaving time to head back. You can extract at any time. The camp quartermaster sells gear and medical supplies, and can install a one-time cargo harness upgrade. One gear kit and one medical supply are taken from camp at deployment if available. Banked items and shop purchases are saved in browser storage; carried items are lost on death.

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
- `src/assets/` contains authored asset modules and shared versioned metadata.
- `src/player/PlayerController.ts` owns direct third-person movement, top-down route following, dash movement, and the player visual.
- `src/navigation/GridNavigator.ts` routes the player and the small phase 2 enemy group around static colliders.
- `src/game/CombatSimulation.ts` owns health, firing and ability cooldowns, damage, and zombie pursuit/attacks.
- `src/game/loot.ts` places reproducible caches across generated regions and creates deterministic cache contents.
- `src/game/saveData.ts` validates versioned camp saves, cargo capacity, and banking rules.
- `src/input/controlMap.ts` defines the view-specific keyboard actions.
- `src/camera/CameraRig.ts` owns both camera views and their transition.
- `src/main.ts` assembles the scene, UI, renderer, and diagnostics.

## Adding an authored asset

Create a small module in `src/assets/` that exports an `AuthoredAsset` with a stable ID, schema version, dimensions, optional collider, interaction points, and a visual factory. The definition data stays explicit and separate from generated placements so a future editor can consume the same metadata. Register the module in `src/assets/catalog.ts`, then place its ID from `src/world/generateWorld.ts`; keep generated position/rotation/scale/variant values in `AssetPlacement`, not in the asset definition. Add a deterministic test if the placement changes generation behavior.

## Phase 3 playtest checklist

1. Run `npm run dev`; confirm the camp panel shows stored gear, supplies, credits, fuel, and the deployment button.
2. Start a run. Confirm the chopper descends, the disembark button enables, and leaving the chopper transitions smoothly from third person to top-down.
3. Follow the extraction arrow, search a cache, collect pickups, and check that the cargo counter changes. Fill capacity and confirm further weighted pickups remain available; credits should not use capacity. Use X while injured and verify a carried supply is consumed.
4. Return to the chopper and press F. Confirm boarding requires the landing ring and nearby hostiles interrupt it. Complete the four-second boarding and takeoff; check that cargo is banked at camp.
5. Start another run and let a hostile kill the scout. Confirm carried loot is lost, prior camp resources remain, and returning to camp enables another deployment.
6. Buy supplies and the harness; reload the page and confirm base inventory and upgrade persist. Verify a new seed changes cache layout reproducibly, then check resize, focus loss, and mouse capture/release.

## Phase 4 playtest checklist

1. Start the game with several named seeds, including the regression seeds in `src/world/generateWorld.test.ts`. Reload each seed and confirm its layout repeats.
2. Compare the routes between seeds: city blocks, local streets, forest trails, tree cover, loot regions, and the water tower/relay mast should shift while remaining readable.
3. Confirm the chopper can land and disembark into a clear area. Visit the landmark approaches and at least one cache from each visible region; the extraction guide should remain usable from the longest route.
4. Report any blocked cache, landmark, landing zone, visually crowded street, or seed that repeats another map's route shape.

The encounter is intentionally capped at seven hostiles and is not a horde performance claim. Frame rate and frame time remain live diagnostics. Save data uses schema version 1 under the `last-light-save` browser storage key; invalid or unreadable data loads safe default camp supplies.
