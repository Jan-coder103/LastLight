# Last Light — phase 2 combat field test

A desktop browser survival encounter on the seeded city–forest map. Phase 2 adds view-specific controls, a rifle, dash and three abilities, health and death feedback, and a small group of pursuing zombies. Extraction and inventory are later phases.

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
| Tab or **Change View**         | Switch camera without moving player | Switch camera without moving player |
| World Seed field + reload icon | Rebuild the map and encounter       | Rebuild the map and encounter       |

The same player and combat state continue through camera changes. In top-down view, left-clicking within an invisible 44-pixel radius of a visible hostile selects it and keeps firing until you move, dash, click empty space, switch views, or the hostile dies. Clicking another hostile switches the target. Aiming directly at a hostile also selects it. Q dashes toward the cursor and briefly shows its direction; the player replans the remaining click-to-move route after landing. A dash already in progress keeps its world direction through a camera change. Switching views clears held movement keys. The shock pulse damages and briefly stuns nearby hostiles; adrenaline increases movement speed for five seconds; field dressing restores health when injured. Dead players can restart the encounter from the overlay.

## Project commands

```sh
npm run dev          # Start the local development server
npm run build        # Type-check and make a production build in dist/
npm test             # Run deterministic map tests once
npm run test:watch   # Run tests in watch mode
npm run format       # Format project files
npm run format:check # Check formatting without changing files
```

The package manifest and `package-lock.json` pin exact versions of Three.js, Vite, TypeScript, Vitest, the Three.js types, and Prettier.

## Source layout

- `src/world/generateWorld.ts` builds the seeded map data, roads, placements, collision boxes, spawn, and terrain height field without depending on rendering.
- `src/world/buildWorld.ts` turns generated data into Three.js terrain and scene objects.
- `src/assets/` contains authored asset modules and shared versioned metadata.
- `src/player/PlayerController.ts` owns direct third-person movement, top-down route following, dash movement, and the player visual.
- `src/navigation/GridNavigator.ts` routes the player and the small phase 2 enemy group around static colliders.
- `src/game/CombatSimulation.ts` owns health, firing and ability cooldowns, damage, and zombie pursuit/attacks.
- `src/input/controlMap.ts` defines the view-specific keyboard actions.
- `src/camera/CameraRig.ts` owns both camera views and their transition.
- `src/main.ts` assembles the scene, UI, renderer, and diagnostics.

## Adding an authored asset

Create a small module in `src/assets/` that exports an `AuthoredAsset` with a stable ID, schema version, dimensions, optional collider, interaction points, and a visual factory. The definition data stays explicit and separate from generated placements so a future editor can consume the same metadata. Register the module in `src/assets/catalog.ts`, then place its ID from `src/world/generateWorld.ts`; keep generated position/rotation/scale/variant values in `AssetPlacement`, not in the asset definition. Add a deterministic test if the placement changes generation behavior.

## Phase 2 playtest checklist

1. Run `npm run dev`; confirm the health bar, three hostiles, controls, and scene appear.
2. In third-person, move with WASD, hover a zombie and confirm the cursor becomes a rectangle, aim and fire twice to eliminate it, dash with Q, and try abilities 1/2/3. Drag the camera upward and check that you can aim above the horizon; check that the player is framed slightly right of center.
3. Switch to top-down. Click near (without directly on) a visible zombie and confirm it is selected and repeatedly shot. Right-click to move and confirm firing stops; select another zombie, then click elsewhere and confirm that target is released. Right-click around a building and confirm the scout follows the route; move the cursor away from that route and press Q. The dash should follow the cursor cue, then continue along a replanned route without walking backward. W/E/R activate abilities and do not move the player.
4. Fire in top-down while facing away from a zombie and confirm the scout turns toward the shot. Hover a zombie and confirm the cursor becomes a rectangle. In third-person, orbit the camera and confirm it traces a steady circle, stays over the right shoulder, and the scout faces the same way the camera looks. Fire and dash in both camera modes. Switch views during movement or a dash and confirm the player keeps position and the dash completes.
5. Let zombies reach the scout and confirm health loss and the restart overlay. Restart and defeat the group.
6. Test seed reload, resize, focus loss, and mouse capture/release.

The three-hostile encounter is a small gameplay baseline, not a horde performance claim. Frame rate and frame time remain live diagnostics.
