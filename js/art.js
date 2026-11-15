const ART_W = 1200, ART_H = 220;

function hueOf(name) { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; }
function monogram(name) {
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

const artEsc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function artDefs(id, a, b) {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
}

function artFrame(id, scene, from = '#1b2a5e', to = '#0a3a4a') {
  return `<svg class="art" viewBox="0 0 ${ART_W} ${ART_H}" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">${artDefs(id, from, to)}<rect width="${ART_W}" height="${ART_H}" fill="url(#${id})"/>${scene}</svg>`;
}

function racksScene(S) {
  const n = 12, cols = 9, out = [];
  for (let i = 0; i < n * cols; i++) {
    const x = 60 + (i % cols) * 120, y = 30 + Math.floor(i / cols) * 16;
    const lit = (i * 37) % 7 !== 0;
    out.push(`<rect x="${x}" y="${y}" width="96" height="10" rx="2" fill="rgba(255,255,255,0.10)"/><circle class="led ${lit ? 'on' : ''}" cx="${x + 84}" cy="${y + 5}" r="2.4" fill="${lit ? '#6ee7b7' : '#9ee8ff'}" style="animation-delay:${(i % 9) * 0.18}s"/>`);
  }
  return out.join('');
}

function barsScene(S) {
  const h = S.history.length ? S.history.map(x => Math.log10(Math.max(1, x.valuation))) : [0, 1];
  const max = Math.max(...h, 1), n = Math.max(h.length, 2), w = ART_W / n;
  return h.map((v, i) => { const bh = Math.max(4, (v / max) * 170); return `<rect class="grow" style="animation-delay:${i * 0.03}s" x="${i * w + w * 0.15}" y="${ART_H - bh - 20}" width="${w * 0.7}" height="${bh}" rx="6" fill="rgba(158,232,255,${0.25 + 0.6 * (i / n)})"/>`; }).join('');
}

function chipScene(S) {
  const total = Object.values(S.me.fleet).reduce((a, b) => a + b, 0) + Object.values(S.me.rented).reduce((a, b) => a + b, 0);
  const pins = [];
  for (let i = 0; i < 12; i++) pins.push(`<rect x="${470 + i * 12}" y="${ART_H / 2 - 62}" width="4" height="14" rx="1" fill="rgba(226,232,245,0.5)"/><rect x="${470 + i * 12}" y="${ART_H / 2 + 48}" width="4" height="14" rx="1" fill="rgba(226,232,245,0.5)"/>`);
  return `<rect class="pulse" x="520" y="${ART_H / 2 - 48}" width="160" height="96" rx="14" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.35)"/><rect x="545" y="${ART_H / 2 - 24}" width="110" height="48" rx="8" fill="rgba(158,232,255,0.35)"/>${pins.join('')}${Array.from({ length: Math.min(40, total) }, (_, i) => `<rect x="${60 + (i % 20) * 52}" y="${150 - Math.floor(i / 20) * 26}" width="38" height="16" rx="3" fill="rgba(110,231,183,0.55)" class="grow" style="animation-delay:${i * 0.02}s"/>`).join('')}`;
}

function neuralScene(S) {
  const nodes = []; const cols = 6;
  for (let c = 0; c < cols; c++) for (let r = 0; r < 4; r++) nodes.push({ x: 120 + c * 180, y: 40 + r * 46 + (c % 2) * 20, s: 6 + (S.me.flagship ? S.me.flagship.cap : 0) / 14 * ((c + r) % 3 + 1) / 3 });
  const lines = []; for (let i = 0; i < nodes.length - 4; i++) if (i % 4 !== 3 || i < nodes.length) lines.push(`<line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[i + 4].x}" y2="${nodes[i + 4].y}" stroke="rgba(158,232,255,0.25)" stroke-width="1.5"/>`);
  return lines.join('') + nodes.map((n, i) => `<circle class="pulse" style="animation-delay:${(i % 7) * 0.2}s" cx="${n.x}" cy="${n.y}" r="${Math.min(9, n.s)}" fill="rgba(255,255,255,0.8)"/>`).join('');
}

function peopleScene(S) {
  const n = Math.round(Math.min(40, Math.max(6, S.me.researchers + S.me.engineers / 4)));
  return Array.from({ length: n }, (_, i) => { const x = 60 + (i % 20) * 56, y = 120 - Math.floor(i / 20) * 70; return `<circle class="bob" style="animation-delay:${(i % 5) * 0.2}s" cx="${x}" cy="${y}" r="12" fill="rgba(255,255,255,${0.35 + (i % 4) * 0.12})"/><path d="M${x - 18} ${y + 34} Q${x} ${y + 8} ${x + 18} ${y + 34}Z" fill="rgba(255,255,255,0.22)"/>`; }).join('');
}

function productsScene(S) {
  const sids = Object.keys(SEGMENTS);
  return sids.map((sid, i) => { const on = S.me.products.includes(sid), x = 40 + i * 162; return `<g class="${on ? 'lit' : ''}"><rect x="${x}" y="60" width="140" height="100" rx="18" fill="${on ? 'rgba(110,231,183,0.35)' : 'rgba(255,255,255,0.08)'}" stroke="rgba(255,255,255,0.25)"/><text x="${x + 14}" y="142" fill="rgba(241,244,251,0.9)" font-size="13" font-family="IBM Plex Sans">${SEGMENTS[sid].name}</text></g>`; }).join('');
}

function coinsScene(S) {
  const h = Math.min(160, Math.max(10, Math.log10(Math.max(1, S.me.cash)) * 28));
  const coins = []; for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) coins.push(`<ellipse class="bob" style="animation-delay:${(i + j) * 0.1}s" cx="${180 + i * 100}" cy="${ART_H - 30 - j * 14}" rx="34" ry="11" fill="rgba(253,224,71,${0.4 + j * 0.15})"/>`);
  return `<rect x="0" y="${ART_H - h}" width="${ART_W}" height="${h}" fill="rgba(255,255,255,0.04)"/>${coins.slice(0, Math.round(h / 6) + 8).join('')}`;
}

function shieldScene(S) {
  const lvl = S.w.regLevel;
  return `<path d="M600 22 L700 58 L700 130 Q700 180 600 204 Q500 180 500 130 L500 58Z" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.35)"/>` + [0, 1, 2, 3].map(i => `<rect x="${260 + i * 200}" y="${ART_H - 30}" width="150" height="10" rx="5" fill="${i <= lvl ? '#9ee8ff' : 'rgba(255,255,255,0.12)'}"/>`).join('');
}

function orbitScene(S) {
  const rivals = active(S).filter(c => c !== S.me).sort((a, b) => b.valuation - a.valuation).slice(0, 6);
  const cx = ART_W / 2, cy = ART_H / 2;
  return [120, 210, 300].map(r => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.12)"/>`).join('') + rivals.map((c, i) => { const a = (i / rivals.length) * Math.PI * 2, r = 120 + (i % 3) * 90, rad = 8 + Math.min(22, Math.log10(Math.max(1, c.valuation)) * 3); return `<circle class="orbit" style="animation-delay:${-i * 2}s" cx="${cx + Math.cos(a) * r}" cy="${cy + Math.sin(a) * r}" r="${rad}" fill="hsla(${hueOf(c.name)},80%,70%,0.85)"/>`; }).join('') + `<circle cx="${cx}" cy="${cy}" r="18" fill="${S.me.valuation > 0 ? '#9ee8ff' : '#666'}"/>`;
}

function donutScene(S) {
  const sh = marketShares(S)['chat'] ?? [];
  const cx = 600, cy = ART_H / 2, R = 88, C = 2 * Math.PI * R;
  let off = 0;
  const arcs = sh.map((x, i) => { const len = x.share * C; const el = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="hsl(${hueOf(x.name)},75%,68%)" stroke-width="26" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`; off += len; return el; });
  return (arcs.join('') || `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="26"/>`) + `<text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="rgba(241,244,251,0.85)" font-size="14" font-family="IBM Plex Sans">Chat share</text>`;
}

function handshakeScene(S) {
  const pend = S.deals.filter(d => d.status === 'pending').length;
  const cx = ART_W / 2;
  return `<circle class="pulse" cx="${cx - 60}" cy="${ART_H / 2}" r="46" fill="rgba(158,232,255,0.35)"/><circle class="pulse" cx="${cx + 60}" cy="${ART_H / 2}" r="46" fill="rgba(110,231,183,0.35)"/><circle cx="${cx}" cy="${ART_H / 2}" r="18" fill="rgba(255,255,255,0.7)"/>` + Array.from({ length: Math.min(12, pend) }, (_, i) => `<circle class="bob" style="animation-delay:${i * 0.15}s" cx="${cx - 180 + i * 30}" cy="60" r="7" fill="#fcd34d"/>`).join('');
}

function timelineScene(S) {
  const span = END_YEAR - START_YEAR, ticks = [];
  for (let y = START_YEAR; y <= END_YEAR; y++) { const x = 40 + ((y - START_YEAR) / span) * (ART_W - 80); const passed = y <= S.year; ticks.push(`<rect x="${x - 2}" y="${ART_H / 2 - (passed ? 30 : 16)}" width="4" height="${passed ? 60 : 32}" rx="2" fill="${passed ? '#9ee8ff' : 'rgba(255,255,255,0.18)'}"/>`); }
  return `<line x1="40" y1="${ART_H / 2}" x2="${ART_W - 40}" y2="${ART_H / 2}" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>` + ticks.join('') + `<circle class="pulse" cx="${40 + ((S.year - START_YEAR) / span) * (ART_W - 80)}" cy="${ART_H / 2}" r="9" fill="#fcd34d"/>`;
}

function podiumScene(S) {
  const board = active(S).sort((a, b) => b.valuation - a.valuation).slice(0, 3);
  return [1, 0, 2].map((idx, p) => { const c = board[idx]; if (!c) return ''; const h = [150, 110, 80][p] * (idx === 0 ? 1 : 0.9), x = 360 + p * 220; return `<rect class="grow" x="${x}" y="${ART_H - h - 20}" width="180" height="${h}" rx="14" fill="hsla(${hueOf(c.name)},75%,68%,0.7)"/><text x="${x + 90}" y="${ART_H - h - 28}" text-anchor="middle" fill="#f1f4fb" font-size="13" font-family="IBM Plex Sans">${artEsc(c.name.slice(0, 20))}</text>`; }).join('');
}

const ART_SCENES = {
  start: ['racks', racksScene, '#0f1a3d', '#06343f'],
  overview: ['bars', barsScene, '#1b2a5e', '#2b1b5e'],
  hardware: ['chip', chipScene, '#0c2b3a', '#1b3a2e'],
  research: ['neural', neuralScene, '#2a1b5e', '#0c2b3a'],
  talent: ['people', peopleScene, '#3a1b4a', '#0c2b3a'],
  products: ['products', productsScene, '#1b2a5e', '#1b4a3a'],
  finance: ['coins', coinsScene, '#3a2e10', '#1b2a5e'],
  policy: ['shield', shieldScene, '#1b2a5e', '#2e1b3a'],
  rivals: ['orbit', orbitScene, '#0f1a3d', '#3a1b4a'],
  deals: ['handshake', handshakeScene, '#1b3a2e', '#0f1a3d'],
  market: ['donut', donutScene, '#0c2b3a', '#2b1b5e'],
  log: ['timeline', timelineScene, '#1b2a5e', '#0c2b3a'],
  end: ['podium', podiumScene, '#2b1b5e', '#0c2b3a'],
};

function artFor(key, S) {
  const spec = ART_SCENES[key] ?? ART_SCENES.overview;
  return artFrame(`g-${key}`, spec[1](S), spec[2], spec[3]);
}
