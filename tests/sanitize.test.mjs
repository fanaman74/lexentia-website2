import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, safeHttpsUrl } from '../lib/sanitize.mjs';

test('escapes imported source text before HTML interpolation', () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)> & "quoted"'), '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quoted&quot;');
});

test('allows only expected HTTPS hosts for imported links', () => {
  assert.equal(safeHttpsUrl('https://www.lexentia.eu/article', ['www.lexentia.eu']), 'https://www.lexentia.eu/article');
  assert.equal(safeHttpsUrl('javascript:alert(1)', ['www.lexentia.eu']), '#');
  assert.equal(safeHttpsUrl('https://evil.example/article', ['www.lexentia.eu']), '#');
});
