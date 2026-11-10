# Flight Simulator 3D v2.8 — Native Three.js reconstruction

This repository is transitioning from a packaged Scratch runtime to a native browser implementation. The original `Flight Simulator 3D v2.8.sb3` remains preserved and is the behavioral reference.

## Architecture

- Three.js / WebGL renderer for the 3D scene.
- Native JavaScript flight model with a fixed 30 Hz simulation step.
- Original 25 × 25 terrain grid copied from the saved Scratch project.
- Procedural civil aircraft, terrain, runway, vegetation, clouds, lighting, and cockpit-style telemetry.
- Responsive keyboard controls and mobile gyroscope steering with a dedicated flight-systems panel.

## Controls

- `S`: increase throttle; `X`: decrease throttle; `Space`: reduce throttle/brake.
- Arrow up/down: pitch; arrow left/right: roll.
- `A` / `D`: rudder/yaw.
- `W`: landing gear; `C`: camera cycle.
- Mobile: enable device gyroscope for pitch and bank; calibrate while holding the phone naturally. The touch panel controls throttle, brake, rudder, landing gear, and camera.

This is a civil aviation experience. There is no rocket, weapon, or boost control in the native flight model.

## Fidelity and validation

The original project is the source of truth for the start state, 25 × 25 world-grid dimensions, terrain cell size, throttle limits, input mapping, and 30 Hz update cadence. The native implementation reconstructs the flight dynamics and world rendering in independent modules. It is not yet certified as a bit-for-bit or pixel-for-pixel clone; differences are expected until side-by-side behavioral tests are completed.

The build pipeline runs automated tests for the flight model and terrain sampler before deployment. The original Scratch/TurboWarp build is retained in Git history and can be restored if required.

## Development

Node.js 22:

```sh
npm install
npm test
npm run dev
npm run build
```

## Attribution

Original Scratch project: **Flight Simulator 3D v2.8**, by **WO997**. The original project file remains unmodified and is retained as the reconstruction reference.
