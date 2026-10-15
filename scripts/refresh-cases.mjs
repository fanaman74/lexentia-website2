import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { courtForCelex, normalizeCases, selectLatestCases, writeSnapshot } from './lib/cases.mjs';

export const EURLEX_ENDPOINT = 'https://publications.europa.eu/webapi/rdf/sparql';
export const EUJUST_SOURCE_URL = 'https://www.eujust.online/rss.xml';
export const EURLEX_LISTING_URL = 'https://eur-lex.europa.eu/search.html?DTS_DOM=EU_LAW&DTS_SUBDOM=EU_CASE_LAW&type=advanced&lang=en&CT_CASELAW_1_CODED=STAT&sortOne=DD&sortOneOrder=desc';
export const SOURCE_URL = EURLEX_ENDPOINT;
export const TARGET = fileURLToPath(new URL('../data/cases.json', import.meta.url));

const KEYWORDS = ['staff regulations', 'civil service', 'officials', 'employment', 'employee', 'harassment', 'pension', 'employment discrimination', 'staff discrimination', 'official discrimination', 'open competition', 'competition procedure', 'competition notice', 'selection board', 'EPSO', 'recruitment', 'temporary staff', 'contract staff', 'promotion', 'staff remuneration', 'remuneration of officials', 'family allowance', 'household allowance', 'dependent child allowance', 'education allowance', 'disciplinary', 'duty of care', 'vacancy', 'retirement', 'sick leave'];
const keywordFilter = KEYWORDS.map((keyword) => {
  const pattern = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return `REGEX(LCASE(STR(?title)), "(^|[^a-z])${pattern}([^a-z]|$)")`;
}).join(' ||\n    ');
export const eurLexQuery = `PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?work ?celex ?date ?title WHERE {
  ?work cdm:resource_legal_id_celex ?celex .
  FILTER(REGEX(STR(?celex), "^6[0-9]{4}(CJ|TJ|CO|TO)[0-9]{4}$"))
  ?expression cdm:expression_belongs_to_work ?work ;
    cdm:expression_title ?title ;
    cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
  OPTIONAL { ?work cdm:work_date_document ?date }
  FILTER(
    ${keywordFilter}
  )
} ORDER BY DESC(?date) LIMIT 100`;

const sourceHosts = new Set(['publications.europa.eu', 'eur-lex.europa.eu']);

const assertOfficialUrl = (value) => {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || !sourceHosts.has(parsed.hostname)) throw new Error('Official source returned an unexpected redirect target');
};

async function fetchOfficial(url, init, fetchImpl, timeoutMs = 60_000) {
  let current = url;
  for (let hop = 0; hop < 4; hop += 1) {
    assertOfficialUrl(current);
    const response = await fetchImpl(current, { ...init, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    if (response.status < 300 || response.status >= 400) return response;
    const location = response.headers?.get('location');
    if (!location) throw new Error('Official source returned a redirect without a location');
    const next = new URL(location, current);
    if (next.protocol === 'http:' && sourceHosts.has(next.hostname)) next.protocol = 'https:';
    current = next.toString();
  }
  throw new Error('Official source redirect limit exceeded');
}

const decodeHtml = (value) => String(value).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)));
const bindingValue = (row, key) => row?.[key]?.value ?? null;
const parseDateValue = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const candidate = `${match[1]}-${match[2]}-${match[3]}`;
  const [year, month, day] = candidate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? candidate : null;
};
const caseNumberFromTitle = (title) => title.match(/\bCases?\s+([CT]-\d+\/\d+(?:\s+[A-Z](?:\([A-Z]+\))?)?)/i)?.[1]?.toUpperCase() || title.match(/\b([CT]-\d+\/\d+(?:\s+[A-Z](?:\([A-Z]+\))?)?)/i)?.[1]?.toUpperCase() || null;
const categoryForTitle = (title) => /staff|civil service|officials|employment|employee|harassment|pension|discrimination|open competition|competition procedure|competition notice|selection board|EPSO|recruitment|temporary staff|contract staff|promotion|remuneration|allowance|disciplinary|duty of care|vacancy|retirement|sick leave/i.test(title) ? 'Civil service' : 'EU law';
const headingParts = (title) => title.split('#').map((part) => part.trim()).filter(Boolean);
const compactHeading = (title, caseNumber) => {
  const parts = headingParts(title);
  const party = parts.find((part, index) => index > 0 && /\b(?:v|against|contre|gegen)\b/i.test(part) && !/^cases?\b/i.test(part));
  return party || caseNumber || title;
};
const subjectHeading = (title, compactTitle) => {
  const parts = headingParts(title);
  const subject = parts.find((part, index) => index > 0 && part !== compactTitle && !/^cases?\b/i.test(part) && !/^judgment(?: of the)?\b/i.test(part) && !/^request for a preliminary ruling\b/i.test(part));
  return subject ? subject.split(/\s+–\s+/).slice(0, 4).join(' – ') : 'English case-law record retrieved from the Publications Office Cellar.';
};

export async function fetchEurLexCases(fetchImpl = fetch) {
  const url = `${EURLEX_ENDPOINT}?query=${encodeURIComponent(eurLexQuery)}&format=application%2Fsparql-results%2Bjson`;
  const response = await fetchOfficial(url, { headers: { accept: 'application/sparql-results+json, application/json' } }, fetchImpl);
  if (!response.ok) throw new Error(`EUR-Lex SPARQL returned HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload?.results?.bindings)) throw new Error('EUR-Lex SPARQL returned malformed JSON');
  const records = payload.results.bindings.flatMap((row) => {
    const celex = bindingValue(row, 'celex');
    const title = decodeHtml(bindingValue(row, 'title') || '').trim();
    const caseNumber = caseNumberFromTitle(title);
    const work = bindingValue(row, 'work');
    if (!celex || !title || !caseNumber || !work) return [];
    const displayTitle = compactHeading(title, caseNumber);
    return [{ celex, caseNumber, court: courtForCelex(celex), title: displayTitle, sourceTitle: title, judgmentDate: parseDateValue(bindingValue(row, 'date')), officialUrl: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`, recordUrl: null, summary: subjectHeading(title, displayTitle), category: categoryForTitle(title) }];
  });
  const cases = normalizeCases(records);
  if (!cases.length) throw new Error('EUR-Lex SPARQL returned no validated court records');
  return cases;
}

const parseDateText = (text) => {
  const match = text?.match(/(\d{1,2}) ([A-Za-z]+) (\d{4})/);
  if (!match) return null;
  const months = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
  if (!(match[2] in months)) return null;
  const date = new Date(Date.UTC(Number(match[3]), months[match[2]], Number(match[1])));
  if (date.getUTCFullYear() !== Number(match[3]) || date.getUTCMonth() !== months[match[2]] || date.getUTCDate() !== Number(match[1])) return null;
  return date.toISOString().slice(0, 10);
};

export function parseCaseDetail(page, recordUrl) {
  const celex = page.match(/propertyID":"CELEX","value":"([^"]+)"/)?.[1];
  const caseNumber = page.match(/propertyID":"Case number","value":"([^"]+)"/)?.[1];
  const title = page.match(/og:title" content="[^"]*?: ([^"]+) · EU JUST/)?.[1];
  const dateText = page.match(/Judgment of ([0-9]{1,2} [A-Za-z]+ [0-9]{4})/)?.[1];
  if (!celex || !caseNumber || !title) throw new Error(`Case detail did not contain required metadata: ${recordUrl}`);
  const court = caseNumber.startsWith('C-') ? 'Court of Justice' : 'General Court';
  return { celex, caseNumber, court, title, judgmentDate: parseDateText(dateText), officialUrl: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`, recordUrl, summary: `${court} record retrieved from EU JUST.`, category: categoryForTitle(title) };
}

export async function fetchCaseRecords(fetchImpl = fetch, sourceUrl = EUJUST_SOURCE_URL) {
  const sourceResponse = await fetchImpl(sourceUrl, { headers: { accept: 'application/rss+xml, application/xml' } });
  if (!sourceResponse?.ok) throw new Error(`Source returned ${sourceResponse?.status ?? 'an invalid response'}`);
  const xml = await sourceResponse.text();
  const links = [...xml.matchAll(/<item>[\s\S]*?<link>(https:\/\/www\.eujust\.online\/cases\/\d+)<\/link>[\s\S]*?<\/item>/g)].map((match) => match[1]);
  const uniqueLinks = [...new Set(links)];
  if (!uniqueLinks.length) throw new Error('No court detail links found in source');
  const records = await Promise.all(uniqueLinks.map(async (recordUrl) => {
    const response = await fetchImpl(recordUrl, { headers: { accept: 'text/html' } });
    if (!response?.ok) throw new Error(`Case detail returned ${response?.status ?? 'an invalid response'}: ${recordUrl}`);
    return parseCaseDetail(await response.text(), recordUrl);
  }));
  const cases = normalizeCases(records);
  if (cases.length !== records.length) throw new Error('One or more retrieved court records failed validation');
  return cases;
}

export async function refreshCases({ target = TARGET, fetchImpl = fetch, retrievedAt = new Date().toISOString() } = {}) {
  let cases;
  let sourceUrl = SOURCE_URL;
  try {
    cases = await fetchEurLexCases(fetchImpl);
  } catch (primaryError) {
    cases = await fetchCaseRecords(fetchImpl);
    sourceUrl = EUJUST_SOURCE_URL;
    if (!cases.length) throw primaryError;
  }
  const latest = selectLatestCases(cases, 5);
  if (latest.length < 5) throw new Error('Fewer than five validated relevant court records were retrieved');
  return writeSnapshot(target, { retrievedAt, sourceUrl, listingUrl: EURLEX_LISTING_URL, cases: latest });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await refreshCases();
    console.log(`Updated ${result.cases.length} court records from ${result.sourceUrl}`);
  } catch (error) {
    console.error(`Case refresh failed; previous snapshot preserved: ${error.message}`);
    process.exitCode = 1;
  }
}
