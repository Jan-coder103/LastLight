# Locked Ammunition Locker — candidate review

Draft ID: `candidate-ammunition-locker` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #43, "Loot, survival, and interaction props"

## Purpose and intended placement

A squat military-green steel ammunition locker on a concrete plinth: two hinged door leaves, a
centre barrel bolt with a hasp and padlock, corner gussets, a lid louvre, and a stencilled
inventory mark on the door. Intended in a guard post, an equipment room, or beside a checkpoint.

## Dimensions and scale

- Declared `dimensions`: 1.8 × 1.2 × 1.5 m (bounds include the open door swing and the ground
  clutter)
- Measured (vertex-accurate): 1.80 × 1.13 × 0.95 m (variant 0, doors shut), 1.46 × 1.13 × 1.47 m
  (variants 1 and 2, doors open)
- Locker 1.32 × 0.78 × 0.9 m on a 0.16 m plinth. **0.54 scout heights** — a low chest, not a
  cabinet.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the door face.** The doors swing out toward +Z,
so variants 1 and 2 are nearly 0.5 m deeper than variant 0; that swing is inside the declared
bounds on purpose, because a placement that clips an open leaf will be noticed immediately.

## Collider proposal

`center {0, 0.53, 0}`, `size {1.32, 1.06, 0.78}` — the carcass only, doors excluded.

The doors are outside the collider so an open leaf can be walked through. A locker is a container
the player will approach, not a wall, and the collider's job here is only to stop the player standing
inside the box. The plinth is inside the collider because it is what the box stands on.

## Interaction points

| id            | label                     | position   |
| ------------- | ------------------------- | ---------- |
| `locker-latch`| Locked Ammunition Locker  | 0, 0, 0.75 |

Directly in front of the latch, clear of the collider and of the open-door swing. Reads as a lock or
pry point.

## Materials

| name               | colour    | roughness | metalness | notes                              |
| ------------------ | --------- | --------- | --------- | ---------------------------------- |
| `locker-body`      | `#42684d` | 0.85      | 0.2       | carcass                            |
| `locker-door`      | `#355842` | 0.85      | 0.2       | door leaves, a half-tone darker     |
| `locker-frame`     | `#54594d` | 0.85      | 0.3       | lid, gussets, rails, hinges, latch |
| `locker-rust`      | `#9b624d` | 0.95      | 0.15      | padlock body, ammunition cases     |
| `locker-stencil`   | `#a29b88` | 0.9       | 0         | inventory band and bars            |
| `locker-signal`    | `#d9b56e` | 0.75      | 0.05      | the amber flash on the door        |
| `locker-plinth`    | `#797762` | 1         | 0         | concrete plinth, stone             |

7 materials, all in the military-green / muted-metal rows of the palette. `locker-door` is a half
tone below `locker-body` so the two leaves separate from the carcass without a second hue.

## Variants

| variant | doors | latch | contents |
| ------- | ----- | ----- | -------- |
| 0       | **shut** | bolted, padlock closed | hidden |
| 1       | open 1.25 rad | padlock swung open | three cases |
| 2       | open 1.25 rad | **bolt forced**, skewed | three cases |

Variant 0 is the locked state the idea asks for and the only one that shows the stencil. Variants 1
and 2 are the opened state; between them they say "opened carefully" and "opened by force", which
is the difference a player will read first.

The ammunition cases are only built in the open variants, which is why variant 0 is 36 meshes and
variants 1 and 2 are 43 and 45.

## Complexity

36 meshes / 608 triangles (v0), 43 / 604 (v1), 45 / 716 (v2). 7 materials.

## What reads well

- **Far:** a hard green box with a dark frame, sitting on a pale plinth. Nothing else in the
  candidate set is a low, wide, framed green box, so it separates from the supply cache and the
  scrap bins without trying.
- **Near:** the corner gussets, the two horizontal bands, the barrel bolt and keeper, the hasp and
  padlock, the lid louvre and rain lip, and the three cases with their lids on.

## Unresolved questions

- The stencil is a band and three bars, not a marking a player can read. It is doing the job of
  "this is labelled" rather than "this says 7.62".
- The padlock shackle is a half torus standing proud of the body. It reads as a padlock at 3 m and
  as an arc at 0.5 m.
- The ammunition cases are plain boxes with separate lids. If a placement needs to show ammunition
  rather than sealed cases, that is new geometry.
- Variant 2's forced bolt is rotated in place rather than torn off; it reads as bent, not as
  broken. A torn hasp with the staple still on the post would be a stronger state for one more
  mesh.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. Not
  viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
