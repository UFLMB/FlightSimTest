import * as THREE from "three";

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
 const asphalt=new THREE.MeshStandardMaterial({color:0x343a3d,roughness:.94});
 const concrete=new THREE.MeshStandardMaterial({color:0x777d7d,roughness:.96});
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
 for(const [x,z] of [[8,-8],[101,-8],[8,75],[101,75]]){const p=new THREE.Mesh(poleGeo,metal);p.position.set(x,8.6,z);p.castShadow=true;g.add(p);const h=new THREE.Mesh(new THREE.BoxGeometry(2.4,.45,1.2),new THREE.MeshStandardMaterial({color:0xe6e3cb,emissive:0xffe2a3,emissiveIntensity:.45}));h.position.set(x,17.2,z);g.add(h);}
 // Runway edge and threshold lamps.
 const lampMat=new THREE.MeshStandardMaterial({color:0x9daeb2,metalness:.5,roughness:.3,emissive:0x9acbce,emissiveIntensity:.35});
 const lampGeo=new THREE.CylinderGeometry(.13,.18,.24,8);
 for(const x of [-21.5,21.5])for(let z=-48;z<=208;z+=12){const l=new THREE.Mesh(lampGeo,lampMat);l.position.set(x,.18,z);g.add(l);}
 for(const x of [-16,-12,-8,-4,4,8,12,16]){const l=new THREE.Mesh(lampGeo,new THREE.MeshStandardMaterial({color:0xe6e8d7,emissive:0xe9f5ed,emissiveIntensity:.9}));l.position.set(x,.18,-53);g.add(l);}
 // Windsock and access road.
 const sockPole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,6,7),metal);sockPole.position.set(-78,3,36);g.add(sockPole);
 const sock=new THREE.Mesh(new THREE.ConeGeometry(.7,4.5,8,1,true),new THREE.MeshStandardMaterial({color:0xf1eee0,side:THREE.DoubleSide}));sock.rotation.z=-Math.PI/2;sock.position.set(-76,5.4,36);g.add(sock);
 plane(g,9,250,155,.08,35,asphalt);
 scene.add(g);return g;
}
