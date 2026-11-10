import * as THREE from "three";
function seeded(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
export function createLivingLandscape(scene,terrainHeightAt,tileAt){
 const rand=seeded(31415926),turbines=[],birds=new THREE.Group();
 const roadMat=new THREE.MeshStandardMaterial({color:0x4b5050,roughness:.98});
 const shoulderMat=new THREE.MeshStandardMaterial({color:0x8b8a75,roughness:1});
 const paths=[
 [[-470,-350],[-340,-250],[-240,-90],[-170,90],[-120,330],[40,470]],
 [[-470,250],[-300,210],[-160,180],[20,170],[210,230],[440,370]],
 [[-420,-30],[-280,20],[-140,70],[80,100],[270,20],[450,-90]],
 [[-300,450],[-210,350],[-80,260],[60,220],[240,250],[420,190]]
 ];
 for(const path of paths){
  const points=path.map(([x,z])=>new THREE.Vector3(x,terrainHeightAt(x,z),z));
  const curve=new THREE.CatmullRomCurve3(points);
  const makeStrip=(width,offset,material)=>{
   const positions=[],indices=[],segments=180,side=new THREE.Vector3();
   for(let i=0;i<=segments;i++){
    const t=i/segments,p=curve.getPointAt(t),tangent=curve.getTangentAt(t);
    side.set(tangent.z,0,-tangent.x).normalize();
    const y=terrainHeightAt(p.x,p.z)+offset;
    positions.push(p.x+side.x*width/2,y,p.z+side.z*width/2,p.x-side.x*width/2,y,p.z-side.z*width/2);
    if(i<segments){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
   }
   const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
   const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;scene.add(mesh);
  };
  makeStrip(9,.14,shoulderMat);makeStrip(5.8,.19,roadMat);
  for(let i=0;i<180;i+=10){const t=i/180,p=curve.getPointAt(t),tan=curve.getTangentAt(t);const dash=new THREE.Mesh(new THREE.BoxGeometry(.18,.035,3.1),new THREE.MeshBasicMaterial({color:0xd7d2b5}));dash.position.set(p.x,terrainHeightAt(p.x,p.z)+.23,p.z);dash.rotation.y=Math.atan2(tan.x,tan.z);scene.add(dash);}
 }
 // Farmsteads and scattered houses create scale and recognizable settlement patterns.
 const houseMat=new THREE.MeshStandardMaterial({color:0xc5bca8,roughness:.9}),roofMat=new THREE.MeshStandardMaterial({color:0x76564a,roughness:.9}),windowMat=new THREE.MeshStandardMaterial({color:0x4d7380,roughness:.25});
 for(let i=0;i<42;i++){
  const x=(rand()-.5)*820,z=(rand()-.5)*820;
  if((Math.abs(x)<175&&z>-90&&z<145)||tileAt(x,z)===-1||terrainHeightAt(x,z)>13)continue;
  const y=terrainHeightAt(x,z),w=5+rand()*5,d=5+rand()*5,h=3.4+rand()*2.2;
  const house=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),houseMat);house.position.set(x,y+h/2,z);house.castShadow=true;scene.add(house);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.78,2.8,4),roofMat);roof.position.set(x,y+h+1.1,z);roof.rotation.y=Math.PI/4;roof.castShadow=true;scene.add(roof);
  const win=new THREE.Mesh(new THREE.BoxGeometry(1.1,1,.08),windowMat);win.position.set(x,y+2,z+d/2+.05);scene.add(win);
 }
 // Animated wind turbines on the surrounding ridges.
 const turbineMat=new THREE.MeshStandardMaterial({color:0xcbd0cb,metalness:.35,roughness:.48});
 for(const [x,z] of [[-390,-300],[-330,390],[390,-320],[420,360]]){
  const y=terrainHeightAt(x,z),mast=new THREE.Mesh(new THREE.CylinderGeometry(.65,1.05,48,10),turbineMat);mast.position.set(x,y+24,z);mast.castShadow=true;scene.add(mast);
  const rotor=new THREE.Group();rotor.position.set(x,y+47,z);scene.add(rotor);rotor.add(new THREE.Mesh(new THREE.SphereGeometry(1.3,12,8),turbineMat));
  for(let b=0;b<3;b++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.85,20,.34),new THREE.MeshStandardMaterial({color:0xe5e8e2}));blade.position.y=10;blade.rotation.z=b*Math.PI*2/3;rotor.add(blade);}
  turbines.push(rotor);
 }
 const birdMat=new THREE.MeshBasicMaterial({color:0x354a51});
 for(let i=0;i<15;i++){const bird=new THREE.Group(),wing=new THREE.Mesh(new THREE.BoxGeometry(1.8,.08,.18),birdMat);wing.rotation.z=-.12;bird.add(wing);bird.position.set(-180+i*4.5,65+Math.sin(i)*3,170+Math.cos(i*.7)*10);birds.add(bird);}
 scene.add(birds);
 return{update(dt){turbines.forEach((r,i)=>r.rotation.z+=dt*(1.4+i*.09));birds.position.x+=dt*2.4;if(birds.position.x>500)birds.position.x=-500;}};
}
