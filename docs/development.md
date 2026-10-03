# Developer guide

Last Light is built with TypeScript, Three.js, Vite, and Vitest. Use Node.js 22.12+ (or 20.19+) and npm 10+.

## Local development

```sh
npm ci
npm run dev
```

Vite prints the local URL. The game targets desktop browsers with WebGL2.

Useful project commands:

```sh
npm run build        # Type-check and create the production build
npm test             # Run automated checks once
npm run test:watch   # Run checks while editing
npm run format       # Format project files
npm run format:check # Check formatting
```

## Asset Bench

Open **Asset Bench** from the camp panel or visit `/asset-editor.html`. It previews the 44 catalog assets, provides near/far camera views, and edits placement bounds, collision, interaction points, and named material properties. Versioned JSON documents can be exported, reopened, or tried in the game. The editor adjusts existing catalog assets; it does not create or import meshes.

## Adding an authored asset

Create an `AuthoredAsset` module in `src/assets/`, register it in `src/assets/catalog.ts`, then place it through `src/world/generateWorld.ts`. The catalog builds low-detail variants unless an asset provides its own. Keep generated location and orientation in `AssetPlacement`, separate from authored asset definitions.

For candidate asset work, read [`unapproved-assets/AGENTS.md`](../unapproved-assets/AGENTS.md). That folder is staging only; the runtime does not load it. Approved models and review sheets are in `src/assets/` and `docs/asset-reviews/`.

## Source map

- `src/main.ts` assembles the renderer, scene, HUD, and diagnostics.
- `src/world/` generates seeded regions and builds their visuals.
- `src/camp/` contains the walkable hub and camp services.
- `src/game/` contains combat, horde, loot, save, and feedback systems.
- `src/player/`, `src/camera/`, and `src/input/` implement movement, views, and controls.
- `src/assets/` contains authored world models; `src/interiors/` builds enterable spaces.
- `src/atmosphere/` manages lighting, weather, accessibility, and effects.
- `src/assetEditor/` contains the Asset Bench.

## Project records

The [roadmap](../plan.md) describes the project scope and future ideas. The [tracker](../tracker.md) records phase outcomes and verification evidence. The [handoff](../HANDOFF.md) keeps current collaboration notes and implementation history. See the [world theme guide](world-themes.md) and [map schematic](world-themes.svg) for generated region details.
