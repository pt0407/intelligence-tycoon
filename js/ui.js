(() => {
  const $ = sel => document.querySelector(sel);
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const pct = v => `${Math.round(v * 100)}%`;
  const bar = (v, max = 100, cls = '') => `<div class="bar ${cls}"><i style="width:${clamp(v / max * 100, 0, 100)}%"></i></div>`;
  const chip = (label, value, cls = '', sub = '') => `<div class="chip"><span>${label}</span><b class="${cls}">${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const row = (label, value) => `<div class="row"><span>${label}</span><b>${value}</b></div>`;
  const card = (title, body) => `<section class="card"><h3>${title}</h3>${body}</section>`;
  const costTag = c => (c > 0 ? `<i class="cost">-${money(c)}</i>` : c < 0 ? `<i class="cost gain">+${money(-c)}</i>` : '<i class="cost">free</i>');
  const TABS = [['overview', 'Overview'], ['research', 'Research'], ['talent', 'Talent'], ['products', 'Products'], ['finance', 'Finance'], ['policy', 'Policy'], ['rivals', 'Rivals'], ['log', 'Log']];
  const TAB_GROUPS = { talent: ['Talent'], research: ['Compute', 'Research'], products: ['Products'], finance: ['Finance'], policy: ['Policy'], rivals: ['Rivals'] };
  const REG_NAMES = ['None', 'Voluntary guidelines', 'Binding rules', 'Licensing regime'];

  let S = null, pathId = 'lab', companyName = 'Your AI Co', tab = 'overview', opts = [];

  function showScreen(id) { for (const el of document.querySelectorAll('.screen')) el.hidden = el.id !== id; }

  function renderStart() {
    showScreen('start');
    $('#start').innerHTML = `
      <div class="start">
        <h1>Intelligence Tycoon</h1>
        <p class="lede">2016 to 2035. Found an AI company, survive the hype cycles and chip shortages, and try to end up the most valuable AI company on earth.</p>
        <label class="name">Company name <input id="company-name" value="${esc(companyName)}" maxlength="28"></label>
        <div class="paths">${Object.entries(PATHS).map(([id, p]) => `
          <div class="path${id === pathId ? ' selected' : ''}" data-path="${id}" tabindex="0" role="button">
            <h3>${p.name}</h3>
            <p class="blurb">${p.blurb}</p>
            <p class="meta">${money(p.start.cash)} cash · ${p.start.researchers} researchers · ${totalClustersOf({ fleet: p.start.fleet })} clusters</p>
            <ul class="pros">${p.pros.map(x => `<li>${x}</li>`).join('')}</ul>
            <ul class="cons">${p.cons.map(x => `<li>${x}</li>`).join('')}</ul>
            <p class="objs"><b>Objectives:</b> ${p.goals.map(g => esc(g.text)).join(' · ')}</p>
          </div>`).join('')}
        </div>
        <button class="primary big" id="found">Found company</button>
        <button class="ghost" id="help-start">How it works</button>
      </div>`;
  }

  function renderTop() {
    const me = S.me, board = active(S).sort((a, b) => b.valuation - a.valuation), rank = board.indexOf(me) + 1;
    const burn = me.revenue - me.net;
    const runway = me.net < 0 ? `${(Math.max(0, me.cash) / -me.net).toFixed(1)} yrs` : me.net > 0 ? 'profitable' : 'no burn yet';
    $('#top').innerHTML = `
      <div class="year">${S.year}</div>
      <div class="timeline"><i style="width:${(S.year - START_YEAR) / (END_YEAR - START_YEAR) * 100}%"></i></div>
      <div class="chips">
        ${chip('Cash', money(me.cash), me.cash < 0 ? 'bad' : '', `runway ${runway}`)}
        ${chip(me.public ? 'Market cap' : 'Valuation', money(me.valuation), '', me.public ? `IPO ${me.ipoYear}` : 'private')}
        ${chip('Rank', `#${rank} of ${board.length}`)}
        ${chip('Net worth', money(me.valuation * me.stake), '', `${pct(me.stake)} stake`)}
        ${chip('Index', Math.round(S.w.index), '', `rate ${S.w.rate.toFixed(1)}%`)}
        ${chip('Hype', S.w.hype.toFixed(2), S.w.hype > 1.8 ? 'bad' : '', `trust ${Math.round(S.w.trust)}`)}
        ${chip('Actions', `${S.ap} left`, '', `outflow ${money(burn)}/yr`)}
      </div>
      <button class="ghost" id="help">How it works</button>
      <button class="primary" id="end-year">End ${S.year} →</button>`;
  }

  function fleetRows(c) {
    const rows = Object.entries(c.fleet).filter(([, n]) => n > 0).map(([g, n]) => row(GPU_GENS[g - 1].name, `${n} clusters`));
    if (c.rentedClusters) rows.push(row('Rented', `${c.rentedClusters} clusters`));
    return rows.join('') || '<p class="muted">No compute yet.</p>';
  }

  function renderTab() {
    const me = S.me, board = active(S).sort((a, b) => b.valuation - a.valuation);
    const fr = frontierOf(S), mine = opts.filter(o => TAB_GROUPS[tab]?.includes(o.group));
    const btn = o => `<button class="act" data-act="${o.key}" ${o.locked ? 'disabled' : ''} title="${esc(o.locked || o.name)}"><b>${esc(o.name)}</b>${costTag(o.cost)}<small>${esc(o.desc)}</small>${o.locked ? `<em>${esc(o.locked)}</em>` : ''}</button>`;
    const acts = () => `<div class="acts">${mine.map(btn).join('')}</div>`;
    const cap = flagCapOf(me);
    let html = '';

    if (tab === 'overview') {
      const costs = me.revenue - me.cogs - me.net;
      html = `<div class="grid2">
        ${card(esc(me.name), `<p class="muted">${esc(PATHS[S.path].name)}</p>
          ${row('Founder stake', pct(me.stake))}${row('Employees', Math.round(me.researchers + me.engineers + me.sales))}
          ${row('Public', me.public ? `Yes, since ${me.ipoYear}` : 'Private')}${row('Debt', money(me.debt))}${row('Lawsuits settled', me.lawsuits)}
          <h3 class="sub">Flagship</h3>
          ${me.flagship ? `${row(me.flagship.name, `capability ${Math.round(cap)}`)}${bar(cap)}<p class="muted">Frontier ${Math.round(flagCapOf(fr))} (${esc(fr.name)}). Models age about 3 percent a year.</p>` : '<p class="muted">No model yet. Train one or fine-tune an open model.</p>'}
          <h3 class="sub">Products</h3><div class="tags">${me.products.length ? me.products.map(sid => `<span class="tag">${SEGMENTS[sid].name}</span>`).join('') : '<span class="muted">None launched</span>'}</div>`)}
        ${card('Last year', `${row('Revenue', money(me.revenue))}${row('Inference costs', money(me.cogs))}${row('Operating costs', money(costs))}${row('Net cash', money(me.net))}`)}
        ${card('Leaderboard', `<ol class="board">${board.slice(0, 10).map((c, i) => `<li class="${c === me ? 'me' : ''}"><span>${i + 1}. ${esc(c.name)}</span><b>${money(c.valuation)}</b></li>`).join('')}</ol>`)}
        ${card('Objectives', `<ul class="objs-list">${PATHS[S.path].goals.map((g, i) => `<li class="${i in S.goalsDone ? 'done' : ''}">${esc(g.text)}<small>${i in S.goalsDone ? `Done in ${S.goalsDone[i]}` : 'Open'}</small></li>`).join('')}</ul>`)}
        ${card('Valuation history', historyChart())}
        ${card('Latest news', `<ul class="log">${S.log.slice(-8).reverse().map(l => `<li><b>${l.year}</b>${esc(l.text)}</li>`).join('')}</ul>`)}
      </div>`;
    }

    if (tab === 'research') {
      const alloc = allocLeft(me, S.w), gen = curGen(S.year);
      html = `<div class="grid2">
        ${card('Compute', `${row('Current chip generation', `${gen.name} · $${clusterPrice(S.year, S.w).toFixed(0)}M per cluster`)}
          ${row('Clusters owned', totalClustersOf(me))}${row('Power capacity', `${totalClustersOf(me)} / ${capacityMW(me) === Infinity ? '∞' : capacityMW(me)} MW`)}
          ${row('Chip allocation left this year', alloc)}${row('Export controls', S.w.exportControl ? (me.mods.gov ? 'Exempt (domestic partner)' : 'Blocks newest generation') : 'Off')}
          ${row('Chip shortage', pct(S.w.shortage))}${row('Power price index', `${avgPowerFactor(me).toFixed(2)}x`)}
          <h3 class="sub">Fleet</h3>${fleetRows(me)}
          <h3 class="sub">Data centers</h3>${me.dcs.map(id => row(regionById(id).name, `${DC_BLOCK_MW} MW`)).join('') || '<p class="muted">None. Clusters can only be rented.</p>'}
          ${me.pendingDC.map(b => row(`${regionById(b.region).name} (building)`, `online ${b.ready}`)).join('')}`)}
        ${card('Models and training', `${me.training ? `<p>Training: <b>${TRAIN[me.training].name}</b>. Results at year end.</p>` : '<p class="muted">Nothing training right now.</p>'}
          ${me.flagship ? `${row('Flagship', me.flagship.name)}${row('Capability', Math.round(cap))}${row('Open weights', me.flagship.open ? 'Released' : 'Closed')}${row('Safety score', Math.round(me.safety))}` : ''}
          <p class="muted">Frontier runs need data quality 40, safety 50 under binding rules, and a license under licensing.</p>`)}
        ${card('Data', `${row('Data quality', Math.round(me.data.q))}${bar(me.data.q)}${row('Licensed share', `${Math.round(me.data.licensed)}%`)}${row('Lawsuit risk', pct(0.08 * (1 - me.data.licensed / 100) * S.w.copyrightHeat))}`)}
        ${card('Compute actions', acts())}
      </div>`;
    }

    if (tab === 'talent') {
      const attrition = clamp((60 - me.morale) / 400, 0, 0.12);
      const free = S.stars.filter(st => !st.owner);
      html = `<div class="grid2">
        ${card('Team', `${row('Researchers', Math.round(me.researchers))}${row('Engineers', Math.round(me.engineers))}${row('Sales', Math.round(me.sales))}
          ${row('Chief Financial Officer', me.execs.cfo ? 'Hired' : 'Missing')}${row('Chief Revenue Officer', me.execs.cro ? 'Hired' : 'Missing')}
          <h3 class="sub">Morale ${Math.round(me.morale)}</h3>${bar(me.morale, 100, me.morale < 40 ? 'warn' : 'good')}
          <p class="muted">Expected attrition: about ${pct(attrition)} of researchers a year.</p>`)}
        ${card('Star researchers', `${S.stars.filter(st => st.owner === 'me').map(st => row(st.name, `ability ${st.ability.toFixed(1)}`)).join('') || '<p class="muted">None on your team.</p>'}
          <h3 class="sub">Available or poachable</h3>${S.stars.filter(st => st.owner !== 'me').map(st => row(st.name, `${st.owner ? companyById(S, st.owner).name : 'Free agent'}`)).join('')}
          <p class="muted">${free.length} free agents. Stars add research output and company value.</p>`)}
        ${card('Talent actions', acts())}
      </div>`;
    }

    if (tab === 'products') {
      const shares = marketShares(S);
      html = `<div class="grid2">
        ${card('Market share by segment', Object.keys(SEGMENTS).map(sid => `<div class="mrow"><span>${SEGMENTS[sid].name} <small class="muted">unlock ${unlockOf(me, sid)}</small></span>
          ${shares[sid].length ? `<div class="stack">${shares[sid].map(x => `<i class="${x.id === 'me' ? 'me' : ''}" style="width:${x.share * 100}%" title="${esc(x.name)} ${pct(x.share)}"></i>`).join('')}</div><div class="mshare">${shares[sid].slice(0, 3).map(x => `${esc(x.name)} <b>${pct(x.share)}</b>`).join(' · ')}</div>` : '<div class="mshare">No sellers yet</div>'}</div>`).join('') + `<p class="muted">Pricing tier: ${me.pricing}. Free tiers win users, premium tiers win revenue per user.</p>`)}
        ${card('Your products', `${me.products.map(sid => row(SEGMENTS[sid].name, `${Math.round(flagCapOf(me) + polishOf(me))} quality`)).join('') || '<p class="muted">Nothing launched yet.</p>'}
          ${row('Enterprise sales reps', Math.round(me.sales))}${row('Distribution', Math.round(me.dist))}${row('Reputation', Math.round(me.rep))}`)}
        ${card('Product actions', acts())}
      </div>`;
    }

    if (tab === 'finance') {
      const r = ROUNDS[me.rounds.length];
      html = `<div class="grid2">
        ${card('Cap table', `${row('Founder stake', pct(me.stake))}${row('Valuation', money(me.valuation))}${row('Cash', money(me.cash))}${row('Debt', money(me.debt))}
          ${row('Status', me.public ? `Public since ${me.ipoYear}` : 'Private')}
          <h3 class="sub">Funding history</h3>${me.rounds.map(x => row(x.name, `${x.year}`)).join('') || '<p class="muted">No rounds yet.</p>'}
          <p class="muted">${r ? `Next: ${r.name}, needs ${r.ask}.` : 'No private rounds left. Go public.'}</p>`)}
        ${card('How funding works', `<p class="muted">Rounds sell a fixed slice of the company at today's valuation. Each raise dilutes your stake and adds cash. A CFO is required for later rounds and the IPO. After listing, quarterly losses pile pressure on the board.</p>`)}
        ${card('Finance actions', acts())}
      </div>`;
    }

    if (tab === 'policy') {
      html = `<div class="grid2">
        ${card('World', `${row('Regulation', REG_NAMES[S.w.regLevel])}${row('Export controls', S.w.exportControl ? 'On' : 'Off')}${row('Public trust', Math.round(S.w.trust))}${bar(S.w.trust)}
          ${row('Interest rate', `${S.w.rate.toFixed(1)}%`)}${row('Market index', Math.round(S.w.index))}${row('Hype', S.w.hype.toFixed(2))}
          ${row('Chip shortage', pct(S.w.shortage))}${row('Recession', S.w.recession > 0 ? 'Yes' : 'No')}${row('Lobbying', me.lobbyUntil >= S.year ? 'Active' : 'Off')}`)}
        ${card('Policy actions', acts())}
      </div>`;
    }

    if (tab === 'rivals') {
      const rivals = board.filter(c => c !== me);
      html = `${card('Rivals', `<div class="rivals">${rivals.map(c => rivalRow(c)).join('') || '<span class="muted">No rivals left standing.</span>'}</div>`)}
        <p class="muted">Gone or acquired: ${S.rivals.filter(r => r.status !== 'active' && r.status !== 'future').map(r => esc(r.name)).join(', ') || 'none yet'}.</p>`;
    }

    if (tab === 'log') {
      html = card('Full log', `<ul class="log tall">${S.log.slice().reverse().map(l => `<li><b>${l.year}</b>${esc(l.text)}</li>`).join('')}</ul>`);
    }

    $('#content').innerHTML = html;
  }

  function rivalRow(c) {
    const by = Object.fromEntries(opts.map(o => [o.key, o]));
    const po = by[`poach:${c.id}`], ac = by[`acquire:${c.id}`];
    const b = o => (o ? `${o.locked ? 'disabled' : ''} title="${esc(o.locked || o.name)}"` : 'disabled');
    return `<div class="rival">
      <div><b>${esc(c.name)}</b><small>${esc(c.type)} · ${money(c.valuation)} · cap ${Math.round(flagCapOf(c))} · ${c.products.length} products · ${Math.round(c.researchers)} researchers${c.public ? ' · public' : ''}</small></div>
      <div class="rbtns">
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
        <li><b>Compute.</b> Clusters come in GPU generations. Each generation is roughly 2 to 3 times faster and costs more. Chip allocation tightens during shortages. Clusters need data center megawatts, which take a grid queue to build. Renting costs a premium every year.</li>
        <li><b>Models.</b> Capability is your effective compute relative to the frontier (the best flagship in the world), times data quality, algorithms and stars. Models age about 3 percent a year, so you must retrain to keep up. Fine-tuning borrowed open weights is cheap but capped near half the frontier.</li>
        <li><b>Talent.</b> Researchers drive output. Low morale causes attrition, and rivals poach. Stars are rare and add real research power and company value.</li>
        <li><b>Products.</b> Each product competes for its segment's share of the market, weighted by quality, distribution and price tier. Sales reps add enterprise contracts.</li>
        <li><b>Finance.</b> Rounds have milestones (flagship, revenue, CFO). Debt is backed by GPUs. An IPO needs a CFO, $500M revenue and a healthy market. After listing, two loss years in a row trigger a board revolt.</li>
        <li><b>Policy.</b> Regulation tightens over time: binding rules need safety 50 for frontier releases and charge a compliance fee unless you lobby. Licensing needs a permit. Export controls block the newest chips. Copyright lawsuits follow unlicensed data. Acquisitions face antitrust review above 40 percent segment share.</li>
        <li><b>Macro.</b> Interest rates, the market index and hype drive valuations and IPO timing. Recessions, bubbles and talent wars happen. Public trust moves demand.</li>
        <li><b>Winning.</b> The highest valuation in ${END_YEAR} wins. Going bankrupt ends the game early.</li>
      </ul>
      <button class="primary" id="close-help">Close</button>
    </div>`;
    $('#modal').hidden = false;
  }

  function renderEnd() {
    showScreen('end');
    const v = S.verdict;
    $('#end').innerHTML = `<div class="end">
      <h1>${esc(v.title)}</h1>
      <p class="lede">${esc(S.me.name)}: ${esc(v.text)}</p>
      ${historyChart()}
      ${card(`Objectives (${Object.keys(S.goalsDone).length} of ${PATHS[S.path].goals.length})`, `<ul class="objs-list">${PATHS[S.path].goals.map((g, i) => `<li class="${i in S.goalsDone ? 'done' : ''}">${esc(g.text)}<small>${i in S.goalsDone ? `Done in ${S.goalsDone[i]}` : 'Missed'}</small></li>`).join('')}</ul>`)}
      <button class="primary big" id="again">Play again</button>
    </div>`;
  }

  function newGame() {
    const seed = Math.floor(Math.random() * 1e9) + 1;
    S = Engine.newGame(pathId, (companyName || '').trim().slice(0, 28) || 'Untitled AI', seed);
    tab = 'overview';
    renderGame();
  }

  document.addEventListener('input', e => { if (e.target.id === 'company-name') companyName = e.target.value; });

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-path],[data-act],[data-tab],#found,#end-year,#continue,#again,#help,#help-start,#close-help');
    if (!t || t.disabled) return;
    if (t.dataset.path) { pathId = t.dataset.path; renderStart(); }
    else if (t.id === 'found') newGame();
    else if (t.dataset.tab) { tab = t.dataset.tab; renderGame(); }
    else if (t.dataset.act) { Engine.act(S, t.dataset.act); renderGame(); }
    else if (t.id === 'end-year') { const r = Engine.endYear(S); renderGame(); showReport(r, S.over); }
    else if (t.id === 'continue') { $('#modal').hidden = true; if (S.over) renderEnd(); }
    else if (t.id === 'again') renderStart();
    else if (t.id === 'help' || t.id === 'help-start') showHelp();
    else if (t.id === 'close-help') $('#modal').hidden = true;
  });

  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('path')) { e.preventDefault(); e.target.click(); }
  });

  renderStart();
})();
