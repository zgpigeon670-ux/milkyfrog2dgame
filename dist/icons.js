const paths = {
  arrow:'M4 12h16m-6-6 6 6-6 6', left:'m15 5-7 7 7 7',right:'m9 5 7 7-7 7',up:'m5 15 7-7 7 7',
  play:'m8 5 11 7-11 7Z',pause:'M8 5v14M16 5v14',
  help:'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  sound:'m3 9 4 0 5-4v14l-5-4H3Zm12-2a7 7 0 0 1 0 14m1-11a3 3 0 0 1 0 6',
  mute:'m3 9 4 0 5-4v14l-5-4H3Zm13 0 6 6m0-6-6 6',
  expand:'M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6',
  settings:'m9 3 6 0 1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Zm7 9a4 4 0 1 0-8 0 4 4 0 0 0 8 0',
  pearl:'M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0M9 10l2-2',
  blade:'m5 19 3-3M3 16l5 5m0-7 9-11 4 0v4L10 16Zm3-2 8-8',
  leaf:'M19 3C7 3 2 9 5 17c8 5 16-3 14-14ZM5 19 16 8m-7 8 0-5m4 1 5 0',
  wing:'M3 15C1 3 17 1 21 5c-3 6-7 12-16 12Zm2 3L16 7m-5 5h6m-9 3h5',
  flower:'M12 8c-7-9-14 3-5 5-6 7 6 13 8 5 8 2 10-10 2-10 2-7-8-9-5 0Zm3 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  bubble:'M15 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm7 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM18 3v3m-2-2h4M6 8l2-2',
  moon:'M19 16A9 9 0 1 1 8 3a8 8 0 0 0 11 13ZM17 2v4m-2-2h4',
  bottle:'M9 3h6v4l3 4v9H6v-9l3-4ZM9 7h6M7 14h10m-7 3h4',
  drop:'M12 2C9 8 4 11 4 16a8 8 0 0 0 16 0c0-5-5-8-8-14ZM8 15v2l2 2',
  wind:'M2 8h14a3 3 0 1 0-3-3M2 12h18a3 3 0 0 1 0 6M2 16h8a3 3 0 0 1 0 6',
  thorn:'M4 5 9 7l3-5 3 5 5-2-2 7 3 3-5 2-4 5-4-5-5-2 3-3Zm5 5 6 6m0-6-6 6',
  heart:'M12 20 3 11C-2 4 7 0 12 7c5-7 14-3 9 4Z',
  shield:'M12 2 3 6v7c0 4 4 7 9 9 5-2 9-5 9-9V6Zm-5 10 3 3 7-7',
  spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
  rotate:'M8 3h9a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8m-1-5-4-4 4-4m-4 4h8M11 17h3'
};
export function icon(name) { return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.spark}"/></svg>`; }
export function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon)); }
