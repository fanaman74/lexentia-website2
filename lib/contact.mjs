const CONTACT_CONFIG = {
  en: {
    id: '3359',
    locale: 'en_US',
    unitTag: 'wpcf7-f3359-p3376-o1',
    containerPost: '3376',
    recaptchaAction: 'contactform',
    apiRoot: 'https://www.lexentia.eu/en/wp-json/',
    officialUrl: 'https://www.lexentia.eu/en/#contact'
  },
  fr: {
    id: '1019',
    locale: 'fr_FR',
    unitTag: 'wpcf7-f1019-p877-o1',
    containerPost: '877',
    recaptchaAction: 'contactform',
    apiRoot: 'https://www.lexentia.eu/wp-json/',
    officialUrl: 'https://www.lexentia.eu/#contact'
  }
};

export function getContactConfig(lang = 'en') {
  const config = CONTACT_CONFIG[lang] || CONTACT_CONFIG.en;
  return { ...config, endpoint: `${config.apiRoot}contact-form-7/v1/contact-forms/${config.id}/feedback` };
}

export function validateContactFields({ name = '', email = '', message = '', accepted = false } = {}) {
  const errors = {};
  const normalizedName = String(name).trim();
  const normalizedEmail = String(email).trim();
  const normalizedMessage = String(message).trim();
  if (!normalizedName || normalizedName.length > 120) errors.name = 'name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) errors.email = 'email';
  if (!normalizedMessage || normalizedMessage.length > 5000) errors.message = 'message';
  if (!accepted) errors.acceptance = 'acceptance';
  return { valid: Object.keys(errors).length === 0, errors, values: { name: normalizedName, email: normalizedEmail, message: normalizedMessage, accepted: Boolean(accepted) } };
}

export function firstInvalidContactField(errors = {}) {
  return ['name', 'email', 'message', 'acceptance'].find((field) => errors[field]) || null;
}

export function buildContactPayload({ lang = 'en', fields = {}, recaptchaToken = '' } = {}) {
  const config = getContactConfig(lang);
  return {
    _wpcf7: config.id,
    _wpcf7_version: '5.8.6',
    _wpcf7_locale: config.locale,
    _wpcf7_unit_tag: config.unitTag,
    _wpcf7_container_post: config.containerPost,
    _wpcf7_posted_data_hash: '',
    _wpcf7_recaptcha_response: recaptchaToken,
    nom: String(fields.name || '').trim(),
    email: String(fields.email || '').trim(),
    message: String(fields.message || '').trim(),
    'acceptance-123': fields.accepted ? '1' : ''
  };
}

export function formatContactDraft({ lang = 'en', fields = {} } = {}) {
  const labels = lang === 'fr' ? { name: 'Nom', email: 'E-mail' } : { name: 'Name', email: 'Email' };
  return `${labels.name}: ${String(fields.name || '').trim()}\n${labels.email}: ${String(fields.email || '').trim()}\n\n${String(fields.message || '').trim()}`;
}

export function isSuccessfulContactResponse(payload) {
  return payload?.status === 'mail_sent';
}
