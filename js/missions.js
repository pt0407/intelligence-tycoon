const MISSION_POOL = [
  { id: 'deal', text: 'Sign a deal', need: 'deals', n: 1 },
  { id: 'hire', text: 'Recruit 10 people', need: 'hires', n: 10 },
  { id: 'launch', text: 'Launch a product', need: 'launches', n: 1 },
  { id: 'train', text: 'Start a training run', need: 'trains', n: 1 },
  { id: 'stake', text: 'Buy shares in a rival', need: 'stakes', n: 1 },
  { id: 'raise', text: 'Close a funding round', need: 'raises', n: 1 },
  { id: 'paper', text: 'Publish a research paper', need: 'papers', n: 1 },
  { id: 'post', text: 'Run a post-training pass', need: 'posts', n: 1 },
];

const COUNTED = {
  hireRes: ['hires', 5], hireEng: ['hires', 5], train: ['trains', 1], launch: ['launches', 1], stake: ['stakes', 1],
  bidLow: ['deals', 1], bidFair: ['deals', 1], bidHigh: ['deals', 1], acquihire: ['deals', 1], buycompute: ['deals', 1],
  raise: ['raises', 1], paper: ['papers', 1], post: ['posts', 1], hireCand: ['hires', 1],
};

function countAction(s, key) {
  const hit = COUNTED[key.split(':')[0]];
  if (hit) s.yr[hit[0]] = (s.yr[hit[0]] ?? 0) + hit[1];
}

function rewardOf(s) { return Math.max(5, Math.round(s.me.valuation * 0.02)); }

function assignMissions(s) {
  const pool = [...MISSION_POOL];
  s.missions = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const [m] = pool.splice(Math.floor(rand(s) * pool.length), 1);
    s.missions.push({ id: m.id, text: m.text, need: m.need, n: m.n, done: false, reward: rewardOf(s) });
  }
}

function evalMissions(s, news) {
  const done = [];
  for (const m of s.missions ?? []) {
    if (m.done || (s.yr[m.need] ?? 0) < m.n) continue;
    m.done = true;
    s.me.cash += m.reward;
    done.push(m);
    news.push(`Mission complete: ${m.text}. +${money(m.reward)}.`);
  }
  return done;
}

function resetYear(s) { s.yr = {}; }
