import { W, H, FLOOR, BIOMES, clamp } from './data.js';

const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function poly(c, points, color) { c.fillStyle = color; c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(Math.round(x),Math.round(y)) : c.moveTo(Math.round(x),Math.round(y))); c.closePath(); c.fill(); }
function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  for (let dy = -Math.ceil(ry); dy <= ry; dy++) { const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry)))); c.fillRect(Math.round(x - dx),Math.round(y + dy),dx * 2 + 1,1); }
}
function pixelLine(c,x1,y1,x2,y2,color,width=1) { c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x1)+.5,Math.round(y1)+.5);c.lineTo(Math.round(x2)+.5,Math.round(y2)+.5);c.stroke(); }

export function makeFrog(frame = 0, pose = 'idle') {
  const canvas = document.createElement('canvas'); canvas.width = 40; canvas.height = 44; const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
  const step = pose === 'run' ? Math.sin(frame / 6 * Math.PI * 2) * 3 : 0;
  const bob = pose === 'run' ? Math.abs(step) * .35 : frame % 4 === 1 ? 1 : 0;
  c.translate(0,-Math.round(bob));
  const dark='#70543a', shade='#c99b4b', yellow='#eac45f', light='#f7d977', belly='#f5e5b7';
  ellipse(c,15+step,40,5,2,dark); ellipse(c,26-step,40,5,2,dark);
  rect(c,12+step,36,7,4,shade);rect(c,24-step,36,7,4,shade);
  ellipse(c,21,27,14,13,dark);ellipse(c,21,25,13,13,shade);ellipse(c,20,24,12,13,yellow);
  ellipse(c,20,15,10,13,dark);ellipse(c,20,14,9,12,yellow);
  ellipse(c,14,9,5,5,dark);ellipse(c,25,9,5,5,dark);ellipse(c,14,8,4,4,light);ellipse(c,25,8,4,4,light);
  ellipse(c,18,17,8,9,yellow);ellipse(c,22,28,9,10,belly);ellipse(c,21,26,8,8,'#fff0cc');
  rect(c,10,18,3,11,light);rect(c,10,16,2,3,light);rect(c,28,21,3,10,shade);
  const blink = pose === 'hurt' || (pose === 'idle' && frame === 3);
  if(blink){rect(c,12,9,5,1,dark);rect(c,23,9,5,1,dark);}
  else {
    ellipse(c,15,8,3,3,'#eee8b2');ellipse(c,26,8,3,3,'#eee8b2');
    ellipse(c,16,8,2,2,'#5d9160');ellipse(c,27,8,2,2,'#5d9160');
    rect(c,16,7,2,3,'#183c36');rect(c,27,7,2,3,'#183c36');rect(c,16,7,1,1,'#f9f6dc');rect(c,27,7,1,1,'#f9f6dc');
  }
  rect(c,20,14,6,1,dark);rect(c,26,13,1,1,dark);rect(c,15,13,2,1,'#d6a456');
  if (pose==='attack') {
    rect(c,29,22,5,5,dark);rect(c,29,21,4,4,yellow);rect(c,34,12,2,19,'#6c7846');rect(c,33,10,4,11,'#d9e7ab');rect(c,34,8,2,12,'#f6efcb');rect(c,31,28,8,2,'#ad9854');
  } else {
    ellipse(c,12,28,4,4,dark);ellipse(c,11,27,3,3,yellow);rect(c,9,28,4,2,dark);
    ellipse(c,30,28,4,4,dark);ellipse(c,29,27,3,3,yellow);rect(c,29,28,4,2,dark);
    rect(c,32,23,2,15,'#5c7250');rect(c,31,15,3,9,'#abc997');rect(c,32,13,2,8,'#e1e8b8');
  }
  if(pose==='jump'){rect(c,11,38,7,2,dark);rect(c,27,35,5,3,dark);}
  return canvas;
}

export class Renderer {
  constructor(canvas) {
    this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.c.imageSmoothingEnabled=false;
    this.camera=0;this.shake=0;this.shakeEnabled=true;this.flash=0;this.particles=[];this.trails=[];this.hitstop=0;this.realTime=0;
    this.sprites={};for(const pose of ['idle','run','jump','attack','hurt']) this.sprites[pose]=Array.from({length:6},(_,i)=>makeFrog(i,pose));
  }
  event(event) {
    const {type,x,y}=event;
    if(type==='hit'){this.shake=Math.max(this.shake,event.source==='skill'?3:1.3);this.hitstop=.032;this.sparks(x,y,'#ebdfad',8);}
    if(type==='kill'){this.sparks(x,y,'#8dd3ac',22);this.sparks(x,y,'#e9deb0',8);}
    if(type==='hurt'){this.shake=4;this.flash=.13;this.sparks(this.lastPlayerX,this.lastPlayerY-20,'#dd9688',13);}
    if(type==='dash')this.sparks(this.lastPlayerX,this.lastPlayerY-10,'#c5e2c5',10);
    if(type==='jump')this.sparks(this.lastPlayerX,this.lastPlayerY,'#aecfb0',event.second?10:5);
    if(type==='skill'){this.shake=5;this.sparks(this.lastPlayerX,this.lastPlayerY-20,'#fff2d0',36);}
    if(type==='slam'){this.shake=5;this.sparks(x,FLOOR,'#d5d2ab',30);}
    if(type==='room'){this.camera=0;this.particles=[];this.trails=[];}
  }
  sparks(x=0,y=0,color,count) { for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,v=30+Math.random()*90;this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,t:.3+Math.random()*.5,color,size:Math.random()>.7?2:1});} }
  render(g,dt,time) {
    this.realTime=time;this.shake=Math.max(0,this.shake-dt*14);this.flash=Math.max(0,this.flash-dt);this.hitstop=Math.max(0,this.hitstop-dt);
    const title=g.mode==='title',p=g.player,c=this.c,biome=title?0:g.room.biome;
    const target=title?0:clamp(p.x-W*.38,0,g.room.width-W);this.camera+=(target-this.camera)*Math.min(1,dt*7);
    if(Math.abs(target-this.camera)<.2)this.camera=target;
    c.save();c.clearRect(0,0,W,H);
    if(this.shakeEnabled && this.shake>0 && !title)c.translate(Math.round((Math.random()-.5)*this.shake),Math.round((Math.random()-.5)*this.shake));
    this.background(biome,this.camera,time);
    this.terrain(biome,this.camera,title?2180:g.room.width);
    if(title) {
      this.platform({x:375,y:286,w:169,h:14},biome,0,time);
      this.portal(566,FLOOR,biome,true,time,.65);
      ellipse(c,468,287,21,3,'#113d3e80');
      this.frog({x:466,y:286,face:1,walk:time*1.5,grounded:true,vx:0,invuln:0},'idle',1.8,time);
      this.drawMushroom(604,FLOOR,1,0,time,'idle');
      this.flora(0,biome,time,true);
    } else {
      for(const plat of g.room.platforms)this.platform(plat,biome,this.camera,time);
      this.portal(g.room.exit-this.camera,FLOOR,biome,g.room.rewardClaimed,time);
      for(const e of g.enemies) if(e.hp>0 && Math.abs(e.x-this.camera-W/2)<W/2+150)this.enemy(e,this.camera,time);
      for(const item of g.pickups){const x=item.x-this.camera,y=item.y;ellipse(c,x,y,3,3,'#d7deac');rect(c,x-1,y-2,2,1,'#fff5cc');}
      for(const b of g.projectiles){const x=b.x-this.camera;ellipse(c,x,b.y,b.r+2,b.r+2,'#91c5bd40');ellipse(c,x,b.y,b.r,b.r,b.kind==='milk'?'#f0dcb4':'#9dccba');rect(c,x-b.r/2,b.y-b.r/2,2,2,'#eef5d2');}
      for(const t of this.trails){t.t-=dt;c.globalAlpha=Math.max(0,t.t/.24)*.32;this.frog(t,'run',1,time);c.globalAlpha=1;}
      this.trails=this.trails.filter(t=>t.t>0);
      if(p.dash>0)this.trails.push({x:p.x-this.camera,y:p.y,face:p.face,walk:p.walk,grounded:p.grounded,vx:p.vx,invuln:0,t:.24});
      const pose=g.mode==='dead'?'dead':p.hurt>.08?'hurt':p.attack?'attack':!p.grounded?'jump':Math.abs(p.vx)>20?'run':'idle';
      this.frog({...p,x:p.x-this.camera},pose,1,time);
      if(p.attack)this.slash(p,this.camera);
      for(const f of g.effects)this.effect(f,this.camera);
      this.flora(this.camera,biome,time);
    }
    for(const q of this.particles){if(g.mode==='playing'||title){q.t-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=110*dt;}c.globalAlpha=clamp(q.t*2,0,1);rect(c,q.x-this.camera,q.y,q.size,q.size,q.color);}
    c.globalAlpha=1;this.particles=this.particles.filter(q=>q.t>0);
    if(this.flash>0){c.fillStyle=`rgba(223,139,119,${this.flash*.45})`;c.fillRect(0,0,W,H);}
    c.restore();this.lastPlayerX=title?466:p.x;this.lastPlayerY=title?286:p.y;
  }
  background(index,cam,t) {
    const c=this.c,b=BIOMES[index],grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,b.sky[0]);grad.addColorStop(.75,b.sky[1]);grad.addColorStop(1,b.ground);c.fillStyle=grad;c.fillRect(0,0,W,H);
    for(let i=0;i<90;i++){const x=(hash(i+20)*920-cam*.07)%W,y=hash(i+400)*200;const alpha=.18+Math.sin(t*.3+i)*.1;c.globalAlpha=alpha;rect(c,(x+W)%W,y,i%11?1:2,1,'#c8ded0');}c.globalAlpha=1;
    const mx=514-cam*.025,my=76;
    for(let r=65;r>28;r-=8){c.globalAlpha=.018;ellipse(c,mx,my,r,r,'#d6e1be');}c.globalAlpha=1;
    ellipse(c,mx,my,27,27,index===2?'#e3dac0':'#c4d4b1');ellipse(c,mx-5,my-4,22,23,index===2?'#eadfc3':'#d4dfbf');
    for(let i=0;i<13;i++){const a=hash(i+21)*6.28,r=hash(i+42)*20;ellipse(c,mx+Math.cos(a)*r,my+Math.sin(a)*r,2+hash(i)*3,1+hash(i+20)*3,index===2?'#cfc9af':'#b7cbae');}
    c.globalAlpha=.17;for(let i=0;i<6;i++){const x=(i*141-cam*.1+W*4)%(W+160)-80;rect(c,x,100+i%3*25,93,2,'#b4cfba');rect(c,x+20,103+i%3*25,130,2,'#b4cfba');}c.globalAlpha=1;
    const far=index===0?'#254b50':index===1?'#294658':'#414c61';
    for(let i=-1;i<8;i++){const x=i*133-cam*.12%133;poly(c,[[x,260],[x,211],[x+20,211],[x+20,182],[x+33,182],[x+33,153],[x+56,153],[x+56,190],[x+78,190],[x+78,216],[x+100,216],[x+100,260]],far);}
    if(index>0)for(let i=-1;i<8;i++){const x=i*154-cam*.2%154;this.ruin(x,263,65,94,index,false);}
    for(let i=-1;i<7;i++){const x=i*174-cam*.22%174;this.tree(x+45,277,160+hash(i+10)*75,.58,index,i+5);}
    c.globalAlpha=.16;rect(c,0,254,W,14,b.mist);rect(c,0,280,W,18,b.mist);c.globalAlpha=1;
    const water=index===0?'#42736b':index===1?'#426f7b':'#667080';rect(c,0,286,W,24,water);
    for(let i=0;i<80;i++){const x=(hash(i+300)*W+Math.sin(t*.25+i)*3-cam*.3%W+W)%W,y=288+hash(i+900)*23;c.globalAlpha=.08+hash(i+8)*.2;rect(c,x,y,3+hash(i+16)*25,1,'#c5d8c3');}c.globalAlpha=1;
    for(let i=-1;i<6;i++){const x=i*233-cam*.5%233;if(index===0)this.tree(x+48,298,240+hash(i+30)*48,.8,index,i+18);else this.ruin(x+55,300,78,104+hash(i+2)*70,index,true);}
    for(let i=-1;i<9;i++){const x=i*101-cam*.68%101;this.bush(x,303,35+hash(i+20)*27,index,'back');}
    for(let i=0;i<22;i++){const x=((hash(i+50)*W-cam*.42+Math.sin(t*.5+i)*11)%W+W)%W,y=130+hash(i+200)*156+Math.sin(t+i)*5;const glow=.2+Math.max(0,Math.sin(t*1.1+i))*.7;c.globalAlpha=glow*.12;ellipse(c,x,y,7,7,b.accent);c.globalAlpha=glow;rect(c,x,y,1,2,b.accent);}c.globalAlpha=1;
  }
  tree(x,bottom,height,scale,index,seed) {
    const c=this.c;const dark=index===0?'#143f42':index===1?'#233f4c':'#354551',leaf=index===0?'#2c5f56':index===1?'#345b62':'#4c5d62';
    const width=19*scale,top=bottom-height;
    poly(c,[[x-width,bottom],[x-width+3,top+55],[x-width-8,top+26],[x,top],[x+width-3,top+35],[x+width,top+95],[x+width+8,bottom]],dark);
    poly(c,[[x,bottom],[x+3,top+25],[x+8,top+50],[x+10,bottom]],leaf);
    pixelLine(c,x,top+90,x-49*scale,top+54,dark,9*scale);pixelLine(c,x+3,top+105,x+63*scale,top+63,dark,8*scale);
    for(let i=0;i<10;i++){const cx=x+(hash(seed*10+i)-.5)*160*scale,cy=top+15+hash(seed*20+i)*70*scale;const rx=(29+hash(i+seed)*27)*scale,ry=(14+hash(i+20)*15)*scale;
      ellipse(c,cx,cy,rx,ry,dark);ellipse(c,cx-2,cy-4,rx-3,ry-3,leaf);
      for(let k=0;k<7;k++)rect(c,cx-rx+hash(i*9+k)*rx*2,cy-ry+hash(k+5)*ry,4*scale,2*scale,index===0?'#376e5a':index===1?'#47756e':'#657267');
      if(i%3===0){rect(c,cx+rx*.2,cy+ry,2,12+hash(i)*12,leaf);rect(c,cx+rx*.2+4,cy+ry-2,1,20,leaf);}
    }
    for(let i=0;i<6;i++)rect(c,x-width+hash(i+seed)*width*2,bottom-hash(i+52)*height*.7,2,7,dark);
  }
  ruin(x,y,w,h,index,front) {
    const c=this.c,col=front?(index===2?'#596568':'#45676b'):(index===2?'#454f61':'#304e5e'),shade=front?'#2c4b52':'#263e50';
    rect(c,x,y-h,w*.24,h,col);rect(c,x+w*.76,y-h,w*.24,h,col);rect(c,x-4,y-h,w+8,12,col);
    rect(c,x+4,y-h+12,4,h-12,shade);rect(c,x+w*.8,y-h+12,4,h-12,shade);rect(c,x+5,y-9,w*.17,9,shade);
    for(let i=0;i<h/18;i++){rect(c,x,y-i*18,w*.24,1,shade);rect(c,x+w*.76,y-i*18,w*.24,1,shade);}
    poly(c,[[x-4,y-h],[x+3,y-h-7],[x+w*.45,y-h-7],[x+w*.5,y-h-12],[x+w*.7,y-h-12],[x+w*.7,y-h],[x+w+4,y-h]],col);
    if(front){rect(c,x+2,y-h-3,w*.3,3,'#83a28a');for(let i=0;i<8;i++){const px=x+hash(i+x)*w;rect(c,px,y-h+7,2,8+hash(i+3)*17,'#557e68');}rect(c,x+w*.79,y-h*.6,w*.12,2,'#76958b');}
  }
  terrain(index,cam,width) {
    const c=this.c,b=BIOMES[index];rect(c,0,FLOOR,W,H-FLOOR,b.ground);rect(c,0,FLOOR,W,3,b.grass);rect(c,0,FLOOR+3,W,4,index===0?'#42694f':'#536a68');rect(c,0,FLOOR+7,W,2,'#152f35');
    for(let i=Math.floor(cam/16)-1;i<(cam+W)/16+1;i++){const x=i*16-cam;
      rect(c,x+1,FLOOR+10,14,14,i%3===0?'#304f45':index===0?'#2b4740':index===1?'#344f59':'#424f58');
      rect(c,x+1,FLOOR+27,14,13,hash(i+8)>.5?'#284139':'#263d3d');
      for(let j=0;j<3;j++)rect(c,x+hash(i*5+j)*13,FLOOR+13+hash(i+j+4)*24,2,1,'#64816844');
      if(i%4===0){rect(c,x+3,FLOOR+18,4,2,'#627963');rect(c,x+4,FLOOR+17,3,1,'#79936d');}
    }
    for(let i=Math.floor(cam/7)-1;i<(cam+W)/7+1;i++){const x=i*7-cam;rect(c,x,FLOOR-2-hash(i)*3,1,5,hash(i+1)>.5?b.grass:'#426953');if(i%3===0)rect(c,x+2,FLOOR-1,2,2,'#b1c991');}
    const gradient=c.createLinearGradient(0,FLOOR+12,0,H);gradient.addColorStop(0,'#081f2700');gradient.addColorStop(1,'#061d2780');c.fillStyle=gradient;c.fillRect(0,FLOOR+10,W,50);
  }
  platform(p,index,cam,t) {
    const c=this.c,x=p.x-cam,y=p.y,b=BIOMES[index];if(x>W+10||x+p.w<-10)return;
    rect(c,x,y,p.w,3,b.grass);rect(c,x,y+3,p.w,p.h,'#355751');rect(c,x+2,y+7,p.w-4,2,'#284742');rect(c,x+5,y+p.h,p.w-10,3,'#152f37');
    for(let i=0;i<p.w/17;i++){rect(c,x+i*17,y+4,1,8,'#173c3e');rect(c,x+i*17+4,y+4,9,1,'#759284');}
    for(let i=0;i<p.w/22;i++){const px=x+i*22+hash(i+p.x)*10;rect(c,px,y+p.h,2,5+hash(i+6)*14,'#5a8665');rect(c,px+3,y+p.h,1,6+hash(i+9)*11,'#416d59');rect(c,px+5,y-2,1,3,b.grass);}
  }
  bush(x,y,size,index,layer) {
    const c=this.c,color=index===0?'#386c58':index===1?'#42736e':'#62746e',shade=index===0?'#2b594b':index===1?'#345961':'#4f6269';
    ellipse(c,x,y-7,size,12,shade);ellipse(c,x-8,y-15,size*.6,14,color);ellipse(c,x+13,y-10,size*.6,11,color);
    for(let i=0;i<8;i++){const px=x+(hash(i+x)-.5)*size*1.8,py=y-hash(i+12)*23;rect(c,px,py,4,2,index===0?'#5a8b62':index===1?'#698f82':'#8e9a82');}
  }
  flora(cam,index,t,title=false) {
    const c=this.c,b=BIOMES[index];
    for(let i=Math.floor(cam/64)-1;i<(cam+W)/64+1;i++){
      const x=i*64-cam+hash(i+8)*20;
      if(i%3===0){this.fern(x,FLOOR+1,18+hash(i+4)*9,b.grass);}
      if(i%4===1){const y=FLOOR;rect(c,x,y-12,2,12,'#689883');ellipse(c,x+1,y-13,7,4,index===2?'#ad9398':'#69bbaa');rect(c,x-4,y-14,2,1,'#d3e6bd');rect(c,x+3,y-12,2,1,'#b9dac1');}
      if(i%3===2)for(let k=0;k<4;k++){const px=x+k*4;pixelLine(c,px,FLOOR,px+Math.sin(t*.6+i)*2,FLOOR-13-hash(i+k)*11,'#648c70');rect(c,px,FLOOR-16-hash(i+k)*11,2,4,'#b4c889');}
      if(i%7===0){ellipse(c,x,FLOOR-3,10,4,'#486759');rect(c,x-5,FLOOR-6,8,2,'#7a8e74');}
    }
  }
  fern(x,y,h,color) {
    const c=this.c;pixelLine(c,x,y,x,y-h,color);
    for(let k=0;k<5;k++){const yy=y-4-k*3,len=8-k;pixelLine(c,x,yy,x-len,yy-3,color,2);pixelLine(c,x,yy,x+len,yy-4,color,2);rect(c,x-len,yy-4,3,2,color);}
  }
  portal(x,y,index,open,t,opacity=1) {
    const c=this.c;if(x<-80||x>W+80)return;c.save();c.globalAlpha=opacity;
    const glow=open?'#cce6af':'#618685';
    for(let i=4;i>0;i--){c.globalAlpha=opacity*.035;ellipse(c,x,y-41,24+i*9,37+i*8,glow);}c.globalAlpha=opacity;
    rect(c,x-25,y-62,11,62,'#385d5b');rect(c,x+14,y-62,11,62,'#385d5b');rect(c,x-20,y-71,40,12,'#4e7370');rect(c,x-13,y-77,26,9,'#5a7b70');
    rect(c,x-22,y-60,3,60,'#759284');rect(c,x+14,y-60,3,60,'#759284');rect(c,x-17,y-70,34,2,'#88a18a');
    for(let i=0;i<5;i++){rect(c,x-25,y-i*12,11,1,'#244d4c');rect(c,x+14,y-i*12,11,1,'#244d4c');}
    const gradient=c.createLinearGradient(0,y-65,0,y);gradient.addColorStop(0,open?'#c4dfa577':'#3c68604d');gradient.addColorStop(1,open?'#68978177':'#163e424d');c.fillStyle=gradient;c.fillRect(x-14,y-59,28,59);
    if(open){c.globalAlpha=.3;for(let i=0;i<9;i++){const yy=y-(t*18+i*8)%60;rect(c,x-10+hash(i)*20,yy,1,3,'#f0e7ae');}c.globalAlpha=opacity;ellipse(c,x,y-48,7,7,'#e8e7ba');ellipse(c,x+3,y-50,6,6,'#719883');}
    this.fern(x-28,y,17,'#799a73');this.fern(x+29,y,13,'#6c8e74');rect(c,x-30,y,60,4,'#6e8e76');c.restore();
  }
  frog(p,pose,scale,t) {
    const c=this.c;const frame=pose==='run'?Math.floor(p.walk)%6:Math.floor(t*2)%6;const sprite=this.sprites[pose==='dead'?'hurt':pose]?.[frame]||this.sprites.idle[frame];
    c.save();c.translate(Math.round(p.x),Math.round(p.y));
    if(pose==='dead'){c.translate(0,-6);c.rotate(p.face*1.45);c.globalAlpha=.85;}
    if(p.invuln>0&&pose!=='dead'&&Math.floor(t*14)%2===0)c.globalAlpha=.55;
    ellipse(c,0,0,13*scale,2*scale,'#0b2b3280');c.scale(p.face*scale,scale);
    if(p.dash>0){c.scale(1.1,.85);c.translate(0,4);}
    c.drawImage(sprite,-20,-41);
    if(pose==='hurt'){c.globalCompositeOperation='source-atop';c.globalAlpha=.1;c.fillStyle='#faf0dc';c.fillRect(-18,-42,36,42);}
    c.restore();
  }
  slash(p,cam) {
    const c=this.c,a=p.attack,progress=clamp(a.t/.22,0,1);if(a.t>.23)return;
    c.save();c.translate(Math.round(p.x-cam),Math.round(p.y-22));c.scale(a.direction,1);
    c.globalAlpha=Math.sin(progress*Math.PI)*.8;c.strokeStyle=a.n===2?'#e9e4a5':'#d2e7b4';c.lineWidth=a.n===2?6:4;
    c.beginPath();c.arc(8,0,a.n===2?44:35,-1.25+progress*.7,1.15+progress*.7);c.stroke();
    c.globalAlpha*=.6;c.lineWidth=1;c.strokeStyle='#fff3cf';c.beginPath();c.arc(8,0,a.n===2?48:39,-1.1+progress*.7,1+progress*.7);c.stroke();c.restore();
  }
  enemy(e,cam,t) {
    const c=this.c,x=e.x-cam,y=e.y,warn=e.state==='warn',active=e.state==='active';c.save();
    if(e.hurt>0)c.globalAlpha=.55+Math.sin(t*90)*.2;
    ellipse(c,x,FLOOR,e.w*.45,3,'#0d2c3580');
    if(warn){c.globalAlpha=.3+Math.sin(t*20)*.15;ellipse(c,x,y-e.h/2,e.w*.8,e.h*.75,'#f3bba1');c.globalAlpha=1;}
    if(e.type==='slime') {
      const bounce=Math.sin(t*5+e.id)*1.5;ellipse(c,x,y-11-bounce,16,12,'#235d54');ellipse(c,x,y-13-bounce,14,11,warn?'#d1bc89':'#81bca0');ellipse(c,x-4,y-18-bounce,6,3,'#bad4ad');rect(c,x-7+e.face*2,y-13-bounce,3,4,'#23443c');rect(c,x+5+e.face*2,y-13-bounce,3,4,'#23443c');rect(c,x-2,y-8-bounce,5,1,'#486f50');
    } else if(e.type==='bat') {
      const flap=Math.sin(t*18+e.id)*5;ellipse(c,x,y-10,7,10,'#a8bc82');ellipse(c,x,y-10,6,8,warn?'#efc78a':'#a7d8b2');
      poly(c,[[x-4,y-14],[x-15,y-19-flap],[x-19,y-11-flap],[x-9,y-7]],'#c4e0c2');poly(c,[[x+4,y-14],[x+15,y-19-flap],[x+19,y-11-flap],[x+9,y-7]],'#9cbcb0');rect(c,x-3,y-16,2,3,'#244d41');rect(c,x+2,y-16,2,3,'#244d41');rect(c,x-1,y-5,3,3,'#e9e3aa');
    } else if(e.type==='mushroom') this.drawMushroom(x,y,e.face,warn,t,e.state);
    else if(e.type==='beetle') {
      for(let k=0;k<3;k++){const xx=x-12+k*12;pixelLine(c,xx,y-5,xx-4+Math.sin(t*8+k)*2,y,'#9cac8d',2);}
      ellipse(c,x,y-13,20,12,'#233f42');ellipse(c,x-2,y-15,16,11,warn?'#bfa486':'#658b7d');rect(c,x-2,y-24,2,16,'#385d58');ellipse(c,x-7,y-21,5,3,'#92ab8d');ellipse(c,x+e.face*16,y-10,7,7,'#425d53');rect(c,x+e.face*19,y-12,2,3,active?'#f0c093':'#caddb0');pixelLine(c,x+e.face*19,y-14,x+e.face*25,y-20,'#8faa91',2);
    } else this.drawBoss(e,x,t);
    if(e.type!=='boss'&&e.hp<e.maxHp){rect(c,x-e.w/2,y-e.h-10,e.w,3,'#16363c');rect(c,x-e.w/2,y-e.h-10,e.w*e.hp/e.maxHp,2,'#dbce9b');}
    if(warn && e.type!=='boss'){rect(c,x-1,y-e.h-17,2,7,'#f3d0a1');rect(c,x-1,y-e.h-8,2,2,'#f3d0a1');}
    c.restore();
  }
  drawMushroom(x,y,face,warn,t,state) {
    const c=this.c;rect(c,x-8,y-20,16,18,'#cfccac');rect(c,x-9,y-7,7,6,'#849682');rect(c,x+2,y-7,7,6,'#849682');
    ellipse(c,x,y-27,18,10,'#345e59');ellipse(c,x,y-29,16,9,warn?'#d7af85':'#9bbcaf');rect(c,x-10,y-32,4,3,'#dce2c5');rect(c,x+2,y-35,5,3,'#dce2c5');rect(c,x+9,y-28,4,2,'#dce2c5');rect(c,x-4+face*3,y-16,2,3,'#3d5a4f');rect(c,x+3+face*3,y-16,2,3,'#3d5a4f');
    if(state==='active')ellipse(c,x+face*8,y-12,3,3,'#41695c');else rect(c,x+face*3,y-11,4,1,'#577866');
  }
  drawBoss(e,x,t) {
    const c=this.c,y=e.y,body=e.enraged?'#8e9c8e':'#769790',shade='#385e60',light=e.enraged?'#c6b58f':'#acbdb0';
    ellipse(c,x-29,y-4,16,5,shade);ellipse(c,x+30,y-4,16,5,shade);
    ellipse(c,x,y-28,45,34,shade);ellipse(c,x,y-32,41,31,body);ellipse(c,x,y-17,28,19,'#c8c5a7');
    ellipse(c,x-26,y-59,14,13,shade);ellipse(c,x+26,y-59,14,13,shade);ellipse(c,x-26,y-61,12,11,light);ellipse(c,x+26,y-61,12,11,light);
    ellipse(c,x-24+e.face*3,y-60,7,7,'#dace94');ellipse(c,x+26+e.face*3,y-60,7,7,'#dace94');rect(c,x-25+e.face*3,y-66,3,11,e.enraged?'#953d3d':'#234845');rect(c,x+25+e.face*3,y-66,3,11,e.enraged?'#953d3d':'#234845');
    rect(c,x-18,y-34,36,2,shade);rect(c,x-24,y-38,5,2,shade);rect(c,x+19,y-38,5,2,shade);rect(c,x-12,y-22,25,1,'#e2dbc2');
    for(let i=0;i<12;i++)ellipse(c,x+(hash(i+12)-.5)*67,y-40+hash(i+44)*15,2,1,shade);
    poly(c,[[x-12,y-66],[x-17,y-78],[x-7,y-73],[x,y-85],[x+7,y-73],[x+17,y-78],[x+12,y-66]],'#bdbf98');rect(c,x-12,y-69,24,3,'#e4d8a4');
    if(e.state==='warn') {
      if(e.action===1){c.globalAlpha=.35+Math.sin(t*20)*.1;ellipse(c,e.aimX-this.camera,FLOOR-1,120,5,'#f1ad89');pixelLine(c,e.aimX-this.camera-120,FLOOR-2,e.aimX-this.camera+120,FLOOR-2,'#eed2a0',2);c.globalAlpha=1;}
      else if(e.action===2){c.globalAlpha=.25;rect(c,x+e.aim*90-100,FLOOR-48,200,48,'#eeaf8c');c.globalAlpha=1;}
      rect(c,x-2,y-101,4,12,'#e9c5a4');rect(c,x-2,y-85,4,3,'#e9c5a4');
    }
  }
  effect(f,cam) {
    const c=this.c,x=f.x-cam,progress=1-f.t/f.max;
    c.save();
    if(f.type==='number'){c.globalAlpha=Math.min(1,f.t*3);c.font='bold 9px monospace';c.textAlign='center';c.fillStyle='#143b3e';c.fillText(f.value,x+1,f.y-progress*22+1);c.fillStyle=f.color;c.fillText(f.value,x,f.y-progress*22);}
    if(f.type==='burst'){const radius=f.radius*Math.min(1,progress*2.4);c.globalAlpha=(1-progress)*.2;ellipse(c,x,f.y,radius,radius,'#f5e5b9');c.globalAlpha=1-progress;c.strokeStyle='#f4edc8';c.lineWidth=3;c.beginPath();c.arc(x,f.y,radius,0,Math.PI*2);c.stroke();for(let i=0;i<16;i++){const a=i/16*Math.PI*2;ellipse(c,x+Math.cos(a)*radius,f.y+Math.sin(a)*radius,3+Math.sin(i)*2,3+Math.sin(i)*2,'#e2e9c3');}}
    if(f.type==='shock'){c.globalAlpha=1-progress;ellipse(c,x,FLOOR-3,f.radius*progress,5,'#f5d2a2');}
    if(f.type==='sweep'){c.globalAlpha=1-progress;rect(c,x,f.y,0,0,'#e4c29c');poly(c,[[x,f.y-8],[x+f.direction*180,f.y-12],[x+f.direction*200,f.y],[x+f.direction*180,f.y+5],[x,f.y+4]],'#dec3a2');}
    c.restore();
  }
}
