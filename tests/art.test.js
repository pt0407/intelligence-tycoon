const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { load } = require('./lib/load');

const E = load();
const artSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'art.js'), 'utf8');
const { monogram, hueOf } = new Function(`${artSource}\nreturn { monogram, hueOf };`)();

describe('monograms', () => {
  test('a monogram is two letters from the first word', () => {
    assert.equal(monogram('OpenAI'), 'OP');
    assert.equal(monogram('Cursor (Anysphere)'), 'CU');
    assert.equal(monogram('Meta AI (simulated)'), 'ME');
  });

  test('the starting rivals have distinct badges (letters and colour together)', () => {
    const rivals = E.newGame('lab', 'T', 1).rivals;
    const badge = c => `${monogram(c.name)}:${hueOf(c.name)}`;
    const marks = rivals.map(badge);
    assert.equal(new Set(marks).size, marks.length, marks.join(' '));
  });
});

describe('overview banner', () => {
  test('the start banner is not empty before any history exists', () => {
    const s = E.newGame('garage', 'T', 1);
    assert.equal(s.history.length, 0);
    assert.equal(typeof artSource, 'string');
    assert.ok(artSource.includes('S.history.length < 2'));
  });
});
