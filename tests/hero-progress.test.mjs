import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeroGeometry, getHeroProgress } from '../lib/hero-progress.mjs';

test('hero progress clamps at the sequence endpoints', () => {
  assert.equal(getHeroProgress({ scrollTop: 100, sectionTop: 100, sectionHeight: 2200, viewportHeight: 800 }), 0);
  assert.equal(getHeroProgress({ scrollTop: 2000, sectionTop: 100, sectionHeight: 2200, viewportHeight: 800 }), 1);
});

test('wide hero geometry moves from full bleed to a bounded landscape panel', () => {
  const width = 2500;
  const height = 700;
  const initial = getHeroGeometry(0, width, height);
  const midpoint = getHeroGeometry(0.25, width, height);
  const final = getHeroGeometry(1, width, height);
  const shellLeft = (width - 1260) / 2;
  const gutter = Math.min(64, Math.max(20, width * 0.04));
  const innerRight = shellLeft + 1260 - gutter;

  assert.equal(initial.videoWidth, 100);
  assert.equal(initial.videoHeight, 100);
  assert.equal(initial.videoX, 0);
  assert.ok(midpoint.videoWidth < initial.videoWidth);
  assert.ok(midpoint.videoWidth > final.videoWidth);
  assert.ok(final.videoX > 0);
  assert.equal(Math.round((final.videoX + final.videoWidth) * width / 100), innerRight);
  assert.ok(Math.abs((final.videoWidth * width / 100) / (final.videoHeight * height / 100) - 1.6) < 0.01);
  assert.ok(final.videoHeight <= 76);
  assert.ok(final.videoY > 0 && final.videoY + final.videoHeight < 100);
  assert.ok(final.headingOpacity < 0.1);
  assert.ok(final.leftOpacity > 0);
});

test('mobile hero keeps the video above the revealed copy', () => {
  const geometry = getHeroGeometry(1, 390);
  assert.equal(Math.round(geometry.videoY), 5);
  assert.equal(Math.round(geometry.videoHeight), 40);
  assert.ok(geometry.videoY + geometry.videoHeight < 50);
});

test('hero breakpoint can follow CSS when the scrollbar narrows the stage', () => {
  const mobile = getHeroGeometry(1, 746, 600, false);
  const desktop = getHeroGeometry(1, 746, 600, true);
  assert.equal(Math.round(mobile.videoWidth), 92);
  assert.equal(Math.round(mobile.videoHeight), 40);
  assert.ok(desktop.videoWidth < mobile.videoWidth);
  assert.ok(desktop.videoHeight > mobile.videoHeight);
});
