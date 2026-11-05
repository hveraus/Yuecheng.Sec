import * as THREE from 'three';

export function createParkingInventory(){
 const slots=[];
 for(let zone=0;zone<5;zone++)for(let n=0;n<100;n++){
  const row=Math.floor(n/10),col=n%10;
  slots.push({id:`${'ABCDE'[zone]}-${String(n+1).padStart(3,'0')}`,zone:'ABCDE'[zone],kind:'standard',level:0,x:zone*37-87+col*3.2,z:-64+Math.floor(row/2)*17+(row%2)*6,y:0});
 }
 for(let n=0;n<100;n++)for(let level=0;level<2;level++)slots.push({id:`M-${String(n+1).padStart(3,'0')}-${level?'U':'L'}`,zone:'M',kind:'mechanical',group:n+1,level,x:(n%20)*3.2-30,z:37+Math.floor(n/20)*11,y:level*3.5});
 return slots.map((s,i)=>({...s,occupied:(i*73)%700<386}));
}
export function parkingStats(slots){const occupied=slots.filter(s=>s.occupied).length;return {total:slots.length,occupied,free:slots.length-occupied,mechanical:slots.filter(s=>s.kind==='mechanical').length};}
export function filterParking(slots,{zone='all',status='all',level='all',query=''}={}){return slots.filter(s=>(zone==='all'||s.zone===zone)&&(status==='all'||s.occupied===(status==='occupied'))&&(level==='all'||s.level===Number(level))&&s.id.includes(query.trim().toUpperCase()));}
export function createParkingBrowser({scene,camera,controls,host,onFocus,onExit,onStats}){
 const slots=createParkingInventory(),root=new THREE.Group();root.name='地下停车场 · 示意';root.visible=false;scene.add(root);
 let active=false,saved=[],selected=null,oldMin=95;const filters={zone:'all',status:'all',level:'all',query:''};
 const panel=document.createElement('section');panel.className='parking-panel';panel.hidden=true;host.appendChild(panel);
 const caption=document.createElement('div');caption.className='parking-caption';caption.hidden=true;host.appendChild(caption);
 const marker=document.createElement('div');marker.className='parking-marker';marker.hidden=true;host.appendChild(marker);
 const material=color=>new THREE.MeshStandardMaterial({color,roughness:.7});
 function block(w,h,d,x,y,z,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));m.position.set(x,y,z);root.add(m);return m;}
 block(205,.8,178,0,-.8,10,0x142a3a);
 // Cutaway basement shell: open ceiling preserves visibility of every space.
 block(205,2.8,.5,0,.7,-79,0x375467);block(.5,2.8,178,-102,.7,10,0x375467);block(.5,2.8,178,102,.7,10,0x375467);
 for(const x of [-52,-15,22,59,96])for(const z of [-52,-18,16]){block(.7,3.8,.7,x,1.9,z,0x6c8b99);block(.8,.65,.8,x,.9,z,0xd4aa51);}
 const ramp=block(10,.3,23,-85,1.6,87,0x426074);ramp.rotation.x=-.13;
 for(const x of [-91,-79])block(.25,1.5,23,x,1.5,87,0x77a5b4);

 for(let zone=0;zone<5;zone++)for(let row=0;row<4;row++)block(32,.04,4,zone*37-72,.01,-51+row*17,0x284657);
 const bays=new THREE.InstancedMesh(new THREE.BoxGeometry(2.9,.18,5.4),material(0xffffff),700);
 const cars=new THREE.InstancedMesh(new THREE.BoxGeometry(1.9,1.05,4.1),material(0x9dbbd0),700);
 const roofs=new THREE.InstancedMesh(new THREE.BoxGeometry(1.7,.6,2.2),material(0x2f526b),700);
 root.add(bays,cars,roofs);const dummy=new THREE.Object3D(),color=new THREE.Color();const selectionOutline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.1,.25,5.6)),new THREE.LineBasicMaterial({color:0x9cf3ff}));selectionOutline.visible=false;root.add(selectionOutline);
 // One frame per two-level mechanical stack; levels remain individually addressable.
 const frames=new THREE.InstancedMesh(new THREE.BoxGeometry(.13,7.2,.13),material(0x6c8fa1),400);root.add(frames);let frameIndex=0;
 for(const s of slots.filter(s=>s.kind==='mechanical'&&s.level===0))for(const dx of [-1.5,1.5])for(const dz of [-2.7,2.7]){dummy.position.set(s.x+dx,3.5,s.z+dz);dummy.updateMatrix();frames.setMatrixAt(frameIndex++,dummy.matrix);}
 // A single atlas and mesh label all 700 spaces without hundreds of draw calls.
 const atlas=document.createElement('canvas');atlas.width=4096;atlas.height=1536;const ac=atlas.getContext('2d');ac.font='bold 23px monospace';ac.textAlign='center';ac.textBaseline='middle';ac.fillStyle='#e8ffff';
 const labelPositions=new Float32Array(700*18),labelUV=new Float32Array(700*12);
 slots.forEach((s,i)=>{const col=i%32,row=Math.floor(i/32);ac.fillText(s.id,col*128+64,row*64+32);const u=col/32,v=1-row/24,du=1/32,dv=1/24;labelUV.set([u,v-dv,u+du,v-dv,u+du,v,u,v-dv,u+du,v,u,v],i*12);});
 const labelGeo=new THREE.BufferGeometry();labelGeo.setAttribute('position',new THREE.BufferAttribute(labelPositions,3));labelGeo.setAttribute('uv',new THREE.BufferAttribute(labelUV,2));const labelTexture=new THREE.CanvasTexture(atlas);labelTexture.colorSpace=THREE.SRGBColorSpace;const numbers=new THREE.Mesh(labelGeo,new THREE.MeshBasicMaterial({map:labelTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));numbers.frustumCulled=false;root.add(numbers);
 function textLabel(text,x,z){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#a9d2df';ctx.font='bold 66px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,90);const m=new THREE.Mesh(new THREE.PlaneGeometry(23,5.75),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.12,z);root.add(m);}
 for(let i=0;i<5;i++)textLabel(`${'ABCDE'[i]} 区 · 100`,i*37-72,-72);textLabel('M 区 · 双层机械',0,29);
 textLabel('B1 · 地下车库示意',0,-76);textLabel('坡道出入口',-85,72);
 panel.innerHTML=`<header><b>地下停车场</b><button data-park-exit>返回院区 ×</button></header><div class="parking-totals"></div><p class="parking-note">500 个普通位 + 100 组双层机械位（200 个）<br>布局及占用状态为演示，未接入车位传感器。</p><div class="parking-filters"><label>区域<select data-park-zone><option value="all">全部区域</option>${['A','B','C','D','E','M'].map(z=>`<option value="${z}">${z} 区${z==='M'?' · 立体车位':''}</option>`).join('')}</select></label><label>状态<select data-park-status><option value="all">全部状态</option><option value="free">仅空闲</option><option value="occupied">仅占用</option></select></label><label>层位<select data-park-level><option value="all">上下层展开</option><option value="0">普通 / 机械下层</option><option value="1">仅机械上层</option></select></label></div><label class="parking-search">查找编号<input data-park-query placeholder="例如 A-001 或 M-001-U"></label><div class="parking-actions"><button data-park-view>俯视车位</button><button data-park-reset>全场复位</button></div><div class="parking-legend"><span>● 空闲</span><span>● 占用（有车）</span></div><div class="parking-selected">点击模型或下方编号查看车位</div><p class="parking-match" role="status"></p><div class="parking-grid"></div>`;
 function setMatrix(mesh,i,x,y,z,visible=true){dummy.position.set(x,y,z);dummy.scale.setScalar(visible?1:0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
 function elevation(s){return s.level?7:0;}
 function render(){const visible=filterParking(slots,filters),ids=new Set(visible.map(s=>s.id));
  slots.forEach((s,i)=>{const show=ids.has(s.id),y=elevation(s);setMatrix(bays,i,s.x,y+.15,s.z,show);const x=s.x,z=s.z+2.4,ly=y+.25;if(show)labelPositions.set([x-1.35,ly,z+.24,x+1.35,ly,z+.24,x+1.35,ly,z-.24,x-1.35,ly,z+.24,x+1.35,ly,z-.24,x-1.35,ly,z-.24],i*18);else labelPositions.fill(0,i*18,i*18+18);color.setHex(s.occupied?0xd58742:0x28a78c);bays.setColorAt(i,color);setMatrix(cars,i,s.x,y+.82,s.z,show&&s.occupied);setMatrix(roofs,i,s.x,y+1.6,s.z-.1,show&&s.occupied);});
  for(const m of [bays,cars,roofs]){m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();}bays.instanceColor.needsUpdate=true;labelGeo.attributes.position.needsUpdate=true;
  frames.visible=(filters.zone==='all'||filters.zone==='M')&&filters.level==='all'&&filters.status==='all'&&!filters.query;
  const stats=parkingStats(slots);panel.querySelector('.parking-totals').innerHTML=`<div><small>总车位</small><b>${stats.total}</b></div><div><small>空闲</small><b>${stats.free}</b></div><div><small>占用</small><b>${stats.occupied}</b></div>`;
  panel.querySelector('.parking-match').textContent=`当前显示 ${visible.length} 个 · 空闲 ${visible.filter(s=>!s.occupied).length} 个`;
  panel.querySelector('.parking-grid').innerHTML=visible.map(s=>`<button class="${s.occupied?'occupied':'free'}${s===selected?' selected':''}" data-space="${s.id}" aria-label="${s.id} ${s.occupied?'占用':'空闲'}">${s.id}<small>${s.occupied?'有车':'空闲'}</small></button>`).join('')||'<p>没有匹配车位</p>';
  panel.querySelectorAll('[data-space]').forEach(el=>el.onclick=()=>select(slots.find(s=>s.id===el.dataset.space),true));
  if(selected&&!ids.has(selected.id))selected=null;
  panel.querySelector('.parking-selected').innerHTML=selected?`<strong>${selected.id} · ${selected.occupied?'占用 / 有车':'空闲 / 无车'}</strong><p>B1 · ${selected.zone} 区 · ${selected.kind==='mechanical'?`第 ${selected.group} 组 · ${selected.level?'机械上层':'机械下层'}`:'普通平面车位'}</p><button data-park-simulate>演示：切换为${selected.occupied?'空闲':'占用'}</button>`:'点击模型或下方编号查看车位';
  if(selected){panel.querySelector('[data-park-simulate]').textContent=`演示：切换为${selected.occupied?'空闲':'占用'}`;panel.querySelector('[data-park-simulate]').onclick=()=>{selected.occupied=!selected.occupied;render();};}
  selectionOutline.visible=!!selected;if(selected)selectionOutline.position.set(selected.x,elevation(selected)+.18,selected.z);onStats(stats);
 }
 function fit(top=false){onFocus();const visible=filterParking(slots,filters);if(!visible.length)return;const box=new THREE.Box3();for(const s of visible){box.expandByPoint(new THREE.Vector3(s.x-2,0,s.z-3));box.expandByPoint(new THREE.Vector3(s.x+2,elevation(s)+2,s.z+3));}const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());controls.target.copy(center);const distance=Math.max(size.x/camera.aspect,size.z,35)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.5;camera.position.copy(center).add(top?new THREE.Vector3(0,distance,.001):new THREE.Vector3(-.35,.95,1).normalize().multiplyScalar(distance));controls.update();}
 function select(s,focus){selected=s;render();if(focus){onFocus();controls.target.set(s.x,elevation(s),s.z);camera.position.copy(controls.target).add(new THREE.Vector3(-14,24,25));controls.update();}}
 for(const key of ['zone','status','level'])panel.querySelector(`[data-park-${key}]`).onchange=e=>{filters[key]=e.target.value;render();fit();};
 panel.querySelector('[data-park-query]').oninput=e=>{filters.query=e.target.value;render();if(filterParking(slots,filters).length)fit();};
 panel.querySelector('[data-park-view]').onclick=()=>fit(true);panel.querySelector('[data-park-reset]').onclick=()=>{Object.assign(filters,{zone:'all',status:'all',level:'all',query:''});for(const key of ['zone','status','level','query'])panel.querySelector(`[data-park-${key}]`).value=filters[key];selected=null;render();fit();};
 panel.querySelector('[data-park-exit]').onclick=()=>{exit();onExit();};
 function enter(){if(active)return;onFocus();active=true;oldMin=controls.minDistance;controls.minDistance=15;saved=scene.children.filter(o=>o!==root&&!o.isLight).map(o=>[o,o.visible]);saved.forEach(([o])=>o.visible=false);root.visible=true;host.classList.add('parking-active');panel.hidden=false;caption.hidden=false;caption.innerHTML='<b>B1 地下停车场 · 剖切示意</b><span>700 个车位 · 机械上下层分开展示</span>';render();fit();}
 function exit(){if(!active)return;active=false;root.visible=false;saved.forEach(([o,v])=>o.visible=v);saved=[];controls.minDistance=oldMin;camera.clearViewOffset();host.classList.remove('parking-active');panel.hidden=true;caption.hidden=true;marker.hidden=true;}
 function pick(ray){if(!active)return false;const ids=new Set(filterParking(slots,filters).map(s=>s.id));const hit=ray.intersectObjects([bays,cars,roofs],false).find(h=>h.instanceId!==undefined&&ids.has(slots[h.instanceId].id));if(hit&&hit.instanceId!==undefined)select(slots[hit.instanceId],false);return true;}
 function update(){if(!active)return;const w=host.clientWidth,h=host.clientHeight,compact=w<=720,ox=compact?0:(panel.offsetWidth+22)/2,oy=compact?(panel.offsetHeight+20)/2:0;const v=camera.view;if(!v?.enabled||v.fullWidth!==w||v.fullHeight!==h||v.offsetX!==ox||v.offsetY!==oy)camera.setViewOffset(w,h,ox,oy,w,h);marker.hidden=!selected;if(selected){const p=new THREE.Vector3(selected.x,elevation(selected)+2.5,selected.z).project(camera);marker.hidden=p.z>1||p.z<-1;marker.textContent=`${selected.id} · ${selected.occupied?'有车':'空闲'}`;marker.style.left=`${(p.x*.5+.5)*w}px`;marker.style.top=`${(-p.y*.5+.5)*h}px`;}}
 render();return {enter,exit,pick,update,get active(){return active;},slots};
}
