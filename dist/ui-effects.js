// Decorative highlights only: keep interactive panels stationary for accurate clicks.
export function initUIEffects({onChange=()=>{}}={}){
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 let saved=null;try{saved=localStorage.getItem('yuecheng-ui-motion');}catch{}
 let manual=saved==='on'||saved==='off',enabled=manual?saved==='on':!preference.matches;
 const button=document.querySelector('#motionToggle');
 const apply=()=>{document.body.classList.toggle('motion-paused',!enabled);document.body.classList.toggle('motion-enabled',enabled);button.textContent=enabled?'◌ 动效开启':'◌ 静态模式';button.setAttribute('aria-pressed',String(enabled));onChange(enabled);};
 button.onclick=()=>{enabled=!enabled;manual=true;try{localStorage.setItem('yuecheng-ui-motion',enabled?'on':'off');}catch{}apply();};preference.addEventListener('change',e=>{if(!manual){enabled=!e.matches;apply();}});apply();
 let pending=0,last=null;
 document.querySelectorAll('.panel').forEach(panel=>{panel.addEventListener('pointermove',e=>{if(!enabled||e.pointerType==='touch')return;last={panel,x:e.clientX,y:e.clientY};if(pending)return;pending=requestAnimationFrame(()=>{pending=0;if(!last)return;const r=last.panel.getBoundingClientRect();last.panel.style.setProperty('--px',`${last.x-r.left}px`);last.panel.style.setProperty('--py',`${last.y-r.top}px`);});});panel.addEventListener('pointerleave',()=>{if(last?.panel===panel)last=null;panel.style.removeProperty('--px');panel.style.removeProperty('--py');});});
 document.querySelectorAll('.kpis>div').forEach(card=>{const sculpture=document.createElement('i');sculpture.className='kpi-sculpture';sculpture.setAttribute('aria-hidden','true');card.appendChild(sculpture);});
 return {get enabled(){return enabled;}};
}
