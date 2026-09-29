# Street Light — approved asset review

Draft ID: `street-light` · Category: `prop` · Status: **Owner approved for integration on 2026-09-29**

## Purpose and intended placement

A municipal street light: the thing that marks a road edge at night and gives a street or car park
a vertical element against the low city shells. Expected along roads, at junctions, and around the
camp perimeter.

## Real light: yes, and here is what it costs

**The fixture carries a real `PointLight`.** This was verified against the actual placement path,
not just assumed.

Verified behaviour in `src/world/buildWorld.ts:126-129`, which does
`prototype.clone(true)` per placement:

- The cloned instance retains the light, named `street-light-bulb`, intensity 9, distance 18 m,
  decay 2.
- After the instance is moved to (40, 0, -25) and rotated 1.1 rad, the light's world position
  moves with it — local offset (0, 5.98, 1.55) becomes world (41.38, 5.98, -24.30). Rotation
  and placement are respected.
- Only **variant 0 emits light.** Variants 1 (broken lens) and 2 (fallen head) have no light at
  all, which is what makes them meaningful rather than cosmetic.

**`PointLight`, not `SpotLight`, and that choice is load-bearing.** `SpotLight.copy()` does not
carry the `.target` object. A test of `spot.add(spot.target); clone = spot.clone(true)` showed the
cloned spot light's target is **not in the clone graph** and keeps a stale local world position, so
every street light in the world would have aimed at the wrong place. `PointLight` has no target and
clones cleanly. A downward `SpotLight` is still the better _looking_ lamp, but it needs a runtime
fix to the target before this asset could use one.

### Owner decisions this raises

- **Shadow casting is off** (`castShadow = false`). A 6.5 m pole with a point light would need a
  cube shadow map, and point-light shadows are expensive. If shadows are wanted later, this is the
  one prop where it would be visible, and it should be opt-in per placement.
- **Every placement adds a real light to the scene**, and `buildWorld` clones per placement rather
  than instancing. A road with 30 of these is 30 point lights. Three.js will handle it, but it
  should be a deliberate cap in the world generator, and worth watching against the
  `VolumetricFogPass` in `src/atmosphere/`.
- **Intensity 9 is a guess.** It was tuned by eye against nothing. The camp daylight the viewer and
  the game both use is bright (`AmbientLight` 1.15 + 0.52, `DirectionalLight` 2.15), so the lamp
  will barely register in daylight and will read properly only at night. It needs tuning against
  a real night scene.
- The `lamp-lens` material is emissive so the fixture still reads as _lit_ in daylight, where the
  `PointLight` contributes almost nothing.

## Dimensions and scale

- Declared `dimensions`: 0.5 × 6.6 × 2.15 m
- Measured: 0.46 × 6.50 × 2.12 m (variant 0/1), 0.46 × 6.60 × 2.05 m (variant 2, the taller
  broken head)
- 6.5 m is a normal single-lane street light and puts the lamp head just above head height on the
  2.1 m scout. It is deliberately shorter than the 16 m water tower and the 18 m radio mast, so it
  reads as street furniture and not as a landmark.
- The `z` extent is the cantilevered arm, not the pole. The pole is only 0.34 m across.

## Pivot and front direction

Base centred on x = 0, z = 0 with the ground at y = 0. **+Z is the direction the arm reaches and
the direction the light pools**, so a placement's `rotationY` decides which way the lamp points.
There is no door, so +Z here means "the lit side", not a front.

## Collider proposal

`center {0, 3.2, 0}`, `size {0.34, 6.4, 0.34}` — the pole shaft only, per the AGENTS guidance not
to fill the visual footprint of something a player can walk under. A player can walk right beneath
the arm and stand in the light pool. The concrete plinth (0.46 m) is slightly wider than the
collider, which is a small and deliberate cheat so the player can stand close to the base.

## Interaction points

| id          | label        | position     |
| ----------- | ------------ | ------------ |
| `lamp-base` | Street light | 0.55, 0, 0.2 |

Sits clear of the collider, at the plinth. Reads as a switchable or scavengeable lamp.

## Materials

| name                | colour    | roughness | metalness | notes                    |
| ------------------- | --------- | --------- | --------- | ------------------------ |
| `pole-steel`        | `#64675d` | 0.82      | 0.25      | flat shaded              |
| `base-concrete`     | `#8b887d` | 1         | 0         | plinth                   |
| `trim-dark`         | `#444943` | 0.9       | 0         | hatch and head cap       |
| `lamp-lens`         | `#e0c48a` | 0.34      | 0         | emissive `#8a6c2e` @ 0.7 |
| `lamp-glass-broken` | `#8a9c95` | 0.34      | 0.06      | variant 1 only           |

5 materials, 4 live per variant. The lens is the only emissive surface.

## Variants

| variant | state                                    | light |
| ------- | ---------------------------------------- | ----- |
| 0       | intact                                   | yes   |
| 1       | lens shattered, head still level         | no    |
| 2       | head has come down and hangs off the arm | no    |

Variant 2 is the only one that changes the bounding box, and it grows _taller_ (6.60 m) because
the head swings. The declared `dimensions` cover all three.

## Complexity

9 meshes, ~180 triangles, 4 materials. By far the cheapest of the four candidates — the cheapest
thing here is the tall silhouette, which is exactly what a street light needs to be. The pole and
arm are 7- and 8-sided cylinders with flat shading, so they read as faceted metal rather than
smooth pipe.

## Reads at distance

Very strong at long range — a thin bright vertical against the sky, which is a landmark-like read
for something that is only a prop. The access hatch and the arm's droop only matter up close.

## Unresolved questions

- **The light budget is the real open question.** Real lights inside cloned world instances are
  the most consequential thing in this batch. Needs an explicit owner decision on a per-scene cap.
- Variant 2's fallen head still uses the `lamp-lens` emissive material, so a visibly broken lamp
  still looks faintly lit. Intentional (the emissive reads as "this is a lamp" in daylight) or a
  bug, is a call for the owner.
- If the game ever gains a real night cycle, intensity 9 / distance 18 / decay 2 will need
  re-tuning, and this candidate is where to do it.
- Converting to a downward `SpotLight` for a better light pool requires the runtime `.target` fix
  described above.

## Validation performed

- `tsc --strict` typecheck clean.
- All 3 variants built in Node; bounding boxes measured and matched to `dimensions` / `collider`.
- The `prototype.clone(true)` + place + rotate path from `buildWorld` was reproduced directly:
  the light survives cloning and tracks the instance transform. The `SpotLight` target failure was
  reproduced as the reason for the `PointLight` choice.
- `createVisual(1)` called twice and compared mesh-by-mesh: identical.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **The light itself has not been seen lit in a real scene.** Intensity and falloff are unverified
  against a night render.

## Licensing

Original work. No external assets, textures, or references used.
