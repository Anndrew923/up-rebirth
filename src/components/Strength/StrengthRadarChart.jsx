import PropTypes from 'prop-types';
import styles from '../../styles/modules/StrengthRadarChart.module.css';

/**
 * Strength Radar Chart Component
 * Displays strength scores in a radar chart format
 * Part of Phase 4.2 Rebirth Migration
 */
function StrengthRadarChart({ radarData }) {
  return (
    <div className={styles.radarChart}>
      <h3 className={styles.chartTitle}>力量分數雷達圖</h3>
      <div className={styles.chartPlaceholder}>
        <div className={styles.chartGrid}>
          {radarData.map((item, index) => (
            <div key={index} className={styles.chartItem}>
              <div className={styles.chartLabel}>{item.name}</div>
              <div className={styles.chartBar}>
                <div
                  className={styles.chartFill}
                  style={{ width: `${Math.min(100, item.value)}%` }}
                />
              </div>
              <div className={styles.chartValue}>
                {item.value > 0 ? item.value.toFixed(1) : '--'}
                {item.isCapped && <span className={styles.cappedIndicator}>*</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

StrengthRadarChart.propTypes = {
  radarData: PropTypes.array.isRequired,
};

export default StrengthRadarChart;
