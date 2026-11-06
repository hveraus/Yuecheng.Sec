import './app.js';

// Reuse the original dashboard actions after its model and handlers are ready.
function openLinkedScene(){
 const scene=location.hash.slice(1);
 if(['overview','video','patrol','fire'].includes(scene))document.querySelector(`[data-nav="${scene}"]`)?.click();
}
window.addEventListener('hashchange',openLinkedScene);
document.querySelectorAll('[data-nav]').forEach(button=>button.addEventListener('click',()=>{
 history.replaceState(null,'','#'+button.dataset.nav);
 document.querySelectorAll('[data-nav]').forEach(item=>{
  if(item===button)item.setAttribute('aria-current','page');
  else item.removeAttribute('aria-current');
 });
}));
openLinkedScene();
