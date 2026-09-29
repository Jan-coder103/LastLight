# Ambulance Wreck — candidate review

Draft ID: `candidate-ambulance-wreck` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #08, "City and suburbs"

## Purpose and intended placement

A compact emergency vehicle: van-based, boxy, with faded paint, damaged beacons, and subdued red
markings. Meant for roadsides, near medical-adjacent locations, or scattered with the bus wreck as
city traffic debris.

Deliberately **not** the same family as the car candidate. It reads as a boxy van on a short
wheelbase, not as a saloon with a roof box, and it is banded rather than smoothly curved.

## Revision: 10% bigger and properly dressed as a wreck (owner feedback)

- **Scaled to 1.1×.** The whole wreck builds inside a child group carrying a single
  `WRECK_SCALE = 1.1` constant (the crashed car's pattern), with `dimensions`, `collider`, and the
  interaction point all derived from it, so the metadata cannot drift. Measured
  (vertex-accurate): **2.95 × 3.05 × 6.72 m** — the swung rear door reaches x = -1.62 and the new
  drop step z = -3.53, and the footprint is asymmetric about the pivot, so the declared bounds
  are 3.0 × 3.2 × 7.1 (the old z of 6.38 clipped the step).
- **More wreck detail**, all pre-scale geometry inside the scaled group: a roof vent behind the
  beacon; a side window in the box body on each side (one still glazed, one boarded over with a
  dark panel); grille slats and lights on the nose (one glass headlight, one dark empty socket);
  a rear bumper with a **drop step** under the open door; **rust streaks** over panel seams
  (`rust-streak`, `#6b3f30`, the crashed car's rust swatch); and a **tipped stretcher frame**
  just inside the open rear doorway — two rails, three cross slats — so the opening shows a load
  rather than a dark recess panel.
- Mesh count 23 → **41**, triangles ~388 → **604**, 8 → 9 live materials. The stretcher finally
  resolves this sheet's own "no stretcher, no roof equipment, no rear step" note; the open door
  now reveals something worth searching.

**Previewed in WebGL renders** (headless Chromium, front three-quarter and rear views beside the
scout): the wreck reads bigger and busier at both distances, and the stretcher is visible through
the open door.

## Dimensions and scale

- Declared `dimensions`: 3.0 × 3.2 × 7.1 m (scaled; see the revision above)
- Measured (vertex-accurate): 2.95 × 3.05 × 6.72 m, identical across all three variants; the
  footprint is asymmetric about the pivot (door to x = -1.62, step to z = -3.53)
- 6.3 m long, 2.3 m wide, 2.9 m to the beacon bar. A van-based ambulance, and about 1.45 scout
  heights — noticeably shorter than the 12 m bus, so the two do not compete.
- **The x extent (2.95 m) exceeds the 2.3 m body** because the rear door hangs open to x = -1.62.
  See the collider section.
- 3.2 m declared height covers the beacon bar at 3.05 m.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the front** — raked windscreen, bonnet, bumper,
mirrors, and the missing front-right wheel all mark it. The rear doors and the red cross are on -Z.

## Collider proposal

`center {0, 1.45, 0}`, `size {2.2, 2.9, 5.7}` — the body only, excluding the open rear door,
which is the same decision as the city bus: the player can walk past an open door, not be blocked
by it. Again, a box is an accurate volume for a solid vehicle.

## Interaction points

| id          | label     | position    |
| ----------- | --------- | ----------- |
| `rear-door` | Rear Door | 0, 0, -3.58 |

Behind the open rear doors, clear of the collider (scaled from -3.25 by `WRECK_SCALE`). Reads as a
searchable medical supply point, which is the most obvious gameplay hook on the model.

## Materials

| name                         | colour    | roughness | metalness | notes                     |
| ---------------------------- | --------- | --------- | --------- | ------------------------- |
| `ambulance-body-faded-white` | `#a29b88` | 0.95      | 0         | variant 0                 |
| `ambulance-body-grey`        | `#8b887d` | 0.95      | 0         | variant 1                 |
| `ambulance-body-dirty`       | `#797762` | 0.95      | 0         | variant 2                 |
| `marking-red`                | `#8e5142` | 0.95      | 0         | flank stripes, rear cross |
| `trim-dark`                  | `#444943` | 0.9       | 0         | chassis, beacon housing   |
| `window-glass`               | `#65766d` | 0.3       | 0.05      | windscreen and shard      |
| `wheel-tyre`                 | `#2b2724` | 1         | 0         | three wheels              |
| `wheel-hub`                  | `#54594d` | 0.8       | 0.2       | exposed bare hub          |
| `body-metal`                 | `#64675d` | 0.8       | 0.25      | bumper, mirrors           |
| `beacon-lens`                | `#78908b` | 0.3       | 0.05      | emissive `#243632` @ 0.2  |
| `beacon-broken`              | `#3a3630` | 0.9       | 0         | the dead beacon           |
| `rust-streak`                | `#6b3f30` | 1         | 0         | the three rust panels     |

9 live materials per variant.

**The body colours are deliberately not white.** The style guide rules out pure white surfaces, and
a bright white ambulance would be the single most saturated thing in a muted city. `#a29b88` is a
faded off-white that still reads as "was white" while sitting in the established palette.

**`marking-red` is muted rust, not emergency red.** The idea says "subdued red markings", and
`#8e5142` is the project's existing faded-rust swatch. It is the only chromatic accent on the
model, and it is confined to two thin flank stripes and a small rear cross, which is exactly the
restricted use the style guide permits.

## Variants

| variant | body                  |
| ------- | --------------------- |
| 0       | faded white `#a29b88` |
| 1       | grey `#8b887d`        |
| 2       | dirty `#797762`       |

Body paint only, geometry identical in all three. The red markings do **not** change with the
variant, which is correct: the markings are what identify the vehicle, and an ambulance whose
markings fade differently from its paint would be odd.

## Damage

- **Front-right wheel missing**, replaced by an exposed hub, so the vehicle sits on a collapsed
  corner.
- **Rear left door open on a hinge**, 0.4 rad. Verified: the door group swings out and clear of
  the body side, to x = -1.62 at full scale.
- **One dead beacon.** The roof bar carries one `beacon-lens` and one `beacon-broken`, so the bar
  reads as a light bar with half of it destroyed rather than as two working lamps.
- **Windscreen cracked**, with an offset shard leaning in the frame.
- **Revision additions** (see above): boarded side window, dead headlight socket, rust streaks,
  rear step, roof vent, and the tipped stretcher in the doorway.

The "wreck" read is now carried by the missing wheel, the open door with the stretcher in it, the
dead beacon, the boarded window, and the rust.

## Bug found and fixed: the cross was floating off the back

The rear red cross was originally at x = -1.35. The body only spans x -1.05 to 1.05, so the cross
was hanging **0.3 m in mid-air off the rear of the vehicle**, invisible from most angles and
responsible for a bounding box 0.3 m wider than the vehicle is.

It is now at x = 0.52, on the shut right-hand rear door, and verified by raycast from behind: the
first three hits are all `marking-red` at z = -2.86, sitting on the door face at z = -2.82.

This is the third time in this batch that a part has ended up somewhere other than where it was
meant to be, in a class of error that bounding boxes cannot catch and a quick look in a viewer
would have.

## Complexity

41 meshes, ~604 triangles, 9 live materials. Up from 23 / ~388 with the revision's dressing, still
the cheapest vehicle in the batch per metre of length. Triangle cost is dominated by the three
10-sided wheels.

The wheel centres sit at y = 0.40 rather than 0.42, because a 10-sided cylinder does not reach its
true radius at a vertex: at 0.42 the tyres floated 2 cm above the ground. This was measured, not
guessed.

## What reads well

- **Far:** the boxy silhouette and the red flank stripe, which are the only things that will
  survive at distance.
- **Near:** the dead beacon, the cracked windscreen, the missing wheel, the open rear door and the
  cross.

## Unresolved questions

- **No interior and no way in.** The rear door hangs open onto a solid door recess panel, so
  opening it reveals a dark face rather than a cabin. The `rear-door` interaction point implies
  something enterable, and right now there is nothing behind it. Same limitation as the bus.
- **The missing wheel is the only structural damage.** A real ambulance wreck would have a
  crumpled front or a peeled body panel, and at 23 meshes there was no budget for it. If this
  asset matters more than the mesh count allows, the front-end damage is the first thing to add.
- **Variant 1's grey body makes the red markings do all the identification work.** Worth checking
  that it still reads as an ambulance rather than as a grey van.
- **No "intact" variant**, same gap as the bus. There is no way to place a healthy ambulance.
- The beacon is emissive at 0.2 but has **no real light**, unlike the street light. Correct for a
  wrecked vehicle, but if a variant is ever added with working beacons, that would be a real light
  and would need the same owner decision the street light raised.
- The raked windscreen is a single rotated box, so from directly in front it is a flat angled
  plane rather than a wrapped screen. Acceptable at this scale, and unlikely to be noticed.
- The stretcher is a frame, not a canvas — at a glance through the doorway it reads correctly, but
  a close inspection mode would want a fabric plane.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built and rendered in headless Chromium with the project's three.js; bounds
  measured **vertex-accurately** (world-space vertices) and confirmed inside the declared
  `dimensions`; `minY` 0 (the 10-gon wheel adjustment described above keeps the tyres seated).
- Rear door swing confirmed by measuring the door group's world bounds at full scale; the rear
  cross confirmed on the door face by raycast from behind.
- **Revision confirmed by render** (front three-quarter and rear views beside the scout): the
  1.1× scale reads, and the stretcher, grille, boarded window, vent, and rust are all visible at
  their intended distances.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights (checked explicitly), no `NaN` positions.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- **Viewed in WebGL renders** (not yet in the game engine).

## Licensing

Original work. No external assets, textures, or references used.
