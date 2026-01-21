import { useMemo } from 'react';
import { useUserStore } from '../../stores/userStore';
import { MagitekRadarChart } from '../charts/MagitekRadarChart';
import styles from '../../styles/modules/RadarChartSection.module.css';
import { calculate5KmScore, calculateCooperScore } from '../../utils/assessmentScoring';
import { t } from '../../i18n';

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

  /**
   * Pentagon Resonance Core (strict 5-axis)
   *
   * Axis mapping (reference order):
   * 1) Strength
   * 2) Explosive
   * 3) Cardio
   * 4) FFMI
   * 5) Muscle (SMM)
   *
   * Data linkage policy:
   * - Prefer raw scores from `stats.testInputs` when available (shows true Limit Break values).
   * - Otherwise fallback to `stats.scores` (may be capped for unverified users).
   *
   * Legacy notes:
   * - FFMI is historically stored under `scores.bodyFat` in this codebase.
   * - Muscle(SMM composite) is stored under `scores.muscleMass`.
   */
  const chartData = useMemo(() => {
    const scores = stats?.scores || DEFAULT_SCORES;
    const testInputs = stats?.testInputs || {};

    // Strength raw: average of exercise raw scores if present
    const strengthRawCandidates = [
      testInputs?.strength?.benchPress?.rawScore,
      testInputs?.strength?.squat?.rawScore,
      testInputs?.strength?.deadlift?.rawScore,
      testInputs?.strength?.latPulldown?.rawScore,
      testInputs?.strength?.shoulderPress?.rawScore,
    ]
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n) && n > 0);
    const strengthRaw =
      strengthRawCandidates.length > 0
        ? strengthRawCandidates.reduce((a, b) => a + b, 0) / strengthRawCandidates.length
        : null;

    // Explosive raw: stored in testInputs.power.raw.final
    const explosiveRaw = Number(testInputs?.power?.raw?.final);

    // Cardio raw: recompute from stored inputs (distance or 5km time)
    const cardioFromCooper = (() => {
      const distanceMeters = Number(testInputs?.cardio?.distance);
      if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return null;
      const age = stats?.age;
      const gender = stats?.gender;
      const computed = calculateCooperScore({ distanceMeters, age, gender });
      return Number.isFinite(computed) ? computed : null;
    })();
    const cardioFrom5k = (() => {
      const totalSeconds = Number(testInputs?.run_5km?.totalSeconds);
      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
      const computed = calculate5KmScore({ totalSeconds });
      return Number.isFinite(computed) ? computed : null;
    })();
    const cardioRaw = cardioFromCooper ?? cardioFrom5k;

    // FFMI raw: stored in testInputs.ffmi.rawScore; legacy fallback to scores.bodyFat
    const ffmiRaw = Number(testInputs?.ffmi?.rawScore);

    // Muscle(SMM) raw: stored in testInputs.muscle.finalRawScore; fallback to scores.muscleMass
    const smmRaw = Number(testInputs?.muscle?.finalRawScore);

    const fallbackExplosive = Number(scores.explosivePower || scores.explosive || scores.power) || 0;

    return {
      strength: Number.isFinite(strengthRaw) ? strengthRaw : Number(scores.strength) || 0,
      explosive: Number.isFinite(explosiveRaw) ? explosiveRaw : fallbackExplosive,
      cardio: Number.isFinite(cardioRaw) ? cardioRaw : Number(scores.cardio) || 0,
      ffmi: Number.isFinite(ffmiRaw) ? ffmiRaw : Number(scores.bodyFat) || 0,
      smm: Number.isFinite(smmRaw) ? smmRaw : Number(scores.muscleMass) || 0,
    };
  }, [stats]);

  // Calculate average score
  const averageScore = useMemo(() => {
    const values = Object.values(chartData).filter(score => score > 0);
    if (values.length === 0) return 0;
    return (values.reduce((sum, score) => sum + Number(score), 0) / values.length).toFixed(2);
  }, [chartData]);

  // Strict 5-axis (Pentagon Resonance Core). Values may exceed 100 (Limit Break).
  const radarSeries = useMemo(() => {
    return [
      { label: t('assessment.labels.strength', 'Strength'), value: Number(chartData.strength) || 0 },
      { label: t('assessment.labels.explosive', 'Explosive'), value: Number(chartData.explosive) || 0 },
      { label: t('assessment.labels.cardio', 'Cardio'), value: Number(chartData.cardio) || 0 },
      { label: t('assessment.labels.ffmi', 'FFMI'), value: Number(chartData.ffmi) || 0 },
      { label: t('assessment.labels.smm', 'SMM'), value: Number(chartData.smm) || 0 },
    ];
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
        <div className={styles.chartPlaceholder}>
          <div className={styles.chartGrid}>
            <MagitekRadarChart series={radarSeries} />
          </div>
        </div>
        
        {/* Metrics display - matches legacy implementation */}
        <div className={styles.metricsList}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>力量</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(110, chartData.strength)}%` }}
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
                style={{ width: `${Math.min(110, chartData.explosive)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {chartData.explosive > 0 ? chartData.explosive.toFixed(1) : '--'}
            </span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>有氧能力</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(110, chartData.cardio)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {chartData.cardio > 0 ? chartData.cardio.toFixed(1) : '--'}
            </span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>FFMI</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(110, chartData.ffmi)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {chartData.ffmi > 0 ? chartData.ffmi.toFixed(1) : '--'}
            </span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>肌肉（SMM）</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(110, chartData.smm)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {chartData.smm > 0 ? chartData.smm.toFixed(1) : '--'}
            </span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>平均分數</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricFill}
                style={{ width: `${Math.min(110, averageScore)}%` }}
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
