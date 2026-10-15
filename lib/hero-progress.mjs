export function getHeroProgress({ scrollTop = 0, sectionTop = 0, sectionHeight = 1, viewportHeight = 1 } = {}) {
  const travel = Math.max(1, sectionHeight - viewportHeight);
  return Math.max(0, Math.min(1, (scrollTop - sectionTop) / travel));
}

const lerp = (from, to, amount) => from + (to - from) * amount;

export function getHeroGeometry(progress = 0, viewportWidth = 1200) {
  const p = Math.max(0, Math.min(1, progress));
  const shrink = Math.min(1, p / 0.5);
  const reveal = Math.max(0, Math.min(1, (p - 0.35) / 0.4));
  const desktop = viewportWidth >= 760;
  return {
    headingOpacity: 1 - Math.min(1, p / 0.32),
    leftOpacity: reveal,
    videoWidth: desktop ? lerp(100, 55, shrink) : lerp(100, 92, shrink),
    videoHeight: desktop ? lerp(100, 76, shrink) : lerp(62, 40, shrink),
    videoX: desktop ? lerp(0, 44, shrink) : lerp(0, 4, shrink),
    videoY: desktop ? lerp(0, 13, shrink) : lerp(5, 5, shrink),
    videoRotate: desktop ? lerp(0, -6, shrink) : 0
  };
}
