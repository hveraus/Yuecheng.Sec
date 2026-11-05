// AI 指挥决策台的三维装配层：复用 dist/ 下的 campus-model / landscape / floor-browser / floor-interior /
// parking / transitions，不改动它们；这里只做场景装配、相机飞行、HTML 锚点投影、楼栋高亮、设备点位、
// 楼层浏览与地库浏览的接线。用 `npm run build:agent` 打成 dist/agent/campus3d.bundle.js（IIFE，全局 Campus3D）。
import * as THREE from 'three';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { buildCampus, campusBuildings, campusDevices, campusView } from '../../campus-model.js';
import { createFloorBrowser } from '../../floor-browser.js';
import { createParkingBrowser } from '../../parking.js';

export { campusBuildings, campusDevices, campusView };
export const deviceTypes = {
 camera: { name: '视频监控', symbol: '◉', color: 0x44e2ef },
 door: { name: '智能门禁', symbol: '▥', color: 0x6599ff },
 fire: { name: '消防感知', symbol: '♧', color: 0xffae5c },
 patrol: { name: '安保巡更', symbol: '⌖', color: 0x54dbaf },
};

export function mount(container, opts = {}) {
 const host = opts.host || container.parentElement;
 const { onBuilding = () => {}, onDevice = () => {}, onFloorDevice = () => {}, onMode = () => {}, onParkingStats = () => {} } = opts;
 const buildingMeshes = [], buildingGroups = [];
 const scene = new THREE.Scene();
 scene.background = new THREE.Color(0x0b1322);
 scene.fog = new THREE.FogExp2(0x0b1322, .00085);
 const camera = new THREE.PerspectiveCamera(40, 1, .1, 1500);
 camera.position.copy(campusView.overview.position);
 const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
 renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
 renderer.outputColorSpace = THREE.SRGBColorSpace;
 renderer.toneMapping = THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure = 1.15;
 renderer.shadowMap.enabled = true;
 renderer.shadowMap.type = THREE.PCFSoftShadowMap;
 renderer.domElement.style.width = '100%';
 renderer.domElement.style.height = '100%';
 renderer.domElement.style.display = 'block';
 container.appendChild(renderer.domElement);

 const controls = new OrbitControls(camera, renderer.domElement);
 controls.target.copy(campusView.overview.target);
 controls.enableDamping = true;
 controls.dampingFactor = .055;
 controls.minDistance = 60;
 controls.maxDistance = 900;
 controls.maxPolarAngle = Math.PI / 2.2;
 controls.enablePan = true;
 controls.autoRotateSpeed = .4;

 scene.add(new THREE.HemisphereLight(0xc4dceb, 0x283d33, 1.7));
 const sun = new THREE.DirectionalLight(0xffefda, 2.8);
 sun.position.set(-100, 180, 100);
 sun.castShadow = true;
 sun.shadow.mapSize.set(2048, 2048);
 Object.assign(sun.shadow.camera, { left: -210, right: 210, top: 210, bottom: -210, near: 1, far: 500 });
 sun.shadow.bias = -.0004;
 sun.shadow.normalBias = .35;
 scene.add(sun);
 const fill = new THREE.DirectionalLight(0x77b2d9, 1.1);
 fill.position.set(70, 40, -90);
 scene.add(fill);

 const model = buildCampus(scene, { buildingMeshes, buildingGroups });

 // ---- 设备点位的三维底座（圆柱 + 光环），同事版原样 ----
 for (const d of campusDevices) {
  const col = deviceTypes[d.type].color;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.65, .65, .8, 10), new THREE.MeshBasicMaterial({ color: col }));
  mesh.position.set(d.position.x, .6, d.position.z); scene.add(mesh);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 2, 28), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .35, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(d.position.x, .26, d.position.z); scene.add(ring);
 }

 // ---- HTML 标签层：楼栋编号标签 + 设备点位（内部锚点），页面的预警钉 / 保安点为外部锚点 ----
 const labels = document.createElement('div');
 labels.className = 'c3d-labels';
 host.appendChild(labels);
 const internal = [], devicePins = [];
 for (const b of campusBuildings) {
  const el = document.createElement('button');
  el.className = 'building-label';
  el.innerHTML = `<b>${b.number}</b><span>号楼</span>`;
  el.title = b.description + ' · 点击展开楼层';
  el.onclick = e => { e.stopPropagation(); enterBuilding(b); };
  labels.appendChild(el);
  internal.push({ el, x: b.id === 'b2' ? -7 : b.x, y: b.h + 6, z: b.id === 'b2' ? 2 : b.z, stack: true });
 }
 for (const d of campusDevices) {
  const el = document.createElement('button');
  el.className = `map-point ${d.type}`;
  el.textContent = deviceTypes[d.type].symbol;
  el.title = d.name;
  el.onclick = e => { e.stopPropagation(); selectDevice(d); };
  labels.appendChild(el);
  const a = { el, x: d.position.x, y: d.position.y, z: d.position.z, d, visible: true };
  devicePins.push(a); internal.push(a);
 }
 let external = [];
 function setAnchors(list) { external = list; }
 const tmp = new THREE.Vector3();
 function project() {
  const w = container.clientWidth, h = container.clientHeight;
  if (!w || !h) return;
  const placed = [];
  for (const a of [...internal, ...external]) {
   if (a.visible === false) { if (!a.el.hidden) a.el.hidden = true; continue; }
   if (a.tx != null) { a.x += (a.tx - a.x) * .06; a.y += (a.ty - a.y) * .06; a.z += (a.tz - a.z) * .06; }
   tmp.set(a.x, a.y, a.z).project(camera);
   const hidden = tmp.z > 1 || tmp.z < -1;
   if (a.el.hidden !== hidden) a.el.hidden = hidden;
   if (hidden) continue;
   let x = (tmp.x * .5 + .5) * w, y = (-tmp.y * .5 + .5) * h;
   if (a.stack) {
    // 标签在屏幕上重叠时先左右错开再向上，尽量贴着自己的楼栋
    const bw = a.el.offsetWidth || 90, bh = a.el.offsetHeight || 22, dy = bh + 8;
    const free = (px, py) => !placed.some(r => Math.abs(r.x - px) < (r.w + bw) / 2 + 6 && Math.abs(r.y - (py - bh / 2)) < (r.h + bh) / 2 + 4);
    const tries = [[0, 0], [bw * .6, 0], [-bw * .6, 0], [0, -dy], [bw * .6, -dy], [-bw * .6, -dy], [0, -2 * dy], [bw * .6, -2 * dy], [-bw * .6, -2 * dy], [0, -3 * dy]];
    for (const [ox, oy] of tries) { if (free(x + ox, y + oy)) { x += ox; y += oy; break; } }
    placed.push({ x, y: y - bh / 2, w: bw, h: bh });
   }
   a.el.style.left = x + 'px'; a.el.style.top = y + 'px';
  }
 }

 // ---- 感知图层开关 ----
 function setLayer(type, visible) { devicePins.filter(a => a.d.type === type).forEach(a => a.visible = visible); }
 function layerCounts() { const c = { camera: 0, door: 0, fire: 0, patrol: 0 }; campusDevices.forEach(d => c[d.type]++); return c; }

 // ---- 相机飞行 ----
 let flight = null, motion = true, mode = 'campus';
 function fly(to, target) { controls.autoRotate = false; flight = { from: camera.position.clone(), to, targetFrom: controls.target.clone(), target, start: performance.now() }; }
 function flyTo(pos, distance = 150) {
  exitModes();
  const target = new THREE.Vector3(pos.x, Math.max(pos.y * .3, 5), pos.z);
  fly(target.clone().add(new THREE.Vector3(-distance * .85, distance * .95, -distance * .95)), target);
 }
 function setView(name) { exitModes(); const v = campusView[name] || campusView.overview; fly(v.position.clone(), v.target.clone()); }

 // ---- 楼层浏览 / 地库浏览（同事版模块，host 为院区态势面板） ----
 const floorBrowser = createFloorBrowser({
  scene, camera, controls, meshes: buildingMeshes, host,
  onExit: () => reset(),
  onFocus: () => { flight = null; controls.autoRotate = false; },
  onDevice: (d, type) => onFloorDevice(d, type),
  motionEnabled: () => motion,
  onExpand: () => {},
 });
 const parkingBrowser = createParkingBrowser({
  scene, camera, controls, host,
  onFocus: () => { flight = null; controls.autoRotate = false; },
  onExit: () => reset(),
  onStats: s => onParkingStats(s),
  // 演示占用按决策台口径：普通区 482/500、机械下层 90/100、机械上层 20/100（电车超重不能上）
  occupancy: (s, i) => s.kind === 'standard' ? ((i * 73) % 500) < 482 : s.level === 0 ? ((s.group * 37) % 100) < 90 : ((s.group * 53) % 100) < 20,
 });
 function setMode(m, b) { if (mode !== m) { mode = m; onMode(m, b); } }
 function exitModes() { parkingBrowser.exit(); floorBrowser.exit(); host.classList.remove('floor-active', 'parking-active'); setMode('campus'); }
 let selectedDevice = null;
 function clearDevice() { selectedDevice = null; devicePins.forEach(a => a.el.classList.remove('selected')); }
 function enterBuilding(b) { parkingBrowser.exit(); clearDevice(); floorBrowser.enter(b); setMode('floor', b); onBuilding(b); }
 function enterParking() { floorBrowser.exit(); clearDevice(); parkingBrowser.enter(); setMode('parking'); }
 function reset() { exitModes(); clearDevice(); const v = campusView.overview; fly(v.position.clone(), v.target.clone()); }
 function selectDevice(d) { exitModes(); selectedDevice = d; devicePins.forEach(a => a.el.classList.toggle('selected', a.d === d)); const target = new THREE.Vector3(d.position.x, Math.max(d.position.y * .3, 5), d.position.z); fly(target.clone().add(new THREE.Vector3(-115 * .85, 115 * .95, -115 * .95)), target); onDevice(d); }
 window.addEventListener('keydown', e => { if (e.key === 'Escape' && (floorBrowser.active || parkingBrowser.active)) reset(); });

 // ---- 楼栋高亮：按 {b2:'#ff8293'} 给楼体加自发光 ----
 function highlight(map) {
  for (const m of buildingMeshes) {
   const id = m.userData.building.id, c = map[id];
   if (!m.userData.baseMat) m.userData.baseMat = m.material;
   if (c) {
    if (!m.userData.glow || m.userData.glowColor !== c) {
     const g = m.userData.baseMat.clone();
     g.emissive = new THREE.Color(c); g.emissiveIntensity = .38;
     m.userData.glow = g; m.userData.glowColor = c;
    }
    m.material = m.userData.glow;
   } else m.material = m.userData.baseMat;
  }
 }

 // ---- 摄像头模拟画面：从点位附近渲染一张截图（同事版 generatePreviews 的按需版） ----
 const previews = {};
 function preview(d) {
  if (previews[d.id]) return previews[d.id];
  const b = campusBuildings.find(b => b.id === d.building);
  const target = new THREE.Vector3(d.position.x, Math.min(d.position.y, b ? b.h : 10), d.position.z);
  const pos = target.clone().add(new THREE.Vector3(-55, 45, 60));
  const oldPos = camera.position.clone(), oldQ = camera.quaternion.clone(), oldAspect = camera.aspect, oldSize = new THREE.Vector2();
  renderer.getSize(oldSize);
  renderer.setSize(480, 270, false); camera.aspect = 480 / 270; camera.updateProjectionMatrix();
  camera.position.copy(pos); camera.lookAt(target); renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/jpeg', .85);
  camera.position.copy(oldPos); camera.quaternion.copy(oldQ); camera.aspect = oldAspect; camera.updateProjectionMatrix();
  renderer.setSize(oldSize.x, oldSize.y, false);
  previews[d.id] = url; return url;
 }

 // ---- 尺寸 ----
 let lastW = 0, lastH = 0;
 function resize() {
  const w = container.clientWidth, h = container.clientHeight;
  if (!w || !h || (w === lastW && h === lastH)) return;
  lastW = w; lastH = h; floorBrowser.finish?.();
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
 }
 new ResizeObserver(resize).observe(container);
 resize();

 // ---- 拾取：车位 → 楼层 → 楼栋 ----
 const ray = new THREE.Raycaster(); let down = null;
 renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
 renderer.domElement.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const r = container.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), camera);
  if (parkingBrowser.pick(ray)) return;
  if (floorBrowser.pick(ray)) return;
  const hit = ray.intersectObjects(buildingMeshes)[0];
  if (hit) enterBuilding(hit.object.userData.building);
 });
 controls.addEventListener('start', () => { flight = null; floorBrowser.finish(true); });

 // ---- 渲染循环 ----
 let running = true;
 function animate() {
  requestAnimationFrame(animate);
  if (!running || document.hidden || !container.clientWidth) return;
  if (flight) {
   const t = Math.min((performance.now() - flight.start) / 1000, 1), e = 1 - Math.pow(1 - t, 3);
   camera.position.lerpVectors(flight.from, flight.to, e);
   controls.target.lerpVectors(flight.targetFrom, flight.target, e);
   if (t === 1) flight = null;
  }
  controls.update();
  floorBrowser.update(); parkingBrowser.update();
  model.update(motion ? performance.now() / 1000 : 0);
  renderer.render(scene, camera);
  if (!floorBrowser.active && !parkingBrowser.active) project();
 }
 animate();

 return {
  THREE, scene, camera, controls, buildings: campusBuildings, devices: campusDevices, deviceTypes,
  setAnchors, flyTo, setView, highlight, resize, preview,
  enterBuilding, enterParking, reset, selectDevice, setLayer, layerCounts,
  get mode() { return mode; },
  get parkingSlots() { return parkingBrowser.slots; },
  setAutoRotate(v) { controls.autoRotate = v; },
  setMotion(v) { motion = v; },
  pause() { running = false; }, resume() { running = true; resize(); },
  planColors(v) { model.setPlanColors(v); }, wireframe(v) { model.setWireframe(v); },
  zoom(f) { flight = null; camera.position.sub(controls.target).multiplyScalar(f).add(controls.target); },
 };
}
