import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildCampus,campusBuildings} from '../dist/campus-model.js';
import {floorDevices} from '../dist/floor-browser.js';
globalThis.document={createElement:()=>({getContext:()=>({fillText(){}})})};
const scene=new THREE.Scene(),buildingMeshes=[],buildingGroups=[];
const campus=buildCampus(scene,{buildingMeshes,buildingGroups});scene.updateMatrixWorld(true);
const ids=new Set();let count=0;
for(const b of campusBuildings){
 for(let f=1;f<=b.floors;f++){
  const meshes=buildingMeshes.filter(m=>m.userData.building.id===b.id&&m.userData.floor===f);
  assert.equal(meshes.length,3,`${b.id} ${f}F floor surfaces`);
  const devices=floorDevices(b,f);assert.equal(devices.length,4);
  for(const d of devices){
   assert.equal(d.building,b.id);assert.equal(d.floor,f);assert(!ids.has(d.id));ids.add(d.id);
   const ray=new THREE.Raycaster(new THREE.Vector3(d.x,d.y+10,d.z),new THREE.Vector3(0,-1,0));
   assert(ray.intersectObject(meshes[0]).length>0,`${d.id} must sit within the actual floor slab, outside courtyard holes`);
   count++;
  }
 }
}
console.log(`PASS: ${campusBuildings.length} buildings, ${count/4} floors, ${count} unique floor-bound devices inside slab geometry`);
const {interiorLayout}=await import('../dist/floor-interior.js');
let roomCount=0;
for(const b of campusBuildings)for(let f=1;f<=b.floors;f++){
 const layout=interiorLayout(b,f),slab=buildingMeshes.find(m=>m.userData.building.id===b.id&&m.userData.floor===f);
 assert.equal(layout.rooms.filter(r=>r.kind==='stairs').length,2);
 assert.equal(layout.rooms.filter(r=>r.kind==='lift').length,1);
 for(const room of [...layout.rooms,layout.corridor])for(const dx of [-.5,0,.5])for(const dz of [-.5,0,.5]){
  const ray=new THREE.Raycaster(new THREE.Vector3(room.x+dx*room.w,layout.y+10,room.z+dz*room.d),new THREE.Vector3(0,-1,0));
  assert(ray.intersectObject(slab).length,`${b.id} ${f}F ${room.label||'corridor'} must remain inside slab`);
 }
 roomCount+=layout.rooms.length;
}
console.log(`PASS: ${roomCount} room/core zones remain inside floors; two stairs and one lift per floor`);

assert(campus.landscape.positions.length>250,'Landscape includes substantial grove planting');
for(const p of campus.landscape.positions){const ray=new THREE.Raycaster(new THREE.Vector3(p.x,80,p.z),new THREE.Vector3(0,-1,0));assert.equal(ray.intersectObjects(buildingMeshes,false).length,0,'Tree trunk stays outside buildings');}
const water=scene.getObjectByName('动态景观水系');
campus.update(12);assert.equal(water.children[0].material.uniforms.time.value,12);
campus.update(0);assert.equal(water.children[0].material.uniforms.time.value,0);
console.log(`PASS: ${campus.landscape.positions.length} trees outside buildings; water animation time and reduced-motion reset`);
