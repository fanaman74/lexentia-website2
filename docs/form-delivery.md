# Contact form delivery

The contact form mirrors Lexentia’s verified WordPress Contact Form 7 forms. The production configuration is:

- English: form `3359`, locale `en_US`, unit tag `wpcf7-f3359-p3376-o1`, container post `3376`.
- French: form `1019`, locale `fr_FR`, unit tag `wpcf7-f1019-p877-o1`, container post `877`; the official handoff URL is the root French page `https://www.lexentia.eu/#contact`.
- Endpoint: EN `https://www.lexentia.eu/en/wp-json/contact-form-7/v1/contact-forms/3359/feedback`; root French form `https://www.lexentia.eu/wp-json/contact-form-7/v1/contact-forms/1019/feedback`.
- Fields: `nom`, `email`, `message`, `acceptance-123`, plus the verified CF7 hidden fields and `_wpcf7_recaptcha_response`.

On `lexentia.eu` and `www.lexentia.eu`, the site loads the verified public reCAPTCHA v3 site key, obtains a token for the CF7 `contactform` action, and posts to the matching CF7 endpoint. The UI treats only a response with `status: "mail_sent"` as success. Validation, spam, mail failure, network failure, and unknown responses preserve the user’s entries and show an error state.

On local or private preview hosts, the handoff notice is visible before submission and the form does not post to the firm or any third party. After local validation it explains that the message has not been sent, offers to copy the draft locally, and links to the matching official WordPress form (`/en/#contact` or `/#contact`) so delivery and reCAPTCHA occur on the existing WordPress site.

Publishing this static frontend on the canonical domain requires the existing WordPress Contact Form 7 REST endpoint and reCAPTCHA configuration to remain available. Changing DNS or replacing the WordPress delivery path without preserving that endpoint would make submissions fail; this frontend does not create a replacement mail service or database.
