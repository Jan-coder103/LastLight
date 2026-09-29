# Portable Floodlight Tower — asset review

Asset ID: `portable-floodlight-tower` · Category: `prop` · Status: **Approved by owner**
Source idea: `ASSET_IDEAS.txt` #29, "Military base and checkpoints"

## Purpose and intended placement

A portable floodlight tower with a mast and blocky lamps. The idea allows a trailer or a tripod;
**a trailer was chosen**, and the reason is worth recording:

The batch already contains two mast-on-a-frame assets — the wind pump (#20) at 6.4 m and the radar
dish (#25) at 7.9 m, both on tapered lattice or solid pedestals. A tripod floodlight mast would
have been a third near-identical vertical lattice. A trailer with a chassis, two wheels, a drawbar
and four splayed outriggers is a different silhouette from either, so it earns its place in a set
that is otherwise accumulating masts.

Expected at checkpoints, vehicle parks, and any place needing light that is not a street light.

## Dimensions and scale

- Declared `dimensions`: 3.1 × 5.7 × 4.4 m
- Measured: 3.00 × 5.58 × 3.61 m (variants 0/1), 3.00 × **3.02** × 4.23 m (variant 2)
- 5.58 m to the lamp head, 2.9 m of trailer, four outriggers at ±1.35 m. **2.7 scout heights.**
- Deliberately shorter than the radar dish (7.9 m) and the wind pump (6.4 m), so the three masts
  have a height hierarchy rather than all reading the same.
- **Variant 2 is 2.5 m shorter** because the mast is folded for transport. Second-largest vertical
  variant difference in the batch after the comms truck's antenna.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the tow direction** — the drawbar and hitch are
there. The mast and lamp head are at -Z, behind the generator cabinet.

That is an unusual convention for this batch (most assets put the interesting end at +Z), and it is
correct for a towed object: a placement's `rotationY` should decide which way it is being towed, and
`positionY` rotation is what a generator placing trailers would want to think about.

## The lamp head is blocky, which is the idea's word

Two crossed bars carrying **four lamps**, each a 0.44 × 0.28 × 0.3 m housing with a lens face
towards +Z. Eight meshes plus the two bars.

"A few blocky lamps" is the idea's own phrasing and boxes are the correct form for it. A real
floodlight head has reflector housings and a cage, and neither is affordable or needed at this
scale — the read is four bright rectangles on a cross, and that is exactly what this is.

## One real light, not four

**Variant 0 emits exactly one `PointLight`** named `floodlight-bulb`, intensity 14, distance 22,
decay 2, `castShadow = false`. Verified by traversal: 1 light on variant 0, **0 on variants 1 and
2**.

The reasoning, and it is the same reasoning the street light (#) established:

- `buildWorld` does `prototype.clone(true)` per placement, so **every placement adds its lights to
  the scene individually.** A car park with six of these is 24 point lights at four per unit, or
  six with this approach.
- A single `PointLight` at the head carries the same read at a quarter of the budget. Nobody can
  tell which of four lamps the light is coming from at 20 m.
- The **lenses stay emissive** on the working variant, so the head still reads as _lit_ in daylight,
  which is when the `PointLight` contributes almost nothing.
- `PointLight` rather than `SpotLight`, because `SpotLight.copy()` does not carry its `.target` —
  the failure the street light's review sheet documents and reproduces.

Intensity 14 and distance 22 are scaled up from the street light's 9 and 18, on the reasoning that
a floodlight is brighter than a street lamp. That is a guess tuned against nothing, exactly as the
street light's was, and it needs a night scene.

## Collider proposal

`center {0, 0.7, -0.2}`, `size {2.5, 1.4, 2.6}` — chassis, cabinet, and outriggers.

**The mast and lamp head are not solid, so the player can walk under them.** Same judgement as the
wind pump and the radar dish, for the same reason: a portable unit you cannot walk under is a solid
lump, and standing beneath a floodlight tower to be lit by it is the whole point of the object.

## Interaction points

| id                     | label           | position  |
| ---------------------- | --------------- | --------- |
| `floodlight-generator` | Floodlight Unit | 0, 0, 1.7 |

At the generator cabinet, clear of the collider. A power or control point, and the natural hook for
turning the lights on.

## Materials

| name              | colour    | roughness | metalness | notes                                    |
| ----------------- | --------- | --------- | --------- | ---------------------------------------- |
| `tower-frame`     | `#59635b` | 0.85      | 0.25      | flat shaded, frame, mast, bars           |
| `trailer-body`    | `#8b887d` | 0.9       | 0         | cabinet and lamp housings                |
| `floodlight-lens` | `#d9b56e` | 0.34      | 0         | emissive `#7d6128` @ 0.7, variant 0 only |
| `floodlight-dead` | `#3a3630` | 0.9       | 0         | variants 1 and 2                         |
| `wheel-tyre`      | `#2b2724` | 1         | 0         | two wheels                               |

4 live materials. The smallest palette in the batch, tied with the rooftop tank, the fire escape,
and the burned trees.

`#d9b56e` is the palette's own amber signal swatch, used here as the working lens. The only warm
colour in the asset, and it is a light, which is as functional as a warm colour gets.

## Variants

| variant | lamps    | mast                 | light   |
| ------- | -------- | -------------------- | ------- |
| 0       | emissive | erect                | **yes** |
| 1       | dead     | erect                | no      |
| 2       | dead     | **folded, 1.25 rad** | no      |

Two state changes across three variants, which is the batch's strongest set:

- **Variant 1** is the street light's dead-lamp state, applied here: same emissive-lens-on-one-
  variant-only structure, so the variants are consistent across the two lit assets in the batch.
- **Variant 2** folds the mast for transport. Verified: `rotation.x = 1.25`, taking the total height
  from 5.58 m to **3.02 m**, which is barely above the trailer itself. That is a unit that has been
  packed, and it is a completely different silhouette from the other two at zero mesh cost.

The mast is a single tilted group, so nothing in it can drift out of alignment when it folds — the
same structural decision the parking ramp's slope group made, for the same reason.

## Outriggers are the detail that sells "portable"

Four legs splayed at 0.3 rad with 0.3 m foot pads, at the chassis corners.

Without them a trailer looks like a box on wheels and tips over in the imagination. With them it
reads as something that has been parked deliberately and levelled, which is what a portable
floodlight unit is for. Eight meshes, and they are the reason the trailer is credible.

## Complexity

32 meshes, ~460 triangles, 4 materials. Identical across all three variants — the mast fold and the
lamp states cost nothing.

## What reads well

- **Far:** a lit cross of four lamps high on a mast, above a low trailer. At night the emissive
  lenses plus the point light make this visible far beyond its 22 m falloff.
- **Near:** the louvre slats on the generator, the outrigger feet, the mast rungs, the lamp
  housings, the drawbar and hitch.

## Unresolved questions

- **The light budget is unresolved**, and it is the same open question the street light raised. Two
  assets in this batch now emit real lights, and both are cloned per placement. A base with 20 of
  these is 20 point lights. This needs an explicit per-scene cap from the owner.
- **Intensity 14 and distance 22 are guesses.** They have never been seen against a night render.
- **No cable, no generator detail, no fuel tank.** The cabinet is a box with three louvre bars; a
  real genset has an exhaust, a fuel cap, and a control panel.
- **The mast has no safety cable or stabiliser**, and at 5.6 m extended a towable mast has both.
- **Nothing says "floodlight" is portable** except the outriggers. A mast on a trailer is a
  permanent-looking object; a folded variant helps, but there is no handle, tow-eye detail, or
  storage locker for the cable.
- **Four lamps but one light** is a deliberate cheat and it will be invisible in play. Worth
  remembering that the geometry says four and the scene says one.
- **No traffic cone, no barrier, no cable run** at the base, all of which would be the cheap way to
  make it read as a deployed unit.
- **The dead lens material is used on variant 2 as well as variant 1**, so a folded unit also has
  dead lamps. Defensible (it is the same unit) but it conflates two states: "lamps broken" and
  "packed up".

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- **Light count verified explicitly: 1 on variant 0, 0 on variants 1 and 2**, and the light's name,
  intensity, and distance confirmed by traversal. This is the second asset in the batch to carry a
  real light, and the first to bound itself to one per placement.
- Lens material confirmed to switch between `floodlight-lens` and `floodlight-dead` with the
  working state.
- Mast fold confirmed by measurement: `rotation.x = 1.25`, height 5.58 m → 3.02 m.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game, and never seen lit at night.** The intensity and falloff
  are entirely unverified, and the whole point of this asset is what it does after dark.

## Licensing

Original work. No external assets, textures, or references used.
