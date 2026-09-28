# Candidate asset authoring guide

## Purpose and boundary

This directory is a staging area for **unapproved** Last Light asset candidates. Create and revise candidate files only inside `unapproved-assets/`. Do not edit the game, `src/assets/`, the asset catalog, the world or camp builders, the root `README.md`, `plan.md`, or any other project file outside this directory. Do not register a candidate or make the game load it. The owner will review candidates later and decide which, if any, should be revised and integrated.

The game does not load this directory. A completed model or a Git commit does not mean it is approved.

## Learn the current format first

Read `examples/buildingShell.ts` and `examples/waterTower.ts` before authoring. They are copies of the project modules in `src/assets/` and show the preferred model style and data layout:

- `buildingShell.ts` is a reusable city building shell with three deterministic facade variants, a simple collider, and a front-door interaction point.
- `waterTower.ts` is a landmark assembled from a few low-sided Three.js primitives, with a separate tower collider and no interaction point.

The live asset contract is summarized here so authoring does not depend on access outside this folder. An `AuthoredAsset` has `schemaVersion: 1`, a stable lowercase ID, a display name, category (`prop`, `building`, or `landmark`), overall dimensions in metres, an optional box collider, local interaction points, and a deterministic `createVisual(variant?)` factory that returns a Three.js `Group`.

The runtime currently builds authored models from TypeScript and Three.js geometry/materials. There is no runtime GLB/GLTF import path. The Asset Bench can change dimensions, collider, interaction points, and the color/roughness/metalness of named materials for the five assets already in the catalog; it cannot create new geometry or catalog entries. Therefore, the primary handoff for a candidate is a TypeScript model module plus its review note. A `.blend`, `.glb`, or rendered image can be included as an optional preview or source, but does not replace the TypeScript draft or become usable in game by itself. The staging folder also has a lightweight `viewer.html` for previewing both examples and root-level `candidate-*.ts` modules. From the project root, start the Vite dev server and open `/unapproved-assets/viewer.html`; refresh it after adding or revising a module. The viewer uses the game's base camp render settings, omitting weather and gameplay effects.

## Visual direction

Make assets feel like they belong in a stylized, low-poly, post-apocalyptic rural/urban survival game. Existing art favors large, clear shapes, subdued natural colors, slightly worn surfaces, and a readable silhouette over surface detail. Assets should look coherent beside the scout, vegetation, city shells, camp buildings, fences, and the utility helicopter. The gameplay scout mesh in the viewer is used at its original scale and stands about 2.1 m from ground to head top.

### Human scale reference

The game's world uses **1 Three.js unit = 1 metre**; authored dimensions, placement coordinates, and gameplay movement use that same scale. The scout shown in the viewer is the actual gameplay model, placed unscaled. Its visible bounds are about **2.1 m high** from the ground plane to the top of the head. The jacket capsule alone is about 1.84 m tall; the head extends above it. This is a stylized game character rather than an anatomically exact human measurement, so use the scout in the viewer as the practical scale check. Keep the reference enabled while reviewing a candidate, then adjust the center-distance slider only to make both silhouettes easy to compare. Do not rescale either model to fit the preview.

- Use a few deliberate geometric forms. Flat-sided boxes, low-sided cylinders/cones, simple custom meshes, and lightly irregular shapes fit the existing work. Flat shading is common; use it when it helps show facets.
- Make the major silhouette recognizable from the angled top-down camera and close third-person view. Check the model at both distances before spending time on small details.
- Favor solid, believable construction and a small number of purposeful details: doors, roof breaks, supports, braces, trim, or a beacon. Avoid clusters of tiny bolts, thin wires that disappear at game distance, dense bevels, smooth high-poly surfaces, photoreal textures, and intricate interior geometry unless the asset specifically needs them.
- Keep the mood grounded and weathered. Avoid bright saturated/neon color, clean glossy plastic, and pure white/black surfaces. Reserve high-contrast warm colors for small signals or functional markers.
- Use metres and plausible scale. A typical city shell is about 21 m wide × 9 m tall × 18 m deep. The existing water tower is about 11 m × 16 m × 11 m. The in-game scout mesh is about 2.1 m tall. These are references, not fixed dimensions for every candidate.

### Established colors

Use these as a palette reference; matching the overall muted hue/value range matters more than copying every exact swatch. Prefer a small named palette per model and use `MeshStandardMaterial` with restrained highlights.

| Surface                     | Existing project colors                                          |
| --------------------------- | ---------------------------------------------------------------- |
| Dusty walls and stone       | `#a29b88`, `#8b887d`, `#aaa18f`, `#797762`, `#77796a`            |
| Roofs and dark structure    | `#514f49`, `#626753`, `#303832`, `#444943`                       |
| Soil, timber, doors, bark   | `#594332`, `#4b4035`, `#655744`, `#514437`                       |
| Foliage and military greens | `#355842`, `#42684d`, `#2d4b3c`, `#58624d`, `#74765c`, `#687454` |
| Muted metal                 | `#64675d`, `#59635b`, `#54594d`, `#292f2b`                       |
| Faded rust / paint          | `#9b624d`, `#89604c`, `#8e5142`                                  |
| Glass                       | `#65766d`, `#78908b`, `#526e70`                                  |
| Small amber signal          | `#d9b56e`, `#c5ad70`, `#d9bc73`                                  |

Existing standard materials are usually rough (`roughness` around 0.8–1.0) and only mildly metallic (`metalness` around 0–0.25). Windows and small indicators can be smoother or emissive, but keep those exceptions restrained. Give each surface material a stable lowercase `name`; the future editor and metadata overrides need names. Reuse the same material instance for repeated surfaces within one model.

## Coordinates and asset behavior

- Use Three.js coordinates with **Y up**, ground at `y = 0`, and the model centered around `x = 0, z = 0` unless its footprint calls for a different documented pivot.
- Use local **+Z as the front** for buildings and objects with a clear facing direction. Put a building's front door and its interaction point on that side, following the `buildingShell.ts` example.
- Set `dimensions` to the model's full placement bounds, not just its collider. Set collider center and size in the same local coordinates. Use the smallest useful approximate box that represents solid obstruction; for a tall open tower, do not fill its whole visual footprint if the player can walk beneath/through it.
- Interaction points are local positions in metres. Add one only for a meaningful interaction such as an entrance or service point; give each a stable unique ID and a clear label.
- Keep visuals deterministic. Do not use unseeded randomness or animation in `createVisual`; map placement, rotation, scale, and variant belong to the world/camp placement system.
- Keep variant selection deterministic and useful. If a model does not need a variant, ignore the optional parameter. A candidate's module must not mutate shared geometry or materials each time it is called.
- Mark meshes to cast/receive shadows where it improves the shape. Avoid unnecessary transparent materials and separate meshes for tiny details; these assets can be repeated in a large generated world.

## Files to provide for every candidate

Use a unique lowercase slug. Keep the model source and notes together at this directory level:

1. `candidate-<slug>.ts` — the draft source module, following the shape and level of detail in the examples. Use Three.js built-in geometry/materials where practical. Set `schemaVersion: 1`; use a draft ID such as `candidate-<slug>` so it cannot be mistaken for an already registered runtime ID. Its intended eventual import in the live source folder is `import type { AuthoredAsset } from './assetTypes';` as shown in the examples.
2. `candidate-<slug>.md` — a short review sheet with: purpose and intended placement; overall dimensions and scale reference; pivot/front direction; collider proposal; interaction points; material names and hex colors; variants (if any); rough geometry/material complexity; what reads well at near/far distance; unresolved questions; and status (`Draft` or `Ready for owner review`). Never label it approved.
3. Optional `candidate-<slug>-preview.png` or source/export files — include only when useful for judging shape. If an external asset, texture, or reference was used, identify its origin and license in the review sheet. Prefer original work and avoid assets with unclear reuse rights.

Do not overwrite the example files. Do not create a second candidate using an existing candidate's slug; add a suffix or a clearly named revision and note what changed. Keep source files reasonably small and avoid large uncompressed renders or duplicate exports.

## Review-ready checklist

Before marking a candidate `Ready for owner review`, confirm and record that:

- its intended gameplay role and likely use location are clear;
- its scale makes sense beside the 2.1 m gameplay scout mesh and any nearby structures;
- its silhouette and main colors remain legible from near and far;
- dimensions, pivot, collider, and interaction points agree with the model;
- materials use restrained roughness/metalness and stable names;
- geometry is economical for an asset that may be instanced or repeated;
- it is original or has documented source/license details; and
- every file remains inside `unapproved-assets/`.

The isolated staging directory is not wired into the app, so project builds and Asset Bench previews are not expected here. If you cannot run the game, do not claim an in-game validation; describe the preview method and any remaining uncertainty in the review sheet.

## Git commits

Local Git commits are allowed and encouraged when they help preserve candidate history. Stage only explicit files beneath `unapproved-assets/`; never use a broad add that could include unrelated project changes. Do not amend another person's commit, push a branch, change game source, or treat a commit as owner approval. Use a short message that identifies the candidate and whether it is an initial draft or revision.
