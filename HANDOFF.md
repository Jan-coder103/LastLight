# Coding handoff

Updated: 2026-09-25

## Current position

Phase 1 implementation is ready for the owner playtest. The phase is **Awaiting owner playtest**; phase 2 has not started. This project is on branch `main`. The verified implementation and handoff commit references will be filled in after the commits are created.

## Read first

1. `plan.md` for the vision, technical direction, phase scope, and acceptance criteria.
2. `tracker.md` for the phase checklist, verification evidence, and owner feedback.
3. `README.md` for startup commands, controls, asset authoring, and the playtest checklist.

The earlier handoff referenced `My_Plan.txt`, but that file is not present in this workspace. The existing roadmap and planning notes were kept intact.

## Phase 1 decisions

- Toolchain: Three.js 0.186.1, Vite 8.3.1, TypeScript 7.0.2, Vitest 5.0.2, `@types/three` 0.186.0, and Prettier 3.9.9, locked in `package-lock.json`.
- Runtime used here: Node 22.19.0 and npm 11.6.0. Vite's documented Node minimum is 20.19+ or 22.12+.
- Browser target: desktop Chrome/Edge or Firefox with WebGL2. Pointer Lock is optional; drag-to-look is the fallback.
- Phase 1 movement uses WASD or arrow keys in both views. Third-person movement follows the orbit camera; top-down movement follows the map axes.
- The initial named seed is `RAVEN-07`. Regeneration normalizes an empty seed to this value and trims names to 32 characters.
- The dev overlay is a first baseline only. Final hardware and frame-time targets remain open for later measurement.

## What changed

- Added a Vite/TypeScript browser app, locked dependencies, test/build/format commands, and `.gitignore`.
- Added seeded terrain, an explicit city/forest road layout, generated buildings/trees/boulders, a water-tower landmark, map bounds, and collision data separate from scene meshes.
- Added a low-poly player scout, shared movement/collision controller, third-person orbit/follow and angled top-down cameras, and smooth camera transitions.
- Added seed reload, view/control UI, optional Pointer Lock, drag-to-look, and a development telemetry overlay.
- Added versioned asset metadata and a short guide for adding authored assets.

## Verification

- `npm run build` — passed TypeScript checking and Vite production build. Vite reports the minified Three.js bundle is 554.45 kB, above its default 500 kB advisory threshold; the gzip bundle is 140.38 kB.
- `npm test` — passed: 1 test file, 3 tests covering repeatability, seed variation/map bounds, and a clear spawn.
- `npm run format:check` — passed.
- Browser smoke check in the Codex in-app browser — the scene, UI, and 60 FPS / 16.7 ms diagnostics rendered; same-seed regeneration kept the displayed layout/object count, alternate seed `MILL-ALPHA` changed the map and count; both view button and Tab switched camera modes; dragging the scene orbited the third-person camera; the 640×700 preview kept the HUD within the viewport.
- Pointer Lock was rejected by the in-app browser. The scene drag fallback worked. The browser did not expose host GPU/model information, so this is not a hardware-qualified performance result.

## Known issues and next action

- The owner still needs to playtest movement and obstacle collision, camera comfort and transitions while walking, and map readability. Record requested fixes here and in `tracker.md`; complete them before accepting phase 1.
- Pointer Lock should be tried in the owner's target browser if they want continuous mouse look; drag-to-look remains available.
- The large-chunk warning is expected from the current Three.js bundle and is not a phase 1 performance gate.
- Do not start phase 2 until the owner explicitly accepts phase 1 and initiates the next phase.

## Handoff format for future coding sessions

Keep factual evidence and the next exact task here. For later phases, include changed files/systems, decisions, commands and results, manual/browser checks, performance conditions, known issues, owner feedback, and commits.
