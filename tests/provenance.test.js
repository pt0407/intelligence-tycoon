const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { problems } = require('../scripts/build-data');
const { load } = require('./lib/load');

const root = path.join(__dirname, '..');
const json = JSON.parse(fs.readFileSync(path.join(root, 'data', 'real.json'), 'utf8'));
const E = load();

// Round numbers the game uses as its own goals and round thresholds, not public figures.
const GAME_THRESHOLDS = new Set([2000, 5000, 10000]);

function publicNumbers(d) {
  const out = new Set();
  for (const c of d.companies) for (const v of [...Object.values(c.val), ...Object.values(c.rev ?? {})]) out.add(v);
  for (const v of Object.values(d.capex)) if (typeof v === 'number') out.add(v);
  for (const v of Object.values(d.memory)) if (typeof v === 'number') out.add(v);
  return [...out].filter(v => v >= 1000);
}

describe('real data is validated and in sync', () => {
  test('data/real.json passes the build checks', () => {
    assert.deepEqual(problems(json), []);
  });

  test('data/real.js matches the generated output', () => {
    const expected = `// Generated from data/real.json by scripts/build-data.js. Do not edit by hand.\nconst REAL = ${JSON.stringify(json, null, 1)};\n`;
    assert.equal(fs.readFileSync(path.join(root, 'data', 'real.js'), 'utf8'), expected);
  });

  test('every real company has a valuation anchor, a source and a status', () => {
    for (const c of json.companies.filter(x => x.real)) {
      assert.ok(Object.keys(c.val).length > 0, `${c.id} has no valuation`);
      assert.ok(c.sources.length > 0, `${c.id} has no sources`);
      assert.ok(c.valStatus, `${c.id} has no valStatus`);
    }
  });

  test('every platform and region points at a known source', () => {
    const ids = new Set(json.sources.map(s => s.id));
    for (const p of json.hardware.platforms) assert.ok(ids.has(p.source), p.id);
    for (const r of json.power.regions) assert.ok(ids.has(r.source), r.id);
  });
});

describe('game code does not hardcode public figures', () => {
  test('no public valuation, revenue or capex number is written into js/', () => {
    const numbers = publicNumbers(json).filter(n => !GAME_THRESHOLDS.has(n));
    const code = fs.readdirSync(path.join(root, 'js'))
      .filter(f => f.endsWith('.js'))
      .map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8')).join('\n');
    const hits = numbers.filter(n => new RegExp(`(^|[^0-9.])${n}([^0-9.]|$)`).test(code));
    assert.deepEqual(hits, [], `hardcoded figures found: ${hits.join(', ')}`);
  });

  test('the engine reads platforms, regions and the market from REAL', () => {
    assert.equal(E.PLATFORMS.length, json.hardware.platforms.length);
    assert.equal(E.REGIONS.length, json.power.regions.length);
    assert.deepEqual([...E.TAM], json.market.tamUsdM);
  });

  test('rivals take their anchors and starting state from REAL', () => {
    const s = E.newGame('lab', 'T', 1);
    const openai = E.companyById(s, 'openai');
    assert.deepEqual(openai.anchors.val, json.companies.find(c => c.id === 'openai').val);
    assert.equal(openai.cash, json.companies.find(c => c.id === 'openai').start.cash);
  });
});

describe('real funding rounds reach the engine', () => {
  test('a reported round is added to the company cash in its year', () => {
    const s = E.newGame('lab', 'T', 1);
    while (s.year < 2025 && !s.over) E.endYear(s);
    E.endYear(s);
    assert.ok(s.log.some(l => l.year === 2025 && /^Perplexity closes a reported funding round of \$500M\.$/.test(l.text)));
  });
});
