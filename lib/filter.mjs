const fold = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\u2010-\u2015\-/]/g, ' ');

export function filterRecords(records, { query = '', category = '', court = '' } = {}) {
  const needle = fold(query).trim();
  return records.filter((record) => {
    const haystack = fold([record.title, record.summary, record.category, record.court, record.caseNumber, record.celex].join(' '));
    return (!needle || haystack.includes(needle)) && (!category || record.category === category) && (!court || record.court === court);
  });
}

export const uniqueValues = (records, field) => [...new Set(records.map((record) => record[field]).filter(Boolean))];
