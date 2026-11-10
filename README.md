# Flight Simulator 3D v2.8 — browser build

This repository preserves the original Scratch project and packages it as a standalone browser game.

## Source of truth

- Original project: `Flight Simulator 3D v2.8.sb3`
- Original aircraft, terrain, flight physics, controls, and effects remain intact.
- Browser runtime: pinned TurboWarp Packager 3.14.0.
- Build script: `scripts/package-project.cjs`

## Graphics/runtime profile

The current visual-quality pass enables TurboWarp's high-quality pen renderer. The original project draws its 3D scene with pen-based rendering, so this raises the backing resolution used for those strokes and improves edge/detail clarity on capable displays.

The simulation timing remains at the original 30 FPS. Frame interpolation and turbo mode stay disabled because this is a frame-dependent 3D project and changing its timing could affect flight physics or performance. High-quality rendering can use more GPU memory and may reduce performance on older phones; test both desktop and mobile.

This pass improves rendering clarity. It does not yet replace the original Scratch-generated aircraft/terrain with new photorealistic 3D models or physically based materials.

## Build

Node.js 22 is recommended.

```sh
npm install --no-save --no-package-lock @turbowarp/packager@3.14.0
npm run build
```

The standalone HTML game is written to `dist/index.html`.

## Deployment

The `Deploy Flight Simulator to GitHub Pages` workflow builds and deploys the `dist` directory from `main`.

## Attribution

Original Scratch project: **Flight Simulator 3D v2.8**, by **WO997**. The original project and its assets remain the source material for this browser package.
