# Last Light

A single-player survival and extraction game about scavenging a zombie-overrun region and making it back to a safe camp. Built with TypeScript and Three.js.

Explore six seeded environments, fight or evade a growing horde, search enterable buildings, and decide what is worth carrying to extraction. Between runs, manage a walkable survivor camp with shops, storage, upgrade services, lookout towers, and a waiting helicopter.

## Highlights

- Three camera views: third person, top-down, and first person.
- Seeded maps with four orientations and six connected region themes.
- A scalable horde with distant dormant enemies, noise awareness, and up to 10,000 tracked agents.
- Persistent shaped inventory shared between camp and missions; extraction saves carried gear, while death puts it at risk.
- Enterable, repeatable building interiors, weather and lighting presets, and authored low-poly environments.

## Run the game

Install [Node.js](https://nodejs.org/) 22.12+ (or 20.19+) and npm 10+, then run:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite in a desktop browser with WebGL2 support.

## Quick controls

Move with **W/A/S/D**. In top-down view, right-click to move and left-click to attack or interact. In perspective views, use the mouse to aim; drag-to-look is available when pointer lock is blocked. Press **Tab** to cycle views and **F** to interact. **Q** dashes; **W/E/R** (top-down) or **1/2/3** (perspective) use abilities. **I** opens the backpack, **G** throws a carried grenade, and **O** opens atmosphere and accessibility settings.

## Possible future additions

Possible additions include new destinations, more survivor and enemy types, a companion, and additional vehicles.

For contribution and development details, see the [developer guide](docs/development.md).
