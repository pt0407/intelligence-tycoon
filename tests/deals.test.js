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

function target(s, id) {
  const c = E.companyById(s, id);
  c.status = 'active';
  c.valuation = 500;
  c.lastValuation = 500;
  return c;
}

function closeNextYear(s) {
  s.year += 1;
  const news = [];
  E.closeDeals(s, news);
  s.year -= 1;
  return news;
}

describe('deals', () => {
  test('a deal is signed now and does not close in the same year', () => {
    const s = rich();
    const r = target(s, 'perplexity');
    assert.equal(E.act(s, 'acquire:perplexity'), null);
    assert.equal(r.status, 'pending');
    assert.equal(s.deals.at(-1).status, 'pending');
    assert.equal(s.deals.at(-1).closeYear, s.year + 1);
    E.closeDeals(s, []);
    assert.equal(r.status, 'pending');
  });

  test('a full acquisition closes the next year with products and engineers', () => {
    const s = rich();
    const r = target(s, 'cursor');
    r.products = ['code'];
    const engineers = s.me.engineers;
    E.act(s, 'acquire:cursor');
    closeNextYear(s);
    assert.equal(r.status, 'acquired');
    assert.equal(s.deals.at(-1).status, 'closed');
    assert.ok(s.me.products.includes('code'));
    assert.ok(s.me.engineers > engineers);
  });

  test('integration costs morale when a full acquisition closes', () => {
    const s = rich();
    s.me.morale = 60;
    target(s, 'cursor');
    assert.equal(E.act(s, 'acquire:cursor'), null);
    closeNextYear(s);
    assert.equal(s.me.morale, 52);
  });

  test('an acquihire takes the team but not products or racks', () => {
    const s = rich();
    const r = target(s, 'perplexity');
    r.products = ['chat'];
    const racks = E.totalRacksOf(s.me), team = r.researchers;
    E.act(s, 'acquihire:perplexity');
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
    const fleet = { ...r.fleet }, racks = E.totalRacksOf(s.me);
    const count = Object.values(fleet).reduce((a, b) => a + b, 0);
    assert.equal(E.act(s, 'buycompute:cohere'), null);
    closeNextYear(s);
    assert.equal(E.totalRacksOf(s.me), racks + count);
    assert.equal(r.status, 'active');
    assert.deepEqual(r.fleet, {});
  });

  test('a company in a pending deal is no longer offered for sale', () => {
    const s = rich();
    E.act(s, 'acquire:perplexity');
    assert.equal(E.options(s).find(o => o.key === 'acquire:perplexity'), undefined);
  });

  test('a deal falls through and the cash comes back if the target dies first', () => {
    const s = rich();
    const r = target(s, 'perplexity');
    E.act(s, 'acquire:perplexity');
    const paid = s.deals.at(-1).paid, cash = s.me.cash;
    r.status = 'dead';
    const news = closeNextYear(s);
    assert.equal(s.deals.at(-1).status, 'failed');
    assert.equal(s.me.cash, cash + paid);
    assert.ok(news.some(t => /falls through/.test(t)));
  });

  test('antitrust review blocks a deal that would give one company most of a segment', () => {
    const s = rich();
    s.me.products = ['code'];
    s.me.dist = 100;
    s.me.flagship = { cap: 95, version: 1, name: 'Test-1', year: 2016, open: false };
    const cursor = target(s, 'cursor');
    cursor.products = ['code'];
    assert.equal(E.antitrustBlocks(s, cursor), true);
    assert.equal(E.act(s, 'acquire:cursor'), 'Antitrust review would block this deal');
  });

  test('a deal with no antitrust overlap is not blocked', () => {
    const s = rich();
    const cursor = target(s, 'cursor');
    cursor.products = ['code'];
    assert.equal(E.antitrustBlocks(s, cursor), false);
  });
});
