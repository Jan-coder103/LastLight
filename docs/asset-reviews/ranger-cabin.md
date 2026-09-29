# Forest Ranger Cabin — approved asset review

Draft ID: `ranger-cabin` · Category: `building` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #11, "Forest and rural"

## Revision (owner feedback: floating above ground, porch too small for a person)

- **Floating:** the old 0.44 m footing course topped out 11 cm below the wall bases, leaving a
  daylight slit under the walls that read as the cabin hovering over its own foundation. The
  footing is now 0.7 m tall, so the wall bases (0.55 m) and the floor slab (0.52 m) sit inside
  it with no gap.
- **Porch:** the old porch roof swept at 2.3-2.55 m - below the 2.1 m scout's head once the
  0.34 m deck was underfoot. The deck is now 6.4 x 2.2 m (was 5.9 x 1.5) and the roof sits at
  2.78-3.5 m: **2.44 m of headroom over the boards**, a full scout plus a hat. A second step
  down to the ground was added and the rail respanned between the moved posts. The door
  interaction point moved to (0, 0, 2.6), on the deck in front of the open door.
- Declared `dimensions`: **6.6 x 5.0 x 6.4 m** (measured 6.60 x 4.85 x 6.38 m). Collider,
  materials, and the open-doorway geometry are unchanged.


## Purpose and intended placement

A small timber cabin with a covered porch, boarded windows, and **one usable entrance**. Intended
for forest edges, remote clearings, and rural compounds — the kind of building that sits between
the city's dense blocks and open wilderness.

## The "usable entrance" is a real opening

The idea says "one usable entrance", and that phrase is the reason this candidate is more than a
box with a door painted on it.

The walls are built as a **shell**: a floor, a back wall, two side walls, and a front wall
assembled from two piers and a lintel around a 1.1 × 2.1 m doorway. Nothing spans the gap. The
only thing behind it is a single dark panel on the inside of the back wall, 3.2 m away.

Verified by raycasting in from the porch:

| ray                              | first hit           | z     |
| -------------------------------- | ------------------- | ----- |
| through the doorway, y = 1.5     | `interior-dark`     | -1.54 |
| through the lintel, y = 3.0      | `log-pine` (lintel) | 1.80  |
| through the left pier, x = -1.65 | `log-pine` (pier)   | 1.80  |

The doorway ray reaches 3.24 m into the cabin before hitting anything, and the rays either side of
it stop dead at the wall face. That is a hole in a wall with a room behind it, which is what makes
the entrance usable rather than decorative.

**What it is not:** there is no modelled interior. The dark panel is a single box. If the player
eventually gets enterable interiors, this is a candidate that would need revisiting — the opening
is right, the room behind it is not.

The door itself is a real hinged group at x = +0.55 rotated 2.0 rad, standing out onto the porch.

## Dimensions and scale

- Declared `dimensions`: 6.2 × 5.0 × 5.5 m
- Measured: 6.06 × 4.85 × 5.36 m, identical across all variants
- 5.5 m of wall width, 3.4 m deep, 3.95 m to the eaves, 4.4 m to the ridge, 4.85 m to the chimney
  cap. **Roughly 2.3 scout heights to the ridge** — a small single-storey cabin with a loft.
- The 5.36 m depth is mostly the 1.5 m porch plus its 1.7 m roof. The cabin itself is 3.4 m deep.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the porch side**, with the door, the two boarded
front windows, the porch, and the front gable all on that face. This is the clearest "front" in
the batch and a placement's `rotationY` should point it at a path or a clearing.

## Collider proposal

`center {0, 1.9, z: 0}`, `size {5.5, 3.8, 3.4}` — the cabin body only.

**The porch deck and porch roof are deliberately non-solid.** That is the point of a porch: the
player can walk onto the deck (a 0.34 m step) and stand under the 2.5 m porch roof. A collider
covering the whole footprint including the porch would block the one thing the porch is for. A
colder, more conservative reading would put the player on flat ground in front of the steps.

## Interaction points

| id           | label      | position  |
| ------------ | ---------- | --------- |
| `front-door` | Cabin Door | 0, 0, 3.4 |

On the porch in front of the open door, clear of the collider. The only interaction point, and it
matches the idea's "one usable entrance" exactly.

## Materials

| name            | colour    | roughness | metalness | notes                                 |
| --------------- | --------- | --------- | --------- | ------------------------------------- |
| `log-pine`      | `#655744` | 1         | 0         | variant 0                             |
| `log-brown`     | `#594332` | 1         | 0         | variant 1                             |
| `log-dark`      | `#514437` | 1         | 0         | variant 2                             |
| `roof-slate`    | `#514f49` | 0.95      | 0         | flat, roof and porch roof             |
| `timber-board`  | `#8b887d` | 1         | 0         | door panel, window boarding           |
| `interior-dark` | `#2a251f` | 1         | 0         | interior panel, floor, window backing |
| `stone-base`    | `#797762` | 1         | 0         | footing course and chimney            |
| `window-glass`  | `#65766d` | 0.35      | 0.05      | the one unboarded window              |

6 live materials per variant, all from the established palette. `window-glass` was previously
created inside `createVisual`, which meant every placement allocated a fresh material; it is now
at module level like every other candidate's.

## Correction: the single-box collider blocks this opening

Found while reviewing later candidates, and it applies here.

The collider above is one box covering the whole building, so **it covers the doorway too**. The
entrance is geometrically open — the raycast above proves that — but the player cannot walk through
it. Anyone who reads "one usable entrance" as "the player can use this entrance" will be misled by
the model as it stands.

This is not a modelling mistake; it is what one box means. The same issue applies to
`candidate-sawmill` (its 5 m loading bay) and `candidate-barn-shell` (its sliding door gap). Three
candidates now have a visually open entrance that the collider seals, which is the strongest
single argument in this batch for either multiple-box colliders or a doorway concept the placement
system can subtract.

Until that exists, the honest description is: **a cabin with a real, visible open doorway that the
player is blocked by.** The value here is the opening and the 3.2 m of interior depth behind it,
not a walkable entrance.

## Log courses instead of logs

The log-cabin read comes from **six thin bands** (three per side) standing 3 cm proud of the walls,
not from modelled round logs. Six boxes give the read; round logs would be six cylinders at
24+ triangles each and would look identical from any distance this asset is seen at.

## Gable ends

Real triangular prisms via a small `BufferGeometry` helper, 9 triangles each, with `flatShading`
on the shared wall material. **This is the second copy of that helper** (`candidate-row-house.ts`
has the first). If idea 19 (barn shell) or 11's sibling 11/20 also want gables, it should be lifted
into a shared module rather than copied a third time. The cabin deliberately did not get a
mono-pitch roof specifically to avoid needing a third copy.

## Roof sign note

The roof slabs are rotated by `-side * SLOPE`. A rotation about Z by a negative angle drops the +X
end, so the +X slope takes the negative value. **Getting this sign wrong produces a valley**, which
is exactly the bug the tent had twice. The comment in the code says so.

## Complexity

38 meshes, ~448 triangles, 6 materials. Mid-range for the batch: heavier than the row house because
of the porch, the log courses, and the shell walls.

## What reads well

- **Far:** the pitched roof with the front gable, the chimney, and the porch roof line. Against a
  treeline the gable is the read.
- **Near:** the open door with its dark interior, the boarded windows, the log courses, the door
  handle, the stone footing.

## Variants

| variant | timber          |
| ------- | --------------- |
| 0       | pine `#655744`  |
| 1       | brown `#594332` |
| 2       | dark `#514437`  |

Timber tone only. **The damage is identical in all three** — same boarded windows, same open door,
same broken pane. Following the row house precedent: an asset scattered through a forest should be
predictable, and "abandoned ranger cabin" is this asset's identity rather than a variant axis.

There is no intact cabin variant, so there is currently no way to place one that someone still
lives in.

## Complexity note on the porch

The porch is 6 meshes (deck, roof, 2 posts, rail) plus the door. It is the single largest
sub-assembly after the walls, and it is what makes this read as a _cabin_ rather than a shed. If
the budget ever needs cutting, the porch rail is the cheapest thing here.

## Unresolved questions

- **The interior is a single dark panel**, not a room. The opening is right; the space behind it
  is not modelled. Fine for an exterior asset, wrong if interiors are ever needed.
- **The porch is not solid**, so the player stands on the deck but nothing stops them walking
  through the porch posts or rail. Consistent with the transit shelter decision, and the same
  multiple-boxes caveat applies.
- Only 3 variants, all differing in wood tone, and no intact state.
- No woodpile, no stacked supplies under the porch, no lantern by the door, no path leading away.
  A woodpile would pair naturally with `candidate-timber-stacks`.
- The stone footing course is a plain band; there is no chimney breast, no stove pipe, and no
  smoke, so the chimney reads as decorative. The fire bin has static flame and ember geometry —
  a chimney with a little smoke geometry would tie the two together.
- One window is glazed, three are boarded. Which window is which is fixed across all variants.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- Doorway opening, lintel, and pier confirmed by raycast, as quoted above.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_, which
  is what caught the `window-glass` allocation.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.**

## Licensing

Original work. No external assets, textures, or references used.
