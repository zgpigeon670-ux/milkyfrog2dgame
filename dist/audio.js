export class Audio {
  constructor() { this.enabled=true;this.ctx=null;this.nextNote=0;this.step=0; }
  unlock() {
    try { if(!this.ctx){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;this.ctx=new Ctx();this.master=this.ctx.createGain();this.master.gain.value=.12;this.master.connect(this.ctx.destination);}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{}); } catch { this.ctx=null; }
  }
  setEnabled(enabled) { this.enabled=enabled;if(this.master)this.master.gain.setTargetAtTime(enabled?.12:0,this.ctx.currentTime,.04); }
  tone(freq,duration=.15,type='sine',volume=.4,slide=0) {
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    const now=this.ctx.currentTime,o=this.ctx.createOscillator(),gain=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),now+duration);
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.009);gain.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(gain);gain.connect(this.master);o.start(now);o.stop(now+duration+.02);
  }
  event(type) {
    if(type==='swing')this.tone(270,.08,'triangle',.4,-170);
    if(type==='hit')this.tone(130,.07,'square',.17,-75);
    if(type==='hurt')this.tone(95,.22,'sawtooth',.17,-50);
    if(type==='jump')this.tone(280,.13,'sine',.4,140);
    if(type==='dash')this.tone(410,.14,'triangle',.3,-280);
    if(type==='skill'){this.tone(180,.45,'sine',.65,400);this.tone(370,.55,'triangle',.18,180);}
    if(type==='pearl')this.tone(720,.07,'sine',.1,160);
    if(type==='kill')this.tone(360,.18,'triangle',.2,180);
    if(type==='relic'){this.tone(392,.3,'sine',.3);setTimeout(()=>this.tone(587,.35,'sine',.25),100);}
    if(type==='slam')this.tone(70,.35,'triangle',.6,-35);
    if(type==='boss'||type==='enrage')this.tone(100,.5,'triangle',.4,-30);
  }
  update(dt,mode) {
    if(mode!=='playing'&&mode!=='title')return;
    this.nextNote-=dt;if(this.nextNote>0)return;this.nextNote=1.1;
    const melody=[392,0,329.63,293.66,0,261.63,293.66,0,329.63,0,440,392,0,329.63,293.66,0];
    const freq=melody[this.step++%melody.length];if(freq){this.tone(freq,.85,'sine',.16);this.tone(freq/2,1,'triangle',.05);}
  }
}
