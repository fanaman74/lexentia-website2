# Lexentia editorial site

Dependency-free static website for Lexentia, a Brussels law firm focused on EU and international civil service law, business and private law.

## Run locally

```sh
npm test
npm run build
npm run dev
```

The preview is served at `http://127.0.0.1:4173` after the build. The browser JavaScript loads the checked-in `data/` snapshot and local assets from `public/`.

## Refresh case selection

`node scripts/refresh-cases.mjs` queries the official Publications Office case-law data for relevant Court of Justice / General Court decisions, validates the records, and atomically replaces `data/cases.json`. A failed retrieval leaves the last valid snapshot untouched and exits non-zero. The homepage shows five decisions in date order, the snapshot retrieval date, and official EUR-Lex links.

The case selection is deliberately limited and is not live or exhaustive. Article content remains linked to the original Lexentia pages so original publication language and provenance are preserved.

## Contact delivery

The contact form preserves Lexentia’s existing WordPress Contact Form 7 delivery. On a local or private preview it validates the draft, offers local copying, and links to the official EN/FR WordPress form without sending anything. On the canonical Lexentia host it uses the verified CF7 REST endpoint with reCAPTCHA and accepts only `mail_sent` as success. See [docs/form-delivery.md](docs/form-delivery.md) for the endpoint contract and hosting dependency.
