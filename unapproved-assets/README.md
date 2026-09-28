# Unapproved asset candidates

This is a review staging area. Candidate assets here are not included in Last Light and remain unapproved until the owner reviews them during the later Phase 12 gate in [`../plan.md`](../plan.md).

Read [`AGENTS.md`](AGENTS.md) before creating or revising candidates. It contains the detailed project style, palette, geometry conventions, deliverables, and Git boundary. The [`examples/`](examples/) folder holds reference copies of the current `buildingShell.ts` and `waterTower.ts` modules.

For each candidate, keep a TypeScript draft module and a companion Markdown review sheet together. Optional renders or modeling source files can help with review. Do not add candidates to the live catalog or edit any file outside this folder.

## Preview models

From the project root, run `npm run dev` and open [`viewer.html`](viewer.html) at `/unapproved-assets/viewer.html`. The viewer lists the two examples and top-level `candidate-*.ts` modules that export an asset with `id`, `name`, and `createVisual()`. Drag to orbit, scroll to zoom, and move the directional light with the X/Y/Z sliders. The exact gameplay scout model is shown by default; toggle it or adjust its safe distance from the asset center. Refresh after adding or revising a draft. The viewer uses the game's base camp renderer settings and daylight, with weather and gameplay effects omitted.
