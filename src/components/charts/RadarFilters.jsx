import PropTypes from 'prop-types';

/**
 * RadarFilters
 * Centralized <defs> for the volumetric projector.
 *
 * Notes:
 * - `magitekFlow` filter id must remain exact (protocol requirement).
 * - `fillGradientId` is instance-specific to avoid collisions.
 */
export function RadarFilters({ fillGradientId, shouldAnimate }) {
  return (
    <defs>
      {/* L0 Nebula */}
      <radialGradient id="magitekNebula" cx="50%" cy="45%" r="78%">
        <stop offset="0%" stopColor="rgba(2, 6, 18, 1)" stopOpacity="1" />
        <stop offset="55%" stopColor="rgba(32, 6, 64, 1)" stopOpacity="1" />
        <stop offset="100%" stopColor="rgba(0, 0, 0, 1)" stopOpacity="1" />
      </radialGradient>

      {/* Nebula noise (very faint) */}
      <filter id="magitekNebulaNoise" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
      </filter>

      {/* L1 Glow */}
      <radialGradient id="magitekCoreGlow" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="rgba(255,255,255,1)" stopOpacity="0.22" />
        <stop offset="45%" stopColor="var(--magitek-cyan)" stopOpacity="0.14" />
        <stop offset="100%" stopColor="rgba(0,0,0,1)" stopOpacity="0.0" />
      </radialGradient>

      {/* Gold glow for high-energy indicators (small elements only) */}
      <filter id="magitekGoldGlow" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
        <feFlood floodColor="var(--magitek-gold)" floodOpacity="0.78" result="gold" />
        <feComposite in="gold" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Particle jitter (micro turbulence for unstable mana) */}
      <filter
        id="magitekParticleJitter"
        x="-40%"
        y="-40%"
        width="180%"
        height="180%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence type="turbulence" baseFrequency="0.86 0.94" numOctaves="1" seed="9" result="jitterNoise">
          {shouldAnimate ? (
            <animate
              attributeName="baseFrequency"
              values="0.80 0.92;0.98 0.86;0.84 0.96;0.80 0.92"
              dur="1.1s"
              repeatCount="indefinite"
            />
          ) : null}
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="jitterNoise"
          scale="0.65"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      {/* Gold overexposure (white-hot core) */}
      <filter id="magitekGoldOverexpose" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="
            1.55 0    0    0    0.18
            0    1.45 0    0    0.14
            0    0    1.10 0    0.06
            0    0    0    1    0
          "
        />
      </filter>

      {/* Gold jitter + overexposure (C layer awakening) */}
      <filter
        id="magitekParticleJitterGold"
        x="-40%"
        y="-40%"
        width="180%"
        height="180%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence type="turbulence" baseFrequency="0.86 0.94" numOctaves="1" seed="9" result="jitterNoise">
          {shouldAnimate ? (
            <animate
              attributeName="baseFrequency"
              values="0.80 0.92;0.98 0.86;0.84 0.96;0.80 0.92"
              dur="1.1s"
              repeatCount="indefinite"
            />
          ) : null}
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="jitterNoise"
          scale="0.65"
          xChannelSelector="R"
          yChannelSelector="G"
          result="disp"
        />
        <feColorMatrix
          in="disp"
          type="matrix"
          values="
            1.55 0    0    0    0.18
            0    1.45 0    0    0.14
            0    0    1.10 0    0.06
            0    0    0    1    0
          "
        />
      </filter>

      {/* Ring stroke gradient (adds depth without extra geometry) */}
      <linearGradient id="magitekRingStroke" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="var(--magitek-deep-blue)" stopOpacity="0.18" />
        <stop offset="50%" stopColor="var(--magitek-cyan)" stopOpacity="0.22" />
        <stop offset="100%" stopColor="var(--magitek-deep-blue)" stopOpacity="0.18" />
      </linearGradient>

      {/* Advanced energy shader: white-cyan core -> deep cyan-blue edges */}
      <radialGradient id={fillGradientId} cx="50%" cy="42%" r="78%">
        <stop offset="0%" stopColor="rgba(240, 255, 255, 1)" stopOpacity="0.16">
          {shouldAnimate ? (
            <animate
              attributeName="stop-opacity"
              values="0.12;0.20;0.12"
              dur="4.2s"
              repeatCount="indefinite"
            />
          ) : null}
        </stop>
        <stop offset="38%" stopColor="rgba(124, 245, 255, 1)" stopOpacity="0.26">
          {shouldAnimate ? (
            <animate
              attributeName="stop-opacity"
              values="0.20;0.34;0.20"
              dur="4.2s"
              repeatCount="indefinite"
            />
          ) : null}
        </stop>
        <stop offset="72%" stopColor="rgba(0, 191, 255, 1)" stopOpacity="0.22" />
        <stop offset="100%" stopColor="var(--magitek-deep-blue)" stopOpacity="0.16">
          {shouldAnimate ? (
            <animate
              attributeName="stop-opacity"
              values="0.12;0.20;0.12"
              dur="4.2s"
              repeatCount="indefinite"
            />
          ) : null}
        </stop>
      </radialGradient>

      {/* magitekFlow (protocol): turbulence + displacement for the plasma base */}
      <filter
        id="magitekFlow"
        x="-40%"
        y="-40%"
        width="180%"
        height="180%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.018"
          numOctaves="1"
          seed="2"
          result="noise"
        >
          {shouldAnimate ? (
            <animate
              attributeName="baseFrequency"
              values="0.014;0.022;0.014"
              dur="6.0s"
              repeatCount="indefinite"
            />
          ) : null}
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="2.2"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  );
}

RadarFilters.propTypes = {
  fillGradientId: PropTypes.string.isRequired,
  shouldAnimate: PropTypes.bool.isRequired,
};

export default RadarFilters;

