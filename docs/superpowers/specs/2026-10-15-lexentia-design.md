# Lexentia website — proposed design

Status: approved by the user on 15 October 2026.

## User-directed visual correction — 15 October 2026

Further user refinements: logo top left, primary navigation centred, language/contact at right; carousel auto-advances with readable untruncated titles/descriptions for all slides; repeatable section reveals when scrolling in either direction; lower the intro text link and standardise link treatments. Remove the coordinate/scroll instruction line completely. Auto-advance should pause for hover, keyboard focus, hidden tabs, reduced motion and an explicit pause control.

Later refinements also supersede the original scope below: lower the Insights archive link with the same 36px section-link gap; show five latest relevant official court records and link to a relevant EUR-Lex results page. Visible case links use EUR-Lex. Add the enquiry form and retain the existing WordPress Contact Form 7/reCAPTCHA delivery. Private previews clearly hand drafts off to the existing official form; canonical-domain submission depends on preserving that WordPress endpoint.

The user rejected the first visual implementation. This section supersedes the visual system and carousel descriptions below. Preserve the content and functional requirements.

- Reproduce Moonlit's scroll interaction: full-width playing video with centered sans-serif text; pinned hero during scroll; video shrinks and moves to the right with subtle perspective; initial heading fades; new heading and body appear on the left; then normal page scrolling resumes. Reverse naturally when scrolling upward. Use native document scrolling, with no wheel-event capture. Provide a skip control, mobile stacked alternative and reduced-motion static alternative.
- Match Legora's minimal UI: almost-white, black regular sans-serif, modest section headings around 40px, clean whitespace and restrained forest-green actions. Remove the large serif and italic treatment, gold/clay accents, numbered editorial section labels and repeated decorative rules.
- Rebuild the practice carousel as a translating centered track, not an accordion. Desktop reference: selected image approximately 337 × 454px, neighbours approximately 182 × 228px, top aligned, around 58px gaps, clipped partial slides at the edges. Small white titles near the top centre of images. Active description sits beneath its image on white. Arrows above at opposing edges, small centered progress indicator. Preserve keyboard, touch, focus and accessible state.
- Remove `office.jpg` from office-room representations: the downloaded image depicts a place setting with Lexentia stationery, not a meeting room. Use accurate alternative text for all retained photographs.
- Recheck the revised site in the browser at hero start, middle and end, then desktop/mobile carousel and body sections.

## Goal and audience

Build a polished replacement website for https://www.lexentia.eu/ for prospective clients of the Brussels law firm. Preserve its focus on EU and international civil service law and Belgian/international business and private law. The result must feel appropriate to a specialist law firm, with working navigation, content browsing and contact actions.

## Requested references

- Moonlit (https://www.moonlit.ai/): reproduce the visual composition of the cinematic, full-width video hero, prominent central heading, supporting line and clear actions. Adapt the words and branding to Lexentia.
- Legora (https://legora.com/): use the spacious editorial layout, deep green accents, clean typography, restrained motion, photographic sections and especially the expanding practice carousel. Rebuild the interaction in original site code.
- Lexentia (https://www.lexentia.eu/en/ and https://www.lexentia.eu/actualites/): use the firm's identity, verified practice descriptions, team information, contact details and existing article metadata.
- EU JUST (https://github.com/fanaman74/eujust): reuse its official-source approach to CJEU and General Court records. Do not change that repository or its production services.

## Recommended architecture

A lightweight, statically generated editorial website with structured content files and a small asset/content preparation script. No database, accounts or paid service is necessary for the requested public experience. A full CMS is an alternative if browser-based editorial publishing becomes a requirement, but adds maintenance and is outside this first version.

Prepare a private preview through Sites if supported. Connecting the final public domain is a separate hosting action requiring the correct destination and available DNS access; creating the website must not alter the existing site's DNS.

## Visual system

Warm white backgrounds, near-black text, deep forest green actions and muted sage details. A refined serif for editorial headings paired with a readable sans serif for navigation and body copy. Use generous spacing, thin rules and large architectural photographs. Maintain consistent navigation and section geometry across desktop and mobile.

## Pages and sections

1. Home: slim navigation with Lexentia wordmark; video hero; short introduction; practice carousel; firm/team introduction; selected Insights; selected EU court decisions; consultation/contact call to action; footer.
2. Expertise: verified areas from the existing site, grouped into EU/international civil service law and Belgian/international private and business law. The carousel links to the corresponding detail content. Do not advertise unrelated practice areas merely to fill slides.
3. Team: Nathalie de Montigny and Magali Mattar, using current site biographies and photographs where available. No invented credentials, testimonials, client lists or results.
4. Insights: an article archive with search and category filters, real titles, publication dates, authors and links to the existing articles. Preserve the original article language and dates; English translations must be identified as translations. Use short original summaries rather than invented new publications.
5. Case law: searchable/filterable Court of Justice and General Court records, displaying court, case number or CELEX, title, judgment date where available, source and an official judgment link. Include clear no-result and source-unavailable states.
6. Contact: verified Brussels address, telephone, opening hours and existing public contact destination. Do not show a success message for an unconnected submission form. A genuine telephone/email action or existing contact-page link is sufficient until a delivery service is configured.

Retain French and English navigation/content support. The existing English site contains French articles; do not imply these have official English translations.

## Carousel behavior

Show a horizontal row of photographic practice panels, with the active panel enlarged and its short description revealed. Previous/next buttons and direct panel selection change the active item. Support touch scrolling, keyboard operation, visible focus and a slide indicator. On narrow screens show one readable active card with an adjacent preview. Avoid forced autoplay; respect reduced-motion preferences.

## Court records and provenance

The inspected EU JUST files are `src/lib/source/eurlex.ts`, `src/lib/topic-feed.ts` and `src/pages/cases/index.astro`. Its public RSS feed at https://www.eujust.online/rss.xml offers a useful discovery route, but combines court cases and institution updates; import only court records here. Its underlying EUR-Lex/Cellar adapter is an alternative source if needed.

Use a checked-in source snapshot fetched during implementation, with a repeatable refresh command and a visible last-retrieved timestamp. No scheduled update is implied or configured. The page must describe this as a selected collection, not exhaustive or continuously live coverage. Separate the actual judgment date from feed publication/discovery dates. Keep the last valid snapshot if a refresh fails and report failure honestly.

Validate identifiers and HTTPS source hosts; deduplicate by CELEX; escape imported text. Each case should link to the official EUR-Lex judgment and optionally the EU JUST record. Do not import API keys, operator settings, private database material or AI-generated reports. If a real record cannot be retrieved, show a truthful source state rather than fabricate one.

## Free media shortlist

All choices must be checked individually and recorded in `ASSET_CREDITS.md` with creator, source URL and license URL. Download allowed assets into the project for reliable serving; avoid watermarked previews and paid Unsplash+ assets.

- Hero candidate: Mikhail Nilov, legal team discussing documents, https://www.pexels.com/video/people-in-a-meeting-discussing-documents-8731230/ (marked free to use). Alternative: cottonbro studio, https://www.pexels.com/video/people-in-a-business-meeting-passing-a-piece-of-document-3202049/ (22 seconds, 1920 × 1080).
- Architecture candidate: OOgilles, modern facade in Brussels, https://unsplash.com/photos/a-honeycomb-pattern-in-the-modern-facade-of-a-building-in-brussels-QeJuMpjCHQk (free Unsplash License).
- Brussels candidate: Tom S., Grand Place town hall, https://unsplash.com/photos/a-tall-building-with-a-clock-on-the-front-of-it-7k6AzQC3nyg (free Unsplash License).
- Additional candidate: Vini Brasil, Royal Palace of Brussels, https://unsplash.com/photos/grand-building-entrance-framed-by-bare-trees-and-a-pathway-s6Yl9gq9iZo (free Unsplash License).
- License references: https://www.pexels.com/license/ and https://unsplash.com/license.

The hero video should be muted, looped and inline, with an optimized poster and a pause control. Use the poster for reduced motion and when video cannot load. Stock subjects must not be identified as Lexentia employees or clients.

## Validation and completion

- Validate content provenance, official court links and free-media credits.
- Verify carousel navigation, menu, language selection, article search/category filters and court search/court filters.
- Check keyboard access, visible focus, text contrast, reduced motion and video fallback.
- Inspect desktop and mobile layouts for horizontal overflow, clipping and broken images.
- Run source/build checks and meaningful regression tests for content import and filtering.
- Lead agent reviews delegated code and the final diff before reporting completion.
- Deliver source, runnable local preview and verified private hosted preview when supported; disclose any unavailable live integration or hosting action.
