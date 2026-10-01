# Avalanche Barrier — candidate review

Draft ID: `candidate-avalanche-barrier` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #36, "Port, mountain, and industrial areas"

## Purpose and intended placement

One 8 m bay of a roadside avalanche protection frame: three splayed steel legs on base plates, a
top rail, a W of diagonal bracing, timber snow-deflector boards hung on the uphill face, and a
snow drift built up behind it. Intended instanced along the uphill edge of a cold mountain pass
road, and useful on its own as a climbable road structure.

## Dimensions and scale

- Declared `dimensions`: 9.6 × 3.5 × 3.0 m
- Measured (vertex-accurate): 9.51 × 3.50 × 2.87 m (variant 0), 2.92 m deep (variants 1/2)
- Two 4 m bays, legs 3.4 m. **1.7 scout heights.** With the drift the frame sits about 2.9 m to the
  top of the boards, roughly a single-storey wall.

## Pivot and front direction

Ground at y = 0. **Z is the road direction** and **X is the uphill direction** — the drift and the
deflector boards are on the −Z face, the kick rail and the depth marker are on the +Z face.

This is the only candidate in the batch whose footprint is deliberately *deep* in Z (2.9 m for a
frame that is only 0.6 m of steel), because the snow load is half the reason the object exists. A
placement rotates with `rotationY` to line the frame across the road; no facing convention is
implied.

## Collider proposal

`center {0, 0.9, 0}`, `size {8.6, 1.8, 0.6}` — a low, full-width block across the frame line.

The collider is 1.8 m tall so a player cannot walk *through* the bracing at chest height, but it is
0.6 m deep, which is thinner than the drift. Above 1.8 m the player is free: the top rail, the
boards and the snow drift are all outside the collider and can be clipped. A taller collider would
be more correct physically and much worse to play against, so the thin version is the deliberate
choice.

## Interaction points

| id                 | label             | position   |
| ------------------ | ----------------- | ---------- |
| `avalanche-barrier`| Avalanche Barrier | 0, 0, 1.6 |

On the road side, clear of the collider. Reads as a maintenance or inspection point.

## Materials

| name                | colour    | roughness | metalness | notes                          |
| ------------------- | --------- | --------- | --------- | ------------------------------ |
| `avalanche-steel`   | `#54594d` | 0.85      | 0.3       | flat shaded, frame and fittings |
| `avalanche-timber`  | `#594332` | 1         | 0         | deflector boards, kick rail     |
| `avalanche-snow`    | `#c9c6b8` | 1         | 0         | drift, wedges, roof load       |
| `avalanche-rock`    | `#77796a` | 1         | 0         | exposed toe rock               |
| `avalanche-hazard`  | `#9b624d` | 0.9       | 0.1       | marker bands, delineator cap   |
| `avalanche-ice`     | `#8fa39a` | 0.4       | 0.05      | meltwater sheet at the toe     |

6 materials. `avalanche-ice` at 0.4 roughness is the only smooth surface, and it is a single flat
quad — the same restrained exception the glass row allows.

## Variants

| variant | frame | boards | drift |
| ------- | ----- | ------ | ----- |
| 0       | intact | level  | normal |
| 1       | **bay 0 damaged**: snapped leg, dropped rail, short diagonal, one board hanging | mixed | normal |
| 2       | damaged | mixed | **deep** |

The damage axis is a *partial* failure rather than a ruin: one bay of two loses its top rail, a leg
is snapped at the base, and the upper section leans off the frame. A fully destroyed barrier would
stop reading as a barrier at all.

## Complexity

45 meshes / 588 triangles (v0), 45 / 600 (v1 and v2). 6 materials.

The mesh count is identical across variants because the damage swaps geometry rather than adding
it, which is what keeps a repeatable prop repeatable.

## What reads well

- **Far:** the W of diagonal bracing. A regular zigzag across a horizontal rail is instantly
  readable as a structure meant to resist sideways load, which is exactly what it is.
- **Near:** the base plates and snow wedges behind each leg, the hung boards with their hangers,
  the kick rail, and the depth marker bands.

## Unresolved questions

- The drift is two rotated boxes. It reads as a snow wedge from the road, which is the only angle
  it will normally be seen from, but a player who walks uphill will find it is a box.
- The instancing story is untested. The module is written as a single 8 m bay so a placement can
  repeat it, but the drift and the ice sheet sit at the *end* of the bay, which means a repeated
  run will show a seam every 8 m. Either the drift needs to be per-run rather than per-bay, or the
  placement needs to hide the seam.
- No uphill anchoring. A real barrier is guyed or founded into the slope; here the legs just end at
  the drift.
- The broken leg's upper section leans to +X only, which reads as a specific collapse direction. It
  will not suit a road that runs the other way.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0. The legs, the snow wedges, the toe
  rock, the depth marker and the delineator were all individually re-seated after measurement put
  their lowest vertex below the ground.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  drift read as a plain slab and was given more pitch. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
