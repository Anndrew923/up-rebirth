import styles from '../../../styles/modules/MagitekRadarChart.module.css';

export function RingsLayer({ geometry }) {
  return (
    <g className={styles.layerRings}>
      <g className={styles.stabilizerGroup}>
        {geometry.degreeTicks.map((t, idx) => (
          <line
            key={`deg-${idx}`}
            className={t.isMajor ? styles.degreeTickMajor : styles.degreeTickMinor}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
          />
        ))}
        <circle
          className={styles.stabilizerRing}
          cx={geometry.cx}
          cy={geometry.cy}
          r={geometry.stabilizerRadius}
        />
        {geometry.stabilizerTicks.map((points, idx) => (
          <polygon key={`tick-${idx}`} className={styles.stabilizerTick} points={points} />
        ))}
      </g>

      {/* Rippling scan ring (digital scan line) */}
      <circle className={styles.scanRing} cx={geometry.cx} cy={geometry.cy} r="200" />
    </g>
  );
}

export default RingsLayer;

