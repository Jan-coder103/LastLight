# Abandoned Sawmill — candidate review

Draft ID: `candidate-sawmill` · Category: `building` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #14, "Forest and rural"

## Purpose and intended placement

A low industrial shed with a broad roof, a loading bay, and exterior machinery. Expected at the
edge of a forest, beside a track, or as the anchor of a rural work site.

It pairs with `candidate-timber-stacks` (#15): the log pile inside this shed is the same idea at a
different scale, and a world generator placing a sawmill would want a log yard next to it.

## Revision: a working mill's worth of equipment (owner feedback: "needs generally more sawmill
stuff and detail")

The first draft was a shed with a blade, a conveyor, and a stack — the sheet's own "machinery:
four things, no more" section was the gap the owner pointed at. Added, all original geometry and
palette materials:

- **A log ramp** feeding the bay from the front left: a tilted timber deck on four posts with
  three logs waiting on it, each seated on the deck surface. The mill now reads as a place logs
  move through, not just a shed with logs in it.
- **A sawdust heap** under the blade — a low 7-sided pale-tan mound (`sawdust`, `#a99e83`), the
  one new material. The cheapest possible "this machine runs" cue, and the sheet's own first
  unresolved-question suggestion.
- **Two plank stacks** beside the right wall on runner battens — the mill's output, pairing with
  the log input (`plank-timber`, `#655744`).
- **Interior machinery** the bay opening now frames: **carriage rails and a log carriage** (frame,
  back head, dogs post) on the shed floor, and a **workbench on trestles** along the right wall.
  The 9 m dark room is no longer empty.
- **A boiler** behind the shed — a horizontal rivetted shell with two bands on saddle blocks, next
  to the exhaust stack it would feed.
- **A personnel door** on the left wall, **two windows** on the right wall (`window-glass`,
  `#65766d`), and a **roof vent** — the shed now reads as worked-in rather than sealed.

Measured (vertex-accurate): **15.20 × 8.03 × 13.75 m**. Declared `dimensions` corrected to
15.4 × 8.2 × **16.5** — the additions extend the footprint to z = 8.25 in front (the ramp) while
the boiler sits at z = -5.5 behind, and the old z of 11.8 was sized before any of this existed and
is asymmetric about the pivot.

**Previewed in WebGL renders** (headless Chromium, three-quarter view and straight-on bay view
beside the scout): the ramp, heap, stacks, windows, and vent all read at both distances; the
carriage rails are visible through the bay.

## Dimensions and scale

- Declared `dimensions`: 15.4 × 8.2 × 16.5 m (see the revision above)
- Measured (vertex-accurate): 15.20 × 8.03 × 13.75 m; the z bounds are asymmetric about the pivot
  (ramp to z = 8.25, boiler to z = -5.5)
- 14 m of wall width, 10 m deep, 5.5 m to the eaves — a real small sawmill, and about 2.6 scout
  heights. Deliberately **low and wide**, which is what makes it read as industrial rather than as
  another cabin.
- The 8.03 m height is the exhaust stack, not the building (the roof top is 5.86 m).
- The 15.2 m width is the roof, which overhangs the 14 m walls by 0.6 m each side.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the loading side** — the bay, the saw, the
conveyor, and the fascia all face it. The log pile inside the shed sits directly behind the bay
opening.

## The loading bay is a real opening, ~9.4 m deep

Same technique as the ranger cabin and the apartment entrance: the front wall is assembled from
two piers and a lintel, so the bay is a hole rather than a painted rectangle.

| ray                             | first hits                                                                | z            |
| ------------------------------- | ------------------------------------------------------------------------- | ------------ |
| into the bay, x = -1.5, y = 2.0 | `shed-timber` (log end), `shed-timber`, then `interior-dark` at **-4.79** | 4.60 → -4.79 |
| through the front pier, x = 4.0 | `shed-timber` (pier face)                                                 | 5.15         |

The bay ray travels 9.4 m into the shed before hitting the dark interior panel on the back wall,
and it passes through the log pile on the way. The pier ray stops at the wall face. So the bay is
5 m wide, 4.2 m tall, and genuinely open.

## Correction: the bay is open, but the player is blocked by it

The collider below is one box covering the whole shed, so it covers the 5 m loading bay as well. The
bay is geometrically open — the raycast above proves it, and the log pile is visible 9.4 m in — but
the player cannot walk into it.

`candidate-ranger-cabin` has the same problem with its doorway, and `candidate-barn-shell` has it
with its sliding door gap. Three candidates with visibly open entrances sealed by a single box makes
this a batch-level issue rather than three separate notes.

The log pile still earns its place inside the bay: it is covered by the collider, so the player
cannot walk through the logs. That part works. Only the walking-in does not.

## The log pile is inside the bay on purpose

The seven logs sit on the shed floor at z 0.4–2.6, directly behind the opening, where they are
visible through it and **covered by the shed's single collider**.

That is the one clever bit of the collider. The alternative was to stack logs outside the bay,
which would need a second collider box that the contract does not support, and would make the
"loading bay" read as "logs in the doorway". Putting the pile inside means the shed's box does
double duty.

## Collider proposal

`center {0, 2.7, 0}`, `size {14, 5.4, 10}` — the shed walls only.

**Not covered:** the saw blade, the conveyor and its legs, and the exhaust stack outside. Those are
not solid, and the conveyor is a large object the player will walk through. Same multiple-boxes
caveat as every other collider compromise in the batch. Given the shed is a building the player
would mostly be kept out of anyway, this is the least costly of the compromises so far.

## Interaction points

| id            | label       | position     |
| ------------- | ----------- | ------------ |
| `loading-bay` | Loading Bay | -1.5, 0, 6.2 |

In front of the bay, clear of the collider. The obvious salvage point, and it matches the
building's one open feature.

## Materials

| name               | colour    | roughness | metalness | notes                                  |
| ------------------ | --------- | --------- | --------- | -------------------------------------- |
| `shed-timber`      | `#514437` | 1         | 0         | variant 0                              |
| `shed-timber-dark` | `#4b4035` | 1         | 0         | variant 1                              |
| `shed-timber-worn` | `#594332` | 1         | 0         | variant 2                              |
| `roof-sheet`       | `#626753` | 0.95      | 0         | flat, broad roof, fascia, vent         |
| `interior-dark`    | `#2a251f` | 1         | 0         | floor, inner wall faces                |
| `machine-frame`    | `#54594d` | 0.85      | 0.2       | saw frame, conveyor, stack, boiler, rails |
| `saw-blade`        | `#64675d` | 0.55      | 0.35      | the band saw blade                     |
| `stone-base`       | `#797762` | 1         | 0         | footing course                         |
| `window-glass`     | `#65766d` | 0.3       | 0.05      | the two side windows                   |
| `sawdust`          | `#a99e83` | 1         | 0         | the heap under the blade               |
| `plank-timber`     | `#655744` | 1         | 0         | plank stacks, bench top and trestles   |

8 live materials in variant 2 (the missing blade drops `saw-blade`), 9 otherwise.

`saw-blade` at metalness 0.35 is the **most metallic surface in the entire batch** — everything
else sits at 0.2–0.25 or lower. That is a deliberate exception for a bare steel blade and it is
still within the "mildly metallic" guidance.

## Variants

| variant | timber    | saw blade               |
| ------- | --------- | ----------------------- |
| 0       | `#514437` | present                 |
| 1       | `#4b4035` | present                 |
| 2       | `#594332` | **missing, frame only** |

Variant 2 is the meaningful one: the blade is gone and only the frame remains, which reads as a
stripped site rather than a colour change. It drops the asset to 66 meshes and 8 live materials.

The roof is deliberately **flat**, not pitched. A gable would need a triangular-prism helper (the
third copy the row house review sheet warns about), and a broad flat roof with a deep overhang is
both the cheaper and the more industrial-looking answer.

## Machinery: the yard reads as worked

The first draft had four things (blade, conveyor, stack, log pile). The revision adds the ramp,
sawdust heap, plank stacks, interior carriage and bench, boiler, door, windows, and vent listed
above, so the mill now has an input (log ramp and pile), a process (blade, carriage rails,
boiler), an output (plank stacks), and its debris (sawdust). There is still no engine detail, no
control panel, and no water line — at this budget the machinery is a silhouette read, not a
mechanism, and that is stated rather than implied.

## Complexity

67 meshes, ~1068 triangles, 8–9 materials. Up from 27 / ~476 with the revision's additions — the
ramp, stacks, carriage, bench, boiler, and dressing cost 40 cheap meshes, almost all large flat
boxes. Still cheaper per footprint than the crashed car by a wide margin.

## What reads well

- **Far:** the broad flat roof with its deep overhang, the exhaust stack, and the log ramp with
  its waiting logs. The wide low proportion is the read.
- **Near:** the dark bay opening with the log pile and carriage rails inside it, the sawdust heap,
  the saw blade, the conveyor, the plank stacks, the windows.

## Unresolved questions

- **The conveyor, saw, stack, ramp, and boiler are not solid.** The conveyor in particular is a
  1.5 × 5.2 m object the player will walk through. Acceptable here more than elsewhere, because
  the shed body already keeps the player out of the interesting space.
- **The blade is a plain disc.** No teeth, no guard, no frame detail. At 0.35 metalness it will
  catch light, which is most of what it needs to do.
- **Only the timber tone and the blade vary.** There is no collapsed-roof state, which is the
  obvious "abandoned" read for an industrial building, and no state where the building has burned.
- **The log pile duplicates `candidate-timber-stacks`.** Seven cylinder logs here versus a
  nine-log pile module. Worth deciding whether the sawmill should reference the pile candidate
  instead of carrying its own, though at integration time they would be separate meshes anyway.
- The roof overhangs 0.8 m at the front and 0.6 m at the sides, which is a lot of unsupported
  roof on a 15 m span. It reads fine and a purist would want a beam.
- The plank stacks echo `candidate-timber-stacks` even more directly than the log pile does; same
  decision applies.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built and rendered in headless Chromium with the project's three.js; bounds
  measured **vertex-accurately** (world-space vertices) and confirmed inside the declared
  `dimensions`; `minY` 0.
- Loading bay opening and depth confirmed by raycast (9.4 m to the interior panel), and the front
  pier confirmed solid.
- **Revision additions confirmed by render** (three-quarter and straight-on bay views): the ramp
  logs rest on the deck, the heap reads at both distances, and the carriage rails are visible
  through the bay.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights, no `NaN` positions.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- **Viewed in WebGL renders** (not yet in the game engine).

## Licensing

Original work. No external assets, textures, or references used.
