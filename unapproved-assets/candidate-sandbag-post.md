# Sandbag Emplacement — candidate review

Draft ID: `candidate-sandbag-post` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #58 (added in the post-fifty extension)

## Purpose and intended placement

A short section of a sandbag wall: four battered courses, a plank firing step on two legs, a
supply crate, and a set of ammunition bands. Intended as a defensive position inside a base
perimeter, at a checkpoint approach, or as cover in a settlement street.

## Dimensions and scale

- Declared `dimensions`: 4.4 × 1.1 × 2.3 m
- Measured (vertex-accurate): 4.36 × 0.87 × 1.43 m (v0, v1), 1.95 m deep (v2, collapsed bags)
- Wall 3.6 m at the base tapering to 2.7 m, four courses to 0.81 m, firing plank at 0.84 m.
  **0.41 scout heights** — a chest-high parapet that a standing player can see and shoot over and a
  crouching player can hide behind.

## Pivot and front direction

Ground at y = 0, wall centred on x = 0, z = 0, running along X. **+Z is the defended side** — the
firing plank and its legs are on +Z, and the crate sits forward of the wall. A placement facing a
threat puts +Z toward it.

## Collider proposal

`center {0, 0.42, 0}`, `size {3.6, 0.84, 0.34}` — the bag wall only, at its real 0.34 m depth.

The collider is the wall's own footprint and height, so a player is stopped by the bags and can
climb or stand on them freely. The plank firing step at 0.84 m and the crate are both non-solid,
which means a player can stand on the plank with their head above the wall — exactly what a firing
step is for.

## Interaction points

| id               | label                | position   |
| ---------------- | -------------------- | ---------- |
| `sandbag-supply` | Sandbag Supply Crate | −1.9, 0, 1.1 |

In front of the crate, clear of the collider. Reads as an ammunition or supply point.

## Materials

| name                | colour    | roughness | metalness | notes                            |
| ------------------- | --------- | --------- | --------- | -------------------------------- |
| `sandbag-sand`      | `#7d7358` | 1         | 0         | alternating bags                 |
| `sandbag-sand-shade`| `#6b6449` | 1         | 0         | the other alternating bags       |
| `sandbag-timber`    | `#594332` | 1         | 0         | firing plank, two legs, stakes   |
| `sandbag-metal`     | `#54594d` | 0.85      | 0.3       | crate lid                        |
| `sandbag-crate`     | `#58624d` | 0.9       | 0.15      | the supply crate                 |
| `sandbag-dark`      | `#292f2b` | 0.9       | 0.25      | four ammunition bands, crate latch |
| `sandbag-signal`    | `#d9b56e` | 0.8       | 0         | one crate stencil                |

7 materials. Two values of the same hessian colour is the whole texture idea, and it is what stops
a 20-bag wall reading as one flat mass.

## Variants

| variant | wall | damage |
| ------- | ---- | ------ |
| 0       | four complete courses | — |
| 1       | four complete courses | **two top bags pulled off and dropped forward** |
| 2       | **top course missing**, three timber stakes exposed behind | two bags on the ground, a post toppled at its base |

Variant 2 is the one that changes the outline. A missing top course is also the most likely real
damage — that is the course a gunner leans over and knocks down.

## Complexity

33 meshes / 676 triangles (v0), 35 / 724 (v1), 33 / 640 (v2). 7 materials.

20 bags dominate the count, and each is a 6-segment cylinder: 120 triangles for 20 bags, so the
triangle total is modest. The mesh count is the cost, not the geometry. A variant that dropped the
per-bag material alternation would not save meshes, only materials.

## Rework after the first preview — the bags took two attempts

- **Attempt 1, boxes.** Each bag was a 0.6 × 0.3 × 0.62 m box. In the render the wall read as a
  stack of shipping crates: hard corners, visible gaps between courses, and an obviously regular
  grid. Bags are soft, tightly packed and irregular.
- **Attempt 2, cylinders.** Each bag became a 7-segment cylinder with a 2:1 length-to-height ratio.
  It read as **stacked logs** — the flat end caps and the uniform round section were the problem.
- **Attempt 3, what shipped.** Each bag is a 6-segment cylinder, 0.6 m long, with a small
  deterministic per-bag radius and yaw variation, and squashed in the vertical axis. That reads as
  a flattened sack with rolled ends. The squash also had to be applied to the mesh's *local X*
  axis, not its local Y: after `rotation.z = PI/2` lays the cylinder down, local X is world Y, so
  `scale.y = 0.6` was shortening the bag rather than flattening it, and the first flattened build
  sank 0.056 m below grade.

## What reads well

- **Far:** the battered wall line with the plank and crate on top of it. The taper is the read — a
  wall that steps back as it rises says "built up in a hurry".
- **Near:** the individual flattened bags with their alternating tones, the plank on its two legs,
  the four ammunition bands on the plank, and the supply crate with its lid and stencil.

## Unresolved questions

- The bags are laid with every bag in a course parallel to the wall, and each course's bags are all
  in the same direction. Real sandbag walls alternate the course direction 90°, which is a strong
  visual cue. Doing it here would need a second bag depth, so the wall would have to get deeper.
- The bags have no visible seam, tie or fold. The flat end caps are the giveaway at close range.
- The ammunition bands are 0.12 × 0.32 m dark plates tilted −0.5 rad, sitting on the plank. They
  read as four small tabs. Real bands wrap a bundle.
- The firing plank is 2.2 m long on two thin dowel legs, and it is cantilevered well past the
  wall's front. It reads as a bench, not as a step, because there is nothing under its far half.
- The crate is a plain box with a lid plate and one stencil. It is the second-brightest thing on
  the asset and it is not where the eye should go.
- The wall has no firing slit, no overhead cover and no return. Four courses of sandbag is a
  parapet, not an emplacement; a real one would be dug in with a rear berm.
- The `sandbag-signal` stencil is 0.22 × 0.1 m, which is the only warm colour on the asset and is
  probably not worth it.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0. The collider was reduced from
  0.96 m tall and 0.66 m deep to 0.84 × 0.34 after measurement showed it extended past the model's
  own bounds.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. The per-bag variation uses a fixed arithmetic function of the bag index, not a random
  number, so the wall is identical on every rebuild.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  crate read and the log read were each confirmed in a build and corrected. Not viewed in the game
  engine.

## Licensing

Original work. No external assets, textures, or references used.
