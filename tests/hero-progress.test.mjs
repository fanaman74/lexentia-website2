import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroGeometry, getHeroProgress } from '../lib/hero-progress.mjs';

test('hero progress clamps at the sequence endpoints', () => {
  assert.equal(getHeroProgress({ scrollTop: 100, sectionTop: 100, sectionHeight: 2200, viewportHeight: 800 }), 0);
  assert.equal(getHeroProgress({ scrollTop: 2000, sectionTop: 100, sectionHeight: 2200, viewportHeight: 800 }), 1);
});

test('hero geometry interpolates a midpoint floating video', () => {
  const geometry = getHeroGeometry(0.5, 1200);
  assert.equal(Math.round(geometry.videoWidth), 55);
  assert.equal(Math.round(geometry.videoX), 44);
  assert.ok(geometry.headingOpacity < 0.1);
  assert.ok(geometry.leftOpacity > 0);
});

test('mobile hero keeps the video above the revealed copy', () => {
  const geometry = getHeroGeometry(1, 390);
  assert.equal(Math.round(geometry.videoY), 5);
  assert.equal(Math.round(geometry.videoHeight), 40);
  assert.ok(geometry.videoY + geometry.videoHeight < 50);
});
