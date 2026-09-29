# Wind Pump — asset review

Asset ID: `wind-pump` · Category: `prop` · Status: **Approved by owner**
Source idea: `ASSET_IDEAS.txt` #20, "Forest and rural"

## Purpose and intended placement

A compact old farm water pump: a multi-blade wheel on a lattice mast, a tail vane, and a water
tank beside the frame fed by a pipe run. Expected on a farmstead, beside a field, or at a rural
water point.

## Rework (owner request: "somewhat broken")

The first draft had real construction faults, all visible in the viewer:

- **The rotor floated.** The hub sat at 5.15 m above a frame that ended at 4.6 m with no plate,
  bearing, or axle between them — the wheel and vane hovered in the air.
- **The frame skewered the tank.** The tank sat inside the frame footprint, so the lowest brace
  level (half-width 0.77 m at y = 1.3) passed through the tank wall (radius 0.8–0.85 m), and the
  legs landed in its rim.
- **The tail vane was a floating plate** on two thin stays, oversized relative to the wheel.
- **The "pump head" was a detached red box** standing at the tank base with no pump above it.

The rework rebuilds the head and the base so the pump is one machine:

- The frame closes to a **head plate at 5.0 m** that carries a **bearing block and axle**; the
  hub mounts on the axle at 5.42 m. Nothing floats.
- The **tank moved beside the frame** (centre z = 1.55): timber body with two hoops, an open top
  with dark water, a rim, and its lid leaning on the ground next to it.
- A **pipe run** drops from the pump head down the mast, elbows, and spouts over the tank rim —
  the tank is now fed by the pump instead of decorating its base.
- The **tail is a proper tail frame**: two rods back to a cross-braced vane.
- Each **blade sits in a pivot group with 0.38 rad of pitch**, and a low-segment **torus rim
  band** closes the wheel, which is what makes it read as a wheel rather than a spoke star.

## Revision: the mast was upside down and the top floated (owner feedback: "a little

disconnected")

The first rework's own numbers were checked, but the leg lean was not: the four legs were rotated
with the signs **negated**, so instead of narrowing from 1.05 m at grade to 0.42 m at the head,
they narrowed from 0.42 m at grade and splayed OUTWARD to 1.05 m at the top — the taper geometry
was upside down along with them. Consequences, all visible:

- The **head plate (half-width 0.48) never reached the leg tops (at ±1.05)** — the plate, bearing,
  axle, rotor, and tail hovered a clear hand-width above the frame. This was the disconnection.
- The **brace rings follow `halfAt(y)`** (the intended leg line), so with the legs splayed the
  rings ended mid-air: past the legs at y = 1.5, half a metre short of them at y = 4.75.

The lean signs are corrected (`+sx` about Z, `-sz` about X, so each top moves inboard), and the
rings now land on the legs by construction. Also fixed in the same pass:

- **Foot pads** under all four legs (the old sheet's own suggestion), so the legs meet the ground
  on something.
- The **tail rods now bolt into the hub disc** (front ends embedded in it) instead of starting in
  the air behind the bearing.
- The **pipe run was clipping the tank**: the horizontal run crossed the rim 1.5 cm below its top
  and the spout pierced the tank wall below the rim. The run now crosses 10 cm above the rim and
  the spout angles down inside it, discharging over the water surface.
- The **tank hoops** were buried inside the staves (a single radius against a tapering body); each
  hoop now takes its own radius just proud of the wall at its height.
- The axle was lengthened so it is seated in the bearing block at the back and the hub at the
  front rather than kissing both.

Measured (vertex-accurate): **2.69 × 6.74 × 3.77 m**. Declared `dimensions` corrected to
3.0 × 6.9 × **4.7** — the footprint is asymmetric about the pivot (tank out to z = 2.33 behind
the frame at z = 0), and the old z of 3.9 had cut the tank off.

**Previewed in WebGL renders** (headless Chromium, three-quarter view beside the scout): the
frame closes onto the head plate, the wheel and tail sit on the mast, and the pipe clears the
rim.

## Dimensions and scale

- Declared `dimensions`: 3.0 × 6.9 × 4.7 m (see the revision above for the z correction)
- Measured (vertex-accurate): 2.69 × 6.74 × 3.77 m (variants 0/1), 3.43 m deep (variant 2); the
  z bounds are asymmetric about the pivot — the frame stands at z = 0 and the tank behind it
- Wheel diameter 2.7 m, hub at 5.42 m. **3.2 scout heights.**

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the direction the rotor faces**, i.e. into the
wind. A placement's `rotationY` is the meaningful control on this asset. Verified by transform
arithmetic: the wheel plane sits at z = +0.45 and the vane behind at z ≈ −1.4.

## Collider proposal

`center {0, 0.75, 1.55}`, `size {1.6, 1.5, 1.6}` — the water tank only.

**The player can walk under the frame.** That is deliberate and it is the point: the frame is
open lattice and the wheel is overhead. The cost is the same accepted one as the fire escape and
the burned trees: a player can clip a leg or a blade.

## Interaction points

| id              | label     | position  |
| --------------- | --------- | --------- |
| `windpump-base` | Wind Pump | 0, 0, 2.5 |

Beside the tank, just outside the collider. Reads as a water-collection or pump-action point.

## Materials

| name          | colour    | roughness | metalness | notes                       |
| ------------- | --------- | --------- | --------- | --------------------------- |
| `pump-frame`  | `#59635b` | 0.85      | 0.25      | flat shaded, mast and pipes |
| `blade-metal` | `#54594d` | 0.8       | 0.2       | flat shaded, slats and rim  |
| `rust-metal`  | `#8e5142` | 0.9       | 0.15      | vane and pump head          |
| `tank-timber` | `#655744` | 1         | 0         | tank body, rim, lid         |
| `hub-metal`   | `#64675d` | 0.8       | 0.25      | hub, axle, tank hoops       |
| `tank-water`  | `#3d4a44` | 0.4       | 0         | the water surface           |

6 live materials per variant. All metal is 0.15–0.25 metalness. The water is the only smoother
surface (0.4), the same restrained exception the glass row allows. `rust-metal` remains the only
warm colour, confined to the vane and pump head.

## Variants

| variant | blades | tail vane   |
| ------- | ------ | ----------- |
| 0       | 12     | present     |
| 1       | **8**  | present     |
| 2       | 12     | **removed** |

Unchanged from the first draft and still the right axis: a rotor with gaps or a missing vane
reads as a stripped pump from any distance. Blade count verified by measurement: 12 in variant
0, 8 in variant 1.

## Complexity

52 meshes / ~1064 triangles (v0), 48 / ~532 (v1), ~47 / ~524 (v2). Still 6 live materials — the
foot pads and hoop corrections reuse the existing frame and hub materials.

Higher than the first rework (48) because of the four foot pads and the reseated pipe run. If
trimming is ever needed, the three brace levels can drop to two (−4 meshes) without hurting the
silhouette.

## What reads well

- **Far:** the wheel — a 2.7 m rimmed, multi-blade disc on a splayed mast is unmistakable.
- **Near:** the pitched slats, the tank with hoops and open water, the pipe and spout, the
  cross-braced vane.

## Unresolved questions

- **The rotor does not turn** — no animation is allowed in `createVisual` and there is no update
  hook. The wheel is 12 pivot groups + a hub and rim that would rotate as one if the game ever
  gains a rotation hook. A frozen rotor is the asset's main limitation.
- The pump mechanism is indicative: a head box and a pipe, not a modelled gearbox.
- The tank is open; in winter maps an open water surface may read oddly.
- Nothing anchors the legs to the ground (no foot pads). At 0.09 m leg radius they read fine at
  play distance, but pads would ground them for 4 meshes.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built and rendered in headless Chromium with the project's three.js;
  vertex-accurate bounds measured (world-space vertices) and confirmed inside the declared
  `dimensions`; `minY` exactly 0.
- **Leg lean signs verified by trigonometry against `halfAt()`**: the corrected tops land within
  0.01 m of the brace-ring plane, and the head plate overlaps the leg tops.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` positions.
- **Previewed in WebGL renders** (headless Chromium, three-quarter view, variants 0 and 2): the
  floating head and splayed legs of the previous build were confirmed by arithmetic, and the
  corrected mast confirmed in render beside the scout. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
