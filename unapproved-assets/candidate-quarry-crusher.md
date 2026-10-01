# Quarry Crusher — candidate review

Draft ID: `candidate-quarry-crusher` · Category: `landmark` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #40, "Port, mountain, and industrial areas"

## Purpose and intended placement

A blocky aggregate crusher: a stepped feed hopper over a jaw body with a bolted front plate and a
flywheel, a side hopper and feed chute, an inclined conveyor on a lattice tower discharging over a
stepped rubble stockpile, and a discharge chute under the jaw. Intended in a quarry, a works yard,
or beside a haul road.

## Dimensions and scale

- Declared `dimensions`: 7.5 × 8.2 × 11.7 m
- Measured (vertex-accurate): 7.41 × 8.13 × 11.68 m (variant 0), 9.08 m deep (variant 1), 7.58 m
  deep and 7.64 m tall (variant 2)
- Hopper rim at 5.6 m, boom tip at 6.0 m, tower cap at 7.5 m. **3.7 scout heights** — slightly
  taller than a player, so the feed hopper is not reachable from the ground.

## Pivot and front direction

Ground at y = 0, origin at the centre of the machine's base frame. **+Z is the front**: the
discharge chute and the stockpile are on +Z, the conveyor discharges toward the player over the
pile. The side hopper is on −X, the conveyor tower on −Z.

The asset is not centred on its own bounds in Z (−2.59 to 9.08) because the stockpile is what the
boom is for, and the pile should be inside the placement's footprint.

## Collider proposal

`center {−0.7, 2.1, −0.4}`, `size {6.0, 4.2, 4.0}` — the jaw body, the hoppers and the base frame.

The conveyor boom is 6 m up and the tower columns are open lattice, so the player can walk under
the boom and around the tower. Same open-underneath trade as the crane and the wind pump, and here
it is valuable: walking under a raised conveyor is the good version of this prop.

## Interaction points

| id              | label                  | position   |
| --------------- | ---------------------- | ---------- |
| `crusher-feed`  | Crusher Feed Hopper     | 0, 0, 2.2 |

At the chute discharge, clear of the collider. Reads as an output or salvage point.

## Materials

| name             | colour    | roughness | metalness | notes                          |
| ---------------- | --------- | --------- | --------- | ------------------------------ |
| `crusher-frame`  | `#54594d` | 0.85      | 0.3       | flat shaded, frame and tower   |
| `crusher-paint`  | `#9b624d` | 0.9       | 0.15      | jaw body, motor, head chute    |
| `crusher-plate`  | `#64675d` | 0.8       | 0.35      | hopper panels, chute, skirts   |
| `crusher-dark`   | `#292f2b` | 0.9       | 0.25      | flywheel, pulleys, rear plate  |
| `crusher-rubble` | `#797762` | 1         | 0         | load, belt lumps, stockpile    |
| `crusher-belt`   | `#3a3a34` | 0.95      | 0.05      | conveyor belt                  |
| `crusher-hazard` | `#d9b56e` | 0.75      | 0.05      | control plate, marker cone     |

7 materials. `crusher-hazard` is the amber signal and it appears in only two places: a 0.5 × 0.35
plate on the control cabinet and one marker cone.

## Variants

| variant | conveyor | stockpile | hopper load |
| ------- | -------- | --------- | ----------- |
| 0       | full     | at boom tip, full | loaded |
| 1       | full, **shortened** (tip at 4.6 m) | at the new tip, full | loaded |
| 2       | **removed**, blanking plate on the tower cap | at the chute, small | loaded |

Variant 2 is the strong one: without the boom the machine loses 2.6 m of height and 4.1 m of depth,
and the stub discharge with a bolted blank reads as a crusher that has been stripped. The stockpile
moves to the chute so the yard still has an output.

## Complexity

143 meshes / 1950 triangles (v0 and v1), 97 / 1350 (v2). 7 materials.

The mesh count is driven by the rubble: 27 individual chunks across the hopper load, the side
hopper, the belt and the pile, each placed from a fixed size sequence at a fixed angle. The chunks
are 8–12 triangles each, so the triangles are cheap even though the mesh count is not. If a
placement ever needs this asset instanced, the `addRubble` helper is the first thing to instance.

## What reads well

- **Far:** the stepped hopper over a coloured body, with a raised conveyor arm and a pale stockpile
  at its tip. The three-part silhouette (funnel / body / arm) is unmistakable.
- **Near:** the bolted jaw plate, the flywheel and its belt guard, the side hopper and its angled
  feed chute, the lattice tower with its diagonals, and the head and tail pulleys under the boom.

## Rework after the first preview

- **A full-width dust shroud sat over the feed hopper** and read as a lid, hiding the funnel that
  gives the machine its name. It is now a rear dust plate only, vertical, behind the hopper.
- **The boom read as one solid black wedge** because the belt and the skirts were the same value
  and the same width. The belt is narrower, the skirts are the frame colour rather than the plate
  colour, and the head chute picked up the paint material so the end of the boom is a distinguishable
  object.

## Unresolved questions

- The conveyor is frozen at its angle; nothing turns, and the belt and pulleys are static. Same
  limitation as the crane and the wind pump.
- The hopper "funnel" is four rotated slabs rather than a real frustum, so the interior is visible
  through the corners at close range. The load hides most of it.
- The stockpile is two 7-sided cylinders. It reads as a pile from any distance and as a cone from
  none.
- No crusher dust, no spilled fines on the ground beyond the pile, no tyre marks. The asset sits on
  a bare plane.
- The ladder up the tower has six rungs and no fall protection, which is exactly what a stripped
  machine would have, but it is not obviously intentional.
- Variant 1 shortens the boom by rotating it, which also drops the head pulley; check that the belt
  lumps and the head chute still sit on it after any future change to the boom constants.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 (the discharge chute was re-seated
  after measurement put its lower corner 0.18 m below ground).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view, variants
  0 and 2. The shroud-over-hopper and solid-wedge boom were both confirmed visible in the first
  build and confirmed corrected in this one. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
