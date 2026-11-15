function makeBot(E) {
  const { flagCapOf, totalRacksOf } = E;
  const platYear = id => (id ? (E.PLATFORMS.find(p => p.id === id)?.year ?? 0) : 0);

  return function bot(s) {
    const opts = () => E.options(s);
    const reserve = Math.max(10, -s.me.net * 1.2);
    const direct = k => opts().find(o => o.key === k && !o.locked) || null;
    const newestBuy = () => opts().filter(o => o.key.startsWith('buy:') && !o.locked && o.cost <= s.me.cash - reserve).sort((a, b) => platYear(b.target) - platYear(a.target))[0] || null;
    const rules = [
      () => opts().filter(o => o.group === 'Products' && !o.locked && o.key.startsWith('launch') && o.cost <= s.me.cash).sort((a, b) => a.cost - b.cost)[0],
      () => (!s.me.training && totalRacksOf(s.me) >= 1 ? opts().find(o => o.key === 'train:medium' && !o.locked && (!s.me.flagship || o.cost <= s.me.cash - reserve)) || opts().find(o => o.key === 'train:small' && !o.locked && o.cost <= s.me.cash) || null : null),
      () => (!s.me.flagship ? direct('finetune') : null),
      () => (!s.me.execs.cfo && s.me.revenue > 100 ? direct('cfo') : null),
      () => direct('raise'),
      () => direct('ipo'),
      () => (s.me.cash > 60 ? newestBuy() : null),
      () => (!s.me.flagship && s.me.cash > 100 ? opts().filter(o => o.key.startsWith('rent:') && !o.locked).sort((a, b) => platYear(b.target) - platYear(a.target))[0] : null),
      () => (s.me.cash > 300 && s.me.pendingDC.length === 0 ? direct('build:us') || direct('build:tx') : null),
      () => opts().find(o => o.key.startsWith('decide:') && !o.locked) || null,
      () => (!s.partnership && s.me.cash > 40 ? opts().find(o => o.key === 'partner:starter' && !o.locked) || null : null),
      () => (s.me.cash > 80 ? direct('office') : null),
      () => { const best = (s.candidates ?? []).filter(c => !c.taken && c.fee < s.me.cash - 20).sort((a, b) => b.quality - a.quality)[0]; return best ? opts().find(o => o.key === `hireCand:${best.id}` && !o.locked) || null : null; },
      () => (s.me.cash < 50 ? opts().find(o => o.key.startsWith('strategy_harvest:') && !o.locked) || null : null),
      () => (s.me.cash > 25 ? direct('hireRes') : null),
      () => (s.me.cash > 20 ? direct('hireEng') : null),
      () => (s.me.flagship && s.me.cash > 30 ? direct('post') : null),
      () => (s.me.safety < 50 && s.me.cash > 30 ? direct('safetyTeam') : null),
      () => (s.me.products.length >= 2 && s.me.pricing === 'standard' && s.me.cash > 60 ? direct('tier:premium') : null),
      () => (s.me.cash > 30 ? direct('sprint') : null),
      () => (s.me.cash > 60 ? direct('star') : null),
      () => (s.me.cash > 60 ? opts().find(o => o.key.startsWith('stake:') && !o.locked) || null : null),
      () => (s.me.cash > 150 ? opts().find(o => o.key.startsWith('bidFair:') && !o.locked) || null : null),
      () => (s.me.cash > 150 ? opts().find(o => o.key.startsWith('buycompute:') && !o.locked) || null : null),
      () => (s.me.cash > 60 ? direct('brand') : null),
    ];
    let progressed = true, guard = 0;
    while (s.ap > 0 && progressed && guard++ < 30) {
      progressed = false;
      for (const rule of rules) {
        const o = rule();
        if (!o) continue;
        if (E.act(s, o.key) === null) { progressed = true; break; }
      }
    }
    return flagCapOf(s.me);
  };
}

module.exports = { makeBot };
