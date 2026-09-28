# Parking Garage Ramp — candidate review

Draft ID: `candidate-parking-ramp` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #05, "City and suburbs"

## Purpose and intended placement

A recognizable concrete ramp section with chipped edges and a partial barrier, meant to read as the
way out of a parking structure. Large enough to be a landmark or a hard obstacle, and the only
asset in this batch that is primarily about a **slope** rather than a mass.

## Dimensions and scale

- Declared `dimensions`: 7.7 × 4.0 × 11.0 m
- Measured: 7.67 × 3.96 × 10.97 m (variants 0/2), 7.64 × 3.96 × 10.97 m (variant 1)
- 6.6 m of drivable width is a two-way ramp or a wide one-way single lane, 11 m of run, and a
  **2.9 m rise** — about 1.4 scout heights. The 13° slope is steeper than a real parking ramp
  (typically 8–12°) but is at the edge of plausible, and gentler slopes stopped reading as a ramp
  in silhouette.
- The 4.0 m height is the low ceiling and columns at the bottom end, not the ramp itself.

## Pivot and front direction

Ground at y = 0 at the **bottom** of the ramp. **+Z is the top of the ramp — the way out.** The
deck ascends toward +Z.

Verify with the numbers, because the sign is easy to get backwards: rotation about +X by a
_positive_ angle drops the +Z end, so the whole assembly is rotated **negative** to climb toward
+Z. Raycast down the centreline confirms the deck top at y = 1.71 at z = 0 and y = 2.89 at
z = +5.

## The whole sloped assembly lives in one tilted group

Every part that follows the slope — deck, kerbs, barrier, wall, arrow, rebar, soffit — is a child
of a single `slope` group rotated `-0.232` rad. The upright ceiling and columns stay in world
space.

**This structure is load-bearing, and it is there because the first attempt got it wrong.** The
original draft placed each part in world space using `y + z * tan(SLOPE)` offsets. The retaining
wall ended up **0.84 m underground**, and the kerbs and barrier posts drifted off the deck
surface because a `tan` offset applied at a part's centre does not follow a rotated box. Putting
the parts in a tilted group makes them parallel to the deck by construction, so the geometry
cannot drift. It also deleted about a dozen lines of trigonometry.

If a future revision adds sloped parts, they go in the `slope` group, not in world space.

## Collider proposal

`center {0, 1.7, 0}`, `size {6.9, 3.4, 11.0}`.

**Known limitation, and the most important caveat on this candidate: a single box cannot describe
a sloped deck.** This covers the ramp's whole bounding volume, so the player is blocked out of the
entire wedge — including the space under the high end where they could plausibly walk. It is the
worst box-vs-shape mismatch in the batch, worse than the corner store's L (#02), because here the
discrepancy is a continuous slope rather than a corner.

Options for the owner:

1. Accept it. The ramp is mostly a landmark and a "you cannot go this way" barrier, so a solid
   block may be functionally fine.
2. Add a second box matching the high half more closely, if the runtime ever takes multiple boxes.
3. Add a proper ramp or heightfield collider to the placement system, which is the correct fix
   and probably needed eventually for this asset class.

## Interaction points

None. A ramp is not something you interact with, and AGENTS says to add a point only for a
meaningful interaction. This is the only candidate in the batch with an empty list, deliberately.

## Materials

| name                 | colour    | roughness | metalness | notes                          |
| -------------------- | --------- | --------- | --------- | ------------------------------ |
| `concrete-ramp`      | `#8b887d` | 1         | 0         | variant 0, deck                |
| `concrete-ramp-dark` | `#797762` | 1         | 0         | variant 1, deck                |
| `concrete-ramp-worn` | `#a29b88` | 1         | 0         | variant 2, deck                |
| `kerb-concrete`      | `#aaa18f` | 1         | 0         | kerbs                          |
| `retaining-wall`     | `#77796a` | 1         | 0         | upstand wall, ceiling, columns |
| `barrier-steel`      | `#64675d` | 0.8       | 0.25      | posts and rail                 |
| `trim-dark`          | `#444943` | 0.9       | 0         | soffit                         |
| `signal-amber`       | `#c5ad70` | 0.9       | 0         | painted arrow                  |
| `rebar-rust`         | `#8e5142` | 0.85      | 0.2       | exposed at the chipped kerb    |

6 live materials per variant.

`signal-amber` is the **only** warm colour in the model, and it is used only for the painted
direction arrow — a small functional signal on a large grey mass. That is exactly the restricted
use of a high-contrast colour the style guide permits, and it doubles as the thing that tells the
player which way the ramp goes from a distance.

## Variants

| variant | deck      | barrier side  | arrow    |
| ------- | --------- | ------------- | -------- |
| 0       | `#8b887d` | +X (right)    | up       |
| 1       | `#797762` | **-X (left)** | up       |
| 2       | `#a29b88` | +X (right)    | **down** |

Variant 1 moves the barrier to the opposite side, which also moves the solid upstand wall to the
other edge — a genuinely different read, not a recolour. Variant 2 turns the whole arrow group
180° about Y to indicate a descent; the deck geometry stays identical, since flipping the ramp
would change its collision and its relationship to the ground.

Variant 1 is the only one that changes the bounding box (7.64 m wide instead of 7.67, because the
barrier and wall swap sides). The declared `dimensions` cover all three.

Note that variants 0 and 2 use the same `retaining-wall` and `barrier-steel` positions; the only
difference is the arrow. That is a thin variant and could usefully be thickened.

## "Partial" barrier is modelled, not implied

The guard rail covers **only the lower half** of the ramp (posts at z -4.2, -1.9, +0.4, rail
centred at z = -1.9 spanning 5.6 m). The top of the ramp is deliberately unguarded. The idea says
"a partial barrier", so the absence of rail at the top is intentional and will read as damage or
an unfinished job rather than as an oversight.

## Chipped edges

Each kerb side is **three short segments** with gaps between them, uneven vertical drops
(-0.06, +0.05, 0), and one segment tilted 0.06 rad. Two rusted rebar stubs poke out of the
shortened middle segment. This is a deliberate choice: a continuous kerb reads as new, whereas
broken segments with gaps read as spalled concrete from any distance.

## Complexity

20 meshes, ~240 triangles, 6 live materials. The **cheapest of the new five** and cheap for its
11 m span, because the sloped parts are all boxes. No custom geometry, no lights, no animation.

## What reads well

- **Far:** the wedge silhouette against flat ground, and the amber arrow. The ramp's diagonal is
  the single most distinctive shape in this batch.
- **Near:** the kerb gaps, the rebar, the missing top rail, the soffit shadow line.

## Unresolved questions

- **The sloped collider is unresolved** and is the main thing blocking this candidate. See above.
- **The ramp ascends out of a structure, but the "structure" is only a ceiling slab and two
  columns.** That is enough to read from the low camera but not enough to read as a car park from
  the top-down camera, where the ramp will look like a wedge lying on the ground. If this asset
  needs to work from above, it wants a real building around it, which is a different asset.
- **13° is steeper than a real ramp.** It was chosen so the slope reads in silhouette. If realism
  matters more, `SLOPE` is one constant and the bounds, collider, and `SLOPE_GROUP_Y` all follow
  from it.
- Variant 2 is thin (arrow only). Variant 1's barrier-side swap is the better variation and
  variant 0 could adopt it.
- No kerb on the top edge, no drainage channel, no height-clearance bar (the bent pipe over a real
  car park entrance), no signage. A clearance bar would be a strong silhouette detail and is worth
  considering.
- The wall is an **upstand sitting on the deck**, not a retaining wall below it. That was a
  deliberate change to stop geometry sinking below ground at the low end, but it means the asset
  is not really retaining anything. If it should look like it holds back earth, that is more
  geometry and it will go underground at the bottom.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured and confirmed inside the declared
  `dimensions`; `minY` 0. The buried retaining wall was found and fixed by the tilted-group
  rebuild.
- Deck ascent confirmed by raycast down the centreline: y = 1.71 at z = 0, y = 2.89 at z = +5.
  The amber arrow confirmed at z = 2.5, and the low ceiling confirmed overhanging z = -2.3 to -5.5.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** A sloped asset in particular cannot be judged from
  bounding boxes, and the wedge silhouette is the whole point of it.

## Licensing

Original work. No external assets, textures, or references used.
