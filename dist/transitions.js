export const easeInOut=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const phase=(t,start,end)=>easeInOut((t-start)/(end-start));
export function createTransition({duration,onUpdate,onComplete=()=>{},start=performance.now()}){
 let active=true;
 return {get active(){return active;},step(now){if(!active)return;const t=duration<=0?1:Math.max(0,Math.min(1,(now-start)/duration));onUpdate(t);if(t===1){active=false;onComplete();}},finish(){if(!active)return;onUpdate(1);active=false;onComplete();},cancel(){active=false;}};
}
