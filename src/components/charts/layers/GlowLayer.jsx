import styles from '../../../styles/modules/MagitekRadarChart.module.css';

export function GlowLayer({ geometry }) {
  return (
    <g className={styles.layerGlow}>
      <circle
        className={styles.glowLayer}
        cx={geometry.cx}
        cy={geometry.cy}
        r={geometry.glowRadius}
        fill="url(#magitekCoreGlow)"
      />
    </g>
  );
}

export default GlowLayer;

