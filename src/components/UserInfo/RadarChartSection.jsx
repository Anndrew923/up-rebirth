import { useMemo } from 'react';
import { useUserStore } from '../../stores/userStore';
import styles from '../../styles/modules/RadarChartSection.module.css';

/**
 * Radar Chart Section Component
 * Displays user fitness metrics in a radar chart
 * Part of the Rebirth Manifesto: Component Slimming
 * 
 * Ported from legacy UserInfo RadarChartSection
 * Maps scores from userData.scores to radar chart data
 */
export const RadarChartSection = ({ loading = false }) => {
  const stats = useUserStore((state) => state.stats);

  // Default scores structure from legacy code
  const DEFAULT_SCORES = {
    strength: 0,
    explosivePower: 0,
    cardio: 0,
    muscleMass: 0,
    bodyFat: 0,
  };

  // Calculate radar chart data from scores
  const chartData = useMemo(() => {
    const scores = stats?.scores || DEFAULT_SCORES;

    // Map scores directly (they should already be 0-100 range)
    return {
      strength: Number(scores.strength) || 0,
      explosivePower: Number(scores.explosivePower || scores.explosive || scores.power) || 0,
      cardio: Number(scores.cardio) || 0,
      muscleMass: Number(scores.muscleMass) || 0,
      bodyFat: Number(scores.bodyFat) || 0,
    };
  }, [stats?.scores]);

  // Calculate average score
  const averageScore = useMemo(() => {
    const values = Object.values(chartData).filter(score => score > 0);
    if (values.length === 0) return 0;
    return (values.reduce((sum, score) => sum + Number(score), 0) / values.length).toFixed(2);
  }, [chartData]);

  // Calculate completion status
  const completionStatus = useMemo(() => {
    const completedCount = Object.values(chartData).filter(score => score > 0).length;
    return {
      completedCount,
      isFullyCompleted: completedCount === 5,
      progress: (completedCount / 5) * 100,
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className={styles.radarSection}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.radarSection} id="radar-section">
      <h3 className={styles.title}>能力雷達圖</h3>
      
      {/* Completion Status */}
      <div className={styles.completionStatus}>
        <div className={styles.completionText}>
          完成度: {completionStatus.completedCount} / 5
        </div>
        <div className={styles.completionBar}>
          <div 
            className={styles.completionFill}
            style={{ width: `${completionStatus.progress}%` }}
          />
        </div>
      </div>

      <div className={styles.chartContainer}>
        {/* Placeholder for radar chart - will be replaced with actual chart library */}
        <div className={styles.chartPlaceholder}>
          <div className={styles.chartGrid}>
            <div className={styles.chartNote}>
              <p>雷達圖將在此顯示</p>
              <p className={styles.chartSubnote}>
                使用圖表庫（如 recharts）實作
              </p>
            </div>
          </div>
        </div>
        
        {/* Metrics display - matches legacy implementation */}
        <div className={styles.metricsList}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>力量</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(100, chartData.strength)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {chartData.strength > 0 ? chartData.strength.toFixed(1) : '--'}
            </span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>爆發力</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(100, chartData.explosivePower)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {chartData.explosivePower > 0 ? chartData.explosivePower.toFixed(1) : '--'}
            </span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>有氧能力</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(100, chartData.cardio)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {chartData.cardio > 0 ? chartData.cardio.toFixed(1) : '--'}
            </span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>肌肉量</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(100, chartData.muscleMass)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {chartData.muscleMass > 0 ? chartData.muscleMass.toFixed(1) : '--'}
            </span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>體脂率</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(100, chartData.bodyFat)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {chartData.bodyFat > 0 ? chartData.bodyFat.toFixed(1) : '--'}
            </span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>平均分數</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(100, averageScore)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {averageScore > 0 ? averageScore : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarChartSection;
