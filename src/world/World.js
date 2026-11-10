import * as THREE from "three";
import { createAirport } from "./Airport.js";
import { createLivingLandscape } from "./LivingLandscape.js";
import { loadSurfaceTexture } from "./SurfaceTextures.js";

export const TERRAIN_GRID = [
-2,-2,-2,-2,-2,-2,0,0,0,0,13,0,12,0,0,18,0,0,0,0,0,21,0,0,-2,
16,0,0,0,0,14,0,0,0,0,25,0,0,0,0,14,0,0,0,0,0,18,0,0,0,
-1,-1,-1,-1,14,0,0,0,23,0,12,-1,-1,-1,-1,-1,-1,-1,0,0,12,0,0,0,-1,
24,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,
23,0,0,0,0,0,0,0,22,0,0,0,10,0,0,0,16,0,0,0,14,0,0,0,0,
0,0,14,0,0,16,0,0,0,0,0,24,0,0,0,17,0,0,0,0,10,0,0,0,0,
0,0,19,0,0,11,0,0,0,0,0,22,0,0,0,0,22,0,0,0,12,0,0,0,0,
16,0,0,0,0,0,0,23,0,0,10,0,0,0,0,0,0,13,0,0,0,21,0,0,0,
0,18,0,0,0,0,23,0,0,0,0,0,0,24,0,0,19,0,0,0,0,0,13,0,0,
12,0,0,0,0,0,15,0,0,0,16,0,0,0,0,16,0,0,0,0,22,0,0,0,0,
0,0,0,0,0,0,0,0,12,0,16,0,0,0,0,17,10,0,0,0,0,0,19,0,0,
0,11,0,0,0,0,0,0,14,0,0,14,0,0,0,0,22,0,0,0,0,14,0,0,0,
0,0,24,0,0,0,0,0,0,12,0,18,0,0,0,0,0,11,0,0,0,13,0,0,0,
0,15,0,0,0,0,0,0,24,0,0,0,0,16,0,0,0,10,0,0,0,0,0,0,20,
0,10,0,0,0,0,11,0,0,0,0,10,0,0,0,0,18,0,0,0,0,18,0,0,0,
0,24,0,0,0,0,11,0,0,0,0,0,0,0,13,0,0,0,14,0,0,11,0,0,0,
0,22,0,0,0,0,0,0,23,0,0,21,0,0,0,0,0,0,0,0,0,12,12,0,0,
0,0,0,0,0,0,18,0,17,0,0,0,0,0,0,16,0,0,0,19,0,0,0,0,20,
0,0,0,0,21,0,0,0,0,0,0,0,0,11,0,0,0,0,23,24,0,0,0,0,19,
0,0,0,0,14,0,0,0,0,20,0,0,0,0,0,0,0,0,0,0,17,15,0,0,21,
0,0,0,0,0,0,0,21,0,19,0,0,0,0,0,0,0,0,10,0,0,18,0,0,11,
0,0,0,0,0,16,0,0,0,12,0,0,0,0,10,0,0,0,0,12,0,0,0,0,0,
0,0,0,0,25,16,0,0,0,0,25,0,0,0,0,18,0,0,0,0,0,0,0,0,12,
0,0,11,0,0,24,0,0,0,0,22,0,0,0,0,19,0,0,0,0,23,0,0,0,0,
13,0,0,0,0,0,0,0,16,0,0,0,13,0,0,0,0,0,0,13,11,0,0,0,0
];

export const WORLD_SIZE = 25;
export const TILE_SIZE = 40;
export const WORLD_EXTENT = WORLD_SIZE * TILE_SIZE;
const HALF = WORLD_EXTENT / 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function tileAt(x, z) {
  const wrap = value => ((value % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE;
  const ix = wrap(Math.round(x / TILE_SIZE));
  const iz = wrap(Math.round(z / TILE_SIZE));
  return TERRAIN_GRID[ix * WORLD_SIZE + iz] ?? 0;
}

export function terrainHeightAt(x, z) {
  const code = tileAt(x, z);
  const airportFlat = Math.abs(x) < 190 && z > -85 && z < 125;
  const runwayFlat = Math.abs(x) < 26 && z > -130 && z < 480;
  if (code <= 0 || airportFlat || runwayFlat) return 0;
  const cx = Math.round(x / TILE_SIZE) * TILE_SIZE;
  const cz = Math.round(z / TILE_SIZE) * TILE_SIZE;
  const distance = Math.max(Math.abs(x - cx), Math.abs(z - cz));
  return Math.max(0, (20 - distance) * code / 20);
}

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


function createGroundDetailTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(256, 256);
  let seed = 74221074;
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const value = 90 + (seed >>> 24) * .52;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(26, 26);
  texture.anisotropy = 4;
  return texture;
}

function createTerrainMesh() {
  const segments = 280, step = WORLD_EXTENT / segments;
  const positions = [], colors = [], indices = [], uvs = [];
  const color = new THREE.Color();
  for (let iz = 0; iz <= segments; iz++) {
    for (let ix = 0; ix <= segments; ix++) {
      const x = -HALF + ix * step, z = -HALF + iz * step;
      const hill = terrainHeightAt(x, z);
      const airportFlat = Math.abs(x) < 200 && z > -90 && z < 130;
      const runwayFlat = Math.abs(x) < 26 && z > -130 && z < 480;
      const micro = (airportFlat || runwayFlat) ? 0 : (Math.sin(x * .018) * Math.cos(z * .014) + Math.sin((x + z) * .009) * .5 + Math.sin(x * .071 + z * .043) * .18) * .34;
      positions.push(x, hill + micro, z);
      uvs.push(ix / segments * 180, iz / segments * 180);
      if (tileAt(x, z) === -1) color.setRGB(.48, .64, .68);
      else if (hill > 10) color.setRGB(.84, .8, .69);
      else if (hill > 3) color.setRGB(.82, .87, .7);
      else color.setRGB(.78, .91, .72);
      const variation = Math.sin(x * .11 + z * .07) * .012;
      colors.push(clamp(color.r + variation, 0, 1), clamp(color.g + variation, 0, 1), clamp(color.b + variation, 0, 1));
    }
  }
  for (let z = 0; z < segments; z++) for (let x = 0; x < segments; x++) {
    const a = z * (segments + 1) + x, b = a + 1, c = a + segments + 1, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const grassColor = loadSurfaceTexture("grass-color.jpg", 1, 1, THREE.SRGBColorSpace);
  const grassNormal = loadSurfaceTexture("grass-normal.jpg", 1, 1);
  const groundDetail = createGroundDetailTexture();
  groundDetail.repeat.set(.1, .1);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    map: grassColor, normalMap: grassNormal, normalScale: new THREE.Vector2(.72, .72),
    vertexColors: true, roughness: .97, metalness: 0, bumpMap: groundDetail, bumpScale: .035
  }));
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

function addRunway(scene) {
  const group = new THREE.Group();
  // Extended 600 m paved runway: threshold -125 m to 475 m.
  const runwayLength = 600, runwayCenter = 175;
  const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(48, runwayLength), new THREE.MeshStandardMaterial({ color: 0x777c68, roughness: 1 }));
  shoulder.rotation.x = -Math.PI / 2;
  shoulder.position.set(0, .025, runwayCenter);
  group.add(shoulder);
  const runwayAsphalt = loadSurfaceTexture("asphalt-color.jpg", 8, 120, THREE.SRGBColorSpace);
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(40, runwayLength), new THREE.MeshStandardMaterial({ map: runwayAsphalt, color: 0xffffff, roughness: .96, metalness: 0 }));
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.set(0, .055, runwayCenter);
  asphalt.receiveShadow = true;
  group.add(asphalt);
  const paint = new THREE.MeshBasicMaterial({ color: 0xe4e5d9 });
  for (let z = -112; z <= 462; z += 30) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(.85, 14), paint);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, .068, z);
    group.add(dash);
  }
  for (const x of [-18, 18]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(.6, runwayLength), paint);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(x, .07, runwayCenter);
    group.add(edge);
  }
  for (const z of [-120, 470]) {
    for (const x of [-16, -12, -8, -4, 4, 8, 12, 16]) {
      const threshold = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 15), paint);
      threshold.rotation.x = -Math.PI / 2;
      threshold.position.set(x, .072, z);
      group.add(threshold);
    }
  }
  for (const z of [-92, -72, 300, 320]) {
    for (const x of [-13, -9, 9, 13]) {
      const touchdown = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 5), paint);
      touchdown.rotation.x = -Math.PI / 2;
      touchdown.position.set(x, .073, z);
      group.add(touchdown);
    }
  }
  scene.add(group);
  return group;
}

function addVegetation(scene) {
  const rand = random(74221074);
  const trunkGeo = new THREE.CylinderGeometry(.13, .2, 2.2, 7);
  const crownGeo = new THREE.ConeGeometry(1.45, 4.2, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x514331, roughness: 1 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x183d2d, roughness: 1 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, 1300);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, 1300);
  const dummy = new THREE.Object3D();
  let count = 0;
  for (let i = 0; i < 1300; i++) {
    const x = (rand() - .5) * 920, z = (rand() - .5) * 920;
    if ((x > -200 && x < 190 && z > -85 && z < 125) || (Math.abs(x) < 34 && Math.abs(z) < 325)) continue;
    const code = tileAt(x, z);
    if (code === -1 || terrainHeightAt(x, z) > 14) continue;
    const y = terrainHeightAt(x, z), scale = .65 + rand() * .85;
    dummy.position.set(x, y + scale * 1.05, z);
    dummy.scale.setScalar(scale);
    dummy.rotation.y = rand() * Math.PI * 2;
    dummy.updateMatrix();
    trunks.setMatrixAt(count, dummy.matrix);
    dummy.position.y = y + scale * 3.05;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    crowns.setMatrixAt(count, dummy.matrix);
    count++;
  }
  trunks.count = count;
  crowns.count = count;
  trunks.castShadow = true;
  crowns.castShadow = true;
  trunks.receiveShadow = true;
  scene.add(trunks, crowns);
}

function addWater(scene) {
  const cells = [];
  for (let ix = 0; ix < WORLD_SIZE; ix++) {
    for (let iz = 0; iz < WORLD_SIZE; iz++) {
      if (TERRAIN_GRID[ix * WORLD_SIZE + iz] !== -1) continue;
      const x = (ix > 12 ? ix - WORLD_SIZE : ix) * TILE_SIZE;
      const z = (iz > 12 ? iz - WORLD_SIZE : iz) * TILE_SIZE;
      cells.push([x, z]);
    }
  }
  const water = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE),
    new THREE.MeshPhysicalMaterial({ color: 0x356e80, roughness: .24, metalness: .18, transparent: true, opacity: .8, clearcoat: .8 }),
    cells.length
  );
  const dummy = new THREE.Object3D();
  cells.forEach(([x, z], i) => {
    dummy.position.set(x, .035, z);
    dummy.rotation.x = -Math.PI / 2;
    dummy.updateMatrix();
    water.setMatrixAt(i, dummy.matrix);
  });
  water.receiveShadow = true;
  scene.add(water);
}

function addClouds(scene) {
  const rand = random(20261110);
  const puffGeometry = new THREE.SphereGeometry(1, 10, 7);
  const puffMaterial = new THREE.MeshStandardMaterial({ color: 0xf3f7f6, roughness: 1, transparent: true, opacity: .82 });
  const clouds = new THREE.InstancedMesh(puffGeometry, puffMaterial, 250);
  const dummy = new THREE.Object3D();
  let count = 0;
  for (let i = 0; i < 34; i++) {
    const x = (rand() - .5) * 1500, z = (rand() - .5) * 1500, y = 75 + rand() * 70;
    const puffs = 4 + Math.floor(rand() * 5);
    for (let j = 0; j < puffs; j++) {
      dummy.position.set(x + (rand() - .5) * 16, y + (rand() - .5) * 5, z + (rand() - .5) * 13);
      dummy.scale.set(5 + rand() * 9, 2.4 + rand() * 3, 4 + rand() * 7);
      dummy.rotation.set(0, rand() * Math.PI, 0);
      dummy.updateMatrix();
      clouds.setMatrixAt(count++, dummy.matrix);
    }
  }
  clouds.count = count;
  clouds.frustumCulled = false;
  scene.add(clouds);
  return clouds;
}

export function createWorld(scene) {
  scene.add(createTerrainMesh());
  addRunway(scene);
  const airport = createAirport(scene);
  addVegetation(scene);
  addWater(scene);
  const landscape = createLivingLandscape(scene, terrainHeightAt, tileAt);
  const clouds = addClouds(scene);
  return { clouds, airport, terrainHeightAt, update(dt, wind) {
    clouds.rotation.y += dt * .0007;
    landscape.update(dt, wind);
    if (wind && airport.userData.windSock) airport.userData.windSock.rotation.y = Math.atan2(-wind.z, wind.x);
    if (airport.userData.beacon) airport.userData.beacon.rotation.y += dt * 1.15;
  }, dispose() {} };
}