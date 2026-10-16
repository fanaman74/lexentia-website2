export function shouldAutoplay({ manualPause = false, documentHidden = false, reducedMotion = false, hovering = false, focusWithin = false } = {}) {
  return !(manualPause || documentHidden || reducedMotion || hovering || focusWithin);
}

export function nextCarouselIndex(index, total, direction = 1, loop = false) {
  if (total <= 0) return 0;
  const next = index + direction;
  return loop ? (next + total) % total : Math.max(0, Math.min(total - 1, next));
}
