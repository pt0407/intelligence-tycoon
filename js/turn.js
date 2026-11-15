function macroStep(s) {
  const w = s.w, y = s.year, growth = TAM[Math.min(yi(y) + 1, TAM.length - 1)] / TAM[yi(y)];
  w.rate = clamp(w.rate + (3 - w.rate) * 0.15 + (rand(s) - 0.5) * 0.5, 0, 8);
  w.index = clamp(w.index * (1 + 0.05 + (w.hype - 1) * 0.1 - (w.rate - 3) * 0.015 + (rand(s) - 0.5) * 0.12), 30, 400);
  w.hype = clamp(w.hype + (growth - 1.4) * 0.2 + (rand(s) - 0.5) * 0.1 - w.recession * 0.05, 0.4, 2.5);
  w.shortage = clamp(w.shortage + (clamp(0.1 + (w.hype - 0.8) * 0.4, 0, 0.9) - w.shortage) * 0.5, 0, 1);
  const cs = active(s), avgSafety = cs.reduce((t, c) => t + c.safety, 0) / cs.length;
  w.trust = clamp(w.trust + (avgSafety - 50) * 0.02 - 0.2, 0, 100);
  w.priceShock = 1 + (w.priceShock - 1) * 0.6;
  w.algo *= 1.05;
  w.gridStress = Math.max(0, w.gridStress - 1);
  w.recession = Math.max(0, w.recession - 1);
}

function activateRivals(s, news) {
  for (const r of s.rivals) if (r.status === 'future' && r.founded <= s.year + 1) { r.status = 'active'; news.push(`${r.name} emerges from stealth.`); }
}

function endYear(s) {
  const y = s.year, w = s.w, me = s.me, news = [];
  const before = { valuation: me.valuation, cash: me.cash, rank: rankOf(s), stake: me.stake };
  activateRivals(s, news);
  macroStep(s);
  runEvents(s, news);
  syncStars(s);
  for (const c of active(s)) c.boughtYear = 0;
  for (const b of me.pendingDC.filter(b => b.ready <= y)) { me.dcs.push(b.region); news.push(`${regionById(b.region).name} data center online: +${DC_BLOCK_MW} MW.`); }
  me.pendingDC = me.pendingDC.filter(b => b.ready > y);
  for (const r of activeRivals(s)) aiTurn(s, r, news);
  const L = active(s);
  for (const c of L) if (c.flagship) c.flagship.cap *= 0.97;
  for (const c of L) resolveTraining(s, c, news);
  const g = grossRevenue(s, L);
  for (const c of L) c.revenue = revenueOf(s, c, g[c.id]);
  for (const c of L) {
    c.lastValuation = c.valuation;
    c.lastNet = c.net;
    c.cogs = c.revenue * Math.max(0.12, 0.32 - 0.02 * yi(y));
    c.net = c.revenue - c.cogs - costsOf(s, c);
    c.cash += c.net;
    if (c === me && c.net > 0) s.stats.profitYears++;
    if (c !== me && c.products.length && chance(s, 0.08 * (1 - c.data.licensed / 100) * w.copyrightHeat)) { c.cash -= c.revenue * 0.05; c.lawsuits++; }
    if (c.public) c.lossYears = c.net < -0.25 * c.revenue ? c.lossYears + 1 : 0;
    if (c.public && c.lossYears >= 2) {
      c.lossYears = 0; c.researchers *= 0.9;
      if (c === me) news.push('Shareholders revolt over losses. The board orders a 10 percent cut in research staff.');
    }
    moraleStep(c);
    const lost = attrition(c);
    if (c === me && lost >= 1) news.push(`${Math.round(lost)} researchers quit over morale.`);
    if (c !== me && lost > 0) { const t = pickRival(s); if (t && t !== c) t.researchers += lost * 0.8; }
  }
  starMoves(s, news);
  for (const c of L) c.valuation = valuationOf(c, w);
  for (const c of L) {
    if (c.cash >= 0) continue;
    const pct = c.valuation > 0 ? Math.min(1, -c.cash / c.valuation) : 1;
    c.cash = 0;
    if (pct >= 0.5 || (c === me && me.stake * (1 - pct) < 0.05)) {
      if (c === me) { me.status = 'bankrupt'; news.push('Out of cash. No investor will fund the next round.'); }
      else { c.status = 'dead'; news.push(`${c.name} runs out of money and shuts down.`); }
    } else {
      if (c === me) me.stake *= 1 - pct;
      news.push(c === me ? `Emergency round: sold ${Math.round(pct * 100)}% to stay alive.` : `${c.name} raises an emergency round.`);
    }
  }
  for (const c of active(s)) c.valuation = valuationOf(c, w);
  w.frontierE = Math.max(1e-9, ...active(s).map(c => effCompute(s, c, 1)));
  PATHS[s.path].goals.forEach((gl, i) => { if (!(i in s.goalsDone) && me.status === 'active' && gl.check(s)) { s.goalsDone[i] = y; news.push(`Objective complete: ${gl.text}`); } });
  s.history.push({ year: y, valuation: me.valuation, revenue: me.revenue, cap: flagCapOf(me), frontier: flagCapOf(frontierOf(s)), rank: rankOf(s), index: w.index, rate: w.rate });
  s.log.push(...news.map(text => ({ year: y, text })));
  s.log = s.log.slice(-300);
  const report = {
    year: y, news, before,
    after: { valuation: me.valuation, cash: me.cash, rank: rankOf(s), revenue: me.revenue, net: me.net, cap: flagCapOf(me), frontier: flagCapOf(frontierOf(s)), frontierName: frontierOf(s).name, stake: me.stake, index: w.index, rate: w.rate, hype: w.hype, trust: w.trust },
  };
  if (me.status !== 'active' || y >= END_YEAR) { s.over = true; s.verdict = verdictFor(s); }
  else { s.year = y + 1; s.ap = AP_PER_YEAR + me.mods.ap; }
  return report;
}

function verdictFor(s) {
  const me = s.me;
  if (me.status === 'bankrupt') return { title: 'Bankrupt', text: `Ran out of money in ${s.year}.` };
  const board = active(s).sort((a, b) => b.valuation - a.valuation), rank = board.indexOf(me) + 1, second = board[1] ? board[1].valuation : 0;
  const summary = `Finished ${END_YEAR} at #${rank} of ${board.length} with a valuation of ${money(me.valuation)}. ${me.public ? `Listed since ${me.ipoYear}.` : 'Still private.'}`;
  if (rank === 1 && me.valuation >= 2 * second) return { title: 'Dominant', text: summary };
  if (rank === 1) return { title: 'Biggest AI company', text: summary };
  if (rank <= 3) return { title: 'Contender', text: summary };
  return { title: 'Survivor', text: summary };
}

function marketShares(s) {
  const out = {};
  for (const sid of Object.keys(SEGMENTS)) {
    const sellers = active(s).filter(c => c.products.includes(sid)), tot = sellers.reduce((t, c) => t + weightOf(c), 0);
    out[sid] = sellers.map(c => ({ id: c.id, name: c.name, share: tot ? weightOf(c) / tot : 0 })).sort((a, b) => b.share - a.share);
  }
  return out;
}
