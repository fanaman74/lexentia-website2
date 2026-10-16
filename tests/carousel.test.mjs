import test from 'node:test';
import assert from 'node:assert/strict';
import { nextCarouselIndex, shouldAutoplay } from '../lib/carousel.mjs';

test('carousel autoplay only runs when the page and control are available', () => {
  assert.equal(shouldAutoplay(), true);
  for (const condition of ['manualPause', 'documentHidden', 'reducedMotion', 'hovering', 'focusWithin']) {
    assert.equal(shouldAutoplay({ [condition]: true }), false, `${condition} pauses autoplay`);
  }
});

test('practice carousel clamps manual endpoints and wraps autoplay', () => {
  assert.equal(nextCarouselIndex(0, 5, -1), 0);
  assert.equal(nextCarouselIndex(4, 5, 1), 4);
  assert.equal(nextCarouselIndex(4, 5, 1, true), 0);
  assert.equal(nextCarouselIndex(0, 5, -1, true), 4);
});
