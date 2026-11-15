const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

describe('equity refresh', () => {
  test('an equity refresh is allowed once a year', () => {
    const s = E.newGame('garage', 'T', 1);
    s.ap = 5;
    assert.equal(E.act(s, 'equity'), null);
    assert.equal(E.act(s, 'equity'), 'Already refreshed this year');
  });

  test('the refresh is allowed again in the next year', () => {
    const s = E.newGame('garage', 'T', 1);
    s.ap = 5;
    E.act(s, 'equity');
    E.resetYear(s);
    assert.equal(E.act(s, 'equity'), null);
  });
});
