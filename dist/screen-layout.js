// Fit a fixed 16:9 design canvas without stretching or changing its internal layout.
const screen=document.querySelector('.app');
function fitScreen(){
 const scale=Math.min(window.innerWidth/1920,window.innerHeight/1080);
 screen.style.setProperty('--screen-scale',scale);
 screen.style.left=`${(window.innerWidth-1920*scale)/2}px`;
 screen.style.top=`${(window.innerHeight-1080*scale)/2}px`;
}
fitScreen();window.addEventListener('resize',fitScreen);
