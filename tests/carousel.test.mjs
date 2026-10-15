import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAutoplay } from '../lib/carousel.mjs';

test('carousel autoplay only runs when the page and control are available', () => {
  assert.equal(shouldAutoplay(), true);
  for (const condition of ['manualPause', 'documentHidden', 'reducedMotion', 'hovering', 'focusWithin']) {
    assert.equal(shouldAutoplay({ [condition]: true }), false, `${condition} pauses autoplay`);
  }
});
