# Flight Simulator 3D v2.8 — browser build

This repository preserves the original Scratch project and packages it as a standalone browser game.

## Source of truth

- Original project: `Flight Simulator 3D v2.8.sb3`
- Reconstruction strategy: run the original Scratch project through the pinned TurboWarp Packager runtime rather than approximating its 3D renderer, flight physics, controls, terrain, or effects.
- Source analysis: `scripts/analyze-scratch.mjs`
- Browser build: `scripts/package-project.cjs`

## Build

Node.js 22 is recommended.

```sh
npm install --no-save --no-package-lock @turbowarp/packager@3.14.0
npm run build
```

The standalone HTML game is written to `dist/index.html`.

## Deployment

The `Deploy Flight Simulator to GitHub Pages` workflow builds the standalone HTML and deploys the `dist` directory from the `scratch-rebuild` branch.

The original `.sb3` is retained unchanged. Work is isolated on `scratch-rebuild`; the `main` branch remains untouched until the build and browser checks pass.

## Attribution

Original Scratch project: **Flight Simulator 3D v2.8**, by **WO997**. The original project and its assets remain the source material for this browser package.

Build validation is performed automatically before the Pages deployment.

Latest source is packaged and deployed from the main branch by GitHub Actions.
