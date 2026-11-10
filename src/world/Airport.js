import * as THREE from "three";
import { loadSurfaceTexture } from "./SurfaceTextures.js";

const makeBox=(group,x,y,z,w,h,d,material)=>{
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 mesh.position.set(x,y+h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
};
const plane=(group,w,d,x,y,z,material)=>{
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),material);
 mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;group.add(mesh);return mesh;
};
export function createAirport(scene){
 const g=new THREE.Group();
 const asphaltMap=loadSurfaceTexture("asphalt-color.jpg",4,24,THREE.SRGBColorSpace);
 const concreteMap=loadSurfaceTexture("concrete-color.jpg",20,18,THREE.SRGBColorSpace);
 const concreteRoughness=loadSurfaceTexture("concrete-roughness.jpg",20,18);
 const asphalt=new THREE.MeshStandardMaterial({map:asphaltMap,color:0xffffff,roughness:.96});
 const concrete=new THREE.MeshStandardMaterial({map:concreteMap,roughnessMap:concreteRoughness,roughness:.98});
 const white=new THREE.MeshBasicMaterial({color:0xf0f0df});
 const yellow=new THREE.MeshBasicMaterial({color:0xf2c84b});
 const wall=new THREE.MeshStandardMaterial({color:0xb9b9ad,roughness:.82});
 const roof=new THREE.MeshStandardMaterial({color:0x39434a,roughness:.74});
 const glass=new THREE.MeshStandardMaterial({color:0x5b8994,metalness:.4,roughness:.22,emissive:0x18343c,emissiveIntensity:.18});
 const metal=new THREE.MeshStandardMaterial({color:0x87949a,metalness:.7,roughness:.36});
 // Apron and taxiway connection.
 plane(g,108,94,55,.09,34,concrete);plane(g,17,118,15,.075,61,asphalt);
 plane(g,.4,112,15,.095,61,yellow);
 for(const x of [7,23])plane(g,.3,112,x,.096,61,white);
 for(let i=0;i<6;i++){const x=25+i*13;plane(g,.28,35,x,.105,20,yellow);plane(g,8,.28,x,.106,2,yellow);}
 // Terminal and glazed facade.
 makeBox(g,34,.12,-12,72,8.5,19,wall);makeBox(g,34,8.62,-12,74,.7,21,roof);
 makeBox(g,34,2.1,-1.95,70,4.5,.22,glass);
 makeBox(g,34,1.2,-.9,76,.35,2.2,metal);
 for(let i=0;i<17;i++)makeBox(g,1+i*4.1,1.8,-1.78,.18,5.3,.25,metal);
 for(let i=0;i<4;i++){const x=13+i*14;makeBox(g,x,2.5,7+i*1.5,3.2,2.3,14,wall);makeBox(g,x,2.3,13+i*1.5,3.8,.22,3.2,metal);}
 // Three maintenance hangars.
 for(let i=0;i<3;i++){const x=104+i*27,z=26+(i%2)*20;makeBox(g,x,.1,z,23,9,20,wall);const r=new THREE.Mesh(new THREE.ConeGeometry(16,5.5,4),roof);r.rotation.y=Math.PI/4;r.scale.z=.78;r.position.set(x+11.5,11.6,z+10);r.castShadow=true;g.add(r);makeBox(g,x+11.5,.15,z-.08,18,7.5,.25,metal);}
 // ATC tower, glazed cab and aerial.
 makeBox(g,-57,.1,-28,8,25,8,wall);makeBox(g,-57,25.1,-28,15,4.2,15,glass);makeBox(g,-57,29.3,-28,16,.7,16,roof);
 for(const dx of [-7.2,7.2])makeBox(g,-57+dx,25.1,-28,.18,4.2,15,metal);
 for(const dz of [-7.2,7.2])makeBox(g,-57,25.1,-28+dz,15,4.2,.18,metal);
 const mast=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,7,8),metal);mast.position.set(-57,33.1,-28);g.add(mast);
 // Apron floodlights.
 const poleGeo=new THREE.CylinderGeometry(.16,.24,17,8);
 for(const [x,z] of [[8,-8],[101,-8],[8,75],[101,75]]){
  const p=new THREE.Mesh(poleGeo,metal);p.position.set(x,8.6,z);p.castShadow=true;g.add(p);
  const h=new THREE.Mesh(new THREE.BoxGeometry(2.4,.45,1.2),new THREE.MeshStandardMaterial({color:0xe6e3cb,emissive:0xffe2a3,emissiveIntensity:.45}));h.position.set(x,17.2,z);g.add(h);
  const glow=new THREE.PointLight(0xffe7b2,1.4,58,2);glow.position.set(x,16.7,z);g.add(glow);
}
 // Runway edge and threshold lamps.
 const lampMat=new THREE.MeshStandardMaterial({color:0x9daeb2,metalness:.5,roughness:.3,emissive:0x9acbce,emissiveIntensity:.35});
 const lampGeo=new THREE.CylinderGeometry(.13,.18,.24,8);
 for(const x of [-21.5,21.5])for(let z=-120;z<=470;z+=12){const l=new THREE.Mesh(lampGeo,lampMat);l.position.set(x,.18,z);g.add(l);}
 for(const x of [-16,-12,-8,-4,4,8,12,16]){const l=new THREE.Mesh(lampGeo,new THREE.MeshStandardMaterial({color:0xe6e8d7,emissive:0xe9f5ed,emissiveIntensity:.9}));l.position.set(x,.18,-125);g.add(l);}

 // Taxiway edge and centreline lighting, aligned to the apron connector.
 const blueTaxiLamp=new THREE.MeshStandardMaterial({color:0x8ac7ed,emissive:0x2478bd,emissiveIntensity:1.15});
 const greenTaxiLamp=new THREE.MeshStandardMaterial({color:0x9fe6b2,emissive:0x2c9a63,emissiveIntensity:.95});
 const taxiLampGeo=new THREE.SphereGeometry(.16,8,6);
 let taxiwayLightCount=0;
 for(let z=8;z<=112;z+=12){
  for(const x of [7,23]){const lamp=new THREE.Mesh(taxiLampGeo,blueTaxiLamp);lamp.position.set(x,.2,z);g.add(lamp);taxiwayLightCount++;}
  const centre=new THREE.Mesh(taxiLampGeo,greenTaxiLamp);centre.position.set(15,.16,z);g.add(centre);taxiwayLightCount++;
 }
 // Four-unit PAPI visual guidance bar on the left of the runway approach.
 const papiWhite=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:1.5});
 const papiRed=new THREE.MeshStandardMaterial({color:0xff514c,emissive:0xb51e1e,emissiveIntensity:1.25});
 for(let i=0;i<4;i++){
  const housing=new THREE.Mesh(new THREE.BoxGeometry(.72,.28,.38),metal);
  housing.position.set(-28,.22,-91-i*2.2);g.add(housing);
  const lens=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.08),i<2?papiWhite:papiRed);
  lens.position.set(-28,.28,-91-i*2.2-.2);g.add(lens);
 }
 // Nose-in general-aviation parking stands with lead-in and stop markings.
 const standYellow=new THREE.MeshBasicMaterial({color:0xe8c64d});
 const standWhite=new THREE.MeshBasicMaterial({color:0xe4e8df});
 const standXs=[34,51,68,85];
 for(const x of standXs){
  const lead=plane(g,.22,19,x,.115,34,standYellow);
  const stop=plane(g,10,.22,x,.116,24,standWhite);
  const rear=plane(g,10,.18,x,.116,43,standYellow);
 }
 // Parked ramp service vehicles add scale and a lived-in apron.
 const serviceTire=new THREE.MeshStandardMaterial({color:0x161a1c,roughness:.92});
 const addServiceVehicle=(x,z,paintColor)=>{
  const vehicle=new THREE.Group();vehicle.position.set(x,.12,z);
  const bodyMat=new THREE.MeshStandardMaterial({color:paintColor,roughness:.68,metalness:.12});
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.15,1.05,3.5),bodyMat);body.position.y=.86;body.castShadow=true;vehicle.add(body);
  const cab=new THREE.Mesh(new THREE.BoxGeometry(1.95,.88,1.45),glass);cab.position.set(0,1.68,.62);vehicle.add(cab);
  const bumper=new THREE.Mesh(new THREE.BoxGeometry(2.2,.2,.22),metal);bumper.position.set(0,.48,1.78);vehicle.add(bumper);
  for(const side of [-1,1])for(const zOffset of [-1.12,1.12]){
   const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.18,12),serviceTire);
   wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.08,.38,zOffset);vehicle.add(wheel);
  }
  const beacon=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshBasicMaterial({color:0xffc84d}));beacon.position.set(0,2.17,.45);vehicle.add(beacon);
  g.add(vehicle);
 };
 addServiceVehicle(94,58,0xd8b64c);
 addServiceVehicle(5,54,0xe8eceb);
 g.userData.detailFeatures={taxiwayLights:taxiwayLightCount,papiUnits:4,parkingStands:standXs.length,serviceVehicles:2};

 // Windsock and access road.
 const sockPole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,6,7),metal);sockPole.position.set(-78,3,36);g.add(sockPole);
 const sock=new THREE.Mesh(new THREE.ConeGeometry(.7,4.5,8,1,true),new THREE.MeshStandardMaterial({color:0xf1eee0,side:THREE.DoubleSide}));sock.rotation.z=-Math.PI/2;sock.position.set(-76,5.4,36);g.add(sock);
 plane(g,9,250,155,.08,35,asphalt);
 g.userData.windSock=sock;
 scene.add(g);return g;
}
