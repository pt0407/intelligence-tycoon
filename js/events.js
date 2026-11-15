const SCRIPTED = {
  2017: [s => { s.w.algo *= 1.15; return 'A short paper on attention-based networks is replicated in every lab within months.'; }],
  2018: [s => { s.w.wage *= 1.2; return 'Researcher pay war. Top PhDs are getting offers with eight-figure packages.'; }],
  2019: [
    s => { const m = companyById(s, 'meridian'); if (!m || m.status !== 'active') return null; m.cash += 800; return 'Meridian Research converts to a capped-profit company and raises $800M.'; },
    s => { s.w.regLevel = Math.max(s.w.regLevel, 1); return 'Governments publish voluntary AI safety guidelines. Everyone signs, few follow them closely.'; },
  ],
  2020: [s => { s.w.priceShock *= 1.3; s.w.shortage = clamp(s.w.shortage + 0.3, 0, 1); s.w.rate = 0.5; return 'Pandemic. Rates drop to near zero and everyone wants GPUs at once.'; }],
  2022: [
    s => { s.w.demand *= 1.3; s.w.hype += 0.4; return 'The chatbot moment. Your aunt now has an AI account.'; },
    s => { s.w.rate += 3; return 'Central banks hike rates to fight inflation. Money stops being free.'; },
  ],
  2023: [s => { const r = pickRival(s); if (!r) return null; r.researchers *= 0.7; return `Boardroom fight at ${r.name}. Two cofounders quit, one comes back.`; }],
  2024: [
    s => { s.w.exportControl = true; return 'New export controls restrict the newest GPU generation for most buyers.'; },
    s => { s.w.algo *= 1.2; return 'A reasoning-model breakthrough makes test-time compute the new scaling axis.'; },
  ],
  2025: [
    s => { s.w.regLevel = Math.max(s.w.regLevel, 2); return 'Binding AI rules take effect. Frontier releases need safety 50 and a 2% revenue compliance fee.'; },
    s => { s.w.copyrightHeat = 1.5; s.w.dataCost *= 1.5; return 'Copyright lawsuits pile up. Licensed training data becomes a line item.'; },
  ],
  2027: [s => { s.w.gridStress = 2; return 'Power grid crunch. Utilities push new data center hookups back a year.'; }],
  2028: [s => { s.w.hype = Math.max(0.4, s.w.hype - 0.4); s.w.index *= 0.85; return 'AI market correction. Valuations reset and the IPO window narrows.'; }],
  2031: [s => { if (s.w.regLevel < 2) return null; s.w.regLevel = 3; return 'A licensing regime starts. Frontier training needs a government license.'; }],
  2033: [s => { s.w.wage *= 1.1; return 'Talent shortage again. Senior researcher salaries climb another 10 percent.'; }],
};

const RANDOM = [
  { p: s => (s.me.safety < 50 ? 0.2 : 0.07), when: s => s.me.products.length > 0, run: s => { bump(s.me, 'rep', -8); s.w.trust = clamp(s.w.trust - 6, 0, 100); return 'A chatbot of yours says something dangerous. The screenshot spreads faster than the fix.'; } },
  { p: () => 0.05, when: s => s.me.flagship && activeRivals(s).length > 0, run: s => { const r = pickRival(s); r.mods.talent *= 1.05; s.w.trust = clamp(s.w.trust - 2, 0, 100); return `Someone leaked your flagship weights. ${r.name} says it was "inspired".`; } },
  { p: () => 0.15, when: s => s.me.researchers >= 8, run: s => { s.me.researchers -= 3; spawnStartup(s, { researchers: 3, cash: 25 }); return 'Three of your researchers leave to found their own startup.'; } },
  { p: () => 0.1, when: s => s.me.products.length > 0, run: s => { bump(s.me, 'dist', 10); bump(s.me, 'rep', 3); return 'One of your products goes viral. Your brand is on every feed.'; } },
  { p: () => 0.1, when: s => activeRivals(s).length > 0, run: s => { const r = pickRival(s); r.discount = 0.5; return `${r.name} is quietly for sale at a discount.`; } },
  { p: () => 0.08, when: () => true, run: s => { s.w.priceShock *= 0.85; return 'A hydro power deal cuts data center electricity costs.'; } },
  { p: () => 0.12, when: s => s.me.products.length >= 2, run: s => { s.me.cash += 25 + s.me.revenue * 0.2; return 'A Fortune 500 company signs an enterprise contract.'; } },
  { p: () => 0.3, when: s => s.w.hype > 1.8, run: s => { s.w.hype -= 0.3; s.w.index *= 0.9; return 'AI bubble wobble. Public markets sell off and valuations reset.'; } },
  { p: () => 0.05, when: s => s.w.rate > 4, run: s => { s.w.recession = 2; s.w.hype = Math.max(0.4, s.w.hype - 0.2); s.w.index *= 0.85; return 'Recession. Ad budgets and VC checks shrink.'; } },
  { p: () => 0.1, when: s => activeRivals(s).length > 0, run: s => { const r = pickRival(s); r.researchers *= 0.8; return `Talent exodus at ${r.name}. Researchers take offers elsewhere.`; } },
  { p: () => 0.06, when: s => s.me.products.length > 0, run: s => { bump(s.me, 'rep', -3); return 'A cloud outage takes your API down for two days.'; } },
  { p: s => 0.1 * (1 - s.me.data.licensed / 100) * s.w.copyrightHeat, when: s => s.me.products.length > 0 && s.w.copyrightHeat > 0, run: s => { s.me.cash -= s.me.revenue * 0.05; s.me.lawsuits++; bump(s.me, 'rep', -4); return 'A publisher sues over training data. You settle quietly for 5% of revenue.'; } },
  { p: () => 0.05, when: s => s.me.execs.cfo, run: s => { s.me.execs.cfo = false; return 'Your CFO leaves for a company preparing an IPO. The board wants a replacement.'; } },
  { p: () => 0.1, when: s => s.me.safety >= 60 && s.me.gov < s.year, run: s => { s.me.gov = s.year + 3; return 'A defense agency offers a three-year contract for model access.'; } },
  { p: () => 0.1, when: s => companyById(s, 'quorum')?.status === 'active', run: s => { const q = companyById(s, 'quorum'); q.algo *= 1.1; return 'Quorum Labs releases an open model that beats last year\'s closed models on coding tests.'; } },
  { p: () => 0.1, when: s => s.w.index > 110, run: s => { s.w.hype += 0.1; return 'The tech IPO window reopens. Investors are hungry again.'; } },
];

function runEvents(s, news) {
  for (const f of SCRIPTED[s.year] ?? []) { const t = f(s); if (t) news.push(t); }
  for (const ev of RANDOM) if (ev.when(s) && chance(s, ev.p(s))) news.push(ev.run(s));
  if (s.year >= 2017 && chance(s, 0.3 * s.w.hype)) news.push(`${spawnStartup(s).name} emerges from stealth.`);
}
