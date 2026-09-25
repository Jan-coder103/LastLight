# Coding handoff

Updated: 2026-09-25

## Current position

Phase 1 is **Accepted**. Phase 2 implementation is committed as `66a254c`; playtest revisions are committed as `fad74b5` and `658fb32` (`Add assisted top-down auto-attack`) on branch `main`. Phase 2 is **Awaiting owner playtest** again. Do not begin Phase 3 until the owner accepts Phase 2 and initiates it.

## Read first

1. `plan.md` for the vision, technical direction, phase scope, and acceptance criteria.
2. `tracker.md` for phase status, verification evidence, decisions, and the owner playtest log.
3. `README.md` for startup commands, both control maps, and the Phase 2 playtest checklist.

## Phase 2 decisions and tuning

- Third-person abilities use `1/2/3`. Top-down abilities use `W/E/R`; the active map is shown in the field controls and HUD. `Tab` switches views.
- `Q` dashes for 0.22 seconds at 20 m/s (about 4.4 m) with a 2.5-second cooldown and no resource cost. Switching views preserves the dash direction; switching clears held movement keys.
- In top-down view, Q takes its direction from the current cursor position and briefly displays a ring-and-arrow cue. When the dash ends, the click-to-move route is recalculated from the landing point to its saved destination to avoid backtracking.
- A top-down shot turns the player toward its aim point and briefly preserves that facing while moving. Hovering a live hostile changes the cursor/reticle to a square target mark.
- Top-down left-click assist selects a visible living hostile within an invisible 44 CSS-pixel radius of the pointer. It keeps firing on the rifle cooldown until the player issues a move or dash, clicks empty space, switches views, or the hostile dies. Clicking another hostile changes the target. Selecting a hostile clears the previous move route.
- Third-person pitch now permits aiming above the horizon. The follow camera sits slightly over the player's right shoulder and leads the aim target forward.
- The shoulder offset follows the player's facing direction, independently of camera look yaw, so orbiting the camera does not carry the shoulder framing across the player.
- Field dressing restores 35 health and has a 12-second cooldown. Shock pulse deals 40 damage and stuns hostiles within 9 m for 1.8 seconds; cooldown is 9 seconds. Adrenaline raises movement speed by 50% for 5 seconds; cooldown is 14 seconds.
- The rifle deals 50 damage with a 0.24-second firing cooldown. Hostiles have 100 health. The three-hostile encounter is intentionally small and uses A* repaths around static colliders every 0.7 seconds.
- Player health is 100. Each hostile attack deals 8 damage every 1.3 seconds while in melee range. Death shows a restart overlay. These are first-pass feel values for the owner's playtest.
- Top-down player movement uses a 2 m A* grid with static collider clearance. Third-person movement remains direct, camera-relative, and collision-aware. Dynamic obstacles and doorway routes remain later scope.
- Aim uses the cursor (or screen center under Pointer Lock); the nearest static geometry blocks a shot before a hostile. Firing uses a short tracer and muzzle flash.

## What changed

- Added the view-specific input map and a visible control panel that changes with camera mode.
- Added player dash, top-down click-to-move, direct third-person movement, collision checks, and the visible rifle.
- Added `CombatSimulation` for health, rifle fire rate, abilities, hostile damage, pursuit, stun, death, and restart state.
- Added three low-poly zombies, obstacle-aware pursuit, and combat feedback HUD/effects.
- Added unit tests for damage/death, rifle and ability/dash cooldowns, input maps, and routes around generated obstacles.
- Updated the roadmap decision, README controls, and Phase 2 playtest instructions.
- Addressed the owner's Phase 2 playtest feedback with cursor-directed top-down dash, dash direction cue and route recovery, top-down shot-facing, enemy-hover cursor, forgiving enemy target assist and sustained fire, upward third-person aim, and stable right-shoulder camera framing.

## Verification

- `npm test` — passed: 4 test files, 11 tests.
- `npm run build` — passed TypeScript checking and Vite production build. Minified bundle is 576.81 kB (147.21 kB gzip); Vite reports its existing/default advisory above 500 kB.
- `npm run format:check` — passed.
- Embedded-browser smoke — 59–60 FPS / 16.7 ms in the 1280×720 in-app preview; control panel and status HUD rendered; top-down mode and right-click route displayed; a cursor shot registered “Hostile hit”; zombie damage and the death/restart overlay appeared. The observed FPS is a preview reading, not a reference-hardware performance claim.
- After the playtest revisions, `npm run build` passed; current minified bundle is 581.77 kB (148.61 kB gzip), with the same Vite advisory above 500 kB. Formatting was applied to the changed source files. Automated tests and browser smoke were not rerun for this revision.
- After the follow-up targeting/camera revision, `npm run build` passed; current minified bundle is 583.01 kB (148.94 kB gzip), with the same Vite advisory above 500 kB. Automated tests and browser smoke were not rerun.
- Pointer Lock was denied in the embedded browser during Phase 1. Phase 2 retains drag-to-look and click aiming; use a desktop target browser if testing Pointer Lock itself.
- Build/runtime used Three.js 0.186.1, Vite 8.3.1, TypeScript 7.0.2, Vitest 5.0.2, Node 22.19.0, and npm 11.6.0.

## Known limits and next action

- Phase 2 is waiting for a repeat owner playtest of all requested revisions: top-down Q direction cue and post-dash route, shot-facing, enemy-hover cursor and forgiving attack selection, sustained fire cancellation, upward third-person aim, and stable right-shoulder framing during camera orbit. The complete targeted checklist is in `README.md`; record acceptance or further revisions in `tracker.md`.
- The top-down planner targets static colliders only; route cancellation/replanning, dynamic obstruction, interaction positioning, and stuck recovery remain Phase 5 work.
- Extraction, loot, inventory, and base progression are not included; they remain Phase 3 work.
- After the owner accepts Phase 2, start Phase 3 only when they request it.

## Handoff format for future coding sessions

Keep factual evidence and the next exact task here. For later phases, include changed systems, decisions, commands and results, manual/browser checks, performance conditions, known issues, owner feedback, and commits.
