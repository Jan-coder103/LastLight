# Barn Shell — candidate review

Draft ID: `candidate-barn-shell` · Category: `building` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #19, "Forest and rural"

## Purpose and intended placement

A broad rural building with sliding doors, faded siding, and a broken roof section. Expected
alongside the grain silo (#18), the wind pump (#20), and the timber stacks (#15) — the four of them
together are a farmstead.

## Dimensions and scale

- Declared `dimensions`: 12.8 × 7.1 × 12.3 m
- Measured: 12.70 × 6.92 × 12.18 m, identical across all three variants
- 12 m wide, 9 m deep, 4.7 m to the eaves, 6.4 m to the ridge. **3.3 scout heights.**
- The width-to-height ratio of roughly 2:1 is what makes it read as a **broad** barn rather than a
  gable house, which is the idea's word.
- The 12.18 m depth is mostly the fallen roof section, which reaches to z = 7.45 — 3 m out from
  the front wall. The building itself is 9 m plus overhang.

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

The back slope is intact. The front slope is split into two pieces with a **3.4 m gap** between them
at x -1.6..1.8, spanned by three exposed rafters, with a dark loft panel behind so the gap shows a
space rather than the inside of the far wall.

Verified looking down through the gap: the ray hits `timber-board` at y = 5.45 (a rafter) then
`interior-dark` at y = 4.46 (the loft). No roof slab is hit, which is the point.

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
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0 after raising the fallen roof piece.
- Sliding door gap confirmed by raycast (8.7 m of interior depth, door panel blocking the covered
  span), front pier and lintel confirmed solid, and the roof hole confirmed by a downward raycast
  hitting a rafter then the loft.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Whether the 2:1 proportion reads as "broad barn" is the
  design premise and it needs a real look.

## Licensing

Original work. No external assets, textures, or references used.
