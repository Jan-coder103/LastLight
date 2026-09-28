# Ambulance Wreck — candidate review

Draft ID: `candidate-ambulance-wreck` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #08, "City and suburbs"

## Purpose and intended placement

A compact emergency vehicle: van-based, boxy, with faded paint, damaged beacons, and subdued red
markings. Meant for roadsides, near medical-adjacent locations, or scattered with the bus wreck as
city traffic debris.

Deliberately **not** the same family as the car candidate. It reads as a boxy van on a short
wheelbase, not as a saloon with a roof box, and it is banded rather than smoothly curved.

## Dimensions and scale

- Declared `dimensions`: 2.7 × 2.9 × 5.8 m
- Measured: 2.68 × 2.77 × 5.74 m, identical across all three variants
- 5.7 m long, 2.1 m wide, 2.65 m to the beacon bar. A van-based ambulance, and about 1.3 scout
  heights — noticeably shorter than the 12 m bus, so the two do not compete.
- **The x extent (2.68 m) exceeds the 2.1 m body** because the rear door hangs open to x = -1.47.
  See the collider section.
- 2.9 m declared height covers the beacon bar at 2.77 m.

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
| `rear-door` | Rear Door | 0, 0, -3.25 |

Behind the open rear doors, clear of the collider. Reads as a searchable medical supply point,
which is the most obvious gameplay hook on the model.

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

8 live materials per variant.

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
- **Rear left door open on a hinge**, 0.4 rad. Verified: the door group spans x -1.47 to -1.03 and
  z -2.79 to -1.88, so it genuinely swings out and clear of the body side at -1.05.
- **One dead beacon.** The roof bar carries one `beacon-lens` and one `beacon-broken`, so the bar
  reads as a light bar with half of it destroyed rather than as two working lamps.
- **Windscreen cracked**, with an offset shard leaning in the frame.

No crumpled panels, no burnt-out roof, no flat tyre. A 23-mesh budget does not leave room for much
and the "wreck" read here is carried by the missing wheel, the open door, and the dead beacon.

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

23 meshes, ~388 triangles, 8 live materials. The cheapest vehicle in the batch per metre of
length. Triangle cost is dominated by the three 10-sided wheels.

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
- No stretcher, no roof medical equipment, no rear step. All cheap to add and all of which would
  make the silhouette more specific.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured and confirmed inside the declared
  `dimensions`; `minY` 0.001 (the 10-gon wheel adjustment described above).
- Rear door swing confirmed by measuring the door group's world bounds; the rear cross confirmed
  on the door face by raycast from behind.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights (checked explicitly).
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.**

## Licensing

Original work. No external assets, textures, or references used.
