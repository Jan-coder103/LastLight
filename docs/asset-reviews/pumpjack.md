# Oil Pumpjack — approved asset review

Draft ID: `pumpjack` · Category: `prop` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #53 (added in the post-fifty extension)

## Purpose and intended placement

A beam pump on a concrete pad: Samson post, walking beam with a stepped horsehead, pitman arms
driving from a gearbox, a counterweight, and a bridle dropping to a wellhead. Intended for oil-field
or heavy-industrial districts as a distinctive silhouette that is not a building.

## Dimensions and scale

- Declared `dimensions`: 3.2 × 4.4 × 5.5 m
- Measured (vertex-accurate): 2.90 × 3.91 × 5.15 m (v0), 3.91 m and 5.40 m tall variants differ
  with beam tilt, 3.12 × 3.54 × 5.01 m (v2)
- Pivot at 3.0 m, horsehead arc to ~3.7 m, gearbox at 1.3 m. **1.8 scout heights to the pivot.** The
  3.4 m beam on a 3.0 m post is a small pumpjack, correct for a single well.

## Pivot and front direction

Ground at y = 0, pad centred on x = 0, z = 0. **+Z is the well end** — the horsehead and the bridle
are at +Z, the pitman arms and the gearbox at −Z. The A-frame spreads along X, so the whole
machine's asymmetry is along Z and `rotationY` is what orients it on a map.

## Collider proposal

`center {0, 0.5, -0.2}`, `size {1.5, 1.0, 2.2}` — the pad footing and the gearbox only.

1.0 m high. A player can walk under the walking beam, between the A-frame legs, and right up to the
wellhead, which is the point of the prop: the interesting part is the mechanism overhead. The cost
is that the A-frame legs, the beam and the horsehead are all non-solid, so a player can walk
through the frame. A pylon makes the same trade.

## Interaction points

| id                | label            | position   |
| ----------------- | ---------------- | ---------- |
| `pumpjack-gearbox` | Pumpjack Gearbox | 0.8, 0, -1.4 |

At the corner of the gearbox, clear of the collider. Reads as a drive or salvage point.

## Materials

| name                | colour    | roughness | metalness | notes                              |
| ------------------- | --------- | --------- | --------- | ---------------------------------- |
| `pumpjack-beam`     | `#9b624d` | 1         | 0         | walking beam, horsehead plates     |
| `pumpjack-frame`    | `#59635b` | 0.9       | 0.25      | A-frame, gearbox body, beam bearing |
| `pumpjack-steel`    | `#292f2b` | 0.85      | 0.3       | pitman arms, crank shaft, stuffing box |
| `pumpjack-rod`      | `#54594d` | 0.7       | 0.35      | bridle, polished rod               |
| `pumpjack-concrete` | `#8b887d` | 1         | 0         | pad                                |
| `pumpjack-rust`     | `#8e5142` | 1         | 0.1       | counterweight, wellhead, head cap  |
| `pumpjack-signal`   | `#d9b56e` | 0.8       | 0         | gearbox warning plate              |

7 materials. The faded orange beam is the whole colour idea and it is the only saturated mass in
the batch, which is appropriate — a pumpjack is the one thing on an oil field that is painted.

## Variants

| variant | beam | counterweight | extra |
| ------- | ---- | ------------- | ----- |
| 0       | tilted 0.04 rad, running | fitted | — |
| 1       | **tilted 0.13 rad, nose up** (stalled) | fitted | a fallen counterweight plate |
| 2       | **tilted −0.09 rad, nose down** | **missing**, on the pad | — |

Variant 2 is the interesting one: a beam down and the counterweight off is a stripped machine, and
the missing mass changes the balance of the silhouette in a way the other two do not.

## Complexity

24 meshes / 424 triangles (v0), 25 / 436 (v1), 24 / 424 (v2). 7 materials.

**The leanest asset in the batch at 424 triangles for a 4 m machine**, and that is entirely down to
the faceted horsehead: four flat plates instead of a curved shell. It is the cheapest industrial
silhouette in the set so far.

## What reads well

- **Far:** the horizontal beam with a fan of plates at one end and a braced A-frame under the
  middle. The beam-plus-head shape is the entire read and it is unmistakable.
- **Near:** the gearbox with its warning plate, the crank shaft, the two pitman arms, the
  cross-braced A-frame, the counterweight, and the bridle dropping to the wellhead.

## Rework after the first preview — two structural faults

- **The beam and the A-frame were in the same plane.** The first build ran the walking beam along X
  and also spread the A-frame legs along X, so the Samson post and the beam were coplanar — the
  mechanism was a flat drawing of a pumpjack rather than a machine. The beam now runs along Z, the
  A-frame spreads along X, and the pitman arms straddle the crank on X, which is the real
  arrangement.
- **The horsehead was a random stack of blocks.** It was three boxes stepping up and away, which
  rendered as a small tower on the end of the beam with no resemblance to a curved head. It is now
  four plates stepped along a quarter arc of radius 0.86, each rotated about X to follow the arc,
  which reads as a faceted curved counterweight face.
- A first attempt used a partial `ConeGeometry` for the head. Rotating a cone about Y does not move
  its axis, so the "vertical curved plate" came out as a horizontal arc lying flat on the beam.
  Replaced with explicit boxes.

## Unresolved questions

- The head plates are stepped boxes, so the arc is four flat facets. That is the intended low-poly
  treatment, but the gaps between plates were visible until the plate's tangential size was raised
  from 0.34 to 0.47 to match the arc step.
- The counterweight is a plain box. A real crank counterweight is a curved segment; a box reads as
  a lump of iron, which is serviceable.
- The pitman arms are straight cylinders from the crank to the beam tail. They are the right
  mechanism but they are one rigid pair with no wrist pin or adjustment screw.
- The gearbox has a warning plate and nothing else. A real prime-mover house would have a belt
  guard, a motor and a fuel line.
- The bridle is a two-segment line and then a straight polished rod, both 0.035–0.045 m radius. At
  4 m from the camera this is close to the "thin wire that disappears" case `AGENTS.md` warns
  about, though the wellhead cylinder gives the rod something to land on.
- The concrete pad is 2.9 × 4.6 m and 0.24 m thick with square corners. It is the largest flat
  surface on the asset and it reads as a plain slab.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. Both
  structural faults were confirmed in the first build and confirmed fixed. Not viewed in the game
  engine.

## Licensing

Original work. No external assets, textures, or references used.
