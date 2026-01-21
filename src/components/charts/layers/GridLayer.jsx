import styles from '../../../styles/modules/MagitekRadarChart.module.css';
import { AXIS_COUNT } from '../useRadarGeometry';

export function GridLayer({ geometry }) {
  return (
    <g className={styles.layerGrid}>
      {geometry.ringPolys.map((points, idx) => (
        <polygon key={idx} className={styles.gridRing} points={points} />
      ))}
      {Array.from({ length: AXIS_COUNT }, (_, i) => (
        <line
          key={i}
          className={styles.axisLine}
          x1={geometry.cx}
          y1={geometry.cy}
          x2={geometry.axisEnds[i * 2]}
          y2={geometry.axisEnds[i * 2 + 1]}
        />
      ))}
      <circle className={styles.engineCoreOuter} cx={geometry.cx} cy={geometry.cy} r="3.6" />
      <circle className={styles.engineCoreInner} cx={geometry.cx} cy={geometry.cy} r="1.7" />
    </g>
  );
}

export default GridLayer;

