# Abandoned Farm Tractor — candidate review

Draft ID: `candidate-farm-tractor` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #51 (added in the post-fifty extension)

## Revision (owner feedback: floating disconnected parts, missing wheel, tilt)

- **The floating parts are gone.** The old exhaust pipes and centre stack stood 1 m behind the
  body with nothing under them, the canopy's rear posts stood in the air, the fenders, front
  weight and seat pan all hovered. Everything now connects: the exhaust stack and air intake root
  in the hood top, the canopy posts stand on the body, the fenders bracket across to the body
  sides, the seat rests on the body, and the grille reaches back to the radiator face.
- **The wreck pose is the default read.** Variants 0 and 2: the right front wheel is gone, the
  detached wheel lies flat on the ground beside the machine, and the hull pitches nose-down
  0.1 rad around the rear axle until a snapped axle beam - sloping from the left hub - rests its
  broken end on the dirt. The left front wheel is pre-lifted inside the hull so it lands exactly
  planted after the pitch. Variant 1 is the intact, level machine.
- Declared `dimensions` are now **3.2 x 2.6 x 4.2 m** (measured 2.95-3.19 x 2.60 x 4.14 m); the
  collider widened to 2.2 x 1.8 x 2.8 m. Validation note: a box-bounds check reports minY
  -0.038 on the wrecked variants; that is the conservative AABB corner of the tilted front tyre,
  not geometry - the tyre's lowest vertex is at -0.004 m, i.e. ground contact.


## Purpose and intended placement

A small utility tractor abandoned mid-field: stepped hood, grille, seat and steering wheel under a
flat canopy, one large rear wheel down, a small exhaust stack, and a front axle that has failed in
the most broken variant. Intended for farmsteads, rural ruin, or the edge of a compound as a
mid-scale obstacle and a "somebody worked here" marker.

## Dimensions and scale

- Declared `dimensions`: 3.2 × 2.6 × 4.2 m (revised; see the revision section above)
- Measured (vertex-accurate): 1.97 × 2.46 × 3.45 m (v0), 2.20 m wide (v1), 2.71 m wide (v2)
- Rear wheel 1.44 m across, canopy roof at 2.46 m, seat at 1.32 m. **1.2 scout heights to the
  canopy.** A 3.4 m long, 2.5 m tall machine is right for a small utility tractor.

## Pivot and front direction

Ground at y = 0, machine centred on x = 0, z = 0. **+Z is the front** — the grille, the front
weights and the failing front axle are all on +Z; the canopy and the seat are on −Z. The exhaust
leans toward the rear on variant 2, which is the only asymmetry besides the wheel.

## Collider proposal

`center {0, 0.9, 0}`, `size {1.7, 1.8, 2.6}` — the chassis, hood, seat and canopy posts.

1.8 m is chest height, so a player cannot walk through the machine but can stand at the seat. The
canopy roof and the canopy posts above 1.8 m are non-solid. The cost is a player clipping the
rear wheels, which are wider (0.72 radius) than the 1.7 m collider half-width.

## Interaction points

| id             | label       | position   |
| -------------- | ----------- | ---------- |
| `tractor-seat` | Tractor Seat | 0, 0, 0.5  |

At the side of the seat, clear of the collider. Reads as a start or salvage point.

## Materials

| name                  | colour    | roughness | metalness | notes                              |
| --------------------- | --------- | --------- | --------- | ---------------------------------- |
| `tractor-paint`       | `#58624d` | 0.92      | 0         | hood, fenders, canopy posts        |
| `tractor-paint-worn`  | `#74765c` | 1         | 0         | canopy roof, hood top, grille      |
| `tractor-steel`       | `#292f2b` | 0.88      | 0.25      | hubs, stack cap, seat frame, lights mount |
| `tractor-rim`         | `#a29b88` | 0.95      | 0         | wheel rims                         |
| `tractor-rubber`      | `#303832` | 1         | 0         | tyres                              |
| `tractor-rust`        | `#9b624d` | 1         | 0.1       | exhaust stack, fuel tank           |
| `tractor-timber`      | `#594332` | 1         | 0         | seat pan, backrest                 |
| `tractor-signal`      | `#d9b56e` | 0.8       | 0         | two headlamps                      |
| `tractor-glass`       | `#65766d` | 0.4       | 0.05      | one dropped lamp lens (v1, v2)     |

9 materials. The two greens are the faded field paint and they carry the whole read; the amber is
spent on two small lenses.

## Variants

| variant | front axle | exhaust | extra |
| ------- | ---------- | ------- | ----- |
| 0       | intact, level | straight | — |
| 1       | both front wheels **tilted 0.18 rad** | straight | one dropped lens on the ground |
| 2       | **left front wheel absent**, wheel lying beside it | **bent** | broken axle stub, dropped lens |

Variant 2 is the useful one: the missing wheel plus the wheel on the ground plus the bent stack is
the clearest "this has been derelict a long time" state, and it is the only variant that changes
the outline.

## Complexity

36 meshes / 904 triangles (v0), 41 / 1060 (v1), 39 / 976 (v2). 9 materials.

Four wheels at four meshes each is 16 meshes, a third of the total. That is not negotiable — the
wheel-to-body proportion *is* the tractor read.

## What reads well

- **Far:** one large dark wheel, a low green body, a flat canopy plate on four legs, and a thin
  stack. The canopy-on-four-legs shape is unmistakable and separates it from a car.
- **Near:** the stepped hood, the grille, the seat and backrest, the steering wheel on its column,
  the front weights, the two amber lamps, and the wheel hubs.

## Geometry note — grounded wheels

Wheels are placed by `groundCentre(radius, halfLength, tilt)`, the centre height that puts the
lowest point of a tilted horizontal cylinder on the ground. The first build set the centre to `y =
0`, which buried every wheel by its own radius (measured `minY = -0.72`). The same helper is used
for the detached wheel in variant 2, which is why it can lie on its side and still rest on the
ground.

## Unresolved questions

- No driver, no steering wheel motion, no glass in the canopy. The canopy is a solid plate.
- The hood is a stepped box. A real utility tractor has a rounded bonnet and a visible grille
  mesh; at game distance the step reads as bonnet, at 0.4 m it reads as a box.
- The steering wheel is a thin disc on a column, tilted 0.5 rad. It is the right idea and the
  wrong shape.
- There is no three-point linkage or rear implement. A bare tractor is a plausible abandonment
  state, but a hitch would make it more farm-specific.
- The canopy posts are square section and quite thick (0.09 m) — closer to a roll bar than to a
  ROPS frame.
- Variant 1 tilts both front wheels but the body does not dip to match, so the machine reads as
  sitting on canted wheels rather than as having settled.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  buried-wheel fault and the detached-wheel ground fault were both confirmed in the first build
  and confirmed fixed. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
