(() => {
  const $ = sel => document.querySelector(sel);
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const pct = v => `${Math.round(v * 100)}%`;
  const bar = (v, max = 100, cls = '') => `<div class="bar ${cls}"><i style="width:${clamp(v / max * 100, 0, 100)}%"></i></div>`;
  const chip = (label, value, cls = '', sub = '') => `<div class="chip"><span>${label}</span><b class="${cls}">${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const row = (label, value) => `<div class="row"><span>${label}</span><b>${value}</b></div>`;
  const card = (title, body) => `<section class="card"><h3>${title}</h3>${body}</section>`;
  const costTag = c => (c > 0 ? `<i class="cost">-${money(c)}</i>` : c < 0 ? `<i class="cost gain">+${money(-c)}</i>` : '<i class="cost">free</i>');
  const TABS = [['overview', 'Overview'], ['hardware', 'Hardware'], ['research', 'Research'], ['talent', 'Talent'], ['products', 'Products'], ['finance', 'Finance'], ['policy', 'Policy'], ['rivals', 'Rivals'], ['market', 'Market'], ['log', 'Log']];
  const TAB_GROUPS = { hardware: ['Compute'], research: ['Research'], talent: ['Talent'], products: ['Products'], finance: ['Finance'], policy: ['Policy'], rivals: ['Rivals'] };
  const REG_NAMES = ['None', 'Voluntary guidelines', 'Binding rules', 'Licensing regime'];
  const SRC = 'docs/research.md';

  const SECTION_IMG = {
    start: { src: 'assets/sections/start.webp', alt: "Rows of server racks in a data center", credit: "Derrick Coetzee from Berkeley, CA, USA, CC0, via Wikimedia Commons" },
    overview: { src: 'assets/sections/overview.webp', alt: "NYSE trading floor, traders at their desks", credit: "Carol M. Highsmith, Public domain, via Wikimedia Commons" },
    hardware: { src: 'assets/sections/hardware.webp', alt: "GPU blades with liquid cooling", credit: "Steve Jurvetson, CC BY 4.0, via Wikimedia Commons" },
    research: { src: 'assets/sections/research.webp', alt: "Rows of racks in a data center hall", credit: "PiDatacenters, CC BY-SA 4.0, via Wikimedia Commons" },
    talent: { src: 'assets/sections/talent.webp', alt: "Engineers and scientists working as a team", credit: "U.S. Air Force AFRL by Keith C Lewis, Public domain, via Wikimedia Commons" },
    products: { src: 'assets/sections/products.webp', alt: "Source code on a computer monitor", credit: "Markus Spiske markusspiske, CC0, via Wikimedia Commons" },
    finance: { src: 'assets/sections/finance.webp', alt: "Antique stock ticker machine", credit: "Jaclyn Nash (photographer), Public domain, via Wikimedia Commons" },
    policy: { src: 'assets/sections/policy.webp', alt: "Parliament building at dusk", credit: "Thennicke, CC BY-SA 4.0, via Wikimedia Commons" },
    rivals: { src: 'assets/sections/rivals.webp', alt: "Frankfurt Stock Exchange floor", credit: "Ank Kumar, CC BY-SA 4.0, via Wikimedia Commons" },
    market: { src: 'assets/sections/market.webp', alt: "Bar chart of GPU maker market shares", credit: "Mark H., CC BY-SA 3.0, via Wikimedia Commons" },
    log: { src: 'assets/sections/log.webp', alt: "Server racks with blinking status lights", credit: "Victorgrigas, CC BY-SA 3.0, via Wikimedia Commons" },
  };

  let S = null, pathId = 'lab', companyName = 'Your AI Co', tab = 'overview', opts = [], scenarioId = 'base';

  function showScreen(id) { for (const el of document.querySelectorAll('.screen')) el.hidden = el.id !== id; }

  function banner(key) {
    const b = SECTION_IMG[key];
    if (!b) return '';
    return `<figure class="banner"><img src="${b.src}" alt="${esc(b.alt)}" width="1280" height="800" loading="lazy" decoding="async"><figcaption><span>Photo</span> ${esc(b.credit)}</figcaption></figure>`;
  }

  function runsList() { try { return JSON.parse(localStorage.getItem('it-runs') || '[]'); } catch (e) { return []; } }

  function recordRun() {
    if (S.recorded) return;
    S.recorded = true;
    const me = S.me, rank = rankOf(S), board = active(S).length;
    const runs = [{ name: me.name, path: PATHS[S.path].name, scenario: SCENARIOS[S.scenario ?? 'base'].name, title: S.verdict.title, rank, of: board, valuation: me.valuation, year: S.year, goals: Object.keys(S.goalsDone).length, goalTotal: PATHS[S.path].goals.length, at: new Date().toISOString().slice(0, 10) }, ...runsList()].slice(0, 10);
    try { localStorage.setItem('it-runs', JSON.stringify(runs)); } catch (e) { }
  }

  function runsCard() {
    const runs = runsList();
    if (!runs.length) return '';
    return `<section class="runs"><h3>Recent runs</h3><ol>${runs.map(r => `<li><b>${esc(r.name)}</b> <span class="muted">${esc(r.path)} · ${esc(r.scenario)}</span><span class="run-result">${esc(r.title)}, #${r.rank} of ${r.of}, ${money(r.valuation)}, ${r.goals}/${r.goalTotal} objectives</span><small class="muted">${r.at}</small></li>`).join('')}</ol><button class="ghost" id="clear-runs">Clear history</button></section>`;
  }

  function renderStart() {
    showScreen('start');
    $('#start').innerHTML = `
      <div class="start">
        ${banner('start')}
        <h1>Intelligence Tycoon</h1>
        <p class="lede">2016 to 2035. Found an AI company and race the real ones: OpenAI, Anthropic, NVIDIA, xAI and the rest. History runs on real numbers until 2026. After that, it's up to you.</p>
        <label class="name">Company name <input id="company-name" value="${esc(companyName)}" maxlength="28"></label>
        <div class="scenarios">${Object.entries(SCENARIOS).map(([id, sc]) => `<button class="scen${id === scenarioId ? ' on' : ''}" data-scenario="${id}" title="${esc(sc.blurb)}"><b>${esc(sc.name)}</b><small>${esc(sc.blurb)}</small></button>`).join('')}</div>
        <div class="paths">${Object.entries(PATHS).map(([id, p]) => `
          <div class="path${id === pathId ? ' selected' : ''}" data-path="${id}" tabindex="0" role="button">
            <h2>${p.name}</h2>
            <p class="blurb">${p.blurb}</p>
            <p class="meta">${money(p.start.cash)} cash · ${p.start.researchers} researchers · ${sumVals(p.start.fleet)} racks</p>
            <ul class="pros">${p.pros.map(x => `<li>${x}</li>`).join('')}</ul>
            <ul class="cons">${p.cons.map(x => `<li>${x}</li>`).join('')}</ul>
            <p class="objs"><b>Objectives:</b> ${p.goals.map(g => esc(g.text)).join(' · ')}</p>
          </div>`).join('')}
        </div>
        <button class="primary big" id="found">Found company</button>
        ${localStorage.getItem('it-save') ? '<button class="ghost" id="continue-save">Continue saved game</button>' : ''}
        <button class="ghost" id="help-start">How it works</button>
        ${runsCard()}
      </div>`;
  }

  function renderTop() {
    const me = S.me, board = active(S).sort((a, b) => b.valuation - a.valuation), rank = board.indexOf(me) + 1;
    const runway = me.net < 0 ? `${(Math.max(0, me.cash) / -me.net).toFixed(1)} yrs` : me.net > 0 ? 'profitable' : 'no burn yet';
    const power = `${Math.round(ownedMW(me))} / ${capacityMW(me) === Infinity ? '∞' : Math.round(capacityMW(me))} MW`;
    $('#top').innerHTML = `
      <div class="year">${S.year}</div>
      <div class="timeline"><i style="width:${(S.year - START_YEAR) / (END_YEAR - START_YEAR) * 100}%"></i></div>
      <div class="chips">
        ${chip('Cash', money(me.cash), me.cash < 0 ? 'bad' : '', `runway ${runway}`)}
        ${chip(me.public ? 'Market cap' : 'Valuation', money(me.valuation), '', me.public ? `IPO ${me.ipoYear}` : 'private')}
        ${chip('Rank', `#${rank} of ${board.length}`)}
        ${chip('Net worth', money(me.valuation * me.stake), '', `${pct(me.stake)} stake`)}
        ${chip('Power', power, '', `${totalRacksOf(me)} racks`)}
        ${chip('Index', Math.round(S.w.index), '', `rate ${S.w.rate.toFixed(1)}%`)}
        ${chip('Actions', `${S.ap} left`, '', `outflow ${money(me.revenue - me.net)}/yr`)}
      </div>
      <button class="ghost" id="help">How it works</button>
      <button class="ghost" id="save">Save</button>
      <button class="primary" id="end-year">End ${S.year} →</button>`;
  }

  function fleetRows(c) {
    const rows = Object.entries(c.fleet).filter(([, n]) => n > 0).map(([id, n]) => row(platOf(c, id).name, `${n} racks owned`));
    for (const [id, n] of Object.entries(c.rented)) if (n > 0) rows.push(row(platOf(c, id).name, `${n} racks rented`));
    return rows.join('') || '<p class="muted">No compute yet.</p>';
  }

  function renderTab() {
    const me = S.me, board = active(S).sort((a, b) => b.valuation - a.valuation);
    const fr = frontierOf(S), mine = opts.filter(o => TAB_GROUPS[tab]?.includes(o.group));
    const btn = o => `<button class="act" data-act="${o.key}" ${o.locked ? 'disabled' : ''} title="${esc(o.locked || o.name)}"><b>${esc(o.name)}</b>${costTag(o.cost)}<small>${esc(o.desc)}</small>${o.locked ? `<em>${esc(o.locked)}</em>` : ''}</button>`;
    const acts = list => `<div class="acts">${list.map(btn).join('')}</div>`;
    const cap = flagCapOf(me);
    let html = '';

    if (tab === 'overview') {
      const costs = me.revenue - me.cogs - me.net;
      html = `<div class="grid2">
        ${card(esc(me.name), `<p class="muted">${esc(PATHS[S.path].name)}</p>
          ${row('Founder stake', pct(me.stake))}${row('Employees', Math.round(me.researchers + me.engineers + me.sales))}
          ${row('Public', me.public ? `Yes, since ${me.ipoYear}` : 'Private')}${row('Debt', money(me.debt))}${row('Portfolio stakes', money(portfolioValue(S)))}
          <h3 class="sub">Flagship</h3>
          ${me.flagship ? `${row(me.flagship.name, `capability ${Math.round(cap)}`)}${bar(cap)}<p class="muted">Frontier ${Math.round(flagCapOf(fr))} (${esc(fr.name)}). Models age about 3 percent a year.</p>` : '<p class="muted">No model yet. Train one or fine-tune an open model.</p>'}
          <h3 class="sub">Products</h3><div class="tags">${me.products.length ? me.products.map(sid => `<span class="tag">${SEGMENTS[sid].name}</span>`).join('') : '<span class="muted">None launched</span>'}</div>`)}
        ${card('Last year', `${row('Revenue', money(me.revenue))}${row('Inference costs', money(me.cogs))}${row('Operating costs', money(costs))}${row('Net cash', money(me.net))}`)}
        ${card('Leaderboard', `<ol class="board">${board.slice(0, 10).map((c, i) => `<li class="${c === me ? 'me' : ''}"><span>${i + 1}. ${esc(c.name)}${c.real ? ' <small class="muted">real</small>' : ''}</span><b>${money(c.valuation)}</b></li>`).join('')}</ol>`)}
        ${card('Objectives', `<ul class="objs-list">${PATHS[S.path].goals.map((g, i) => `<li class="${i in S.goalsDone ? 'done' : ''}">${esc(g.text)}<small>${i in S.goalsDone ? `Done in ${S.goalsDone[i]}` : 'Open'}</small></li>`).join('')}</ul>`)}
        ${card('Valuation history', historyChart())}
        ${card('Latest news', `<ul class="log">${S.log.slice(-8).reverse().map(l => `<li><b>${l.year}</b>${esc(l.text)}</li>`).join('')}</ul>`)}
      </div>`;
    }

    if (tab === 'hardware') {
      const ps = platformsFor(me, S.year);
      html = `<div class="grid2">
        ${card('Your power and racks', `${row('Owned racks', totalRacksOf(me, 'owned'))}${row('Rented racks', totalRacksOf(me, 'rented'))}
          ${row('Power draw (owned)', `${Math.round(ownedMW(me))} MW`)}${row('Power capacity', capacityMW(me) === Infinity ? 'Unlimited (partner)' : `${Math.round(capacityMW(me))} MW`)}
          ${row('Chip allocation left', allocLeft(me, S.w, S.year))}${row('Chip shortage', pct(S.w.shortage))}
          ${row('Export controls', S.w.exportControl ? (me.mods.gov ? 'Exempt (domestic partner)' : 'Newest NVIDIA chips blocked') : 'Off')}
          ${row('Energy price', `$${Math.round(energyRate(me, S.w) / 0.01095)}/MWh`)}${row('Custom chip', me.customPlatforms.length ? me.customPlatforms.map(p => p.name).join(', ') : me.asic ? `in design, ready ${me.asic.ready}` : 'none')}
          <h3 class="sub">Fleet</h3>${fleetRows(me)}${Object.entries(me.leased).filter(([, n]) => n > 0).map(([id, n]) => row(`${platOf(me, id).name} leased out`, `${n} racks`)).join('')}
          <h3 class="sub">Campuses</h3>${me.dcs.map(d => row(regionById(d.region).name, `${d.mw} MW`)).join('') || '<p class="muted">No owned campuses. Rent racks or build one.</p>'}
          ${me.pendingDC.map(b => row(`${regionById(b.region).name}${b.smr ? ' (SMR)' : ''} building`, `online ${b.ready}`)).join('')}`)}
        ${card('Hardware catalog', `<div class="catalog"><table><tr><th>Platform</th><th>Year</th><th>TFLOPS/GPU</th><th>HBM GB</th><th>Rack $M</th><th>kW</th><th>Source</th></tr>
          ${PLATFORMS.map(p => `<tr class="${p.year <= S.year ? '' : 'future'}"><td>${esc(p.name)}${p.cloudOnly ? ' <small class="muted">cloud only</small>' : ''}</td><td>${p.year}</td><td>${p.tf.toLocaleString()}</td><td>${p.mem}</td><td>${p.rackM}</td><td>${p.kw}</td><td class="muted">${esc(p.src)}</td></tr>`).join('')}
          </table><p class="muted">A rack is 72 GPUs. Rack prices are compute and networking only. Rubin and later numbers are estimates or roadmap, see ${SRC}.</p></div>`)}
        ${card('Photos', `<div class="credits">${[['assets/tpu_v4.png', 'Google TPU v4', 'CC BY 4.0, Jouppi et al., via Wikimedia Commons'], ['assets/tpu_v3.jpg', 'Google TPU v3', 'CC BY-SA 4.0, Zinskauf, via Wikimedia Commons']].map(([src, n, l]) => `<figure class="photo"><img src="${src}" alt="${n}"><figcaption><b>${n}</b><small>${l}</small></figcaption></figure>`).join('')}</div>`)}
        ${card('Campus economics', `<p class="muted">Campus build cost is $${facilityPerMW(S.year)}M per MW at today's rates (AI-optimized, Turner and Townsend 2025 benchmark $20M+). A 100 MW campus costs about $${facilityPerMW(S.year) * MW_PER_BLOCK}M before chips. Grid queues are 2 to 4 years.</p>
          ${REGIONS.map(r => row(r.name, `$${r.price}/MWh, queue ${queueYears(S, r)} yrs, build $${dcCost(r, S).toFixed(0)}M`)).join('')}`)}
        ${card('Buy, rent and build', acts(mine))}
      </div>`;
    }

    if (tab === 'research') {
      html = `<div class="grid2">
        ${card('Models and training', `${me.training ? `<p>Training: <b>${TRAIN[me.training].name}</b>. Results at year end.</p>` : '<p class="muted">Nothing training right now.</p>'}
          ${me.flagship ? `${row('Flagship', me.flagship.name)}${row('Capability', Math.round(cap))}${row('Open weights', me.flagship.open ? 'Released' : 'Closed')}${row('Safety score', Math.round(me.safety))}` : ''}
          <p class="muted">Frontier runs need data quality 40, safety 50 under binding rules, and a license under licensing.</p>`)}
        ${card('Data', `${row('Data quality', Math.round(me.data.q))}${bar(me.data.q)}${row('Licensed share', `${Math.round(me.data.licensed)}%`)}${row('Lawsuit risk', pct(0.08 * (1 - me.data.licensed / 100) * S.w.copyrightHeat))}`)}
        ${card('Research actions', acts(mine))}
      </div>`;
    }

    if (tab === 'talent') {
      const attrition = clamp((60 - me.morale) / 400, 0, 0.12);
      html = `<div class="grid2">
        ${card('Team', `${row('Researchers', Math.round(me.researchers))}${row('Engineers', Math.round(me.engineers))}${row('Sales', Math.round(me.sales))}
          ${row('Chief Financial Officer', me.execs.cfo ? 'Hired' : 'Missing')}${row('Chief Revenue Officer', me.execs.cro ? 'Hired' : 'Missing')}
          <h3 class="sub">Morale ${Math.round(me.morale)}</h3>${bar(me.morale, 100, me.morale < 40 ? 'warn' : 'good')}
          <p class="muted">Expected attrition: about ${pct(attrition)} of researchers a year.</p>`)}
        ${card('Star researchers', `${S.stars.filter(st => st.owner === 'me').map(st => row(st.name, `ability ${st.ability.toFixed(1)}`)).join('') || '<p class="muted">None on your team.</p>'}
          <h3 class="sub">Everyone else</h3>${S.stars.filter(st => st.owner !== 'me').map(st => row(st.name, st.owner ? companyById(S, st.owner).name : 'Free agent')).join('')}
          <p class="muted">Star researchers are fictional. Real labs' staffing isn't public.</p>`)}
        ${card('Talent actions', acts(mine))}
      </div>`;
    }

    if (tab === 'products') {
      const shares = marketShares(S);
      html = `<div class="grid2">
        ${card('Market share by segment', Object.keys(SEGMENTS).map(sid => `<div class="mrow"><span>${SEGMENTS[sid].name} <small class="muted">unlock ${unlockOf(me, sid)}</small></span>
          ${shares[sid].length ? `<div class="stack">${shares[sid].map(x => `<i class="${x.id === 'me' ? 'me' : ''}" style="width:${x.share * 100}%" title="${esc(x.name)} ${pct(x.share)}"></i>`).join('')}</div><div class="mshare">${shares[sid].slice(0, 3).map(x => `${esc(x.name)} <b>${pct(x.share)}</b>`).join(' · ')}</div>` : '<div class="mshare">No sellers yet</div>'}</div>`).join('') + `<p class="muted">Pricing tier: ${me.pricing}.</p>`)}
        ${card('Your products', `${me.products.map(sid => row(SEGMENTS[sid].name, `${Math.round(flagCapOf(me) + polishOf(me))} quality`)).join('') || '<p class="muted">Nothing launched yet.</p>'}
          ${row('Enterprise sales reps', Math.round(me.sales))}${row('Distribution', Math.round(me.dist))}${row('Reputation', Math.round(me.rep))}${row('Ads', me.ads ? 'Live' : 'Off')}`)}
        ${card('Product actions', acts(mine))}
      </div>`;
    }

    if (tab === 'finance') {
      const r = ROUNDS[me.rounds.length];
      html = `<div class="grid2">
        ${card('Cap table', `${row('Founder stake', pct(me.stake))}${row('Valuation', money(me.valuation))}${row('Cash', money(me.cash))}${row('Debt', money(me.debt))}
          ${row('Status', me.public ? `Public since ${me.ipoYear}` : 'Private')}${row('Portfolio stakes', money(portfolioValue(S)))}
          <h3 class="sub">Funding history</h3>${me.rounds.map(x => row(x.name, `${x.year}`)).join('') || '<p class="muted">No rounds yet.</p>'}
          <p class="muted">${r ? `Next: ${r.name}, needs ${r.ask}.` : 'No private rounds left. Go public.'}</p>`)}
        ${card('How funding works', `<p class="muted">Rounds sell a fixed slice of the company at today's valuation. Sovereign money brings capital and scrutiny. Strategic stakes in rivals count toward your portfolio, not your rank.</p>`)}
        ${card('Finance actions', acts(mine))}
      </div>`;
    }

    if (tab === 'policy') {
      html = `<div class="grid2">
        ${card('World', `${row('Regulation', REG_NAMES[S.w.regLevel])}${row('Export controls', S.w.exportControl ? 'On' : 'Off')}${row('Public trust', Math.round(S.w.trust))}${bar(S.w.trust)}
          ${row('Interest rate', `${S.w.rate.toFixed(1)}%`)}${row('Market index', Math.round(S.w.index))}${row('Hype', S.w.hype.toFixed(2))}
          ${row('Chip shortage', pct(S.w.shortage))}${row('Energy price shock', `${S.w.energyShock.toFixed(2)}x`)}${row('Lobbying', me.lobbyUntil >= S.year ? 'Active' : 'Off')}`)}
        ${card('Policy actions', acts(mine))}
      </div>`;
    }

    if (tab === 'rivals') {
      const rivals = board.filter(c => c !== me);
      html = `${card('Rivals', `<div class="rivals">${rivals.map(c => rivalRow(c)).join('') || '<span class="muted">No rivals left standing.</span>'}</div>`)}
        <p class="muted">Out of the race: ${S.rivals.filter(r => r.status === 'dead' || r.status === 'acquired').map(r => esc(r.name)).join(', ') || 'none yet'}.</p>`;
    }

    if (tab === 'market') {
      html = `<div class="grid2">
        ${card('Logos and credits', `<div class="credits">${[['anthropic', 'Anthropic', 'Public domain, via Wikimedia Commons'], ['deepseek', 'DeepSeek', 'MIT, via Wikimedia Commons'], ['mistral', 'Mistral AI', 'Public domain, via Wikimedia Commons'], ['nvidia', 'NVIDIA', 'Apache-2.0, per Wikimedia Commons metadata']].map(([k, n, l]) => `<div class="credit"><img src="${LOGOS[k]}" alt="${n} logo"><small>${n}. ${l}.</small></div>`).join('')}</div><p class="muted">Logos are trademarks of their owners and are shown only to identify the companies.</p>`)}
        ${card('Capex and supply (public reports)', `${[
          ['Amazon 2026 capex', money(REAL.capex.amazon2026Usd)],
          ['Alphabet 2026 capex', `${money(REAL.capex.alphabet2026Usd)} (${REAL.capex.alphabetNote})`],
          ['Microsoft 2026 capex', money(REAL.capex.microsoft2026Usd)],
          ['Meta 2026 capex', `${money(REAL.capex.meta2026Usd)} (${REAL.capex.metaNote})`],
          ['Big four 2025 to 2026 combined', `${money(REAL.capex.bigFour2025Usd)} to ${money(REAL.capex.bigFour2026Usd)}`],
          ['China AI capex 2026 (Rhodium estimate)', money(REAL.capex.chinaAi2026Usd)],
          ['Alibaba capex, quarter to June 2026', money(REAL.capex.alibabaQ2_2026Usd)],
          ['CoreWeave 2026 capex guidance', `${money(REAL.capex.coreweave2026Usd)} (${REAL.capex.coreweaveNote})`],
          ['CoreWeave revenue backlog, Sept 2026', money(REAL.capex.coreweaveBacklogUsd)],
          ['DRAM revenue, Q3 2026', `${money(REAL.memory.dramRevenueQ3_2026Usd)} (${REAL.memory.dramRevenueNote})`],
          ['DDR5 16Gb contract price', `$${REAL.memory.ddr5_16Gb_contractUsd['2025-10']} (Oct 2025) to $${REAL.memory.ddr5_16Gb_contractUsd['2026-09']} (Sept 2026)`],
          ['CoWoS wafers per month, end 2026', `${REAL.memory.cowosWafersPerMonthEnd2026.toLocaleString('en-US')} (analyst estimate)`],
          ['Memory tightness in game', `${Math.round(S.w.memTight * 100)}% (raises rack prices up to 50%)`],
        ].map(([l, v]) => row(l, v)).join('')}<p class="muted">Sources listed in docs/research.md and data/real.json.</p>`)}
        ${card('Real anchors', `<p class="muted">Valuations and revenue from public reports through 2026. Before 2026 each real company follows its anchors. After 2026 the simulation takes over.</p>
          ${S.rivals.filter(r => r.real).map(r => `<div class="anchor"><b>${esc(r.name)}</b><small class="muted">founded ${r.founded}${r.status !== 'active' ? ` · ${r.status}` : ''}</small>
            <small>${r.anchors?.val ? 'Valuation: ' + Object.entries(r.anchors.val).map(([y, v]) => `${y} ${money(v)}`).join(' · ') : ''}</small>
            ${r.anchors?.rev ? `<small>Revenue: ${Object.entries(r.anchors.rev).map(([y, v]) => `${y} ${money(v)}`).join(' · ')}</small>` : ''}</div>`).join('')}`)}
        ${card('Total market', `${row('Global AI revenue pool, this year', money(TAM[S.year - START_YEAR]))}${row('Sources', `see ${SRC}`)}
          <p class="muted">The pool is a game estimate, roughly matching 2025 and 2026 run-rates from public reports. Long-range numbers are scenario guesses.</p>`)}
      </div>`;
    }

    if (tab === 'log') {
      html = card('Full log', `<ul class="log tall">${S.log.slice().reverse().map(l => `<li><b>${l.year}</b>${esc(l.text)}</li>`).join('')}</ul>`);
    }

    $('#content').innerHTML = banner(tab) + html;
  }

  const LOGOS = { anthropic: 'assets/anthropic.svg', deepseek: 'assets/deepseek.svg', mistral: 'assets/mistral.svg', nvidia: 'assets/nvidia.svg' };

  function rivalRow(c) {
    const by = Object.fromEntries(opts.map(o => [o.key, o]));
    const po = by[`poach:${c.id}`], ac = by[`acquire:${c.id}`], inv = by[`invest:${c.id}`];
    const b = o => (o ? `${o.locked ? 'disabled' : ''} title="${esc(o.locked || o.name)}"` : 'disabled');
    return `<div class="rival">
      <div>${LOGOS[c.id] ? `<img class="logo" src="${LOGOS[c.id]}" alt="">` : ''}<b>${esc(c.name)}</b>${c.real ? ' <small class="muted">real</small>' : ''}<small>${esc(c.type)} · ${money(c.valuation)} · cap ${Math.round(flagCapOf(c))} · ${totalRacksOf(c)} racks · ${c.products.length} products${c.public ? ' · public' : ''}</small></div>
      <div class="rbtns">
        <button data-act="invest:${c.id}" ${b(inv)}>Stake 5%</button>
        <button data-act="poach:${c.id}" ${b(po)}>Poach</button>
        <button data-act="acquire:${c.id}" ${b(ac)}>${ac ? esc(ac.name.replace('Acquire for ', '')) : 'Acquire'}</button>
      </div></div>`;
  }

  function historyChart() {
    const h = S.history;
    if (h.length < 2) return '<p class="muted">Chart appears after the first year.</p>';
    const vals = h.map(x => Math.log10(Math.max(1, x.valuation))), lo = Math.min(...vals), hi = Math.max(...vals, lo + 1);
    const pts = vals.map((v, i) => `${(i / (h.length - 1)) * 640 + 20},${200 - ((v - lo) / (hi - lo)) * 170 - 15}`).join(' ');
    return `<svg viewBox="0 0 680 230" preserveAspectRatio="xMidYMid meet"><polyline points="${pts}" fill="none" stroke="#3dd68c" stroke-width="3"/>
      <text x="20" y="225" fill="#7d8ba3" font-size="12">${h[0].year}</text><text x="660" y="225" fill="#7d8ba3" font-size="12" text-anchor="end">${h[h.length - 1].year}</text>
      <text x="20" y="18" fill="#7d8ba3" font-size="12">Valuation, log scale</text></svg>`;
  }

  function renderGame() {
    showScreen('game');
    opts = Engine.options(S);
    renderTop();
    $('#tabs').innerHTML = TABS.map(([id, label]) => `<button class="tab${id === tab ? ' on' : ''}" data-tab="${id}">${label}</button>`).join('');
    renderTab();
  }

  function showReport(r, over) {
    const b = r.before, a = r.after;
    const row2 = (label, from, to) => `<div class="rrow"><span>${label}</span><b>${from ? `${from} → ${to}` : to}</b></div>`;
    $('#modal').innerHTML = `<div class="modal">
      <h2>${r.year} in review</h2>
      ${row2('Valuation', money(b.valuation), money(a.valuation))}
      ${row2('Cash', money(b.cash), money(a.cash))}
      ${row2('Rank', `#${b.rank}`, `#${a.rank}`)}
      ${row2('Revenue', '', money(a.revenue))}
      ${row2('Net cash', '', money(a.net))}
      ${row2('Stake', pct(b.stake), pct(a.stake))}
      ${row2('Market index / rate', `${Math.round(a.index)} / ${a.rate.toFixed(1)}%`, '')}
      ${row2('Capability', '', `${Math.round(a.cap)} (frontier ${Math.round(a.frontier)}, ${esc(a.frontierName)})`)}
      <ul class="news">${r.news.length ? r.news.map(n => `<li>${esc(n)}</li>`).join('') : '<li class="muted">A quiet year.</li>'}</ul>
      <button class="primary" id="continue">${over ? 'See results' : `Start ${S.year}`}</button>
    </div>`;
    $('#modal').hidden = false;
  }

  function showHelp() {
    $('#modal').innerHTML = `<div class="modal wide">
      <h2>How it works</h2>
      <ul class="help">
        <li><b>Turns.</b> Each turn is a year. You spend action points, then end the year. Costs, revenue, training, hiring and rival moves resolve at year end.</li>
        <li><b>Hardware.</b> Real GPU platforms from P100 (2016) to Blackwell GB200 and Vera Rubin, plus AMD MI455X and TPU v7. Racks are 72 GPUs. Each rack has a real price and power draw, so buying racks means finding megawatts. Campuses take 2 to 4 years to get grid power. Chip allocation tightens in shortages. Export controls block the newest NVIDIA parts for most buyers.</li>
        <li><b>Models.</b> Capability is your effective compute relative to the frontier, times data, algorithms and stars. Models age, so you must retrain to keep up. Fine-tuning borrowed open weights is cheap but capped near half the frontier.</li>
        <li><b>Custom silicon.</b> Designing your own accelerator takes three years and a strong research team. It lands near 1.8 times the current NVIDIA part at 60 percent of the rack price.</li>
        <li><b>Power.</b> Energy is priced by region. Clean power contracts cut costs. Small modular reactors take four years.</li>
        <li><b>Real rivals.</b> OpenAI, Anthropic, xAI, NVIDIA, Mistral, SSI and Thinking Machines follow public valuation and revenue reports through 2026. After 2026 they play by the same rules as you. Google, Meta and Microsoft AI are simulated divisions, since their AI units have no separate valuation.</li>
        <li><b>Finance.</b> Rounds have milestones. Debt is backed by GPUs. An IPO needs a CFO, $500M revenue and a healthy market. Sovereign money brings capital and scrutiny. You can take 5 percent stakes in rivals.</li>
        <li><b>Policy.</b> Regulation tightens over time. Binding rules need safety 50 for frontier releases. Licensing needs a permit. Copyright lawsuits follow unlicensed data. Acquisitions face antitrust review above 40 percent segment share.</li>
        <li><b>Winning.</b> The highest valuation in ${END_YEAR} wins. Going bankrupt ends the game early.</li>
      </ul>
      <button class="primary" id="close-help">Close</button>
    </div>`;
    $('#modal').hidden = false;
  }

  function realLadder() {
    const rows = [{ name: S.me.name, value: S.me.valuation, you: true, note: `${S.year}` }];
    for (const r of S.rivals) {
      if (!r.real || !r.anchors?.val) continue;
      const v = anchorAt(r.anchors.val, HISTORY_END);
      if (v) rows.push({ name: r.name, value: v, you: false, note: `${HISTORY_END} reported` });
    }
    return rows.sort((a, b) => b.value - a.value);
  }

  function shareText() {
    const me = S.me;
    return `${me.name} (${PATHS[S.path].name}, ${SCENARIOS[S.scenario ?? 'base'].name}): ${S.verdict.title}. #${rankOf(S)} of ${active(S).length} by valuation in ${END_YEAR}, ${money(me.valuation)}. Intelligence Tycoon`;
  }

  function renderEnd() {
    showScreen('end');
    recordRun();
    const v = S.verdict, ladder = realLadder(), max = Math.max(...ladder.map(x => x.value));
    $('#end').innerHTML = `<div class="end">
      ${banner('market')}
      <h1>${esc(v.title)}</h1>
      <p class="lede">${esc(S.me.name)}: ${esc(v.text)}</p>
      <div class="share"><button class="primary" id="copy-share">Copy result</button><span id="share-status" class="muted" aria-live="polite"></span></div>
      ${card('Your valuation next to the real 2026 leaders', `<p class="muted">Real figures are the latest reported valuations for each company in 2026. Your figure is the simulated one for ${END_YEAR}.</p><ol class="ladder">${ladder.map(x => `<li class="${x.you ? 'you' : ''}"><span class="lname">${esc(x.name)}<small>${esc(x.note)}</small></span><span class="lbar"><i style="width:${(x.value / max * 100).toFixed(2)}%"></i></span><b>${money(x.value)}</b></li>`).join('')}</ol>`)}
      ${historyChart()}
      ${card(`Objectives (${Object.keys(S.goalsDone).length} of ${PATHS[S.path].goals.length})`, `<ul class="objs-list">${PATHS[S.path].goals.map((g, i) => `<li class="${i in S.goalsDone ? 'done' : ''}">${esc(g.text)}<small>${i in S.goalsDone ? `Done in ${S.goalsDone[i]}` : 'Missed'}</small></li>`).join('')}</ul>`)}
      <button class="primary big" id="again">Play again</button>
    </div>`;
  }

  async function copyShare() {
    const text = shareText(), status = $('#share-status');
    try { await navigator.clipboard.writeText(text); status.textContent = 'Copied.'; }
    catch (e) { status.textContent = text; }
  }

  function isTyping(e) { return ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName); }

  function cycleTab(step) {
    const i = TABS.findIndex(([id]) => id === tab);
    tab = TABS[(i + step + TABS.length) % TABS.length][0];
    renderGame();
  }

  function saveGame() { try { localStorage.setItem('it-save', JSON.stringify(S)); } catch (e) { } }
  function loadGame() { const raw = localStorage.getItem('it-save'); if (!raw) return false; S = JSON.parse(raw); tab = 'overview'; renderGame(); return true; }

  function newGame() {
    const seed = Math.floor(Math.random() * 1e9) + 1;
    S = Engine.newGame(pathId, (companyName || '').trim().slice(0, 28) || 'Untitled AI', seed, scenarioId);
    tab = 'overview';
    renderGame();
  }

  document.addEventListener('input', e => { if (e.target.id === 'company-name') companyName = e.target.value; });

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-path],[data-act],[data-tab],[data-scenario],#found,#end-year,#continue,#again,#help,#help-start,#close-help,#continue-save,#save,#clear-runs,#copy-share');
    if (!t || t.disabled) return;
    if (t.dataset.path) { pathId = t.dataset.path; renderStart(); }
    else if (t.dataset.scenario) { scenarioId = t.dataset.scenario; renderStart(); }
    else if (t.id === 'found') newGame();
    else if (t.id === 'continue-save') loadGame();
    else if (t.id === 'clear-runs') { localStorage.removeItem('it-runs'); renderStart(); }
    else if (t.id === 'save') { saveGame(); t.textContent = 'Saved'; }
    else if (t.dataset.tab) { tab = t.dataset.tab; renderGame(); }
    else if (t.dataset.act) { Engine.act(S, t.dataset.act); renderGame(); }
    else if (t.id === 'end-year') { const r = Engine.endYear(S); saveGame(); renderGame(); showReport(r, S.over); }
    else if (t.id === 'continue') { $('#modal').hidden = true; if (S.over) renderEnd(); }
    else if (t.id === 'again') renderStart();
    else if (t.id === 'copy-share') copyShare();
    else if (t.id === 'help' || t.id === 'help-start') showHelp();
    else if (t.id === 'close-help') $('#modal').hidden = true;
  });

  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('path')) { e.preventDefault(); e.target.click(); return; }
    if (e.key === 'Escape' && !$('#modal').hidden) { $('#modal').hidden = true; return; }
    if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey || $('#game').hidden || !$('#modal').hidden) return;
    if (e.key === 'e' || e.key === 'E') { if (!$('#end-year').disabled) $('#end-year').click(); }
    else if (e.key === ']') cycleTab(1);
    else if (e.key === '[') cycleTab(-1);
    else if (e.key === '?') showHelp();
  });

  renderStart();
})();
