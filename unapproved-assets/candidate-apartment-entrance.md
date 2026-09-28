# Apartment Block Entrance — candidate review

Draft ID: `candidate-apartment-entrance` · Category: `building` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #03, "City and suburbs"

## This is a facade module, not a building

The idea asks for a **reusable ground-floor facade**, and that shapes everything below:

- The back is deliberately **flat at z = -0.55** so the module butts against a building mass.
- The collider covers **only the module**, not any building behind it.
- It is expected to be **tiled, not placed alone.** Two or three side by side with the downpipes
  aligned should read as the ground floor of a block. Nothing in the model assumes it is alone,
  and the canopy and steps are sized to repeat at 7.7 m centres.
- Category is `building` because that is what it contributes to, but it is a kit piece. If the
  runtime later wants a distinct category for modular facade pieces, that is a one-word change.

If the owner would rather have a standalone building, that is a different asset and this one
should not be stretched into it.

## Dimensions and scale

- Declared `dimensions`: 7.7 × 4.9 × 2.4 m
- Measured: 7.60 × 4.80 × 2.35 m, identical across all three variants
- 7.6 m wide, 4.8 m tall — about 2.3 scout heights, a normal ground-floor storey for a low
  block. Deliberately shorter than the 9 m city shell, which is a whole building, and taller than
  the single-storey shop (#02), which is one storey.
- The z extent (2.35 m) is almost entirely the **canopy overhang** (to z = 1.8). The wall itself
  is only 1.1 m deep and the doorway recess is 0.7 m of that.

## Pivot and front direction

Ground at y = 0, module centred on x = 0, **+Z is the street**. The back face is flat at
z = -0.55. Because the module is meant to tile, the outer edges (the downpipes at x = ±3.62) are
the intended seams.

## Collider proposal

`center {0, 2.4, 0.4}`, `size {7.7, 4.8, 1.9}` — the module slab plus the steps, from z = -0.55
to z = 1.35. The canopy reaches z = 1.8 and is **not** in the collider, which is correct: a
canopy at 2.95 m should not stop the player walking under it.

## Interaction points

| id              | label         | position   |
| --------------- | ------------- | ---------- |
| `main-entrance` | Main Entrance | 0, 0, 1.05 |

On the pavement in front of the steps, clear of the collider.

## The doorway is a genuine void, and it was verified

The idea says "recessed doorway", so the front is built **around** the opening: a back slab plus
two piers and a lintel, with nothing spanning the gap. The door then sits at the back of the
alcove. Raycasting from the street:

| ray               | first hit     | z      | reading                                  |
| ----------------- | ------------- | ------ | ---------------------------------------- |
| x = 0.00, y = 1.2 | `door-timber` | -0.055 | door, **0.605 m behind the facade face** |
| x = 0.82, y = 1.2 | `facade-buff` | -0.150 | back of alcove, **0.70 m recess**        |
| x = 0.82, y = 3.5 | `facade-buff` | 0.550  | lintel, exactly at the facade face       |

The facade face is z = 0.55 and the back slab's front face is z = -0.15, so the alcove is 0.70 m
deep and the door is 0.605 m back inside it. This is a real void, not a dark panel on a wall.

**One bug found and fixed during this work.** The front layer was originally centred at z = 0.15,
which put the facade face at 0.50 rather than the 0.55 the code comment claimed. The geometry was
self-consistent but the documented intent was not, so `frontZ` is now an explicit 0.2. The lesson
from the crashed car applies to comments too: a comment asserting a measurement is a claim that
needs checking.

## Materials

| name                 | colour    | roughness | metalness | notes                       |
| -------------------- | --------- | --------- | --------- | --------------------------- |
| `facade-buff`        | `#a29b88` | 1         | 0         | variant 0                   |
| `facade-grey`        | `#8b887d` | 1         | 0         | variant 1                   |
| `facade-pale`        | `#aaa18f` | 1         | 0         | variant 2                   |
| `door-timber`        | `#4b4035` | 1         | 0         | variant 0                   |
| `door-timber-dark`   | `#514437` | 1         | 0         | variant 1                   |
| `door-painted-green` | `#54594d` | 1         | 0         | variant 2                   |
| `canopy-dark`        | `#514f49` | 0.95      | 0         | flat                        |
| `reveal-dark`        | `#2e2a25` | 1         | 0         | shadow band, window backing |
| `mailbox-metal`      | `#64675d` | 0.75      | 0.25      | bank surround, number plate |
| `mailbox-door`       | `#54594d` | 0.7       | 0.2       | six individual boxes        |
| `sconce-amber`       | `#d9b56e` | 0.4       | 0         | emissive `#7d6128` @ 0.55   |
| `pipe-metal`         | `#59635b` | 0.8       | 0.25      | downpipes                   |
| `timber-board`       | `#655744` | 1         | 0         | window boarding             |

8 live materials per variant. The `sconce-amber` is the only emissive surface and the only warm
accent — a small functional marker beside a door, which is the restrained use the style guide
allows.

## Variants

| variant | facade         | door                    |
| ------- | -------------- | ----------------------- |
| 0       | buff `#a29b88` | timber `#4b4035`        |
| 1       | grey `#8b887d` | dark timber `#514437`   |
| 2       | pale `#aaa18f` | painted green `#54594d` |

**Geometry is identical across all three variants, including the recess.** That is deliberate and
is the point of a modular facade piece: placement can rely on the opening, the steps, and the
canopy being in exactly the same place every time, and only the paint changes. The door tone
varies with the facade so a tiled run does not look randomly colour-matched.

## Complexity

28 meshes, ~336 triangles, 8 live materials.

The mailbox bank is **7 of those 28 meshes** (one surround plus six doors). That is the only place
in this batch where small repeated detail was worth the mesh count, because mailboxes are named
in the idea and they are what makes the module read as an entrance rather than a wall. If the
count needs cutting, the bank is the obvious candidate — the six doors could collapse into one
textured box, at the cost of the detail that earns its place.

## What reads well

- **Far:** the canopy band plus the dark recess. Even at distance the doorway reads as a hole in
  the facade, which is the whole job of this module.
- **Near:** the mailbox bank, the sconce, the boarding, the downpipes framing the tile seam.
- The downpipes are at the exact outer edges, so a tiled run gets a vertical rhythm for free.

## Unresolved questions

- **Tile spacing is undocumented.** 7.6 m module width, but the piers stop at ±3.8 and the
  downpipes sit at ±3.62, so modules placed at 7.7 m centres leave a 0.1 m gap. Whether that
  reads as a proper structural joint or an error needs an owner eye. This is the first thing to
  check with two modules side by side in the viewer.
- **No upper storey.** A ground-floor-only module will look odd if the building above it does not
  start at exactly y = 4.8. The height should probably be tied to the block's floor height, which
  is a placement-system concern.
- The sconce is emissive at 0.55 but has **no real light**, unlike the street light (#). It will
  read as a glowing amber box in daylight and nothing at night. Probably right for a wall lamp,
  but it is a deliberate difference from the street light and worth confirming.
- No upper-floor windows or a floor band, so the top edge of the module is a plain cut. If blocks
  are built by stacking modules, something should terminate that edge.
- The number plate is a blank metal box with no numeral. Intended — numerals are texture work,
  and this runtime builds geometry, not textures.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured (7.60 × 4.80 × 2.35) and confirmed inside
  the declared `dimensions`; `minY` 0.
- Doorway recess, alcove depth, and lintel position confirmed by raycast, as quoted above.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game, and not viewed tiled.** The tiling question above is the
  main thing static checks cannot answer.

## Licensing

Original work. No external assets, textures, or references used.
