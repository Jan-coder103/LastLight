# Alley Fire Escape — candidate review

Draft ID: `candidate-fire-escape` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #10, "City and suburbs"

## Purpose and intended placement

A wall-mounted ladder and set of small platforms that gives an alley or rear facade a distinctive
silhouette. The idea asks for "a distinctive building silhouette", and that is the design
priority: a stack of horizontal platforms up a blank wall reads as a fire escape from a distance
in a way that individual rungs never would.

Expected on the rear or side walls of low-rise city and apartment shells, in alleys, and at the
backs of blocks. Placed **flush against a wall** — see the pivot section.

## Second deliberate pivot exception: the wall plane is z = 0

Everything in this asset projects toward **+Z from a flat back plane at z = 0**, so it can be
placed straight against a building wall with no offset math. This is the same reasoning as the
rooftop water tank, which uses a roof deck as its y = 0.

Verified: the model's z bounds are exactly 0.00 to 1.53. The back plane is z = 0 and nothing
extends behind it.

**The trap is the same one as the tank.** Any placement code that centres an asset on its bounding
box, snaps it to terrain, or offsets it by half its depth will push this asset 0.77 m into the
wall. The world generator has to special-case assets whose origin is deliberately on a face rather
than at the centre. Two candidates in this batch now depend on that, which makes it worth
handling once, properly, for both.

## Dimensions and scale

- Declared `dimensions`: 4.0 × 10.4 × 1.7 m
- Measured: 3.09 × 9.93 × 1.53 m (variants 0/2), 3.09 × 6.93 × 1.53 m (variant 1)
- Three platforms at y = 3.0, 6.0, and 9.0, with 1.0 m rails. Platform spacing of 3.0 m is one
  storey, which is correct for a fire escape.
- Total height 9.93 m, so 4.7 scout heights. The declared 10.4 m is set by variant 1's shorter
  neighbour rather than by the tallest variant's 9.93 m.
- 1.53 m of projection from the wall. The 3.09 m width includes the ladder, which sits outboard of
  the platforms on the +X side (platform edge at 1.2, ladder rails at 1.27 and 1.83).
- **The lowest mesh is at y = 0.1, not 0.** A wall-mounted fire escape is bolted to the wall above
  a drop ladder, so nothing here needs to touch the ground, and the ladder foot sits 10 cm up. This
  is a deliberate departure from the "everything sits on y = 0" habit of the rest of the batch and
  is called out here so it is not mistaken for a bug.

## Pivot and front direction

Wall plane at z = 0, everything toward +Z, x = 0 is the centre of the platform stack. **There is no
front.** +Z is "away from the wall".

## Collider proposal

`center {0, 5.0, 0.1}`, `size {2.6, 10.0, 0.3}` — a thin slab at the wall plane.

Rationale, and it is a short one: **the building's own wall is what really stops the player.** This
asset assumes it is mounted on a wall, and a wall already in the world does that job. The collider
is a safety slab so that if the fire escape is placed against something that is not solid, the
structure still blocks at the wall.

The platforms and rails are **deliberately not solid**, so the player can stand on them — which is
the entire purpose of a fire escape. The cost is that the player can also walk through the railings
and the ladder. A single box cannot represent both a wall and three separate standable platforms,
and the platforms are the more valuable half.

## Interaction points

| id             | label              | position     |
| -------------- | ------------------ | ------------ |
| `climb-ladder` | Fire Escape Ladder | 1.55, 0, 1.1 |

At the foot of the ladder, on the +X side. Reads as a climb point. Note the asset has no vertical
movement system behind it — this is a hook for a future traversal mechanic, and if the game never
gains one, the point is harmless but unused.

## Materials

| name             | colour    | roughness | metalness | notes                      |
| ---------------- | --------- | --------- | --------- | -------------------------- |
| `frame-steel`    | `#64675d` | 0.82      | 0.25      | flat shaded, the structure |
| `platform-grate` | `#54594d` | 0.9       | 0         | platform floors            |
| `ladder-rust`    | `#8e5142` | 0.85      | 0.2       | ladder and drop ladder     |

**3 materials, all live in every variant.** Tied with the rooftop tank for the smallest palette in
the batch, and for the same reason: this is a silhouette asset. A fire escape against a wall
should read as one dark shape with a rusty ladder, not as a parts list.

The split is deliberate — the structure is galvanised grey, the ladder is rusted. On a wall
facade that contrast is what makes the climbable route readable from across the alley.

## Variants

| variant | platforms     | damage                                         |
| ------- | ------------- | ---------------------------------------------- |
| 0       | 3.0, 6.0, 9.0 | intact                                         |
| 1       | 3.0, 6.0      | top landing gone, 3.0 m shorter overall        |
| 2       | 3.0, 6.0, 9.0 | middle front rail missing, 2 ladder rungs gone |

Variant 1 is the useful one — losing the top landing changes the silhouette completely and drops
the model from 9.93 m to 6.93 m, so a world generator can place a low fire escape on a two-storey
block and a full-height one on a taller building.

Variant 2 keeps the full height but damages it: the middle platform's front rail is omitted, and
two rungs are missing from the middle of the ladder so there is a visible gap to climb past. Both
of those are the kind of detail that reads as neglect rather than as a modelling shortcut.

**The ladder stops at the top platform.** Verified: at y = 9.0 the nearest rung below is at 7.57,
and the topmost rung is at 9.3, half a metre above the top platform. Climbing from the top rung
onto the top platform is a 0.35 m sideways step, which is not a route any movement system would
accept without help.

## No balusters, on purpose

An earlier draft had 0.06 m square uprights carrying each side rail — **12 extra meshes** on an
asset that was already at 45 meshes and 540 triangles. They are exactly the thin geometry the style
guide warns disappears at game distance, and the asset exists to be seen from the street.

The rails now sit directly on the platform edges, which is how plenty of real fire escapes are
built. That took the model from 45 meshes / 540 triangles to 32 / 384, and the silhouette is
unchanged.

Rungs also went from 7 to 6 for the same reason.

## Complexity

32 meshes / ~384 triangles (variant 0), 25 / ~300 (variant 1), 29 / ~348 (variant 2). 3 materials.

Per platform: floor, front rail, two side rails, two brackets, one wall plate = 7 meshes. Plus 2
ladder rails, 6 rungs, and 3 for the drop ladder.

384 triangles for 10 m of structure is high for a prop, and it is all boxes. The cost is
irreducible thin geometry — 0.05 to 0.07 m section members, which is what a fire escape is. If
this asset is placed on many buildings, that is the number to argue about, and the drop ladder is
the first thing to cut.

## The drop ladder is the detail that earns the name

3 meshes: two rails and one rung hanging from the front edge of the lowest platform. A stack of
platforms is a balcony; platform **plus a hanging ladder** is a fire escape. It is the cheapest
3 meshes in the whole batch and the one that most specifically identifies the asset.

## What reads well

- **Far:** the horizontal platform stack against a blank wall. This is the whole design.
- **Near:** the rusted ladder, the brackets, the wall plates, the drop ladder.

## Unresolved questions

- **The wall-plane pivot is the main item**, and it is now shared with the rooftop tank. Two
  candidates with origin-on-a-face is enough to justify a general fix in the placement system.
- **The platforms are not solid.** The player can stand on them but also walk through the rails.
  Real platform collision needs either multiple boxes or a per-platform collider concept, and
  neither exists yet.
- **The ladder is on the +X side only.** A real fire escape's drop ladder is usually on the street
  side, so this should face the alley mouth. Placement, not geometry, is what controls that.
- **No top access.** Nothing connects the top platform to a roof, and there is no hatch. A
  fire escape that goes nowhere at the top is a common sight but a slightly odd model.
- **No balusters**, accepted above. If the owner wants it to read as properly built rather than
  improvised, that is where the 12 meshes go back.
- **The brackets and wall plates may be invisible** against a wall, since they are grey steel on
  what is probably a grey or buff wall. The plates exist to justify the brackets visually, but if
  the wall is the same colour they are 3 wasted meshes each.
- The platform floors are solid slabs, not grating. `platform-grate` is named for grating but
  models a solid plate. Either the name or the geometry should change; a solid floor is more
  practical since the player will stand on it.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured and confirmed inside the declared
  `dimensions`. z bounds confirmed as exactly 0.00 → 1.53, i.e. the wall plane is the origin.
- Ladder reach confirmed at each platform by raycast, and the top-rung shortfall recorded above.
- Lowest mesh confirmed at y = 0.10 (the ladder foot), matching the documented decision.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights (checked explicitly).
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game, and never seen against a wall.** Whether the silhouette
  works is the entire point of this asset and cannot be checked any other way.

## Licensing

Original work. No external assets, textures, or references used.
