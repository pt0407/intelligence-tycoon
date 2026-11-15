function unlockOf(c, sid) { return c.mods.unlock[sid] ?? SEGMENTS[sid].unlock; }
function allocLeft(c, w) { return Math.max(0, Math.floor(30 * (1 - 0.6 * w.shortage) * c.mods.alloc) - c.boughtYear); }
function queueYears(s, region) { return region.queue + (s.w.gridStress > 0 ? 1 : 0); }
function dcCost(region, w) { return DC_BLOCK_COST * (1 + region.permit * (1 + w.regLevel * 0.3)); }
function exportBlocked(s, c) { return s.w.exportControl && curGen(s.year).id >= 5 && !c.mods.gov; }
function starMult(c) { return 1 + 0.06 * c.starAbility; }
function dataFactor(c) { return 0.6 + c.data.q / 250; }
function effCompute(s, c, share) {
  return perfTotal(c, s.year) * share * dataFactor(c) * s.w.algo * c.algo * starMult(c) * (1 + c.researchers / 25) * c.mods.talent;
}
function capOf(s, E) { return 100 * (1 - Math.exp(-E / (0.8 * s.w.frontierE))); }
function trainCost(c, size) { return TRAIN[size].share * totalClustersOf(c) * 0.4 * avgPowerFactor(c) + c.researchers * 0.05; }

function resolveTraining(s, c, news) {
  const size = c.training;
  if (!size) return;
  c.training = null;
  const w = s.w, mine = c === s.me, frontierRun = size === 'frontier';
  const blocked = frontierRun && ((w.regLevel >= 3 && !c.licensed) || (w.regLevel >= 2 && c.safety < 50));
  if (blocked) { if (mine) news.push(`Regulators blocked the frontier run. Get licensed or raise safety above 50.`); return; }
  const cap = Math.min(100, capOf(s, effCompute(s, c, TRAIN[size].share)));
  if (c.flagship && cap < flagCapOf(c)) { if (mine) news.push(`${TRAIN[size].name} did not beat ${c.flagship.name}. Kept the old flagship.`); return; }
  const version = (c.flagship?.version ?? 0) + 1;
  c.flagship = { cap, version, name: `${MODEL_FAMILIES[(version - 1) % MODEL_FAMILIES.length]}-${version}`, year: s.year, open: false };
  if (mine) news.push(`Released ${c.flagship.name} at capability ${Math.round(cap)}.`);
}

function starMoves(s, news) {
  for (const st of s.stars) {
    if (st.owner) {
      const o = companyById(s, st.owner);
      if (o && chance(s, (1 - o.morale / 100) * 0.06)) { st.owner = null; news.push(`${st.name} leaves ${o.name} and becomes a free agent.`); }
    } else if (chance(s, 0.15)) {
      const r = pickRival(s);
      if (r && r.cash > 120) { st.owner = r.id; r.cash -= 15; news.push(`${r.name} lands ${st.name}.`); }
    }
  }
}

function syncStars(s) {
  for (const c of [s.me, ...s.rivals]) c.starAbility = s.stars.filter(st => st.owner === c.id).reduce((t, st) => t + st.ability, 0);
}

function moraleStep(c) {
  const target = 50 + clamp((c.valuation / Math.max(1, c.lastValuation) - 1) * 40, -25, 25) + (c.lastNet > 0 ? 5 : -5) - c.lossYears * 5;
  bump(c, 'morale', clamp((target - c.morale) * 0.3, -10, 10));
}

function attrition(c) {
  const lost = c.researchers * clamp((60 - c.morale) / 400, 0, 0.12);
  c.researchers -= lost;
  return lost;
}

function ipoReady(s, c) { return !c.public && c.execs.cfo && c.revenue >= 500 && s.w.index >= 100 && c.rounds.length >= 2; }

function antitrustBlocks(s, target) {
  return Object.keys(SEGMENTS).some(sid => {
    const tot = active(s).filter(c => c.products.includes(sid)).reduce((t, c) => t + weightOf(c), 0);
    const mine = [s.me, target].filter(c => c.products.includes(sid)).reduce((t, c) => t + weightOf(c), 0);
    return tot > 0 && mine / tot > 0.4;
  });
}

function spawnStartup(s, extra = {}) {
  const sids = Object.keys(SEGMENTS).filter(k => SEGMENTS[k].unlock <= 50);
  const r = makeCompany({
    id: `r${s.rivals.length}`, name: `${pick(s, NAME_PREFIXES)} ${pick(s, NAME_SUFFIXES)}`, type: 'Startup', founded: s.year,
    cash: 30, researchers: 8, engineers: 8, fleet: { 1: 5 }, data: 45, rep: 30, safety: 40, dist: 10, morale: 65,
    growth: 0.4, growthRes: 0.1, targets: [pick(s, sids)], mods: { talent: 0.95 + rand(s) * 0.15, noMW: true }, ...extra,
  });
  r.status = 'active';
  r.valuation = valuationOf(r, s.w);
  s.rivals.push(r);
  return r;
}

function aiTurn(s, r, news) {
  const y = s.year, w = s.w, price = clusterPrice(y, w, r.mods.compute);
  const n = Math.min(allocLeft(r, w), Math.max(1, Math.round(totalClustersOf(r) * r.growth)), Math.floor(Math.max(0, r.cash) * 0.4 / price));
  if (n > 0) { const g = curGen(y).id; r.fleet[g] = (r.fleet[g] ?? 0) + n; r.cash -= n * price; r.boughtYear += n; }
  if (!r.training && totalClustersOf(r) > 0) r.training = r.cash > 30 ? 'medium' : 'small';
  r.researchers *= 1 + r.growthRes;
  for (const sid of r.targets) {
    if (!r.products.includes(sid) && flagCapOf(r) >= unlockOf(r, sid) && r.cash > SEGMENTS[sid].launch * 2) { r.products.push(sid); r.cash -= SEGMENTS[sid].launch; }
  }
  if (r.cash < 40 && r.valuation > 0 && r.raisedYear < y) { r.cash += r.valuation * 0.1; r.raisedYear = y; }
  if (!r.public && r.revenue >= 1000 && chance(s, 0.4)) { r.public = true; r.ipoYear = y; r.cash += r.valuation * 0.12; }
  if (r.cash > 600 && chance(s, 0.1)) {
    const t = activeRivals(s).find(x => x !== r && x.valuation < r.valuation * 0.1 && !antitrustBlocks(s, x));
    if (t) {
      t.status = 'acquired';
      r.researchers += t.researchers; r.engineers += t.engineers;
      for (const sid of t.products) if (!r.products.includes(sid)) r.products.push(sid);
      r.cash -= t.valuation * 0.9;
      news.push(`${r.name} acquires ${t.name}.`);
    }
  }
}
