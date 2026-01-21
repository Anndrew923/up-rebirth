import { forwardRef } from 'react';
import styles from '../../../styles/modules/MagitekRadarChart.module.css';
import { AXIS_COUNT } from '../useRadarGeometry';

function OverlayLayerInner(
  { geometry, icons, labels, displayValues, isLimitBreak, isTopStat, isAwake },
  ref
) {
  return (
    <g ref={ref} className={styles.layerOverlay}>
      {Array.from({ length: AXIS_COUNT }, (_, i) => {
        const top = Boolean(isTopStat?.[i]);
        const awake = Boolean(isAwake?.[i]);
        const gold = top || awake;
        return (
          <g key={`icon-${i}`} className={styles.iconGroup}>
          {(() => {
            const x2 = geometry.iconEnds[i * 2];
            const y2 = geometry.iconEnds[i * 2 + 1];
            const dx = x2 - geometry.cx;
            const dy = y2 - geometry.cy;
            const len = Math.max(1e-6, Math.hypot(dx, dy));
            const ux = dx / len;
            const uy = dy / len;
            const start = 4.3;
            const end = 8.2;
            return (
              <line
                className={styles.beaconLine}
                x1={geometry.cx + ux * start}
                y1={geometry.cy + uy * start}
                x2={x2 - ux * end}
                y2={y2 - uy * end}
              />
            );
          })()}

          <g
            className={`${styles.beaconWrap} ${isLimitBreak[i] ? styles.limitBreak : ''} ${
              isTopStat[i] ? styles.topStat : ''
            } ${awake ? styles.awakeStat : ''}`}
          >
            {/* Vertex eruption (Limit Break overload) */}
            {isLimitBreak[i] ? (
              <circle
                className={styles.eruptionRing}
                cx={geometry.iconEnds[i * 2]}
                cy={geometry.iconEnds[i * 2 + 1]}
                r="14.0"
              />
            ) : null}

            <circle
              className={styles.beaconHalo}
              cx={geometry.iconEnds[i * 2]}
              cy={geometry.iconEnds[i * 2 + 1]}
              r="10.6"
            />
            <circle
              className={styles.beaconGlow}
              cx={geometry.iconEnds[i * 2]}
              cy={geometry.iconEnds[i * 2 + 1]}
              r="7.7"
            />
            <circle
              className={styles.iconBg}
              cx={geometry.iconEnds[i * 2]}
              cy={geometry.iconEnds[i * 2 + 1]}
              r="5.6"
            />
            <text
              className={styles.iconText}
              x={geometry.iconEnds[i * 2]}
              y={geometry.iconEnds[i * 2 + 1] + 1.6}
              textAnchor="middle"
            >
              {icons[i]}
            </text>
          </g>

          <text
            className={`${styles.valueText} ${gold ? styles.valueTop : ''}`}
            x={geometry.iconEnds[i * 2]}
            y={geometry.iconEnds[i * 2 + 1] + 13.2}
            textAnchor="middle"
          >
            {displayValues[i]}
          </text>

          {labels[i] ? (
            <text
              className={`${styles.labelText} ${gold ? styles.labelTop : ''}`}
              x={geometry.iconEnds[i * 2]}
              y={geometry.iconEnds[i * 2 + 1] + 19.0}
              textAnchor="middle"
            >
              {labels[i]}
            </text>
          ) : null}
        </g>
        );
      })}
    </g>
  );
}

export const OverlayLayer = forwardRef(OverlayLayerInner);
export default OverlayLayer;

