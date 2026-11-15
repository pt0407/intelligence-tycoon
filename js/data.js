const START_YEAR = 2016;
const END_YEAR = 2035;
const HISTORY_END = 2026;
const AP_PER_YEAR = 5;
const MW_PER_BLOCK = 100;
const RACK_GPUS = 72;

const TAM = [2000, 3000, 5000, 8000, 14000, 22000, 40000, 90000, 170000, 300000, 480000, 640000, 780000, 900000, 1000000, 1100000, 1200000, 1300000, 1400000, 1500000];

const SEGMENTS = {
  chat: { name: 'Consumer chat', share: 0.2, unlock: 25, launch: 4 },
  api: { name: 'Developer API', share: 0.18, unlock: 35, launch: 3 },
  media: { name: 'Image and video', share: 0.12, unlock: 45, launch: 5 },
  code: { name: 'Coding assistant', share: 0.15, unlock: 50, launch: 5 },
  agents: { name: 'Enterprise agents', share: 0.15, unlock: 65, launch: 9 },
  science: { name: 'Science and drugs', share: 0.08, unlock: 78, launch: 12 },
  robots: { name: 'Robotics', share: 0.12, unlock: 85, launch: 20 },
};

const PLATFORMS = [
  { id: 'p100', vendor: 'NVIDIA', name: 'P100 (Pascal)', year: 2016, tf: 21, rackM: 0.9, kw: 25, mem: 16, src: 'datasheet + est' },
  { id: 'v100', vendor: 'NVIDIA', name: 'V100 (Volta)', year: 2017, tf: 125, rackM: 1.0, kw: 30, mem: 32, src: 'datasheet + est' },
  { id: 'a100', vendor: 'NVIDIA', name: 'A100 (Ampere)', year: 2020, tf: 312, rackM: 1.6, kw: 40, mem: 80, src: 'datasheet + est' },
  { id: 'h100', vendor: 'NVIDIA', name: 'H100 (Hopper)', year: 2022, tf: 989, rackM: 2.6, kw: 70, mem: 80, src: 'datasheet + est' },
  { id: 'h200', vendor: 'NVIDIA', name: 'H200 (Hopper refresh)', year: 2024, tf: 989, rackM: 2.8, kw: 70, mem: 141, src: 'datasheet + est' },
  { id: 'gb200', vendor: 'NVIDIA', name: 'GB200 NVL72 (Blackwell)', year: 2025, tf: 2250, rackM: 3.4, kw: 120, mem: 186, src: 'Bernstein, ipvaluelabs' },
  { id: 'ironwood', vendor: 'Google', name: 'TPU v7 Ironwood', year: 2025, tf: 2307, rackM: 2.6, kw: 100, mem: 192, cloudOnly: true, src: 'Google Cloud docs + est' },
  { id: 'vr', vendor: 'NVIDIA', name: 'Vera Rubin NVL72', year: 2026, tf: 4000, rackM: 4.2, kw: 190, mem: 288, src: 'NVIDIA + est' },
  { id: 'mi455', vendor: 'AMD', name: 'Instinct MI455X (Helios)', year: 2026, tf: 5000, rackM: 3.8, kw: 180, mem: 432, src: 'AMD + est' },
  { id: 'rubin_ultra', vendor: 'NVIDIA', name: 'Rubin Ultra (roadmap)', year: 2027, tf: 8000, rackM: 5.5, kw: 230, mem: 1024, src: 'roadmap est' },
  { id: 'feynman', vendor: 'NVIDIA', name: 'Feynman (roadmap)', year: 2028, tf: 16000, rackM: 7.5, kw: 300, mem: 2048, src: 'roadmap est' },
  { id: 'gen9', vendor: 'NVIDIA', name: 'Gen 9 (projected)', year: 2030, tf: 30000, rackM: 9, kw: 380, mem: 4096, src: 'extrapolated' },
  { id: 'gen10', vendor: 'NVIDIA', name: 'Gen 10 (projected)', year: 2032, tf: 60000, rackM: 11, kw: 450, mem: 8192, src: 'extrapolated' },
];

const REGIONS = [
  { id: 'us', name: 'US Southeast', price: 80, queue: 3, permit: 0.2 },
  { id: 'tx', name: 'Texas Plains', price: 55, queue: 2, permit: 0.1 },
  { id: 'nordic', name: 'Nordic Hydro', price: 45, queue: 4, permit: 0.15 },
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

const RIVAL_TEMPLATES_BASE = [
  {
    id: 'openai', name: 'OpenAI', type: 'Frontier lab (capped-profit)', real: true, founded: 2015, cash: 120, researchers: 25, engineers: 15, sales: 5,
    fleet: { p100: 40 }, dcs: [{ region: 'us', mw: 5 }], data: 70, rep: 80, safety: 65, dist: 30, morale: 70, growth: 0.6, growthRes: 0.1,
    targets: ['chat', 'api', 'code'], mods: { talent: 1.2, noMW: true },
    anchors: {
      val: { 2016: 1500, 2019: 25000, 2021: 20000, 2023: 29000, 2024: 157000, 2025: 500000, 2026: 1250000 },
      rev: { 2022: 200, 2023: 2000, 2024: 6000, 2025: 13100, 2026: 50000 },
    },
  },
  {
    id: 'nvidia', name: 'NVIDIA', type: 'Chipmaker (public)', real: true, founded: 1993, cash: 2000, researchers: 20, engineers: 500, sales: 300,
    fleet: { p100: 50 }, dcs: [], data: 20, rep: 80, safety: 50, dist: 60, morale: 75, growth: 0.25, growthRes: 0.02,
    targets: [], mods: { compute: 0.7, talent: 0.3, lease: 0.5, gov: true, noMW: true, hype: 1.1 },
    anchors: { val: { 2016: 57530, 2017: 117270, 2018: 81420, 2019: 144020, 2020: 323240, 2021: 735270, 2022: 364180, 2023: 1220000, 2024: 3288000, 2025: 4638000, 2026: 3932000 } },
  },
  {
    id: 'anthropic', name: 'Anthropic', type: 'Frontier lab (PBC)', real: true, founded: 2021, cash: 80, researchers: 12, engineers: 6, sales: 2,
    fleet: {}, dcs: [], data: 60, rep: 70, safety: 85, dist: 25, morale: 75, growth: 0.6, growthRes: 0.12,
    targets: ['chat', 'api', 'code', 'agents'], mods: { talent: 1.1, noMW: true },
    anchors: {
      val: { 2021: 4000, 2023: 18400, 2024: 40000, 2025: 183000, 2026: 965000 },
      rev: { 2023: 500, 2024: 1000, 2025: 10000, 2026: 47000 },
    },
  },
  {
    id: 'xai', name: 'xAI', type: 'Frontier lab (part of SpaceX from 2026)', real: true, founded: 2023, cash: 50, researchers: 10, engineers: 20, sales: 2,
    fleet: {}, dcs: [], data: 60, rep: 50, safety: 35, dist: 30, morale: 65, growth: 0.7, growthRes: 0.12,
    targets: ['chat', 'api'], mods: { talent: 1.05, noMW: true },
    anchors: { val: { 2023: 18000, 2024: 24000, 2025: 113000, 2026: 250000 } },
  },
  {
    id: 'mistral', name: 'Mistral AI', type: 'Open-weights lab (EU)', real: true, founded: 2023, cash: 30, researchers: 15, engineers: 15, sales: 4,
    fleet: { a100: 20 }, dcs: [{ region: 'nordic', mw: 10 }], data: 55, rep: 60, safety: 50, dist: 25, morale: 70, growth: 0.5, growthRes: 0.08,
    targets: ['api', 'chat', 'code'], mods: { talent: 1.0, noMW: true, openSource: 2 },
    anchors: { val: { 2023: 2000, 2024: 6200, 2025: 14000, 2026: 24400 }, rev: { 2026: 1000 } },
  },
  {
    id: 'ssi', name: 'Safe Superintelligence', type: 'Research lab (no product planned)', real: true, founded: 2024, cash: 1000, researchers: 20, engineers: 5, sales: 0,
    fleet: { h100: 10 }, dcs: [{ region: 'us', mw: 20 }], data: 60, rep: 60, safety: 90, dist: 5, morale: 70, growth: 0.5, growthRes: 0.1,
    targets: [], mods: { talent: 1.2, noMW: true },
    anchors: { val: { 2024: 5000, 2025: 32000, 2026: 32000 } },
  },
  {
    id: 'tml', name: 'Thinking Machines Lab', type: 'Research lab and platform', real: true, founded: 2025, cash: 2000, researchers: 40, engineers: 20, sales: 3,
    fleet: { h100: 40 }, dcs: [{ region: 'us', mw: 30 }], data: 55, rep: 60, safety: 60, dist: 15, morale: 70, growth: 0.6, growthRes: 0.1,
    targets: ['api', 'code', 'agents'], mods: { talent: 1.15, noMW: true },
    anchors: { val: { 2025: 12000, 2026: 40000 }, rev: { 2026: 200 } },
  },
  {
    id: 'gdm', name: 'Google DeepMind (simulated)', type: 'Big tech AI division', real: false, founded: 2016, cash: 8000, researchers: 150, engineers: 300, sales: 200,
    fleet: { p100: 300 }, dcs: [{ region: 'us', mw: 200 }], data: 90, rep: 80, safety: 70, dist: 90, morale: 65, growth: 0.15, growthRes: 0.02,
    targets: ['chat', 'science'], mods: { talent: 1.2, compute: 0.8, parent: 0.05, gov: true, alloc: 1.2, noMW: true, hype: 0.15 },
  },
  {
    id: 'meta', name: 'Meta AI (simulated)', type: 'Big tech AI division', real: false, founded: 2016, cash: 6000, researchers: 120, engineers: 400, sales: 100,
    fleet: { p100: 250 }, dcs: [{ region: 'us', mw: 150 }], data: 85, rep: 70, safety: 50, dist: 85, morale: 65, growth: 0.15, growthRes: 0.02,
    targets: ['media'], mods: { talent: 1.1, compute: 0.8, openSource: 1.5, alloc: 1.2, noMW: true, hype: 0.15 },
  },
  {
    id: 'msft', name: 'Microsoft AI (simulated)', type: 'Big tech AI division', real: false, founded: 2016, cash: 10000, researchers: 80, engineers: 500, sales: 500,
    fleet: { p100: 300 }, dcs: [{ region: 'us', mw: 150 }], data: 85, rep: 75, safety: 55, dist: 90, morale: 60, growth: 0.15, growthRes: 0.02,
    targets: ['api', 'code'], mods: { talent: 1.0, compute: 0.8, parent: 0.05, gov: true, alloc: 1.2, noMW: true, hype: 0.15 },
  },
];

const RIVAL_EXTRA = [
  {
    id: 'deepseek', name: 'DeepSeek', type: 'Open-weights lab (China)', real: true, founded: 2023, cash: 500, researchers: 60, engineers: 40, sales: 5,
    fleet: { h100: 40 }, dcs: [{ region: 'nordic', mw: 30 }], data: 60, rep: 70, safety: 45, dist: 40, morale: 75, growth: 0.6, growthRes: 0.1,
    targets: ['api', 'chat', 'code'], mods: { talent: 1.1, noMW: true, openSource: 2 },
    anchors: { val: { 2026: 89000 } },
  },
  {
    id: 'moonshot', name: 'Moonshot AI (Kimi)', type: 'Frontier lab (China)', real: true, founded: 2023, cash: 300, researchers: 40, engineers: 30, sales: 3,
    fleet: { h100: 20 }, dcs: [], data: 55, rep: 60, safety: 45, dist: 35, morale: 70, growth: 0.5, growthRes: 0.1,
    targets: ['chat', 'api'], mods: { talent: 1.05, noMW: true },
    anchors: { val: { 2025: 4300, 2026: 35000 } },
  },
  {
    id: 'zhipu', name: 'Zhipu AI (Z.ai)', type: 'Frontier lab (China, listed in Hong Kong 2026)', real: true, founded: 2019, cash: 200, researchers: 50, engineers: 40, sales: 5,
    fleet: { a100: 30 }, dcs: [], data: 55, rep: 60, safety: 50, dist: 30, morale: 70, growth: 0.5, growthRes: 0.08,
    targets: ['chat', 'api', 'code'], mods: { talent: 1.0, noMW: true },
    anchors: { val: { 2026: 7300 } },
  },
  {
    id: 'cursor', name: 'Cursor (Anysphere)', type: 'AI coding tools', real: true, founded: 2022, cash: 200, researchers: 30, engineers: 80, sales: 20,
    fleet: {}, dcs: [], data: 60, rep: 65, safety: 40, dist: 50, morale: 75, growth: 0.5, growthRes: 0.1,
    targets: ['code', 'agents'], mods: { talent: 1.0, noMW: true, hype: 1.1 },
    anchors: { val: { 2025: 29300, 2026: 60000 }, rev: { 2026: 2000 } },
  },
  {
    id: 'perplexity', name: 'Perplexity', type: 'AI answer engine and agents', real: true, founded: 2022, cash: 100, researchers: 25, engineers: 40, sales: 15,
    fleet: {}, dcs: [], data: 55, rep: 55, safety: 45, dist: 45, morale: 70, growth: 0.4, growthRes: 0.08,
    targets: ['chat', 'agents'], mods: { talent: 1.0, noMW: true },
    anchors: { val: { 2024: 9000, 2025: 20000, 2026: 30000 }, rev: { 2025: 200, 2026: 750 } },
  },
  {
    id: 'cohere', name: 'Cohere', type: 'Enterprise and sovereign AI (Canada)', real: true, founded: 2019, cash: 300, researchers: 40, engineers: 50, sales: 40,
    fleet: { a100: 60 }, dcs: [{ region: 'nordic', mw: 20 }], data: 60, rep: 60, safety: 55, dist: 30, morale: 70, growth: 0.4, growthRes: 0.06,
    targets: ['api', 'agents'], mods: { talent: 1.0, noMW: true },
    anchors: { val: { 2026: 26000 } },
  },
  {
    id: 'coreweave', name: 'CoreWeave', type: 'Neocloud (GPU cloud, public)', real: true, founded: 2017, public: true, ipoYear: 2025, cash: 1500, researchers: 5, engineers: 600, sales: 100,
    fleet: {}, leased: { h100: 3000, gb200: 2000 }, dcs: [{ region: 'us', mw: 300 }, { region: 'tx', mw: 200 }], data: 20, rep: 70, safety: 40, dist: 60, morale: 65, growth: 0.6, growthRes: 0.02,
    targets: [], mods: { talent: 0.3, lease: 7, noMW: true },
    anchors: { val: { 2026: 29300 }, rev: { 2025: 5131, 2026: 13150 } },
  },
];

const RIVAL_TEMPLATES = [...RIVAL_TEMPLATES_BASE, ...RIVAL_EXTRA];

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
