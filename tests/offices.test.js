const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

describe('offices', () => {
  test('a new company starts in the garage with no rent', () => {
    const s = E.newGame('lab', 'T', 1);
    assert.equal(s.me.offices, 0);
    assert.equal(E.OFFICES[s.me.offices].rent, 0);
  });

  test('upgrading moves the company up one office and charges its cost', () => {
    const s = E.newGame('lab', 'T', 1);
    s.me.cash = 100;
    s.ap = 5;
    const cost = E.OFFICES[1].cost;
    assert.equal(E.act(s, 'office'), null);
    assert.equal(s.me.offices, 1);
    assert.equal(s.me.cash, 100 - cost);
  });

  test('the top office cannot be upgraded further', () => {
    const s = E.newGame('lab', 'T', 1);
    s.me.cash = 1e6;
    s.me.offices = E.OFFICES.length - 1;
    assert.equal(E.options(s).find(o => o.key === 'office').locked, 'Already at the top office');
  });

  test('a bigger office raises research output for the same team', () => {
    const a = E.newGame('lab', 'T', 1), b = E.newGame('lab', 'T', 1);
    b.me.offices = 3;
    assert.ok(E.effCompute(b, b.me, 1) > E.effCompute(a, a.me, 1));
  });

  test('rent for a bigger office is charged every year', () => {
    const a = E.newGame('lab', 'T', 1), b = E.newGame('lab', 'T', 1);
    b.me.offices = 4;
    const extra = E.costsOf(b, b.me) - E.costsOf(a, a.me);
    assert.ok(Math.abs(extra - E.OFFICES[4].rent) < 1e-9, `extra ${extra}`);
  });
});

describe('product reviews', () => {
  test('a review score is between 0 and 100', () => {
    const s = E.newGame('bigtech', 'T', 1);
    const score = E.reviewScore(s.me);
    assert.ok(score >= 0 && score <= 100, `score ${score}`);
  });

  test('a stronger model and higher safety earn a better review', () => {
    const weak = E.newGame('garage', 'T', 1), strong = E.newGame('garage', 'T', 1);
    weak.me.flagship = { cap: 10, version: 1, name: 'W', year: 2016, open: false };
    strong.me.flagship = { cap: 90, version: 1, name: 'S', year: 2016, open: false };
    strong.me.safety = 90;
    weak.me.safety = 10;
    assert.ok(E.reviewScore(strong.me) > E.reviewScore(weak.me));
  });

  test('a better review raises product revenue', () => {
    const low = E.newGame('garage', 'T', 1), high = E.newGame('garage', 'T', 1);
    for (const s of [low, high]) { s.me.flagship = { cap: 50, version: 1, name: 'M', year: 2016, open: false }; s.me.products = ['chat']; }
    low.me.safety = 0; high.me.safety = 100;
    high.me.flagship.cap = 100; low.me.flagship.cap = 0;
    assert.ok(E.reviewMult(high.me) > E.reviewMult(low.me));
  });
});
