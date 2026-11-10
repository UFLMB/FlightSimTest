import test from "node:test";
import assert from "node:assert/strict";
import { FlightModel } from "../src/flight/FlightModel.js";
import { WeatherSystem } from "../src/flight/WeatherSystem.js";
import { Vector3, Group, Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { createAircraft, instrumentNeedleAngles } from "../src/aircraft/Aircraft.js";
import { Scene } from "three";
import { TERRAIN_GRID, tileAt, terrainHeightAt } from "../src/world/World.js";
import { createAirport } from "../src/world/Airport.js";

const step = (model, seconds, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) model.step(dt, terrainHeightAt);
};

test("original 25 by 25 terrain reference remains intact", () => {
  assert.equal(TERRAIN_GRID.length, 625);
  assert.equal(tileAt(0, 5), -2);
  assert.equal(tileAt(80, 0), -1);
  assert.equal(terrainHeightAt(80, 400), 12);
  assert.equal(terrainHeightAt(0, 400), 0, "extended runway corridor must remain level");
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
  assert.ok(model.speed > 25, `expected takeoff speed, got ${model.speed.toFixed(1)} m/s`);
  assert.equal(model.onGround, false, "aircraft should lift off with sufficient airspeed and rotation input");
  assert.ok(model.position.z < 475, "aircraft should become airborne before the far runway threshold");
  assert.equal(model.broken, false);
});

test("aircraft develops lift and can climb with positive pitch input", () => {
  const model = new FlightModel();
  model.position.set(0, 120, 5);
  model.velocity.set(0, 0, 44);
  model.onGround = false;
  model.setControl("pitch", 0.4);
  step(model, 5);
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

test("headwind increases indicated airspeed without changing ground speed", () => {
  const model = new FlightModel();
  model.position.set(0, 100, 5);
  model.velocity.set(0, 0, 30);
  model.onGround = false;
  model.step(1 / 60, terrainHeightAt, new Vector3(0, 0, -5));
  assert.ok(model.airspeed > model.speed);
  assert.ok(model.indicatedAirspeed > model.speed * 1.943844);
});

test("weather wind direction and gust speed remain finite and bounded", () => {
  const weather = new WeatherSystem();
  for (let t = 0; t < 1800; t += 3) weather.update(t);
  assert.ok(Number.isFinite(weather.directionFrom));
  assert.ok(weather.speed >= 1.2 && weather.speed < 6);
});

test("civil aircraft exposes no rocket or boost controls", () => {
  const model = new FlightModel();
  assert.equal("rocket" in model.controls, false);
  assert.equal("rocketActive" in model, false);
  assert.equal(typeof model.toggleRocket, "undefined");
});


test("civil airframe builds cockpit instruments, glazing and control surfaces", () => {
  const scene = new Scene();
  const aircraft = createAircraft(scene);
  const model = new FlightModel();
  aircraft.update(model, 1 / 60);
  assert.equal(aircraft.instrumentNeedles.length, 6);
  assert.ok(aircraft.proceduralExterior.children.length > 25);
  assert.ok(aircraft.cockpit.children.length >= 9);
  assert.equal(aircraft.gearGroup.visible, true);
  assert.equal(scene.children.includes(aircraft.root), true);
});


test("cockpit instrument needles use calibrated SI and aviation-unit ranges", () => {
  const readings = instrumentNeedleAngles({
    indicatedAirspeed: 80,
    position: { y: 500 },
    verticalSpeed: 5,
    power: 0.5,
    roll: 0.25,
    heading: 90
  });
  assert.equal(readings.length, 6);
  assert.ok(Math.abs(readings[0] + Math.PI * .75) < 1e-9, "80 kt is half-scale on the airspeed indicator");
  assert.ok(Math.abs(readings[1] + Math.PI) < 1e-9, "500 m is half-scale on the altimeter");
  assert.ok(readings[2] < 0 && readings[2] > -Math.PI * .65, "positive climb indicates upward on the VSI");
  assert.ok(readings[3] < 0, "engine RPM follows engine power");
  assert.equal(readings[4], -0.25, "attitude indicator follows bank angle");
  assert.ok(Math.abs(readings[5] + Math.PI / 2) < 1e-9, "90-degree heading maps to a quarter turn");
});


test("weather presets produce distinct deterministic wind conditions", () => {
  const weather = new WeatherSystem();
  assert.equal(weather.label, "STANDARD");
  assert.equal(weather.setPreset("crosswind"), true);
  weather.update(0);
  assert.ok(weather.wind.x > 0, "west wind blows east across the north-south runway");
  assert.ok(weather.directionFrom > 260 && weather.directionFrom < 280);
  assert.equal(weather.setPreset("storm"), true);
  weather.update(0);
  assert.ok(weather.speed > 8);
  assert.equal(weather.visual.cloudOpacity, .97);
  assert.equal(weather.setPreset("unknown"), false);
  assert.equal(weather.label, "STORM", "invalid presets do not corrupt the active weather");
});

test("weather preset cycling wraps to the first preset", () => {
  const weather = new WeatherSystem();
  for (let i = 0; i < 4; i++) weather.nextPreset();
  assert.equal(weather.presetId, "calm");
});


test("airport includes taxiway lighting, PAPI guidance, parking stands and ramp vehicles", () => {
  const scene = new Scene();
  const airport = createAirport(scene);
  assert.equal(airport.userData.detailFeatures.taxiwayLights, 27);
  assert.equal(airport.userData.detailFeatures.papiUnits, 4);
  assert.equal(airport.userData.detailFeatures.parkingStands, 4);
  assert.equal(airport.userData.detailFeatures.serviceVehicles, 2);
  assert.ok(airport.userData.windSock, "windsock is exposed for live wind-direction animation");
  assert.ok(scene.children.includes(airport));
});


test("detailed C172 GLB attachment aligns the airframe and keeps procedural fallback safe", () => {
  const scene = new Scene();
  const aircraft = createAircraft(scene);
  const imported = new Group();
  imported.add(new Mesh(new BoxGeometry(8, 2, 11), new MeshBasicMaterial()));
  const result = aircraft.attachDetailedModel(imported);
  assert.equal(aircraft.detailedModel, imported);
  assert.equal(aircraft.proceduralExterior.visible, false);
  assert.equal(scene.children.includes(aircraft.root), true);
  assert.equal(aircraft.root.children.includes(imported), true);
  assert.ok(result.meshCount === 1);
  assert.ok(Math.abs(result.visibleWingspan - 10.98) < .01);
  assert.ok(Number.isFinite(imported.position.y));
});
