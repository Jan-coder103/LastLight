# Barricade Gate — approved asset review

Draft ID: `barricade-gate` · Category: `prop` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #48, "Loot, survival, and interaction props"

## Purpose and intended placement

One 3.7 m bay of a road gate: a heavy hinge post and a lighter latch post, a braced timber leaf
with a diagonal board, a chain-and-hasp, a control box with a conduit and a lever, and a sandbag
base. Intended as a road block on an access road, a checkpoint approach, or a compound entrance, and
reusable along a road edge.

## Dimensions and scale

- Declared `dimensions`: 5.0 × 2.3 × 3.6 m
- Measured (vertex-accurate): 5.00 × 2.24 × 1.75 m (variant 0, leaf shut), 5.00 × 2.24 × 3.56 m
  (variants 1 and 2, leaf swung 0.95 rad)
- Opening 3.7 m between posts, heavy post 2.0 m, leaf 1.3 m. **1.1 scout heights to the post cap.**
  3.7 m is one car wide, which is the right size for a single gate bay.

## Pivot and front direction

Ground at y = 0, opening centred on x = 0. **+Z is the direction the road runs**, and the leaf
swings toward +Z when open. The control box and the sandbags are on the −X (hinge) side, so a
placement that wants the operator's post visible puts −X toward the road.

The asset is strongly not centred on its own bounds in X (x −2.70 to 2.30) because the control
box, the sandbags and the raking brace all sit outboard of the hinge post.

## Collider proposal

`center {0, 0.7, 0}`, `size {3.7, 1.4, 0.5}` — a low block across the opening.

1.4 m is a car, not a player: the collider is meant to stop a vehicle, and a player walks under the
leaf rail or between the pickets because the collider stops short of the 1.3 m leaf top. That is
deliberate — a gate that blocks players is a wall — but it does mean a player can stand in the
opening when the gate is shut, which may or may not be what the placement wants.

## Interaction points

| id             | label            | position   |
| -------------- | ---------------- | ---------- |
| `gate-control` | Gate Control Box | −1.5, 0, 0.7 |

In front of the control box on the hinge post, clear of the collider. Reads as a latch or control
point.

## Materials

| name               | colour    | roughness | metalness | notes                              |
| ------------------ | --------- | --------- | --------- | ---------------------------------- |
| `gate-timber`      | `#594332` | 1         | 0         | heavy post, rails, braces, pickets  |
| `gate-pale-timber` | `#655744` | 1         | 0         | light post, pickets, counter-brace |
| `gate-steel`       | `#54594d` | 0.85      | 0.3       | straps, latch, hasp, keeper, box   |
| `gate-rust`        | `#8e5142` | 0.95      | 0.15      | control box, post cap, brace foot  |
| `gate-dark`        | `#292f2b` | 0.9       | 0.25      | pins, chain links, ring, diagonal  |
| `gate-hazard`      | `#d9b56e` | 0.75      | 0.05      | leaf flash, indicator, label       |
| `gate-sandbag`     | `#7d7358` | 1         | 0         | sandbag base, kerb strip           |

7 materials. `gate-hazard` is the amber signal and appears in three places, all small: the leaf
flash, the control box indicator and the label plate.

## Variants

| variant | leaf | damage |
| ------- | ---- | ------ |
| 0       | **shut** | none |
| 1       | open 0.95 rad | none |
| 2       | open 0.95 rad | **top rail cut back**, one picket stubbed, splinter, offcut on the deck |

Variant 0 is the road-block state and the only one that shows the closed leaf. Variant 2's cut top
rail is a different object rather than a shorter version of the same one, which is the difference
between "damaged" and "smaller".

## Complexity

45 meshes / 792 triangles, identical in all three variants. 7 materials.

The mesh count does not change between variants because the cut-rail variant *swaps* the top rail
for a stub and splinter rather than adding to it. That is the right way to do damage on a
repeatable prop.

## What reads well

- **Far:** two posts with a braced leaf between them, the heavy post capped with a pyramid. The
  asymmetry of the two post caps is what makes it read as a gate rather than as a fence panel.
- **Near:** the two hinge straps and pins, the diagonal brace and its welded patch plate, the
  picket heads, the chain links and ring, the control box with its lever and indicator, and the
  sandbag stack.

## Rework after the first preview

The first build had four faults, all visible in the render:

- **The bay was 5.2 m wide** and read as a fence run, not a gate. It is now 3.7 m, one car.
- **The diagonal brace was a thin cylinder** and read as a third horizontal rail — the one thing a
  gate brace must not be. It is now a flat 0.16 m board, and the second full diagonal was cut to a
  short counter-brace at the hinge end.
- **The chain was parented to the root group**, so when the leaf swung open the chain stayed put and
  stretched 1.7 m past the gate. The ring and all three links are now children of the leaf pivot.
- The leaf had no mid rail and four thin pickets, so it read as a ladder. It now has a mid rail and
  four wider pickets with proper heads.

## Geometry note

The raking post brace, the counter-brace, the leaf brace and the hinge-side members are cylinders
placed by `spanTo()`. A cylinder's axis is +Y; setting `rotation.x` and `rotation.z` together with
the default XYZ Euler order does not aim it at a target.

## Unresolved questions

- The leaf has no drop bolt or ground staple, so it is held by the chain alone. A dropped bolt
  would be the honest way a temporary road gate is secured and is one mesh.
- The control box is decorative. It has a lever and a conduit, and nothing on the other side of
  the conduit.
- The sandbag base is three flattened boxes and is the least convincing element on the prop; a sand
  bag is a rounded sack and this is a brick.
- The raking brace foot sits on a `gate-sandbag` block, which is the wrong material for a ground
  pad. It was a reuse, not a decision.
- The tyre-worn patches on the road are flat rectangles and will read as mats on flat ground.
- Variant 2's splinter is a cone standing on end where the rail was cut. It reads as debris, which
  is the intent, but it is not attached to anything.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. All four
  faults above were confirmed visible in the first build and confirmed fixed in this one. Not
  viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
