import * as THREE from "three";

const paint = new THREE.MeshPhysicalMaterial({ color: 0xe7ecec, metalness: .28, roughness: .34, clearcoat: .85, clearcoatRoughness: .2 });
const accent = new THREE.MeshStandardMaterial({ color: 0x9acb55, metalness: .38, roughness: .32 });
const dark = new THREE.MeshStandardMaterial({ color: 0x15232c, metalness: .35, roughness: .25 });
const glass = new THREE.MeshPhysicalMaterial({ color: 0x5c9cae, metalness: .12, roughness: .09, transparent: true, opacity: .72, clearcoat: 1 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x101418, roughness: .9 });
const metal = new THREE.MeshStandardMaterial({ color: 0xb8c2c5, metalness: .82, roughness: .27 });
const instrumentFace = new THREE.MeshStandardMaterial({ color: 0x101820, roughness: .78 });
const instrumentMark = new THREE.MeshBasicMaterial({ color: 0xd9e4dc });
const needleMat = new THREE.MeshBasicMaterial({ color: 0xe76b4b });

function wingGeometry(span, chord, sweep = 0) {
  const s = span / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-s, -chord * .36);
  shape.lineTo(-s * .72, chord * .34);
  shape.lineTo(s * .72, chord * .34);
  shape.lineTo(s, -chord * .36);
  shape.lineTo(s * .78, -chord * .48);
  shape.lineTo(-s * .78, -chord * .48);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .12, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .035, bevelThickness: .035 });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, .04, sweep);
  return geometry;
}

function addWheel(parent, x, y, z, radius = .36) {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .18, 24), rubber);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  wheel.castShadow = true;
  parent.add(wheel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * .42, radius * .42, .2, 16), metal);
  hub.rotation.z = Math.PI / 2;
  hub.position.copy(wheel.position);
  parent.add(hub);
}

function addBetween(parent, a, b, radius, material) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 10), material);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function addGauge(parent, x, y, z, radius, title) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .045, 28), metal);
  bezel.rotation.x = Math.PI / 2;
  group.add(bezel);
  const face = new THREE.Mesh(new THREE.CircleGeometry(radius * .87, 28), instrumentFace);
  face.position.z = .027;
  group.add(face);
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(.012, radius * .16, .008), instrumentMark);
    tick.position.set(Math.sin(angle) * radius * .68, Math.cos(angle) * radius * .68, .04);
    tick.rotation.z = -angle;
    group.add(tick);
  }
  const needle = new THREE.Group();
  const pointer = new THREE.Mesh(new THREE.BoxGeometry(.014, radius * .62, .009), needleMat);
  pointer.position.y = radius * .31;
  pointer.position.z = .052;
  needle.add(pointer);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(radius * .07, 12), metal);
  cap.position.z = .06;
  needle.add(cap);
  group.add(needle);
  const label = new THREE.Mesh(new THREE.BoxGeometry(radius * .55, .012, .006), instrumentMark);
  label.position.set(0, -radius * .57, .045);
  group.add(label);
  parent.add(group);
  return needle;
}

export function createAircraft(scene) {
  const root = new THREE.Group();
  root.name = "Aircraft";

  // Smooth single-engine touring-aircraft fuselage and tapered nose.
  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(.56, 6.6, 8, 20), paint);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.y = .18;
  fuselage.castShadow = true;
  fuselage.receiveShadow = true;
  root.add(fuselage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.54, 1.7, 24), paint);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, .18, 4.05);
  nose.castShadow = true;
  root.add(nose);

  // Low wing, tailplane and vertical stabilizer.
  const wing = new THREE.Mesh(wingGeometry(13, 2.65, .35), paint);
  wing.position.y = .18;
  wing.castShadow = true;
  wing.receiveShadow = true;
  root.add(wing);
  const tailWing = new THREE.Mesh(wingGeometry(4.8, 1.15, -2.55), paint);
  tailWing.position.y = .38;
  tailWing.scale.set(.55, .7, .7);
  tailWing.castShadow = true;
  root.add(tailWing);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(.16, 1.8, 1.45), paint);
  fin.position.set(0, 1.12, -3.35);
  fin.rotation.x = -.2;
  fin.castShadow = true;
  root.add(fin);

  // Cabin glazing, windscreen and side windows.
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16, 0, Math.PI * 2, 0, Math.PI * .53), glass);
  canopy.scale.set(.62, 1.08, 1.45);
  canopy.rotation.x = Math.PI / 2;
  canopy.position.set(0, .78, 1.0);
  root.add(canopy);
  for (const side of [-1, 1]) {
    for (const z of [-.72, .05, .82]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(.055, .52, .58), dark);
      frame.position.set(side * .535, .72, z);
      root.add(frame);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(.065, .43, .49), glass);
      pane.position.set(side * .55, .73, z);
      root.add(pane);
    }
    // Wing lift struts and cabin door seam.
    addBetween(root, [side * .78, -.62, .12], [side * 5.25, .18, .48], .055, metal);
    const door = new THREE.Mesh(new THREE.BoxGeometry(.025, 1.15, 1.45), metal);
    door.position.set(side * .574, .02, -.1);
    root.add(door);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(.035, .055, .18), dark);
    handle.position.set(side * .6, .08, .32);
    root.add(handle);
  }

  // Cockpit interior: glareshield, instrument panel, six analog instruments and yoke.
  const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.72, .52, .16), dark);
  dashboard.position.set(0, .16, 2.18);
  dashboard.rotation.x = -.12;
  root.add(dashboard);
  const instrumentNeedles = [];
  const gaugeSpecs = [
    [-.62, .22, "ASI"], [-.21, .22, "ALT"], [.21, .22, "VSI"],
    [.62, .22, "RPM"], [-.4, -.02, "ATT"], [.4, -.02, "HDG"]
  ];
  for (const [x, y, label] of gaugeSpecs) instrumentNeedles.push(addGauge(root, x, y, 2.275, .105, label));
  const yokeColumn = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, .48, 10), metal);
  yokeColumn.position.set(0, -.12, 1.62);
  yokeColumn.rotation.x = -.2;
  root.add(yokeColumn);
  const yoke = new THREE.Mesh(new THREE.TorusGeometry(.22, .025, 8, 24), dark);
  yoke.position.set(0, .1, 1.58);
  root.add(yoke);

  // Paint stripe, engine cowling, spinner and two-blade propeller.
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(.18, .055, 6.3), accent);
  stripe.position.set(0, .76, -.2);
  root.add(stripe);
  const engine = new THREE.Mesh(new THREE.CylinderGeometry(.48, .56, .9, 24), dark);
  engine.rotation.x = Math.PI / 2;
  engine.position.set(0, .18, 4.18);
  root.add(engine);
  const propeller = new THREE.Group();
  propeller.position.set(0, .18, 4.72);
  root.add(propeller);
  for (let i = 0; i < 2; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(.18, 2.5, .08), dark);
    blade.rotation.z = i * Math.PI / 2;
    blade.castShadow = true;
    propeller.add(blade);
  }
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(.3, .62, 24), metal);
  spinner.rotation.x = Math.PI / 2;
  spinner.position.set(0, .18, 4.94);
  root.add(spinner);

  // Fixed tricycle landing gear, wheel hubs and brake discs.
  const gearGroup = new THREE.Group();
  root.add(gearGroup);
  for (const x of [-1.35, 1.35]) {
    addBetween(gearGroup, [x, -.3, .25], [x, -1.95, .28], .065, metal);
    addWheel(gearGroup, x, -2.15, .28, .36);
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .205, 18), dark);
    brake.rotation.z = Math.PI / 2;
    brake.position.set(x, -2.15, .28);
    gearGroup.add(brake);
  }
  addBetween(gearGroup, [0, -.3, 3.35], [0, -1.72, 3.38], .055, metal);
  addWheel(gearGroup, 0, -1.9, 3.38, .28);

  // Hinged ailerons, elevator and rudder.
  const leftAileron = new THREE.Group();
  leftAileron.position.set(-4.5, .08, -.65);
  root.add(leftAileron);
  const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, .09, .48), accent);
  leftMesh.position.x = -.6;
  leftAileron.add(leftMesh);
  const rightAileron = new THREE.Group();
  rightAileron.position.set(4.5, .08, -.65);
  root.add(rightAileron);
  const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, .09, .48), accent);
  rightMesh.position.x = .6;
  rightAileron.add(rightMesh);
  const elevator = new THREE.Group();
  elevator.position.set(0, .42, -4.05);
  root.add(elevator);
  const elevatorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, .1, .45), accent);
  elevatorMesh.position.z = -.12;
  elevator.add(elevatorMesh);
  const rudder = new THREE.Group();
  rudder.position.set(0, 1.1, -3.7);
  root.add(rudder);
  const rudderMesh = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.1, .38), accent);
  rudderMesh.position.z = -.15;
  rudder.add(rudderMesh);

  // Navigation lights and pitot probe.
  const redLight = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), new THREE.MeshStandardMaterial({ color: 0xff3d36, emissive: 0x9f0805, emissiveIntensity: 1.4 }));
  redLight.position.set(-6.45, .2, .25);
  root.add(redLight);
  const greenLight = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), new THREE.MeshStandardMaterial({ color: 0x49e58c, emissive: 0x087b3b, emissiveIntensity: 1.4 }));
  greenLight.position.set(6.45, .2, .25);
  root.add(greenLight);
  const strobe = new THREE.Mesh(new THREE.SphereGeometry(.065, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  strobe.position.set(0, .2, -5.05);
  root.add(strobe);
  addBetween(root, [-6.1, -.04, .45], [-6.55, -.04, .45], .025, metal);

  root.scale.setScalar(.9);
  scene.add(root);

  return {
    root, propeller, gearGroup, leftAileron, rightAileron, elevator, rudder, instrumentNeedles,
    update(model, dt) {
      root.position.copy(model.position);
      root.quaternion.copy(model.orientation);
      const gearExtension = Math.max(0, Math.min(1, -model.gear / 2));
      gearGroup.visible = gearExtension > .02;
      gearGroup.scale.y = Math.max(.02, gearExtension);
      propeller.rotation.z += dt * (18 + model.power * 115);
      leftAileron.rotation.z = model.controls.roll * .22;
      rightAileron.rotation.z = -model.controls.roll * .22;
      elevator.rotation.x = -model.controls.pitch * .2;
      rudder.rotation.y = model.controls.yaw * .28;
      // Simplified analog needles remain mechanically tied to the flight state.
      instrumentNeedles[0].rotation.z = -Math.min(1, model.indicatedAirspeed / 160) * Math.PI * 1.55;
      instrumentNeedles[1].rotation.z = -((model.position.y % 1000) / 1000) * Math.PI * 1.55;
      instrumentNeedles[2].rotation.z = -Math.max(-1, Math.min(1, model.verticalSpeed / 10)) * Math.PI * .65;
      instrumentNeedles[3].rotation.z = -model.power * Math.PI * 1.55;
      instrumentNeedles[4].rotation.z = -model.pitch;
      instrumentNeedles[5].rotation.z = -model.heading * Math.PI / 180;
      root.visible = !model.broken;
    }
  };
}
