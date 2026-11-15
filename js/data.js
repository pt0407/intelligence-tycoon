const START_YEAR = 2016;
const END_YEAR = 2035;
const AP_PER_YEAR = 5;
const DC_BLOCK_MW = 50;
const DC_BLOCK_COST = 45;

const TAM = [2000, 2600, 3800, 5800, 8000, 12000, 18000, 28000, 42000, 60000, 80000, 100000, 125000, 150000, 180000, 215000, 250000, 290000, 330000, 370000];

const SEGMENTS = {
  chat: { name: 'Consumer chat', share: 0.2, unlock: 25, launch: 4 },
  api: { name: 'Developer API', share: 0.18, unlock: 35, launch: 3 },
  media: { name: 'Image and video', share: 0.12, unlock: 45, launch: 5 },
  code: { name: 'Coding assistant', share: 0.15, unlock: 50, launch: 5 },
  agents: { name: 'Enterprise agents', share: 0.15, unlock: 65, launch: 9 },
  science: { name: 'Science and drugs', share: 0.08, unlock: 78, launch: 12 },
  robots: { name: 'Robotics', share: 0.12, unlock: 85, launch: 20 },
};

const GPU_GENS = [
  { id: 1, name: 'Gen 1', year: 2016, perf: 1, price: 12 },
  { id: 2, name: 'Gen 2', year: 2018, perf: 2.5, price: 14 },
  { id: 3, name: 'Gen 3', year: 2020, perf: 6, price: 16 },
  { id: 4, name: 'Gen 4', year: 2022, perf: 15, price: 18 },
  { id: 5, name: 'Gen 5', year: 2024, perf: 35, price: 21 },
  { id: 6, name: 'Gen 6', year: 2026, perf: 80, price: 24 },
  { id: 7, name: 'Gen 7', year: 2029, perf: 180, price: 28 },
  { id: 8, name: 'Gen 8', year: 2032, perf: 400, price: 32 },
];

const REGIONS = [
  { id: 'us', name: 'US Southeast', power: 0.09, queue: 2, permit: 0.2 },
  { id: 'tx', name: 'Texas Plains', power: 0.06, queue: 1, permit: 0.1 },
  { id: 'nordic', name: 'Nordic Hydro', power: 0.04, queue: 3, permit: 0.15 },
];

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

const DEFAULT_MODS = { ap: 0, talent: 1, compute: 1, burn: 1, launch: 1, hype: 1, dist: 1, hire: 1, openSource: 1, revenue: 1, lease: 0, parent: 0, grants: 0, veto: false, gov: false, alloc: 1, noMW: false, unlock: {} };

const PATHS = {
  lab: {
    name: 'Academic Lab',
    blurb: 'A university spinout. Brilliant people, thin wallet, lots of papers.',
    pros: ['Research multiplier from a strong team', 'Papers and open research build reputation'],
    cons: ['Slow to ship products', 'Lower valuation multiple', 'Few clusters to train on'],
    start: { cash: 6, researchers: 18, engineers: 3, sales: 0, fleet: { 1: 4 }, dcs: ['us'], data: 55, rep: 60, safety: 70, dist: 10, morale: 65, stake: 0.6 },
    mods: { talent: 1.3, launch: 1.3, hype: 0.9, openSource: 1.6, hire: 0.8 },
    goals: [
      { text: 'Train a flagship with capability 60 or higher', check: s => flagCapOf(s.me) >= 60 },
      { text: 'Publish 5 research papers', check: s => s.stats.papers >= 5 },
      { text: 'Open-source a flagship', check: s => s.stats.openReleases >= 1 },
    ],
  },
  garage: {
    name: 'Garage Startup',
    blurb: 'Two founders, one rented GPU, and a pitch deck that gets you meetings.',
    pros: ['Cheap launches', 'Investors love the hype', 'One extra action per year'],
    cons: ['Weak talent', 'No compute of their own', 'Tiny runway'],
    start: { cash: 6, researchers: 3, engineers: 6, sales: 0, fleet: {}, dcs: [], data: 20, rep: 15, safety: 40, dist: 5, morale: 70, stake: 0.8 },
    mods: { ap: 1, launch: 0.6, hype: 1.2, talent: 0.8, burn: 0.6 },
    goals: [
      { text: 'Launch 2 products', check: s => s.me.products.length >= 2 },
      { text: 'Reach a $1B valuation', check: s => s.me.valuation >= 1000 },
      { text: 'Close 3 funding rounds', check: s => s.me.rounds.length >= 3 },
    ],
  },
  bigtech: {
    name: 'Big Tech Skunkworks',
    blurb: 'A secret team inside a cloud giant. Unlimited budget, unlimited meetings.',
    pros: ['Huge allocation of scarce chips', 'Huge distribution', 'Deep bench of engineers'],
    cons: ['Parent takes 15% of revenue', 'Parent can veto open weights', 'Slow decisions'],
    start: { cash: 90, researchers: 35, engineers: 40, sales: 10, fleet: { 1: 20, 3: 10 }, dcs: ['us', 'us', 'tx', 'tx'], data: 80, rep: 70, safety: 45, dist: 60, morale: 60, stake: 0.2 },
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
    start: { cash: 3, researchers: 12, engineers: 8, sales: 0, fleet: { 1: 2 }, dcs: ['nordic'], data: 45, rep: 50, safety: 55, dist: 35, morale: 70, stake: 0.9 },
    mods: { openSource: 2.5, revenue: 0.7, hire: 0.6, hype: 0.8, grants: 3, burn: 0.6 },
    goals: [
      { text: 'Open-source 2 models', check: s => s.stats.openReleases >= 2 },
      { text: 'Reach 70 reputation', check: s => s.me.rep >= 70 },
      { text: 'Make a profit in one year', check: s => s.stats.profitYears >= 1 },
    ],
  },
  hardware: {
    name: 'Chip and Datacenter',
    blurb: 'You sell the shovels. Everyone else is panning for gold, so you get paid either way.',
    pros: ['Leases clusters to others for revenue', 'Owns data center capacity early', 'Domestic chip access'],
    cons: ['Weak research bench', 'Expensive launches', 'Low model hype'],
    start: { cash: 60, researchers: 6, engineers: 25, sales: 10, fleet: { 1: 40, 2: 20 }, dcs: ['us', 'tx', 'nordic'], data: 15, rep: 25, safety: 30, dist: 10, morale: 60, stake: 0.7 },
    mods: { compute: 0.7, talent: 0.6, launch: 1.3, hype: 0.9, lease: 0.5, gov: true, alloc: 1.5 },
    goals: [
      { text: 'Own 200 clusters', check: s => totalClustersOf(s.me) >= 200 },
      { text: 'Reach $10B revenue in one year', check: s => s.me.revenue >= 10000 },
      { text: 'Ship a model product', check: s => s.me.products.length >= 1 },
    ],
  },
  robotics: {
    name: 'Robotics Moonshot',
    blurb: 'Software for machines that need hardware, budgets, and patience.',
    pros: ['Robotics unlocks early', 'Strong safety culture', 'Loyal team'],
    cons: ['Heavy burn', 'Chat and API markets are slow to reach', 'Long hardware cycles'],
    start: { cash: 30, researchers: 15, engineers: 18, sales: 2, fleet: { 1: 10 }, dcs: ['us'], data: 35, rep: 35, safety: 60, dist: 8, morale: 65, stake: 0.75 },
    mods: { burn: 1.3, unlock: { robots: 70 } },
    goals: [
      { text: 'Launch a robotics product', check: s => s.me.products.includes('robots') },
      { text: 'Train a flagship with capability 80 or higher', check: s => flagCapOf(s.me) >= 80 },
      { text: 'Reach a $5B valuation', check: s => s.me.valuation >= 5000 },
    ],
  },
};

const RIVAL_TEMPLATES = [
  { id: 'meridian', name: 'Meridian Research', type: 'Nonprofit lab turned capped-profit', founded: 2015, cash: 400, researchers: 40, engineers: 40, sales: 5, fleet: { 1: 15, 2: 10 }, data: 70, rep: 85, safety: 60, dist: 40, morale: 70, growth: 0.5, growthRes: 0.08, targets: ['chat', 'api', 'agents', 'science'], mods: { talent: 1.15, noMW: true } },
  { id: 'nimbus', name: 'Nimbus Cloud AI', type: 'Big tech division', founded: 2016, cash: 5000, researchers: 60, engineers: 200, sales: 80, fleet: { 1: 20, 2: 20, 3: 10 }, data: 90, rep: 75, safety: 50, dist: 90, morale: 60, growth: 0.4, growthRes: 0.03, targets: ['chat', 'api', 'code', 'media', 'agents'], mods: { compute: 0.8, parent: 0.05, gov: true, alloc: 2.5, noMW: true } },
  { id: 'ferro', name: 'Ferro Silicon', type: 'Chipmaker', founded: 2016, cash: 2000, researchers: 20, engineers: 300, sales: 60, fleet: { 1: 40, 2: 30 }, data: 20, rep: 55, safety: 40, dist: 30, morale: 60, growth: 0.25, growthRes: 0.02, targets: [], mods: { compute: 0.7, talent: 0.3, lease: 0.5, gov: true, noMW: true } },
  { id: 'kestrel', name: 'Kestrel Search', type: 'Search startup', founded: 2017, cash: 60, researchers: 15, engineers: 15, sales: 10, fleet: { 1: 8 }, data: 40, rep: 40, safety: 35, dist: 45, morale: 60, growth: 0.4, growthRes: 0.1, targets: ['chat', 'api'], mods: { talent: 0.95, noMW: true } },
  { id: 'dendra', name: 'Dendra Robotics', type: 'Robotics startup', founded: 2018, cash: 120, researchers: 25, engineers: 40, sales: 4, fleet: { 1: 15 }, data: 40, rep: 35, safety: 55, dist: 15, morale: 65, growth: 0.3, growthRes: 0.06, targets: ['robots'], mods: { talent: 0.95, noMW: true } },
  { id: 'ledger', name: 'Ledger Health', type: 'Science startup', founded: 2019, cash: 50, researchers: 15, engineers: 10, sales: 4, fleet: { 1: 10 }, data: 60, rep: 45, safety: 50, dist: 15, morale: 60, growth: 0.35, growthRes: 0.08, targets: ['science', 'api'], mods: { talent: 0.9, noMW: true } },
  { id: 'quorum', name: 'Quorum Labs', type: 'Open-weights lab', founded: 2019, cash: 150, researchers: 30, engineers: 25, sales: 10, fleet: { 1: 20 }, data: 60, rep: 70, safety: 45, dist: 35, morale: 70, growth: 0.3, growthRes: 0.08, targets: ['api', 'chat', 'code'], mods: { talent: 1.0, noMW: true } },
  { id: 'halcyon', name: 'Halcyon AI', type: 'Safety-first lab', founded: 2021, cash: 800, researchers: 60, engineers: 40, sales: 15, fleet: { 1: 40 }, data: 65, rep: 70, safety: 90, dist: 30, morale: 75, growth: 0.45, growthRes: 0.08, targets: ['api', 'chat', 'agents'], mods: { talent: 1.05, noMW: true } },
  { id: 'pixelmind', name: 'Pixelmind', type: 'Media startup', founded: 2021, cash: 120, researchers: 20, engineers: 20, sales: 6, fleet: { 1: 15 }, data: 70, rep: 40, safety: 40, dist: 30, morale: 65, growth: 0.45, growthRes: 0.1, targets: ['media'], mods: { talent: 1.1, noMW: true } },
  { id: 'stackforge', name: 'Stackforge', type: 'Coding tools startup', founded: 2022, cash: 150, researchers: 15, engineers: 30, sales: 8, fleet: { 1: 15 }, data: 60, rep: 40, safety: 40, dist: 25, morale: 65, growth: 0.5, growthRes: 0.1, targets: ['code', 'agents'], mods: { talent: 1.1, noMW: true } },
];

const STARS = [
  { id: 's1', name: 'Ines Varga', ability: 1.6, owner: 'meridian' },
  { id: 's2', name: 'Kenji Morrow', ability: 1.4, owner: 'meridian' },
  { id: 's3', name: 'Amara Osei', ability: 1.5, owner: 'nimbus' },
  { id: 's4', name: 'Lukas Brandt', ability: 1.3, owner: 'halcyon' },
  { id: 's5', name: 'Priya Sundaram', ability: 1.7, owner: 'halcyon' },
  { id: 's6', name: 'Tomas Ruiz', ability: 1.2, owner: null },
  { id: 's7', name: 'Hana Lindqvist', ability: 1.4, owner: null },
  { id: 's8', name: 'Ravi Mehta', ability: 1.3, owner: null },
];

const NAME_PREFIXES = ['Vector', 'Lumen', 'Atlas', 'Bramble', 'Corvid', 'Tidal', 'Hollow', 'Nova', 'Quill', 'Sable', 'Fathom', 'Ember'];
const NAME_SUFFIXES = ['AI', 'Labs', 'Systems', 'Works', 'Dynamics', 'Robotics', 'Health', 'Studio'];
const MODEL_FAMILIES = ['Atlas', 'Orion', 'Vega', 'Helix', 'Aria', 'Sol', 'Kestrel', 'Lyra'];
