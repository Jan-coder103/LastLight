# Damaged Row House — candidate review

Draft ID: `candidate-row-house` · Category: `building` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #01, "City and suburbs"

## Purpose and intended placement

A narrow two-storey terrace home with a broken roof edge, boarded windows, and a clear front
door. Meant to be repeated along a suburban street: several placed side by side with small gaps
should read as a run of a partly-derelict terrace, which is a gap the existing 21 m city shell
does not cover.

## Dimensions and scale

- Declared `dimensions`: 6.8 × 8.2 × 9.7 m
- Measured: 6.75 × 8.12 × 9.62 m, identical across all three variants
- 5.8 m of wall width and 6.4 m to the eaves. Two storeys at 3.2 m each is generous for a
  terrace house; the ridge at 7.5 m puts the roof peak 3.6 head-heights above the 2.1 m scout,
  which is right for this building type.
- Depth 8.8 m of wall, with a 9.4 m roof overhanging 0.3 m at each gable.
- **Scale is the thing to check first in the viewer.** A terrace house is the most
  scale-sensitive thing in this batch — too wide and it stops being a terrace and becomes a
  detached house. If it looks wide, try 5.2 m of wall before changing anything else.

## Pivot and front direction

Ground at y = 0, footprint centred on x = 0, z = 0. **+Z is the street front**, with the front
door, door canopy, boarding, downpipe, and both gables on that face. A placement's `rotationY`
decides which way the house looks, so terraces should be rotated to face the road.

## Collider proposal

`center {0, 4.06, 0}`, `size {5.8, 8.12, 8.8}` — the wall footprint only. The roof overhangs to
6.75 m wide, but a 0.3 m eave at 6.4 m is not something a player collides with, so the collider
stops at the wall face. The gables are inside the box.

## Interaction points

| id           | label      | position       |
| ------------ | ---------- | -------------- |
| `front-door` | Front Door | -1.575, 0, 5.1 |

On the doorstep, just outside the collider. The door is modelled **closed** — the idea asks for a
"clear front door", meaning a legible one, not a walkthrough. If a later candidate wants enterable
row houses, that is a separate decision about the building shell, not something to fake here.

## The front door reveal is real geometry

The frame (two jambs and a head, 0.3 m deep) stands 0.25 m proud of the wall, and the door panel
sits 0.19 m behind the frame's front face. Verified by raycasting straight at the door from the
street:

| ray                      | first hit     | z     |
| ------------------------ | ------------- | ----- |
| door centreline, y = 1.1 | `door-timber` | 4.460 |
| jamb, x = -2.18          | `trim-stone`  | 4.650 |

The 0.19 m difference is the recess. An earlier draft put a dark `reveal-dark` box in front of the
door panel, which made the panel sit 1 cm _proud_ of that box and cancelled the reveal out — the
same "dark rectangle instead of real geometry" trap the crashed car fell into. The box is gone;
`reveal-dark` is now only used for window backings and the loft floor.

## Materials

| name               | colour    | roughness | metalness | notes                         |
| ------------------ | --------- | --------- | --------- | ----------------------------- |
| `wall-render-buff` | `#a29b88` | 1         | 0         | variant 0, flat               |
| `wall-render-grey` | `#8b887d` | 1         | 0         | variant 1, flat               |
| `wall-render-pale` | `#aaa18f` | 1         | 0         | variant 2, flat               |
| `roof-slate`       | `#514f49` | 0.95      | 0         | flat                          |
| `trim-stone`       | `#aaa18f` | 1         | 0         | plinth, door frame, step, cap |
| `timber-board`     | `#655744` | 1         | 0         | boarding, rafters             |
| `door-timber`      | `#4b4035` | 1         | 0         | door panel                    |
| `reveal-dark`      | `#2e2a25` | 1         | 0         | window backing, loft floor    |
| `pipe-metal`       | `#64675d` | 0.8       | 0.25      | downpipe, gutter              |
| `window-glass`     | `#65766d` | 0.35      | 0.05      | the one broken pane           |

8 live materials per variant. All from the established project palette. The only smooth surface
is the broken pane.

## Variants

| variant | wall tone      |
| ------- | -------------- |
| 0       | buff `#a29b88` |
| 1       | grey `#8b887d` |
| 2       | pale `#aaa18f` |

Wall tone only, following the `buildingShell` precedent. **The damage is identical in all three
variants** — the same collapsed roof gap, the same boarded windows. That is deliberate: an asset
that gets scattered through a street should be predictable, and "damaged" is this asset's
identity, not a variant axis. If a cleaner undamaged row house is wanted, that is a separate
candidate.

## The broken roof edge

Ridge runs along Z, so the roof slopes on ±X. The +X slope is intact. On -X:

- the rear section (z -4.7..0.4) is a normal slab at the roof angle;
- the front section (z 1.25..4.75) has **collapsed to a steeper 0.5 rad and dropped**, so it
  reads as a caved-in slope rather than a differently-angled one;
- between them is a **real gap** at z 0.4..1.25, spanned by three exposed rafter boards, with a
  `reveal-dark` loft floor behind so the hole shows a loft and not the inside of the far wall.

Verified by casting straight down through the gap at x = -1.6, z = 0.85: the first hit is
`timber-board` at y = 6.72 (a rafter), then the gable/wall at 6.40, then `reveal-dark` at 6.36
(the loft floor). No roof slab is hit, which is the point.

The gable ends are real triangular prisms (9 triangles each, custom `BufferGeometry`) rather than
boxes, so the attic is not open to the sky at the ridge. They rely on the shared wall material's
`flatShading` for crisp facets.

## Complexity

30 meshes, ~352 triangles, 8 materials. Cheaper than the crashed car by a wide margin, and
appropriate for an asset likely to be repeated along a whole street.

One economy note: the windows are **applied surface detail, not recessed openings** — the dark
backing panel and the boards sit on the wall surface. A boarded window is planks on the outside
in real life, so this is honest, but it does mean the wall is a single solid box. A perforated
wall with true reveals would need roughly 11 extra boxes and would not read any better at either
camera distance the style guide asks about.

## What reads well

- **Far:** the pitched silhouette with one collapsed slope, and the chimney. From the angled
  top-down camera the roof gap is the strongest feature on the model.
- **Near:** the door reveal, the two boarded windows, the broken pane, the downpipe, the
  plinth course. The gutter and ridge cap exist mainly to give the roof a readable edge.

## Unresolved questions

- **Window reveals** — applied rather than recessed, as above. Worth a decision if row houses are
  ever expected to be enterable or seen from inside.
- **The door is closed.** Confirm that is right, or whether a variant should have it ajar. An
  ajar door would need a real opening through the wall, which this asset does not have.
- Only three wall tones and no per-variant damage. If terraces need visual variety, variant count
  or a second candidate (clean row house) is the place to add it.
- The gable prism helper is local to this file. If idea 19 (barn shell) or 11 (ranger cabin) also
  want gables, that helper should be lifted into a shared module rather than copied a third time.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured (6.75 × 8.12 × 9.62) and confirmed
  inside the declared `dimensions`; `minY` 0.
- Door reveal and roof gap confirmed by raycast, as quoted above.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Raycasts and bounding boxes are not a substitute for
  looking at it; the scale check against the scout in particular is still outstanding.

## Licensing

Original work. No external assets, textures, or references used.
