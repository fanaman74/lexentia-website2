export function getHeroProgress({ scrollTop = 0, sectionTop = 0, sectionHeight = 1, viewportHeight = 1 } = {}) {
  const travel = Math.max(1, sectionHeight - viewportHeight);
  return Math.max(0, Math.min(1, (scrollTop - sectionTop) / travel));
}

const lerp = (from, to, amount) => from + (to - from) * amount;

export function getHeroGeometry(progress = 0, viewportWidth = 1200, stageHeight = 700, desktopOverride) {
  const p = Math.max(0, Math.min(1, progress));
  const shrink = Math.min(1, p / 0.5);
  const reveal = Math.max(0, Math.min(1, (p - 0.35) / 0.4));
  const desktop = desktopOverride ?? viewportWidth >= 760;
  const shellWidth = Math.min(viewportWidth, 1260);
  const gutter = Math.min(64, Math.max(20, viewportWidth * 0.04));
  const shellLeft = (viewportWidth - shellWidth) / 2;
  const innerLeft = shellLeft + gutter;
  const innerWidth = Math.max(1, shellWidth - (2 * gutter));
  const innerRight = innerLeft + innerWidth;
  const finalVideoWidthPx = desktop ? Math.min(innerWidth * 0.58, stageHeight * 0.76 * 1.6) : 0;
  const finalVideoHeightPx = desktop ? finalVideoWidthPx / 1.6 : 0;
  const finalVideoWidth = desktop ? (finalVideoWidthPx / viewportWidth) * 100 : 92;
  const finalVideoHeight = desktop ? (finalVideoHeightPx / stageHeight) * 100 : 40;
  const finalVideoX = desktop ? ((innerRight - finalVideoWidthPx) / viewportWidth) * 100 : 4;
  const finalVideoY = desktop ? ((stageHeight - finalVideoHeightPx) / (2 * stageHeight)) * 100 : 5;
  return {
    headingOpacity: 1 - Math.min(1, p / 0.32),
    leftOpacity: reveal,
    videoWidth: desktop ? lerp(100, finalVideoWidth, shrink) : lerp(100, 92, shrink),
    videoHeight: desktop ? lerp(100, finalVideoHeight, shrink) : lerp(62, 40, shrink),
    videoX: desktop ? lerp(0, finalVideoX, shrink) : lerp(0, 4, shrink),
    videoY: desktop ? lerp(0, finalVideoY, shrink) : lerp(5, 5, shrink),
    videoRotate: desktop ? lerp(0, -6, shrink) : 0
  };
}
