import test from "node:test";
import assert from "node:assert/strict";
import { FlightModel } from "../src/flight/FlightModel.js";
import { TERRAIN_GRID, tileAt, terrainHeightAt } from "../src/world/World.js";

test("original terrain grid is preserved as a 25 by 25 map", () => {
  assert.equal(TERRAIN_GRID.length, 625);
  assert.equal(tileAt(0, 5), -2);
  assert.equal(tileAt(80, 0), -1);
  assert.equal(terrainHeightAt(0, 400), 13);
  assert.equal(terrainHeightAt(0, 5), 0);
});

test("flight model starts at the original position with idle engine", () => {
  const model = new FlightModel();
  assert.deepEqual(model.position.toArray(), [0, 2, 5]);
  assert.equal(model.power, 0);
  assert.equal(model.gear, -2);
  assert.equal(model.broken, false);
});

test("throttle is capped at the original positive power limit", () => {
  const model = new FlightModel();
  model.setControl("throttle", 1);
  for (let i = 0; i < 45; i++) model.step(1 / 30, terrainHeightAt);
  assert.equal(model.power, 0.0295);
  assert.ok(model.velocity.length() > 0);
});

test("throttle reduction respects the original negative limit", () => {
  const model = new FlightModel();
  model.setControl("throttle", -1);
  for (let i = 0; i < 45; i++) model.step(1 / 30, terrainHeightAt);
  assert.equal(model.power, -0.0055);
});

test("landing gear transitions between extended and retracted endpoints", () => {
  const model = new FlightModel();
  model.toggleGear();
  for (let i = 0; i < 20; i++) model.step(1 / 30, terrainHeightAt);
  assert.equal(model.gear, 0);
  model.toggleGear();
  for (let i = 0; i < 20; i++) model.step(1 / 30, terrainHeightAt);
  assert.equal(model.gear, -2);
});

test("hard landing marks the aircraft as broken", () => {
  const model = new FlightModel();
  model.position.set(0, 2.6, 5);
  model.velocity.set(0, -2, 0);
  model.step(1 / 30, terrainHeightAt);
  assert.equal(model.broken, true);
});

test("civil flight model has no rocket or boost controls", () => {
  const model = new FlightModel();
  assert.equal("rocket" in model.controls, false);
  assert.equal("rocketActive" in model, false);
  assert.equal("rocketCharge" in model, false);
  assert.equal(typeof model.toggleRocket, "undefined");
});
