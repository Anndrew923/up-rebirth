import { useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/modules/MagitekRadarChart.module.css';
import RadarFilters from './RadarFilters';
import { AXIS_COUNT, clamp, easeInOutQuad, toPointsString, useRadarGeometry } from './useRadarGeometry';
import NebulaLayer from './layers/NebulaLayer';
import GlowLayer from './layers/GlowLayer';
import RingsLayer from './layers/RingsLayer';
import GridLayer from './layers/GridLayer';
import DataFlowLayer from './layers/DataFlowLayer';
import OverlayLayer from './layers/OverlayLayer';

function prefersReducedMotion() {
  try {
    return Boolean(window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  } catch {
    return false;
  }
}

/**
 * MagitekRadarChart (Performance-first)
 * - Static pentagon grid + stabilizer ring layer
 * - Data layer uses will-change + CSS keyframes for idle resonance
 * - Optional rAF tween ONLY when data changes (bounded, short-lived)
 */
export function MagitekRadarChart({ series, animate = true, ariaLabel = '能力雷達圖' }) {
  const baseRef = useRef(null);
  const flowRefA = useRef(null);
  const flowRefB = useRef(null);
  const flowRefC = useRef(null);
  const svgRootRef = useRef(null);
  const overlayRef = useRef(null);
  const prevNumsRef = useRef(null);
  const rafRef = useRef(0);
  const parallaxRafRef = useRef(0);
  const parallaxStateRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rawId = useId();
  const instanceId = useMemo(() => String(rawId).replace(/[^a-zA-Z0-9_-]/g, ''), [rawId]);
  // Protocol requires a filter named `magitekFlow`.
  // (Assumption: only one radar is shown at a time; keep IDs stable for reference fidelity.)
  const fillGradientId = useMemo(() => `magitekEnergyFill_${instanceId}`, [instanceId]);
  const flowFilterId = 'magitekFlow';

  const { values, labels } = useMemo(() => {
    const safe = Array.isArray(series) ? series.slice(0, AXIS_COUNT) : [];
    const padded =
      safe.length === AXIS_COUNT
        ? safe
        : [...safe, ...Array.from({ length: AXIS_COUNT - safe.length }, () => ({ label: '', value: 0 }))];
    return {
      values: padded.map((s) => Number(s?.value) || 0),
      labels: padded.map((s) => (s?.label ? String(s.label) : '')),
    };
  }, [series]);

  const geometry = useRadarGeometry(values);

  const motionReduced = useMemo(() => prefersReducedMotion(), []);
  const shouldAnimate = Boolean(animate) && !motionReduced;

  // Parallax nudge (L5 overlay): mouse-follow or gyro-follow.
  useEffect(() => {
    if (!shouldAnimate) return;
    const svgEl = svgRootRef.current;
    const overlayEl = overlayRef.current;
    if (!svgEl || !overlayEl) return;

    const state = parallaxStateRef.current;

    const setTargetFromPointer = (e) => {
      const rect = svgEl.getBoundingClientRect?.();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = clamp((e.clientX - cx) / (rect.width / 2), -1, 1);
      const ny = clamp((e.clientY - cy) / (rect.height / 2), -1, 1);
      // In SVG user units (viewBox is 0..100). Keep subtle, but more detached.
      // Intensify slightly for "detached" feel.
      state.tx = nx * 1.35;
      state.ty = ny * 1.35;
    };

    const resetTarget = () => {
      state.tx = 0;
      state.ty = 0;
    };

    const setTargetFromGyro = (event) => {
      // gamma: left-right [-90..90], beta: front-back [-180..180]
      const g = typeof event.gamma === 'number' ? event.gamma : 0;
      const b = typeof event.beta === 'number' ? event.beta : 0;
      const nx = clamp(g / 30, -1, 1);
      const ny = clamp(b / 45, -1, 1);
      state.tx = nx * 1.05;
      state.ty = ny * 1.05;
    };

    const tick = () => {
      // smooth-follow
      state.x += (state.tx - state.x) * 0.12;
      state.y += (state.ty - state.y) * 0.12;
      overlayEl.setAttribute('transform', `translate(${state.x.toFixed(3)} ${state.y.toFixed(3)})`);
      parallaxRafRef.current = requestAnimationFrame(tick);
    };

    // Pointer follow (desktop / touch-drag)
    svgEl.addEventListener('pointermove', setTargetFromPointer, { passive: true });
    svgEl.addEventListener('pointerleave', resetTarget, { passive: true });

    // Gyro follow (best-effort; may require permission on some platforms)
    window.addEventListener('deviceorientation', setTargetFromGyro, { passive: true });

    parallaxRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (parallaxRafRef.current) cancelAnimationFrame(parallaxRafRef.current);
      svgEl.removeEventListener('pointermove', setTargetFromPointer);
      svgEl.removeEventListener('pointerleave', resetTarget);
      window.removeEventListener('deviceorientation', setTargetFromGyro);
      // reset transform
      try {
        overlayEl.setAttribute('transform', 'translate(0 0)');
      } catch {
        // ignore
      }
    };
  }, [shouldAnimate]);

  useLayoutEffect(() => {
    const baseEl = baseRef.current;
    const aEl = flowRefA.current;
    const bEl = flowRefB.current;
    const cEl = flowRefC.current;
    if (!baseEl || !aEl || !bEl || !cEl) return;

    // Cancel any in-flight tween.
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const targetNums = geometry.targetNums;
    const targetPoints = geometry.targetPoints;

    // First paint / no prior state: snap to target.
    const prev = prevNumsRef.current;
    if (!prev || prev.length !== targetNums.length || !shouldAnimate) {
      baseEl.setAttribute('points', targetPoints);
      aEl.setAttribute('points', targetPoints);
      bEl.setAttribute('points', targetPoints);
      cEl.setAttribute('points', targetPoints);
      prevNumsRef.current = targetNums;
      return;
    }

    // Prevent "snap-back": set to previous before paint, then tween to target.
    const prevPoints = toPointsString(prev);
    baseEl.setAttribute('points', prevPoints);
    aEl.setAttribute('points', prevPoints);
    bEl.setAttribute('points', prevPoints);
    cEl.setAttribute('points', prevPoints);

    const start = performance.now();
    const durationMs = 360;

    const tick = (now) => {
      const t = clamp((now - start) / durationMs, 0, 1);
      const k = easeInOutQuad(t);

      const curr = new Array(targetNums.length);
      for (let i = 0; i < curr.length; i++) {
        curr[i] = prev[i] + (targetNums[i] - prev[i]) * k;
      }

      const currPoints = toPointsString(curr);
      baseEl.setAttribute('points', currPoints);
      aEl.setAttribute('points', currPoints);
      bEl.setAttribute('points', currPoints);
      cEl.setAttribute('points', currPoints);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevNumsRef.current = targetNums;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [geometry.targetNums, geometry.targetPoints, shouldAnimate]);

  // Ensure ref state updates when series changes but animations are disabled.
  useLayoutEffect(() => {
    if (!shouldAnimate) {
      prevNumsRef.current = geometry.targetNums;
    }
  }, [geometry.targetNums, shouldAnimate]);

  const stackClassName = `${styles.svgStack} ${shouldAnimate ? styles.animate : ''}`;

  const icons = useMemo(() => {
    // Order is strict and should match the reference:
    // Strength, Explosive, Cardio, FFMI, Muscle(SMM)
    // Using lightweight glyphs (no external deps / no heavy SVG paths).
    return ['💪', '⚡', '♥', 'FF', '🥩'];
  }, []);

  const displayValues = useMemo(() => {
    return values.map((v) => {
      const n = Number(v) || 0;
      // Keep text truthful even beyond 110; visuals are capped separately.
      return Number.isFinite(n) ? n.toFixed(0) : '--';
    });
  }, [values]);

  const isLimitBreak = useMemo(() => {
    return values.map((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 100;
    });
  }, [values]);

  const isBloom = useMemo(() => {
    // Glow bloom triggers when any stat reaches 100+ (including Limit Break).
    return values.some((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 100;
    });
  }, [values]);

  const shouldJitter = useMemo(() => {
    // Performance guard: SVG displacement filters can be expensive on low-end devices.
    // Keep 60fps by disabling jitter when cores/memory look constrained.
    if (!shouldAnimate) return false;
    try {
      const cores = navigator?.hardwareConcurrency;
      if (typeof cores === 'number' && cores > 0 && cores < 6) return false;
      const mem = navigator?.deviceMemory;
      if (typeof mem === 'number' && mem > 0 && mem < 4) return false;
    } catch {
      // ignore
    }
    return true;
  }, [shouldAnimate]);

  const isGold = isBloom;

  const isAwake = useMemo(() => {
    return values.map((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 100;
    });
  }, [values]);

  const isTopStat = useMemo(() => {
    const nums = values.map((v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    });
    const max = nums.length ? Math.max(...nums) : 0;
    if (!Number.isFinite(max) || max <= 0) return nums.map(() => false);
    return nums.map((n) => n === max);
  }, [values]);

  return (
    <div className={styles.root}>
      <div className={stackClassName} role="img" aria-label={ariaLabel}>
        {/* Volumetric projector: single SVG with 5-layer stack */}
        <svg
          ref={svgRootRef}
          className={styles.mainSvg}
          viewBox="0 0 100 100"
          aria-hidden="true"
          focusable="false"
        >
          <RadarFilters fillGradientId={fillGradientId} shouldAnimate={shouldAnimate} />

          <NebulaLayer instanceId={instanceId} />
          <GlowLayer geometry={geometry} />
          <RingsLayer geometry={geometry} />
          <GridLayer geometry={geometry} />
          <DataFlowLayer
            baseRef={baseRef}
            flowRefA={flowRefA}
            flowRefB={flowRefB}
            flowRefC={flowRefC}
            fillGradientId={fillGradientId}
            flowFilterId={flowFilterId}
            shouldJitter={shouldJitter}
            isBloom={isBloom}
            isGold={isGold}
          />
          <OverlayLayer
            ref={overlayRef}
            geometry={geometry}
            icons={icons}
            labels={labels}
            displayValues={displayValues}
            isLimitBreak={isLimitBreak}
            isAwake={isAwake}
            isTopStat={isTopStat}
          />
        </svg>
      </div>
    </div>
  );
}

MagitekRadarChart.propTypes = {
  series: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.number,
    })
  ).isRequired,
  animate: PropTypes.bool,
  ariaLabel: PropTypes.string,
};

export default MagitekRadarChart;

