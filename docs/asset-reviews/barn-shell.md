# Barn Shell — asset review

Asset ID: `barn-shell` · Category: `building` · Status: **Approved by owner**
Source idea: `ASSET_IDEAS.txt` #19, "Forest and rural"

## Purpose and intended placement

A broad rural building with sliding doors, faded siding, and a broken roof section. Expected
alongside the grain silo (#18), the wind pump (#20), and the timber stacks (#15) — the four of them
together are a farmstead.

## Revision: the roof was turned 90 degrees (owner feedback)

The first draft built each roof plane as a **full-width slab rotated about X**, so the roof shed
toward the gable ends while the gable triangles and the building's proportions described a ridge
running along Z — the whole roof was this barn's roof turned a quarter turn. The ridge cap ran
across the slope instead of along it, and the slope constants (4.7 m of run against a 6 m
half-width, apex 0.4 m above the gable apex) never described the wall line at all.

The roof is rebuilt as two proper gable planes: each one slab rotated about Z by the slope angle,
centred on the slope line from the ridge (x = 0, now 7.2 m) to 0.15 m past the eaves at x = ±6,
with a 0.3 m overhang at each gable end. The ridge height is chosen so the planes spring from the
wall top (5.1 m) and meet the gable apexes exactly; the old RIDGE of 6.4 m sat 0.4 m below them.
The ridge cap now runs along Z. The lost 3.4 m section is a hole along the ridge on the right
plane (x > 0), keeping its three exposed rafters and gaining a parallel dark under-panel so the
hole shows a shadowed roof space; the left plane is intact.

Measured (vertex-accurate): **12.64 × 7.45 × 12.30 m**. Declared `dimensions` updated to
12.8 × 7.5 × **15.0** — the old z of 12.3 had clipped the fallen roof piece all along (it reaches
z = 7.45, and the footprint is asymmetric about the pivot).

**Previewed in WebGL renders** (headless Chromium against a standalone three.js page built from
the emitted module): front, side, three-quarter, and top-down views confirm both planes spring
from the ridge, the cap runs along it, and the hole reads as rafters over a dark under-panel.

## Dimensions and scale

- Declared `dimensions`: 12.8 × 7.5 × 15.0 m (see the revision above for the z correction)
- Measured (vertex-accurate, all variants identical): 12.64 × 7.45 × 12.30 m
- 12 m wide, 9 m deep, 5.1 m to the wall top, 7.2 m to the ridge. **3.5 scout heights.**
- The width-to-height ratio of roughly 2:1 is what makes it read as a **broad** barn rather than a
  gable house, which is the idea's word.
- The footprint depth beyond the building is mostly the fallen roof section, which reaches to
  z = 7.45 — about 3 m out from the front wall. The building itself is 9 m plus overhang.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the gable end with the sliding door** — the only
end with any detail on it. The back gable is blank.

## Collider proposal

`center {0, 3.2, 0}`, `size {12, 6.4, 9}`.

**This collider covers the sliding door opening, so the barn is not enterable.** The opening is
genuinely there — see below — and the player is blocked by it.

This is now the **third** candidate with a visually open entrance sealed by a single box:

| candidate    | opening                            | blocked? |
| ------------ | ---------------------------------- | -------- |
| ranger cabin | 1.1 × 2.1 m doorway, 3.2 m deep    | yes      |
| sawmill      | 5 × 4.2 m loading bay, 9.4 m deep  | yes      |
| barn shell   | 1.3 m sliding door gap, 8.7 m deep | yes      |

Three is enough to call this a batch-level limitation rather than three separate notes. The fix is
either multiple colliders per asset, or a "doorway" concept the placement system can subtract from
a solid box. Until one exists, these three assets are described honestly in their sheets as having
**real, visible openings the player is blocked by**.

## The sliding door is genuinely slid open, and you can see 8.7 m in

The opening is 3.6 m wide, centred at x = 0. The door panel is 3.2 m wide, centred at **x = +1.1**,
standing 0.1 m proud of the wall on its track — so it covers the right 2.3 m of the opening and
overhangs onto the pier, leaving **1.3 m clear on the left**.

Verified by raycasting in from the front at y = 1.5:

| ray x            | first hit                      | z         |
| ---------------- | ------------------------------ | --------- |
| -1.6             | `interior-dark`                | **-4.20** |
| -1.0             | `interior-dark`                | **-4.20** |
| -0.3             | `door-timber` (the panel)      | 4.66      |
| 0.5              | `door-timber`                  | 4.66      |
| 1.5              | `door-timber`                  | 4.66      |
| 5.0              | `barn-siding-red` (front pier) | 4.50      |
| y = 4.4 (lintel) | `barn-siding-red`              | 4.50      |

The rays at x = -1.6 and -1.0 pass the opening and travel **8.7 m** to the dark interior panel on
the back wall. The rays inside the door panel's span stop at the panel. That is a door that is
open by 1.3 m, and the geometry proves it.

The panel standing proud on a track, with three visible hangers and a 6.2 m rail above it, is what
makes it read as _sliding_ rather than hinged. That is the idea's word and it took 5 meshes.

## The broken roof section is a real hole

The left plane (x < 0) is intact. The right plane is split into two pieces with a **3.4 m gap**
between them at z -1.7..1.7, spanned by three exposed rafters, with a dark under-panel set below
the plane so the gap shows a shadowed roof space rather than the sky through the barn.

The fallen roof section lies on the ground in front at z = 6.3, rotated. It is 1 mesh and it is what
turns "a hole in a roof" into "this building is falling apart".

## Faded siding: seven shallow boxes

Three plank bands down each side wall and one across the front gable, each a 0.22 m box standing
0.04 m proud. That is the whole board-and-batten read, for 7 meshes, and it is the cheapest way to
stop a 12 × 9 m shed reading as a plain box.

## The gable helper, for the third time

The triangular-prism helper is duplicated for the **third** time. The row house review sheet set
the threshold: three copies is past the point where copying is defensible. This is that third
copy, and the barn is the asset that made it necessary — a barn without a gable reads as an
outbuilding, and the sawmill (#14) and picnic shelter (#17) both chose mono-pitch roofs specifically
to avoid it.

**Recommendation: lift `makeGable` into a shared module before any of these five candidates is
integrated.** Three copies of the same 20-line function across three files is a maintenance hazard,
and a fourth idea wanting a gable should not add a fifth.

## Variants

| variant | siding              |
| ------- | ------------------- |
| 0       | faded red `#9b624d` |
| 1       | grey `#8b887d`      |
| 2       | brown `#8e5142`     |

Siding tone only — all three are geometrically identical, 33 meshes and 388 triangles each.

**The damage is constant in all three**, same as the row house and ranger cabin: the broken roof and
the open door are this asset's identity, not a variant axis. There is no intact barn, so a world
generator currently cannot place a barn that is not derelict.

## Materials

| name                | colour    | roughness | metalness | notes                           |
| ------------------- | --------- | --------- | --------- | ------------------------------- |
| `barn-siding-red`   | `#9b624d` | 1         | 0         | variant 0                       |
| `barn-siding-grey`  | `#8b887d` | 1         | 0         | variant 1                       |
| `barn-siding-brown` | `#8e5142` | 1         | 0         | variant 2                       |
| `barn-roof`         | `#514f49` | 0.95      | 0         | flat, slabs, cap, fallen piece  |
| `timber-board`      | `#655744` | 1         | 0         | rafters, track, hangers, handle |
| `door-timber`       | `#4b4035` | 1         | 0         | the sliding panel               |
| `interior-dark`     | `#2a251f` | 1         | 0         | floor, back panel, loft         |
| `stone-base`        | `#797762` | 1         | 0         | footing course                  |

6 live materials per variant.

## Complexity

33 meshes, ~388 triangles, 6 materials. **Cheaper in triangles than the 7 m row house** despite
being 1.7× the footprint, because it is almost entirely large flat boxes. That is the right trade
for a broad rural building.

The door assembly is 5 of the 33 meshes, and it earns all five.

## What reads well

- **Far:** the wide low gable, the ridge, and the hole in the front slope. The 2:1 proportion is the
  whole read.
- **Near:** the sliding door and its track, the exposed rafters, the plank bands, the fallen roof
  piece, the footing.

## Unresolved questions

- **The collider blocks the door opening**, as discussed — the third instance of this.
- **The gable helper is duplicated three times** and should be lifted to a shared module.
- **No intact variant**, so no healthy barn. For a rural building that is the most likely state in
  a living world.
- **The broken roof is identical in all variants.** A partially collapsed barn, or one where the
  hole is bigger, would give the generator range.
- **The interior is a floor and a back panel.** No hay bales, no stalls, no partition walls. The
  8.7 m depth is real but empty.
- **No hay door or upper loft door**, both of which a barn of this shape would have. The sliding
  door is at full height instead, which is more of a machinery shed.
- **The door is 3.7 m tall in a 3.8 m opening**, leaving a 0.1 m slot above it. That is realistic
  for a track door and reads as a gap, but it was a coincidence of the numbers rather than a
  decision.
- **The gable ends above the eaves are untextured** — no vent, no louvre, no hay door.
- The siding bands are on the side walls and the front gable only; the back is bare. Barely
  visible, but inconsistent.
- The footing is a plain 0.4 m band. A rammed-earth or stone plinth would suit a barn better.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built and rendered in headless Chromium with the project's three.js; bounds
  measured **vertex-accurately** (world-space vertices, not transformed AABB corners, which
  over-estimate rotated meshes) and confirmed inside the declared `dimensions`; `minY` 0.
- **Roof orientation confirmed by render** from front, side, three-quarter, and top-down views
  after the revision: both planes spring from the ridge along Z, the cap runs along the ridge,
  and the hole shows rafters over the dark under-panel.
- Sliding door gap confirmed by raycast (8.7 m of interior depth, door panel blocking the covered
  span), front pier and lintel confirmed solid.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights, no `NaN` positions.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- **Viewed in WebGL renders from five angles** (not yet in the game engine).

## Licensing

Original work. No external assets, textures, or references used.
