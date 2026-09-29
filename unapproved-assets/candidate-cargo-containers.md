# Cargo Container Stack — candidate review

Draft ID: `candidate-cargo-containers` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #32, "Port, mountain, and industrial areas"

## Revision (owner feedback: the yellow unit clipped the stack)

The dust-yellow unit - the rotated skin-3 container - intersected the green unit: parked at
(-3.6, 0.2) with a +0.42 yaw, its door-end corner sat about 2.7 m inside the stack. It now parks
at (-4.6, -2.6) with a **-0.5 yaw, the opposite skew from the blue unit**, verified corner by
corner and in the viewer: roughly 0.9 m of daylight between it and the stack in every variant,
including the crushed variant 2. Declared `dimensions` are **11.5 x 5.2 x 10.3 m** (measured
11.42 x 5.18 x 10.23 m) and the collider moved to centre (-2.4, 2.6, -0.2) at the same size. The
door interaction point nudged to (3.6, 0, 0.6), square in front of the doors.


## Purpose and intended placement

A small yard of 20 ft shipping containers: a two-high block, a single offset unit, and one rotated
unit standing clear. Intended for a quayside yard, a works compound, or as cover beside a road,
where a player can climb the stack or use it as a hard obstacle.

## Dimensions and scale

- Declared `dimensions`: 11.5 × 5.2 × 10.3 m (revised; see the revision section above)
- Measured (vertex-accurate): 10.43 × 5.18 × 7.25 m (variants 0/2), 2.59 m tall (variant 1)
- A single container is 6.06 × 2.44 × 2.59 m, the real 20 ft unit. **1.2 scout heights** per
  container, 2.5 for the two-high stack.

## Pivot and front direction

Ground at y = 0. The asset origin is the centre of the yard pad, not the centre of any one
container, so a placement lands the block rather than a unit.

**+Z is the door end of the ground container** and therefore the useful "facing" for a placement
that wants the lockable side toward the player. The rotated unit is yawed -0.5 rad after the
clip revision (opposite skew from the blue unit), which is deliberate: a yard where every box is
axis-aligned reads as a wall.

## Collider proposal

`center {−1.9, 2.6, 1.3}`, `size {10.4, 5.2, 7.2}` — the whole stack footprint.

Containers are solid and stackable, so a single box over the whole arrangement is correct and is
what makes the stack usable as cover. The slight overhang past the visual on any axis is
deliberate: a collider marginally larger than the model stops a player clipping a corner rib.

## Interaction points

| id                | label            | position    |
| ----------------- | ---------------- | ----------- |
| `containers-door` | Container Doors  | 3.6, 0, 1.5 |

On the ground unit's door end, just clear of the collider. Reads as a search point.

## Materials

| name               | colour    | roughness | metalness | notes                          |
| ------------------ | --------- | --------- | --------- | ------------------------------ |
| `container-green`  | `#3f5b48` | 0.9       | 0.15      | flat shaded, body and ribs     |
| `container-blue`   | `#4d5c63` | 0.9       | 0.15      | flat shaded, body and ribs     |
| `container-red`    | `#7c5347` | 0.9       | 0.15      | flat shaded, top-of-stack unit |
| `container-dust`   | `#7d7358` | 0.9       | 0.15      | flat shaded, rotated unit      |
| `container-frame`  | `#54594d` | 0.85      | 0.3       | corner castings, rails, blank end |
| `container-door`   | `#64675d` | 0.8       | 0.3       | door leaves                    |
| `container-rust`   | `#8e5142` | 0.95      | 0.1       | crushed unit only              |
| `container-pad`    | `#4b4035` | 1         | 0         | yard blocks under the units    |

8 materials, but the four skins are the only variation and they all sit inside the project's
faded-paint range. `container-red` was pulled from `#8a4f42` to `#7c5347` after the preview: at
the original value the top of the stack read as the brightest thing in the yard.

## Variants

| variant | arrangement |
| ------- | ----------- |
| 0       | two-high block, offset unit, rotated unit |
| 1       | **second tier removed** — flat, spread yard |
| 2       | two-high block, offset unit, **rotated unit crushed** |

Variant 1 changes the silhouette height, which matters because a two-high stack is a landmark and a
flat one is cover. Variant 2 keeps the height and changes the state of the third unit.

## Geometry approach

Corrugation is suggested by 5–7 proud ribs per long side rather than a profiled shell. A real
corrugated panel would roughly quadruple the triangle count for a detail that disappears at play
distance. Corner castings, top and bottom rails and the door hardware carry the "container" read
instead, and those are the parts visible in silhouette.

## Complexity

136 meshes / 1728 triangles (v0), 112 / 1440 (v1), 139 / 1764 (v2). 8 materials.

136 meshes is the highest count of the ten candidates in this batch, and it is worth flagging: a
yard placement will want to be a *set* of 2–4 of these, not a field of them. If trimming is needed,
the corner castings can drop from 8 to 4 per unit (−24 meshes per stack) without changing the read
at distance.

## What reads well

- **Far:** the box-with-a-hard-frame silhouette and the rib rhythm along the long sides. Even at
  flat colour the stack is unmistakably containers.
- **Near:** corner castings, the four locking bars on each door leaf, the rib shadows, and the
  crushed unit's torn panel and stain.

## Unresolved questions

- The crushed unit is damage-as-read, not damage-as-simulation: a dented top, one leaning panel
  and a stain. It will not read as crushed at long range.
- No twistlocks, no lashing bars, no reefer machinery. A reefer variant would need a machinery-end
  face and is a separate question.
- Skin assignment is fixed per slot, not randomised. A placement wanting a different colour order
  needs a new variant rather than a seed.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view; the
  red-skin brightness problem was seen and the value corrected. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used. Container dimensions are the
public ISO 20 ft standard sizes.
