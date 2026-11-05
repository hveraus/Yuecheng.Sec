import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {campusBuildings,campusDevices,campusView} from '../dist/campus-model.js';
const elements=new Map(),listeners=[];
function element(key){if(!elements.has(key)){const classes=new Set();elements.set(key,{hidden:true,style:{},dataset:{},value:'',classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,force){const on=force??!classes.has(k);on?classes.add(k):classes.delete(k);return on;}},focus(){},setAttribute(){},click(){this.onclick?.();},innerHTML:'',textContent:''});}return elements.get(key);}
const context=vm.createContext({THREE,campusBuildings,campusDevices,campusView,console,Date,Set,Math,performance,matchMedia:()=>({matches:true}),setInterval(){},setTimeout(){},clearTimeout(){},document:{querySelector:element,querySelectorAll:()=>[],body:element('body')},window:{addEventListener:(type,fn)=>listeners.push([type,fn])}});
let source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
source=source.slice(0,source.lastIndexOf('\nrenderAlerts();'));
vm.runInContext(source,context);
vm.runInContext("flyTo=()=>{};renderAlerts=()=>{};",context);
// All device categories must appear in a building inventory.
vm.runInContext("showBuildingDevices('b1')",context);
assert.match(element('#modalBody').innerHTML,/D01/);
assert.match(element('#modalBody').innerHTML,/P01/);
// An alarm/device selection must reveal a previously hidden layer.
element('[data-layer="camera"]').onclick=()=>element('[data-layer="camera"]').classList.add('active');
vm.runInContext("selectDevice(devices.find(d=>d.id==='C01'))",context);
assert.equal(element('[data-layer="camera"]').classList.contains('active'),true);
// Escape closes the topmost dialog only, retaining expanded model mode.
element('.scene-panel').classList.add('model-focused');element('#modal').hidden=false;
for(const [type,fn] of listeners)if(type==='keydown')fn({key:'Escape'});
assert.equal(element('#modal').hidden,true);
assert.equal(element('.scene-panel').classList.contains('model-focused'),true);
assert.equal(element('body').style.overflow,'hidden');
// Preview rendering restores the exact user camera pose and canvas size.
vm.runInContext(`camera=new THREE.PerspectiveCamera();camera.position.set(1,2,3);camera.lookAt(4,5,6);controls={target:new THREE.Vector3(4,5,6)};scene={};renderer={getSize:v=>v.set(800,600),setSize(){},render(){},domElement:{toDataURL:()=> 'data:image/jpeg;base64,test'}};renderMonitors=()=>{};`,context);
const before=vm.runInContext('camera.quaternion.toArray().join() ',context);
vm.runInContext('generatePreviews()',context);
assert.equal(vm.runInContext('camera.quaternion.toArray().join()',context),before);
assert.equal(vm.runInContext('Object.keys(previewImages).length',context),22);
assert.equal(new Set(campusDevices.map(d=>d.id)).size,22);
assert(campusDevices.every(d=>campusBuildings.some(b=>b.id===d.building)));
console.log('PASS: complete device inventory, hidden-layer reveal, modal Escape, camera restoration, 22 dedicated previews, device mappings');
