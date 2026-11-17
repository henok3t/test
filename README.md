# The Ladder of Abba Moses

A 3D platformer about St. Moses the Ethiopian, the robber who became a desert father.
The climb is modelled on *The Ladder of Divine Ascent*: each stage has its own place, time of day and mechanic,
and each mechanic is a virtue the player practises before the ending names it.

| Stage | Time | What you do | Rung |
|---|---|---|---|
| The Gorge | night | break chests, carry gold, find it too heavy to climb with, lay it down | Repentance |
| The Desert Road | dawn | bow under the thorn snares, kneel through the wind | Humility |
| Scetis | morning | carry water from the well to three elders, who build you a stair | Mercy |
| The Narrow Bridges | dusk | kneel before the raiders (or feed them) until they become brothers | Forgiveness |
| The Cell | starlight | kneel in stillness until a path of light appears | Prayer |
| The Summit | sunrise | the sword is offered back; do not take it | Love |

Falling never ends the game: you get up where you last stood.

## Run it

```
npm install
npm run build      # writes dist/game.js and dist/index.html (the whole game in one file)
```

Then open `index.html` in a browser (no server needed), or `npm run dev` for a watching dev server.

## Controls

- Move: WASD / arrow keys. Jump: Space. Kneel: Shift (hold). Give: G. Strike: X. Look: drag.
- Phones and tablets: the lower-left of the screen is a stick that centres under your thumb; JUMP, KNEEL, GIVE (and STRIKE when it applies) are on the right; drag anywhere else to look. Works in portrait and landscape.
- If the frame rate is low the game lowers its resolution, then turns shadows off, by itself.

## Layout

- `src/build.js` – low-poly geometry helpers and props (rock towers, cells, church, palms, snares)
- `src/level.js` – the six stages, placed platform by platform
- `src/entities.js` – chests, elders, raiders, wind, the door, prayer spots
- `src/ending.js` – the raid, the choice and the ending
- `src/player.js`, `src/figure.js` – movement, collision and the robed figures
- `src/env.js` – sky, time of day, lamps, terrain
- `src/hud.js`, `src/input.js`, `src/audio.js` – captions, controls, synthesised sound

## Test

All three need `playwright` installed and a built `dist/game.js`.

- `node tests/playthrough.js` plays the whole game with a built-in autopilot and reports whether the ending is reached.
- `node tests/input.js` uses only real clicks, key presses and touch events: Begin, move, jump, kneel, camera drag, touch stick and buttons.
- `node tests/begin-button.js` checks at 117 window sizes that a click on Begin actually lands on Begin.

## Sources

Sayings are from the *Sayings of the Desert Fathers* (Abba Moses, Abba Anthony, Abba Sisoes),
Palladius' *Lausiac History*, and Scripture.
