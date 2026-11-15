const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

function holder(stake = 0.2, net = 100) {
  const s = E.newGame('lab', 'T', 1);
  const r = E.companyById(s, 'cursor');
  r.status = 'active';
  r.valuation = 500;
  r.net = net;
  r.cash = 0;
  s.me.cash = 0;
  s.me.investments.cursor = stake;
  s.ap = 5;
  return { s, r };
}

describe('stake strategies', () => {
  test('hold pays the normal dividend', () => {
    const { s } = holder();
    E.payDividends(s, []);
    assert.ok(Math.abs(s.me.cash - 0.2 * 100 * 0.3) < 1e-9);
  });

  test('harvest pays a bigger dividend than hold', () => {
    const { s } = holder();
    s.me.strategy = { cursor: 'harvest' };
    E.payDividends(s, []);
    assert.ok(Math.abs(s.me.cash - 0.2 * 100 * 0.5) < 1e-9);
  });

  test('grow sends most of the dividend back into the company', () => {
    const { s, r } = holder();
    s.me.strategy = { cursor: 'grow' };
    E.payDividends(s, []);
    const gross = 0.2 * 100 * 0.3;
    assert.ok(Math.abs(s.me.cash - 0.2 * gross) < 1e-9, `me ${s.me.cash}`);
    assert.ok(Math.abs(r.cash - 0.8 * gross) < 1e-9, `company ${r.cash}`);
  });

  test('a strategy needs a stake first', () => {
    const s = E.newGame('lab', 'T', 1);
    const r = E.companyById(s, 'cursor');
    r.status = 'active';
    r.valuation = 500;
    assert.equal(E.act(s, 'strategy_harvest:cursor'), 'Needs a stake first');
  });

  test('a strategy can be changed once a year', () => {
    const { s } = holder();
    assert.equal(E.act(s, 'strategy_harvest:cursor'), null);
    assert.equal(E.act(s, 'strategy_grow:cursor'), 'Strategy already changed this year');
  });

  test('a new year allows the strategy to change again', () => {
    const { s } = holder();
    E.act(s, 'strategy_harvest:cursor');
    E.resetYear(s);
    assert.equal(E.act(s, 'strategy_grow:cursor'), null);
    assert.equal(s.me.strategy.cursor, 'grow');
  });
});
