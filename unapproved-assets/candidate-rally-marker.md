# Evacuation Rally Marker — candidate review

Draft ID: `candidate-rally-marker` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #49, "Loot, survival, and interaction props"

## Purpose and intended placement

A failed extraction point: a ring of paint on the ground, a leaning route sign, a flare stand with
one live flare, and three kit bags set down inside the ring. Intended on a road shoulder, at the
edge of a town, or as a narrative marker the player is meant to walk into rather than past.

## Dimensions and scale

- Declared `dimensions`: 5.4 × 2.9 × 5.4 m
- Measured (vertex-accurate): 5.40 × 2.70 × 5.40 m (all variants)
- Painted ring 4.2 m across, sign head at 2.1 m, flare at 1.27 m. **1.3 scout heights.** The
  diameter is the number that matters: 4.2 m is a two-person rally point, and it is the only
  ground-painted element in the whole candidate set.

## Pivot and front direction

Ground at y = 0, ring centred on x = 0, z = 0. **+Z is the front of the route sign** — the sign
faces the direction a player would approach from, and the flare stand is on +X, in front of the
ring, where it can be seen against the sign.

The whole assembly is a circle, so `rotationY` only matters for the sign, the flare stand and the
kit bags. That is intentional: the ground mark is rotation-independent and the uprights are not.

## Collider proposal

`center {−0.6, 1.0, −0.2}`, `size {0.9, 2.0, 0.7}` — the sign pole and its base only.

**The ring, the kit bags, the flare stand and the helmet are all outside the collider**, and a
player should be able to walk into the middle of the ring. That is the whole point: this is a place
to stand, not a place to be stopped by. The cost is a player clipping the sign pole, which is a
0.08 m cylinder.

## Interaction points

| id           | label       | position   |
| ------------ | ----------- | ---------- |
| `rally-sign` | Rally Sign  | 0.6, 0, 1.1 |

In front of the sign plate, clear of the collider. Reads as a sign or rally-point interaction.

## Materials

| name                 | colour    | roughness | metalness | notes                            |
| -------------------- | --------- | --------- | --------- | -------------------------------- |
| `rally-concrete`     | `#a29b88` | 0.95      | 0         | worn band segments, pole base    |
| `rally-paint`        | `#b09a66` | 0.9       | 0         | outer painted ring               |
| `rally-worn-paint`   | `#7d7358` | 1         | 0         | ground pool, worn ring segments  |
| `rally-steel`        | `#54594d` | 0.85      | 0.3       | pole, brackets, plate, stand     |
| `rally-rust`         | `#9b624d` | 0.95      | 0.15      | stand foot, spent flare, helmet band |
| `rally-signal`       | `#d9b56e` | 0.75      | 0.05      | sign face, live flare            |
| `rally-timber`       | `#594332` | 1         | 0         | bag straps, rope coil            |
| `rally-canvas`       | `#42684d` | 1         | 0         | two of the three kit bags        |
| `rally-socket`       | `#292f2b` | 0.9       | 0.25      | flare sockets                    |

9 materials, which is the most in the batch. The count is honest: the ground mark needs two values
of paint and two values of substrate to read as worn paint on prepared ground, and the bags need
their own colour.

`rally-paint` was pulled from the palette's `#c5ad70` to `#b09a66` after the first preview: at the
original value the ring was the brightest thing in the frame and out-shouted the sign.

## Variants

| variant | sign | flare | kit bags |
| ------- | ---- | ----- | -------- |
| 0       | complete | **live** in the stand | three |
| 1       | complete | **both sockets empty**, a spent flare on the ground | three |
| 2       | **plate torn off**, hanging by one bracket | **live** | three |

Variants 0 and 2 keep the live flare, which is the only live-flame in the candidate set and the
only place the amber signal is used at full strength. Variant 1 is the "called off, nobody came"
state.

## Complexity

51 meshes / 906 triangles (v0), 50 / 882 (v1), 44 / 816 (v2). 9 materials.

Twenty-one meshes of the count are the two painted rings: 12 outer segments and 9 inner. That is
the price of a ground mark that reads as paint rather than as a decal, and it is the single biggest
line item on the asset.

## What reads well

- **Far:** the ring. A 4.2 m painted circle with gaps in it is unmistakable from any angle and at
  any distance, and nothing else in the set produces a ground-level read like it.
- **Near:** the worn-through segments, the route sign with its arrow bars and stencilled name
  block, the flare stand with its two sockets, the three kit bags with their straps, and the
  discarded helmet.

## Rework after the first preview

- **The painted ring did not read as a ring.** Each segment was rotated by `-a` about Y, which
  points a box's long axis *radially*; the twelve segments came out as spokes and the whole thing
  read as scattered planks. The correct rotation for a box whose long axis is X on a circle of
  radius r is `-(a + π/2)`, and the arcs were shortened from 1.1 m to 0.86 m so twelve of them
  close the circle rather than overlapping it.
- **The sign faced the wrong way.** It was built looking down its own +X, which contradicted the
  +Z front the asset claims. It is now built in a group rotated −90° about Y, so the plate face
  genuinely looks +Z.

## Unresolved questions

- The ring segments are 20 mm thick boxes on the ground plane. On perfectly flat ground they will
  z-fight or float depending on the terrain, and there is no way to know without a terrain sample.
  This is the single biggest risk on the asset and it is only answerable in the engine.
- The paint does not blend into the ground; it sits on it. A painted decal or a vertex-coloured
  ground patch would be the right solution and neither is available in a mesh-only candidate.
- The sign's arrow bars point along the plate's own long axis rather than along a road direction,
  so the sign says "that way" without saying which way.
- Three kit bags is a guess. A failed extraction would leave more.
- The helmet is a cone with a torus band on the ground. It is the weakest element on the prop.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 (the helmet and the helmet band were
  each re-seated after measurement put them below ground).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  radial-segment ring and the misfacing sign were both confirmed visible in the first build and
  confirmed fixed in this one. Not viewed in the game engine, and the ground-plane behaviour has not
  been tested against real terrain.

## Licensing

Original work. No external assets, textures, or references used.
