import * as THREE from "three";

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function createLivingLandscape(scene, terrainHeightAt, tileAt) {
  const rand = seeded(31415926), turbines = [], birds = new THREE.Group();
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x4b5050, roughness: .98 });
  const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x8b8a75, roughness: 1 });
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xd7d2b5 });
  const dashGeo = new THREE.BoxGeometry(.18, .035, 3.1);
  const dashInstances = new THREE.InstancedMesh(dashGeo, dashMat, 72);
  dashInstances.castShadow = false;
  const dashDummy = new THREE.Object3D();
  let dashCount = 0;
  const paths = [
    [[-470,-350],[-340,-250],[-240,-90],[-170,90],[-120,330],[40,470]],
    [[-470,250],[-300,210],[-160,180],[20,170],[210,230],[440,370]],
    [[-420,-30],[-280,20],[-140,70],[80,100],[270,20],[450,-90]],
    [[-300,450],[-210,350],[-80,260],[60,220],[240,250],[420,190]]
  ];
  for (const path of paths) {
    const points = path.map(([x,z]) => new THREE.Vector3(x, terrainHeightAt(x,z), z));
    const curve = new THREE.CatmullRomCurve3(points);
    const makeStrip = (width, offset, material) => {
      const positions = [], indices = [], segments = 180, side = new THREE.Vector3();
      for (let i=0; i<=segments; i++) {
        const t=i/segments, p=curve.getPointAt(t), tangent=curve.getTangentAt(t);
        side.set(tangent.z,0,-tangent.x).normalize();
        const y=terrainHeightAt(p.x,p.z)+offset;
        positions.push(p.x+side.x*width/2,y,p.z+side.z*width/2,p.x-side.x*width/2,y,p.z-side.z*width/2);
        if(i<segments){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
      }
      const geo=new THREE.BufferGeometry();
      geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
      geo.setIndex(indices);geo.computeVertexNormals();
      const mesh=new THREE.Mesh(geo,material);
      mesh.receiveShadow=false;
      scene.add(mesh);
    };
    makeStrip(9,.14,shoulderMat);
    makeStrip(5.8,.19,roadMat);
    for(let i=0;i<180;i+=10){
      const t=i/180,p=curve.getPointAt(t),tan=curve.getTangentAt(t);
      dashDummy.position.set(p.x,terrainHeightAt(p.x,p.z)+.23,p.z);
      dashDummy.rotation.set(0,Math.atan2(tan.x,tan.z),0);
      dashDummy.updateMatrix();
      dashInstances.setMatrixAt(dashCount++,dashDummy.matrix);
    }
  }
  dashInstances.count=dashCount;
  scene.add(dashInstances);

  // Repeated farm buildings are instanced: three draw calls instead of up to
  // 126 independent meshes, with no unnecessary shadow-map casters.
  const houseMat=new THREE.MeshStandardMaterial({color:0xc5bca8,roughness:.9});
  const roofMat=new THREE.MeshStandardMaterial({color:0x76564a,roughness:.9});
  const windowMat=new THREE.MeshStandardMaterial({color:0x4d7380,roughness:.25});
  const houseBody=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),houseMat,42);
  const houseRoof=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,4),roofMat,42);
  const houseWindow=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),windowMat,42);
  const dummy=new THREE.Object3D();
  let houseCount=0;
  for(let i=0;i<42;i++){
    const x=(rand()-.5)*820,z=(rand()-.5)*820;
    if((Math.abs(x)<175&&z>-90&&z<145)||tileAt(x,z)===-1||terrainHeightAt(x,z)>13)continue;
    const y=terrainHeightAt(x,z),w=5+rand()*5,d=5+rand()*5,h=3.4+rand()*2.2;
    dummy.position.set(x,y+h/2,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,0,0);dummy.updateMatrix();houseBody.setMatrixAt(houseCount,dummy.matrix);
    dummy.position.set(x,y+h+1.1,z);dummy.scale.set(Math.max(w,d)*.78,2.8,Math.max(w,d)*.78);dummy.rotation.set(0,Math.PI/4,0);dummy.updateMatrix();houseRoof.setMatrixAt(houseCount,dummy.matrix);
    dummy.position.set(x,y+2,z+d/2+.05);dummy.scale.set(1.1,1,.08);dummy.rotation.set(0,0,0);dummy.updateMatrix();houseWindow.setMatrixAt(houseCount,dummy.matrix);
    houseCount++;
  }
  for(const mesh of [houseBody,houseRoof,houseWindow]){mesh.count=houseCount;mesh.castShadow=false;mesh.receiveShadow=false;scene.add(mesh);}

  const turbineMat=new THREE.MeshStandardMaterial({color:0xcbd0cb,metalness:.35,roughness:.48});
  const bladeMat=new THREE.MeshStandardMaterial({color:0xe5e8e2});
  for(const [x,z] of [[-390,-300],[-330,390],[390,-320],[420,360]]){
    const y=terrainHeightAt(x,z),mast=new THREE.Mesh(new THREE.CylinderGeometry(.65,1.05,48,10),turbineMat);
    mast.position.set(x,y+24,z);mast.castShadow=false;scene.add(mast);
    const rotor=new THREE.Group();rotor.position.set(x,y+47,z);scene.add(rotor);
    rotor.add(new THREE.Mesh(new THREE.SphereGeometry(1.3,12,8),turbineMat));
    for(let b=0;b<3;b++){
      const blade=new THREE.Mesh(new THREE.BoxGeometry(.85,20,.34),bladeMat);
      blade.position.y=10;blade.rotation.z=b*Math.PI*2/3;rotor.add(blade);
    }
    turbines.push(rotor);
  }
  const birdMat=new THREE.MeshBasicMaterial({color:0x354a51});
  for(let i=0;i<15;i++){
    const bird=new THREE.Group(),wing=new THREE.Mesh(new THREE.BoxGeometry(1.8,.08,.18),birdMat);
    wing.rotation.z=-.12;bird.add(wing);bird.position.set(-180+i*4.5,65+Math.sin(i)*3,170+Math.cos(i*.7)*10);birds.add(bird);
  }
  scene.add(birds);
  const stats={windTurbines:turbines.length,birds:birds.children.length,instancedHouses:houseCount};
  return {turbines,birds,stats,update(dt,wind){
    const speed=wind?wind.length():4;
    turbines.forEach((rotor,i)=>rotor.rotation.z+=dt*(.45+Math.min(15,speed)*.15+i*.025));
    const wx=wind?wind.x:0,wz=wind?wind.z:0;
    birds.position.x+=dt*(1.1+wx*.55);birds.position.z+=dt*wz*.35;
    if(birds.position.x>500)birds.position.x=-500;
    if(birds.position.x< -500)birds.position.x=500;
    if(birds.position.z>500)birds.position.z=-500;
    if(birds.position.z< -500)birds.position.z=500;
  }};
}
