import fs from 'node:fs/promises';
import path from 'node:path';

const CELEX = /^6\d{4}(?:CJ|TJ|CO|TO)\d{4}$/;
const COURTS = new Set(['Court of Justice', 'General Court']);
const SOURCE_URLS = new Set(['https://publications.europa.eu/webapi/rdf/sparql', 'https://www.eujust.online/rss.xml']);
const isHost = (value, host) => { try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === host; } catch { return false; } };
const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
const canonicalOfficialUrl = (value, celex) => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'eur-lex.europa.eu' || url.hash || [...url.searchParams.keys()].length !== 1 || url.searchParams.get('uri') !== `CELEX:${celex}`) return null;
    return `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`;
  } catch { return null; }
};
export const courtForCelex = (celex) => ['CJ', 'CO'].includes(celex.slice(5, 7)) ? 'Court of Justice' : 'General Court';
const isListingUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'eur-lex.europa.eu' && url.pathname === '/search.html' && !url.hash && url.searchParams.get('DTS_SUBDOM') === 'EU_CASE_LAW';
  } catch { return false; }
};

export function normalizeCases(records = []) {
  if (!Array.isArray(records)) return [];
  const seen = new Set();
  return records.flatMap((record) => {
    const celex = String(record?.celex || '');
    const caseNumber = String(record?.caseNumber || '');
    const officialUrl = canonicalOfficialUrl(record?.officialUrl, celex);
    if (!record || !CELEX.test(celex) || !COURTS.has(record.court) || record.court !== courtForCelex(celex) || !/^[CT]-/.test(caseNumber) || (record.court === 'Court of Justice' && !caseNumber.startsWith('C-')) || (record.court === 'General Court' && !caseNumber.startsWith('T-')) || !record.title || !officialUrl) return [];
    if (seen.has(celex)) return [];
    seen.add(celex);
    const judgmentDate = isValidDate(record.judgmentDate) ? record.judgmentDate : null;
    const title = String(record.title);
    return [{ celex, caseNumber, court: record.court, title, sourceTitle: String(record.sourceTitle || title), judgmentDate, officialUrl, recordUrl: isHost(record.recordUrl || '', 'www.eujust.online') ? record.recordUrl : null, summary: String(record.summary || ''), category: String(record.category || (record.court === 'General Court' ? 'Civil service' : 'EU law')) }];
  });
}

export function selectLatestCases(records = [], limit = 5) {
  const count = Number.isInteger(limit) && limit > 0 ? limit : 5;
  return normalizeCases(records).sort((left, right) => {
    if (left.judgmentDate === right.judgmentDate) return right.celex.localeCompare(left.celex);
    if (!left.judgmentDate) return 1;
    if (!right.judgmentDate) return -1;
    return right.judgmentDate.localeCompare(left.judgmentDate);
  }).slice(0, count);
}

export async function writeSnapshot(target, snapshot) {
  if (!snapshot || !SOURCE_URLS.has(snapshot.sourceUrl || '') || !snapshot.retrievedAt || Number.isNaN(Date.parse(snapshot.retrievedAt)) || !isListingUrl(snapshot.listingUrl)) throw new Error('Snapshot failed validation');
  const cases = normalizeCases(snapshot.cases);
  if (cases.length < 5) throw new Error('Snapshot failed validation');
  const temp = `${target}.${process.pid}.tmp`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  try {
    await fs.writeFile(temp, `${JSON.stringify({ retrievedAt: snapshot.retrievedAt, sourceUrl: snapshot.sourceUrl, listingUrl: snapshot.listingUrl, cases }, null, 2)}\n`, 'utf8');
    await fs.rename(temp, target);
  } catch (error) {
    await fs.rm(temp, { force: true });
    throw error;
  }
  return { ...snapshot, cases };
}
