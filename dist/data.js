export const W = 640, H = 360, FLOOR = 310;
export const BIOMES = [
  { name: '萤火森林', subtitle: 'FIREFLY WOODS', sky: ['#0b2c35', '#245459'], mist: '#467974', grass: '#78ad72', accent: '#d3e994', ground: '#253f3e' },
  { name: '沉没遗迹', subtitle: 'DROWNED RUINS', sky: ['#142c40', '#375b6a'], mist: '#537f86', grass: '#83bfc0', accent: '#c4dedd', ground: '#293f4b' },
  { name: '月光沼泽', subtitle: 'MOONLIT MARSH', sky: ['#252c47', '#595b70'], mist: '#797888', grass: '#9daa9c', accent: '#f2d9b2', ground: '#3e4650' }
];
export const RELICS = [
  { id: 'reed', name: '锋利芦苇', kind: 'blade', family: '连击', desc: '普通攻击伤害 +20%', apply: s => s.damage *= 1.2 },
  { id: 'tempo', name: '轻盈节拍', kind: 'wing', family: '连击', desc: '攻击速度 +15%', apply: s => s.attackSpeed *= 1.15 },
  { id: 'echo', name: '回响叶片', kind: 'leaf', family: '连击', desc: '第三击追加 50% 伤害', apply: s => s.finisher += .5 },
  { id: 'vamp', name: '甜露花瓣', kind: 'flower', family: '连击', desc: '击败敌人回复 3 点生命', apply: s => s.killHeal += 3 },
  { id: 'foam', name: '浓郁奶泡', kind: 'bubble', family: '奶泡', desc: '奶泡爆发伤害 +30%', apply: s => s.skillDamage *= 1.3 },
  { id: 'tide', name: '月潮珍珠', kind: 'moon', family: '奶泡', desc: '奶泡爆发范围 +25%', apply: s => s.skillRadius *= 1.25 },
  { id: 'charge', name: '星光奶瓶', kind: 'bottle', family: '奶泡', desc: '攻击与击杀的能量获取 +30%', apply: s => s.energyGain *= 1.3 },
  { id: 'refund', name: '不尽之泉', kind: 'drop', family: '奶泡', desc: '奶泡爆发返还 15 点能量', apply: s => s.skillRefund += 15 },
  { id: 'dash', name: '风行莲叶', kind: 'wind', family: '冲刺', desc: '冲刺冷却缩短 20%', apply: s => s.dashCooldown *= .8 },
  { id: 'thorn', name: '荆棘披风', kind: 'thorn', family: '冲刺', desc: '冲刺撞击造成 18 点伤害', apply: s => s.dashDamage += 18 },
  { id: 'heart', name: '温暖牛奶', kind: 'heart', family: '生存', desc: '生命上限 +25，回复 25 点生命', apply: s => s.maxHp += 25 },
  { id: 'shell', name: '柔软苔甲', kind: 'shield', family: '生存', desc: '受到的伤害减少 15%', apply: s => s.defense *= .85 }
];
export const ENEMY_TYPES = {
  slime: { name: '露水史莱姆', hp: 44, damage: 8, speed: 39, score: 60, w: 30, h: 24 },
  bat: { name: '荧光萤虫', hp: 28, damage: 6, speed: 60, score: 75, w: 24, h: 20 },
  mushroom: { name: '吐泡蘑菇', hp: 54, damage: 9, speed: 22, score: 90, w: 28, h: 34 },
  beetle: { name: '苔背甲虫', hp: 74, damage: 12, speed: 36, score: 110, w: 36, h: 26 },
  boss: { name: '潮汐蟾王', hp: 900, damage: 18, speed: 42, score: 1500, w: 84, h: 68 }
};
export const ROOM_TEMPLATES = [
  [{ x: 330, y: 244, w: 142 }, { x: 620, y: 224, w: 116 }, { x: 850, y: 250, w: 158 }, { x: 1190, y: 220, w: 156 }, { x: 1490, y: 246, w: 142 }, { x: 1790, y: 226, w: 142 }],
  [{ x: 300, y: 258, w: 110 }, { x: 515, y: 208, w: 134 }, { x: 790, y: 246, w: 156 }, { x: 1080, y: 234, w: 138 }, { x: 1390, y: 204, w: 116 }, { x: 1700, y: 252, w: 150 }],
  [{ x: 390, y: 236, w: 210 }, { x: 735, y: 252, w: 126 }, { x: 970, y: 218, w: 166 }, { x: 1280, y: 256, w: 210 }, { x: 1690, y: 225, w: 192 }]
];
export function rng(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function baseStats() { return { maxHp: 100, damage: 13, attackSpeed: 1, finisher: 0, killHeal: 0, skillDamage: 70, skillRadius: 150, energyGain: 1, skillRefund: 0, dashCooldown: 1.1, dashDamage: 0, defense: 1 }; }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function overlaps(a, b) { return a.x - a.w / 2 < b.x + b.w / 2 && a.x + a.w / 2 > b.x - b.w / 2 && a.y > b.y - b.h && a.y - a.h < b.y; }
