export function shouldAutoplay({ manualPause = false, documentHidden = false, reducedMotion = false, hovering = false, focusWithin = false } = {}) {
  return !(manualPause || documentHidden || reducedMotion || hovering || focusWithin);
}
