# Fire Lookout Tower — candidate review

Draft ID: `candidate-fire-lookout` · Category: `landmark` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #12, "Forest and rural"

## Purpose and intended placement

A slender timber tower with a braced frame, an enclosed glazed lookout cabin, a catwalk, and a
switchback stair. The idea calls for "a simple enclosed lookout cabin", and the cabin's continuous
four-sided glazing band is the feature that identifies the asset from a long way off.

Expected on ridges and high ground, and as a horizon landmark visible from the low city. At 19.2 m
it is **the tallest candidate in the batch**, deliberately 3 m above the existing 16 m water
tower, because a lookout has to see over things.

## Dimensions and scale

- Declared `dimensions`: 4.7 × 19.4 × 4.7 m
- Measured: 4.66 × 19.23 × 4.70 m, identical across variants 0/1; 4.66 × 19.23 × 4.70 in variant 2
  (one brace missing)
- 4.66 m across, 19.2 m tall: **9.2 scout heights**, and a base-to-top ratio of about 4:1, which is
  what "slender" means in practice.
- The leg footprint is a 3.8 m square at the ground, tapering to 2.7 m at the top. The 4.66 m
  overall width is the catwalk deck at 4.4 m plus the rail.
- The 19.2 m is the pyramid roof's ridge finial.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the side the stair starts on and the deck faces.**
The cabin is symmetric on all four sides, so `rotationY` only affects the stair and the missing
brace, not the silhouette.

## Collider proposal

`center {0, 7.4, 0}`, `size {3.8, 14.8, 3.8}` — solid from the ground to the cabin, covering the
leg volume.

**This is the same judgement as the collapsed pedestrian bridge, made for the same reason.** A
3.8 m square of four visible 0.4 m legs cannot be half-solid with one box. Options considered:

1. **Solid (chosen).** The player cannot walk under the tower. Walking beside it is the lie.
2. **Collider only on the top cabin**, letting the player walk under. Then they walk straight
   through four legs, which is much more obviously wrong.
3. **Multiple boxes**: one per leg, or one for the legs and one for the cabin.

Consistency note: this candidate and the bridge (#06) both chose "solid", and the rooftop water
tank (#04) chose "open, walk underneath". The difference is leg thickness — the tank's legs are
0.14 m and splayed, the tower's are 0.24–0.48 m and clearly substantial. That is a judgement the
owner may want to overrule consistently across all three.

## Interaction points

| id            | label         | position  |
| ------------- | ------------- | --------- |
| `tower-stair` | Lookout Stair | 0, 0, 2.2 |

At the foot of the first flight. A hook for a future climb/traversal mechanic. With no such system
in this batch, a point 14 m up the tower would be unreachable, so the climb point is the honest
choice.

## Materials

| name                | colour    | roughness | metalness | notes                  |
| ------------------- | --------- | --------- | --------- | ---------------------- |
| `tower-timber`      | `#594332` | 1         | 0         | variant 0              |
| `tower-timber-dark` | `#514437` | 1         | 0         | variant 1              |
| `tower-timber-worn` | `#4b4035` | 1         | 0         | variant 2              |
| `cabin-grey`        | `#8b887d` | 1         | 0         | variant 0              |
| `cabin-dark`        | `#797762` | 1         | 0         | variant 1              |
| `cabin-faded-red`   | `#9b624d` | 1         | 0         | variant 2              |
| `roof-dark`         | `#514f49` | 0.95      | 0         | flat, pyramid roof     |
| `window-glass`      | `#78908b` | 0.25      | 0.05      | the cabin glazing band |
| `rail-metal`        | `#64675d` | 0.82      | 0.25      | catwalk rails, finial  |

4 live materials per variant. The tower and cabin take **independent** tones from the same variant
index, so variant 2 gives worn timber with a faded-red cabin, which is the most characterful
combination.

## Variants

| variant | tower timber | cabin          | damage                   |
| ------- | ------------ | -------------- | ------------------------ |
| 0       | `#594332`    | grey `#8b887d` | intact                   |
| 1       | `#514437`    | dark `#797762` | intact                   |
| 2       | `#4b4035`    | faded red      | **middle brace missing** |

Variant 2's missing diagonal is the only useful variant in the set — it changes the frame's
silhouette and reads as a tower that is losing its integrity. The cabin's faded red is the only
saturated element anywhere in the batch, and it is a 3.2 m box on top of a 19 m tower, so it
reads as a distant marker rather than as a bright spot.

## The switchback stair replaced a straight one, and the bounds prove it

The first version used a single raking flight from the front of the tower to the back. It worked
and it was wrong: a 14 m rise spread over 9.5 m of plan made the asset **14.27 m deep**, twice the
tower's own footprint. As a landmark, sprawling to 14 m to reach the top is not acceptable.

It is now **three switchback flights inside the leg footprint** (z = +0.6, -0.6, +0.6) with two
landings, taking the true depth from 14.27 m to 4.70 m. 14 meshes: 3 stringers, 9 treads, 2
landings.

A ladder would have been 7 meshes and saved about 7, but a 19 m tower with a ladder reads as a
water tower. The stair is a real part of the lookout silhouette.

## Two bugs found while building this

1. **The diagonal braces were in the wrong plane.** They were positioned on the +X _face_ but
   rotated about **Z**, which tilts them _across_ that face in the XY plane. The ends were thrown
   out to x = 3.59, well past the 2.2 m deck, which is what produced the implausible 5.92 m width.
   A brace lying on a face must tilt _within_ that face — for a face at x = +h, that means
   rotation about **X**. Fixed, and the width dropped to 4.66 m.
2. **The lowest diagonal dipped 4 cm through the ground.** It spans from grade to the first brace
   level, and its own 0.11 m section tips below when centred exactly on the rise. Lifted 6 cm.

The diagonal's angle and length are now derived from the actual rise and the face width at that
height (`atan2(h * 2, rise)`), not hard-coded as a 45° bar, so changing the level spacing cannot
desynchronise it.

## The measurement error that was not an error

The first bounds check reported this asset as **8.77 × 8.77 m**, nearly double the truth. That was
my measurement, not the model: `Box3.setFromObject` transforms the geometry's _axis-aligned_
bounding box, so rotating a square 45° inflates its extent by √2. The pyramid roof is a
4-segment `CylinderGeometry` rotated by `Math.PI / 4`, which is exactly that case.

Vertex-accurate measurement gives 4.66 × 4.70 m. **Every declared `dimensions` in this folder was
set from the AABB method**, which over-estimates rotated geometry — so all of them are conservative
and safe, but the reported "measured" sizes in earlier review sheets are slightly larger than the
real ones. The fire lookout and the parking ramp are the two most rotation-sensitive assets here.

## Complexity

55 meshes, ~720 triangles, 4 live materials. **The heaviest asset in the batch by mesh count after
the crashed car**, and the tallest by a factor of two.

Where the 55 goes: 4 legs, 12 brace bars, 3 diagonals, 14 stair meshes, 1 deck, 4 rails, 8 rail
posts, 9 cabin meshes, 2 roof pieces. The rail posts are 8 meshes of 0.1 m square — the same
lesson as the fire escape's balusters, where 12 such meshes were cut. If this needs trimming, the
stair treads (9) and the rail posts (8) are the two reducible groups.

It is expensive for a prop, but this is a `landmark` placed rarely, and 19 m of braced tower is not
something a cheaper silhouette would sell.

## What reads well

- **Far:** the tapering braced frame and the overhanging pyramid roof. The glazing band is a
  horizontal accent near the top that stops it being just a mast.
- **Near:** the switchback stair, the diagonal braces, the catwalk rails, the finial.

## Unresolved questions

- **55 meshes is heavy.** Defensible for a rare landmark, but if lookouts become a repeatable
  ridge feature the stair is the thing to simplify.
- **The collider choice contradicts the rooftop tank's** and matches the bridge's. See above; this
  wants one consistent rule from the owner.
- **No cabin interior.** The glazing is a solid dark box, so the cabin reads from outside but a
  view from the catwalk would look at a closed shell. Given the cabin is the best viewpoint in the
  asset, that is a real gap if the player can ever get up there.
- **No roof hatch.** Nothing connects the catwalk to the roof, so the tower goes nowhere at the
  top. Same note as the fire escape.
- **The stair has no handrail**, and at a 65° pitch it looks steep. A single raking rail per
  flight would be 3 meshes and would help a lot; it was cut for budget.
- **No ladder or maintenance access**, and no tank or lightning rod. The finial stands in for a rod.
- **The lowest flight starts at y = 0.3**, not at the ground. Minor, but a player at the
  `tower-stair` point is looking at the bottom tread 30 cm up.
- Variant 2's missing brace is the only structural variation. There is no "half-collapsed" or
  "burnt out" state, which for a lookout in a post-apocalyptic world is an obvious missing idea.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.019.
- Switchback stair confirmed inside the footprint by raycast, and the true depth confirmed as
  4.70 m after the straight-flight version measured 14.27 m.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game, and never seen from a distance.** For a 19 m landmark the
  silhouette is the entire design and it is completely unverified.

## Licensing

Original work. No external assets, textures, or references used.
