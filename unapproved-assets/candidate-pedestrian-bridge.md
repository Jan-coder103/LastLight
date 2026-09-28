# Collapsed Pedestrian Bridge — candidate review

Draft ID: `candidate-pedestrian-bridge` · Category: `landmark` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #06, "City and suburbs"

## Purpose and intended placement

A road landmark: a footbridge that failed with one span down, leaving standing spans on their
supports and the fallen deck lying across the road below. Expected on main roads, at river and
canal crossings, or at the edge of a district to break up a flat skyline.

## Rework (owner request: "needs to be longer")

Two faults, one of them the owner's own note:

1. **Too short.** The crossing was 14.6 m — a footbridge over a path, not a road landmark.
2. **It read as disconnected fragments.** One monolithic abutment slab, a bent "knee" column that
   stopped short of the deck it was supposed to support, and deck pieces that floated relative to
   each other. Nothing tied the pieces into one structure.

The rework is a real three-span crossing, 26.9 m end to end:

- **End abutments at z = ±12.3** and **two intermediate piers at z = ±4.4**, each with a cap that
  the deck slabs visibly seat into. Piers survive a span failure, so both stand in every
  variant — they are what make the wreck read as a bridge rather than a rockfall.
- Three spans of 6.35 / 8.0 / 6.35 m. Each span is built by one `deckSection` helper (slab,
  walking surface, two solid parapets) as a **group**, so tilts carry the whole rigid section
  instead of loosely-coupled boxes.
- **Variant 0/2:** the middle span is down, lying on the road in two rotated chunks with their
  parapets still attached; both pier stubs remain with torn rebar; the near end span stands,
  drooping 0.08 rad into the gap with rebar at the break.
- **Variant 1:** the near span is down instead, and the middle span hinges down toward the missing
  end from its far pier — a different silhouette from the road, not just moved debris.
- Tilt signs are verified against the geometry: each seated end stays on its support while the
  torn end droops (the first draft had one of these backwards).
- All fallen geometry is **vertex-accurately grounded**: the rotated chunks' lowest corners rest
  on y = 0 (the first build had corners up to 0.10 m under the ground plane).

## Dimensions and scale

- Declared `dimensions`: 5.8 × 6.3 × 27.0 m
- Measured (vertex-accurate): 5.68 × 5.97 × 26.90 m (variants 0/2), 5.65 × 5.97 × 26.90 m (v1)
- 26.9 m of crossing on a 4.0 m deck at 4.8 m — a real road width now, with the deck 2.3 scout
  heights up. The x extent is debris and the dropped guard rail, not the deck.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the direction of travel across the bridge** —
the deck crosses in Z, so a placement's `rotationY` decides which way the span runs.

## Collider proposal

`center {0, 2.45, 0}`, `size {3.9, 4.9, 26.4}`.

Same judgement as the first draft, now over three spans: **one tall box, so the player walks
beside the bridge rather than through a support**. There is real clearance under the standing
spans, but a single-box collider cannot offer it without letting the player walk through two
0.8 m piers and two abutments, which would read as a bug immediately. The honest multi-box option
(debris box + one box per support) still needs runtime support for multiple colliders; the
review position is unchanged — this is a judgement call for the owner.

## Interaction points

None. A collapsed bridge is a landmark and an obstacle, not something you interact with.

## Materials

| name                 | colour    | roughness | metalness | notes                     |
| -------------------- | --------- | --------- | --------- | ------------------------- |
| `concrete-deck`      | `#8b887d` | 1         | 0         | variant 0                 |
| `concrete-deck-dark` | `#797762` | 1         | 0         | variant 1                 |
| `concrete-deck-worn` | `#a29b88` | 1         | 0         | variant 2                 |
| `deck-surface`       | `#514f49` | 1         | 0         | walking surface           |
| `rail-metal`         | `#64675d` | 0.85      | 0.2       | bent guard rail           |
| `rebar-rust`         | `#8e5142` | 0.85      | 0.2       | torn reinforcement        |
| `rubble-concrete`    | `#8b887d` | 1         | 0         | spalled chunks            |

4–5 live materials depending on variant. `rubble-concrete` deliberately shares variant 0's hex
with a different stable name, as before, so the future editor can address debris independently.

## Variants

| variant | deck      | failure                                    |
| ------- | --------- | ------------------------------------------ |
| 0       | `#8b887d` | middle span down, near span torn           |
| 1       | `#797762` | **near** span down, middle span hinging    |
| 2       | `#a29b88` | as variant 0                               |

Variant 1 is now properly distinct in geometry (a hinging middle span vs a torn end span), not
just a mirror. Variants 0 and 2 remain identical geometry with different concrete tints — still
the batch's recurring weak third variant, and an intact-standing third state remains the obvious
replacement if the owner wants one.

## Complexity

37 meshes / ~296 triangles (v0, v2), 31 / ~248 (v1). 4–5 materials. Reasonable for a 27 m
landmark: the deckSection helper means each span is 3–4 meshes regardless of length.

## What reads well

- **Far:** a long horizontal deck line with a hole in it, four vertical supports, and a slab
  lying across the road. The 27 m length now fills a road junction the way the idea intends.
- **Near:** the rebar at both tears, the seated pier caps, the rotated fallen chunks, debris,
  and the dropped guard rail.

## Unresolved questions

- **The collider judgement call** above is the main open item, unchanged from the first draft.
- **It still crosses nothing by itself.** Placement across a cut, canal, or sunken road carries
  the read; on flat open ground it goes nowhere. This is more true at 27 m than it was at 14.6.
- Variants 0 and 2 are identical geometry.
- No damage to the abutments and no warning signage around the gap.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node with the project's three.js; **vertex-accurate** bounds measured
  and confirmed inside the declared `dimensions`; `minY` exactly 0 in all variants after lifting
  the rotated chunks and debris corners.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` positions.
- **Previewed in the staging viewer** (`viewer.html`) in headless Chromium with software WebGL,
  from pure side views and a three-quarter view, variants 0 and 1. The fragmented read of the
  old build was confirmed in side view; the new build reads as one continuous collapsed
  structure. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
