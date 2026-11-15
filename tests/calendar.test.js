const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./lib/load');

const E = load();

describe('season calendar', () => {
  test('eraOf picks the latest era that has started', () => {
    assert.equal(E.eraOf(2016), 'The deep learning era');
    assert.equal(E.eraOf(2022), 'The chatbot boom');
    assert.equal(E.eraOf(2030), 'The shakeout');
  });

  test('the calendar has one cell per year from start to end', () => {
    const s = E.newGame('lab', 'T', 1);
    assert.equal(E.calendarCells(s).length, E.END_YEAR - E.START_YEAR + 1);
  });

  test('cells before the current year are past, the current year is now', () => {
    const s = E.newGame('lab', 'T', 1);
    s.year = 2020;
    const cells = E.calendarCells(s);
    assert.equal(cells.find(c => c.year === 2019).state, 'past');
    assert.equal(cells.find(c => c.year === 2020).state, 'now');
    assert.equal(cells.find(c => c.year === 2021).state, 'future');
  });

  test('beat years are flagged where scripted history fires', () => {
    const s = E.newGame('lab', 'T', 1);
    const cells = E.calendarCells(s);
    assert.equal(cells.find(c => c.year === 2022).beat, true);
    assert.equal(cells.find(c => c.year === 2029).beat, false);
  });
});
