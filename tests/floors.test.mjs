import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildCampus,campusBuildings} from '../dist/campus-model.js';
import {floorDevices} from '../dist/floor-browser.js';
globalThis.document={createElement:()=>({getContext:()=>({fillText(){}})})};
const scene=new THREE.Scene(),buildingMeshes=[],buildingGroups=[];
buildCampus(scene,{buildingMeshes,buildingGroups});scene.updateMatrixWorld(true);
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
