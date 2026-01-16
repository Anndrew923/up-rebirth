import { useMemo } from 'react';
import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { MagitekChassis } from '../layout/MagitekChassis';
import { useStrengthLogic } from './useStrengthLogic';
import StrengthExerciseCard from './StrengthExerciseCard';
import StrengthRadarChart from './StrengthRadarChart';
import StrengthScoreBreakdown from './StrengthScoreBreakdown';
import StrengthStandardsTab from './StrengthStandardsTab';
import StrengthSuccessModal from './StrengthSuccessModal';
import HonorUnlockModal from './HonorUnlockModal';
import styles from '../../styles/modules/StrengthPage.module.css';

/**
 * Strength Page Component
 * Main strength test page
 * Part of Phase 4.2 Rebirth Migration
 * 
 * Migrated from legacy Strength.jsx
 * - Wrapped in MagitekChassis
 * - Removed BottomNavBar and AdBanner
 * - Uses CSS Modules
 */
function StrengthPage() {
  const {
    currentTab,
    setCurrentTab,
    exercises,
    expandedExercises,
    setExpandedExercises,
    averageScore,
    radarData,
    submitting,
    isUnlockModalOpen,
    setIsUnlockModalOpen,
    unlockModalData,
    setUnlockModalData,
    showSuccessModal,
    setShowSuccessModal,
    calculateMaxStrength,
    handleSubmit,
    handleUnlockClick,
    getStrengthFeedback,
    getLevelFromScore,
    userData,
  } = useStrengthLogic();

  // Navigation defense
  useRouteCleanup('strength');

  const toggleExerciseExpanded = useMemo(
    () => key => {
      const newExpanded = new Set(expandedExercises);
      if (newExpanded.has(key)) {
        newExpanded.delete(key);
      } else {
        newExpanded.add(key);
      }
      setExpandedExercises(newExpanded);
    },
    [expandedExercises, setExpandedExercises]
  );

  return (
    <MagitekChassis>
      <div className={styles.strengthContainer}>
        <div className={styles.strengthHeader}>
          <h1 className={styles.strengthTitle}>💪 力量測試</h1>
          <p className={styles.strengthSafetyNote}>
            請在安全環境下進行測試，如有不適請立即停止
          </p>
        </div>

        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabBtn} ${currentTab === 'exercises' ? styles.active : ''}`}
            onClick={() => setCurrentTab('exercises')}
          >
            🏋️ 開始測試
          </button>
          <button
            className={`${styles.tabBtn} ${currentTab === 'standards' ? styles.active : ''}`}
            onClick={() => setCurrentTab('standards')}
          >
            📋 力量標準
          </button>
        </div>

        {currentTab === 'exercises' && (
          <div className={styles.exercisesTab}>
            <div className={styles.exercisesGrid}>
              {exercises.map(exercise => (
                <StrengthExerciseCard
                  key={exercise.key}
                  exercise={exercise}
                  isExpanded={expandedExercises.has(exercise.key)}
                  onToggle={() => toggleExerciseExpanded(exercise.key)}
                  onCalculate={calculateMaxStrength}
                  onUnlock={handleUnlockClick}
                />
              ))}
            </div>

            {averageScore && (
              <div className={styles.resultsSection}>
                <StrengthRadarChart radarData={radarData} />
                <StrengthScoreBreakdown
                  exercises={exercises}
                  averageScore={averageScore}
                  userData={userData}
                  onUnlock={handleUnlockClick}
                  getStrengthFeedback={getStrengthFeedback}
                  getLevelFromScore={getLevelFromScore}
                  setIsUnlockModalOpen={setIsUnlockModalOpen}
                  setUnlockModalData={setUnlockModalData}
                />
              </div>
            )}
          </div>
        )}

        {currentTab === 'standards' && <StrengthStandardsTab />}

        <div className={styles.submitSection}>
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.submitBtn}
            disabled={!averageScore || submitting}
          >
            {submitting
              ? '提交中...'
              : averageScore
              ? `✅ 提交結果`
              : '請至少完成一項測試'}
          </button>
        </div>

        <HonorUnlockModal
          isOpen={isUnlockModalOpen}
          onClose={() => {
            setIsUnlockModalOpen(false);
            setUnlockModalData(null);
          }}
          data={unlockModalData}
        />

        <StrengthSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
        />
      </div>
    </MagitekChassis>
  );
}

export default StrengthPage;
