# Burned Tree Cluster — candidate review

Draft ID: `candidate-burned-trees` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #16, "Forest and rural"

## Purpose and intended placement

A small group of blackened trunks and dead branches for fire-damaged forest patches. The whole
asset exists to be **scattered**, so its cost matters more than its detail: it is designed to be
placed across a hillside without the player noticing the repetition.

Expected in burnt woodland, along the edges of fire scars, and around the burned corner store (#02)
and the burned tree cluster's own ground scorch.

## No foliage, and that is the entire design

A dead tree is a trunk and stubs. There is no canopy, no branch-tip detail, and no leaves, because
the moment you add a leaf cluster the silhouette stops reading as "burned" and starts reading as
"tree".

The idea's word **"muted"** for the branches is the useful constraint: these are short broken
stubs, not a spreading dead canopy. The four branch definitions per trunk rise from 1.5 m long and
slightly below horizontal at 52% of trunk height, to 0.55 m and near-vertical at 93%. That is a
burnt limb, not a winter tree.

## Dimensions and scale

- Declared `dimensions`: 6.3 × 9.9 × 6.3 m
- Measured: 5.80 × 9.11 × 6.00 m (variant 0), 6.12 × 9.61 × 5.80 m (variant 1),
  5.80 × 8.61 × 5.85 m (variant 2)
- Trunks 3.4–9.6 m, 0.3 m at the base tapering to 0.14–0.26 m. Real burnt-tree proportions.
- Height is 4.3 scout heights at the tallest, and the spread is wider than the height in variant 1
  because the branches reach out.
- The 6 m footprint is the branch spread plus the scorch disc, not the trunks.

## Pivot and front direction

Ground at y = 0, and the x/z bounds are **not centred on the origin**: the cluster is authored
around its own layout, so variant 0 spans x -2.90..2.90 but z -2.90..3.10, and variant 1 reaches
x = 3.22. A placement that centres on the bounding box will be fine; one that assumes the origin is
the centroid will put the scorch disc slightly off-centre. Not corrected, because the layout
literals are more readable than a derived offset, and the discrepancy is under 0.3 m.

## There is no front

Symmetric by nature. `rotationY` is free and the scorch disc is rotationally symmetric, so a
scattered placement needs no orientation.

## Collider proposal

`center {0, 2, 0}`, `size {4.6, 4, 4.6}` — the trunk footprint, 4 m tall.

**Deliberately not the full 9 m height.** The branches overhead are not solid, which is right: a
player can walk under a burnt branch. A single box cannot describe five separate thin trunks, so
this covers the area the trunks occupy and accepts that a player may clip a branch — the same
accepted cost as the fire escape's railings.

The 4 m height also means the player is blocked at the trunks but not in the canopy, which matches
how a burnt stand actually feels to walk through.

## Interaction points

None. A burnt tree cluster is scenery, and the idea does not ask for an interaction. A "gather
charcoal" or "salvage" point would be inventing gameplay.

## Materials

| name         | colour    | roughness | metalness | notes                  |
| ------------ | --------- | --------- | --------- | ---------------------- |
| `char-black` | `#2b2724` | 1         | 0         | variant 0, flat shaded |
| `char-grey`  | `#3a3630` | 1         | 0         | variant 1, flat shaded |
| `char-deep`  | `#262320` | 1         | 0         | variant 2, flat shaded |
| `ash-ground` | `#444943` | 1         | 0         | scorch disc            |

**2 live materials per variant, tied with the timber stacks for the smallest palette in the batch.**

The char values are the darkest in the batch but deliberately **not pure black** — `#262320` is the
lowest — because the style guide rules out pure black surfaces and a dead black tree loses its form
entirely in a dark scene. The scorch disc at `#444943` is two steps lighter, which is what keeps the
trunks readable against their own burn mark.

## Variants

| variant | char      | cluster                                   | meshes |
| ------- | --------- | ----------------------------------------- | ------ |
| 0       | `#2b2724` | **full stand** — 5 trunks, 3.4–7.4 m      | 28     |
| 1       | `#3a3630` | **sparse** — 2 survivors, 4 stumps, 9.6 m | 15     |
| 2       | `#262320` | **snapped** — 3 trunks, 2 broken off high | 18     |

The three variants are genuinely different **cluster shapes**, not recolours, which is what a
scattered asset needs. Variant 1 at 15 meshes is also the cheapest thing in the batch and is the
right one to use liberally.

Variant 1 is the characterful one: two tall survivors over a field of stumps reads unmistakably as
a fire, and it is 13 meshes cheaper than variant 0.

## Branches are open-ended, which halves them

`CylinderGeometry(..., 6, 1, true)` — the `true` is `openEnded`. Each of the 20 branches drops its
two end caps, saving about 10 triangles each.

The reasoning: a branch is 0.045–0.1 m thick. Viewed end-on, an open cylinder is a hole about half a
pixel across at any distance this asset will be seen from, while the cap triangles are real cost on
an asset meant to be scattered by the dozen. Trunks and stumps are capped, because their tops are
large enough to see and a trunk with a hole in the top would be obvious.

## The leaning-trunk cap dip

A leaning trunk's flat end cap is perpendicular to its axis, so its vertices hang **below** the
nominal base point by `rFrom * sin(tilt)` — up to 5.3 cm on the most-leaning trunk. Measured, then
fixed by lifting each trunk's base by exactly that amount:

```ts
const base = new Vector3(trunk.x, 0.3 * Math.sin(Math.atan(trunk.lean)), trunk.z);
```

This keeps the cluster on the ground with none of it floating, and it is derived rather than
nudged, so changing a trunk's `lean` cannot reintroduce the dip.

## The scorch disc is one mesh and does a lot

A flat 12-sided disc, 5.2–5.8 m across, at `#444943`. It costs 1 mesh and ~24 triangles, and it is
what stops the trunks reading as cylinders placed on ordinary dirt. Without it the cluster floats
visually even when the geometry is correct.

## Complexity

28 meshes / ~436 triangles (variant 0), 15 / ~280 (variant 1), 18 / ~300 (variant 2). 2 live
materials.

For an asset that will be scattered across a hillside this is the right budget. The 8 capped limbs
and 20 open branches in variant 0 are irreducible: they are the tree.

## What reads well

- **Far:** the vertical bars against the sky. A stand of bare trunks is unmistakable, and the
  charred value makes them read as dead even against a dark treeline.
- **Near:** the snapped trunk tops, the stub branches, the bark facets, the scorch disc.

## Unresolved questions

- **No ground clutter.** A burnt patch has fallen bark, ash, and branches on the ground. There is
  the scorch disc and nothing else, which is the obvious next addition and would cost 3–4 meshes.
- **No surviving green.** A fire patch usually has some unburnt survivors or new growth. A single
  small green clump would break up the repetition badly and is 2 meshes.
- **The x/z bounds are not centred on the origin** (variant 0 z spans -2.90..3.10). Left as-is and
  documented above.
- **Every variant has the same branch pattern** — four branches at the same four heights and
  azimuths on every trunk, offset by the trunk's own direction. At 5 trunks × 3 variants placed in
  a row the pattern will start to show. A second branch table, or a variant-dependent subset, is
  the cheap fix.
- **No needle or debris litter**, and no ash colour variation. `#3a3630` on `char-grey` is the only
  grey.
- The scorch disc is a **regular dodecagon**, so from directly above its edge is visibly faceted.
  A slightly irregular outline would be better, and cheap, but 12-gon flat shading is the same
  language as the rest of the batch.
- **No leaning-over or fallen whole tree.** A burnt stand usually has at least one on the ground.
  That is a different asset (a fallen tree) and probably worth a separate idea.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0 after the trunk-base fix.
- Limb counts confirmed: 8 capped (5 trunks + 2 stumps + the scorch disc) and 20 open-ended
  branches in variant 0; variant heights 9.11 / 9.61 / 8.61 m confirm three distinct shapes.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical — which is the real
  check for a layout expressed as literals. No unseeded randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game, and never seen repeated in a row.** For a scatter asset the
  repetition question is the one that matters and it needs several placements side by side.

## Licensing

Original work. No external assets, textures, or references used.
