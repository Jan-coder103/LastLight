# Vehicle Checkpoint — candidate review

Draft ID: `candidate-vehicle-checkpoint` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #21, "Military base and checkpoints"

## Purpose and intended placement

A small road control point: a guard booth, staggered concrete barriers forming a lane, and two
faded warning signs. Expected at base entrances, on roads into restricted areas, and at the edges
of military ground.

The idea names exactly three things and all three are modelled. Nothing was added.

## Dimensions and scale

- Declared `dimensions`: 6.4 × 2.9 × 6.7 m
- Measured: 6.25 × 2.78 × 6.55 m (variants 0/2), 6.25 × 2.78 × 6.15 m (variant 1)
- The booth is 2.2 × 2.4 × 2.0 m with a roof at 2.78 m — **1.3 scout heights**. A guard booth is
  small and should feel cramped.
- The 6.55 m depth is the chicane: three barriers staggered over 3.2 m of road plus the booth
  behind them.
- The road is implied, not modelled. The asset spans the carriageway rather than including it,
  so it drops onto an existing road rather than bringing its own.

## Pivot and front direction

Ground at y = 0. **The road runs along X**, so the barriers are 3.0 m long in X and the asset
"faces" in Z. **-Z is oncoming traffic**; the booth's window and the signs face that way.

That is the opposite of most assets in this batch, where +Z is the front. Here +Z is the shoulder
the booth stands on, which is the only sensible arrangement for something that straddles a road.
A placement's `rotationY` decides which way the traffic approaches.

## Collider proposal

`center {0, 1.2, 2.2}`, `size {2.4, 2.4, 2.2}` — the booth only.

**The barriers are not solid, and this is a real limitation.** A single box cannot cover the booth
at z = 2.2 and a staggered barrier line across the carriageway without sealing the entire road,
which would defeat the asset's only purpose. So the booth blocks and the barriers do not.

The barriers are 1.0 m of stacked concrete and they look solid, so a player walking through one is
a visible lie. Two ways out, neither available today: multiple colliders (the batch's standing
request), or accepting it because a 1 m kerb-height obstacle is a minor annoyance next to a
completely blocked road.

## Interaction points

| id                 | label            | position  |
| ------------------ | ---------------- | --------- |
| `checkpoint-booth` | Checkpoint Booth | 0, 0, 0.7 |

In front of the booth window, clear of the collider. The obvious hook: talk to a guard, search the
booth, or trigger a roadblock. The window is the reason the point is where it is.

## Materials

| name                     | colour    | roughness | metalness | notes                      |
| ------------------------ | --------- | --------- | --------- | -------------------------- |
| `barrier-concrete-light` | `#aaa18f` | 1         | 0         | variant 0 barriers         |
| `barrier-concrete`       | `#8b887d` | 1         | 0         | variant 1 barriers         |
| `barrier-concrete-worn`  | `#797762` | 1         | 0         | variant 2 barriers         |
| `booth-panel-grey`       | `#8b887d` | 1         | 0         | variant 0 booth            |
| `booth-panel-olive`      | `#77796a` | 1         | 0         | variant 1 booth            |
| `booth-panel-worn`       | `#797762` | 1         | 0         | variant 2 booth            |
| `roof-dark`              | `#514f49` | 0.95      | 0         | flat, booth roof           |
| `interior-dark`          | `#2b2724` | 1         | 0         | booth interior, door panel |
| `sign-amber`             | `#c5ad70` | 0.9       | 0         | the two warning signs      |
| `post-metal`             | `#64675d` | 0.85      | 0.25      | sign posts                 |

6 live materials per variant.

**The amber signs are the only warm colour**, and they are a functional marker on a grey asset —
exactly the sanctioned use. Two small panels is the right dose; a saturated orange barrier or a
fluorescent vest would have broken the palette.

Note the barrier and booth tone indexes move together, so variant 1 gives grey barriers with an
olive booth. That is not deliberate variety so much as two parallel arrays that happen to be
indexed the same way, and it is worth a decision from the owner.

## The Jersey barrier profile is 3 stacked boxes

A real Jersey barrier has a distinctive trapezoidal cross-section. Approximated as three boxes of
decreasing width — 0.6, 0.44, 0.26 m over 1.0 m of height — the stepped silhouette reads as the
trapezoid from any distance and costs 3 meshes instead of a custom extrusion or a lathe.

That is 9 meshes for three barriers, and it is the single detail that makes them read as Jersey
barriers rather than as kerbstones. Verified: 3 courses per barrier, 9 total in variant 0.

## The booth window is a real opening

The road-facing wall is assembled from four segments — sill, head, and two jambs — around a
1.6 × 1.0 m window, with a dark interior panel behind it and an external ledge.

Verified by raycasting from the road inward: the ray at the window reaches `interior-dark` at
**z = 2.99**, 1.7 m inside, while the ray 1 m to the side stops at the wall face at z = 1.20.

The door on the outboard side is a **closed panel, not an opening.** The idea names no door here,
and unlike the ranger cabin or the pillbox there is nothing to gain from a second real void in a
6-mesh booth. The contrast is deliberate and worth noting: openings are built where the idea
asks for one.

## Variants

| variant | barriers                                       | count     |
| ------- | ---------------------------------------------- | --------- |
| 0       | staggered chicane, 3 barriers                  | 25 meshes |
| 1       | simpler two-barrier layout                     | 22 meshes |
| 2       | chicane plus a fourth barrier closing the lane | 28 meshes |

**This is the only candidate in the batch whose variants change the layout rather than the
finish.** For a checkpoint, where the barrier arrangement determines whether traffic can pass,
that is the axis that matters — and a world generator placing a line of checkpoints needs to vary
whether the road is open or closed.

Variant 2's fourth barrier at z = 2.0, in front of the booth, closes the lane. That is the state a
checkpoint goes to when it is manned, and it is the strongest of the three.

## Complexity

22–28 meshes, ~264–336 triangles, 6 materials. Cheap, and rightly so: this is a scatterable prop
that will be placed at several base entrances.

## What reads well

- **Far:** the barrier line across the road. Three horizontal 1 m bars at a stagger is a
  checkpoint from any distance, and the booth's dark window behind it is the second read.
- **Near:** the Jersey profile steps, the window ledge, the sign posts, the plinth.

## Unresolved questions

- **The barriers are not solid.** Discussed above; the batch's standing multiple-collider request
  covers it, but this is a bad case for it because the barriers are the asset's whole point.
- **No gate arm, no boom, no booth window glass.** A real checkpoint has all three. A boom across
  the lane would be 2 meshes and would strengthen the read considerably.
- **The booth is empty.** A chair, a desk, a radio — anything inside would be visible through the
  window and would sell "occupied" or "abandoned".
- **No approach markings on the road**, no painted lane lines, no "STOP" on the deck. The asset
  assumes an existing road surface with no markings, which may not be true of the game.
- **The signs are blank amber panels.** No text, symbol, or stripe. As with the transit shelter's
  route sign, numerals are texture work this runtime cannot do.
- **Barrier and booth tones are locked together** by variant index, which is probably not what
  anyone wants. Six meaningful combinations would be free.
- **No variant is weathered or damaged.** All three are intact concrete. A cracked or displaced
  barrier is the obvious missing state for an abandoned checkpoint.
- The two signs are at x = ±3.0 with different yaws, so they read as a pair from the road. Good.
  But they are also the widest thing in the asset at x = ±3.13, which is 1.1 m outside the barrier
  line — fine, just worth knowing the width is set by the signs, not the road furniture.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- Booth window opening confirmed as a real 1.7 m recess by raycast, and the wall beside it
  confirmed solid.
- Barrier course count confirmed (3 per barrier, 9 in variant 0) and the gap between barriers
  confirmed clear, so the chicane is real and passable.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Whether the chicane reads as a road layout or as three
  random walls is exactly what needs a real look.

## Licensing

Original work. No external assets, textures, or references used.
