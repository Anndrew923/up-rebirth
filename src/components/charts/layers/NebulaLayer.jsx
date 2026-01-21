import { useMemo } from 'react';
import styles from '../../../styles/modules/MagitekRadarChart.module.css';

const STAR_COUNT_FAR = 26;
const STAR_COUNT_NEAR = 14;

function hashToSeed(str) {
  const s = String(str || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function NebulaLayer({ instanceId }) {
  const starfield = useMemo(() => {
    const seed = hashToSeed(instanceId || 'magitek');
    const rand = mulberry32(seed);

    const makeStars = (count, { rMin, rMax, oMin, oMax }) => {
      const stars = [];
      for (let i = 0; i < count; i++) {
        const x = rand() * 100;
        const y = rand() * 100;
        const r = rMin + rand() * (rMax - rMin);
        const o = oMin + rand() * (oMax - oMin);
        const tw = rand() * 6; // twinkle duration
        const td = rand() * 6; // delay
        stars.push({ x, y, r, o, tw, td });
      }
      return stars;
    };

    return {
      far: makeStars(STAR_COUNT_FAR, { rMin: 0.22, rMax: 0.55, oMin: 0.10, oMax: 0.28 }),
      near: makeStars(STAR_COUNT_NEAR, { rMin: 0.45, rMax: 0.95, oMin: 0.16, oMax: 0.45 }),
    };
  }, [instanceId]);

  return (
    <g className={styles.layerNebula}>
      <rect className={styles.nebulaBase} x="0" y="0" width="100" height="100" fill="url(#magitekNebula)" />
      <rect
        className={styles.nebulaNoise}
        x="0"
        y="0"
        width="100"
        height="100"
        fill="rgba(255,255,255,1)"
        filter="url(#magitekNebulaNoise)"
      />
      <g className={styles.starfieldFar}>
        {starfield.far.map((s, idx) => (
          <circle
            key={`sf-${idx}`}
            className={styles.star}
            cx={s.x}
            cy={s.y}
            r={s.r}
            opacity={s.o}
            style={{ animationDuration: `${4 + s.tw}s`, animationDelay: `${s.td}s` }}
          />
        ))}
      </g>
      <g className={styles.starfieldNear}>
        {starfield.near.map((s, idx) => (
          <circle
            key={`sn-${idx}`}
            className={`${styles.star} ${styles.starNear}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            opacity={s.o}
            style={{ animationDuration: `${3.5 + s.tw}s`, animationDelay: `${s.td}s` }}
          />
        ))}
      </g>
    </g>
  );
}

export default NebulaLayer;

