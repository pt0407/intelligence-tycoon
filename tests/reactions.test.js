const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

describe('rival reactions', () => {
  test('holding a stake raises the hidden ask', () => {
    const s = E.newGame('lab', 'T', 1);
    const r = E.companyById(s, 'cursor');
    r.status = 'active';
    s.me.investments.cursor = 0.2;
    E.reactToStakes(s, []);
    assert.ok(r.ask > 1, `ask ${r.ask}`);
  });

  test('a bigger stake raises the ask more', () => {
    const a = E.newGame('lab', 'T', 1), b = E.newGame('lab', 'T', 1);
    for (const s of [a, b]) { const r = E.companyById(s, 'cursor'); r.status = 'active'; }
    a.me.investments.cursor = 0.05;
    b.me.investments.cursor = 0.3;
    E.reactToStakes(a, []);
    E.reactToStakes(b, []);
    assert.ok(E.companyById(b, 'cursor').ask > E.companyById(a, 'cursor').ask);
  });

  test('the ask is capped at 1.5 however large the stake', () => {
    const s = E.newGame('lab', 'T', 1);
    const r = E.companyById(s, 'cursor');
    r.status = 'active';
    s.me.investments.cursor = 0.49;
    for (let i = 0; i < 50; i++) E.reactToStakes(s, []);
    assert.ok(r.ask <= 1.5 + 1e-9);
  });

  test('no stake means no reaction', () => {
    const s = E.newGame('lab', 'T', 1);
    const r = E.companyById(s, 'cursor');
    r.status = 'active';
    E.reactToStakes(s, []);
    assert.equal(r.ask, undefined);
  });
});
