const cpOf = (s, m) => clusterPrice(s.year, s.w, m ?? s.me.mods.compute);
const regionById = id => REGIONS.find(r => r.id === id);
const TIER_TEXT = { free: 'More users, half the revenue per user.', standard: 'Balanced pricing.', premium: 'Fewer users, 1.6x revenue per user.' };

const ACTIONS = [
  { id: 'hireRes', group: 'Talent', name: () => 'Recruit 5 researchers', desc: 'Fee $0.4M each. Salary $0.35M/yr each.', cost: s => 2 * s.me.mods.hire, run: s => { s.me.researchers += 5; return 'Recruited 5 researchers.'; } },
  { id: 'hireEng', group: 'Talent', name: () => 'Hire 5 engineers', desc: 'Fee $0.1M each. Salary $0.2M/yr each. Engineers add product polish.', cost: s => 0.5 * s.me.mods.hire, run: s => { s.me.engineers += 5; return 'Hired 5 engineers.'; } },
  { id: 'hireSales', group: 'Talent', name: () => 'Hire 5 sales reps', desc: 'Enterprise deals scale with reps and flagship quality.', cost: s => 0.5 * s.me.mods.hire, run: s => { s.me.sales += 5; return 'Hired 5 sales reps.'; } },
  { id: 'payRaise', group: 'Talent', name: () => 'Company-wide pay raise', desc: 'Morale +6. Costs roughly a tenth of a year of your team.', cost: s => 0.1 * (s.me.researchers + s.me.engineers), run: s => { bump(s.me, 'morale', 6); return 'Pay raise rolled out. Morale is up.'; } },
  { id: 'equity', group: 'Talent', name: () => 'Equity refresh', desc: 'Morale +10. Dilutes your stake by 1 percent.', cost: () => 0, check: s => (s.me.stake < 0.1 ? 'Too little stake left to dilute' : null), run: s => { bump(s.me, 'morale', 10); s.me.stake *= 0.99; return 'Equity refresh granted. Your stake shrinks a little.'; } },
  {
    id: 'star', each: 'star', group: 'Talent', name: (s, id) => { const st = s.stars.find(x => x.id === id); return st.owner ? `Poach ${st.name}` : `Recruit ${st.name}`; },
    desc: (s, id) => { const st = s.stars.find(x => x.id === id); return `Star researcher, ability ${st.ability.toFixed(1)}. ${st.owner ? `Under contract with ${companyById(s, st.owner).name}.` : 'Free agent.'}`; },
    cost: (s, id) => (s.stars.find(x => x.id === id).owner ? 40 : 20) * s.me.mods.hire,
    check: (s, id) => (s.stars.find(x => x.id === id).owner === 'me' ? 'Already on your team' : null),
    run: (s, id) => { const st = s.stars.find(x => x.id === id); st.owner = 'me'; return `Signed ${st.name}.`; },
  },
  { id: 'cfo', group: 'Talent', name: () => 'Hire a CFO', desc: 'Needed for IPOs and later funding rounds.', cost: () => 1.5, check: s => (s.me.execs.cfo ? 'Already have a CFO' : null), run: s => { s.me.execs.cfo = true; return 'Hired a CFO.'; } },
  { id: 'cro', group: 'Talent', name: () => 'Hire a Chief Revenue Officer', desc: 'Lifts enterprise revenue by 20 percent.', cost: () => 1.2, check: s => (s.me.execs.cro ? 'Already have a CRO' : null), run: s => { s.me.execs.cro = true; return 'Hired a Chief Revenue Officer.'; } },

  {
    id: 'buy', group: 'Compute', name: s => `Buy 5 ${curGen(s.year).name} clusters ($${(5 * cpOf(s)).toFixed(0)}M)`, desc: 'Upfront capex. Limited by chip allocation and data center megawatts.', cost: s => 5 * cpOf(s),
    check: s => (exportBlocked(s, s.me) ? 'Export controls block this chip generation' : allocLeft(s.me, s.w) < 5 ? `Chip allocation used up (${allocLeft(s.me, s.w)} left)` : capacityMW(s.me) - totalClustersOf(s.me) < 5 ? 'Needs data center capacity' : null),
    run: s => { const g = curGen(s.year).id; s.me.fleet[g] = (s.me.fleet[g] ?? 0) + 5; s.me.boughtYear += 5; return `Bought 5 ${curGen(s.year).name} clusters.`; },
  },
  { id: 'rent', group: 'Compute', name: () => 'Rent 5 clusters from the cloud', desc: 'No upfront cost. Pays a premium every year, dearer during shortages.', cost: () => 0, check: s => (exportBlocked(s, s.me) ? 'Export controls block this chip generation' : null), run: s => { s.me.rentedClusters += 5; return 'Rented 5 clusters from the cloud.'; } },
  {
    id: 'build', each: 'region', group: 'Compute', name: (s, id) => `Build ${regionById(id).name} data center`, desc: (s, id) => `+${DC_BLOCK_MW} MW. Grid queue ${queueYears(s, regionById(id))} years. Power price index ${(regionById(id).power / 0.06).toFixed(1)}x.`,
    cost: (s, id) => dcCost(regionById(id), s.w), check: s => (s.me.pendingDC.length >= 3 ? 'Three sites already in progress' : null),
    run: (s, id) => { s.me.pendingDC.push({ ready: s.year + queueYears(s, regionById(id)), region: id }); return `Broke ground in ${regionById(id).name}.`; },
  },
  {
    id: 'train', each: 'size', group: 'Research', name: (s, sz) => `${TRAIN[sz].name} (${Math.round(TRAIN[sz].share * 100)}% of fleet, $${trainCost(s.me, sz).toFixed(0)}M)`,
    desc: 'Results land at year end. Frontier runs need data quality 40 and clear regulation.', cost: (s, sz) => trainCost(s.me, sz),
    check: (s, sz) => (totalClustersOf(s.me) + s.me.rentedClusters < 1 ? 'Needs clusters' : s.me.training ? 'Already training' : sz === 'frontier' && s.me.data.q < 40 ? 'Needs data quality 40' : null),
    run: (s, sz) => { s.me.training = sz; return `Started a ${TRAIN[sz].name.toLowerCase()}.`; },
  },
  { id: 'finetune', group: 'Research', name: () => 'Fine-tune an open-weights model ($1M)', desc: 'Borrowed brains, capped near half the frontier. Enough to ship early products.', cost: () => 1, check: s => (flagCapOf(s.me) >= 0.5 * flagCapOf(frontierOf(s)) ? 'Your flagship already matches this' : null), run: s => { const v = (s.me.flagship?.version ?? 0) + 1; s.me.flagship = { cap: 0.5 * flagCapOf(frontierOf(s)), version: v, name: `Open-weights fine-tune ${v}`, year: s.year, open: false }; return 'Fine-tuned an open-weights model.'; } },
  { id: 'post', group: 'Research', name: () => 'Post-training and alignment pass ($3M)', desc: 'Adds capability to your current flagship and raises safety.', cost: () => 3, check: s => (s.me.flagship ? null : 'Train a flagship first'), run: s => { s.me.flagship.cap = Math.min(100, s.me.flagship.cap + 3 + Math.min(8, s.me.researchers / 20)); bump(s.me, 'safety', 4); return `Post-training lifted ${s.me.flagship.name}.`; } },
  { id: 'sprint', group: 'Research', name: () => 'Algorithmic research sprint', desc: '+6 percent algorithmic efficiency for your training runs.', cost: s => 1 + s.me.researchers * 0.05, check: s => (s.me.researchers < 5 ? 'Needs 5 researchers' : null), run: s => { s.me.algo *= 1.06; return 'Research sprint shipped a new training recipe.'; } },
  { id: 'paper', group: 'Research', name: () => 'Publish a research paper ($0.5M)', desc: '+4 reputation. Ideas leak to everyone a little.', cost: () => 0.5, run: s => { bump(s.me, 'rep', 4); s.w.algo *= 1.003; s.stats.papers++; return 'Published a paper.'; } },
  {
    id: 'open', group: 'Research', name: () => 'Open-source your flagship ($1M)', desc: 'Big reputation and distribution boost. Commercial revenue drops 15%.', cost: () => 1,
    check: s => (!s.me.flagship ? 'Train a flagship first' : s.me.flagship.cap < 30 ? 'Flagship needs capability 30' : s.me.flagship.open ? 'Already released this model' : s.me.mods.veto ? 'Parent company blocks open weights' : null),
    run: s => { const m = s.me; bump(m, 'rep', 8 * m.mods.openSource); bump(m, 'dist', 10 * m.mods.openSource); bump(m, 'safety', -4); m.open = true; m.flagship.open = true; s.stats.openReleases++; return `Open weights released for ${m.flagship.name}.`; },
  },
  { id: 'license', group: 'Research', name: () => 'License data from publishers ($15M)', desc: '+12 data quality. Lowers lawsuit risk.', cost: () => 15, run: s => { bump(s.me.data, 'q', 12); bump(s.me.data, 'licensed', 25); return 'Signed data licensing deals with publishers.'; } },
  { id: 'scrape', group: 'Research', name: () => 'Scrape the open web ($2M)', desc: '+6 data quality. Raises lawsuit risk.', cost: () => 2, run: s => { bump(s.me.data, 'q', 6); return 'Crawl finished. Lots of data, some of it copyrighted.'; } },

  {
    id: 'launch', each: 'seg', group: 'Products', name: (s, sid) => `Launch ${SEGMENTS[sid].name}`, desc: (s, sid) => `Needs capability ${unlockOf(s.me, sid)}. Costs $${(SEGMENTS[sid].launch * s.me.mods.launch).toFixed(0)}M.`,
    cost: (s, sid) => SEGMENTS[sid].launch * s.me.mods.launch,
    check: (s, sid) => (s.me.products.includes(sid) ? 'Already live' : !s.me.flagship ? 'Train a flagship first' : flagCapOf(s.me) < unlockOf(s.me, sid) ? `Needs capability ${unlockOf(s.me, sid)}` : null),
    run: (s, sid) => { s.me.products.push(sid); s.stats.launched[sid] = s.stats.launched[sid] ?? s.year; bump(s.me, 'dist', 5 * s.me.mods.dist); return `Launched ${SEGMENTS[sid].name}.`; },
  },
  { id: 'tier', each: 'tier', group: 'Products', name: (s, t) => `Price tier: ${t}`, desc: (s, t) => TIER_TEXT[t], cost: () => 0, check: (s, t) => (s.me.pricing === t ? 'Already set' : null), run: (s, t) => { s.me.pricing = t; return `Pricing moved to ${t}.`; } },
  { id: 'brand', group: 'Products', name: () => 'Brand campaign ($10M)', desc: '+8 distribution.', cost: () => 10, run: s => { bump(s.me, 'dist', 8 * s.me.mods.dist); return 'Brand campaign launched.'; } },
  { id: 'defense', group: 'Products', name: () => 'Bid for a defense contract ($2M)', desc: 'Three years of paid model access. Needs safety 60. Costs some trust.', cost: () => 2, check: s => (s.me.safety < 60 ? 'Needs safety 60' : s.me.gov >= s.year ? 'Already under contract' : null), run: s => { s.me.gov = s.year + 3; s.w.trust = clamp(s.w.trust - 1, 0, 100); return 'Won a three-year defense contract.'; } },

  {
    id: 'raise', group: 'Finance', name: s => { const r = ROUNDS[s.me.rounds.length]; return r ? `Raise ${r.name}: sell ${Math.round(r.pct * 100)}% (+${money(r.pct * s.me.valuation)})` : 'No private rounds left'; },
    desc: s => { const r = ROUNDS[s.me.rounds.length]; return r ? `Needs: ${r.ask}. One round per year.` : 'Go public instead.'; },
    cost: s => -(ROUNDS[s.me.rounds.length]?.pct ?? 0) * s.me.valuation,
    check: s => { const r = ROUNDS[s.me.rounds.length]; return s.me.public ? 'Already public' : !r ? 'Go public instead' : s.me.raisedYear === s.year ? 'Already raised this year' : !r.need(s.me) ? `Milestone: ${r.ask}` : null; },
    run: s => { const r = ROUNDS[s.me.rounds.length]; s.me.stake *= 1 - r.pct; s.me.raisedYear = s.year; s.me.rounds.push({ name: r.name, year: s.year }); s.stats.rounds++; return `Closed the ${r.name} round.`; },
  },
  {
    id: 'ipo', group: 'Finance', name: () => 'Take the company public (IPO)', desc: 'Raises 12% of value at a 20% premium. Quarterly pressure begins.', cost: s => -0.12 * s.me.valuation * 1.2,
    check: s => (s.me.public ? 'Already public' : !s.me.execs.cfo ? 'Hire a CFO first' : s.me.revenue < 500 ? 'Needs $500M revenue' : s.w.index < 100 ? 'Market index too low' : s.me.rounds.length < 2 ? 'Needs two funding rounds' : null),
    run: s => { s.me.public = true; s.me.ipoYear = s.year; s.me.stake *= 0.88; s.stats.ipo = s.year; return 'Listed on the exchange. Ring the bell.'; },
  },
  { id: 'secondary', group: 'Finance', name: () => 'Sell 2% of your stake', desc: 'Cash out a little after the IPO. Investors notice.', cost: s => -0.02 * s.me.valuation, check: s => (!s.me.public || s.year <= s.me.ipoYear ? 'Only after a year of trading' : s.me.stake < 0.1 ? 'Too little stake left' : null), run: s => { s.me.stake -= 0.02; return 'Secondary sale closed.'; } },
  { id: 'borrow', group: 'Finance', name: s => `Borrow against your GPUs (+${money(0.3 * clusterPrice(s.year, s.w) * totalClustersOf(s.me))})`, desc: 'Loan worth 30 percent of fleet value. Costs the base rate plus 4 points.', cost: s => -0.3 * clusterPrice(s.year, s.w) * totalClustersOf(s.me), check: s => (totalClustersOf(s.me) < 5 ? 'Needs at least 5 clusters' : s.me.debt + 0.3 * clusterPrice(s.year, s.w) * totalClustersOf(s.me) > 0.5 * s.me.valuation ? 'Lenders cap debt at half of valuation' : null), run: s => { s.me.debt += 0.3 * clusterPrice(s.year, s.w) * totalClustersOf(s.me); return 'GPU-backed loan funded.'; } },
  { id: 'repay', group: 'Finance', name: () => 'Repay 20% of debt', desc: 'Lowers interest costs.', cost: s => 0.2 * s.me.debt, check: s => (s.me.debt <= 0 ? 'No debt' : null), run: s => { s.me.debt *= 0.8; return 'Repaid a chunk of debt.'; } },

  { id: 'safetyTeam', group: 'Policy', name: () => 'Fund a safety team (+12 safety, $3M/yr)', desc: 'Two years of funding. Needed for frontier releases.', cost: () => 0, run: s => { bump(s.me, 'safety', 12); s.me.commitments.push({ amount: 3, until: s.year + 1 }); return 'Safety team funded.'; } },
  { id: 'evals', group: 'Policy', name: () => 'Run independent safety evals ($2M)', desc: '+6 safety and +2 public trust.', cost: () => 2, run: s => { bump(s.me, 'safety', 6); s.w.trust = clamp(s.w.trust + 2, 0, 100); return 'Independent evals published. Results are mixed but public.'; } },
  { id: 'lobby', group: 'Policy', name: () => 'Lobby for light regulation ($2M/yr, 2 years)', desc: 'Exempts you from compliance fees for two years.', cost: () => 0, run: s => { s.me.commitments.push({ amount: 2, until: s.year + 1 }); s.me.lobbyUntil = s.year + 1; return 'Lobbying campaign started.'; } },
  { id: 'license_app', group: 'Policy', name: () => 'Apply for a frontier training license ($5M)', desc: 'Required for frontier runs once licensing starts.', cost: () => 5, check: s => (s.w.regLevel < 3 ? 'No licensing regime yet' : s.me.licensed ? 'Already licensed' : null), run: s => { s.me.licensed = true; return 'Frontier training license granted.'; } },

  { id: 'poach', each: 'rival', group: 'Rivals', name: () => 'Poach 3 researchers ($9M)', desc: 'Success depends on your reputation against theirs.', cost: () => 9, check: (s, rid) => (companyById(s, rid).researchers < 6 ? 'Too few researchers' : null),
    run: (s, rid) => { const r = companyById(s, rid), p = clamp(0.35 + (s.me.rep - r.rep) / 200, 0.1, 0.9); if (rand(s) >= p) return `Offers to ${r.name}'s researchers were turned down.`; s.me.researchers += 3; r.researchers -= 3; return `Poached 3 researchers from ${r.name}.`; },
  },
  {
    id: 'acquire', each: 'rival', group: 'Rivals', name: (s, rid) => `Acquire for ${money(acqPrice(s, rid))}`, desc: 'Cash first, the rest in stock. Gets their team, clusters and products.',
    cost: (s, rid) => Math.min(Math.max(0, s.me.cash), acqPrice(s, rid)),
    check: (s, rid) => {
      const r = companyById(s, rid), price = acqPrice(s, rid), stock = price - Math.min(Math.max(0, s.me.cash), price);
      return antitrustBlocks(s, r) ? 'Antitrust review would block this deal' : r.valuation > 1.5 * s.me.valuation ? 'Too big to buy' : s.me.stake * (1 - stock / s.me.valuation) < 0.1 ? 'Would dilute you below 10%' : null;
    },
    run: (s, rid) => {
      const r = companyById(s, rid), price = acqPrice(s, rid), stock = price - Math.min(Math.max(0, s.me.cash), price), m = s.me;
      m.stake *= 1 - stock / m.valuation;
      r.status = 'acquired';
      m.researchers += r.researchers; m.engineers += r.engineers; m.sales += r.sales;
      for (const [g, n] of Object.entries(r.fleet)) m.fleet[g] = (m.fleet[g] ?? 0) + n;
      m.rentedClusters += r.rentedClusters;
      for (const sid of r.products) if (!m.products.includes(sid)) { m.products.push(sid); s.stats.launched[sid] = s.stats.launched[sid] ?? s.year; }
      return `Acquired ${r.name}.`;
    },
  },
];

function acqPrice(s, rid) { const r = companyById(s, rid); return r.valuation * 0.9 * r.discount; }

function targetsOf(a, s) {
  return {
    seg: Object.keys(SEGMENTS), rival: activeRivals(s).map(r => r.id), region: REGIONS.map(r => r.id),
    size: Object.keys(TRAIN), tier: ['free', 'standard', 'premium'], star: s.stars.map(st => st.id),
  }[a.each] ?? [null];
}

function options(s) {
  const out = [];
  for (const a of ACTIONS) {
    for (const t of targetsOf(a, s)) {
      const cost = a.cost(s, t), reason = a.check ? a.check(s, t) : null;
      out.push({
        key: t ? `${a.id}:${t}` : a.id, group: a.group, target: t, cost,
        name: a.name(s, t), desc: typeof a.desc === 'function' ? a.desc(s, t) : a.desc,
        locked: reason || (s.ap < 1 ? 'No actions left this year' : cost > s.me.cash ? `Needs ${money(cost)} cash` : null),
      });
    }
  }
  return out;
}

function act(s, key) {
  const o = options(s).find(x => x.key === key);
  if (!o) return 'Unknown action';
  if (o.locked) return o.locked;
  const msg = ACTIONS.find(a => a.id === key.split(':')[0]).run(s, o.target);
  s.me.cash -= o.cost;
  s.ap -= 1;
  syncStars(s);
  s.log.push({ year: s.year, text: msg });
  return null;
}
