# Coding handoff

Updated: 2026-09-25

## Current position

Phases 1–3 are **Accepted**. On 2026-09-25, the owner reported “All green lights from my site” after playtesting Phase 3 and authorized the next phase. Phase 4 is implemented and **Awaiting owner playtest**. The Phase 4 build is committed as `4ff3475` on `main`.

## Read first

1. `plan.md` for the vision, technical direction, phase scope, and acceptance criteria.
2. `tracker.md` for phase status, verification evidence, decisions, and the owner playtest log.
3. `README.md` for startup commands, controls, and the Phase 4 playtest checklist.

## Phase 2 decisions and tuning

- Third-person abilities use `1/2/3`. Top-down abilities use `W/E/R`; the active map is shown in the field controls and HUD. `Tab` switches views.
- `Q` dashes for 0.22 seconds at 20 m/s (about 4.4 m) with a 2.5-second cooldown and no resource cost. Switching views preserves the dash direction; switching clears held movement keys.
- In top-down view, Q takes its direction from the current cursor position and briefly displays a ring-and-arrow cue. When the dash ends, the click-to-move route is recalculated from the landing point to its saved destination to avoid backtracking.
- A top-down shot turns the player toward its aim point and briefly preserves that facing while moving. Hovering a live hostile changes the cursor/reticle to a square target mark.
- Top-down left-click assist selects a visible living hostile within an invisible 44 CSS-pixel radius of the pointer. It keeps firing on the rifle cooldown until the player issues a move or dash, clicks empty space, switches views, or the hostile dies. Clicking another hostile changes the target. Selecting a hostile clears the previous move route.
- Third-person pitch now permits aiming above the horizon. Camera position orbits a fixed 9.3 m sphere centered 1.75 m above the terrain at the player, with a small right-side bias; the low edge is clamped above the ground while the upward view angle remains available.
- The camera aims along its yaw and pitch, and the player faces that horizontal look direction. Third-person follow updates directly after view transitions, so mouse orbit does not trail.
- Field dressing restores 35 health and has a 12-second cooldown. Shock pulse deals 40 damage and stuns hostiles within 9 m for 1.8 seconds; cooldown is 9 seconds. Adrenaline raises movement speed by 50% for 5 seconds; cooldown is 14 seconds.
- The rifle deals 50 damage with a 0.24-second firing cooldown. Hostiles have 100 health. The three-hostile encounter is intentionally small and uses A* repaths around static colliders every 0.7 seconds.
- Player health is 100. Each hostile attack deals 8 damage every 1.3 seconds while in melee range. Phase 3 replaces the Phase 2 restart overlay with a run-loss result and return-to-camp action.
- Top-down player movement uses a 2 m A* grid with static collider clearance. Third-person movement remains direct, camera-relative, and collision-aware. Dynamic obstacles and doorway routes remain later scope.
- Aim uses the cursor (or screen center under Pointer Lock); the nearest static geometry blocks a shot before a hostile. Firing uses a short tracer and muzzle flash.

## What changed

- Added the view-specific input map and a visible control panel that changes with camera mode.
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
- Pointer Lock was denied in the embedded browser during Phase 1. Phase 2 retains drag-to-look and click aiming; use a desktop target browser if testing Pointer Lock itself.
- Build/runtime used Three.js 0.186.1, Vite 8.3.1, TypeScript 7.0.2, Vitest 5.0.2, Node 22.19.0, and npm 11.6.0.

## Phase 4 decisions

- The chopper spawn remains at the central crossing so the Phase 3 run state and extraction point stay in one place. Generated placements must leave an 18 m collider-free radius; the disembark point 14 m east must remain walkable.
- Five named districts use independent seed streams for position jitter and asset placement. Roads and forest trails vary per seed but remain axis-aligned in the current renderer.
- Seven cache sites are distributed across five named loot zones. The generator rejects a site if it is blocked, too near another cache or the landing zone, unreachable, or more than 145 m of grid route from the chopper.
- Each generated map includes a water tower and radio mast landmark, each with an exposed approach point for navigation checks.
- World-data generation has a 50 ms p95 budget, excluding scene rendering. The current 24-seed sample measured p95 1.93 ms and maximum 2.16 ms on the development host.

## Known limits and next action

- Owner plays several Phase 4 seeds for route variety, cache access, landmark readability, and landing/disembark safety. Record acceptance or revisions in `tracker.md` before Phase 5.
- Initial pressure and economy values were accepted for the first playable loop. The interaction and navigation layer still targets static colliders; dynamic obstruction, route recovery, and stuck handling remain Phase 5 work.
- The reinforcement scene is intentionally small; 10,000-agent scale remains Phase 6.

## Handoff format for future coding sessions

Keep factual evidence and the next exact task here. For later phases, include changed systems, decisions, commands and results, manual/browser checks, performance conditions, known issues, owner feedback, and commits.
