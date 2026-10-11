import { Game } from '../dist/engine.js';
import { FLOOR } from '../dist/data.js';

export function playthrough(seed) {
  const g=new Game();g.start(seed);let frames=0,hits=0,dodges=0,skills=0,rooms=0,dropDir=0;
  const priority=['vamp','reed','echo','tempo','foam','heart','shell','charge','tide','dash','thorn','refund'];
  for(;frames<60000&&!['won','dead'].includes(g.mode);frames++) {
    if(g.mode==='upgrade') {
      const order=g.player.hp<70?['heart','vamp','shell',...priority]:priority;
      g.chooseRelic([...g.choices].sort((a,b)=>order.indexOf(a)-order.indexOf(b))[0]);rooms++;continue;
    }
    const p=g.player,input={};
    if(g.room.rewardClaimed){input.right=p.x<g.room.exit-8;input.interact=true;}
    else {
      const living=g.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x));
      const e=living[0];
      if(e) {
        const dx=e.x-p.x,dist=Math.abs(dx);
        if(p.y>=FLOOR-1)dropDir=0;
        if(p.grounded&&p.y<FLOOR-2&&e.y>p.y+35&&!dropDir) { const ledge=g.room.platforms.find(pl=>p.x>=pl.x&&p.x<=pl.x+pl.w);dropDir=!ledge||p.x>ledge.x+ledge.w/2?1:-1; }
        if(dropDir) {input.right=dropDir===1;input.left=dropDir===-1;}
        else if(dist>31){input.right=dx>0;input.left=dx<0;}
        else { input.right=dx>0&&dist>12;input.left=dx<0&&dist>12; }
        input.attack=dist<72;
        if(e.y<p.y-50&&p.grounded&&!dropDir)input.jump=true;
        const threat=living.find(a=>a.state==='warn'&&a.timer<.23&&Math.abs(a.x-p.x)<(a.type==='boss'?200:85));
        const bullet=g.projectiles.find(b=>Math.hypot(b.x-p.x,b.y-p.y+20)<40);
        if((threat||bullet)&&p.dashCd===0&&!dropDir)input.dash=true;
        else if(threat&&p.grounded&&!dropDir)input.jump=true;
        if(e.type==='boss'&&e.state==='active'&&e.action===1&&e.timer<.35&&Math.abs(e.aimX-p.x)<150){input.right=p.x>e.aimX;input.left=!input.right;if(p.dashCd===0)input.dash=true;else if(p.grounded)input.jump=true;}
        if(p.energy>=100&&living.some(a=>Math.hypot(a.x-p.x,a.y-p.y)<g.stats.skillRadius-5))input.skill=true;
      }
    }
    g.tick(1/60,input);
    for(const ev of g.drainEvents()){if(ev.type==='hurt')hits++;if(ev.type==='dash')dodges++;if(ev.type==='skill')skills++;}
  }
  return {seed,mode:g.mode,room:g.roomIndex+1,time:Math.round(g.time),hp:Math.round(g.player.hp),kills:g.kills,score:g.score,hits,dodges,skills,rooms,relics:g.relics,frames};
}
if(process.argv[1]?.endsWith('playthrough.mjs'))for(const seed of [7,22,41,98,123])console.log(JSON.stringify(playthrough(seed)));
