# Wall-Mounted Medical Cabinet — candidate review

Draft ID: `candidate-medical-cabinet` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #42, "Loot, survival, and interaction props"

## Purpose and intended placement

A small steel medical cupboard fixed to a wall at 1.05 m: two brackets, a carcass, a hinged door
with a faded cross, a shelf of three bottles and a tin, and a stool with a jar in front of it. The
asset carries a short return of wall and a strip of floor so it can be dropped against any interior
surface without the building being modelled around it. Intended as a searchable cabinet in a clinic,
a school, a pharmacy or a camp hut.

## Dimensions and scale

- Declared `dimensions`: 1.9 × 2.0 × 1.4 m
- Measured (vertex-accurate): 1.90 × 2.00 × 1.34 m (variant 0), 1.14 m deep (variant 1, no stool),
  1.40 m deep (variant 2)
- Cabinet itself 0.68 × 0.86 × 0.30 m, bottom at 1.05 m. The **declared bounds are dominated by the
  wall and floor, not the cabinet** — the cabinet is 0.18 m² of a 5.3 m² box.

## Pivot and front direction

Ground at y = 0. **+Z is the room side**, i.e. the direction the door swings out into. The wall the
cabinet is fixed to is at −Z (`WALL_Z = −0.28`), so a placement pushes this against a wall face and
turns it with `rotationY` to match the room.

## Collider proposal

`center {0, 1.38, 0.02}`, `size {0.72, 0.9, 0.62}` — the cabinet carcass only.

Deliberately does **not** include the wall. Including it would make the asset a solid block from the
floor to 2 m; excluding it means a player can stand where the wall is, which is the right trade for
a 0.3 m-deep cupboard. The door is outside the collider, so a player can walk through an open door.

This collider is **floating** — it starts at y = 0.93 and the wall behind it is not solid. A player
walking into the wall will pass through both. If the game has no wall-collision story for props,
this asset needs the wall in the collider after all; that is an owner decision, flagged below.

## Interaction points

| id                 | label            | position   |
| ------------------ | ---------------- | ---------- |
| `medical-cabinet`  | Medical Cabinet  | 0, 0, 0.75 |

On the floor in front of the open door, so it is reachable whether the door is shut or not.

## Materials

| name                 | colour    | roughness | metalness | notes                            |
| -------------------- | --------- | --------- | --------- | -------------------------------- |
| `medical-cabinet`    | `#65766d` | 0.75      | 0.2       | carcass and door                 |
| `medical-frame`      | `#54594d` | 0.85      | 0.3       | brackets, hinge, handle, hasp    |
| `medical-interior`   | `#8b887d` | 0.95      | 0         | shelf, tin, skirting, rail       |
| `medical-cross`      | `#a29b88` | 0.9       | 0.05      | cross marking, one bottle        |
| `medical-glass`      | `#78908b` | 0.25      | 0.1       | window glass, jar, one bottle    |
| `medical-rust`       | `#9b624d` | 0.95      | 0.1       | tin, dent, one bottle            |
| `medical-wall`       | `#8b887d` | 0.95      | 0         | the wall return                  |
| `medical-timber`     | `#594332` | 1         | 0         | stool                            |

8 materials for a 0.68 m cabinet, which is one too many. The three bottle materials exist so the
shelf has three different objects on it, and any two of them could merge without loss. The prop
would be cheaper as a five-material asset.

## Variants

| variant | door | damage |
| ------- | ---- | ------ |
| 0       | open 1.15 rad | none |
| 1       | **shut** | none, no stool |
| 2       | open 1.55 rad, **hanging askew** | dented panel, torn corner, loose screw |

The door is on a real pivot group with a hinge post, two knuckles and a pin, so all three states are
the same object at different angles — not three different models. Variant 1's shut door is the one
that shows the cross marking, which is the whole reason the prop is recognisable at a distance.

## Complexity

33 meshes / 500 triangles (v0), 29 / 452 (v1), 36 / 544 (v2). 8 materials.

The cheapest asset in the batch by triangle count despite carrying a wall and a floor, because most
of its meshes are single quads' worth of geometry.

## What reads well

- **Far:** the green carcass with a pale cross on a dark door against a pale wall. The cross is the
  only reason to stop and look, and it is 0.3 m of surface doing that work.
- **Near:** the brackets, the hinge knuckles and pin, the three bottles and the tin on the shelf,
  the door handle and hasp, and the stool with its jar.

## Rework after the first preview

The first build was broken in a way only a render would show: **the asset faced −Z while the whole
candidate set uses +Z as the front**, so the wall it carried was between the camera and the cabinet.
The preview was a picture of the back of a plank. The whole assembly was rebuilt with the wall at
−Z and the door swinging to +Z, which is also the correct way round for a wall-mounted object.

## Unresolved questions

- **The floating collider is a real open question.** The wall and the cabinet are not collidable, so
  a player can stand inside both. Either the asset needs a wall collider (and then it becomes a
  1.9 × 2.0 × 0.2 m block, which is a different prop), or the game needs to accept that wall-mounted
  props do not collide. It should be decided before this is placed.
- The wall is 1.9 m wide and 2.0 m tall with no opening. Against a real interior it will read as a
  panel, not as a wall. It works as a standalone object and will not work composited.
- The cross is two rectangles. It reads as a cross; it will not read as a *faded* cross at any
  distance, and fading would need a texture.
- The stool is at 0.62 m off to +X, which is a light-source-of-coincidence rather than a placed
  object. A placement that already has furniture will want variant 1.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  wrong-way-round wall was confirmed visible in the first build and confirmed fixed in this one.
  Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
