function applyScenario(w, id) {
  if (id === 'exportBan') { w.exportControl = true; w.regLevel = Math.max(w.regLevel, 1); }
  if (id === 'slowdown') { w.hype = 0.8; w.index *= 0.8; w.algo *= 0.9; }
  if (id === 'powerCrunch') { w.energyShock = 1.6; w.gridStress = 2; }
  if (id === 'fastRoadmap') { w.algo *= 1.3; }
}

function newGame(pathId, name, seed = 1, scenario = 'base', identity = null) {
  const p = PATHS[pathId], w = newWorld();
  const who = identity ?? rollIdentity(seed);
  applyScenario(w, scenario);
  const me = makeCompany({ ...p.start, id: 'me', name: name || who.name, type: p.name, mods: p.mods, founder: who.founder, city: who.city, backstory: who.backstory });
  const rivals = RIVAL_TEMPLATES.map(t => makeCompany(t));
  for (const r of rivals) r.status = r.founded <= START_YEAR ? 'active' : 'future';
  const s = {
    year: START_YEAR, path: pathId, scenario, w, me, rivals, stars: STARS.map(x => ({ ...x })), ap: AP_PER_YEAR + me.mods.ap,
    stats: { papers: 0, rounds: 0, openReleases: 0, profitYears: 0, launched: {}, ipo: 0 },
    goalsDone: {}, achievements: {}, deals: [], offers: [], missions: [], candidates: [], yr: {}, log: [{ year: START_YEAR, text: `${name} is founded as a ${p.name.toLowerCase()}.` }], history: [], rs: seed, over: false, verdict: null,
  };
  syncStars(s);
  assignMissions(s);
  assignCandidates(s);
  for (const c of active(s)) { c.valuation = valuationOf(c, w); applyHistory(s, c); }
  w.frontierE = Math.max(1e-9, ...active(s).map(c => effCompute(s, c, 1)));
  return s;
}

const Engine = { newGame, options, act, endYear, marketShares };
