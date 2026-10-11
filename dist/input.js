const KEYS = { KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',KeyW:'jump',ArrowUp:'jump',KeyJ:'attack',KeyK:'dash',ShiftLeft:'dash',ShiftRight:'dash',KeyL:'skill',KeyE:'interact' };
export class Input {
  constructor(onCommand, isActive) {
    this.keyboard=new Set();this.pointers=new Map();this.pressed=new Set();this.attackTimer=0;this.onCommand=onCommand;this.isActive=isActive;
    window.addEventListener('keydown',event=>{
      if(event.code==='Escape'){event.preventDefault();if(!event.repeat)onCommand('escape');return;}
      if(['Digit1','Digit2','Digit3'].includes(event.code)&&!event.repeat)onCommand('choice',Number(event.code.at(-1))-1);
      if(event.code==='KeyR'&&!event.repeat)onCommand('retry');
      const action=KEYS[event.code];if(!action||!isActive())return;
      event.preventDefault();if(!this.keyboard.has(event.code))this.pressed.add(action);this.keyboard.add(event.code);
    });
    window.addEventListener('keyup',event=>{if(KEYS[event.code])this.keyboard.delete(event.code);});
    for(const button of document.querySelectorAll('[data-action]')){
      const end=event=>{this.pointers.delete(event.pointerId);button.classList.remove('active');};
      button.addEventListener('pointerdown',event=>{event.preventDefault();if(!isActive())return;button.setPointerCapture(event.pointerId);this.pointers.set(event.pointerId,button.dataset.action);this.pressed.add(button.dataset.action);button.classList.add('active');});
      button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
      button.addEventListener('contextmenu',e=>e.preventDefault());
    }
  }
  held(action) { return [...this.keyboard].some(key=>KEYS[key]===action)||[...this.pointers.values()].includes(action); }
  consume(dt) {
    const state={left:this.held('left'),right:this.held('right')};
    for(const action of ['jump','attack','dash','skill','interact'])state[action]=this.pressed.has(action);
    if(this.held('attack')) { this.attackTimer-=dt;if(this.attackTimer<=0){state.attack=true;this.attackTimer=.16;} }
    else this.attackTimer=0;
    this.pressed.clear();return state;
  }
  clear() { this.keyboard.clear();this.pointers.clear();this.pressed.clear();this.attackTimer=0;document.querySelectorAll('[data-action].active').forEach(b=>b.classList.remove('active')); }
}
