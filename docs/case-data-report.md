# Case data snapshot

The checked-in snapshot was retrieved on **2026-10-15T08:41:08.031Z** from the Publications Office Cellar SPARQL endpoint:

`https://publications.europa.eu/webapi/rdf/sparql`

The importer requests English case-law expressions whose titles contain a staff, civil-service, employment, workplace, harassment, pension, discrimination, recruitment, selection-board, competition, remuneration, allowance, disciplinary, duty-of-care, vacancy, retirement, or sick-leave term. It accepts CELEX descriptors for the Court of Justice (`CJ`, `CO`) and General Court (`TJ`, `TO`), orders by document date descending, limits the source result to 100, removes duplicate CELEX identifiers, validates the official EUR-Lex target, and stores the five newest validated records.

The public landing link stored with the snapshot is the verified EUR-Lex advanced-results page for the official **Staff Regulations of Officials** subject index:

`https://eur-lex.europa.eu/search.html?DTS_DOM=EU_LAW&DTS_SUBDOM=EU_CASE_LAW&type=advanced&lang=en&CT_CASELAW_1_CODED=STAT&sortOne=DD&sortOneOrder=desc`

That page is EUR-Lex’s official filtered subject index and covers both the Court of Justice and General Court. The index is narrower than the importer’s broader workplace and employment title-keyword selection; the snapshot’s five records and dates come from Cellar metadata, while each `officialUrl` points to the corresponding EUR-Lex CELEX judgment or order. The snapshot distinguishes `judgmentDate` from `retrievedAt`. Cellar records have no EU JUST detail URL, so `recordUrl` is `null`.

The current five records are:

| CELEX | Court | Case | Judgment date |
| --- | --- | --- | --- |
| 62025TJ0506 | General Court | T-506/25 — GY v European Commission | 2026-10-14 |
| 62024TJ0537 | General Court | T-537/24 — GC v Single Resolution Board | 2026-10-14 |
| 62023CJ0706 | Court of Justice | C-706/23 — Şcoala gimnazială « Mihai Eminescu » Vaslui v Uniunea Sindicală « Didactica » Vaslui | 2026-10-08 |
| 62025TJ0084 | General Court | T-84/25 — HP v European Commission | 2026-09-30 |
| 62025CJ0369 | Court of Justice | C-369/25 — LW v Trenitalia SpA and INPS | 2026-09-24 |

The raw Cellar title is retained as `sourceTitle`; `title` is the reliable party heading and `summary` is the subject heading extracted from that source metadata. A failed refresh does not replace `data/cases.json`: the writer validates the complete set, writes a process-specific temporary file, and renames it only after a successful write.
