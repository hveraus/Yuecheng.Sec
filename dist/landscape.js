import * as THREE from 'three';

export function containsPoint(shape,x,z){const p=shape.getPoints(48);let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a.y>-z)!==(b.y>-z)&&x<(b.x-a.x)*(-z-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function createFlowingWater(shapes){
 const group=new THREE.Group();group.name='动态景观水系';
 const material=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`varying vec3 world;void main(){world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,fragmentShader:`
 uniform float time;varying vec3 world;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){
 vec2 p=world.xz;float t=time*.65;
 float swell=sin(p.x*.16+p.y*.11-t)*.5+sin(p.y*.27-p.x*.08-t*.7)*.3;
 float eddy=noise(p*.3+vec2(-t*.2,t*.12));float ripples=sin(p.y*2.8+p.x*.5-t*3.+eddy*9.+swell*2.);
 float streams=pow(max(0.,sin(p.y*.85+p.x*.19-t*1.5+swell+eddy*5.)),12.);
 vec3 deep=vec3(.007,.08,.12),shallow=vec3(.025,.24,.29);
 vec3 color=mix(deep,shallow,.48+swell*.24);
 vec3 n=normalize(vec3(swell*.12,1.,ripples*.18));
 vec3 eye=normalize(cameraPosition-world);float fresnel=pow(1.-max(dot(n,eye),0.),3.);
 float glint=pow(max(dot(reflect(-normalize(vec3(-.4,1.,.5)),n),eye),0.),55.);
 color+=vec3(.11,.30,.31)*streams*.4+vec3(.3,.54,.65)*fresnel+vec3(.7,.84,.84)*glint*.25;
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 for(const shape of shapes){const geometry=new THREE.ShapeGeometry(shape,48);geometry.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geometry,material);mesh.position.y=.36;group.add(mesh);
 const vertices=shape.getPoints(100).map(p=>new THREE.Vector3(p.x,.38,-p.y));const edge=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(vertices),new THREE.LineBasicMaterial({color:0x67a9a0,transparent:true,opacity:.38}));group.add(edge);}
 return {group,update(seconds){material.uniforms.time.value=seconds;}};
}
export function addLandscape(scene,buildingMeshes,waterShapes){
 let seed=27183;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(),positions=[];
 const blocked=(x,z)=>{
  if(waterShapes.some(s=>containsPoint(s,x,z)))return true;
  if((Math.abs(x+114)<11&&z>-164&&z<112)||(Math.abs(x-119)<10&&z>-147&&z<108)||(Math.abs(z-100)<9&&x>-112&&x<122)||(Math.abs(z+161)<8&&x>-120&&x<121))return true;
  if((x>94&&x<110&&z>-46&&z<60)||(x>-104&&x<-77&&z>-36&&z<6)||(x>3&&x<85&&z>-153&&z<-140))return true;
  if(Math.abs(x+7)<8&&z>-112&&z<-58)return true;
  ray.set(new THREE.Vector3(x,80,z),new THREE.Vector3(0,-1,0));return ray.intersectObjects(buildingMeshes,false).length>0;
 };
 function tree(x,z,scale=1,y=0){if(!blocked(x,z)&&!positions.some(p=>Math.hypot(p.x-x,p.z-z)<3.7)){positions.push({x,z,y,scale});}}
 // Reference-inspired woodland edges, clustered riverbank planting and avenue rows.
 for(let i=0;i<340;i++){const side=i%3;const x=side===0?-158+random()*28:side===1?133+random()*25:-151+random()*303;const z=side===2?116+random()*38:-169+random()*278;tree(x,z,.85+random()*.6);}
 for(let x=-98;x<100;x+=6){tree(x,-67+Math.sin(x*.05)*3,.75+random()*.3);tree(x,-105+Math.sin(x*.04)*4,.7+random()*.3);tree(x,87,.8);}
 for(let z=-148;z<85;z+=8){tree(-127,z,.9);tree(131,z,.95);}
 for(let i=0;i<95;i++)tree(-100+random()*200,-145+random()*230,.65+random()*.5);
 // Courtyard trees sit below the podium, within its existing open gardens.
 for(const z of [-37,2,41])for(const dx of [-10,10])for(const dz of [-8,8])tree(-7+dx,z+dz,.65,1);
 const group=new THREE.Group();group.name='河岸林带与庭院绿化';scene.add(group);
 const bark=new THREE.MeshStandardMaterial({color:0x655447,roughness:1});
 const foliage=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92});
 const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.35,2),foliage,positions.length*3);
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.42,3.4,6),bark,positions.length);
 const shade=new THREE.InstancedMesh(new THREE.CircleGeometry(3.3,16),new THREE.MeshBasicMaterial({color:0x091d17,transparent:true,opacity:.2,depthWrite:false}),positions.length);
 const dummy=new THREE.Object3D(),color=new THREE.Color();
 positions.forEach((p,i)=>{const s=p.scale;dummy.position.set(p.x,p.y+1.7*s,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(s,s,s);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
  for(let k=0;k<3;k++){const a=k*Math.PI*2/3;dummy.position.set(p.x+Math.cos(a)*s,p.y+(4+k*.55)*s,p.z+Math.sin(a)*s);dummy.scale.set(s*(.9+random()*.3),s*(1+random()*.4),s);dummy.rotation.y=random()*6.28;dummy.updateMatrix();crowns.setMatrixAt(i*3+k,dummy.matrix);color.setHSL(.28+random()*.1,.25+random()*.18,.15+random()*.11);crowns.setColorAt(i*3+k,color);}
  dummy.position.set(p.x,p.y+.04,p.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(s,s,s);dummy.updateMatrix();shade.setMatrixAt(i,dummy.matrix);
 });crowns.castShadow=true;trunks.castShadow=true;crowns.receiveShadow=true;group.add(shade,trunks,crowns);
 return {group,positions};
}
