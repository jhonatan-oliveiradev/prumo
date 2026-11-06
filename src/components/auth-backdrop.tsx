'use client';

import GradientASCII from './gradient-ascii';

const palette = ['#14291d', '#28513b', '#567b62', '#91b59c'];

/** The login shares the exact ASCII renderer and palette used by the landing hero. */
export function AuthBackdrop() {
  return <div className="portal-atmosphere" aria-hidden="true">
    <GradientASCII
      colors={palette}
      characters=" /+x01$#"
      cellSize={17}
      density={0.66}
      glyphOpacity={0.76}
      gradientOpacity={0.47}
      glow={0.07}
      flow={0.28}
      flicker={0.06}
      speed={0.4}
      grain={0.02}
      dpr={1}
      intro={false}
      mouseInteraction
      clickEffect="wave"
    />
  </div>;
}
