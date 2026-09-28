# Pillbox Guard Post — candidate review

Draft ID: `candidate-pillbox-post` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #23, "Military base and checkpoints"

## Purpose and intended placement

A low reinforced lookout with a narrow firing slit and an approachable door. Both named features
are **real openings**, which is the second candidate in the batch (after the ranger cabin) where
the idea names a door and the door is built as an actual void.

Expected at base perimeters, at bridge heads, and at fortified corners — somewhere a person stood
and watched an approach.

## Dimensions and scale

- Declared `dimensions`: 4.0 × 2.9 × 3.8 m
- Measured: 3.87 × 2.76 × 3.72 m (variants 0/2), 3.87 × 2.76 × 3.39 m (variant 1)
- 3.5 m wide, 3.0 m deep, 2.2 m to the roof, 2.76 m to the cap crown. **1.3 scout heights.**
- 0.4 m walls, which is the "reinforced" in the idea and the thing that makes it read as a bunker
  rather than a garden wall.
- Variant 1 is 33 cm shallower because it has no sandbag row in front.

## Pivot and front direction

Ground at y = 0. **+Z is the front**, with the door on the left (-X) and the firing slit on the
right (+X). That split is deliberate: someone inside wants the door where they can reach it and
the slit where they can see past it, and separating them by 0.4 m of solid pier is what makes the
front read as a designed face rather than two holes in a box.

## Both openings are real, and the slit is 12 cm

The front wall is six segments with the door and slit as genuine gaps. Every segment is derived
from the named constants:

```
DOOR_X0/X1  -1.5 .. -0.3     DOOR_H  1.9
SLIT_X0/X1   0.1 ..  1.3     SLIT_Y0/Y1  1.35 .. 1.47
```

so moving `SLIT_Y` or the door width cannot leave a gap or an overlap in the surrounding wall.

Verified by raycasting in from the front (outer face at z = 1.50):

| ray                                 | first hit          | z         |
| ----------------------------------- | ------------------ | --------- |
| through the slit, x = 0.7, y = 1.41 | `interior-dark`    | **-1.04** |
| through the door, x = -0.9, y = 1.0 | `interior-dark`    | **-1.04** |
| the pier between them, x = -0.1     | `pillbox-concrete` | 1.50      |
| 11 cm below the slit, y = 1.30      | `pillbox-concrete` | 1.50      |
| 5 cm above the slit, y = 1.52       | `pillbox-concrete` | 1.50      |

The slit and the door both reach **2.5 m of interior** before hitting the dark panel on the inside
of the back wall. The rays 11 cm below and 5 cm above the slit stop dead at the wall face, which
is what proves the slot is a gap and not a decal.

The slit is at y 1.35–1.47, so 1.05–1.17 m above the internal floor — low, which is correct for a
prone or crouching firer and is a detail worth keeping.

## The door is hinged open, which is what "approachable" needs

A door panel on a real hinge group at the opening's right jamb, rotated -1.9 rad, standing out
against the front face. Measured: the leaf swings clear of the opening, which is why the ray through
the doorway reaches the interior rather than hitting the panel.

A closed door on a "guard post" would read as a sealed bunker. An open one reads as **manned,
recently, and now abandoned** — the door swung out, the sandbags still stacked.

## Correction: the collider seals both openings

`center {0, 1.1, 0}`, `size {3.5, 2.2, 3.0}` covers the whole post, **including the doorway**.

This is the **fourth** candidate in the batch with a real opening sealed by a single collider box:

| candidate       | opening                                    | blocked? |
| --------------- | ------------------------------------------ | -------- |
| ranger cabin    | 1.1 × 2.1 m doorway, 3.2 m deep            | yes      |
| sawmill         | 5 × 4.2 m loading bay, 9.4 m deep          | yes      |
| barn shell      | 1.3 m sliding door gap, 8.7 m deep         | yes      |
| **pillbox**     | **1.2 m doorway + 12 cm slit, 2.5 m deep** | **yes**  |
| aircraft hangar | 14 m door opening, 17.8 m deep             | yes      |

**For this asset the loss is worse than for the others**, because the door is explicitly described
as "approachable". As it stands the model has a real, visible, inviting doorway that the player
cannot walk through, which is a more noticeable contradiction than a large bay they might not try
to enter.

The honest description: **a guard post with a real open door and a real firing slit, both of which
the collider seals.** Its value is the openings and the 2.5 m of depth behind them.

## Materials

| name               | colour    | roughness | metalness | notes                   |
| ------------------ | --------- | --------- | --------- | ----------------------- |
| `pillbox-concrete` | `#8b887d` | 1         | 0         | all walls               |
| `pillbox-cap`      | `#a29b88` | 1         | 0         | footing, roof, apron    |
| `guard-door`       | `#54594d` | 0.85      | 0.2       | the door and its handle |
| `interior-dark`    | `#2b2724` | 1         | 0         | the interior panel      |
| `marking-olive`    | `#58624d` | 0.95      | 0         | stencil and sandbags    |

**5 live materials, identical in all three variants.** The only candidate in this batch with no
finish variation at all, because a concrete post has one material and the variation comes from
damage instead. The variant axis here is entirely structural.

`marking-olive` does double duty as the stencil and the sandbags, which is a small cheat: sandbags
are usually hessian or earth, not olive. Reusing the one available muted green is cheaper than a
sixth material and reads acceptably at distance.

## Variants

| variant | sandbags | meshes |
| ------- | -------- | ------ |
| 0       | 3        | 19     |
| 1       | **none** | 16     |
| 2       | 3        | 19     |

The weakest variant set in the batch, and worth being blunt about: **variants 0 and 2 are
geometrically identical** and differ only in concrete tone, so there is effectively one state here
plus a sandbag toggle.

The obvious missing variant is the one this asset most wants: a **collapsed or shelled front**, which
is what a fired-on pillbox actually looks like and would be the batch's strongest use of the
"removal tells a story" pattern. It was not built because the six-segment front wall is already at
the limit of what a readable pillbox costs, and opening it up properly needs a different
construction rather than a variant flag.

## The sloped apron is what makes it a pillbox

One box, 0.36 m tall and 0.7 m deep, rotated -0.55 rad at the top of the front face, plus a flat
cap. Two meshes.

Without the bevel this is a concrete box with two holes in it. The apron throws the top of the front
face back at an angle, which is the whole armoured read of a pillbox and is nearly free. If this
asset is revised, the apron is the part to keep.

## Complexity

16–19 meshes, ~192–228 triangles, 5 materials. Light for a 3.5 m reinforced structure, because the
walls are 6 flat boxes and the two openings cost nothing extra — they are the gaps between them.

## What reads well

- **Far:** the low wide mass with the sloped front and the 12 cm slit as a dark line. At distance
  the slit is the identifying feature, exactly as it is in life.
- **Near:** the open steel door, the sandbag row, the chamfered apron, the stencil.

## Unresolved questions

- **The collider seals the door and the slit** — worse here than anywhere else in the batch,
  because the idea says "approachable".
- **No collapsed or shelled variant**, which is the obvious state for this object.
- **The interior is a single dark panel.** You can see 2.5 m in and nothing else: no bench, no
  firing step, no ammunition, no light. A dark slit with something faintly visible behind it would
  be far better than a flat dark plane.
- **No firing step or bench inside**, so there is nothing at the height of the slit. A single box
  behind the slit at 0.6 m would explain why the slit is where it is.
- **Variants 0 and 2 are identical geometry.** As above.
- **The sandbags are in `marking-olive`**, which is the wrong material for hessian.
- **Nothing distinguishes this from the pillbox's neighbours** — no spent cases, no graffiti, no
  sandbag revetment, no wire. For a "guard post" in a war-torn world, that absence is noticeable.
- The stencil is a single 0.5 × 0.2 m olive rectangle on a 0.25 m pier, which is a very small target
  for a marking that is meant to be read.
- The door swings to -X (outward, to the left) and the slit is to the right, which is a considered
  arrangement, but it means the door leaf partially covers the left pier. Fine, and worth checking
  in the viewer.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- Both the firing slit and the doorway confirmed as real 2.5 m openings by raycast, with the wall
  immediately above and below the slit confirmed solid, as quoted above.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Whether a 12 cm slit is visible at all from the play
  camera is exactly the question a raycast cannot answer.

## Licensing

Original work. No external assets, textures, or references used.
