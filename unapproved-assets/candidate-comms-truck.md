# Communications Truck — candidate review

Draft ID: `candidate-comms-truck` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #26, "Military base and checkpoints"

## Purpose and intended placement

A military utility vehicle with a box body, roof antenna, and muted field paint. The idea names
three things and all three are modelled: the box body is a separate mass behind a lower cab, the
antenna is a real mast with whips, and the paint is the palette's military green.

Expected on base roads, at comms positions, and abandoned at the edge of a military district.

## Dimensions and scale

- Declared `dimensions`: 2.9 × 5.7 × 8.6 m
- Measured: 2.82 × 5.62 × 8.48 m (variants 0/1), 2.82 × **4.31** × 8.48 m (variant 2)
- 7.6 m of bodywork on a 2.5 m width, 3.1 m to the box roof, **5.62 m to the antenna tip.**
- The 4×4 chassis and 2.5 m body put it between the ambulance (5.7 m) and the bus (12 m) in the
  vehicle set, which is where a comms truck belongs.
- **Variant 2 is 1.3 m shorter** because the antenna is folded down. That is the largest vertical
  variant difference in the batch and the placement system has to plan for it.

## Pivot and front direction

Ground at y = 0. **+Z is the front** — bonnet, raked windscreen, bumper, mirrors. The box body and
its sealed rear doors are at -Z.

## Collider proposal

`center {0, 1.5, -0.2}`, `size {2.5, 3, 7.6}` — the body, excluding the antenna.

A solid vehicle, so a box is again the right shape, as with the bus and the ambulance. The antenna
is excluded because it is 2.5 m above the roof and a player should be able to stand beside the
truck without being blocked by a wire.

**The rear doors are closed, not open.** That is deliberate and worth stating, because the bus and
the ambulance both have a door standing ajar and this one does not: the comms box's read is its
sealed flank, and a sealed flank is what says "communications equipment, do not open".

## Interaction points

| id           | label      | position   |
| ------------ | ---------- | ---------- |
| `truck-rear` | Truck Rear | 0, 0, -4.2 |

Behind the rear doors, clear of the collider. The salvage point — a comms truck is exactly the sort
of thing worth searching, and the sealed rear doors are what the point is for.

## Materials

| name                      | colour    | roughness | metalness | notes                     |
| ------------------------- | --------- | --------- | --------- | ------------------------- |
| `truck-paint-field-green` | `#58624d` | 0.9       | 0         | variant 0                 |
| `truck-paint-faded-olive` | `#626753` | 0.9       | 0         | variant 1                 |
| `truck-paint-grey-green`  | `#77796a` | 0.9       | 0         | variant 2                 |
| `window-glass`            | `#65766d` | 0.3       | 0.05      | windscreen and side glass |
| `trim-dark`               | `#444943` | 0.9       | 0         | chassis, rear doors       |
| `body-metal`              | `#64675d` | 0.8       | 0.25      | bumper, mirrors, antenna  |
| `wheel-tyre`              | `#2b2724` | 1         | 0         | four wheels               |
| `wheel-hub`               | `#54594d` | 0.8       | 0.2       | four hubs                 |
| `rust-metal`              | `#8e5142` | 0.9       | 0         | the rust patch            |

7 live materials. `#58624d` is the palette's military green, which is the most on-brief colour
choice available for a military vehicle, and all three variants sit inside that same value range so
a row of them reads as a fleet.

## "Muted field paint" taken literally

All three variants are the same hue family at different values — `#58624d`, `#626753`, `#77796a` —
rather than three different colours. A field-painted vehicle is one colour, weathered, and the
variation should be in how worn, not in what colour. That is a narrower and more correct reading
than the burnt-red or grey-teal options the bus and ambulance use.

## The antenna is a named feature, so the thin geometry is justified

A 2.3 m whip at 0.03–0.045 m radius, plus three 0.8 m whips on the body roof and a base plate.
Five meshes.

**By the rule this batch converged on** — thin geometry is accepted only where the idea names the
feature — the antenna qualifies and the radar dish's ladder (idea 25, unnamed) did not. The whip's
radius is 0.03 m, thinner than anything else in the batch, and it is here because "roof antenna"
is in the brief. It is the tallest single element on the vehicle and the thing that identifies it
as a comms truck rather than a cargo truck.

## The antenna tilt is the state variant

Variant 2 folds the main whip to `rotation.x = 1.15`, taking the tip from **y = 5.62 down to
y = 4.29**. Verified by measurement.

A comms truck with its antenna folded is a vehicle that has been moved, stowed, or stripped. That
is the batch's "removal or collapse tells a story" pattern, and here it is free — the whip is one
mesh and rotating it costs nothing.

## Damage without a missing wheel

The bus and the ambulance both have a wheel off, which was a good first use of the idea but is now
repeated. This truck instead has:

- a **buckled side panel**, rotated 0.16 / -0.22 rad, standing 0.09 m proud;
- a **rust patch** on the rear quarter;
- the folded antenna.

That is enough to read as used, and it keeps the vehicle's four wheels present, which suits a truck
that has driven here rather than been dumped.

## Complexity

33 meshes, ~652 triangles, 7 materials. The heaviest of the three vehicles, which is right for a
7.6 m truck carrying a mast, and still a third of the crashed car's triangles.

## What reads well

- **Far:** the box body with the mast above it. The silhouette of a tall thin whip over a long box
  is the whole read, and it is unmistakable against a treeline.
- **Near:** the corrugation ribs, the raked windscreen, the sealed rear doors, the buckled panel,
  the stowed crate.

## Unresolved questions

- **No unit markings, no number, no call sign.** A comms truck in a military world would have
  something painted on the box, and the box is a large blank flank. Numerals are texture work, but
  a stencilled unit bar is 2 boxes.
- **The stowed crate on the rear step is unexplained** — it reads as a loose box on the bumper
  rather than as stowed equipment. It was added to give the rear silhouette a second mass, which
  is a modelling reason rather than a world-building one, and it should earn its place or go.
- **No cargo body door, no roller shutter.** A box body for communications equipment would often
  have a roll-up rear, which would be a strong silhouette feature.
- **All four wheels present and all four clean.** A used military vehicle would have at least one
  flat or a missing hubcap, and there is no hubcap detail to remove.
- **The three short whips on the body roof are unexplained** — they read as pins rather than
  antennas without their mountings. They were added for silhouette, not for a reason.
- **No antenna mount detail**: no insulator, no gasket, no cable run into the body. The whip
  appears to grow out of a plate.
- **Variants differ only in paint and the antenna state.** The antenna is the good axis; the paint
  is thin.
- **No camo netting, stowage, or kit on the roof** other than the antenna, which is where a
  long-distance comms vehicle would carry its most distinctive load.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- Antenna state confirmed by measurement: whip tip at y = 5.62 erect (variant 0) and y = 4.29
  folded (variant 2).
- Light count checked explicitly: zero lights, as intended for a vehicle with no working
  equipment.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Whether the mast reads as an antenna or as a wire is the
  kind of judgement only a real look settles.

## Licensing

Original work. No external assets, textures, or references used.
