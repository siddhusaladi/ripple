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

None included yet. See `handoff/NEXT_TASKS.md`; when Kenney RPG Urban Kit
assets are added, record the exact files, download source, and license here.

## Course material

No code, tests, or handouts from CS 378 homework are used.
