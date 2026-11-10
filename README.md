# Flight Simulator 3D v2.8 — original Scratch browser build

This repository runs the original Scratch project through the pinned TurboWarp Packager. The original project remains the single source of truth for gameplay.

## Source of truth and scope

- Original project: `Flight Simulator 3D v2.8.sb3` (preserved unchanged)
- Runtime: TurboWarp Packager 3.14.0
- Build script: `scripts/package-project.cjs`
- Source analysis: `scripts/analyze-scratch.mjs`

The graphics profile changes renderer quality only:
- Scratch stage coordinates remain **480 × 360**.
- Project timing remains **30 Hz**.
- Visual interpolation is enabled for smoother presentation.
- High-quality pen rendering is enabled.
- Maximum packaged texture dimension is raised to **4096 px**.

No Scratch scripts, flight physics, controls, variables, terrain logic, or gameplay behavior are rewritten by the build.

## Build

Node.js 22 is recommended.

```sh
npm install --no-save --no-package-lock @turbowarp/packager@3.14.0
npm run build
```

The standalone game is written to `dist/index.html`. The build also records the source project's SHA-256 and the applied graphics profile in `dist/build-info.json`.

## Deployment and validation

Pull requests run the build workflow without deploying. Merges to `main` build and deploy the standalone HTML to GitHub Pages.

## Attribution

Original Scratch project: **Flight Simulator 3D v2.8**, by **WO997**. The original `.sb3` file and its assets remain unmodified.
