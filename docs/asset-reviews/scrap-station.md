# Scrap Sorting Station — approved asset review

Draft ID: `scrap-station` · Category: `prop` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #50, "Loot, survival, and interaction props"

## Purpose and intended placement

A waist-high trestle: a five-board top, a hand platform scale at one end with a canted weighing pan,
four sorted bins under the other, a back rail with three hanging pieces of scrap, and a scrap heap
on the pad. Intended in a salvage yard, a scrap dealer's pitch, or as an interactive salvage point
at a camp.

## Dimensions and scale

- Declared `dimensions`: 4.2 × 1.9 × 1.4 m
- Measured (vertex-accurate): 4.19 × 1.76 × 1.34 m (variants 0/2), 4.03 m wide (variant 1, part of
  the heap removed)
- Table top 2.8 × 0.86 m at 0.92 m, back rail at 1.58 m, scale head at 1.6 m. **0.9 scout heights** —
  the top is genuinely waist height and the rail is chest height.

## Pivot and front direction

Ground at y = 0, table centred on x = 0, z = 0. **+Z is the front of the table**, i.e. the side a
player stands on, with the apron board facing them. The scale is at −X and the bins are under the
+X half, so the two ends of the table are doing different jobs and are visibly different.

## Collider proposal

`center {0, 0.46, 0}`, `size {2.8, 0.92, 0.86}` — the table top volume.

A waist-high solid block: a player cannot walk through the table, and cannot get under it either
(the collider reaches the ground). The bins are inside the collider footprint, which is correct —
a player should not be able to stand in a bin.

The scale column, the back rail, the uprights and the scrap heap are all outside the collider. The
cost is a player clipping the rail, which is the same trade the platform and the fuel pump make.

## Interaction points

| id            | label       | position   |
| ------------- | ----------- | ---------- |
| `scrap-scale` | Hand Scale  | −0.9, 0, 0.72 |

In front of the scale, clear of the collider. Reads as a weigh or trade point.

## Materials

| name                | colour    | roughness | metalness | notes                            |
| ------------------- | --------- | --------- | --------- | -------------------------------- |
| `scrap-timber`      | `#594332` | 1         | 0         | trestle legs, some boards        |
| `scrap-pale-timber` | `#655744` | 1         | 0         | other boards, braces, apron      |
| `scrap-steel`       | `#54594d` | 0.85      | 0.3       | scale, rail, pan, uprights, bin lip |
| `scrap-rust`        | `#9b624d` | 0.95      | 0.15      | one bin, the hanging pieces, offcut |
| `scrap-dark`        | `#292f2b` | 0.9       | 0.25      | sorted pieces, scale base, heap  |
| `scrap-concrete`    | `#a29b88` | 0.95      | 0         | pad, dial face                   |
| `scrap-bin-green`   | `#42684d` | 0.9       | 0.1       | two of the four bins             |
| `scrap-bin-blue`    | `#526e70` | 0.9       | 0.1       | one bin                          |
| `scrap-signal`      | `#d9b56e` | 0.75      | 0.05      | four bin sort marks              |

9 materials, the joint-most in the batch with the rally marker. The two bin colours are the reason:
**the four-way colour split is what makes the bins read as sorting rather than as four crates**,
and they are the only place in the batch where a saturated hue is spent on something structural.

## Variants

| variant | table | bins | rail |
| ------- | ----- | ---- | ---- |
| 0       | intact | full, 2–3 pieces each | all three pieces |
| 1       | intact | **all emptied** | all three, heap part-cleared |
| 2       | **two boards displaced**, three rail pieces down | full | middle piece removed |

Variant 1 is the cleared-out state and is the cheapest (73 meshes). Variant 2 is the working state
and the only one that changes the top's silhouette — two boards shifted leaves gaps a player can see
through, which is more informative than a dirty table.

## Complexity

85 meshes / 1632 triangles (v0), 73 / 1488 (v1), 81 / 1532 (v2). 9 materials.

**The heaviest asset in the batch and it should be treated as a single-instance interactive prop.**
The count is dominated by the bins: four bins × (1 floor + 4 walls + 1 lip + 1 mark + 2–3 pieces) =
about 44 meshes, which is 52% of the total for four crates. If trimming is ever needed the bin walls
can drop from 4 to 2 per bin (−8 meshes) and the sort marks can go (−4) without changing the read;
the lip and the wall colours are what the split depends on.

## What reads well

- **Far:** the back rail with three hanging pieces and the four coloured bins in a row underneath.
  The rail line and the colour row are the silhouette, and the colour row is unique in the set.
- **Near:** the splayed trestle legs, the five-tone top with the apron, the scale column, dial,
  bezel and needle, the canted pan with two weighed pieces, the bin lips and stencilled marks, and
  the four-piece scrap heap on the pad.

## Geometry note

The cross braces, the rail uprights are boxes; the trestle cross stretchers and the rungs of the
sorting rail are cylinders placed by `spanTo()`. A cylinder's axis is +Y and two Euler angles with
the default XYZ order do not aim it at a target.

## Rework after the first preview

The first build ran **one long diagonal stretcher from trestle to trestle**, straight through the
bin bay, and in the render it read as a broken leg. It is now two short stretchers, each running
inward from a trestle to about the middle of the table, which brace the trestles without crossing
the bins. The trestle legs were also lifted 8 mm, because at their 0.09 rad splay the lower corner
of each leg was 3 mm below the ground.

## Unresolved questions

- The four bins are 0.5 m cubes under a 0.92 m top, which is a realistic proportion and means a
  player standing at the table cannot see into them. Only the front row is visible from a
  third-person camera.
- The scale is a column, a head, a dial and a pan on a bent post. The dial face is
  `scrap-concrete`, the same material as the pad, so the dial reads as a blank white disc. It
  needs its own value.
- The sort marks are 0.16 × 0.05 amber bars, one per bin. They say "these are labelled" and nothing
  more, and four identical labels is also a strange thing to do.
- Nothing in the bins is metal-coloured. The contents use `rustMaterial` and `darkMaterial` in
  rotation, so two bins are the same colour and two are not; a real sort would be by metal type and
  the colours would all differ.
- The scrap heap is four boxes in a loose stack and the offcut is one cylinder. It is the weakest
  part of the prop and the least important.
- The rail uprights are 0.7 m and the rail sits at 1.58 m, so the rail floats 0.2 m above the top
  of the uprights' collars — it is meant to be, but at a distance the rail and the uprights read as
  separate objects.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 (the offcut and the splayed trestle
  legs were each re-seated after measurement put them below ground).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  stretcher-through-the-bins fault was confirmed visible in the first build and confirmed fixed in
  this one. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
