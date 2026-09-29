# Farm Grain Silo — asset review

Asset ID: `farm-grain-silo` · Category: `landmark` · Status: **Approved by owner**
Source idea: `ASSET_IDEAS.txt` #18, "Forest and rural"

## Purpose and intended placement

A cylindrical storage landmark with a cone roof, a ladder, and a small attached utility shed. All
three features are named in the idea and all three are modelled — this candidate was given the
ladder partly because the fire escape review sheet (#10) specifically deferred it here, on the
grounds that a silo is a bigger structure the player gets closer to.

Expected at farmsteads, beside a barn (#19) or grain elevator, and as a rural skyline marker.

## Dimensions and scale

- Declared `dimensions`: 8.5 × 14.0 × 6.6 m
- Measured: 8.39 × 13.90 × 6.51 m (variants 0/1), 8.22 × 13.90 × 6.51 m (variant 2)
- 4.5 m diameter body, 11 m tall, 2.2 m cone. **6.6 scout heights** — a real farm silo and the
  second-tallest candidate after the fire lookout (19.2 m).
- The 6.51 m depth is the discharge chute, not the silo: the body is 4.5 m across and the chute
  reaches 1.7 m past it.
- The 8.39 m width is silo plus shed plus the ladder standing off the -X face.

## Pivot and front direction

Ground at y = 0. **The silo axis is 1.6 m left of the origin** (`SILO_X = -1.6`) so the combined
silhouette — silo plus attached shed — is centred on x = 0.

This is a third kind of pivot departure in the batch, alongside the rooftop tank (origin on the roof
deck) and the fire escape (origin on the wall plane). The practical consequence: **a placement
system that centres on the bounding box will shift this asset 1.6 m**, putting the silo off-centre
from where the author intended. The shed is at `SHED_X = 2.25` and the ladder at
`LADDER_X = SILO_X - 2.25 - 0.28 = -4.13`.

Once there are three of these, the placement code needs one documented way to express "where is my
origin", rather than each candidate being its own case.

## Collider proposal

`center {SILO_X, 5.5, 0}`, `size {4.6, 11, 4.6}` — the silo body only.

**The attached shed is not solid, and this is a real limitation.** A single box covering both the
silo and the shed would have to span x -3.85..3.85 at full height, which blocks a **phantom 8 m
wall** beside the silo where the shed is only 2.6 m tall. A phantom wall is worse than a
non-solid shed, so the collider covers the silo alone and the player will walk through the shed.

The silo is a `landmark` and the tall solid part; the shed is a detail on its side. That is the
reasoning, and the owner may reasonably disagree.

## Interaction points

| id            | label       | position      |
| ------------- | ----------- | ------------- |
| `silo-ladder` | Silo Ladder | -4.13, 0, 0.4 |

At the foot of the ladder, clear of the collider. A climb hook, consistent with the fire escape, the
hunting blind, and the lookout stair.

Note the shed has a real doorway (below) and **no** interaction point. That is a deliberate
inconsistency worth resolving: either the shed door gets a point, or the ladder point is the only
kind this asset offers. Right now the more obvious door is unlabelled and the less useful ladder is.

## Materials

| name              | colour    | roughness | metalness | notes                     |
| ----------------- | --------- | --------- | --------- | ------------------------- |
| `silo-galvanised` | `#8b887d` | 0.85      | 0.15      | variant 0                 |
| `silo-rusted`     | `#8e5142` | 0.9       | 0.15      | variant 1                 |
| `silo-olive`      | `#58624d` | 0.9       | 0.15      | variant 2                 |
| `silo-band`       | `#64675d` | 0.82      | 0.25      | hoops, vent cap, chute    |
| `ladder-steel`    | `#54594d` | 0.85      | 0.2       | ladder and safety cage    |
| `shed-timber`     | `#514437` | 1         | 0         | the utility shed          |
| `roof-dark`       | `#514f49` | 0.95      | 0         | flat, shed roof           |
| `concrete-base`   | `#797762` | 1         | 0         | base ring                 |
| `interior-dark`   | `#2a251f` | 1         | 0         | shed floor and back panel |

**7 live materials in variants 0/1 — the most in the batch, tied with the burned corner store.** The
shed is a separate building with its own timber, which is why. 6 in variant 2, which drops the
ladder.

## The ladder, and why its rungs are too far apart

The idea names a ladder, so it is modelled: 2 rails, 14 rungs, and 3 safety-cage hoops — 19 meshes,
more than half the asset.

**Rung spacing is 0.85 m, which is wrong by a factor of about three.** A real ladder is 0.25–0.3 m.
At true spacing a 12 m ladder is 40+ rungs, and 40 thin boxes on a scatterable landmark is not a
trade worth making.

The read is saved by the **safety cage hoops**, which are what actually make a silo ladder look
like a silo ladder from any distance. The rung spacing is the compromise, and it is only wrong if
the player gets close enough to the ladder to count rungs — which, given the ladder is not solid
and there is no climbing system, they cannot currently do.

This is the one place in the batch where thin geometry was accepted on a named feature, and the
fire escape review sheet drew that line explicitly.

## The shed doorway is a real opening

The shed's front wall is built as two piers and a lintel around a 1.0 × 2.1 m doorway, with a dark
interior panel at the back of the shed.

Verified by raycast from the front: the ray at the doorway reaches `interior-dark` at **z = -1.15**,
2.5 m back, with nothing in between. The ray at x = 3.5 stops dead at the pier at z = 1.39.

As with the barn shell and the ranger cabin, **this opening is blocked by the single-box collider**
(see above). It reads correctly and is not walkable.

## Variants

| variant | silo                 | ladder                      |
| ------- | -------------------- | --------------------------- |
| 0       | galvanised `#8b887d` | 14 rungs + 3 cage hoops     |
| 1       | rusted `#8e5142`     | 14 rungs + 3 cage hoops     |
| 2       | olive `#58624d`      | **ladder removed entirely** |

Variant 2 is the strong one. A silo with its ladder stripped is a specific, believable state —
something has been taken off it for parts — and it drops the asset from **34 meshes to 15** and
from 620 to 380 triangles. That is the cheapest variant in the batch and the most characterful.

## Cone roof, and the rotation that is easy to get wrong

The cone is a 12-segment `CylinderGeometry(0.4, 2.47, 2.2, 12)`. Note it is **not** rotated — an
earlier note in this review sheet said "overhanging slightly"; the 2.47 bottom radius against the
2.25 body gives a 22 cm overhang, which is what is meant.

The reason this is worth a comment: the fire lookout's pyramid roof _is_ rotated by `Math.PI / 4`,
and rotating a 4-segment cylinder by 45° inflates its measured extent by √2. That is a trap this
batch has already been caught by once. The silo's cone is left unrotated deliberately.

## Complexity

34 meshes / ~620 triangles (variants 0/1), 15 / ~380 (variant 2). 6–7 materials.

The ladder is 19 of the 34 meshes, so variant 2 is what the cost of this asset really looks like.
If the owner prefers all three variants to have ladders, the budget question is real.

## What reads well

- **Far:** the cylinder with its cone. Absolutely unmistakable, and the 6.6× height-to-width ratio
  reads as storage.
- **Near:** the cage-hooped ladder, the hoop bands, the chute, the shed doorway.

## Unresolved questions

- **The shed is not solid** and a single box cannot fix it without a phantom wall. The strongest
  case in the batch for multiple colliders.
- **The rung spacing is wrong by 3×** and can only be corrected at a large cost. Documented above.
- **The interaction point is on the ladder, not the shed door**, which is arguably backwards. The
  shed doorway is the more useful hook.
- **The silo axis is 1.6 m off the origin**, the third pivot departure in the batch.
- **No grain, no spillage, no chute hopper.** The chute is a plain angled box.
- **Variant 1's rusted silo is a different story from variant 2's stripped ladder** — one is
  surface decay, the other is vandalism. Mixing them would be interesting; keeping them separate
  is the current choice.
- **No ladder to the shed roof**, and the shed roof is flat and unreachable.
- The cone has no visible seams or ribs, so at close range a 12-sided cone can read as smooth. Flat
  shading helps, and 12 segments was chosen over 8 for that reason.
- Nothing says "grain". A small hatch at the cone base, or grain spilling at the chute, would
  identify the contents.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- Shed doorway confirmed as a real 2.5 m-deep opening by raycast, and the pier confirmed solid.
- Ladder rung count confirmed by measurement: 14 in variants 0/1, **0 in variant 2**.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** A 14 m cylinder is easy to get right or badly wrong, and
  only a real look settles it.

## Licensing

Original work. No external assets, textures, or references used.
