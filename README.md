# Last Light — phase 1 prototype

A desktop browser prototype for the first exploration scene in the survival game plan. This phase establishes the seeded city–forest map, a controllable scout, two camera rigs, reusable authored assets, and development telemetry. Combat and extraction are later phases.

## Run locally

Requirements: Node.js 22.12+ (or 20.19+) and npm 10+.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. The target is a desktop Chromium browser (Chrome or Edge) or Firefox with WebGL2 and Pointer Lock support. Keyboard movement works without pointer capture; pointer capture is optional and can be released with Escape.

## Controls

| Input                             | Action                                                         |
| --------------------------------- | -------------------------------------------------------------- |
| W / A / S / D or arrow keys       | Walk                                                           |
| Tab or **Change View**            | Smoothly switch between third-person and angled top-down views |
| Drag on an open part of the scene | Orbit the third-person camera                                  |
| Capture Mouse button              | Capture mouse for continuous third-person look when permitted  |
| Mouse movement while captured     | Orbit the third-person camera                                  |
| Escape                            | Release mouse capture                                          |
| World Seed field + reload icon    | Rebuild the map from the entered seed                          |

The same player position and movement controller are used in both camera modes. Top-down movement is relative to the map; third-person movement is relative to the orbit camera. Phase 1 uses keyboard movement in both modes while the phase 2 input map is pending.

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
- `src/player/PlayerController.ts` owns the player transform and collision-aware movement.
- `src/camera/CameraRig.ts` owns both camera views and their transition.
- `src/main.ts` assembles the scene, UI, renderer, and diagnostics.

## Adding an authored asset

Create a small module in `src/assets/` that exports an `AuthoredAsset` with a stable ID, schema version, dimensions, optional collider, interaction points, and a visual factory. The definition data stays explicit and separate from generated placements so a future editor can consume the same metadata. Register the module in `src/assets/catalog.ts`, then place its ID from `src/world/generateWorld.ts`; keep generated position/rotation/scale/variant values in `AssetPlacement`, not in the asset definition. Add a deterministic test if the placement changes generation behavior.

## Phase 1 smoke checklist

1. Run `npm run dev` and confirm the scene, player, map labels, and diagnostics appear.
2. Walk north, south, east, and west in both views; confirm the scout stays inside the map and slides along building/tree/rock collisions.
3. Move while switching with Tab several times; the scout should not jump when the camera changes.
4. In third-person, drag on the open scene to orbit. If allowed, use **Capture Mouse**, orbit, press Escape, and switch views. Change browser focus while moving and confirm movement and any active capture releases.
5. Enter the same seed again and confirm the building, road, tree, and water-tower layout repeats. Try another seed and confirm the layout and terrain change.
6. Resize the browser and confirm the scene and overlays remain usable.

The initial scene is a visual and control baseline only. Frame rate and frame time in the overlay are live development diagnostics, not a performance acceptance claim.
