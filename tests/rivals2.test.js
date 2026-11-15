const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

describe('rival responses to launches', () => {
  test('a rival may answer a launch in the same segment', () => {
    let answered = false;
    for (let seed = 1; seed <= 30 && !answered; seed++) {
      const s = E.newGame('garage', 'T', seed);
      const r = E.companyById(s, 'cursor');
      r.status = 'active';
      r.products = [];
      r.cash = 1e6;
      r.flagship = { cap: 60, version: 1, name: 'R-1', year: 2016, open: false };
      r.ask = 1;
      r.valuation = 500;
      s.yr.launchedSids = ['code'];
      const news = [];
      E.respondToLaunches(s, news);
      answered = r.products.includes('code');
      assert.equal(answered, news.some(t => /answers your Coding assistant launch/.test(t)));
    }
    assert.ok(answered, 'no rival answered in 30 seeds');
  });

  test('a rival with no cash does not answer', () => {
    const s = E.newGame('garage', 'T', 1);
    const r = E.companyById(s, 'cursor');
    r.status = 'active';
    r.products = [];
    r.cash = 0;
    s.yr.launchedSids = ['code'];
    E.respondToLaunches(s, []);
    assert.deepEqual(r.products, []);
  });
});

describe('verdict peer rank', () => {
  test('the verdict can name the top independent lab', () => {
    const s = E.newGame('garage', 'T', 1);
    s.year = E.END_YEAR;
    s.me.valuation = 1e9;
    s.me.status = 'active';
    const v = E.verdictFor(s);
    assert.ok(['Top independent lab', 'Most valuable AI company', 'Dominant', 'Contender', 'Survivor'].includes(v.title));
    assert.equal(v.title, 'Dominant');
  });

  test('the verdict text states the peer rank', () => {
    const s = E.newGame('garage', 'T', 1);
    s.year = E.END_YEAR;
    s.me.status = 'active';
    const v = E.verdictFor(s);
    assert.match(v.text, /and #\d+ among independent labs\./);
  });

  test('the verdict is finite and defined for a finished game', () => {
    const s = E.newGame('bigtech', 'T', 2);
    while (!s.over) E.endYear(s);
    assert.ok(s.verdict && s.verdict.title && s.verdict.text.length > 0);
  });
});
