export const EASE = {
  expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  quart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const DUR = {
  micro: 150,
  standard: 300,
  recolor: 600,
  hero: 900,
} as const;

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export const SPRING_DEFAULT: SpringConfig = {
  stiffness: 180,
  damping: 22,
  mass: 1,
};

export const SPRING_SNAPPY: SpringConfig = {
  stiffness: 320,
  damping: 26,
  mass: 1,
};

export function springDurationMs(cfg: SpringConfig = SPRING_DEFAULT): number {
  const { stiffness: k, damping: c, mass: m } = cfg;
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  const decay = zeta < 1 ? zeta * w0 : w0;
  const t = -Math.log(0.001) / decay;
  return Math.round(t * 1000);
}

export function springSamples(cfg: SpringConfig = SPRING_DEFAULT, steps = 60): number[] {
  const { stiffness: k, damping: c, mass: m } = cfg;
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  const duration = springDurationMs(cfg) / 1000;
  const out: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * duration;
    let x: number;
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      const env = Math.exp(-zeta * w0 * t);
      x = 1 - env * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
    } else if (zeta === 1) {
      x = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    } else {
      const r = w0 * Math.sqrt(zeta * zeta - 1);
      const a = -zeta * w0 + r;
      const b = -zeta * w0 - r;
      x = 1 - (b * Math.exp(a * t) - a * Math.exp(b * t)) / (b - a);
    }
    out.push(x);
  }
  out[out.length - 1] = 1;
  return out;
}

export function springKeyframes(
  map: (p: number) => Keyframe,
  cfg: SpringConfig = SPRING_DEFAULT,
  steps = 60,
): Keyframe[] {
  return springSamples(cfg, steps).map(map);
}
