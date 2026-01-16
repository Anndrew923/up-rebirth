import PropTypes from 'prop-types';
import styles from '../../styles/modules/StrengthScoreBreakdown.module.css';

/**
 * Strength Score Breakdown Component
 * Displays detailed score breakdown for all exercises
 * Part of Phase 4.2 Rebirth Migration
 */
function StrengthScoreBreakdown({
  exercises,
  averageScore,
  userData,
  onUnlock,
  getStrengthFeedback,
  getLevelFromScore,
  setIsUnlockModalOpen,
  setUnlockModalData,
}) {
  return (
    <div className={styles.scoreBreakdownCard}>
      <h3>📊 分數</h3>
      <div className={styles.scoreBreakdown}>
        {exercises.map(exercise => (
          <div key={exercise.key} className={styles.scoreItem}>
            <span className={styles.scoreLabel}>{exercise.name}</span>
            <div className={styles.scoreValueContainer}>
              <span className={styles.scoreValue}>
                {exercise.state.score || '無分數'}
                {exercise.state.rawScore &&
                  exercise.state.rawScore > 100 &&
                  !exercise.state.isCapped && (
                    <span
                      className={styles.verifiedBadge}
                      title="已認證顯示真實分數"
                    >
                      {' '}
                      ✓
                    </span>
                  )}
              </span>
              {exercise.state.isCapped && (
                <>
                  <p className={styles.cappedWarning}>
                    ⚠️ 未驗證用戶提交時分數將鎖定為 100
                  </p>
                  <button
                    onClick={() => onUnlock(exercise)}
                    className={styles.unlockBtn}
                    title="點擊解鎖真實實力"
                  >
                    <span className={styles.unlockIcon}>🔒</span>
                    <span className={styles.unlockText}>
                      解鎖限制
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.averageScoreDisplay}>
        <div className={styles.averageScoreContainer}>
          <p className={styles.averageScore} style={{ margin: 0 }}>
            平均分數: {averageScore}
          </p>
          {(() => {
            const hasCappedScore = exercises.some(ex => ex.state.isCapped);
            const avgScoreNum = parseFloat(averageScore);
            const isVerified = userData.isVerified === true;
            const shouldShowUnlock =
              (avgScoreNum > 100 && !isVerified) || hasCappedScore;

            return shouldShowUnlock ? (
              <>
                {!isVerified && (
                  <p className={styles.cappedWarning}>
                    ⚠️ 未驗證用戶提交時分數將鎖定為 100
                  </p>
                )}
                <button
                  onClick={() => {
                    const cappedExercise = exercises.find(
                      ex => ex.state.isCapped
                    );
                    if (cappedExercise) {
                      onUnlock(cappedExercise);
                    } else {
                      const level = getLevelFromScore(avgScoreNum);
                      setUnlockModalData({
                        exercise: '平均分數',
                        score: avgScoreNum,
                        level: level,
                        weight: null,
                      });
                      setIsUnlockModalOpen(true);
                    }
                  }}
                  className={styles.unlockBtn}
                  title="點擊解鎖真實實力"
                >
                  <span className={styles.unlockIcon}>🔒</span>
                  <span className={styles.unlockText}>
                    解鎖限制
                  </span>
                </button>
              </>
            ) : null;
          })()}
        </div>
        <p className={styles.averageComment}>{getStrengthFeedback(averageScore)}</p>
      </div>
    </div>
  );
}

StrengthScoreBreakdown.propTypes = {
  exercises: PropTypes.array.isRequired,
  averageScore: PropTypes.string,
  userData: PropTypes.object.isRequired,
  onUnlock: PropTypes.func.isRequired,
  getStrengthFeedback: PropTypes.func.isRequired,
  getLevelFromScore: PropTypes.func.isRequired,
  setIsUnlockModalOpen: PropTypes.func.isRequired,
  setUnlockModalData: PropTypes.func.isRequired,
};

export default StrengthScoreBreakdown;
