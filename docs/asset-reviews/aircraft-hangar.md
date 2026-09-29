# Aircraft Hangar Shell — asset review

Asset ID: `aircraft-hangar` · Category: `building` · Status: **Approved by owner**
Source idea: `ASSET_IDEAS.txt` #24, "Military base and checkpoints"

## Purpose and intended placement

A wide military building with a large sliding-door opening and weathered metal panels. Both named
features are modelled, and the opening is the largest in the batch: **14 m wide and 17.8 m deep**.
Since the revision it also has its intended occupant — a simple old monoplane parked inside.

Expected at airbases, as the largest building in a military district, and as a skyline landmark
from a distance.

## The arch is faceted on purpose, and it avoided a fourth gable copy

The roof is **seven straight segments following a parabola**, not a curve and not a gable:

```
nodeY(x) = 0.4 + SPRING + RISE * (1 - (x / halfSpan) ** 2)
```

Heights are derived from that equation rather than listed, so changing `RISE` or the span cannot
leave the segments disconnected. Measured segment angles follow the curve, and the result reads as
a faceted arch — which suits the batch's low-poly language better than a smooth barrel roof would.

This matters beyond style. The gable helper reached **three copies** (row house, ranger cabin, barn
shell) and the barn review sheet recommended lifting it to a shared module. Building this roof as an
arch meant **no fourth copy was needed**, which is the cheapest way to respect that recommendation
without doing the refactor.

## Revision: the gable ends were open, the header speared the roof, and the leaves clipped the

arch (owner feedback: "a hole in the back wall near the top; add a simple old plane")

Three construction faults, plus the requested aeroplane:

1. **The hole.** Nothing closed the wall area between the wall tops (5.9 m) and the arch
   underside — at both ends. From the back it was a band of daylight across the whole facade
   tapering with the arch; from the front the same gap ran above the piers. Each end is now
   closed by **convex prism panels fan-triangulated under the arch curve** (one solid panel at
   the back; two side strips and a header strip over the door at the front), sampled every metre
   and clamped at the springing. The panel bases sit 0.1 m inside the wall tops so no coplanar
   faces meet.
2. **The old header speared the roof.** It was `DOOR_H + RISE` tall with its top at 11.4 m —
   **1.3 m above the arch crown** (10.1 m) — so a wall slab stuck out through the roof at the
   front. It is replaced by the header strip prism, which follows the arch underside exactly.
3. **The open leaves clipped the arch.** The 7 m leaves parked at x = ±10.5 stood 0.7 m past the
   arch's local underside and sheared through its edge near the wall line. The door is now
   **5.0 m tall** (`DOOR_H`), which keeps 0.3 m of clearance under the arch at the parked
   position and still admits the aircraft below.
4. **The old plane.** A low-wing monoplane now parks left of centre inside, nose to the door:
   slab fuselage with a tapered tail cone, one wing, open cockpit, fixed gear with one flat
   tyre, two-blade prop, tail skid — 18 meshes, 5 new named materials (`airframe-fabric`,
   `airframe-trim`, `prop-timber`, `tyre-rubber`, plus the reused `interior-dark` for the
   cockpit). It sits on the interior floor slab, under the door head, and its silhouette is
   readable through the opening from the front three-quarter view.

Measured (vertex-accurate): **27.90 × 10.02 × 18.65 m** (variants 0/2). Declared `dimensions`
updated to 28.0 × **10.2** × 18.8 — the old y of 11.5 was sized by the spearing header and has
no geometry under it now. `minY` 0.

**Previewed in WebGL renders** (headless Chromium): front, rear, three-quarter, and interior
views confirm the back is solid, the front closures meet the arch, the shut variant seals the
opening, and the plane reads inside.

## Dimensions and scale

- Declared `dimensions`: 28.0 × 10.2 × 18.8 m (see the revision above)
- Measured (vertex-accurate): 27.90 × 10.02 × 18.65 m (variants 0/2), **24.60 × 10.02 × 18.65 m
  (variant 1)**
- 24 m clear span, 18 m deep, 5.5 m to the springing line, 10.1 m at the arch crown. **4.8 scout
  heights.**
- A 24 m span is a real hangar width. Deliberately at the smaller end, because a true 40 m
  aircraft hangar would be so large it dominated any district it was placed in.
- **The 27.9 m width in variants 0/2 is the open door leaves**, which park out to x = ±13.95,
  overhanging the 24 m building by 2 m each side. Variant 1's doors are shut, so it is only
  24.6 m. That 3.3 m swing is the largest variant-driven footprint difference in the batch and the
  placement system has to plan for it.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the door end.** A placement's `rotationY` points
the opening at whatever the player should approach from.

## Collider proposal

`center {0, 5.0, 0}`, `size {24, 10, 18}` — the building.

**The collider covers the 14 m opening, so the hangar is not enterable.** This is the **largest
instance** of the batch's standing problem: five candidates now have a real, visible opening sealed
by a single box, and this one is a 14 × 5 m door.

| candidate    | opening                    | depth      |
| ------------ | -------------------------- | ---------- |
| ranger cabin | 1.1 × 2.1 m doorway        | 3.2 m      |
| sawmill      | 5 × 4.2 m loading bay      | 9.4 m      |
| barn shell   | 1.3 m sliding door gap     | 8.7 m      |
| pillbox post | 1.2 m doorway + 12 cm slit | 2.5 m      |
| **hangar**   | **14 × 5 m sliding door**  | **17.8 m** |

A 14 m opening is the one a player is most likely to try to walk or drive through, so this is the
case that most needs multiple colliders or a subtractable doorway. It is now the strongest single
argument in 29 candidates.

The open leaves overhang to x = ±13.95 but are track-mounted above the pier line, so they are
correctly outside the collider.

## The 14 m opening is real and deep

Two sliding leaves, each 6.9 m wide and 5 m tall, parked over the piers. The front wall is two
piers and an arch-following header strip, so the full 14 m is empty.

Verified by raycasting in at y = 3, across the opening:

| x              | first hit            | z         |
| -------------- | -------------------- | --------- |
| 0              | `interior-dark`      | **-8.42** |
| ±4             | `interior-dark`      | **-8.42** |
| ±6.5           | `interior-dark`      | **-8.42** |
| y = 8 (lintel) | `hangar-panel-olive` | 9.00      |

**17.8 m of interior depth across the entire width.** The lintel stops at the wall face, so the
opening is bounded correctly above as well as at the sides.

### A bug this caught

Variant 1's shut doors were both centred at `x = 0`, so the two 6.9 m leaves stacked in the middle
and left 3.5 m open at each shoulder — a "closed" hangar with two big holes. The closed position is
`DOOR_W / 4` per leaf, not 0.

Re-verified after the fix: at x = ±5 and ±2 the rays hit `hangar-door`, and the leaves span
x -6.95..-0.05 and 0.05..6.95. The 10 cm gap at the centre is a realistic door meeting gap.

**A layout bug that a bounding box would never have found**, and that only a raycast at several
points across the opening exposed. Worth noting given how many of this batch's findings have been
of exactly this kind.

## Weathered metal: 6 bands and 2 rust streaks

Six horizontal panel bands, 0.18 m tall, standing 0.05 m proud up the side walls at y = 1.4, 3.0,
and 4.6. Two rust streaks, 0.7 m wide, running the full height of the back wall's inner face.

Eight meshes for the whole weathering treatment. The bands are what make a 24 m wall read as clad
metal rather than as a painted slab; the streaks are a single flat colour and are the weakest of
the two, since a real streak would be graded and this one is a rectangle.

## Materials

| name                 | colour    | roughness | metalness | notes                         |
| -------------------- | --------- | --------- | --------- | ----------------------------- |
| `hangar-panel-olive` | `#58624d` | 0.9       | 0         | variant 0                     |
| `hangar-panel-grey`  | `#8b887d` | 0.9       | 0         | variant 1                     |
| `hangar-panel-faded` | `#626753` | 0.9       | 0         | variant 2                     |
| `hangar-door`        | `#54594d` | 0.85      | 0.2       | leaves, ribs, and track       |
| `interior-dark`      | `#2b2724` | 1         | 0         | floor, back panel, cockpit    |
| `concrete-base`      | `#797762` | 1         | 0         | apron                         |
| `rust-streak`        | `#8e5142` | 0.9       | 0         | the two streaks               |
| `airframe-fabric`    | `#74765c` | 0.95      | 0         | flat, the parked plane's skin |
| `airframe-trim`      | `#54594d` | 0.85      | 0.2       | cowl, struts, spinner         |
| `prop-timber`        | `#594332` | 1         | 0         | prop blades, tail skid        |
| `tyre-rubber`        | `#2b2724` | 1         | 0         | the wheels                    |

10 live materials per variant (5 building + 5 aircraft, with `interior-dark` shared). The building
materials are unchanged from the first draft; the aircraft's are all palette rows (`#74765c` from
the foliage/military greens, `#594332` from soil/timber, muted metal and rubber).

## Variants

| variant | panel           | doors    | width  |
| ------- | --------------- | -------- | ------ |
| 0       | olive `#58624d` | open     | 27.9 m |
| 1       | grey `#8b887d`  | **shut** | 24.6 m |
| 2       | faded `#626753` | open     | 27.9 m |

Variant 1 is the strong one and it is not about colour. A hangar with its doors shut is a
different building from one standing open — it is intact, secured, and closed off, where open means
either abandoned or still in use. That is the batch's "state over finish" pattern again, and here
it also happens to be the variant that changes the footprint.

Variants 0 and 2 are geometrically identical and differ only in panel tone.

## Door ribs

Four ribs per leaf, 0.16 m wide, standing 0.14 m proud of the leaf face. Eight meshes for the pair.

Without them a 6.9 × 6.9 m slab has nothing to read as. With them it reads as a sliding hangar door,
which is a specific and recognisable object. The rib offsets are derived from the leaf's own x, so
they follow the leaf whether it is open or shut — which is why the shut variant still looks right
after the position fix.

## Complexity

**51 meshes, ~864 triangles, 10 live materials** — for a 28 m building and its aircraft.

The revision took it from 33 meshes / ~396 triangles: the four closure prisms, the header strip,
and the 18-mesh aeroplane. It is still the best value in the batch by footprint: the building
itself is large flat boxes, and the arch being seven boxes rather than curved geometry is most of
the reason.

## What reads well

- **Far:** the faceted arch. A 24 m span with a curved crown is unmistakable as an aircraft hangar
  from a very long way off, and the faceting makes it read as deliberate at any distance.
- **Near:** the open leaves on their track, the ribbed door faces, the cladding bands, the dark
  17.8 m interior — and now the aeroplane silhouette inside it.

## Unresolved questions

- **The collider seals the 14 m opening** — the batch's most consequential instance of this issue.
- **The interior is a floor, a back panel, and one parked plane.** A gantry, scaffolding, or
  crates would deepen it, but the requested occupant is in.
- **The plane is indicative, not modelled in detail** — no engine cylinders, no cockpit glazing,
  no markings. At the play distances through a 14 m opening that reads correctly, but a close
  inspection mode would want more.
- **The rust streaks are flat rectangles**, which is the weakest detail in the model.
- **No hangar markings on the apron** — no approach lines, no aircraft silhouette, no numbers.
- **No side doors.** A hangar has a personnel door beside the main one, and its absence at this
  scale is noticeable.
- **The arch has no internal structure** — no trusses, no ribs visible through the opening. From
  outside the arch is opaque so this does not matter, but a 24 m clear span implies a lot of
  structure, and if the interior is ever lit, an empty arch will look wrong.
- **Variants 0 and 2 are identical geometry**, so the third variant is largely wasted.
- **No damaged or burned state**, which is the obvious missing variant for a military building in
  this world.
- At 51 meshes / 864 triangles a damaged variant with a hole in the arch and daylight through it
  is well within budget, and would be far more interesting than a third olive.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built and rendered in headless Chromium with the project's three.js; bounds
  measured **vertex-accurately** (world-space vertices) and confirmed inside the declared
  `dimensions`; `minY` 0.
- **The gable closures confirmed by render from front, rear, three-quarter, and interior views**,
  and by raycast probes whose face normals point outward at both ends; the header strip replaces
  the old spearing lintel and follows the arch underside.
- **Leaf-to-arch clearance verified by arithmetic**: the parked leaf top (5.3 m) clears the arch
  underside at every x from the park position to the wall line (5.7 m at x = 12).
- The 14 m opening confirmed as a real 17.8 m deep void, and the shut variant confirmed to cover
  x -6.95..6.95.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights, no `NaN` positions.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- **Viewed in WebGL renders** (not yet in the game engine). Seven-segment arch reads correctly.

## Licensing

Original work. No external assets, textures, or references used.
