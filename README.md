# RIPPLE

A browser-based pixel-art puzzle game about the butterfly effect. A pedestrian
is hit by a car at an intersection; rewind, change one object in the
neighborhood, and replay a deterministic simulation to see whether the chain
reaction saves them.

CS 378 final project — Siddharth Saladi and Akshay Kondala.

> Work in progress. See `handoff/CURRENT_STATE.md` for what works today.

## Requirements

- Node.js 22 LTS (>= 22.12.0; `.nvmrc` provided)
- npm (lockfile committed)

## Commands

```bash
npm ci          # install exact dependency versions
npm run dev     # dev server at http://localhost:5173
npm run build   # typecheck + production build into dist/
npm test        # headless test suite (Vitest, Node environment)
```
