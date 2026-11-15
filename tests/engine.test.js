const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');
const { makeBot } = require('./lib/bot');

const E = load();
const bot = makeBot(E);
const PATH_IDS = Object.keys(E.PATHS);
const SCEN_IDS = Object.keys(E.SCENARIOS);

function playOut(path, seed, scenario = 'base', maxTurns = 40) {
  const s = E.newGame(path, 'Test Co', seed, scenario);
  let turns = 0;
  while (!s.over && turns < maxTurns) { bot(s); E.endYear(s); turns++; }
  return s;
}

describe('determinism', () => {
  test('same seed gives the same valuations for five years', () => {
    const a = E.newGame('garage', 'T', 7, 'base');
    const b = E.newGame('garage', 'T', 7, 'base');
    for (let i = 0; i < 5; i++) {
      E.endYear(a); E.endYear(b);
      assert.equal(a.me.valuation, b.me.valuation);
      assert.equal(a.w.index, b.w.index);
    }
  });

  test('different seeds diverge', () => {
    const a = E.newGame('lab', 'T', 1), b = E.newGame('lab', 'T', 2);
    for (let i = 0; i < 6; i++) { E.endYear(a); E.endYear(b); }
    assert.notEqual(a.w.index, b.w.index);
  });
});

describe('finite economy across every pathway and scenario', () => {
  for (const path of PATH_IDS) {
    for (const scenario of SCEN_IDS) {
      test(`${path} / ${scenario} stays finite and ends`, () => {
        const s = playOut(path, 1, scenario);
        assert.equal(s.over, true, 'game should reach an end state');
        for (const c of E.active(s)) {
          for (const k of ['cash', 'valuation', 'revenue', 'stake']) assert.ok(Number.isFinite(c[k]), `${c.name}.${k}`);
        }
        assert.ok(['Bankrupt', 'Survivor', 'Contender', 'Most valuable AI company', 'Dominant'].includes(s.verdict.title));
      });
    }
  }
});

describe('actions and action points', () => {
  test('an action costs one action point and its cash', () => {
    const s = E.newGame('bigtech', 'T', 3);
    const before = { ap: s.ap, cash: s.me.cash, racks: E.totalRacksOf(s.me) };
    const key = E.options(s).find(o => o.key.startsWith('buy:') && !o.locked)?.key;
    assert.ok(key, 'expected at least one buyable platform for bigtech');
    const cost = E.options(s).find(o => o.key === key).cost;
    assert.equal(E.act(s, key), null);
    assert.equal(s.ap, before.ap - 1);
    assert.ok(Math.abs(s.me.cash - (before.cash - cost)) < 1e-9);
    assert.equal(E.totalRacksOf(s.me), before.racks + 5);
  });

  test('no actions left blocks further actions', () => {
    const s = E.newGame('lab', 'T', 3);
    s.ap = 0;
    const msg = E.act(s, 'paper');
    assert.equal(msg, 'No actions left this year');
  });

  test('a locked action does nothing', () => {
    const s = E.newGame('garage', 'T', 3);
    const before = s.me.cash;
    const msg = E.act(s, 'ipo');
    assert.equal(typeof msg, 'string');
    assert.equal(s.me.cash, before);
  });
});

describe('compute', () => {
  test('power draw is the sum of owned rack kilowatts', () => {
    const s = E.newGame('hardware', 'T', 1);
    const expected = Object.entries(s.me.fleet).reduce((t, [id, n]) => t + n * E.platOf(s.me, id).kw / 1000, 0);
    assert.ok(Math.abs(E.ownedMW(s.me) - expected) < 1e-9);
  });

  test('buying racks is blocked when the campus has no free megawatts', () => {
    const s = E.newGame('garage', 'T', 1);
    s.me.cash = 1e9;
    const o = E.options(s).find(x => x.key.startsWith('buy:'));
    assert.ok(o.locked, 'a company with no campus should be blocked from buying');
  });

  test('export controls block the newest NVIDIA generation for non-government buyers', () => {
    const s = E.newGame('garage', 'T', 1);
    s.w.exportControl = true;
    const p = E.PLATFORMS.find(x => x.id === 'gb200');
    assert.equal(E.exportBlocked(s, s.me, p), true);
    s.me.mods.gov = true;
    assert.equal(E.exportBlocked(s, s.me, p), false);
  });
});

describe('real-world anchors', () => {
  test('exact anchor years return the reported value', () => {
    assert.equal(E.anchorAt({ 2024: 157000, 2025: 500000 }, 2025), 500000);
  });

  test('between anchors interpolates in log space', () => {
    const v = E.anchorAt({ 2024: 100, 2026: 10000 }, 2025);
    assert.ok(Math.abs(v - 1000) < 1e-6);
  });

  test('before the first anchor uses the supplied fallback', () => {
    assert.equal(E.anchorAt({ 2023: 50 }, 2016, 0), 0);
  });

  test('after the last anchor holds the last value', () => {
    assert.equal(E.anchorAt({ 2024: 1, 2025: 2 }, 2040), 2);
  });

  test('OpenAI is held to its reported 2026 valuation', () => {
    const s = E.newGame('lab', 'T', 1);
    while (s.year < 2026) E.endYear(s);
    E.endYear(s);
    const openai = E.companyById(s, 'openai');
    assert.equal(openai.valuation, 1250000);
  });
});

describe('after 2026', () => {
  test('a real rival cannot grow faster than 12 percent a year', () => {
    const s = E.newGame('lab', 'T', 1);
    while (s.year <= 2027) E.endYear(s);
    const openai = E.companyById(s, 'openai');
    const v26 = 1250000;
    assert.ok(openai.valuation <= v26 * 1.12 * 1.12 + 1e-6, `valuation ${openai.valuation}`);
  });
});

describe('finance and failure', () => {
  test('a company that runs out of cash with no value goes bankrupt', () => {
    const s = E.newGame('garage', 'T', 1);
    s.me.cash = -1e9;
    s.me.valuation = 0;
    E.endYear(s);
    assert.equal(s.me.status, 'bankrupt');
    assert.equal(s.over, true);
    assert.equal(s.verdict.title, 'Bankrupt');
  });

  test('the seed round is open, and the next round needs its milestone', () => {
    const s = E.newGame('garage', 'T', 1);
    assert.equal(E.options(s).find(o => o.key === 'raise').locked, null);
    s.me.rounds.push({ name: 'Seed', year: 2016 });
    s.year = 2017;
    assert.match(E.options(s).find(o => o.key === 'raise').locked ?? '', /Milestone/);
  });
});

describe('save and load', () => {
  test('a saved game plays on identically to the original', () => {
    const a = E.newGame('bigtech', 'T', 4);
    for (let i = 0; i < 3; i++) { bot(a); E.endYear(a); }
    const b = JSON.parse(JSON.stringify(a));
    bot(a); E.endYear(a);
    bot(b); E.endYear(b);
    assert.equal(a.me.valuation, b.me.valuation);
    assert.equal(a.year, b.year);
  });
});

describe('auto-player', () => {
  test('a full bot game reaches the final year and a verdict', () => {
    const s = playOut('hardware', 2, 'base');
    assert.ok(s.verdict);
    assert.ok(s.year <= E.END_YEAR);
  });
});
