import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import "./style.css";
import { FlightModel } from "./flight/FlightModel.js";
import { WeatherSystem } from "./flight/WeatherSystem.js";
import { createWorld } from "./world/World.js";
import { createAircraft } from "./aircraft/Aircraft.js";
import { HUD, InputController } from "./ui/HUD.js";
import { GyroController } from "./ui/GyroController.js";

const canvas = document.querySelector("#flight-canvas");
const isMobile = matchMedia("(max-width: 700px)").matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobile,
  alpha: false,
  powerPreference: "high-performance",
  logarithmicDepthBuffer: false
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.55 : 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xb9cbd0, .00055);
const sky = new Sky();
sky.scale.setScalar(12000);
scene.add(sky);
const skyUniforms = sky.material.uniforms;
skyUniforms.turbidity.value = 7.5;
skyUniforms.rayleigh.value = 1.7;
skyUniforms.mieCoefficient.value = .004;
skyUniforms.mieDirectionalG.value = .82;
const sun = new THREE.Vector3();
sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(82), THREE.MathUtils.degToRad(215));
skyUniforms.sunPosition.value.copy(sun);
scene.background = new THREE.Color(0xb9cbd0);

const hemisphere = new THREE.HemisphereLight(0xd9eaf2, 0x46533e, 1.65);
scene.add(hemisphere);
const sunlight = new THREE.DirectionalLight(0xfff0d5, 3.1);
sunlight.position.set(-180, 260, 120);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(isMobile ? 1024 : 3072, isMobile ? 1024 : 3072);
sunlight.shadow.camera.left = -220;
sunlight.shadow.camera.right = 220;
sunlight.shadow.camera.top = 220;
sunlight.shadow.camera.bottom = -220;
sunlight.shadow.camera.near = 1;
sunlight.shadow.camera.far = 650;
sunlight.shadow.bias = -.00018;
sunlight.shadow.normalBias = .025;
sunlight.shadow.radius = isMobile ? 2 : 3;
scene.add(sunlight);

const camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, .1, 2600);
camera.position.set(0, 7, -18);
const model = new FlightModel();
const weather = new WeatherSystem();
const world = createWorld(scene);
const aircraft = createAircraft(scene);
const hud = new HUD(model, weather);
const gyro = new GyroController();
const input = new InputController(model, gyro);

const cameraModes = [
  { name: "CHASE CAM", offset: new THREE.Vector3(0, 5.5, -18), target: new THREE.Vector3(0, 1.2, 5) },
  { name: "COCKPIT", offset: new THREE.Vector3(0, 1.05, 1.1), target: new THREE.Vector3(0, 1.1, 35) },
  { name: "WIDE FOLLOW", offset: new THREE.Vector3(0, 13, -34), target: new THREE.Vector3(0, 1, 9) }
];
let cameraMode = 0;
let started = false;
let accumulator = 0;
let previousTime = performance.now();
let fps = 0;
let fpsFrames = 0;
let fpsStart = previousTime;
const desiredCameraPosition = new THREE.Vector3();
const desiredLookAt = new THREE.Vector3();
const forward = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();

function updateCamera(dt) {
  const mode = cameraModes[cameraMode];
  forward.set(0, 0, 1).applyQuaternion(model.orientation).normalize();
  if (cameraMode === 1) {
    cameraOffset.copy(mode.offset).applyQuaternion(model.orientation);
    desiredCameraPosition.copy(model.position).add(cameraOffset);
    desiredLookAt.copy(model.position).addScaledVector(forward, 38);
  } else {
    cameraOffset.copy(mode.offset).applyQuaternion(model.orientation);
    desiredCameraPosition.copy(model.position).add(cameraOffset);
    desiredLookAt.copy(model.position).addScaledVector(forward, 7).add(new THREE.Vector3(0, 1.2, 0));
  }
  const smoothing = 1 - Math.pow(.001, dt);
  camera.position.lerp(desiredCameraPosition, smoothing);
  camera.lookAt(desiredLookAt);
  camera.fov = cameraMode === 1 ? 76 : cameraMode === 2 ? 58 : 64;
  camera.updateProjectionMatrix();
  document.querySelector("#camera-label").textContent = mode.name;
}

function setCameraMode() {
  cameraMode = (cameraMode + 1) % cameraModes.length;
  updateCamera(1 / 60);
}

function restartFlight() {
  model.reset();
  accumulator = 0;
  document.querySelector("#crash-screen").classList.add("hidden");
  aircraft.root.visible = true;
}

function onResize() {
  const width = window.innerWidth, height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 1.8));
  renderer.setSize(width, height, false);
}
window.addEventListener("resize", onResize);
document.addEventListener("camera-cycle", setCameraMode);
document.addEventListener("flight-restart", restartFlight);
document.querySelector("#camera-button").addEventListener("click", setCameraMode);
document.querySelector("#mobile-camera").addEventListener("click", setCameraMode);
document.querySelector("#start-button").addEventListener("click", () => {
  started = true;
  document.querySelector("#start-screen").classList.add("hidden");
});
document.querySelector("#restart-button").addEventListener("click", restartFlight);

function animate(now) {
  requestAnimationFrame(animate);
  const elapsed = Math.min(.1, Math.max(0, (now - previousTime) / 1000));
  previousTime = now;
  fpsFrames++;
  if (now - fpsStart >= 500) {
    fps = fpsFrames * 1000 / (now - fpsStart);
    fpsFrames = 0;
    fpsStart = now;
  }

  weather.update(now / 1000);
  if (started) {
    input.update();
    accumulator += elapsed;
    const fixedStep = 1 / 60;
    let steps = 0;
    while (accumulator >= fixedStep && steps < 8) {
      model.step(fixedStep, world.terrainHeightAt, weather.wind);
      accumulator -= fixedStep;
      steps++;
    }
    if (steps === 8) accumulator = 0;
  }

  aircraft.update(model, elapsed);
  world.update(elapsed);
  updateCamera(elapsed || 1 / 60);
  hud.update(fps);
  if (model.broken) document.querySelector("#crash-screen").classList.remove("hidden");
  renderer.render(scene, camera);
}

document.querySelector("#loading").classList.add("done");
requestAnimationFrame(animate);