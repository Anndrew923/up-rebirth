import { useMemo } from 'react';

// Geometry SSOT (Projector Decoupling)
export const AXIS_COUNT = 5;
export const GRID_STEPS = [0.2, 0.4, 0.6, 0.8, 1];
export const VISUAL_MAX = 110; // visual cap at 110% (Limit Break)
export const STABILIZER_TICKS = 30;
export const DEGREE_TICKS = 72; // 360/5deg

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function toPointsString(nums) {
  // nums: [x0, y0, x1, y1, ...]
  const out = [];
  for (let i = 0; i < nums.length; i += 2) {
    out.push(`${nums[i].toFixed(2)},${nums[i + 1].toFixed(2)}`);
  }
  return out.join(' ');
}

export function computeAngles(count) {
  const step = (2 * Math.PI) / count;
  const start = -Math.PI / 2; // top
  return Array.from({ length: count }, (_, i) => start + i * step);
}

export function computePointsNumeric({ values, angles, cx, cy, radius }) {
  const nums = new Array(values.length * 2);
  for (let i = 0; i < values.length; i++) {
    // Values may exceed 100 (Limit Break). Visual cap is VISUAL_MAX.
    // Visual policy: 100 => 100% radius, allow up to 110% (radius * 1.1).
    const v = clamp(Number(values[i]) || 0, 0, VISUAL_MAX) / 100;
    const r = radius * v;
    const a = angles[i];
    nums[i * 2] = cx + r * Math.cos(a);
    nums[i * 2 + 1] = cy + r * Math.sin(a);
  }
  return nums;
}

export function computeRingPointsNumeric({ count, angles, cx, cy, radius }) {
  const nums = new Array(count * 2);
  for (let i = 0; i < count; i++) {
    const a = angles[i];
    nums[i * 2] = cx + radius * Math.cos(a);
    nums[i * 2 + 1] = cy + radius * Math.sin(a);
  }
  return nums;
}

export function computeHexPointsNumeric({ cx, cy, radius, rotation = 0 }) {
  const nums = new Array(12);
  const step = (2 * Math.PI) / 6;
  for (let i = 0; i < 6; i++) {
    const a = rotation + i * step;
    nums[i * 2] = cx + radius * Math.cos(a);
    nums[i * 2 + 1] = cy + radius * Math.sin(a);
  }
  return nums;
}

export function computeTickLine({ cx, cy, radiusInner, radiusOuter, angle }) {
  const x1 = cx + radiusInner * Math.cos(angle);
  const y1 = cy + radiusInner * Math.sin(angle);
  const x2 = cx + radiusOuter * Math.cos(angle);
  const y2 = cy + radiusOuter * Math.sin(angle);
  return { x1, y1, x2, y2 };
}

export function useRadarGeometry(values) {
  return useMemo(() => {
    const angles = computeAngles(AXIS_COUNT);
    const cx = 50;
    const cy = 50;
    // Physical avoidance: shrink the whole projector to free room for glow/particles.
    const BASE_RADIUS = 42;
    const radius = 32; // smaller core => larger "light space"
    const SCALE = radius / BASE_RADIUS;
    // Icons are outside the main grid; allow overflow via CSS (no paint containment).
    const iconRadius = 56 * SCALE;
    const stabilizerRadius = 50 * SCALE;
    const tickHexRadius = 1.15 * SCALE;
    const glowRadius = 44.5 * SCALE;
    const degreeInner = 46.2 * SCALE;
    const degreeOuterMinor = 47.2 * SCALE;
    const degreeOuterMajor = 48.2 * SCALE;

    const ringPolys = GRID_STEPS.map((step) =>
      toPointsString(
        computeRingPointsNumeric({ count: AXIS_COUNT, angles, cx, cy, radius: radius * step })
      )
    );

    const axisEnds = computeRingPointsNumeric({ count: AXIS_COUNT, angles, cx, cy, radius });
    const iconEnds = computeRingPointsNumeric({ count: AXIS_COUNT, angles, cx, cy, radius: iconRadius });

    const stabilizerTicks = Array.from({ length: STABILIZER_TICKS }, (_, i) => {
      const a = (-Math.PI / 2) + (i * (2 * Math.PI)) / STABILIZER_TICKS;
      const tx = cx + stabilizerRadius * Math.cos(a);
      const ty = cy + stabilizerRadius * Math.sin(a);
      // Rotate the hex tick slightly to read as "clockwork" teeth.
      const rot = a + Math.PI / 6;
      return toPointsString(computeHexPointsNumeric({ cx: tx, cy: ty, radius: tickHexRadius, rotation: rot }));
    });

    const degreeTicks = Array.from({ length: DEGREE_TICKS }, (_, i) => {
      const a = (-Math.PI / 2) + (i * (2 * Math.PI)) / DEGREE_TICKS;
      const isMajor = i % 6 === 0; // every 30deg
      const line = computeTickLine({
        cx,
        cy,
        radiusInner: degreeInner,
        radiusOuter: isMajor ? degreeOuterMajor : degreeOuterMinor,
        angle: a,
      });
      return { ...line, isMajor };
    });

    const targetNums = computePointsNumeric({ values, angles, cx, cy, radius });
    const targetPoints = toPointsString(targetNums);

    return {
      angles,
      cx,
      cy,
      radius,
      ringPolys,
      axisEnds,
      iconEnds,
      stabilizerRadius,
      stabilizerTicks,
      glowRadius,
      degreeTicks,
      targetNums,
      targetPoints,
    };
  }, [values]);
}

