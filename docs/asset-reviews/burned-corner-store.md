# Burned Corner Store — asset review

Asset ID: `burned-corner-store` · Category: `building` · Status: **Approved by owner**
Source idea: `ASSET_IDEAS.txt` #02, "City and suburbs"

## Purpose and intended placement

A compact shop shell on a street corner: faded awning, cracked display windows, a blocked side
entrance, and a collapsed roof corner that says it burned. Suited to suburban high streets and
small commercial strips, where it fills the gap between the 21 m city shell and small loot props.

## Dimensions and scale

- Declared `dimensions`: 10.8 × 6.1 × 8.4 m
- Measured: 10.72 × 6.00 × 8.28 m (variants 0/1), 10.72 × 6.00 × 8.34 m (variant 2)
- The main mass is 7.8 × 4.8 × 6.8 m; a 2.2 × 4.4 × 4.0 m return wing makes the corner. The
  height is a single-storey shop, so 4.8 m is 2.3 scout heights — deliberately much lower than
  the two-storey row house (#01) so the two do not read as the same class of building.
- **The z extent is mostly the awning**, which overhangs 1.3 m past the front wall. The building
  itself is 6.8 m deep.

## Pivot and front direction

Ground at y = 0. **+Z is the shopfront** (awning, fascia, display window, door); the **boarded
side entrance is on +X**, on the outer face of the return wing.

**The bounding box is centred on the origin, so the L is deliberately off-centre:** the main mass
is centred at x = -1.1 and the wing at x = 3.9, giving x -5.0..5.0. That keeps placement
predictable (the asset's centre is its middle) at the cost of the shopfront sitting left of
origin. If the owner prefers the shopfront on x = 0 instead, that is a one-line change to
`MAIN_X` plus a shift to the interaction point.

## Collider proposal

`center {0, 2.85, 0}`, `size {10, 5.7, 6.8}`.

**Known limitation: one box cannot describe an L.** This blocks the inner corner behind the
shopfront solid even though it is open ground. It is the same class of problem as the parking
ramp's sloped collider (#05), and both are noted for the owner. If the runtime ever accepts
multiple boxes, this splits cleanly into the main mass (7.8 × 5.7 × 6.8 at x = -1.1) and the
wing (2.2 × 4.4 × 4.0 at x = 3.9).

## Interaction points

| id          | label     | position     |
| ----------- | --------- | ------------ |
| `shop-door` | Shop Door | 0.4, 0, 3.85 |

On the front step, clear of the collider. **The blocked side entrance deliberately has no
interaction point** — it is boarded and piled with rubble, so offering an interaction there would
be a lie. If the owner wants a rubble-clearing interaction later, that is the hook for it.

## Materials

| name                  | colour    | roughness | metalness | notes                     |
| --------------------- | --------- | --------- | --------- | ------------------------- |
| `wall-render`         | `#8b887d` | 1         | 0         | main mass, roof, parapet  |
| `fascia-faded-red`    | `#9b624d` | 0.95      | 0         | variant 0                 |
| `fascia-faded-olive`  | `#58624d` | 0.95      | 0         | variant 1                 |
| `fascia-faded-teal`   | `#526e70` | 0.95      | 0         | variant 2                 |
| `awning-canvas`       | `#77796a` | 1         | 0         | variant 0, flat           |
| `awning-canvas-olive` | `#74765c` | 1         | 0         | variant 1, flat           |
| `awning-canvas-faded` | `#7b7566` | 1         | 0         | variant 2, flat           |
| `shop-interior`       | `#2b2724` | 1         | 0         | behind glass and door     |
| `soot`                | `#3a3630` | 1         | 0         | ceiling hole, wall streak |
| `window-glass`        | `#65766d` | 0.3       | 0.06      | display panes and shard   |
| `trim-stone`          | `#aaa18f` | 1         | 0         | window frame, door frame  |
| `timber-board`        | `#655744` | 1         | 0         | side-door boarding        |
| `metal-frame`         | `#64675d` | 0.8       | 0.25      | awning struts             |
| `rubble-concrete`     | `#797762` | 1         | 0         | fallen parapet, doorway   |

8 live materials per variant. The three dark surfaces (`shop-interior`, `soot`, `reveal`-class
values) are kept off pure black per the style guide.

## Variants

| variant | fascia                | awning    | awning state                                                            |
| ------- | --------------------- | --------- | ----------------------------------------------------------------------- |
| 0       | faded red `#9b624d`   | `#77796a` | intact                                                                  |
| 1       | faded olive `#58624d` | `#74765c` | intact                                                                  |
| 2       | faded teal `#526e70`  | `#7b7566` | **collapsed**: left strut missing, valance short, awning tilted 0.1 rad |

Variant 2 is the only one that changes the mesh count (38 instead of 39) and it is the only
variant that grows the bounding box (z 8.34 vs 8.28, because the tilted awning swings further
out). The declared `dimensions` cover all three.

## Fire damage: what actually carries the read

Three things, in order of importance:

1. **The collapsed front-left roof corner.** The -X parapet survives only at the rear; the front
   half is gone, exposing three joist ends, with a `soot` ceiling panel behind them and the
   fallen parapet chunk lying on the roof at a 1.15 rad roll.
2. **The soot streak** climbing the -X wall under the collapse. This is the single cheapest thing
   in the model that says "this place burned", and it works from the angled camera.
3. **The boarded side entrance** with its rubble pile.

## The display window is a real reveal

Sill, head, and two jambs stand 0.22 m proud of the wall; the glass sits behind them. One pane is
missing. Verified by raycasting at the shopfront:

| ray                       | first hit       | z     |
| ------------------------- | --------------- | ----- |
| x = -2.5 (intact pane)    | `window-glass`  | 3.505 |
| x = -1.0 (missing pane)   | `shop-interior` | 3.450 |
| x = -2.5, y = 0.63 (sill) | `trim-stone`    | 3.670 |
| x = 0.4 (door centreline) | `timber-board`  | 3.460 |
| x = -0.22 (door jamb)     | `trim-stone`    | 3.650 |

The missing-pane ray reaches the dark interior with no glass in front of it, which is the broken
window. The door sits 0.19 m behind its frame, matching the row house (#01) exactly.

## Complexity

38–39 meshes, ~456–468 triangles, 8 live materials. Heaviest of the new five, which is fair for
the most geometry the brief asks for, and still a third of the crashed car's triangle count.

## What reads well

- **Far:** the L silhouette with the low return wing, and the awning's horizontal band — the
  awning is what distinguishes a shop from a shed at distance.
- **Near:** the missing pane and shard, the boarding on the side door, the rubble, the exposed
  joists, the soot streak.

## Unresolved questions

- **The L collider blocks open ground.** See above. Needs an owner call on multiple-box colliders.
- **Awning variants are the only variation.** The fire damage is constant. If a street needs a
  mix of intact and burned shops, that is a variant axis worth adding (a fourth "still standing,
  unburned" state).
- The awning is opaque canvas. Real shop awnings are often striped or faded to near-white; three
  muted tones may be too subtle to notice between variants. Worth a look in the viewer.
- `soot` and `shop-interior` are close in value (`#3a3630` vs `#2b2724`). They may read as one
  flat dark mass rather than soot versus interior. Deliberately restrained, but worth confirming
  it is legible.
- The side entrance is boarded but has no opening behind it, so it is a panel on a wall. That is
  correct for "blocked", but it is not a doorway you can see into.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured and confirmed inside the declared
  `dimensions`; `minY` 0.
- Display window reveal, missing pane, door reveal, and boarded side entrance all confirmed by
  raycast, as quoted above.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.**

## Licensing

Original work. No external assets, textures, or references used.
