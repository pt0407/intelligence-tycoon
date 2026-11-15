const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

describe('asking-price band', () => {
  test('no band is shown until the company has reacted', () => {
    const s = E.newGame('lab', 'T', 1);
    assert.equal(E.askBand(E.companyById(s, 'cursor')), null);
  });

  test('the band brackets the hidden ask', () => {
    const c = { ask: 1.2 };
    const band = E.askBand(c);
    assert.ok(band.low < c.ask && band.high > c.ask);
    assert.ok(Math.abs((band.high - band.low) - 0.2) < 1e-9);
  });

  test('the band never drops below half of value', () => {
    assert.equal(E.askBand({ ask: 0.4 }).low, 0.5);
  });
});
