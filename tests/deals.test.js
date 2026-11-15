const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

function rich(seed = 1) {
  const s = E.newGame('lab', 'T', seed);
  s.me.cash = 1e6;
  s.me.valuation = 1e6;
  s.ap = 5;
  return s;
}

function target(s, id, ask = 0.5) {
  const c = E.companyById(s, id);
  c.status = 'active';
  c.valuation = 500;
  c.lastValuation = 500;
  c.ask = ask;
  return c;
}

function control(s, id) {
  s.me.investments[id] = 0.5;
}

function closeNextYear(s) {
  s.year += 1;
  const news = [];
  E.closeDeals(s, news);
  s.year -= 1;
  return news;
}

function offerAndAccept(s, id, key = 'bidFair') {
  assert.equal(E.act(s, `${key}:${id}`), null);
  E.resolveOffers(s, []);
}

describe('offers and deals', () => {
  test('an offer is answered at year end, and an accepted offer is signed as a deal', () => {
    const s = rich();
    const r = target(s, 'cursor');
    control(s, 'cursor');
    assert.equal(E.act(s, 'bidFair:cursor'), null);
    assert.equal(s.offers.at(-1).status, 'open');
    E.resolveOffers(s, []);
    assert.equal(s.offers.at(-1).status, 'accepted');
    assert.equal(r.status, 'pending');
    assert.equal(s.deals.at(-1).closeYear, s.year + 1);
  });

  test('an accepted deal closes the next year and the target is acquired', () => {
    const s = rich();
    const r = target(s, 'cursor');
    control(s, 'cursor');
    offerAndAccept(s, 'cursor');
    closeNextYear(s);
    assert.equal(r.status, 'acquired');
    assert.equal(s.deals.at(-1).status, 'closed');
  });

  test('a full acquisition brings products and engineers across', () => {
    const s = rich();
    const r = target(s, 'cursor');
    r.products = ['code'];
    control(s, 'cursor');
    const engineers = s.me.engineers;
    offerAndAccept(s, 'cursor');
    closeNextYear(s);
    assert.ok(s.me.products.includes('code'));
    assert.ok(s.me.engineers > engineers);
  });

  test('integration costs morale when a full acquisition closes', () => {
    const s = rich();
    s.me.morale = 60;
    target(s, 'cursor');
    control(s, 'cursor');
    offerAndAccept(s, 'cursor');
    closeNextYear(s);
    assert.equal(s.me.morale, 52);
  });

  test('a deal falls through and the cash comes back if the target dies first', () => {
    const s = rich();
    const r = target(s, 'cursor');
    control(s, 'cursor');
    offerAndAccept(s, 'cursor');
    const paid = s.deals.at(-1).paid, cash = s.me.cash;
    r.status = 'dead';
    const news = closeNextYear(s);
    assert.equal(s.deals.at(-1).status, 'failed');
    assert.equal(s.me.cash, cash + paid);
    assert.ok(news.some(t => /falls through/.test(t)));
  });

  test('an acquihire takes the team but not products or racks', () => {
    const s = rich();
    const r = target(s, 'perplexity');
    r.products = ['chat'];
    const racks = E.totalRacksOf(s.me), team = r.researchers;
    assert.equal(E.act(s, 'acquihire:perplexity'), null);
    closeNextYear(s);
    assert.equal(r.status, 'dead');
    assert.equal(r.researchers, 0);
    assert.ok(s.me.researchers >= team);
    assert.equal(E.totalRacksOf(s.me), racks);
    assert.ok(!s.me.products.includes('chat'));
  });

  test('buying racks moves the exact fleet and leaves the company running', () => {
    const s = rich();
    const r = target(s, 'cohere');
    r.fleet = { a100: 10 };
    const racks = E.totalRacksOf(s.me);
    assert.equal(E.act(s, 'buycompute:cohere'), null);
    closeNextYear(s);
    assert.equal(E.totalRacksOf(s.me), racks + 10);
    assert.equal(r.status, 'active');
    assert.deepEqual(r.fleet, {});
  });

  test('a company in a pending deal is no longer offered again', () => {
    const s = rich();
    target(s, 'cursor');
    control(s, 'cursor');
    offerAndAccept(s, 'cursor');
    assert.equal(E.options(s).find(o => o.key === 'bidFair:cursor'), undefined);
  });

  test('antitrust review blocks a bid that would give one company most of a segment', () => {
    const s = rich();
    s.me.products = ['code'];
    s.me.dist = 100;
    s.me.flagship = { cap: 95, version: 1, name: 'Test-1', year: 2016, open: false };
    const cursor = target(s, 'cursor');
    cursor.products = ['code'];
    control(s, 'cursor');
    assert.equal(E.antitrustBlocks(s, cursor), true);
    assert.equal(E.act(s, 'bidFair:cursor'), 'Antitrust review would block this deal');
  });

  test('a bid with no segment overlap is not blocked by antitrust', () => {
    const s = rich();
    const cursor = target(s, 'cursor');
    cursor.products = ['code'];
    assert.equal(E.antitrustBlocks(s, cursor), false);
  });
});

describe('stakes and control', () => {
  test('a bid needs 49 percent of the company first', () => {
    const s = rich();
    target(s, 'cursor');
    assert.match(E.options(s).find(o => o.key === 'bidFair:cursor').locked, /49 percent/);
  });

  test('a stake is bought in 5 percent slices and is capped at 25 percent a year', () => {
    const s = rich();
    target(s, 'cursor');
    for (let i = 0; i < 5; i++) assert.equal(E.act(s, 'stake:cursor'), null);
    assert.ok(Math.abs(s.me.investments.cursor - 0.25) < 1e-9);
    assert.equal(E.act(s, 'stake:cursor'), "This year's shares are sold out");
  });

  test('a rejected offer blocks talks for a year', () => {
    const s = rich();
    const r = target(s, 'cursor', 2);
    control(s, 'cursor');
    assert.equal(E.act(s, 'bidFair:cursor'), null);
    const news = [];
    E.resolveOffers(s, news);
    assert.equal(s.offers.at(-1).status, 'rejected');
    assert.equal(r.blockedUntil, s.year + 1);
    assert.match(E.options(s).find(o => o.key === 'bidFair:cursor').locked, /not talking/);
    assert.ok(news.some(t => /rejects your offer/.test(t)));
  });

  test('dividends pay your share of a rival profit', () => {
    const s = rich();
    const r = target(s, 'cursor');
    r.net = 100;
    s.me.investments.cursor = 0.2;
    const cash = s.me.cash;
    E.payDividends(s, []);
    assert.ok(Math.abs(s.me.cash - (cash + 0.2 * 100 * 0.3)) < 1e-9);
  });
});
