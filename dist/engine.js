import { FLOOR, RELICS, ENEMY_TYPES, ROOM_TEMPLATES, rng, baseStats, clamp, overlaps } from './data.js';

export class Game {
  constructor() { this.mode = 'title'; this.events = []; this.seed = 1; this.start(1); this.mode = 'title'; this.events = []; }
  emit(type, detail = {}) { this.events.push({ type, ...detail }); }
  drainEvents() { const e = this.events; this.events = []; return e; }
  start(seed = Date.now()) {
    this.seed = seed >>> 0; this.random = rng(this.seed); this.mode = 'playing'; this.time = 0; this.roomIndex = 0;
    this.score = 0; this.kills = 0; this.relics = {}; this.stats = baseStats(); this.events = []; this.effects = [];
    this.player = { x: 88, y: FLOOR, w: 23, h: 40, vx: 0, vy: 0, face: 1, hp: 100, energy: 35, jumps: 0, grounded: true,
      attack: null, combo: 0, comboWindow: 0, queued: false, dash: 0, dashCd: 0, invuln: 0, hurt: 0, walk: 0, dashHits: new Set() };
    this.loadRoom(0); this.emit('mode', { mode: 'playing' });
  }
  loadRoom(index) {
    this.roomIndex = index; const boss = index === 6;
    this.room = { width: boss ? 1060 : 2180, biome: Math.min(2, Math.floor(index / 2)), boss, clear: false, rewardClaimed: false, exit: boss ? 995 : 2080,
      platforms: boss ? [] : ROOM_TEMPLATES[Math.floor(this.random() * ROOM_TEMPLATES.length)].map(p => ({ ...p, h: 13 })) };
    this.enemies = []; this.projectiles = []; this.pickups = []; this.effects = []; this.nextId = 1;
    const p = this.player; Object.assign(p, { x: 88, y: FLOOR, vx: 0, vy: 0, grounded: true, jumps: 0, attack: null, queued: false, combo: 0, comboWindow: 0, dash: 0, dashCd: 0, invuln: 1, hurt: 0 });
    if (boss) this.addEnemy('boss', 735);
    else {
      const count = 8 + index * 2;
      for (let i = 0; i < count; i++) {
        const pool = index === 0 ? ['slime', 'slime', 'mushroom'] : ['slime', 'bat', 'mushroom', 'beetle'];
        const type = pool[Math.floor(this.random() * pool.length)];
        const x = 330 + i * (1640 / count) + this.random() * 64;
        this.addEnemy(type, x);
      }
    }
    this.emit('room', { index });
  }
  addEnemy(type, x) {
    const d = ENEMY_TYPES[type], factor = type === 'boss' ? 1 : 1 + this.roomIndex * .18;
    const e = { id: this.nextId++, type, x, y: type === 'bat' ? FLOOR - 25 : FLOOR, home: x, w: d.w, h: d.h, hp: Math.round(d.hp * factor), maxHp: Math.round(d.hp * factor),
      damage: d.damage, vx: 0, vy: 0, face: -1, state: 'idle', timer: .5 + this.random(), hurt: 0, knock: 0, age: this.random() * 10, hit: false, action: 0, enraged: false, activated: false };
    this.enemies.push(e); return e;
  }
  pause() { if (this.mode === 'playing') { this.mode = 'paused'; this.clearActions(); this.emit('mode', { mode: 'paused' }); } }
  resume() { if (this.mode === 'paused') { this.mode = 'playing'; this.clearActions(); this.emit('mode', { mode: 'playing' }); } }
  clearActions() { this.player.queued = false; this.player.vx = 0; }
  attack() {
    const p = this.player;
    if (p.dash > 0 || p.hurt > .12) return;
    if (p.attack) { if (p.attack.t > .1 / this.stats.attackSpeed) p.queued = true; return; }
    const n = p.comboWindow > 0 ? (p.combo + 1) % 3 : 0;
    p.combo = n; p.comboWindow = .55;
    p.attack = { t: 0, n, hits: new Set(), direction: p.face };
    this.emit('swing', { n });
  }
  dash() {
    const p = this.player;
    if (p.dashCd > 0 || p.hurt > .12) return;
    p.attack = null; p.queued = false; p.dash = .2; p.dashCd = this.stats.dashCooldown; p.invuln = Math.max(p.invuln, .25); p.vy = 0; p.dashHits.clear();
    this.emit('dash');
  }
  skill() {
    const p = this.player;
    if (p.energy < 100 || p.dash > 0 || p.hurt > .12) { if (p.energy < 100) this.emit('hint', { text: '奶泡能量未满 · 攻击和击杀可蓄能' }); return; }
    p.energy = clamp(this.stats.skillRefund, 0, 70); p.attack = null; p.queued = false; p.invuln = Math.max(p.invuln, .5);
    this.effects.push({ type: 'burst', x: p.x, y: p.y - 22, t: .65, max: .65, radius: this.stats.skillRadius });
    for (const e of this.enemies) if (e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < this.stats.skillRadius + e.w / 2) this.hitEnemy(e, this.stats.skillDamage, 180, 'skill');
    for (const b of this.projectiles) if (Math.hypot(b.x - p.x, b.y - (p.y - 20)) < this.stats.skillRadius) b.dead = true;
    this.emit('skill');
  }
  hitEnemy(e, damage, force = 90, source = 'attack') {
    if (e.hp <= 0) return;
    e.hp = Math.max(0, e.hp - Math.round(damage)); e.hurt = .18; e.knock = .13;
    if (e.type !== 'boss') e.vx = Math.sign(e.x - this.player.x || this.player.face) * force;
    this.effects.push({ type: 'number', x: e.x, y: e.y - e.h - 4, value: Math.round(damage), t: .65, max: .65, color: source === 'skill' ? '#f5e5c0' : '#e0f5b2' });
    this.emit('hit', { x: e.x, y: e.y - e.h / 2, source });
    if (source === 'attack') this.player.energy = clamp(this.player.energy + 6 * this.stats.energyGain, 0, 100);
    if (e.hp === 0) {
      this.kills++; this.score += ENEMY_TYPES[e.type].score; this.player.energy = clamp(this.player.energy + 12 * this.stats.energyGain, 0, 100);
      this.player.hp = Math.min(this.stats.maxHp, this.player.hp + this.stats.killHeal);
      for (let i = 0; i < 3; i++) this.pickups.push({ x: e.x + (i - 1) * 10, y: e.y - 10, vx: (this.random() - .5) * 70, vy: -80 - this.random() * 60, age: 0, taken: false });
      this.emit('kill', { x: e.x, y: e.y - e.h / 2, boss: e.type === 'boss' });
    }
  }
  hurtPlayer(damage, fromX) {
    const p = this.player;
    if (p.invuln > 0 || this.mode !== 'playing') return false;
    const actual = Math.max(1, Math.round(damage * this.stats.defense)); p.hp = Math.max(0, p.hp - actual);
    p.invuln = .9; p.hurt = .28; p.vx = Math.sign(p.x - fromX || -p.face) * 145; p.vy = -125; p.attack = null; p.queued = false;
    this.emit('hurt', { damage: actual });
    if (!p.hp) { this.mode = 'dead'; this.clearActions(); this.emit('mode', { mode: 'dead' }); }
    return true;
  }
  chooseRelic(id) {
    if (this.mode !== 'upgrade' || !this.choices?.includes(id)) return false;
    const relic = RELICS.find(r => r.id === id); const before = this.stats.maxHp;
    relic.apply(this.stats); this.relics[id] = (this.relics[id] || 0) + 1;
    this.player.hp = Math.min(this.stats.maxHp, this.player.hp + this.stats.maxHp - before + 18);
    this.room.rewardClaimed = true; this.mode = 'playing'; this.clearActions(); this.emit('relic', { id }); this.emit('mode', { mode: 'playing' });
    this.emit('hint', { text: '月门已开启 · 靠近右侧月门，按 E 继续' }); return true;
  }
  tryExit() {
    if (this.mode !== 'playing' || !this.room.rewardClaimed || Math.abs(this.player.x - this.room.exit) > 65) return false;
    this.score += 200; this.loadRoom(this.roomIndex + 1); return true;
  }
  checkClear() {
    if (this.room.clear || this.enemies.some(e => e.hp > 0)) return;
    this.room.clear = true; this.projectiles = []; this.player.attack = null; this.player.queued = false;
    if (this.room.boss) { this.mode = 'won'; this.score += Math.max(0, Math.round(1200 - this.time)); this.emit('mode', { mode: 'won' }); return; }
    const pool = RELICS.filter(r => (this.relics[r.id] || 0) < 3);
    this.choices = [];
    while (this.choices.length < 3 && pool.length) { const i = Math.floor(this.random() * pool.length); this.choices.push(pool.splice(i, 1)[0].id); }
    this.mode = 'upgrade'; this.emit('mode', { mode: 'upgrade' });
  }
  tick(dt, input = {}) {
    if (this.mode !== 'playing') return;
    this.time += dt; const p = this.player;
    for (const key of ['dash', 'dashCd', 'invuln', 'hurt', 'comboWindow']) p[key] = Math.max(0, p[key] - dt);
    if (input.left !== input.right) p.face = input.left ? -1 : 1;
    if (input.jump && p.jumps < 2 && p.hurt < .12) { p.vy = p.jumps === 0 ? -370 : -325; p.jumps++; p.grounded = false; this.emit('jump', { second: p.jumps === 2 }); }
    if (input.dash) this.dash();
    if (input.attack) this.attack();
    if (input.skill) this.skill();
    if (p.dash > 0) p.vx = p.face * 510;
    else if (p.hurt <= .12) p.vx = ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * (p.attack ? 106 : 175);
    else p.vx *= .92;
    const prevY = p.y; p.x = clamp(p.x + p.vx * dt, 22, this.room.width - 22);
    if (p.dash <= 0) p.vy = Math.min(490, p.vy + 880 * dt);
    p.y += p.vy * dt; p.grounded = false;
    if (p.vy >= 0) {
      let landing = FLOOR;
      for (const plat of this.room.platforms) if (p.x + p.w / 2 > plat.x && p.x - p.w / 2 < plat.x + plat.w && prevY <= plat.y + 1 && p.y >= plat.y) landing = Math.min(landing, plat.y);
      if (p.y >= landing) { p.y = landing; p.vy = 0; p.grounded = true; p.jumps = 0; }
    }
    p.walk += Math.abs(p.vx) * dt / 22;
    if (p.attack) {
      const a = p.attack; a.t += dt; const speed = this.stats.attackSpeed;
      if (a.t >= .065 / speed && a.t <= .19 / speed) {
        const hitbox = { x: p.x + a.direction * 34, y: p.y - 4, w: a.n === 2 ? 88 : 68, h: 51 };
        for (const e of this.enemies) if (e.hp > 0 && !a.hits.has(e.id) && overlaps(hitbox, e)) {
          a.hits.add(e.id); this.hitEnemy(e, this.stats.damage * (a.n === 2 ? 1.55 + this.stats.finisher : 1), a.n === 2 ? 180 : 90);
        }
      }
      if (a.t >= .31 / speed) { p.attack = null; p.comboWindow = .38; if (p.queued) { p.queued = false; this.attack(); } }
    }
    if (p.dash > 0 && this.stats.dashDamage) for (const e of this.enemies) if (e.hp > 0 && !p.dashHits.has(e.id) && overlaps(p, e)) { p.dashHits.add(e.id); this.hitEnemy(e, this.stats.dashDamage, 140, 'dash'); }
    for (const e of this.enemies) if (e.hp > 0) this.tickEnemy(e, dt);
    for (const b of this.projectiles) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (!b.dead && b.life > 0 && overlaps(p, { x: b.x, y: b.y + b.r, w: b.r * 2, h: b.r * 2 })) { this.hurtPlayer(b.damage, b.x); b.dead = true; }
    }
    this.projectiles = this.projectiles.filter(b => !b.dead && b.life > 0 && b.x > -50 && b.x < this.room.width + 50 && b.y < FLOOR + 60);
    for (const item of this.pickups) {
      item.age += dt;
      if (Math.hypot(p.x - item.x, p.y - 16 - item.y) < 100) { item.x += (p.x - item.x) * dt * 8; item.y += (p.y - 16 - item.y) * dt * 8; }
      else { item.vy += 450 * dt; item.x += item.vx * dt; item.y += item.vy * dt; if (item.y > FLOOR - 5) { item.y = FLOOR - 5; item.vy *= -.3; item.vx *= .7; } }
      if (Math.hypot(p.x - item.x, p.y - 16 - item.y) < 18) { item.taken = true; this.score += 8; this.emit('pearl'); }
    }
    this.pickups = this.pickups.filter(i => !i.taken && i.age < 18);
    this.effects.forEach(f => f.t -= dt); this.effects = this.effects.filter(f => f.t > 0);
    if (input.interact && this.tryExit()) return;
    if (this.mode === 'playing') this.checkClear();
  }
  tickEnemy(e, dt) {
    const p = this.player, d = ENEMY_TYPES[e.type]; e.age += dt; e.timer -= dt; e.hurt = Math.max(0, e.hurt - dt); e.knock = Math.max(0, e.knock - dt);
    const dx = p.x - e.x, dist = Math.abs(dx); e.face = dx < 0 ? -1 : 1;
    if (e.type === 'boss') { this.tickBoss(e, dt); return; }
    if (e.knock > 0) { e.x += e.vx * dt; e.x = clamp(e.x, 35, this.room.width - 35); return; }
    if (dist > 440 && !e.activated) return; e.activated = true;
    if (dist > 600) { e.x += e.face * d.speed * dt; return; }
    if (e.state === 'idle') {
      if (e.type === 'bat') {
        const targetY = p.y - 18; e.x += e.face * d.speed * dt; e.y += clamp(targetY - e.y, -42, 42) * dt; e.y = clamp(e.y, 60, FLOOR - 4);
        if (dist < 72 && e.timer <= 0) { e.state = 'warn'; e.timer = .42; }
      } else if (e.type === 'mushroom') {
        if (dist > 230) e.x += e.face * d.speed * dt;
        if (dist < 340 && e.timer <= 0) { e.state = 'warn'; e.timer = .72; }
      } else if (e.type === 'beetle') {
        if (dist > 150) e.x += e.face * d.speed * dt;
        if (dist < 240 && e.timer <= 0) { e.state = 'warn'; e.timer = .65; e.aim = e.face; }
      } else {
        if (dist > 30) e.x += e.face * d.speed * dt;
        if (dist < 64 && e.timer <= 0) { e.state = 'warn'; e.timer = .48; }
      }
    } else if (e.state === 'warn' && e.timer <= 0) {
      e.state = 'active'; e.hit = false;
      e.timer = e.type === 'beetle' ? .48 : .22;
      if (e.type === 'mushroom') {
        const vx = p.x - e.x, vy = p.y - 20 - (e.y - 24), mag = Math.hypot(vx, vy) || 1;
        this.projectiles.push({ x: e.x, y: e.y - 24, vx: vx / mag * 145, vy: vy / mag * 145, r: 6, damage: d.damage, life: 5, kind: 'spore' });
        this.emit('shoot');
      }
    } else if (e.state === 'active') {
      if (e.type === 'beetle') e.x += e.aim * 250 * dt;
      if (e.type === 'bat') { e.x += e.face * 110 * dt; e.y += clamp(p.y - 16 - e.y, -120, 120) * dt; }
      if (e.type !== 'mushroom' && !e.hit) {
        const box = { x: e.x + (e.type === 'slime' ? e.face * 12 : 0), y: e.y, w: e.w + 18, h: e.h + 8 };
        if (overlaps(p, box) && this.hurtPlayer(d.damage, e.x)) e.hit = true;
      }
      if (e.timer <= 0) { e.state = 'recover'; e.timer = e.type === 'beetle' ? 1.2 : .7; }
    } else if (e.state === 'recover' && e.timer <= 0) { e.state = 'idle'; e.timer = .45 + this.random() * .5; }
    e.x = clamp(e.x, 35, this.room.width - 35);
  }
  tickBoss(e, dt) {
    const p = this.player;
    if (Math.abs(p.x - e.x) > 450 && !e.activated) return;
    if (!e.activated) { e.activated = true; this.emit('boss'); }
    if (e.hp <= e.maxHp * .5 && !e.enraged) { e.enraged = true; this.emit('enrage'); }
    const speed = e.enraged ? 1.3 : 1;
    if (e.state === 'idle') {
      e.x += e.face * 24 * dt;
      if (e.timer <= 0) { e.action = (e.action + 1) % 3; e.state = 'warn'; e.timer = (e.action === 1 ? .95 : .8) / speed; e.aimX = clamp(p.x, 100, this.room.width - 100); e.aim = e.face; this.emit('bossWarn', { action: e.action }); }
    } else if (e.state === 'warn' && e.timer <= 0) {
      e.state = 'active'; e.hit = false; e.timer = e.action === 1 ? .75 : .5;
      if (e.action === 0) {
        for (let i = -2; i <= 2; i++) { const angle = (e.aim > 0 ? 0 : Math.PI) + i * .24; this.projectiles.push({ x: e.x + e.aim * 38, y: e.y - 38, vx: Math.cos(angle) * 170, vy: Math.sin(angle) * 170 - 16, r: 9, damage: 14, life: 6, kind: 'milk' }); }
        this.emit('shoot');
      }
    } else if (e.state === 'active') {
      if (e.action === 1) {
        const progress = 1 - e.timer / .75;
        e.x += (e.aimX - e.x) * Math.min(1, dt * 6); e.y = e.hit ? FLOOR : FLOOR - Math.sin(clamp(progress, 0, 1) * Math.PI) * 128;
        if (e.timer < .1 && !e.hit) { e.hit = true; e.y = FLOOR; this.effects.push({ type: 'shock', x: e.x, y: FLOOR, radius: 130, t: .45, max: .45 }); this.emit('slam', { x: e.x }); if (Math.abs(p.x - e.x) < 135 && p.y > FLOOR - 60) this.hurtPlayer(e.damage, e.x); }
      }
      if (e.action === 2 && !e.hit && e.timer < .3) {
        e.hit = true; this.effects.push({ type: 'sweep', x: e.x, y: FLOOR - 16, direction: e.aim, t: .3, max: .3 });
        if (overlaps(p, { x: e.x + e.aim * 90, y: FLOOR, w: 200, h: 52 })) this.hurtPlayer(e.damage, e.x);
      }
      if (e.timer <= 0) { e.y = FLOOR; e.state = 'recover'; e.timer = 1.25 / speed; }
    } else if (e.state === 'recover' && e.timer <= 0) { e.state = 'idle'; e.timer = .5 / speed; }
    e.x = clamp(e.x, 95, this.room.width - 95);
  }
}
