# Transit Shelter — asset review

Asset ID: `transit-shelter` · Category: `prop` · Status: **Approved by owner**
Source idea: `ASSET_IDEAS.txt` #09, "City and suburbs"

## Purpose and intended placement

A bus-stop shelter with a cracked side panel, a bench, and a weathered route sign. Small enough to
be scattered along a suburban road, and — unlike almost everything else in this batch — meant to be
**stood inside**. The player shelters from weather in it, which is what makes it worth a prop's
mesh budget at all.

## The collider is the interesting decision here

`center {0, 1.05, -0.6}`, `size {3.5, 2.1, 0.3}` — **the back panel only.**

Every other candidate in this batch has a collider that is a compromise between accuracy and what
one box can express. This one is different, and the difference is the point:

- A single box covering the whole footprint (3.5 × 2.1 × 1.5) would make the shelter **unusable**.
  The player would be blocked out of the one space the asset exists to provide. That is not a
  compromise, it is the asset failing at its job.
- So the collider is a thin slab at the back panel, and the player is free to stand in the
  interior volume (roughly x -1.75..1.75, z -0.45..0.75).
- **The cost:** the side glazing and the front are not solid, so the player can walk straight
  through the side panels. That is accepted deliberately — walking through a bus shelter's side
  glass is a much smaller lie than a shelter the player cannot enter.

Verified: a ray straight down through the middle of the shelter at (0, 8, 0) hits **only the roof**
at y = 2.56. Nothing solid occupies the standing space. The bench is behind that point, at z = -0.42.

## Dimensions and scale

- Declared `dimensions`: 3.9 × 2.7 × 2.0 m
- Measured: 3.80 × 2.61 × 1.90 m (variants 0/1), 3.86 × 2.61 × 1.90 m (variant 2)
- 3.6 m wide internally, 2.45 m to the underside of the roof. A real bus shelter, and about 1.2
  scout heights — deliberately low, so it reads as street furniture and not as a building.
- The z extent (1.9 m) is the roof; the shelter body is 1.5 m deep.
- Variant 2 is 6 cm wider only because of the leaning panel described below.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the open front, facing the road.** The back
panel and bench are on -Z. The route sign faces +Z, so a placement's `rotationY` aims the sign at
the approaching road.

## Interaction points

| id              | label         | position   |
| --------------- | ------------- | ---------- |
| `shelter-bench` | Shelter Bench | 0, 0, -0.1 |

Just in front of the bench, inside the shelter, clear of the collider. Reads as a sit / rest point,
which is the natural use of a shelter.

## Materials

| name           | colour    | roughness | metalness | notes              |
| -------------- | --------- | --------- | --------- | ------------------ |
| `frame-green`  | `#59635b` | 0.8       | 0.25      | variant 0          |
| `frame-olive`  | `#54594d` | 0.8       | 0.25      | variant 1          |
| `frame-grey`   | `#64675d` | 0.8       | 0.25      | variant 2          |
| `panel-solid`  | `#797762` | 1         | 0         | kick panels        |
| `panel-glass`  | `#78908b` | 0.28      | 0.05      | glazing and shards |
| `bench-timber` | `#514437` | 1         | 0         | seat and backrest  |
| `sign-board`   | `#aaa18f` | 0.9       | 0         | route sign         |
| `trim-dark`    | `#444943` | 0.9       | 0         | sign trim          |

4 live materials in variant 1, 6 in variants 0 and 2 (variant 1 has no sign, so `sign-board` is
unused).

**No emissive materials at all**, which is unusual for this batch. The route sign is a blank pale
board: it is meant to read as a sign panel from a distance, and putting a glow on it would make it
the brightest thing on a suburban street. Numerals and route text are texture work, and this
runtime builds geometry, not textures — the same reasoning as the apartment entrance's number
plate.

## Variants

| variant | frame           | sign   | extra                             |
| ------- | --------------- | ------ | --------------------------------- |
| 0       | green `#59635b` | yes    | —                                 |
| 1       | olive `#54594d` | **no** | —                                 |
| 2       | grey `#64675d`  | yes    | loose glass panel leaning outside |

Variant 1 losing its sign is the useful one: a shelter with no sign still reads as a shelter, and
it gives a world generator a way to place stops that have lost their signage.

Variant 2's leaning panel is litter — a torn-off piece of glazing propped against the -X side. It
is the only thing that changes the bounding box, adding 6 cm to x.

**The cracked side panel is in every variant**, because the idea states the shelter _has_ a cracked
panel. It is a structural feature of the asset, not a damage axis.

## The cracked panel is a real gap

The +X side glazing is built as **two segments with a real gap** between them, plus an offset shard:

- `rightLower` covers z -0.65..-0.15
- `rightUpper` covers z 0.23..0.65
- the gap is z -0.15..0.23, with a tilted shard standing in part of it

Verified by raycasting inward from +X at z = 0.0: the first hit is the shard at x = 1.61, and the
second is the **far** (-X) panel at x = -1.61. The ray passes cleanly through the gap between the
two +X segments. It is a hole in the geometry, not a dark decal.

## Kick panels

Each glazed face has a 0.5 m solid panel below the glass. That is 3 extra meshes, and they stop the
shelter reading as a floating glass box — without them the whole thing is four posts and some
transparent panels, which disappears from the side.

## The roof tilt is 0.05 rad and that is all it needs

A shallow tilt drops the front edge, which stops a 3.8 × 1.9 m flat slab from reading as a lid.
The front fascia is a separate 0.2 m band so the roof has a visible edge line. Together that is
2 meshes and it does the work of most of the silhouette.

## Complexity

22 meshes / ~264 triangles (variant 0), 18 / ~216 (variant 1), 23 / ~276 (variant 2). 4–6
materials. The lightest building-scale object in the batch after the fire escape, and cheap for
something the player can stand inside.

## What reads well

- **Far:** the roof line and the glazed box. The sign helps, but the silhouette carries it.
- **Near:** the cracked panel and its shard, the bench slats, the kick panels, the frame corners.

## Unresolved questions

- **The walk-through side panels are a known lie.** Accepted, but if the runtime ever supports
  multiple colliders this becomes three thin boxes (back + two sides) with no downside, and the
  shelter would stop being permeable.
- **No lighting.** A shelter is exactly where a light would go, and this asset deliberately has
  none. If the street light's `PointLight` approach is extended, a shelter with a lit underside
  would be a strong candidate — and would inherit the same per-placement light budget question.
- **The bench is a solid slab**, with no slat gaps. At 2.6 m long that reads fine, but it is a
  candidate for 5–6 thin slats if close-up quality matters.
- **The sign is blank.** It is the shelter's main identity feature and it currently carries no
  information. Geometry-built numerals are possible but would cost more than the rest of the model
  combined.
- No timetable case, no litter bin, no advertising panel, no drainage or a puddle under it. The
  last one would be the cheapest possible way to make it feel like a real bus stop.
- The roof has no drainage fall or gutter, and variant 2's loose panel is the only "weathering"
  beyond the missing sign and the cracked glass.
- 3.6 m of internal width with a central bench means the player can stand on either side, which is
  correct. Nothing in the collider prevents that, which was the point.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured and confirmed inside the declared
  `dimensions`; `minY` 0.
- Standing space confirmed clear by raycast: only the roof is hit looking down at (0, 8, 0).
- The cracked panel gap confirmed by raycast passing through to the far panel.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights (checked explicitly).
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Whether the shelter is comfortable to stand in, and
  whether the walk-through sides feel wrong in play, are both judgement calls that need a real
  look.

## Licensing

Original work. No external assets, textures, or references used.
