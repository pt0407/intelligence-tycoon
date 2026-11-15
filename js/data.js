const START_YEAR = 2016;
const END_YEAR = 2035;
const HISTORY_END = 2026;
const AP_PER_YEAR = 5;
const MW_PER_BLOCK = 100;
const RACK_GPUS = REAL.hardware.rackGpus;

const TAM = REAL.market.tamUsdM;

const SEGMENTS = {
  chat: { name: 'Consumer chat', share: 0.2, unlock: 25, launch: 4 },
  api: { name: 'Developer API', share: 0.18, unlock: 35, launch: 3 },
  media: { name: 'Image and video', share: 0.12, unlock: 45, launch: 5 },
  code: { name: 'Coding assistant', share: 0.15, unlock: 50, launch: 5 },
  agents: { name: 'Enterprise agents', share: 0.15, unlock: 65, launch: 9 },
  science: { name: 'Science and drugs', share: 0.08, unlock: 78, launch: 12 },
  robots: { name: 'Robotics', share: 0.12, unlock: 85, launch: 20 },
};

const SOURCE_NAME = Object.fromEntries(REAL.sources.map(s => [s.id, s.publisher]));
const PLATFORMS = REAL.hardware.platforms.map(p => ({
  id: p.id, vendor: p.vendor, name: p.name, year: p.year, tf: p.tf, rackM: p.rackM, kw: p.kw, mem: p.mem,
  ...(p.cloudOnly ? { cloudOnly: true } : {}), status: p.status, src: SOURCE_NAME[p.source] ?? p.source,
}));

const REGIONS = REAL.power.regions.map(r => ({
  id: r.id, name: r.name, price: r.usdPerMWh, status: r.status, queue: REAL.power.queueYears[r.id], permit: REAL.power.permit[r.id],
}));

const SCENARIOS = {
  base: { name: 'Base history', blurb: 'The real timeline as far as public data goes, then the simulation.' },
  exportBan: { name: 'Export ban', blurb: 'Newest NVIDIA chips are restricted from 2026 for everyone except government partners.' },
  slowdown: { name: 'AI slowdown', blurb: 'Demand cools from 2026. Hype drops, algorithms stall, the index falls by a fifth.' },
  powerCrunch: { name: 'Power crunch', blurb: 'Grids tighten: energy prices spike and campus queues grow by two years.' },
  fastRoadmap: { name: 'Fast roadmap', blurb: 'Algorithmic progress runs about 30 percent faster from 2024 on.' },
};

const ROUNDS = [
  { name: 'Seed', pct: 0.1, need: () => true, ask: 'nothing' },
  { name: 'Series A', pct: 0.15, need: c => flagCapOf(c) >= 20 || c.products.length > 0, ask: 'a flagship at capability 20 or a live product' },
  { name: 'Series B', pct: 0.12, need: c => c.revenue >= 20, ask: '$20M revenue' },
  { name: 'Series C', pct: 0.1, need: c => c.revenue >= 300 && c.execs.cfo, ask: '$300M revenue and a CFO' },
  { name: 'Series D', pct: 0.08, need: c => c.revenue >= 2000 && c.execs.cfo, ask: '$2B revenue and a CFO' },
];

const TRAIN = {
  small: { name: 'Small run', share: 0.3 },
  medium: { name: 'Medium run', share: 0.6 },
  frontier: { name: 'Frontier run', share: 1 },
};

const OFFICES = [
  { name: 'Garage', cost: 0, rent: 0, teamMult: 1 },
  { name: 'Campus floor', cost: 4, rent: 0.3, teamMult: 1.1 },
  { name: 'Lab floor', cost: 10, rent: 0.8, teamMult: 1.25 },
  { name: 'Research park', cost: 25, rent: 2, teamMult: 1.4 },
  { name: 'Global HQ', cost: 60, rent: 5, teamMult: 1.6 },
];

const PARTNER_TIERS = {
  starter: { name: 'Starter', racks: 20, share: 0.08 },
  growth: { name: 'Growth', racks: 60, share: 0.15 },
  anchor: { name: 'Anchor', racks: 150, share: 0.22 },
};

const DEFAULT_MODS = { ap: 0, talent: 1, compute: 1, burn: 1, launch: 1, hype: 1, dist: 1, hire: 1, openSource: 1, revenue: 1, lease: 0, parent: 0, grants: 0, veto: false, gov: false, alloc: 1, noMW: false, unlock: {} };

const PATHS = {
  lab: {
    name: 'Academic Lab',
    blurb: 'A university spinout. Brilliant people, thin wallet, a rack of old P100s in the basement.',
    pros: ['Research multiplier from a strong team', 'Papers and open research build reputation'],
    cons: ['Slow to ship products', 'Lower valuation multiple', 'Almost no compute'],
    start: { cash: 10, researchers: 18, engineers: 3, sales: 0, fleet: { p100: 2 }, dcs: [{ region: 'us', mw: 5 }], data: 55, rep: 60, safety: 70, dist: 10, morale: 65, stake: 0.6 },
    mods: { talent: 1.3, launch: 1.3, hype: 0.9, openSource: 1.6, hire: 0.8 },
    goals: [
      { text: 'Train a flagship with capability 60 or higher', check: s => flagCapOf(s.me) >= 60 },
      { text: 'Publish 5 research papers', check: s => s.stats.papers >= 5 },
      { text: 'Open-source a flagship', check: s => s.stats.openReleases >= 1 },
    ],
  },
  garage: {
    name: 'Garage Startup',
    blurb: 'Two founders, a cloud credit card, and a pitch deck that gets you meetings.',
    pros: ['Cheap launches', 'Investors love the hype', 'One extra action per year'],
    cons: ['Weak talent', 'No compute of their own', 'Tiny runway'],
    start: { cash: 5, researchers: 3, engineers: 6, sales: 0, fleet: {}, dcs: [], data: 20, rep: 15, safety: 40, dist: 5, morale: 70, stake: 0.8 },
    mods: { ap: 1, launch: 0.6, hype: 1.2, talent: 0.8, burn: 0.6 },
    goals: [
      { text: 'Launch 2 products', check: s => s.me.products.length >= 2 },
      { text: 'Reach a $1B valuation', check: s => s.me.valuation >= 1000 },
      { text: 'Close 3 funding rounds', check: s => s.me.rounds.length >= 3 },
    ],
  },
  bigtech: {
    name: 'Big Tech Skunkworks',
    blurb: 'A secret team inside a cloud giant. The parent funds the datacenters. Meetings are unlimited.',
    pros: ['Huge allocation of scarce chips', 'Huge distribution', 'Deep bench of engineers'],
    cons: ['Parent takes 15% of revenue', 'Parent can veto open weights', 'Slow decisions'],
    start: { cash: 3000, researchers: 35, engineers: 40, sales: 10, fleet: { p100: 300 }, dcs: [{ region: 'us', mw: 60 }, { region: 'tx', mw: 40 }], data: 80, rep: 70, safety: 45, dist: 60, morale: 60, stake: 0.2 },
    mods: { compute: 0.6, dist: 1.5, hype: 1.1, burn: 1.2, parent: 0.15, veto: true, gov: true, alloc: 2.5 },
    goals: [
      { text: 'Ship a chat product by 2020', check: s => (s.stats.launched.chat ?? 9999) <= 2020 },
      { text: 'Ship 4 products', check: s => s.me.products.length >= 4 },
      { text: 'Pass the safety review board (75 safety)', check: s => s.me.safety >= 75 },
    ],
  },
  open: {
    name: 'Open-Source Collective',
    blurb: 'Volunteers, donors, and a Discord with 40,000 members. Your model is everywhere, your revenue is not.',
    pros: ['Massive goodwill', 'Open releases boost reputation and distribution', 'Donations every year'],
    cons: ['Tiny cash pile', 'Revenue penalty on closed products', 'Thin talent budget'],
    start: { cash: 1, researchers: 12, engineers: 8, sales: 0, fleet: { p100: 4 }, dcs: [{ region: 'nordic', mw: 2 }], data: 45, rep: 50, safety: 55, dist: 35, morale: 70, stake: 0.9 },
    mods: { openSource: 2.5, revenue: 0.7, hire: 0.6, hype: 0.8, grants: 3, burn: 0.6 },
    goals: [
      { text: 'Open-source 2 models', check: s => s.stats.openReleases >= 2 },
      { text: 'Reach 70 reputation', check: s => s.me.rep >= 70 },
      { text: 'Make a profit in one year', check: s => s.stats.profitYears >= 1 },
    ],
  },
  hardware: {
    name: 'Chip and Datacenter',
    blurb: 'You rent out the shovels. Everyone else is panning for gold, so you get paid either way.',
    pros: ['Leases racks to others for revenue', 'Owns megawatts early', 'Domestic chip access'],
    cons: ['Weak research bench', 'Expensive launches', 'Low model hype'],
    start: { cash: 800, researchers: 6, engineers: 25, sales: 10, fleet: { p100: 400, v100: 200 }, dcs: [{ region: 'us', mw: 200 }, { region: 'tx', mw: 150 }, { region: 'nordic', mw: 100 }], data: 15, rep: 25, safety: 30, dist: 10, morale: 60, stake: 0.7 },
    mods: { compute: 0.7, talent: 0.6, launch: 1.3, hype: 0.9, lease: 0.5, gov: true, alloc: 1.5 },
    goals: [
      { text: 'Own 2,000 racks', check: s => totalRacksOf(s.me, 'owned') >= 2000 },
      { text: 'Reach $10B revenue in one year', check: s => s.me.revenue >= 10000 },
      { text: 'Ship a model product', check: s => s.me.products.length >= 1 },
    ],
  },
  robotics: {
    name: 'Robotics Moonshot',
    blurb: 'Software for machines that need hardware, budgets, and patience.',
    pros: ['Robotics unlocks early', 'Strong safety culture', 'Loyal team'],
    cons: ['Heavy burn', 'Chat and API markets are slow to reach', 'Long hardware cycles'],
    start: { cash: 40, researchers: 15, engineers: 18, sales: 2, fleet: { p100: 40 }, dcs: [{ region: 'us', mw: 10 }], data: 35, rep: 35, safety: 60, dist: 8, morale: 65, stake: 0.75 },
    mods: { burn: 1.3, unlock: { robots: 70 } },
    goals: [
      { text: 'Launch a robotics product', check: s => s.me.products.includes('robots') },
      { text: 'Train a flagship with capability 80 or higher', check: s => flagCapOf(s.me) >= 80 },
      { text: 'Reach a $5B valuation', check: s => s.me.valuation >= 5000 },
    ],
  },
};

const RIVAL_TEMPLATES = REAL.companies.map(c => ({
  id: c.id, name: c.name, type: c.type, real: c.real, founded: c.founded, public: !!c.public, ipoYear: c.ipoYear ?? 0,
  ...c.start,
  leased: c.start.leased ?? {},
  anchors: Object.keys(c.val).length ? { val: c.val, rev: c.rev } : null,
  realRounds: c.rounds ?? [],
  backstory: c.backstory,
}));


const STARS = [
  { id: 's1', name: 'Ines Varga', ability: 1.6, owner: 'openai' },
  { id: 's2', name: 'Kenji Morrow', ability: 1.4, owner: 'openai' },
  { id: 's3', name: 'Amara Osei', ability: 1.5, owner: 'gdm' },
  { id: 's4', name: 'Lukas Brandt', ability: 1.3, owner: 'anthropic' },
  { id: 's5', name: 'Priya Sundaram', ability: 1.7, owner: 'anthropic' },
  { id: 's6', name: 'Tomas Ruiz', ability: 1.2, owner: null },
  { id: 's7', name: 'Hana Lindqvist', ability: 1.4, owner: null },
  { id: 's8', name: 'Ravi Mehta', ability: 1.3, owner: null },
];

const NAME_PREFIXES = ['Vector', 'Lumen', 'Atlas', 'Bramble', 'Corvid', 'Tidal', 'Hollow', 'Nova', 'Quill', 'Sable', 'Fathom', 'Ember'];
const NAME_SUFFIXES = ['AI', 'Labs', 'Systems', 'Works', 'Dynamics', 'Robotics', 'Health', 'Studio'];
const MODEL_FAMILIES = ['Atlas', 'Orion', 'Vega', 'Helix', 'Aria', 'Sol', 'Kestrel', 'Lyra'];
