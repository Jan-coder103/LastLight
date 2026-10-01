# Ground-Level Water Reservoir — candidate review

Draft ID: `candidate-water-reservoir` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #59 (added in the post-fifty extension)

## Purpose and intended placement

A cylindrical water tank on a low plinth: banded courses, a domed shoulder, a vent stack, a
stand-off ladder, a front-face gauge, and an outlet pipe with a valve and a drop leg. Intended at a
camp, a farmstead, a small works, or a settlement edge as a mid-scale landmark with a service point.

## Dimensions and scale

- Declared `dimensions`: 4.5 × 4.8 × 5.0 m
- Measured (vertex-accurate): 4.41 × 4.75 × 4.93 m in all three variants
- Tank 1.9 m radius, shell 3.4 m, vent cap at 4.75 m, plinth 0.34 m. **2.3 scout heights.** A 3.8 m
  diameter, 4 m tall tank is a small rural reservoir and sits comfortably below the water tower.

## Pivot and front direction

Ground at y = 0, tank centred on x = 0, z = 0. **+Z is the serviced face**: the ladder, the gauge and
the outlet valve are all on +Z, at three different heights. The ladder is offset to +X and the valve
to −X so the two do not collide. The tank is a 14-gon, so there is no true front — this is a
convention, and `rotationY` decides which face shows the service gear.

## Collider proposal

`center {0, 2.0, 0}`, `size {3.4, 4.0, 3.4}` — a solid block for the tank and plinth.

3.4 m is under the 4.52 m plinth diameter, so a player can stand at the tank wall. The tank is a
closed vessel, so blocking it entirely is correct — a player should not walk through the middle of
it. The ladder, the valve, the drop leg and the vent are all outside the collider and non-solid,
which is right: the ladder is a climbable face and the valve is a service point.

## Interaction points

| id                 | label                    | position   |
| ------------------ | ------------------------ | ---------- |
| `reservoir-valve`  | Reservoir Outlet Valve   | 0, 0, 2.3  |

In front of the valve, clear of the collider. Reads as a water-collection or shut-off point.

## Materials

| name                | colour    | roughness | metalness | notes                            |
| ------------------- | --------- | --------- | --------- | -------------------------------- |
| `reservoir-tank`    | `#9a9280` | 0.95      | 0         | shell, shoulder                  |
| `reservoir-band`    | `#837f72` | 1         | 0         | three course bands, cap          |
| `reservoir-plinth`  | `#797762` | 1         | 0         | base ring                        |
| `reservoir-metal`   | `#54594d` | 0.85      | 0.3       | ladder, vent, gauge bracket, hoop |
| `reservoir-pipe`    | `#59635b` | 0.9       | 0.25      | outlet stub and drop leg         |
| `reservoir-rust`    | `#9b624d` | 1         | 0.15      | vent cap, drum bands, valve body, patch |
| `reservoir-dark`    | `#292f2b` | 0.9       | 0.2       | gauge face, base cover           |
| `reservoir-signal`  | `#d9b56e` | 0.8       | 0         | valve handle, gauge bezel        |

8 materials. The tank body was pulled from `#a29b88` to `#9a9280` and the bands from `#8b887d` to
`#837f72` after the first render: a 4.4 m cream cylinder was the brightest mass in the whole
candidate set and pulled focus off the valve, which is the thing a player is meant to approach.

## Variants

| variant | gauge | hoop | damage |
| ------- | ----- | ---- | ------ |
| 0       | fitted | **fitted** | — |
| 1       | **removed** | removed | — |
| 2       | fitted | removed | a rust patch, a dark base cover |

Variant 1 is a serviced, plumb tank and variant 2 is a failed one. The hoop in variant 0 is a
retaining band and it is the only element that changes the tank's mid-height silhouette.

## Complexity

29 meshes / 1076 triangles (v0), 25 / 748 (v1), 30 / 876 (v2). 8 materials.

The 14-sided shell is 56 triangles but the shoulder cone and cap add more, and the ladder is 14
separate cylinders. 1076 triangles is reasonable for a 4 m tank but it is worth noting that the
tube geometry is nearly a third of the count for something that reads as a stick.

## What reads well

- **Far:** the banded cylinder with the domed shoulder and the small vent on top, and the ladder
  breaking the left-of-centre silhouette. The ladder is what distinguishes a water tank from a silo.
- **Near:** the three course bands, the ladder stiles and rungs, the vent stack with its rusted cap,
  the gauge with its bezel, the outlet stub, the valve body and its amber handle, and the drop leg.

## Rework after the first preview

- **The ladder and the outlet fought for the same face.** The ladder was at `z = TANK_R + 0.24` and
  the valve at `x = 0, z = TANK_R + 0.44`, so from the default camera the valve assembly sat
  directly in front of the ladder's foot and the two read as one cluttered corner. The ladder moved
  to `x = +1.0` on the front face and the valve to `x = −0.85`.
- **The gauge was inside the tank.** It was placed at `TANK_R * 0.72`, inside the shell. On a
  14-gon the flat front face is at `TANK_R * cos(pi/14) = 1.85`, not at `TANK_R = 1.9`, so the
  dial was buried. It now sits on the facet plane with a bezel proud of it. This is the same
  `cos(pi/N)` correction the lighthouse needed.
- Moving the ladder to `−X` was tried first and rejected: a ladder on a curved surface at 90° to
  the camera is almost entirely occluded by the tank's own curvature.

## Unresolved questions

- The tank is a straight cylinder with a domed shoulder. Most real small reservoirs are exactly
  this, so it is correct, but it means the silhouette is a plain drum and the whole read rests on
  the bands, the ladder and the vent.
- The ladder has no cage or hoop, which any tank over 3 m would have. Without a cage it also reads
  as slightly unsafe, which may be fine.
- The ladder is mounted 0.24 m proud of the facet with no visible brackets or standoffs, so it
  appears to hover. Two small brackets would fix it.
- The outlet drops to 0.2 m above the plinth and ends in mid-air. There is no drain, no grating
  and no pipe run off to anywhere.
- The valve is a 0.26 m box with a small amber handle. It is the interaction point and it is the
  least developed part of the asset.
- The gauge's bezel is amber and its face is dark, which is the correct order, but the needle is
  the bezel showing through the middle, so it reads as a small yellow ring rather than as a dial.
- Variant 0's retaining hoop and the ladder are both full-circle and 0.045–0.05 m thick. Against
  `AGENTS.md`'s warning about thin members disappearing at game distance, both are borderline: they
  are visible in the preview but they would likely vanish at 30 m.
- There is no water stain, no fill line, and nothing to say whether the tank ever held anything.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  ladder/valve collision, the buried gauge and the over-bright body were all confirmed and
  corrected. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
