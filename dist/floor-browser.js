import * as THREE from 'three';

// Relative demo coordinates, explicitly separate from the outdoor inventory.
export function floorDevices(b,floor){
 const step=(b.h-b.base)/b.floors;
 const x=b.kind==='crescent'?-65:b.kind==='courtyard'?45:b.x;
 const z=b.kind==='crescent'?5:b.z;
 const dx=b.kind==='crescent'?5:b.w*.2, dz=b.kind==='crescent'?17:b.d*.18;
 return [['camera',-dx,-dz],['camera',dx,dz],['door',0,0],['fire',dx,-dz]].map(([type,ox,oz],i)=>({id:`${b.id.toUpperCase()}-${floor}F-${type.toUpperCase()}-${i+1}`,building:b.id,floor,type,x:x+ox,y:b.base+(floor-1)*step+1.2,z:z+oz}));
}
export function createFloorBrowser({scene,camera,controls,meshes,host,onExit,onFocus,onDevice}){
 let building=null,chosen=null,saved=[],floors=[],points=[],floorLabels=[],counts=[];
 const root=new THREE.Group();root.name='楼栋分层';scene.add(root);
 const overlay=document.createElement('div');overlay.className='floor-overlays';host.appendChild(overlay);
 const panel=document.createElement('section');panel.className='floor-panel';panel.hidden=true;host.appendChild(panel);
 const symbol={camera:'◉',door:'▥',fire:'♧'},names={camera:'摄像头',door:'门禁',fire:'消防'};
 function exit(){if(!building)return;saved.forEach(([o,v])=>o.visible=v);saved=[];counts.forEach(([el,value])=>el.textContent=value);counts=[];chosen=null;for(const g of floors)g.traverse(o=>{if(o.isMesh)o.material.dispose();});root.clear();overlay.replaceChildren();panel.hidden=true;building=null;floors=[];points=[];floorLabels=[];host.classList.remove('floor-active');}
 function focus(){onFocus();const box=new THREE.Box3();root.updateMatrixWorld(true);floors.filter(g=>g.visible).forEach(g=>box.expandByObject(g));const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const span=Math.max(size.x/Math.max(camera.aspect,.5),size.z,size.y,30);const dist=span/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.45;controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(-.7,.95,1).normalize().multiplyScalar(dist));controls.update();}
 function show(floor){if(!building)return;chosen=floor;document.querySelectorAll('[data-layer]').forEach(el=>{const count=el.querySelector('b');if(count)count.textContent=String(({camera:2,door:1,fire:1,patrol:0}[el.dataset.layer]??0)*(floor===null?building.floors:1));});floors.forEach((g,i)=>{g.visible=floor===null||floor===i+1;g.position.y=floor===null?i*9:-building.base-i*(building.h-building.base)/building.floors;});panel.querySelector('.floor-current').textContent=floor===null?'各层展开 · 点击楼层查看':`${floor}F · 单层隔离 · 4 个演示点位`;panel.querySelectorAll('[data-floor]').forEach(b=>b.classList.toggle('active',Number(b.dataset.floor)===floor));panel.querySelector('[data-action="explode"]').classList.toggle('active',floor===null);focus();}
 function enter(b){exit();counts=[...document.querySelectorAll('[data-layer] b')].map(el=>[el,el.textContent]);building=b;host.classList.add('floor-active');saved=scene.children.filter(o=>o!==root&&!o.isLight).map(o=>[o,o.visible]);saved.forEach(([o])=>o.visible=false);
  for(let f=1;f<=b.floors;f++){const g=new THREE.Group();root.add(g);floors.push(g);const sources=meshes.filter(m=>m.userData.building.id===b.id&&m.userData.floor===f);for(let j=0;j<sources.length;j++){const source=sources[j],m=new THREE.Mesh(source.geometry,source.material.clone());m.position.copy(source.position);m.userData.floor=f;m.material.wireframe=false;m.material.transparent=j!==0;m.material.opacity=j===0?1:.12;m.material.depthWrite=j===0;g.add(m);}
   const label=document.createElement('button');label.className='floor-label';label.textContent=`${f}F`;label.onclick=()=>show(f);overlay.appendChild(label);floorLabels.push({el:label,group:g,floor:f,position:new THREE.Vector3(b.kind==='crescent'?-82:b.x-b.w/2,b.base+(f-1)*(b.h-b.base)/b.floors+1,b.z)});
   for(const d of floorDevices(b,f)){const el=document.createElement('button');el.className=`map-point ${d.type}`;el.textContent=symbol[d.type];el.title=`${f}F ${names[d.type]} · 演示`;el.setAttribute('aria-label',d.id);let down=null;el.onpointerdown=e=>{down=[e.clientX,e.clientY];el.setPointerCapture(e.pointerId);};el.onpointercancel=()=>down=null;el.onpointerup=e=>{e.preventDefault();e.stopPropagation();if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<6)onDevice(d,names[d.type]);down=null;};el.onclick=e=>{if(e.detail===0)onDevice(d,names[d.type]);};overlay.appendChild(el);points.push({el,group:g,position:new THREE.Vector3(d.x,d.y,d.z),d});}
  }
  panel.innerHTML=`<div class="floor-panel-head"><b>${b.name} · 楼层浏览</b><button data-action="exit">返回院区 ×</button></div><p class="floor-current"></p><div class="floor-actions"><button data-action="explode">展开全部楼层</button><button data-action="top">俯视本层</button></div><div class="floor-buttons">${Array.from({length:b.floors},(_,i)=>`<button data-floor="${i+1}">${i+1}F</button>`).reverse().join('')}</div><p class="floor-note">楼层编号为模型内演示编号。点位、层高按示意配置，未接入真实室内平面。</p>`;
  panel.querySelector('[data-action="exit"]').onclick=()=>{exit();onExit();};panel.querySelector('[data-action="explode"]').onclick=()=>show(null);panel.querySelector('[data-action="top"]').onclick=()=>{onFocus();const distance=camera.position.distanceTo(controls.target);camera.position.copy(controls.target).add(new THREE.Vector3(.001,distance,0));controls.update();};panel.querySelectorAll('[data-floor]').forEach(el=>el.onclick=()=>show(Number(el.dataset.floor)));panel.hidden=false;show(null);
 }
 const projected=new THREE.Vector3();
 function update(){if(!building)return;root.updateMatrixWorld(true);for(const p of [...floorLabels,...points]){const layer=p.d?document.querySelector(`[data-layer="${p.d.type}"]`):null;let hidden=!p.group.visible||(layer&&!layer.classList.contains('active'));if(!hidden){projected.copy(p.position).add(p.group.position).project(camera);hidden=projected.z>1||projected.z<-1;const left=`${(projected.x*.5+.5)*host.clientWidth}px`,top=`${(-projected.y*.5+.5)*host.clientHeight}px`;if(p.el.style.left!==left)p.el.style.left=left;if(p.el.style.top!==top)p.el.style.top=top;}if(p.el.hidden!==!!hidden)p.el.hidden=!!hidden;}}

 function pick(raycaster){if(!building)return false;const candidates=floors.filter(g=>g.visible).flatMap(g=>g.children);const hit=raycaster.intersectObjects(candidates,false)[0];if(hit)show(hit.object.userData.floor);return true;}
 return {enter,exit,update,pick,get active(){return !!building;},get selectedFloor(){return chosen;}};
}
