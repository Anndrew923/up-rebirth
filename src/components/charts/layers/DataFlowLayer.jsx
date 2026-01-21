import styles from '../../../styles/modules/MagitekRadarChart.module.css';

export function DataFlowLayer({
  baseRef,
  flowRefA,
  flowRefB,
  flowRefC,
  fillGradientId,
  flowFilterId = 'magitekFlow',
  particleFilterId = 'magitekParticleJitter',
  shouldJitter,
  isBloom,
  isGold,
}) {
  const hotGlow = isGold
    ? 'drop-shadow(0 0 5px #fff) drop-shadow(0 0 15px var(--magitek-gold)) drop-shadow(0 0 30px var(--magitek-gold-glow))'
    : 'drop-shadow(0 0 5px #fff) drop-shadow(0 0 15px var(--magitek-cyan)) drop-shadow(0 0 30px var(--magitek-cyan-glow))';

  const cFilter = (() => {
    if (isGold) {
      return shouldJitter ? 'url(#magitekParticleJitterGold)' : 'url(#magitekGoldOverexpose)';
    }
    return shouldJitter ? `url(#${particleFilterId})` : undefined;
  })();

  return (
    <g
      className={`${styles.layerData} ${styles.dataBlend} ${isBloom ? styles.bloomActive : ''} ${
        isGold ? styles.goldActive : ''
      }`}
    >
      <g className={styles.dataLayer}>
        {/* 底層：Plasma Base（填充 + 基底光暈） */}
        <polygon
          ref={baseRef}
          className={styles.dataPolygonBase}
          fill={`url(#${fillGradientId})`}
          filter={`url(#${flowFilterId})`}
        />
        {/* 頂層：Particle Flow（3 條粒子河；C 為模糊基底，A/B 為高顆粒粒子） */}
        <polygon
          ref={flowRefC}
          className={`${styles.dataParticle} ${styles.dataParticleC}`}
          filter={cFilter}
        />
        <polygon
          ref={flowRefB}
          className={`${styles.dataParticle} ${styles.dataParticleB}`}
          style={{ filter: hotGlow }}
        />
        <polygon
          ref={flowRefA}
          className={`${styles.dataParticle} ${styles.dataParticleA}`}
          style={{ filter: hotGlow }}
        />
      </g>
    </g>
  );
}

export default DataFlowLayer;

