# Aircraft Hangar Shell — candidate review

Draft ID: `candidate-hangar-shell` · Category: `building` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #24, "Military base and checkpoints"

## Purpose and intended placement

A wide military building with a large sliding-door opening and weathered metal panels. Both named
features are modelled, and the opening is the largest in the batch: **14 m wide and 17.8 m deep**.

Expected at airbases, as the largest building in a military district, and as a skyline landmark
from a distance.

## The arch is faceted on purpose, and it avoided a fourth gable copy

The roof is **seven straight segments following a parabola**, not a curve and not a gable:

```
nodeY(x) = 0.4 + SPRING + RISE * (1 - (x / halfSpan) ** 2)
```

Heights are derived from that equation rather than listed, so changing `RISE` or the span cannot
leave the segments disconnected. Measured segment angles follow the curve, and the result reads as
a faceted arch — which suits the batch's low-poly language better than a smooth barrel roof would.

This matters beyond style. The gable helper reached **three copies** (row house, ranger cabin, barn
shell) and the barn review sheet recommended lifting it to a shared module. Building this roof as an
arch meant **no fourth copy was needed**, which is the cheapest way to respect that recommendation
without doing the refactor.

## Dimensions and scale

- Declared `dimensions`: 28.0 × 11.5 × 18.8 m
- Measured: 27.90 × 11.40 × 18.65 m (variants 0/2), **24.60 × 11.40 × 18.65 m (variant 1)**
- 24 m clear span, 18 m deep, 5.5 m to the springing line, 9.9 m at the arch crown. **4.7 scout
  heights.**
- A 24 m span is a real hangar width. Deliberately at the smaller end, because a true 40 m
  aircraft hangar would be so large it dominated any district it was placed in.
- **The 27.9 m width in variants 0/2 is the open door leaves**, which park out to x = ±13.95,
  overhanging the 24 m building by 2 m each side. Variant 1's doors are shut, so it is only
  24.6 m. That 3.3 m swing is the largest variant-driven footprint difference in the batch and the
  placement system has to plan for it.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the door end.** A placement's `rotationY` points
the opening at whatever the player should approach from.

## Collider proposal

`center {0, 5.0, 0}`, `size {24, 10, 18}` — the building.

**The collider covers the 14 m opening, so the hangar is not enterable.** This is the **largest
instance** of the batch's standing problem: five candidates now have a real, visible opening sealed
by a single box, and this one is a 14 × 7 m door.

| candidate    | opening                    | depth      |
| ------------ | -------------------------- | ---------- |
| ranger cabin | 1.1 × 2.1 m doorway        | 3.2 m      |
| sawmill      | 5 × 4.2 m loading bay      | 9.4 m      |
| barn shell   | 1.3 m sliding door gap     | 8.7 m      |
| pillbox post | 1.2 m doorway + 12 cm slit | 2.5 m      |
| **hangar**   | **14 × 7 m sliding door**  | **17.8 m** |

A 14 m opening is the one a player is most likely to try to walk or drive through, so this is the
case that most needs multiple colliders or a subtractable doorway. It is now the strongest single
argument in 29 candidates.

The open leaves overhang to x = ±13.95 but are track-mounted above the pier line, so they are
correctly outside the collider.

## The 14 m opening is real and deep

Two sliding leaves, each 6.9 m wide, parked over the piers. The front wall is two piers and a
lintel, so the full 14 m is empty.

Verified by raycasting in at y = 3, across the opening:

| x              | first hit            | z         |
| -------------- | -------------------- | --------- |
| 0              | `interior-dark`      | **-8.42** |
| ±4             | `interior-dark`      | **-8.42** |
| ±6.5           | `interior-dark`      | **-8.42** |
| y = 8 (lintel) | `hangar-panel-olive` | 9.00      |

**17.8 m of interior depth across the entire width.** The lintel stops at the wall face, so the
opening is bounded correctly above as well as at the sides.

### A bug this caught

Variant 1's shut doors were both centred at `x = 0`, so the two 6.9 m leaves stacked in the middle
and left 3.5 m open at each shoulder — a "closed" hangar with two big holes. The closed position is
`DOOR_W / 4` per leaf, not 0.

Re-verified after the fix: at x = ±5 and ±2 the rays hit `hangar-door`, and the leaves span
x -6.95..-0.05 and 0.05..6.95. The 10 cm gap at the centre is a realistic door meeting gap.

**A layout bug that a bounding box would never have found**, and that only a raycast at several
points across the opening exposed. Worth noting given how many of this batch's findings have been
of exactly this kind.

## Weathered metal: 6 bands and 2 rust streaks

Six horizontal panel bands, 0.18 m tall, standing 0.05 m proud up the side walls at y = 1.4, 3.0,
and 4.6. Two rust streaks, 0.7 m wide, running the full height of the back wall's inner face.

Eight meshes for the whole weathering treatment. The bands are what make a 24 m wall read as clad
metal rather than as a painted slab; the streaks are a single flat colour and are the weakest of
the two, since a real streak would be graded and this one is a rectangle.

## Materials

| name                 | colour    | roughness | metalness | notes                   |
| -------------------- | --------- | --------- | --------- | ----------------------- |
| `hangar-panel-olive` | `#58624d` | 0.9       | 0         | variant 0               |
| `hangar-panel-grey`  | `#8b887d` | 0.9       | 0         | variant 1               |
| `hangar-panel-faded` | `#626753` | 0.9       | 0         | variant 2               |
| `hangar-door`        | `#54594d` | 0.85      | 0.2       | leaves, ribs, and track |
| `interior-dark`      | `#2b2724` | 1         | 0         | floor and back panel    |
| `concrete-base`      | `#797762` | 1         | 0         | apron                   |
| `rust-streak`        | `#8e5142` | 0.9       | 0         | the two streaks         |

5 live materials per variant. `#58624d` for the military olive is straight from the established
palette's foliage-and-military-greens row, which is the most on-brief colour choice in the batch.

## Variants

| variant | panel           | doors    | width  |
| ------- | --------------- | -------- | ------ |
| 0       | olive `#58624d` | open     | 27.9 m |
| 1       | grey `#8b887d`  | **shut** | 24.6 m |
| 2       | faded `#626753` | open     | 27.9 m |

Variant 1 is the strong one and it is not about colour. A hangar with its doors shut is a
different building from one standing open — it is intact, secured, and closed off, where open means
either abandoned or still in use. That is the batch's "state over finish" pattern again, and here
it also happens to be the variant that changes the footprint.

Variants 0 and 2 are geometrically identical and differ only in panel tone.

## Door ribs

Four ribs per leaf, 0.16 m wide, standing 0.14 m proud of the leaf face. Eight meshes for the pair.

Without them a 6.9 × 6.9 m slab has nothing to read as. With them it reads as a sliding hangar door,
which is a specific and recognisable object. The rib offsets are derived from the leaf's own x, so
they follow the leaf whether it is open or shut — which is why the shut variant still looks right
after the position fix.

## Complexity

**33 meshes, ~396 triangles, 5 materials** — for a 28 m building.

That is the best value in the batch by a wide margin: 12 triangles per metre of span, against the
row house's 52 and the barn's 31. It is entirely large flat boxes, and the arch being seven boxes
rather than curved geometry is most of the reason.

For comparison, the crashed car is 74 meshes and 1196 triangles and is 3.5 m long.

## What reads well

- **Far:** the faceted arch. A 24 m span with a curved crown is unmistakable as an aircraft hangar
  from a very long way off, and the faceting makes it read as deliberate at any distance.
- **Near:** the open leaves on their track, the ribbed door faces, the cladding bands, and the
  dark 17.8 m interior.

## Unresolved questions

- **The collider seals the 14 m opening** — the batch's most consequential instance of this issue.
- **The interior is a floor and a back panel.** 17.8 m of dark nothing. A hangar this size would
  hold an aircraft frame, a gantry, or scaffolding, and a single silhouette inside would transform
  the asset. It is the single biggest available improvement.
- **The rust streaks are flat rectangles**, which is the weakest detail in the model.
- **No hangar markings on the apron** — no approach lines, no aircraft silhouette, no numbers.
- **No side doors.** A hangar has a personnel door beside the main one, and its absence at this
  scale is noticeable.
- **The arch has no internal structure** — no trusses, no ribs visible through the opening. From
  outside the arch is opaque so this does not matter, but a 24 m clear span implies a lot of
  structure, and if the interior is ever lit, an empty arch will look wrong.
- **Variants 0 and 2 are identical geometry**, so the third variant is largely wasted.
- **No damaged or burned state**, which is the obvious missing variant for a military building in
  this world.
- 33 meshes and 396 triangles is so cheap that a damaged variant with a hole in the arch and
  daylight through it is well within budget, and would be far more interesting than a third olive.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- The 14 m opening confirmed as a real 17.8 m deep void by raycast at five points across it, and
  the lintel confirmed solid.
- The shut-doors variant confirmed by raycast after fixing the leaf position, with both leaves'
  world spans measured to confirm they cover -6.95..6.95.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Whether seven segments read as an arch or as a faceted
  lump is the entire design of this asset and only a real look settles it.

## Licensing

Original work. No external assets, textures, or references used.
