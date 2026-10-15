import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContactPayload, firstInvalidContactField, formatContactDraft, getContactConfig, isSuccessfulContactResponse, validateContactFields } from '../lib/contact.mjs';

test('contact config uses the verified EN and FR WordPress forms', () => {
  assert.equal(getContactConfig('en').id, '3359');
  assert.equal(getContactConfig('fr').id, '1019');
  assert.equal(getContactConfig('en').endpoint, 'https://www.lexentia.eu/en/wp-json/contact-form-7/v1/contact-forms/3359/feedback');
  assert.equal(getContactConfig('fr').endpoint, 'https://www.lexentia.eu/wp-json/contact-form-7/v1/contact-forms/1019/feedback');
  assert.equal(getContactConfig('fr').officialUrl, 'https://www.lexentia.eu/#contact');
  assert.equal(getContactConfig('en').recaptchaAction, 'contactform');
});

test('contact validation rejects incomplete or oversized enquiries', () => {
  assert.equal(validateContactFields().valid, false);
  assert.equal(validateContactFields({ name: 'A', email: 'person@example.com', message: 'Hello', accepted: true }).valid, true);
  assert.equal(validateContactFields({ name: 'A', email: 'bad', message: 'Hello', accepted: true }).errors.email, 'email');
  assert.equal(validateContactFields({ name: 'A', email: 'person@example.com', message: 'Hello', accepted: false }).errors.acceptance, 'acceptance');
  assert.equal(validateContactFields({ name: 'A'.repeat(121), email: 'person@example.com', message: 'Hello', accepted: true }).valid, false);
});

test('contact payload matches the live CF7 field contract', () => {
  const payload = buildContactPayload({ lang: 'fr', fields: { name: 'Ada', email: 'ada@example.com', message: 'Bonjour', accepted: true }, recaptchaToken: 'token' });
  assert.deepEqual(payload, {
    _wpcf7: '1019', _wpcf7_version: '5.8.6', _wpcf7_locale: 'fr_FR', _wpcf7_unit_tag: 'wpcf7-f1019-p877-o1', _wpcf7_container_post: '877', _wpcf7_posted_data_hash: '', _wpcf7_recaptcha_response: 'token', nom: 'Ada', email: 'ada@example.com', message: 'Bonjour', 'acceptance-123': '1'
  });
});

test('only CF7 mail_sent is treated as success', () => {
  assert.equal(isSuccessfulContactResponse({ status: 'mail_sent' }), true);
  assert.equal(isSuccessfulContactResponse({ status: 'validation_failed' }), false);
  assert.equal(isSuccessfulContactResponse({ status: 'spam' }), false);
});

test('contact draft formatter emits real line breaks', () => {
  const draft = formatContactDraft({ lang: 'en', fields: { name: 'Ada', email: 'ada@example.com', message: 'First line\nSecond line' } });
  assert.equal(draft, 'Name: Ada\nEmail: ada@example.com\n\nFirst line\nSecond line');
  assert.equal(draft.includes('\\n'), false);
});

test('contact validation reports the first invalid field without losing its field name', () => {
  const validation = validateContactFields({ name: '   ', email: 'bad', message: '', accepted: false });
  assert.equal(firstInvalidContactField(validation.errors), 'name');
});
