const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

describe('decision cards', () => {
  test('each year starts with one decision card', () => {
    const s = E.newGame('lab', 'T', 5);
    assert.ok(s.decision);
    assert.ok(s.decision.options.length >= 2);
  });

  test('answering a card applies its effect and marks it answered', () => {
    const s = E.newGame('lab', 'T', 5);
    s.decision = { id: 'grant', title: 'g', text: '', default: 'refuse', options: [], answered: null };
    s.decision = null;
    E.assignDecision(s);
    s.decision.id = 'grant';
    s.decision.options = E.DECISIONS.find(d => d.id === 'grant').options.map(o => ({ key: o.key, label: o.label, desc: o.desc }));
    s.me.cash = 0;
    E.answerDecision(s, 'accept');
    assert.equal(s.me.cash, 15);
    assert.equal(s.decision.answered, 'accept');
  });

  test('an unanswered card applies its default at year end', () => {
    const s = E.newGame('lab', 'T', 5);
    s.decision = { id: 'poach', title: 'p', text: '', default: 'let', options: [], answered: null };
    s.me.researchers = 10;
    const news = [];
    E.resolveDecision(s, news);
    assert.equal(s.me.researchers, 7);
    assert.ok(news.some(t => /No answer/.test(t)));
  });

  test('a card that was answered is not applied again at year end', () => {
    const s = E.newGame('lab', 'T', 5);
    s.decision = { id: 'poach', title: 'p', text: '', default: 'let', options: [], answered: 'match' };
    s.me.researchers = 10;
    E.resolveDecision(s, []);
    assert.equal(s.me.researchers, 10);
  });

  test('a card can only be answered once', () => {
    const s = E.newGame('lab', 'T', 5);
    s.ap = 5;
    s.decision = { id: 'data', title: 'd', text: '', default: 'decline', options: E.DECISIONS.find(d => d.id === 'data').options.map(o => ({ key: o.key, label: o.label, desc: o.desc })), answered: null };
    assert.equal(E.act(s, 'decide:decline'), null);
    assert.equal(E.options(s).find(o => o.key === 'decide:license').locked, 'Already decided this year');
  });
});

describe('cloud partnerships', () => {
  test('a cloud deal adds rented racks and a revenue share', () => {
    const s = E.newGame('lab', 'T', 5);
    s.me.cash = 1e6;
    s.ap = 5;
    const before = E.totalRacksOf(s.me);
    assert.equal(E.act(s, 'partner:starter'), null);
    assert.equal(E.totalRacksOf(s.me), before + E.PARTNER_TIERS.starter.racks);
    assert.equal(s.me.partner, E.PARTNER_TIERS.starter.share);
    assert.equal(s.partnership.until, s.year + 2);
  });

  test('only one cloud deal at a time', () => {
    const s = E.newGame('lab', 'T', 5);
    s.me.cash = 1e6;
    E.act(s, 'partner:starter');
    assert.equal(E.options(s).find(o => o.key === 'partner:growth').locked, 'Already on a cloud deal');
  });

  test('a cloud deal expires after two years and returns the racks', () => {
    const s = E.newGame('lab', 'T', 5);
    s.me.cash = 1e6;
    E.act(s, 'partner:starter');
    const racks = E.totalRacksOf(s.me);
    s.year += 2;
    const news = [];
    E.expirePartnership(s, news);
    assert.equal(E.totalRacksOf(s.me), racks - E.PARTNER_TIERS.starter.racks);
    assert.equal(s.me.partner, 0);
    assert.equal(s.partnership, null);
    assert.ok(news.some(t => /cloud deal ends/.test(t)));
  });

  test('the revenue share lowers the revenue a company keeps', () => {
    const plain = E.newGame('garage', 'T', 5), shared = E.newGame('garage', 'T', 5);
    plain.me.products = ['chat'];
    shared.me.products = ['chat'];
    shared.me.partner = 0.2;
    assert.ok(E.revenueOf(shared, shared.me, 100) < E.revenueOf(plain, plain.me, 100));
  });
});
