import test from "node:test";
import assert from "node:assert/strict";
import { FlightModel } from "../src/flight/FlightModel.js";
import { TERRAIN_GRID, tileAt, terrainHeightAt } from "../src/world/World.js";

const step = (model, seconds, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) model.step(dt, terrainHeightAt);
};

test("original 25 by 25 terrain reference remains intact", () => {
  assert.equal(TERRAIN_GRID.length, 625);
  assert.equal(tileAt(0, 5), -2);
  assert.equal(tileAt(80, 0), -1);
  assert.equal(terrainHeightAt(0, 400), 13);
  assert.equal(terrainHeightAt(0, 5), 0);
});

test("aircraft starts on the runway with SI-unit state", () => {
  const model = new FlightModel();
  assert.deepEqual(model.position.toArray(), [0, 2.15, 5]);
  assert.equal(model.velocity.length(), 0);
  assert.equal(model.power, 0);
  assert.equal(model.gear, -2);
  assert.equal(model.onGround, true);
  assert.equal(model.broken, false);
});

test("engine spool responds smoothly and remains within throttle limits", () => {
  const model = new FlightModel();
  model.setControl("throttle", 1);
  step(model, 3);
  assert.ok(model.power > 0.5 && model.power < 1);
  model.setControl("throttle", -1);
  step(model, 5);
  assert.ok(model.power < 0.1);
  assert.ok(model.power >= 0);
});

test("full-power takeoff run builds airspeed and leaves the runway", () => {
  const model = new FlightModel();
  model.setControl("throttle", 1);
  model.setControl("pitch", 0.35);
  step(model, 24);
  console.log("TAKEOFF DEBUG", { speed: model.speed, position: model.position.toArray(), velocity: model.velocity.toArray(), power: model.power, pitch: model.pitch, alpha: model.angleOfAttack, stalled: model.stalled, onGround: model.onGround, broken: model.broken });
  assert.ok(model.speed > 25, `expected takeoff speed, got ${model.speed.toFixed(1)} m/s`);
  assert.equal(model.onGround, false, "aircraft should lift off with sufficient airspeed and rotation input");
  assert.equal(model.broken, false);
});

test("aircraft develops lift and can climb with positive pitch input", () => {
  const model = new FlightModel();
  model.position.set(0, 120, 5);
  model.velocity.set(0, 0, 44);
  model.onGround = false;
  model.setControl("pitch", 0.4);
  step(model, 5);
  console.log("CLIMB DEBUG", { speed: model.speed, position: model.position.toArray(), velocity: model.velocity.toArray(), pitch: model.pitch, alpha: model.angleOfAttack, load: model.loadFactor, stalled: model.stalled, broken: model.broken });
  assert.ok(model.position.y > 120);
  assert.ok(model.loadFactor > 0);
});

test("excessive angle of attack produces a stall state", () => {
  const model = new FlightModel();
  model.position.set(0, 100, 5);
  model.velocity.set(0, -2, 8);
  step(model, 0.2);
  assert.equal(model.stalled, true);
});

test("roll control banks the aircraft and rudder coordinates heading", () => {
  const model = new FlightModel();
  model.position.set(0, 100, 5);
  model.velocity.set(0, 0, 35);
  model.setControl("roll", 0.6);
  step(model, 2);
  assert.ok(Math.abs(model.roll) > 0.2);
  assert.ok(Number.isFinite(model.heading));
});

test("landing gear transitions smoothly between endpoints", () => {
  const model = new FlightModel();
  model.toggleGear();
  step(model, 3);
  assert.equal(model.gear, 0);
  model.toggleGear();
  step(model, 3);
  assert.equal(model.gear, -2);
});

test("hard landing is detected and terminates the flight", () => {
  const model = new FlightModel();
  model.position.set(0, 2.08, 5);
  model.velocity.set(0, -5.5, 0);
  model.onGround = false;
  model.step(1 / 60, terrainHeightAt);
  assert.equal(model.broken, true);
});

test("civil aircraft exposes no rocket or boost controls", () => {
  const model = new FlightModel();
  assert.equal("rocket" in model.controls, false);
  assert.equal("rocketActive" in model, false);
  assert.equal(typeof model.toggleRocket, "undefined");
});
