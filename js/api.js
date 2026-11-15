function newGame(pathId, name, seed = 1) {
  const p = PATHS[pathId], w = newWorld();
  const me = makeCompany({ ...p.start, id: 'me', name, type: p.name, mods: p.mods });
  const rivals = RIVAL_TEMPLATES.map(t => makeCompany(t));
  for (const r of rivals) r.status = r.founded <= START_YEAR ? 'active' : 'future';
  const s = {
    year: START_YEAR, path: pathId, w, me, rivals, stars: STARS.map(x => ({ ...x })), ap: AP_PER_YEAR + me.mods.ap,
    stats: { papers: 0, rounds: 0, openReleases: 0, profitYears: 0, launched: {}, ipo: 0 },
    goalsDone: {}, log: [{ year: START_YEAR, text: `${name} is founded as a ${p.name.toLowerCase()}.` }], history: [], rs: seed, over: false, verdict: null,
  };
  syncStars(s);
  for (const c of active(s)) { c.valuation = valuationOf(c, w); applyHistory(s, c); }
  w.frontierE = Math.max(1e-9, ...active(s).map(c => effCompute(s, c, 1)));
  return s;
}

const Engine = { newGame, options, act, endYear, marketShares };
