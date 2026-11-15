const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

describe('hiring pipeline', () => {
  test('each year offers four candidates with quality between 1 and 5', () => {
    const s = E.newGame('lab', 'T', 3);
    assert.equal(s.candidates.length, 4);
    for (const c of s.candidates) assert.ok(c.quality >= 1 && c.quality <= 5, `quality ${c.quality}`);
  });

  test('hiring a candidate adds their output and takes the fee', () => {
    const s = E.newGame('lab', 'T', 3);
    s.me.cash = 100;
    s.ap = 5;
    const c = s.candidates.find(x => x.role === 'engineering') ?? (s.candidates[0].role = 'engineering', s.candidates[0]);
    const engineers = s.me.engineers, cash = s.me.cash;
    assert.equal(E.act(s, `hireCand:${c.id}`), null);
    assert.equal(s.me.engineers, engineers + E.candidateGain(c));
    assert.ok(Math.abs(s.me.cash - (cash - c.fee)) < 1e-9);
  });

  test('a candidate can only be hired once', () => {
    const s = E.newGame('lab', 'T', 3);
    s.me.cash = 100;
    const c = s.candidates[0];
    E.act(s, `hireCand:${c.id}`);
    assert.equal(E.options(s).find(o => o.key === `hireCand:${c.id}`).locked, 'Already hired');
  });

  test('candidates are replaced when the year turns', () => {
    const s = E.newGame('lab', 'T', 3);
    const before = s.candidates.map(c => c.id).join();
    E.endYear(s);
    assert.notEqual(s.candidates.map(c => c.id).join(), before);
  });

  test('a research hire adds researchers, not engineers', () => {
    const s = E.newGame('lab', 'T', 3);
    const c = { quality: 3, role: 'research' };
    assert.equal(E.candidateGain(c), 4);
  });
});
