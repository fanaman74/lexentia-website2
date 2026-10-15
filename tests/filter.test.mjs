import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRecords } from '../lib/filter.mjs';

const records = [
  { title: 'Un concours européen', summary: 'Décisions du Tribunal', category: 'Civil service', court: 'General Court', caseNumber: 'T-668/20', celex: '62020TJ0668' },
  { title: 'Une société belge', summary: 'Droit des affaires', category: 'Business', court: 'Court of Justice', caseNumber: 'C-231/22', celex: '62022CJ0231' }
];

test('filters case number and CELEX queries', () => {
  assert.equal(filterRecords(records, { query: 't 668/20' }).length, 1);
  assert.equal(filterRecords(records, { query: '62022CJ0231' })[0].caseNumber, 'C-231/22');
});

test('matches accents without requiring accents', () => {
  assert.equal(filterRecords(records, { query: 'societe' }).length, 1);
});

test('applies combined category and court filters', () => {
  assert.equal(filterRecords(records, { category: 'Business', court: 'General Court' }).length, 0);
  assert.equal(filterRecords(records, { category: 'Business', court: 'Court of Justice' }).length, 1);
});

test('returns an empty array for zero matches', () => {
  assert.deepEqual(filterRecords(records, { query: 'unknown record' }), []);
});
