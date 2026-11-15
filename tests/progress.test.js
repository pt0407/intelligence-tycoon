const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

describe('achievements', () => {
  test('an achievement unlocks once, when its condition is first met', () => {
    const s = E.newGame('garage', 'T', 1);
    const news = [];
    assert.equal(E.checkAchievements(s, news).length, 0);
    s.me.valuation = 1500;
    const first = E.checkAchievements(s, news);
    assert.ok(first.some(a => a.id === 'unicorn'));
    assert.equal(E.checkAchievements(s, []).some(a => a.id === 'unicorn'), false);
    assert.equal(s.achievements.unicorn, s.year);
  });

  test('unlocks are logged in the news', () => {
    const s = E.newGame('garage', 'T', 1);
    const news = [];
    s.me.valuation = 1500;
    E.checkAchievements(s, news);
    assert.ok(news.some(t => /Achievement unlocked: Unicorn/.test(t)));
  });

  test('a save from before achievements loads without error', () => {
    const s = E.newGame('garage', 'T', 1);
    delete s.achievements;
    assert.doesNotThrow(() => E.checkAchievements(s, []));
    assert.ok(E.nextAchievement(s));
  });

  test('the next achievement shows a progress meter toward its target', () => {
    const s = E.newGame('garage', 'T', 1);
    s.me.valuation = 500;
    for (const a of E.ACHIEVEMENTS) { if (a.id === 'unicorn') break; s.achievements[a.id] = 2016; }
    const n = E.nextAchievement(s);
    assert.equal(n.id, 'unicorn');
    assert.equal(n.target, 1000);
    assert.equal(n.value, 500);
  });

  test('year-end reports list what unlocked', () => {
    const s = E.newGame('lab', 'T', 1);
    const r = E.endYear(s);
    assert.ok(Array.isArray(r.unlocked));
  });

  test('every achievement has a title, text and meter', () => {
    for (const a of E.ACHIEVEMENTS) {
      assert.ok(a.title && a.text, a.id);
      const m = a.meter(E.newGame('lab', 'T', 1));
      assert.ok(Number.isFinite(m.value) && Number.isFinite(m.target) && m.target > 0, a.id);
    }
  });
});
