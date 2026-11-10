import * as THREE from "three";

const paint = new THREE.MeshPhysicalMaterial({ color: 0xe7ecec, metalness: .42, roughness: .31, clearcoat: .8, clearcoatRoughness: .2 });
const accent = new THREE.MeshStandardMaterial({ color: 0x9acb55, metalness: .45, roughness: .3 });
const dark = new THREE.MeshStandardMaterial({ color: 0x15232c, metalness: .35, roughness: .22 });
const glass = new THREE.MeshPhysicalMaterial({ color: 0x5c9cae, metalness: .18, roughness: .08, transparent: true, opacity: .78, clearcoat: 1 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x101418, roughness: .9 });

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
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .12, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .035, bevelThickness: .035 });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, .04, sweep);
  return geometry;
}

function addWheel(parent, x, y, z, radius = .36) {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .18, 16), rubber);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  wheel.castShadow = true;
  parent.add(wheel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * .42, radius * .42, .2, 12), dark);
  hub.rotation.z = Math.PI / 2;
  hub.position.copy(wheel.position);
  parent.add(hub);
}

export function createAircraft(scene) {
  const root = new THREE.Group();
  root.name = "Aircraft";
  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(.58, 6.4, 6, 12), paint);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.y = .18;
  fuselage.castShadow = true;
  root.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(.56, 1.55, 16), paint);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, .18, 4.05);
  nose.castShadow = true;
  root.add(nose);

  const wing = new THREE.Mesh(wingGeometry(13, 2.6, .35), paint);
  wing.position.y = .18;
  wing.castShadow = true;
  wing.receiveShadow = true;
  root.add(wing);

  const tailWing = new THREE.Mesh(wingGeometry(4.6, 1.15, -2.55), paint);
  tailWing.position.y = .38;
  tailWing.scale.set(.55, .7, .7);
  tailWing.castShadow = true;
  root.add(tailWing);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(.16, 1.7, 1.45), paint);
  fin.position.set(0, 1.12, -3.35);
  fin.rotation.x = -.2;
  fin.castShadow = true;
  root.add(fin);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI * .53), glass);
  canopy.scale.set(.62, 1.08, 1.45);
  canopy.rotation.x = Math.PI / 2;
  canopy.position.set(0, .78, 1.0);
  root.add(canopy);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(.18, .055, 6.3), accent);
  stripe.position.set(0, .76, -.2);
  root.add(stripe);

  const engine = new THREE.Mesh(new THREE.CylinderGeometry(.48, .56, .9, 18), dark);
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

  const gearGroup = new THREE.Group();
  root.add(gearGroup);
  const strutMaterial = new THREE.MeshStandardMaterial({ color: 0xb8c2c5, metalness: .85, roughness: .25 });
  for (const x of [-1.35, 1.35]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(.055, .08, 2.0, 8), strutMaterial);
    strut.position.set(x, -1.18, .25);
    strut.rotation.z = x > 0 ? -.2 : .2;
    gearGroup.add(strut);
    addWheel(gearGroup, x, -2.15, .28, .36);
  }
  const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, 1.75, 8), strutMaterial);
  noseStrut.position.set(0, -.95, 3.35);
  gearGroup.add(noseStrut);
  addWheel(gearGroup, 0, -1.9, 3.38, .28);

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

  root.scale.setScalar(.9);
  scene.add(root);

  return {
    root, propeller, gearGroup, leftAileron, rightAileron, elevator, rudder,
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
      root.visible = !model.broken;
    }
  };
}