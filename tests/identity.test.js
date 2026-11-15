const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

describe('names and backstories', () => {
  test('the same seed rolls the same identity', () => {
    assert.deepEqual(E.rollIdentity(7), E.rollIdentity(7));
  });

  test('different seeds roll different names', () => {
    const names = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(seed => E.rollIdentity(seed).name));
    assert.ok(names.size >= 6);
  });

  test('an identity has a name, founder, city and backstory that mention each other', () => {
    const id = E.rollIdentity(3);
    assert.ok(id.name && id.founder && id.city && id.focus);
    assert.ok(id.backstory.includes(id.name) && id.backstory.includes(id.founder) && id.backstory.includes(id.city));
  });

  test('a new game uses the identity it was given', () => {
    const who = E.rollIdentity(9);
    const s = E.newGame('garage', '', 9, 'base', who);
    assert.equal(s.me.name, who.name);
    assert.equal(s.me.founder, who.founder);
    assert.equal(s.me.backstory, who.backstory);
  });

  test('a generated startup has a backstory too', () => {
    const s = E.newGame('lab', 'T', 4);
    const found = E.activeRivals(s).find(c => c.real === false) ?? s.rivals[0];
    assert.ok(found.name);
  });
});

describe('missions', () => {
  test('each year starts with three distinct missions', () => {
    const s = E.newGame('lab', 'T', 2);
    assert.equal(s.missions.length, 3);
    assert.equal(new Set(s.missions.map(m => m.id)).size, 3);
  });

  test('a mission completes when its action is taken, and pays out once', () => {
    const s = E.newGame('lab', 'T', 2);
    s.missions = [{ id: 'hire', text: 'Recruit 10 people', need: 'hires', n: 10, done: false, reward: 12 }];
    s.ap = 5;
    E.act(s, 'hireRes');
    E.act(s, 'hireRes');
    const cash = s.me.cash;
    const news = [];
    E.evalMissions(s, news);
    assert.equal(s.missions[0].done, true);
    assert.equal(s.me.cash, cash + 12);
    assert.ok(news.some(t => /Mission complete: Recruit 10 people/.test(t)));
    E.evalMissions(s, []);
    assert.equal(s.missions[0].done, true);
  });

  test('a mission stays open until its target is reached', () => {
    const s = E.newGame('lab', 'T', 2);
    s.missions = [{ id: 'hire', text: 'Recruit 10 people', need: 'hires', n: 10, done: false, reward: 12 }];
    E.act(s, 'hireRes');
    E.evalMissions(s, []);
    assert.equal(s.missions[0].done, false);
  });
});
