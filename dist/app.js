import { Game } from './engine.js';
import { Renderer } from './art.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { RELICS, BIOMES, clamp } from './data.js';
import { icon, hydrateIcons } from './icons.js';

const $=id=>document.getElementById(id),game=new Game(),renderer=new Renderer($('game')),audio=new Audio();
const STORAGE='milkfrog-moonmarsh:v1';
const defaults={bestScore:0,wins:0,runs:0,sound:true,shake:!matchMedia('(prefers-reduced-motion: reduce)').matches};
let records={...defaults};
try { const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');if(saved&&typeof saved==='object'){for(const key of ['bestScore','wins','runs'])if(Number.isFinite(saved[key])&&saved[key]>=0)records[key]=saved[key];for(const key of ['sound','shake'])if(typeof saved[key]==='boolean')records[key]=saved[key];} } catch {}
let overlay=null,overlayWasPlaying=false,toastTimer=0,recorded=false,lastHud=0,accumulator=0,last=performance.now(),focusReturn=null;
hydrateIcons();audio.setEnabled(records.sound);renderer.shakeEnabled=records.shake;
const input=new Input(command,()=>game.mode==='playing'&&!overlay);
const portraitPhone=()=>innerWidth<760&&matchMedia('(orientation: portrait)').matches&&matchMedia('(pointer: coarse)').matches;
function save() { try { localStorage.setItem(STORAGE,JSON.stringify(records)); } catch { toast('当前浏览器无法保存纪录，本次仍可正常游玩'); } }
function toast(text) { $('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000); }
function show(id,on) { $(id).classList.toggle('hidden',!on); }
function focusModal(id) { const el=$(id);el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');requestAnimationFrame(()=>el.querySelector('button,input')?.focus({preventScroll:true})); }
function sync() {
  const mode=game.mode;
  if(mode!=='playing'||overlay)$('toast').classList.remove('show');
  show('menu',mode==='title'&&!overlay);show('pause-screen',mode==='paused'&&!overlay);show('upgrade-screen',mode==='upgrade'&&!overlay);show('end-screen',['dead','won'].includes(mode)&&!overlay);
  show('help-screen',overlay==='help');show('settings-screen',overlay==='settings');show('hud',mode!=='title');show('relic-bar',mode!=='title');
  show('objective',mode==='playing'&&!overlay);show('touch-controls',mode==='playing'&&!overlay);
  $('best-score').textContent=records.bestScore?records.bestScore.toLocaleString():'—';$('wins-count').textContent=records.wins;
  $('sound-btn').innerHTML=icon(records.sound?'sound':'mute');$('sound-btn').setAttribute('aria-pressed',String(records.sound));$('sound-btn').setAttribute('aria-label',records.sound?'关闭声音':'开启声音');
  $('sound-setting').checked=records.sound;$('shake-setting').checked=records.shake;
  if(mode==='upgrade'&&!overlay){buildChoices();focusModal('upgrade-screen');}
  if(mode==='paused'&&!overlay)focusModal('pause-screen');
  if(['dead','won'].includes(mode)&&!overlay){buildEnd();focusModal('end-screen');}
  if(overlay)focusModal(overlay==='help'?'help-screen':'settings-screen');
  document.body.classList.toggle('in-game',mode!=='title');
  updateHud();
}
function begin() {
  if(portraitPhone()){toast('请将手机横过来，再开始远征');return;}
  audio.unlock();overlay=null;input.clear();renderer.camera=0;recorded=false;records.runs++;save();game.start();processEvents();sync();$('game').focus({preventScroll:true});toast('萤火森林 · 按住 J 攻击，K 冲刺躲避');
}
function openOverlay(name) {
  if(overlay)return;focusReturn=document.activeElement;overlayWasPlaying=game.mode==='playing';if(overlayWasPlaying)game.pause();input.clear();overlay=name;processEvents();sync();
}
function closeOverlay() { if(!overlay)return;overlay=null;input.clear();if(overlayWasPlaying)game.resume();overlayWasPlaying=false;processEvents();sync();if(game.mode==='playing')$('game').focus({preventScroll:true});else focusReturn?.focus({preventScroll:true}); }
function home() { overlay=null;input.clear();game.mode='title';renderer.camera=0;sync();$('start-btn').focus({preventScroll:true}); }
function command(name,index) {
  if(name==='escape'){if(overlay){closeOverlay();return;}if(game.mode==='playing'){game.pause();input.clear();processEvents();}else if(game.mode==='paused'){game.resume();input.clear();processEvents();$('game').focus({preventScroll:true});}return;}
  if(name==='choice'&&game.mode==='upgrade'&&!overlay)choose(game.choices[index]);
  if(name==='retry'&&['dead','won'].includes(game.mode)&&!overlay)begin();
}
function relicChip(id,count) { const r=RELICS.find(r=>r.id===id);return `<span class="relic-chip" title="${r.name} ×${count}：${r.desc}" aria-label="${r.name} ${count}层">${icon(r.kind)}${count>1?`<b>${count}</b>`:''}</span>`; }
function buildChoices() {
  $('upgrade-cards').innerHTML=game.choices.map((id,i)=>{const r=RELICS.find(r=>r.id===id),count=game.relics[id]||0;return `<button class="upgrade-card" data-relic="${id}"><span class="card-number">0${i+1}</span><div class="relic-art">${icon(r.kind)}</div><span class="card-family">${r.family}祝福</span><h3>${r.name}</h3><p>${r.desc}</p><div class="card-footer"><span>${count?'已有 '+count+' 层':'新的奇遇'}</span><span>选择此祝福 ↗</span></div></button>`;}).join('');
  $('upgrade-cards').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.relic)));
}
function choose(id) { if(game.chooseRelic(id)){input.clear();processEvents();sync();$('game').focus({preventScroll:true});} }
const formatTime=time=>`${String(Math.floor(time/60)).padStart(2,'0')}:${String(Math.floor(time%60)).padStart(2,'0')}`;
function buildEnd() {
  const won=game.mode==='won';
  if(!recorded){records.bestScore=Math.max(records.bestScore,game.score);if(won)records.wins++;recorded=true;save();}
  $('end-title').textContent=won?'月沼，终于迎来了黎明':'月光会记得你的勇敢';$('end-eyebrow').textContent=won?'A LITTLE FROG. A GRAND ADVENTURE.':'THE JOURNEY CONTINUES';
  $('end-description').textContent=won?'你击败了潮汐蟾王。带着祝福，再走一条新的路吧。':'休息一下，下一次会走得更远。';
  $('end-emblem').innerHTML=icon(won?'spark':'moon');$('end-score').textContent=game.score.toLocaleString();$('end-time').textContent=formatTime(game.time);$('end-room').textContent=`${game.roomIndex+1} / 7`;
  $('end-relics').innerHTML=Object.entries(game.relics).map(([id,count])=>relicChip(id,count)).join('');
}
function updateHud() {
  const p=game.player;$('hp-label').textContent=`${Math.ceil(p.hp)} / ${game.stats.maxHp}`;$('hp-fill').style.width=`${p.hp/game.stats.maxHp*100}%`;$('energy-fill').style.width=`${p.energy}%`;
  $('energy-label').textContent=p.energy>=100?'奶泡就绪 · L 释放':`奶泡蓄能 ${Math.floor(p.energy)}%`;
  $('biome-label').textContent=game.room.boss?'潮汐王座':BIOMES[game.room.biome].name;$('room-label').textContent=`0${game.roomIndex+1} / 07`;$('score-label').textContent=game.score.toLocaleString();
  const relicHtml=Object.entries(game.relics).map(([id,count])=>relicChip(id,count)).join('');if($('relic-bar').innerHTML!==relicHtml)$('relic-bar').innerHTML=relicHtml;
  const remaining=game.enemies.filter(e=>e.hp>0).length;$('objective-text').textContent=game.room.rewardClaimed?'月门已开启 · 前往右侧月门':game.room.boss?'击败潮汐蟾王':`清除这一带的敌人 · 剩余 ${remaining}`;
  const boss=game.enemies.find(e=>e.type==='boss'&&e.hp>0&&e.activated);show('boss-hud',!!boss&&game.mode==='playing'&&!overlay);
  if(boss){$('boss-fill').style.width=`${boss.hp/boss.maxHp*100}%`;$('boss-phase').textContent=boss.enraged?'月潮狂涌':'月沼守望者';}
  show('exit-prompt',game.mode==='playing'&&!overlay&&game.room.rewardClaimed&&Math.abs(p.x-game.room.exit)<65);
  const interact=document.querySelector('[data-action="interact"]');interact.style.opacity=game.room.rewardClaimed?'1':'.3';
}
function processEvents() { for(const event of game.drainEvents()){renderer.event(event);audio.event(event.type);if(event.type==='mode'){input.clear();sync();}if(event.type==='hint')toast(event.text);if(event.type==='enrage')toast('潮汐蟾王 · 月潮狂涌！');if(event.type==='boss')toast('潮汐蟾王出现 · 看准预警，保持移动');if(event.type==='room')updateHud();} }

$('start-btn').addEventListener('click',begin);$('retry-btn').addEventListener('click',begin);$('home-btn').addEventListener('click',home);$('quit-btn').addEventListener('click',home);
$('resume-btn').addEventListener('click',()=>{game.resume();input.clear();processEvents();$('game').focus({preventScroll:true});});$('pause-btn').addEventListener('click',()=>command('escape'));
for(const id of ['help-btn','menu-help','pause-help'])$(id).addEventListener('click',()=>openOverlay('help'));$('close-help').addEventListener('click',closeOverlay);
for(const id of ['settings-btn','pause-settings'])$(id).addEventListener('click',()=>openOverlay('settings'));$('close-settings').addEventListener('click',closeOverlay);
function setSound(value) { audio.unlock();records.sound=value;audio.setEnabled(value);save();$('sound-btn').innerHTML=icon(value?'sound':'mute');$('sound-btn').setAttribute('aria-pressed',String(value));$('sound-btn').setAttribute('aria-label',value?'关闭声音':'开启声音');$('sound-setting').checked=value; }
$('sound-btn').addEventListener('click',()=>setSound(!records.sound));$('sound-setting').addEventListener('change',event=>setSound(event.target.checked));$('shake-setting').addEventListener('change',event=>{records.shake=event.target.checked;renderer.shakeEnabled=records.shake;save();});
$('fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('game-frame').requestFullscreen)await $('game-frame').requestFullscreen();else toast('当前浏览器暂不支持全屏');}catch{toast('当前浏览器暂不支持全屏');}});
function onBlur(){input.clear();if(game.mode==='playing'){game.pause();processEvents();}}
window.addEventListener('blur',onBlur);document.addEventListener('visibilitychange',()=>{if(document.hidden)onBlur();});
window.addEventListener('resize',()=>{if(portraitPhone()&&game.mode==='playing'){onBlur();toast('请横屏继续冒险');}});
window.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;const active=overlay?$(overlay==='help'?'help-screen':'settings-screen'):game.mode==='paused'?$('pause-screen'):game.mode==='upgrade'?$('upgrade-screen'):['dead','won'].includes(game.mode)?$('end-screen'):null;
  if(!active)return;const items=[...active.querySelectorAll('button,input')];if(!items.length)return;const first=items[0],last=items.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
function frame(now) {
  const dt=clamp((now-last)/1000,0,.05);last=now;
  if(game.mode==='playing'&&!overlay&&renderer.hitstop<=0){accumulator+=dt;let count=0;while(accumulator>=1/60&&count++<4){game.tick(1/60,input.consume(1/60));accumulator-=1/60;if(game.mode!=='playing'){accumulator=0;break;}}processEvents();}else accumulator=0;
  renderer.render(game,dt,game.mode==='title'?now/1000:game.time);audio.update(dt,overlay?'paused':game.mode);
  if(now-lastHud>90){updateHud();lastHud=now;}requestAnimationFrame(frame);
}
sync();$('loading').remove();requestAnimationFrame(frame);
