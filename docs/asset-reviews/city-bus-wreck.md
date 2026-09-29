# City Bus Wreck — asset review

Asset ID: `city-bus-wreck` · Category: `prop` · Status: **Approved by owner**
Source idea: `ASSET_IDEAS.txt` #07, "City and suburbs"

## Purpose and intended placement

A damaged but still readable bus shell, meant to work as a large street obstacle or as a district
landmark. The idea's key phrase is "readable", and that drove the whole model: the priority is
that a player can identify it as a bus at a glance, not that it looks accurately crashed.

Expected along derelict streets, at the edge of a car park, or blocking a road junction.

## The three-band silhouette is the entire design

A bus is identified from 50 m away by one thing: a long box with a **continuous dark horizontal
band at window height**, wheels under it, and a flat roof. That is three boxes:

| band        | y range     | material      |
| ----------- | ----------- | ------------- |
| lower body  | 0.87 – 2.37 | `bus-paint-*` |
| window band | 2.37 – 2.99 | `window-band` |
| roof        | 2.99 – 3.15 | `bus-paint-*` |

The band is **inset 0.05 m on each side** (2.45 m wide against a 2.55 m body). That single
number is what makes it read as a recessed glazing band at the shoulder line rather than a
painted stripe. Verified by raycast: the band face is at x = 1.23 while the body is at x = 1.28.

Everything else in the model is secondary to that read.

## Dimensions and scale

- Declared `dimensions`: 3.3 × 3.9 × 12.2 m
- Measured: 3.24 × 3.81 × 12.13 m, identical across all variants
- 12 m long and 3.15 m to the roof: a standard single-deck bus, and about 1.5 scout heights
  tall. It is the largest prop in this batch apart from the bridge.
- **The x extent (3.24 m) is much wider than the 2.55 m body**, because the kerb-side door hangs
  open and sticks out 0.6 m, and the wheels add 0.17 m each side. See the collider section for why
  that asymmetry is acceptable here.
- y reaches 3.81 m because of the peeled roof panel, not the bus itself.

## Pivot and front direction

Ground at y = 0, but note the **body sits high**: the floor is at 0.87 m and the wheel centres at
0.52 m. **+Z is the front** — windscreen, destination panel, bumper, headlamps, and the missing
wheel all mark it.

## Collider proposal

`center {0, 1.6, 0}`, `size {2.6, 3.2, 12.0}` — the body only, deliberately excluding the open
door.

**This is the one candidate in the batch where a bounding box is genuinely the right shape.** A
bus is a solid, convex-ish vehicle, so a box is an accurate collision volume and there is nothing
to improve. Excluding the open door keeps a 0.6 m visual overhang out of the collision volume,
which is right: the player can walk past an open bus door, they should not be blocked by it.

Worth contrasting with the parking ramp (#05) and the bridge (#06), where the same box collider
is a genuine compromise.

## Interaction points

| id           | label    | position     |
| ------------ | -------- | ------------ |
| `front-door` | Bus Door | 1.85, 0, 2.6 |

On the kerb side beside the open door, outside the collider. Reads as a searchable or boardable
bus.

## Materials

| name                    | colour    | roughness | metalness | notes                     |
| ----------------------- | --------- | --------- | --------- | ------------------------- |
| `bus-paint-faded-red`   | `#9b624d` | 0.9       | 0         | variant 0                 |
| `bus-paint-faded-teal`  | `#526e70` | 0.9       | 0         | variant 1                 |
| `bus-paint-faded-olive` | `#77796a` | 0.9       | 0         | variant 2                 |
| `window-band`           | `#444943` | 0.4       | 0.1       | the continuous band       |
| `trim-dark`             | `#444943` | 0.9       | 0         | underbody, beacon housing |
| `window-glass`          | `#65766d` | 0.3       | 0.05      | windscreen, lamps, door   |
| `wheel-tyre`            | `#2b2724` | 1         | 0         | three wheels              |
| `wheel-hub`             | `#54594d` | 0.8       | 0.2       | exposed bare hub          |
| `body-metal`            | `#64675d` | 0.8       | 0.25      | bumper, torn front        |
| `sign-dim`              | `#c5ad70` | 0.7       | 0         | emissive `#4a3c1c` @ 0.3  |
| `tail-lens`             | `#8e5142` | 0.5       | 0         | emissive `#3a1f18` @ 0.25 |

8 live materials per variant.

`window-band` and `trim-dark` share the hex `#444943` and differ only in roughness (0.4 vs 0.9).
The band is slightly glossier so it catches light and separates from the matt underbody, which is
what makes the band read at distance. Deliberate, and noted here because two names on one hex will
look like a mistake to a reader.

Both emissive materials are dim (0.25–0.3) and use dark emissive tints. The destination sign and
tail lenses should read as _present but dead_, not as lit. There is **no real light** on this
asset, unlike the street light.

## Variants

| variant | paint                 |
| ------- | --------------------- |
| 0       | faded red `#9b624d`   |
| 1       | faded teal `#526e70`  |
| 2       | faded olive `#77796a` |

Paint only. Geometry is identical in all three, so the 12 m footprint is predictable for street
placement. A bus is the sort of thing a world generator will want to place in a chosen colour, so
keeping colour as the only variant axis is the useful choice here.

## Damage

- **One wheel off the front left**, replaced by an exposed hub, so the bus sits lopsided and
  reads as a wreck rather than a parked vehicle. Three 12-sided wheels and one hub stub.
- **Kerb-side door open on a real hinge.** A group at the hinge line (x = 1.32, z = 2.05) rotated
  0.6 rad, with the panel and its glass as children. Verified: the door group spans x 1.29 to
  1.92, so it genuinely protrudes past the body side at 1.28.
- **A panel peeled up off the front of the roof**, and a torn section hanging off the front edge.
- One headlamp lens and the windscreen glass, both dark.

No crumpled front bodywork. An earlier draft had a 0.9 rad door swing, which pushed the bounding
box out to 3.45 m on one side; halving it to 0.6 rad keeps the door visibly ajar while keeping the
placement bounds closer to the vehicle's real 2.55 m width.

## Complexity

29 meshes, ~484 triangles, 8 live materials. The heaviest of the new five after the fire escape,
which is fair for a 12 m landmark, and still under half the crashed car's triangle count for half
the length. Triangle cost is dominated by the three 12-sided wheels (~44 each) and the ten window
pillars.

The pillars are 8 meshes (4 per side) dividing the band into five bays. Ten windows would have been
more accurate and ten meshes more expensive; five bays is the point where it stops reading as a
solid stripe.

## What reads well

- **Far:** the band. Genuinely — a 12 m bus with a continuous dark window band is unmistakable.
  The peeled roof panel breaks the top edge so it does not read as a clean parked bus.
- **Near:** the missing wheel, the open door, the door glass, the torn front, the dim destination
  sign.

## Unresolved questions

- **Category is `prop`, not `landmark`.** The idea says "large obstacle or landmark", and 12 m of
  bus is arguably a landmark. Left as `prop` on the grounds that it is a vehicle, but this is a
  one-word change if the owner disagrees.
- **Only paint varies.** A world generator placing 12 m buses will want more states: doors closed,
  on its wheels, a double-decker, or a bus with its front sheared off. The "intact bus" is notably
  missing, which means there is currently no way to place a bus that is not a wreck.
- **No interior.** The window band is a solid dark box, so looking through a window shows nothing.
  Given the roof and lower body are also solid, there is no interior and no way in. For a
  "searchable" door interaction point that is a real gap.
- **No route number, no destination text, no advertising panels.** A bus's flanks are where its
  character lives, and they are currently bare. That is a texture/geometry question the owner may
  want to revisit if buses become a recurring city element.
- The open door sticks out on the +X side only, so the asset's bounds are asymmetric (1.92 vs
  1.32). Acceptable for a wreck, but it means the placement centre is not the vehicle centre.
- The wheels are 12-sided and sit 0.018 m above the ground because a 12-gon does not reach its
  true radius at any vertex. Negligible, but it is why the tyres do not quite touch.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured and confirmed inside the declared
  `dimensions`; `minY` 0.
- Window band recess, window pillars, and the open door confirmed by raycast and by measuring the
  door group's world bounds.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights (checked explicitly).
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** The three-band read is a visual claim and cannot be
  confirmed from bounding boxes.

## Licensing

Original work. No external assets, textures, or references used.
