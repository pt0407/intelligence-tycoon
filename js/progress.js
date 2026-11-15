const bin = ok => ({ value: ok ? 1 : 0, target: 1, label: ok ? 'done' : 'not yet' });
const num = (value, target, fmt = v => String(Math.round(v))) => ({ value, target, label: `${fmt(value)} of ${fmt(target)}` });

const ACHIEVEMENTS = [
  { id: 'first-product', title: 'Shipped', text: 'Launch your first product', check: s => s.me.products.length >= 1, meter: s => bin(s.me.products.length >= 1) },
  { id: 'first-model', title: 'First model', text: 'Release your first flagship', check: s => !!s.me.flagship, meter: s => bin(!!s.me.flagship) },
  { id: 'first-round', title: 'Funded', text: 'Close your first funding round', check: s => s.me.rounds.length >= 1, meter: s => bin(s.me.rounds.length >= 1) },
  { id: 'capability-50', title: 'Serious model', text: 'Reach capability 50', check: s => flagCapOf(s.me) >= 50, meter: s => num(flagCapOf(s.me), 50) },
  { id: 'unicorn', title: 'Unicorn', text: 'Reach a $1B valuation', check: s => s.me.valuation >= 1000, meter: s => num(s.me.valuation, 1000, money) },
  { id: 'star', title: 'Star hire', text: 'Sign a star researcher', check: s => s.stars.some(st => st.owner === 'me'), meter: s => bin(s.stars.some(st => st.owner === 'me')) },
  { id: 'capability-80', title: 'Frontier', text: 'Reach capability 80', check: s => flagCapOf(s.me) >= 80, meter: s => num(flagCapOf(s.me), 80) },
  { id: 'power-100', title: 'Power broker', text: 'Hold 100 MW of campus capacity', check: s => capacityMW(s.me) >= 100, meter: s => num(Math.min(capacityMW(s.me), 100), 100) },
  { id: 'open-door', title: 'Open door', text: 'Release open weights', check: s => s.stats.openReleases >= 1, meter: s => bin(s.stats.openReleases >= 1) },
  { id: 'decacorn', title: 'Decacorn', text: 'Reach a $10B valuation', check: s => s.me.valuation >= 10000, meter: s => num(s.me.valuation, 10000, money) },
  { id: 'ipo', title: 'Ringing the bell', text: 'List on the exchange', check: s => s.me.public, meter: s => bin(s.me.public) },
  { id: 'rank-one', title: 'Top of the board', text: 'Rank first by valuation', check: s => rankOf(s) === 1, meter: s => bin(rankOf(s) === 1) },
  { id: 'hectocorn', title: 'Hectocorn', text: 'Reach a $100B valuation', check: s => s.me.valuation >= 100000, meter: s => num(s.me.valuation, 100000, money) },
  { id: 'survive-2026', title: 'Still standing', text: 'Reach 2026 solvent', check: s => s.year >= 2026 && s.me.status === 'active', meter: s => num(Math.min(s.year, 2026), 2026) },
];

function checkAchievements(s, news) {
  s.achievements ??= {};
  const got = [];
  for (const a of ACHIEVEMENTS) if (!(a.id in s.achievements) && a.check(s)) {
    s.achievements[a.id] = s.year;
    got.push({ id: a.id, title: a.title, text: a.text });
    news.push(`Achievement unlocked: ${a.title}. ${a.text}.`);
  }
  return got;
}

function nextAchievement(s) {
  const done = s.achievements ?? {};
  const a = ACHIEVEMENTS.find(x => !(x.id in done));
  return a ? { id: a.id, title: a.title, text: a.text, ...a.meter(s) } : null;
}

const ERAS = [[2016, 'The deep learning era'], [2019, 'Capped profits'], [2022, 'The chatbot boom'], [2023, 'The GPU shortage'], [2024, 'Export controls'], [2026, 'The gigawatt era'], [2028, 'The shakeout']];
function eraOf(y) { let name = ERAS[0][1]; for (const [from, n] of ERAS) if (y >= from) name = n; return name; }
function calendarCells(s) {
  const out = [];
  for (let y = START_YEAR; y <= END_YEAR; y++) out.push({ year: y, era: eraOf(y), beat: !!SCRIPTED[y], state: y < s.year ? 'past' : y === s.year ? 'now' : 'future' });
  return out;
}
