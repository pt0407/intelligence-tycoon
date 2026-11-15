const SCRIPTED = {
  2016: [s => { s.w.hype *= 1.05; return 'AlphaGo beats a world Go champion. Investors start paying attention.'; }],
  2017: [s => { s.w.algo *= 1.15; return 'The transformer paper, "Attention Is All You Need", is replicated in every lab within months.'; }],
  2018: [s => { s.w.wage *= 1.2; return 'Researcher pay war. Top PhDs are getting offers with eight-figure packages.'; }],
  2019: [
    s => { const o = companyById(s, 'openai'); if (!o || o.status !== 'active') return null; o.cash += 1000; return 'OpenAI moves to a capped-profit structure. Microsoft commits $1B.'; },
    s => { s.w.regLevel = Math.max(s.w.regLevel, 1); return 'European regulators publish AI ethics guidelines. Everyone signs, few follow them closely.'; },
  ],
  2020: [s => { s.w.priceShock *= 1.2; s.w.shortage = clamp(s.w.shortage + 0.2, 0, 1); s.w.algo *= 1.1; return 'GPT-3 shows that scale alone can produce surprising language skills. The pandemic sends everyone to the cloud at once.'; }],
  2021: [s => 'Former OpenAI researchers found Anthropic with a safety-first charter.'],
  2022: [
    s => { s.w.demand *= 1.3; s.w.hype += 0.4; return 'ChatGPT launches in November and becomes the fastest-growing consumer app in history. The H100 ships in volume.'; },
    s => { s.w.rate += 3; return 'Central banks hike rates to fight inflation. Money stops being free.'; },
  ],
  2023: [
    s => { s.w.shortage = clamp(s.w.shortage + 0.3, 0, 1); return 'The GPU shortage. H100 racks sell out and waitlists stretch for quarters.'; },
    s => { s.w.algo *= 1.2; return 'GPT-4 and Claude ship. The frontier moves from research demos to products.'; },
  ],
  2024: [
    s => { s.w.trust = clamp(s.w.trust + 5, 0, 100); return 'Nobel prizes go to AI research. Public trust in the field jumps, then gets a little nervous.'; },
    s => { s.w.exportControl = true; return 'US export controls tighten on the newest accelerators for most buyers.'; },
  ],
  2025: [
    s => { s.w.index *= 0.9; s.w.hype = Math.max(0.4, s.w.hype * 0.8); return 'DeepSeek-R1 shakes the market. Cheap reasoning models make investors nervous about who pays for compute.'; },
    s => { s.w.regLevel = Math.max(s.w.regLevel, 2); return 'Binding AI rules take effect in Europe. Frontier releases need safety 50 and a 2% revenue compliance fee.'; },
    s => { s.w.copyrightHeat = 1.5; s.w.dataCost *= 1.5; return 'Copyright lawsuits pile up. Licensed training data becomes a line item.'; },
    s => { s.w.hype += 0.1; return 'Stargate is announced: a $500B US buildout plan with OpenAI, Oracle and SoftBank.'; },
  ],
  2026: [
    s => { s.w.hype += 0.05; return 'Vera Rubin NVL72 racks ship to cloud providers. Gigawatt campuses start to come online.'; },
    s => { s.w.index *= 0.9; s.w.hype = Math.max(0.4, s.w.hype - 0.15); return 'Big AI stocks sell off as investors question infrastructure spending. Capex guidance holds, but the mood changes.'; },
  ],
  2027: [s => { s.w.gridStress = 2; return 'Power grid crunch. Utilities push new data center hookups back a year.'; }],
  2028: [s => { s.w.hype = Math.max(0.4, s.w.hype - 0.4); s.w.index *= 0.85; return 'AI market correction. Valuations reset and the IPO window narrows.'; }],
  2031: [s => { if (s.w.regLevel < 2) return null; s.w.regLevel = 3; return 'A licensing regime starts. Frontier training needs a government license.'; }],
  2033: [s => { s.w.wage *= 1.1; return 'Talent shortage again. Senior researcher salaries climb another 10 percent.'; }],
};

const RANDOM = [
  { p: s => (s.me.safety < 50 ? 0.2 : 0.07), when: s => s.me.products.length > 0, run: s => { bump(s.me, 'rep', -8); s.w.trust = clamp(s.w.trust - 6, 0, 100); return 'A chatbot of yours says something dangerous. The screenshot spreads faster than the fix.'; } },
  { p: () => 0.05, when: s => s.me.flagship && activeRivals(s).length > 0, run: s => { const r = pickRival(s); r.mods.talent *= 1.05; s.w.trust = clamp(s.w.trust - 2, 0, 100); return `Someone leaks your flagship weights. ${r.name} says it was "inspired".`; } },
  { p: () => 0.15, when: s => s.me.researchers >= 8, run: s => { s.me.researchers -= 3; spawnStartup(s, { researchers: 3, cash: 25 }); return 'Three of your researchers leave to found their own startup.'; } },
  { p: () => 0.1, when: s => s.me.products.length > 0, run: s => { bump(s.me, 'dist', 10); bump(s.me, 'rep', 3); return 'One of your products goes viral. Your brand is on every feed.'; } },
  { p: () => 0.1, when: s => activeRivals(s).length > 0, run: s => { const r = pickRival(s); r.discount = 0.5; return `${r.name} is quietly for sale at a discount.`; } },
  { p: () => 0.08, when: () => true, run: s => { s.w.priceShock *= 0.9; return 'A hydro power deal cuts data center electricity costs.'; } },
  { p: () => 0.08, when: () => true, run: s => { s.w.energyShock *= 1.3; return 'A heat wave pushes power prices up across the grid.'; } },
  { p: () => 0.12, when: s => s.me.products.length >= 2, run: s => { s.me.cash += 25 + s.me.revenue * 0.2; return 'A Fortune 500 company signs an enterprise contract.'; } },
  { p: () => 0.3, when: s => s.w.hype > 1.8, run: s => { s.w.hype -= 0.3; s.w.index *= 0.9; return 'AI bubble wobble. Public markets sell off and valuations reset.'; } },
  { p: () => 0.05, when: s => s.w.rate > 4, run: s => { s.w.recession = 2; s.w.hype = Math.max(0.4, s.w.hype - 0.2); s.w.index *= 0.85; return 'Recession. Ad budgets and VC checks shrink.'; } },
  { p: () => 0.1, when: s => activeRivals(s).length > 0, run: s => { const r = pickRival(s); r.researchers *= 0.8; return `Talent exodus at ${r.name}. Researchers take offers elsewhere.`; } },
  { p: () => 0.1, when: s => activeRivals(s).length > 0, run: s => { const r = pickRival(s); r.cash += 5000 * s.w.hype; return `${r.name} closes a mega-round from sovereign and strategic investors.`; } },
  { p: () => 0.1, when: s => activeRivals(s).length > 0, run: s => { const r = pickRival(s); r.algo *= 1.05; return `${r.name} ships a model that tops the open leaderboards.`; } },
  { p: () => 0.06, when: s => s.me.products.length > 0, run: s => { bump(s.me, 'rep', -3); return 'A cloud outage takes your API down for two days.'; } },
  { p: s => 0.1 * (1 - s.me.data.licensed / 100) * s.w.copyrightHeat, when: s => s.me.products.length > 0 && s.w.copyrightHeat > 0, run: s => { s.me.cash -= s.me.revenue * 0.05; s.me.lawsuits++; bump(s.me, 'rep', -4); return 'A publisher sues over training data. You settle quietly for 5% of revenue.'; } },
  { p: () => 0.05, when: s => s.me.execs.cfo, run: s => { s.me.execs.cfo = false; return 'Your CFO leaves for a company preparing an IPO. The board wants a replacement.'; } },
  { p: () => 0.1, when: s => s.me.safety >= 60 && s.me.gov < s.year, run: s => { s.me.gov = s.year + 3; return 'A defense agency offers a three-year contract for model access.'; } },
  { p: () => 0.08, when: s => s.me.valuation > 500, run: s => `A Gulf sovereign fund offers to invest. Scrutiny from Washington is the price of admission.` },
  { p: () => 0.1, when: s => s.w.index > 110, run: s => { s.w.hype += 0.1; return 'The tech IPO window reopens. Investors are hungry again.'; } },
];

function runEvents(s, news) {
  for (const f of SCRIPTED[s.year] ?? []) { const t = f(s); if (t) news.push(t); }
  for (const ev of RANDOM) if (ev.when(s) && chance(s, ev.p(s))) news.push(ev.run(s));
  if (s.year >= 2017 && chance(s, 0.3 * s.w.hype)) news.push(`${spawnStartup(s).name} emerges from stealth.`);
}
