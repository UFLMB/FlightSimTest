# Flight Simulator — Realistic Civil Aviation Edition

The original **Flight Simulator 3D v2.8** Scratch project is preserved as a reference and historical fallback. The active browser simulator is a native Three.js implementation whose priority is now **realistic flight behaviour and presentation**, not pixel-identical reproduction of Scratch.

## Current engine

- Three.js / WebGL rendering with ACES tone mapping, atmospheric sky, directional sunlight and soft shadows.
- Native SI-unit flight dynamics: metres, metres/second, radians, newtons and kilograms.
- Fixed 60 Hz physics step, independent of render frame rate.
- Aerodynamic lift curve, angle of attack, progressive stall, parasite and induced drag, engine spool, ground effect and gear drag.
- Roll, pitch and yaw response with aerodynamic authority, damping and coordinated-turn tendency.
- Ground contact, rolling resistance, braking and hard-landing detection.
- Variable ambient wind and gusts affect angle of attack, lift, drag and indicated airspeed; the live wind readout reports direction and knots.
- Original 25 × 25 terrain reference, procedural runway/airport, vegetation and living landscape.
- Civil aircraft only. No rocket, weapons or boost mechanic.
- Keyboard controls on desktop and calibrated device gyroscope plus dedicated flight-systems controls on mobile.

## Controls

- `S`: increase throttle; `X`: reduce throttle; `Space`: brake.
- Arrow up/down: pitch; arrow left/right: roll.
- `A` / `D`: rudder.
- `C`: camera cycle. The selected Cessna 172 uses fixed, non-retractable landing gear.
- Mobile: enable and calibrate gyroscope for pitch/bank; use the touch flight panel for throttle, brake, rudder, gear and camera.

## Realism roadmap

This first aerodynamics pass replaces the old Scratch-derived acceleration model with an SI-unit aerodynamic model. It is a simulation foundation, not a claim of certified flight dynamics. Further work is required for a complete high-fidelity experience: aircraft-specific performance data and trim, richer cockpit/instruments, aircraft-specific performance data and trim, sound, traffic, navigation and extensive crosswind/take-off/landing regression scenarios. Aircraft-specific tuning should be based on the final selected aircraft rather than guessed specifications.

## Validation

`npm test` runs automated terrain and flight-model regression tests. `npm run build` creates the static browser build. The original Scratch project file remains unchanged in the repository and the previous native build is preserved in Git history and the `native-threejs-pre-parity-backup` branch.

## Development

Node.js 22:

```sh
npm install
npm test
npm run dev
npm run build
```

Original Scratch reference: **Flight Simulator 3D v2.8**, by **WO997**.
