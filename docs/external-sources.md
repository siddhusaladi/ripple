# External Sources

Everything in RIPPLE that we did not write ourselves. Versions are pinned in
`package.json` / `package-lock.json`.

## Starting point

- GitHub-generated initial commit `6c8ae8b` ("Initial commit"): a one-line
  `README.md` and GitHub's Node.js `.gitignore` template. No application code.

## Runtime and build dependencies (npm)

| Package | Version | License | Role |
|---|---|---|---|
| phaser | 3.90.0 | MIT | 2D rendering in the browser (`src/game/` only) |
| vite | 8.3.8 | MIT | Dev server and production bundler |
| vitest | 5.1.2 | MIT | Test runner (Node environment) |
| typescript | 5.9.3 | Apache-2.0 | Type checking |
| tsx | 4.23.15 | MIT | Runs the TypeScript headless demo script in Node |
| @types/node | 22.20.7 | MIT | Node type definitions for tests/scripts |

Node.js 22 LTS (developed on 22.17.1; `engines` requires >= 22.12.0).

## Art assets

**Kenney "RPG Urban Pack" 1.0** (the pack the proposal calls "RPG Urban Kit"),
by Kenney (www.kenney.nl), license **CC0 1.0**
(http://creativecommons.org/publicdomain/zero/1.0/). The license was checked in
the `License.txt` shipped inside the downloaded archive (2026-11-25).

- Source page: https://kenney.nl/assets/rpg-urban-pack (also listed at
  https://kenney-assets.itch.io/rpg-urban-kit).
- Downloaded archive SHA-256:
  `4541d89d639fc7d1e905dd925e55b1c4977a41d983516228db1d57173bb9afaf`.
- Files included, unmodified:
  - `public/assets/kenney-rpg-urban/tilemap_packed.png`: the whole 27 × 18
    tile sheet, 16 px tiles, no spacing (SHA-256 `305e71fa…6ad389`).
  - `public/assets/kenney-rpg-urban/License.txt`: Kenney's license file.
- Frames used are listed in `src/game/sprites.ts`. The pack has no top-down
  car, so the 1 × 2 taxi sprite (frames 395/422) is rotated in code. The
  traffic-light sprite has no separate red/green frames, so the signal state
  is a drawn circle overlay.

## Tools used only for verification (not dependencies)

- Playwright for Python, run ad hoc with `uv run --with playwright` against the
  locally installed Google Chrome, in `scripts/browser_smoke.py`. It is not in
  `package.json`, and `npm test` does not need it.

## Course material

No code, tests, or handouts from CS 378 homework are used.
