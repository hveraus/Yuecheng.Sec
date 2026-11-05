import * as THREE from 'three';
import {createFlowingWater,addLandscape} from './landscape.js';

// Relative reconstruction from the two supplied images, not surveyed coordinates.
// x follows the long axis of 3/5/6; z runs from the annex to the main courtyard.
// Floor counts and dimensions are visual estimates. No unlabelled No.4 is inferred.
export const campusBuildings = [
 {id:'b1',number:1,name:'1号楼',short:'1号楼',description:'沿街弧形主楼 · 双天井与屋顶绿化',x:-56,z:6,w:57,d:145,h:17,floors:4,base:0,kind:'crescent',color:0x47d5dc},
 {id:'b2',number:2,name:'2号楼',short:'2号楼',description:'中央裙房 · 三组内庭院与联系廊道',x:24,z:6,w:111,d:144,h:14,floors:4,base:0,kind:'courtyard',color:0xe65366},
 {id:'b3',number:3,name:'3号楼',short:'3号楼',description:'平行条形楼体 · 圆角横向层带',x:48,z:49,w:73,d:25,h:43,floors:8,base:14,kind:'tower',color:0xefc83d},
 {id:'b5',number:5,name:'5号楼',short:'5号楼',description:'平行条形楼体 · 中部楼栋',x:48,z:2,w:73,d:25,h:46.5,floors:9,base:14,kind:'tower',color:0x9bcc50},
 {id:'b6',number:6,name:'6号楼',short:'6号楼',description:'平行条形楼体 · 靠近连廊一侧',x:48,z:-45,w:73,d:25,h:46.5,floors:9,base:14,kind:'tower',color:0x3eba88},
 {id:'b7',number:7,name:'7号楼',short:'7号楼',description:'独立组团 · 右侧条形楼体',x:32,z:-127,w:49,d:23,h:29,floors:7,base:2,kind:'annex',color:0xc2a28e},
 {id:'b8',number:8,name:'8号楼',short:'8号楼',description:'独立组团 · 弧形连接体',x:-8,z:-111,w:31,d:29,h:12,floors:3,base:0,kind:'oval',color:0xd367ad},
 {id:'b9',number:9,name:'9号楼',short:'9号楼',description:'独立组团 · 左侧条形楼体',x:-42,z:-129,w:49,d:23,h:29,floors:7,base:2,kind:'annex',color:0x6da8bf},
 {id:'b10',number:10,name:'10号楼',short:'10号楼',description:'总平面图中的小型附属楼',x:90,z:-44,w:13,d:15,h:7,floors:2,base:0,kind:'small',color:0x9984c6},
];
export const campusDevices = [
 ['C01','1号楼主入口','camera',-83,8,15,'b1'],['C02','1号楼沿街通道','camera',-68,9,75,'b1'],['C03','2号楼入口广场','camera',-20,8,84,'b2'],['C04','3号楼入口','camera',87,20,49,'b3'],['C05','5号楼入口','camera',86,20,2,'b5'],['C06','6号楼入口','camera',86,20,-45,'b6'],['C07','7号楼前广场','camera',33,8,-109,'b7'],['C08','敬宾路院区出入口','camera',-109,6,-37,'b1'],['C09','9号楼西侧周界','camera',-78,7,-132,'b9'],['C10','8号楼连接区域','camera',-8,16,-109,'b8'],['C11','10号楼停车区域','camera',105,6,-25,'b10'],['C12','跨河连廊','camera',-7,15,-83,'b2'],
 ['D01','1号楼主入口门禁','door',-80,5,9,'b1'],['D02','3号楼门禁','door',47,17,64,'b3'],['D03','7号楼门禁','door',47,6,-112,'b7'],['D04','连廊门禁','door',-8,12,-65,'b2'],
 ['F01','2号楼消防通道','fire',-13,3,89,'b2'],['F02','9号楼消防感知','fire',-68,7,-123,'b9'],['F03','5号楼消防感知','fire',24,21,15,'b5'],
 ['P01','一号巡逻组','patrol',-95,3,42,'b1'],['P02','二号巡逻组','patrol',92,3,75,'b3'],['P03','三号巡逻组','patrol',15,3,-150,'b7'],
].map(([id,name,type,x,y,z,building])=>({id,name,type,position:new THREE.Vector3(x,y,z),building}));
export const campusView={
 overview:{position:new THREE.Vector3(-325,265,-360),target:new THREE.Vector3(0,6,-28)},
 plan:{position:new THREE.Vector3(-150,350,400),target:new THREE.Vector3(0,0,-27)},
 aerial:{position:new THREE.Vector3(-.1,435,-27),target:new THREE.Vector3(0,0,-27)},
};

function rounded(w,d,r=5){r=Math.min(r,w/2,d/2);const s=new THREE.Shape(),x=-w/2,y=-d/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+d-r);s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);s.lineTo(x+r,y+d);s.quadraticCurveTo(x,y+d,x,y+d-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function crescent(){const s=new THREE.Shape();s.moveTo(-63,67);s.quadraticCurveTo(-77,67,-79,50);s.bezierCurveTo(-90,17,-86,-30,-69,-67);s.quadraticCurveTo(-65,-78,-53,-78);s.lineTo(-27,-73);s.bezierCurveTo(-34,-23,-35,10,-30,46);s.quadraticCurveTo(-28,62,-39,65);s.closePath();return s;}
function hole(s,x,z,w,d,r=3){const h=rounded(w,d,r);const p=new THREE.Path(h.getPoints(16).map(p=>new THREE.Vector2(p.x+x,p.y-z)));s.holes.push(p);}
function geometry(shape,height){const g=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:12});g.rotateX(-Math.PI/2);g.computeVertexNormals();return g;}
function worldShape(w,d,r,x,z){const s=rounded(w,d,r);return new THREE.Shape(s.getPoints(10).map(p=>new THREE.Vector2(p.x+x,p.y-z)));}

export function buildCampus(scene,{buildingMeshes,buildingGroups}){
 const solid=(color,roughness=.8,metalness=.1)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const palette={wall:solid(0xb6ced8,.48,.25),band:solid(0xd6e4e8,.55,.15),glass:solid(0x234b61,.2,.45),roof:solid(0xdbe4df),green:solid(0x477c65),path:solid(0xa8b4b0),ground:solid(0x243e32),pave:solid(0x445966),road:solid(0x213744),water:solid(0x2c8197,.2,.55)};
 const colored=[];let planColor=false,wire=false;
 function slab(s,y,h,mat,parent=scene,b=null){const m=new THREE.Mesh(geometry(s,h),mat);m.position.y=y;m.receiveShadow=true;m.castShadow=!!b;parent.add(m);if(b){m.userData.building=b;buildingMeshes.push(m);colored.push({m,original:mat,color:b.color});}return m;}
 function block(w,h,d,x,y,z,mat,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;}
 function line(points,color=0x548a9d,opacity=.6,parent=scene){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity}));parent.add(m);return m;}
 function decal(text,x,z,w,d,rotation=0,color='#8caeb8'){const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.font='500 55px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,512,64);const mat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);m.rotation.set(-Math.PI/2,0,rotation);m.position.set(x,.36,z);scene.add(m);}
 // Site board and a quiet urban grid retain the command-center context.
 slab(worldShape(330,350,24,0,-12),-4,3,palette.pave);
 slab(worldShape(327,347,23,0,-12),-1,1,palette.ground);
 const outline=worldShape(330,350,24,0,-12).getPoints(90).map(p=>[p.x,-.9,-p.y]);line([...outline,outline[0]],0x5aa1b6,.7);
 const grid=new THREE.GridHelper(900,75,0x214d61,0x102b3a);grid.position.set(0,-4.1,-25);scene.add(grid);
 // Jingbin Road runs along the curved main building, as labelled in the plan.
 block(16,.12,270,-114,.1,-26,palette.road);block(230,.12,12,4,.1,100,palette.road);block(12,.12,245,119,.1,-18,palette.road);block(228,.12,10,0,.1,-161,palette.road);
 for(let z=-151;z<102;z+=12){block(.3,.05,5,-114,.2,z,palette.path);block(.25,.05,4,119,.2,z,palette.path);}
 for(let x=-99;x<115;x+=12){block(5,.05,.25,x,.2,100,palette.path);}
 decal('敬　宾　路',-115,-15,66,5,Math.PI/2);decal('越 城 院 区',-3,110,80,6);decal('院 内 环 路',111,27,47,4,Math.PI/2);
 // Winding landscape waterway divides the annex from the main hospital.
 const river=new THREE.Shape();river.moveTo(-104,101);river.bezierCurveTo(-70,83,-32,99,15,84);river.bezierCurveTo(62,70,91,85,107,110);river.lineTo(115,109);river.bezierCurveTo(101,69,63,57,14,71);river.bezierCurveTo(-31,87,-73,70,-104,87);river.closePath();
 const creek=new THREE.Shape();creek.moveTo(100,143);creek.bezierCurveTo(91,87,102,50,101,8);creek.bezierCurveTo(99,-30,101,-55,108,-78);creek.lineTo(117,-77);creek.bezierCurveTo(109,-32,112,1,111,35);creek.bezierCurveTo(108,82,107,112,112,143);creek.closePath();
 const pond=new THREE.Shape();pond.absellipse(97,132,22,17,0,Math.PI*2);const water=createFlowingWater([river,creek,pond]);scene.add(water.group);
 // Plazas, garden edges and the detached northern group podium.
 slab(worldShape(33,130,12,-92,9),.15,.15,palette.pave);
 slab(worldShape(89,27,9,-14,-111),.25,1.3,palette.pave);
 slab(worldShape(52,22,8,38,82),.15,.18,palette.pave);
 for(const b of campusBuildings){
  const group=new THREE.Group();group.name=b.name;scene.add(group);buildingGroups.push({b,group});
  const base=b.base||0,height=b.h-base,step=height/b.floors;
  function footprint(wInset=0){let s;if(b.kind==='crescent'){s=crescent();hole(s,-57,-42,11,14,2);hole(s,-48,45,11,15,2);}else if(b.kind==='courtyard'){s=worldShape(b.w-wInset,b.d-wInset,8,b.x,b.z);for(let z of [-37,2,41])hole(s,-7,z,32,29,4);}else if(b.kind==='oval'){s=new THREE.Shape();s.absellipse(b.x,-b.z,b.w/2-wInset/2,b.d/2-wInset/2,0,Math.PI*2);}else{s=worldShape(b.w-wInset,b.d-wInset,b.kind==='small'?2:6,b.x,b.z);}return s;}
  if(b.base&&b.kind==='annex')slab(worldShape(b.w+4,b.d+5,7,b.x,b.z),0,b.base,palette.wall,group,b);
  for(let f=0;f<b.floors;f++){
   const y=base+f*step;
   slab(footprint(b.kind==='tower'&&f<2?1:0),y,.58,palette.band,group,b).userData.floor=f+1;
   slab(footprint(1.1),y+.58,step-.72,palette.glass,group,b).userData.floor=f+1;
   slab(footprint(),y+step-.14,.14,palette.wall,group,b).userData.floor=f+1;
  }
  slab(footprint(-.8),b.h,.65,palette.band,group,b);
  if(b.kind==='crescent'){
   const green=crescent();hole(green,-57,-42,13,16);hole(green,-48,45,13,17);slab(green,b.h+.68,.16,palette.green,group,b);
   // Long roof promenades and two glazed roof lights visible in both references.
   for(let z of [-42,45]){const x=z<0?-57:-48;const frame=worldShape(13,17,2,x,z);hole(frame,x,z,10,14,1);slab(frame,b.h+.8,1,palette.band,group);slab(worldShape(10,14,1,x,z),b.h-.5,.2,palette.glass,group);}
   block(2,.2,110,-65,b.h+.9,4,palette.path,group);
   for(let z of [-48,-25,4,28,52]){block(13,.7,4,-80,4,z,palette.band,group);block(.45,3.5,.45,-84,1.8,z-1.5,palette.wall,group);block(.45,3.5,.45,-84,1.8,z+1.5,palette.wall,group);}
  }else if(['tower','annex'].includes(b.kind)){
   slab(worldShape(b.w-3,b.d-3,5,b.x,b.z),b.h+.66,.2,palette.green,group);
   slab(worldShape(b.w-13,b.d-7,5,b.x+2,b.z),b.h+.9,1.2,palette.roof,group,b);
   // Slender vertical mullions articulate the dark ribbon windows.
   for(let x=b.x-b.w/2+7;x<b.x+b.w/2-6;x+=5){for(let sign of [-1,1])line([[x,base+1,b.z+sign*(b.d/2-.6)],[x,b.h,b.z+sign*(b.d/2-.6)]],0xa1bac4,.32,group);}
  }else if(b.kind==='courtyard'){
   for(let z of [-37,2,41]){
    slab(worldShape(29,26,3,-7,z),.6,.3,palette.green,group);
    block(2,.4,24,-7,1,z,palette.path,group);block(27,.4,2,-7,1,z,palette.path,group);
    const rim=worldShape(35,32,4,-7,z);hole(rim,-7,z,32,29,3);slab(rim,b.h+.75,.25,palette.path,group);
   }
   for(let z of [-17,22]){slab(worldShape(37,5,1,-7,z),9,3.4,palette.glass,group,b);slab(worldShape(38,6,1,-7,z),12.4,.5,palette.band,group,b);}
  }
 }
 // An enclosed, light bridge spans the landscaped waterway to the 7/8/9 group.
 const bridge=new THREE.Group();bridge.name='跨河连廊';scene.add(bridge);
 slab(worldShape(7,48,1,-7,-85),8.5,.7,palette.wall,bridge);
 slab(worldShape(6.2,48,.6,-7,-85),9.2,3.3,palette.glass,bridge);
 slab(worldShape(8,49,1,-7,-85),12.5,.7,palette.roof,bridge);
 for(let z=-108;z<-61;z+=4){block(.18,3.3,1,-10.2,10.85,z,palette.band,bridge);block(.18,3.3,1,-3.8,10.85,z,palette.band,bridge);}
 for(let z of [-98,-73])block(1.1,8.5,1.1,-7,4.25,z,palette.wall,bridge);
 // Entry canopy and road crossings facing Jingbin Road.
 slab(worldShape(19,24,4,-91,-18),5.7,.7,palette.band);block(.5,5.7,.5,-99,2.85,-27,palette.wall);block(.5,5.7,.5,-99,2.85,-9,palette.wall);
 for(let i=0;i<8;i++){block(12,.06,.8,-114,.24,-24+i*2,palette.path);block(.8,.06,12,-88+i*2,.24,100,palette.path);}
 const landscape=addLandscape(scene,buildingMeshes,[river,creek,pond]);
 // Surface parking, parked vehicles, and subtle street lighting.
 const carMat=solid(0x9db7c1,.4,.35);let cars=[];
 for(let i=0;i<10;i++){const z=-40+i*9;line([[98,.25,z],[106,.25,z],[106,.25,z+6]],0x7f999e,.6);if(i%3)cars.push([102,z+3]);}
 for(let i=0;i<7;i++){const x=7+i*11;line([[x,.25,-151],[x,.25,-143],[x+7,.25,-143]],0x7f999e,.6);if(i%2)cars.push([x+3,-147]);}
 cars.push([-114,53],[-114,-90],[72,100]);for(let i=0;i<cars.length;i++){const [x,z]=cars[i];block(2.2,1.1,4.3,x,.8,z,carMat);block(1.9,.7,2.4,x,1.6,z,palette.glass);}
 for(let z=-137;z<94;z+=30){block(.25,5,.25,-103,2.5,z,palette.wall);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.4,6,6),new THREE.MeshBasicMaterial({color:0xa1e9ed}));lamp.position.set(-103,5,z);scene.add(lamp);}
 function applyAppearance(){for(const item of colored){if(!item.normal)item.normal=item.original.clone();if(planColor&&!item.tint){item.tint=item.original.clone();item.tint.color.setHex(item.color);item.tint.metalness=.1;item.tint.roughness=.65;item.tint.emissive.setHex(item.color);item.tint.emissiveIntensity=.12;}const m=planColor?item.tint:item.normal;m.wireframe=wire;m.transparent=wire;m.opacity=wire?.5:1;item.m.material=m;}}
 return {
  update(seconds){water.update(seconds);},
  landscape,
  setPlanColors(enabled){planColor=enabled;applyAppearance();},
  setWireframe(enabled){wire=enabled;applyAppearance();}
 };
}
