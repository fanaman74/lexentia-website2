import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCases, selectLatestCases, writeSnapshot } from '../scripts/lib/cases.mjs';
import { EURLEX_LISTING_URL, eurLexQuery, fetchCaseRecords, fetchEurLexCases, parseCaseDetail } from '../scripts/refresh-cases.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const valid = { celex: '62020TJ0668', caseNumber: 'T-668/20', court: 'General Court', title: 'NZ v Commission', judgmentDate: '2021-10-06', officialUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62020TJ0668', recordUrl: 'https://www.eujust.online/cases/T-668/20' };

test('normalizes, validates and deduplicates court records', () => {
  const result = normalizeCases([valid, { ...valid, title: 'Duplicate' }, { ...valid, celex: 'not-celex' }, { ...valid, celex: '62020TO0001', court: 'Commission', caseNumber: 'I-1/20' }, { ...valid, celex: '62020TO0002', caseNumber: 'T-2/20', judgmentDate: 'unknown' }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].celex, valid.celex);
});

test('rejects unsafe source links and non-court institutions', () => {
  const result = normalizeCases([{ ...valid, officialUrl: 'https://example.com/62020TJ0668' }, { ...valid, celex: '62021TJ0001', court: 'European Parliament', caseNumber: 'T-1/21' }]);
  assert.equal(result.length, 0);
});

test('requires the EUR-Lex uri parameter to match the CELEX exactly', () => {
  const result = normalizeCases([
    { ...valid, officialUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62020TJ0668#CELEX:62020TJ0668' },
    { ...valid, celex: '62020TJ0669', caseNumber: 'T-669/20', officialUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62020TJ0668&x=62020TJ0669' }
  ]);
  assert.equal(result.length, 0);
});

test('requires the CELEX court descriptor and case number to agree', () => {
  const result = normalizeCases([
    { ...valid, celex: '62020CJ0668', caseNumber: 'T-668/20', court: 'General Court', officialUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62020CJ0668' },
    { ...valid, celex: '62020TJ0669', caseNumber: 'C-669/20', court: 'Court of Justice', officialUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62020TJ0669' }
  ]);
  assert.equal(result.length, 0);
});

test('rejects legislation CELEX identifiers and preserves impossible or unknown dates as null', () => {
  const result = normalizeCases([{ ...valid, celex: '32020R0001', caseNumber: 'R-1/20', officialUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32020R0001' }, { ...valid, celex: '62020TO0002', caseNumber: 'T-2/20', judgmentDate: '2021-02-30', officialUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62020TO0002' }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].judgmentDate, null);
});

test('failed refresh leaves prior snapshot intact', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lexentia-'));
  const target = path.join(dir, 'cases.json');
  const prior = { retrievedAt: '2026-01-01T00:00:00.000Z', sourceUrl: 'https://example.test/feed', cases: [valid] };
  await fs.writeFile(target, JSON.stringify(prior));
  await assert.rejects(() => writeSnapshot(target, { retrievedAt: 'bad', sourceUrl: 'javascript:no', cases: [] }));
  assert.deepEqual(JSON.parse(await fs.readFile(target, 'utf8')), prior);
});

test('fails a mixed-success refresh when any selected detail page fails', async () => {
  const rss = '<item><link>https://www.eujust.online/cases/1</link></item><item><link>https://www.eujust.online/cases/2</link></item>';
  const detail = '<meta property="og:title" content="C-1/23: Example · EU JUST"><script>"propertyID":"CELEX","value":"62023CJ0001"</script><script>"propertyID":"Case number","value":"C-1/23"</script><p>Judgment of 16 April 2026</p>';
  const fakeFetch = async (url) => {
    if (url.endsWith('rss.xml')) return { ok: true, text: async () => rss };
    if (url.endsWith('/1')) return { ok: true, text: async () => detail };
    return { ok: false, status: 503, text: async () => '' };
  };
  await assert.rejects(() => fetchCaseRecords(fakeFetch), /Case detail returned 503/);
});

test('does not normalize an impossible detail-page judgment date', () => {
  const page = '<meta property="og:title" content="C-1/23: Example · EU JUST"><script>"propertyID":"CELEX","value":"62023CJ0001"</script><script>"propertyID":"Case number","value":"C-1/23"</script><p>Judgment of 31 February 2026</p>';
  assert.equal(parseCaseDetail(page, 'https://www.eujust.online/cases/1').judgmentDate, null);
});

test('parses English Cellar bindings into validated court records', async () => {
  const bindings = [
    ['62026CJ0001', '2026-09-10', 'Judgment of the Court.#Staff Office v Commission.#Staff Regulations and pension.#Case C-1/26.'],
    ['62026TJ0002', '2026-08-20', 'Judgment of the General Court. Psychological harassment. Case T-2/26.'],
    ['62026CJ0003', '2026-07-15', 'Judgment of the Court. Employment discrimination. Case C-3/26.'],
    ['62026TJ0004', '2026-06-12', 'Judgment of the General Court. Selection board. Case T-4/26.'],
    ['62026CJ0005', '2026-05-01', 'Judgment of the Court. Civil service. Case C-5/26.']
  ].map(([celex, date, title]) => ({ celex: { value: celex }, date: { value: date }, title: { value: title }, work: { value: `https://publications.europa.eu/resource/cellar/${celex}` } }));
  let requestedUrl = '';
  const fakeFetch = async (url) => {
    requestedUrl = url;
    return { ok: true, status: 200, json: async () => ({ results: { bindings } }) };
  };
  const records = await fetchEurLexCases(fakeFetch);
  assert.equal(records.length, 5);
  assert.equal(records[0].court, 'Court of Justice');
  assert.equal(records[1].caseNumber, 'T-2/26');
  assert.equal(records[0].title, 'Staff Office v Commission.');
  assert.equal(records[0].sourceTitle, bindings[0].title.value);
  assert.equal(records[0].summary, 'Staff Regulations and pension.');
  assert.match(requestedUrl, /^https:\/\/publications\.europa\.eu\/webapi\/rdf\/sparql\?query=/);
  assert.match(requestedUrl, /format=application%2Fsparql-results%2Bjson/);
});

test('selects the five latest dated records and places unknown dates last', () => {
  const records = [1, 2, 3, 4, 5, 6].map((index) => ({
    ...valid,
    celex: `6202${index}TJ00${index}0`,
    caseNumber: `T-${index}/2${index}`,
    title: `Case ${index}`,
    officialUrl: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:6202${index}TJ00${index}0`,
    judgmentDate: index === 6 ? null : `202${index}-01-01`
  }));
  const latest = selectLatestCases(records, 5);
  assert.deepEqual(latest.map((record) => record.caseNumber), ['T-5/25', 'T-4/24', 'T-3/23', 'T-2/22', 'T-1/21']);
  assert.equal(latest.length, 5);
});

test('writes the official listing URL into the snapshot', async () => {
  const dir = await fs.mkdtemp(path.join(process.cwd(), '.case-test-'));
  const target = path.join(dir, 'cases.json');
  const cases = [1, 2, 3, 4, 5].map((index) => ({
    ...valid,
    celex: `6202${index}TJ00${index}0`,
    caseNumber: `T-${index}/2${index}`,
    title: `Case ${index}`,
    officialUrl: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:6202${index}TJ00${index}0`
  }));
  const snapshot = await writeSnapshot(target, { retrievedAt: '2026-10-15T00:00:00.000Z', sourceUrl: 'https://publications.europa.eu/webapi/rdf/sparql', listingUrl: EURLEX_LISTING_URL, cases });
  assert.equal(snapshot.listingUrl, EURLEX_LISTING_URL);
  assert.equal(JSON.parse(await fs.readFile(target, 'utf8')).listingUrl, EURLEX_LISTING_URL);
  assert.match(EURLEX_LISTING_URL, /CT_CASELAW_1_CODED=STAT/);
  await fs.rm(dir, { recursive: true, force: true });
});

test('keeps competition matching focused on staff and open competitions', () => {
  assert.doesNotMatch(eurLexQuery, /CONTAINS\(LCASE\(STR\(\?title\)\), "competition"\)/);
  assert.doesNotMatch(eurLexQuery, /CONTAINS\(LCASE\(STR\(\?title\)\), "request for assistance"\)/);
  assert.doesNotMatch(eurLexQuery, /CONTAINS\(LCASE\(STR\(\?title\)\), "invalidity"\)/);
  assert.doesNotMatch(eurLexQuery, /CONTAINS\(LCASE\(STR\(\?title\)\), "discrimination"\)/);
  assert.doesNotMatch(eurLexQuery, /CONTAINS\(LCASE\(STR\(\?title\)\), "allowance"\)/);
  assert.match(eurLexQuery, /REGEX\(LCASE\(STR\(\?title\)\),/);
  assert.match(eurLexQuery, /open competition/);
});

test('preserves the full case suffix from Cellar headings', async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ results: { bindings: [
      { celex: { value: '62026CJ0676' }, date: { value: '2026-10-08' }, title: { value: 'Order of the Court.#EIIH v Innovative Health Initiative.#Appeal – Order.#Case C-676/26 P(R).' }, work: { value: 'https://publications.europa.eu/resource/cellar/62026CJ0676' } },
    ] } }),
  });
  const records = await fetchEurLexCases(fakeFetch);
  assert.equal(records[0].caseNumber, 'C-676/26 P(R)');
});
