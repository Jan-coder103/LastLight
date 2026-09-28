# Hunting Blind — candidate review

Draft ID: `candidate-hunting-blind` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #13, "Forest and rural"

## Purpose and intended placement

A raised, weathered hide with a ladder and narrow viewing slits, for forest edges and scrub. The
idea names the slits explicitly, and they are the feature this model is built around — a raised box
on legs is not identifiable as a hunting blind, but a box with horizontal letterbox slots is.

## The viewing slits are real gaps

Each of the four walls is built as **two boxes with a 0.13 m slot between them**, so the slit is
empty space. The panel heights are computed from the slit position rather than hard-coded:

```
belowH = SLIT_Y - SLIT_H/2 - PLATFORM_Y
aboveH = WALL_TOP - (SLIT_Y + SLIT_H/2)
```

so moving `SLIT_Y` cannot desynchronise the panels and leave a gap or an overlap.

Verified by raycasting straight through the blind at slit height from all four directions:

| ray                          | result                     |
| ---------------------------- | -------------------------- |
| front wall (+Z), y = 3.15    | **no hits at all**         |
| back wall (-Z), y = 3.15     | **no hits at all**         |
| right wall (+X), y = 3.15    | **no hits at all**         |
| left wall (-X), y = 3.15     | **no hits at all**         |
| just below the slit, y = 3.0 | `blind-timber` at z = 1.16 |
| just above the slit, y = 3.3 | `blind-timber` at z = 1.16 |

The empty result is the proof. A ray at slit height passes clean through both the near and far
slit and hits nothing in the model at all, while rays 15 cm above and below stop at the wall face
at z = 1.16. **You can see straight through this blind**, which is what a viewing slit is for.

There is a dark floor inside so the slit shows a shadowed interior rather than daylight through the
platform. The inner faces of the walls are timber, which is correct — a blind's interior is wood.

## Dimensions and scale

- Declared `dimensions`: 2.9 × 4.1 × 3.3 m
- Measured: 2.80 × 3.83 × 2.97 m (variants 0/1), 2.70 × 4.00 × 3.18 m (variant 2)
- Platform deck at 1.7 m, hut 1.9 m tall above it, roof at 3.6 m. **1.7 scout heights.**
- The 1.7 m platform is what makes it a _raised_ hide and is the first number to check in the
  viewer: too low and it is a shed, too high and it is a tower.
- Slit at y = 3.15, which is 1.45 m above the deck — eye height for someone standing on the
  platform, with a little margin.
- Variant 2 is 17 cm taller and 21 cm longer because of the broken roof board.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **No front** — the blind is meant to be oriented by
which way its slits face, and they face all four ways equally. `rotationY` is free.

## Collider proposal

`center {0, 0.85, 0}`, `size {2.5, 1.7, 2.5}` — the base and deck only.

**The hut interior is deliberately not solid**, so if the game ever gains the `hide-ladder` climb
hook being used, the player can stand in the blind. The support posts are covered, so the player
cannot walk underneath.

The ladder is likewise not solid. That is a deliberate cost: a player will walk through a rung.
The alternative — a box covering the whole thing — would make the blind an unusable lump, the same
reasoning as the transit shelter.

## Interaction points

| id            | label        | position   |
| ------------- | ------------ | ---------- |
| `hide-ladder` | Blind Ladder | 0, 0, 1.85 |

At the foot of the ladder, clear of the collider. A climb hook, for the same reason as the fire
escape and the lookout stair.

## Materials

| name                | colour    | roughness | metalness | notes                 |
| ------------------- | --------- | --------- | --------- | --------------------- |
| `blind-timber`      | `#4b4035` | 1         | 0         | variant 0             |
| `blind-timber-dark` | `#514437` | 1         | 0         | variant 1             |
| `blind-timber-worn` | `#594332` | 1         | 0         | variant 2             |
| `platform-deck`     | `#54594d` | 1         | 0         | deck and posts        |
| `roof-sheet`        | `#626753` | 0.95      | 0         | flat, corrugated look |
| `interior-dark`     | `#2a251f` | 1         | 0         | hut floor             |

4 live materials in every variant. **The smallest palette in the batch, tied with the rooftop
tank.** A blind in forest scrub should read as one dark shape; a small palette is what makes that
work.

## Variants

| variant | timber    | roof                                      |
| ------- | --------- | ----------------------------------------- |
| 0       | `#4b4035` | intact with lip                           |
| 1       | `#514437` | intact with lip                           |
| 2       | `#594332` | **front board missing, one board fallen** |

Variant 2 is the only one that changes geometry, and it is the useful one: the front roof lip is
replaced by a board that has come loose and is propped at an angle, leaving the interior open to
the sky. It also makes the asset 17 cm taller.

Note that the **cracked panel and the slit are the same feature here** — the idea's "narrow viewing
slits" and its weathering are served by the same 4 boxes, so there is no separate damage axis.

## The ladder is thin geometry, and it is named in the idea

7 meshes of 0.06–0.07 m section: 2 rails and 5 rungs. This is exactly the thin geometry the style
guide warns disappears at play distance, and it is here because the idea says "with ladder rungs".

Compare the fire escape (#10), where 12 balusters of 0.06 m were cut as unjustified. The difference
is that the ladder is a _named feature_ of this asset and the balusters were not. That distinction
is a judgement call and it is the line I have been drawing across the batch.

## Shed roof, not a gable

The roof is a single near-flat sheet (0.05 rad fall) with a front lip. A gable would have needed a
third copy of the triangular-prism helper, and a crude scrap-sheet roof suits a hide better than a
pitched one. Recorded in the review sheets for the row house and ranger cabin that the helper
should be lifted into a shared module if a third candidate needs it — this one avoided the need
instead.

## Complexity

25 meshes, ~300 triangles, 4 materials. Cheap for a 4 m raised structure, and cheap largely because
the walls are boxes with gaps rather than modelled boards.

## What reads well

- **Far:** the raised box on legs. The 1.7 m gap under the platform is the whole silhouette — a
  blind that sits on the ground does not read.
- **Near:** the four slits (you can see through them), the ladder, the sheet roof, the braces.

## Unresolved questions

- **The platform is not solid**, so the player cannot stand in the blind. That is the single
  biggest limitation, and it is a placement-system limitation rather than a modelling one.
- **Nothing suggests what is being hunted or watched.** No game trail, no shooting rail, no
  shooting stand, no spent cases, no field of view marker. A rail along the front slit would be 1
  mesh and would say "observation post" instantly.
- **No concealment.** A hunting blind in a survival game is usually camouflaged or screened; this
  is a bare timber box. Some slats or a brush pile on the platform would sell the idea far better
  than the current clean geometry.
- **The roof is clean.** Variants 0 and 1 have identical roofs and an identical lip, so the only
  weathering is the timber tone. Moss, a torn corner, or a sagging sheet would be cheap.
- **The ladder is vertical**, which is fine for 1.7 m but means it reads as a step-ladder rather
  than a fixed access ladder. It also sits in front of the blind rather than leaning on it.
- **No variant with the platform collapsed or the blind fallen**, which for a post-apocalyptic
  world is an obvious state worth having.
- The braces under the platform are at `rotation.x = sx * 0.75`, which alternates their direction
  by side. That is correct for a pair of braces but reads as an arbitrary asymmetry if the owner
  prefers them mirrored.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- All four viewing slits confirmed as real gaps by raycast, including the solid wall immediately
  above and below each, as quoted above.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Whether the slits are visible at all from the play
  camera is the thing that matters and it is exactly what a raycast cannot tell you.

## Licensing

Original work. No external assets, textures, or references used.
