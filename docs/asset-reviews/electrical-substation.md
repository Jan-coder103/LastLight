# Electrical Substation — approved asset review

Draft ID: `electrical-substation` · Category: `landmark` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #38, "Port, mountain, and industrial areas"

## Revision (owner feedback: about 50% too small against a human)

The whole industrial yard is now scaled **1.5x as one group**: the fence tops out at 2.4 m (over
the 2.1 m scout's head), the transformer tank stands 3.6 m in a 0.75 m bund, the gantry beam is
at 10.7 m and the take-off tower at 16.5 m. The control kiosk is deliberately **not** scaled - a
real control building stays human-scale next to plant this size - so it is rebuilt at 1.0x
beside the gate at (5.5, z 7.6) with its 2.0 m door intact. Declared `dimensions`:
**22.8 x 18.6 x 20.3 m** (measured 22.68 x 18.45 x 20.15 m; 10.83 m tall in variant 2, tower
removed). The transformer collider scaled with the plant: centre (-2.1, 2.48, -0.6), size
(9.3, 4.95, 6.6). The kiosk interaction point moved to (5.5, 0, 5.9), in front of its step.
Materials, variants, and the fence-is-visual-only decision are unchanged.


## Purpose and intended placement

A fenced utility yard: a transformer in a bund with radiator banks and porcelain bushings, a busbar
gantry with three suspended conductors, a lattice take-off tower, a control kiosk by the gate, and
a post-and-rail perimeter. Intended on the edge of a town, guarding a road junction, or as the
centrepiece of a utility compound.

## Dimensions and scale

- Declared `dimensions`: 22.8 × 18.6 × 20.3 m (revised; see the revision section above)
- Measured (vertex-accurate): 15.12 × 12.30 × 13.17 m (variant 0), 13.44 m deep (variants 1/2),
  7.22 m tall (variant 2, tower removed)
- Transformer tank 2.4 m, gantry 7.1 m, take-off tower 11.0 m. **5.5 scout heights** to the tower
  top, 1.2 to the transformer.

## Pivot and front direction

Ground at y = 0, origin at the centre of the yard pad. **+Z is the front gate** — the side with the
gate leaves, the warning sign and the control kiosk. The transformer sits at x = −1.4 so the yard
is not symmetric about its own gate, which is what makes it read as a site rather than a diagram.

## Collider proposal

`center {−1.4, 1.65, −0.4}`, `size {6.2, 3.3, 4.4}` — the transformer bund only.

The perimeter fence is **visual only**. That is the main design decision on this asset: a sealed
yard would be 15 m of unwalkable ground, whereas an open one lets the player walk between the
gantry columns and the tower legs, which is where the interesting silhouettes are. In variant 1 and
2 the gate leaves are swung inward and a run of the fence is cut and slumped, so the breach is
visible. The cost is that a player can walk through the fence line — which is exactly the intent.

## Interaction points

| id                   | label          | position   |
| -------------------- | -------------- | ---------- |
| `substation-kiosk`   | Control Kiosk  | 4.0, 0, 3.2 |

In front of the kiosk door, clear of the collider. Reads as a control or relay point.

## Materials

| name               | colour    | roughness | metalness | notes                             |
| ------------------ | --------- | --------- | --------- | --------------------------------- |
| `yard-gravel`      | `#797762` | 1         | 0         | yard pad                          |
| `yard-steel`       | `#64675d` | 0.85      | 0.3       | gantry, tower, fence, kiosk trim  |
| `yard-tank`        | `#54594d` | 0.75      | 0.35      | transformer tank, conservator drum |
| `yard-insulator`   | `#78908b` | 0.35      | 0.05      | porcelain bushings and strings    |
| `yard-busbar`      | `#8e5142` | 0.8       | 0.4       | conductors and the gate hazard sign |
| `yard-fence`       | `#5a5f52` | 0.95      | 0.1       | mesh guard and gate leaves        |
| `yard-kiosk`       | `#aaa18f` | 0.95      | 0         | plinths, bund, kiosk, cable drum base |
| `yard-roof`        | `#514f49` | 0.85      | 0.15      | kiosk roof                        |
| `yard-hazard`      | `#9b624d` | 0.9       | 0.1       | transformer plate, gate sign      |

9 materials. The fence guard was given its own muted `yard-fence` material after the first preview:
it had been sharing the oxide-red busbar colour, and 40 m of bright red mesh around the perimeter
pulled the eye away from the transformer, which is the thing the asset is for.

## Variants

| variant | fence | take-off tower |
| ------- | ----- | -------------- |
| 0       | intact, gate closed | present |
| 1       | **front run cut**, gate leaves swung in | present |
| 2       | cut | **removed** |

Variant 2 drops the asset from 12.3 m to 7.2 m tall, which is the difference between a district
landmark and a fenced compound. It is the strongest of the three and the cheapest to build.

## Complexity

188 meshes / 3408 triangles (v0), 186 / 3384 (v1), 141 / 2624 (v2). 9 materials.

**This is the heaviest candidate in the batch and it should be treated as a single-instance
landmark.** The mesh count is dominated by the take-off tower (4 legs, 4 brace levels, 3 arms with
insulator strings) and the fence (4 runs of posts, rails and guard). If it needs trimming:

- fence post spacing 2.5 m → 3.2 m saves about 12 meshes;
- insulator strings 3 discs → 2 saves 12 across 15 strings;
- one cross-arm level on the tower saves 5.

Any of the three is invisible at play distance.

## What reads well

- **Far:** the take-off tower's taper against the gantry beam, and the three insulator strings
  hanging under the beam. The porcelain is the recognisable detail.
- **Near:** the transformer radiators, the conservator drum on its brackets, the three hand valve
  wheels, the yard cable drum and the two spare bushings on the gravel.

## Rework after the first preview

- **The tower legs did not meet their braces.** Same Two-Euler-angles fault as the weather station
  guys: the legs were aimed with `rotation.x` and `rotation.z` together and did not lie along the
  taper. They are now placed with a `spanTo()` helper that aims a cylinder between two points with
  a quaternion. The same helper is used for the busbar drops, which had been floating 0.5 m from
  the conductor they were supposed to hang from.
- **The gantry was 11.6 m across a 3.2 m transformer** and dominated the yard. It is now 8.0 m
  across, and the fence guard is no longer the same colour as the busbars.

## Unresolved questions

- The perimeter is visual only. If the game ever wants a substation to be a real enclosed compound,
  the collider needs a perimetral ring rather than one box, and this candidate would need revising.
- Insulator strings are 3 discs on a cap. They are the highest-frequency detail on the asset and
  the first thing to look wrong at close range.
- No catenary sag on the conductors. They are straight, which reads as tensioned and correct for a
  short run but not for a long span.
- The transformer has no cooling-fan motors or radiator headers, so it reads as an oil tank with
  fins rather than a machine.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 (the cable drum, the spare bushings
  and the tower feet were each re-seated after measurement put them below ground).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  misaimed tower legs, the floating busbar drops and the red fence were all confirmed visible in
  the first build and confirmed corrected in this one. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
