import * as THREE from 'three';

// Schematic room zoning only. These are not clinical assignments or evacuation plans.
export function interiorLayout(b,floor){
 const vertical=b.kind==='crescent'||b.kind==='courtyard';
 const cx=b.kind==='crescent'?-65:b.kind==='courtyard'?45:b.x,cz=b.kind==='crescent'?5:b.z;
 let length=vertical?(b.kind==='crescent'?54:128):b.w-8;
 let width=vertical?(b.kind==='crescent'?20:60):b.d-8;
 if(b.kind==='oval'){length=b.w*.65;width=b.d*.65;}
 if(b.kind==='small'){length=b.w-4;width=b.d-4;}
 const corridor=Math.min(4,width*.3),n=Math.max(2,Math.floor(length/11)),cell=length/n,depth=(width-corridor)/2;
 const rect=(u,v,l,w)=>({x:cx+(vertical?v:u),z:cz+(vertical?u:v),w:vertical?w:l,d:vertical?l:w});
 const rooms=[];
 for(let i=0;i<n;i++)for(const side of [-1,1]){
  const kind=i===0&&side===-1?'stairs':i===0&&side===1?'lift':i===n-1&&side===1?'stairs':'room';
  const number=`${floor}${String(rooms.length+1).padStart(2,'0')}`;
  rooms.push({...rect(-length/2+cell*(i+.5),side*(corridor/2+depth/2),cell,depth),kind,side,vertical,id:`${b.id}-${number}`,label:kind==='stairs'?`楼梯 ${side<0?'A':'B'}`:kind==='lift'?'电梯厅':`房间 ${number}`});
 }
 return {rooms,corridor:rect(0,0,length,corridor),y:b.base+(floor-1)*(b.h-b.base)/b.floors+.61};
}
export function buildInterior(b,floor){
 const layout=interiorLayout(b,floor),group=new THREE.Group(),markers=[];
 const colors={room:0x83b6c8,stairs:0x329d89,lift:0x608acb,corridor:0x294c65};
 function box(w,h,d,x,y,z,color){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.75}));mesh.position.set(x,y,z);mesh.userData.interiorOwned=true;group.add(mesh);return mesh;}
 const c=layout.corridor,y=layout.y;box(c.w,.06,c.d,c.x,y,c.z,colors.corridor);
 for(const r of layout.rooms){
  box(r.w-.35,.07,r.d-.35,r.x,y,r.z,colors[r.kind]);
  const h=1.25,t=.16,door=Math.min(1.6,(r.vertical?r.d:r.w)*.4);
  // Three closed edges and a corridor-facing wall split by a real doorway.
  if(!r.vertical){
   for(const x of [r.x-r.w/2,r.x+r.w/2])box(t,h,r.d,x,y+h/2,r.z,0xc2dce2);
   box(r.w,h,t,r.x,y+h/2,r.z+r.side*r.d/2,0xc2dce2);
   const segment=(r.w-door)/2;for(const sign of [-1,1])box(segment,h,t,r.x+sign*(door+segment)/2,y+h/2,r.z-r.side*r.d/2,0xc2dce2);
  }else{
   for(const z of [r.z-r.d/2,r.z+r.d/2])box(r.w,h,t,r.x,y+h/2,z,0xc2dce2);
   box(t,h,r.d,r.x+r.side*r.w/2,y+h/2,r.z,0xc2dce2);
   const segment=(r.d-door)/2;for(const sign of [-1,1])box(t,h,segment,r.x-r.side*r.w/2,y+h/2,r.z+sign*(door+segment)/2,0xc2dce2);
  }
  if(r.kind==='stairs'){for(let i=0;i<7;i++)box(Math.min(r.w*.6,3),.1+i*.13,Math.min(r.d*.07,.7),r.x,y+.09+i*.065,r.z-r.d*.25+i*r.d*.07,0xc2f1e0);}
  if(r.kind==='lift'){const w=Math.min(r.w*.65,3),d=Math.min(r.d*.48,2.5);box(w,1.1,d,r.x,y+.55,r.z,0x24476d);box(.07,.85,d+.04,r.x,y+.5,r.z,0x9bbce0);}
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#0e2b3a';ctx.font='bold 46px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(r.label,256,64);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(r.w*.85,8),Math.min(r.d*.25,2)),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));label.rotation.x=-Math.PI/2;label.position.set(r.x,y+.09,r.z+(r.kind==='room'?0:r.d*.32));label.userData.interiorOwned=true;group.add(label);
  if(r.kind!=='room')markers.push({label:r.label,kind:r.kind,position:new THREE.Vector3(r.x,y+1.8,r.z)});
 }
 return {group,markers,layout};
}
