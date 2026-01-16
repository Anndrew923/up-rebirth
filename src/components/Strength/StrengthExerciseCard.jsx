import PropTypes from 'prop-types';
import styles from '../../styles/modules/StrengthExerciseCard.module.css';

/**
 * Strength Exercise Card Component
 * Displays individual exercise input and results
 * Part of Phase 4.2 Rebirth Migration
 */
function StrengthExerciseCard({ exercise, isExpanded, onToggle, onCalculate, onUnlock }) {
  const { key, name, state, setState } = exercise;
  const hasScore = state.score !== null;

  return (
    <div className={`${styles.exerciseCard} ${hasScore ? styles.completed : ''}`}>
      <div className={styles.exerciseHeader} onClick={onToggle}>
        <div className={styles.exerciseHeaderLeft}>
          <span className={styles.exerciseIcon}></span>
          <h3 className={styles.exerciseName}>{name}</h3>
        </div>
        <div className={styles.exerciseHeaderRight}>
          {hasScore && <span className={styles.scoreBadge}>{state.score}</span>}
          <span className={`${styles.expandArrow} ${isExpanded ? styles.expanded : ''}`}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.exerciseContent}>
          <div className={styles.exerciseInputs}>
            <div className={styles.inputGroup}>
              <label htmlFor={`${key}Weight`}>
                重量 (kg)
              </label>
              <input
                id={`${key}Weight`}
                type="number"
                placeholder="重量 (kg)"
                value={state.weight}
                onChange={e =>
                  setState(prev => ({ ...prev, weight: e.target.value }))
                }
                className={styles.inputField}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor={`${key}Reps`}>
                次數
              </label>
              <input
                id={`${key}Reps`}
                type="number"
                placeholder="次數"
                value={state.reps}
                onChange={e =>
                  setState(prev => ({ ...prev, reps: e.target.value }))
                }
                className={styles.inputField}
              />
            </div>

            <button
              onClick={() => onCalculate(state.weight, state.reps, setState, key)}
              className={styles.calculateBtn}
              disabled={!state.weight || !state.reps}
            >
              計算
            </button>
          </div>

          {state.max && (
            <div className={styles.exerciseResult}>
              <p className={styles.maxStrength}>
                最大力量: {state.max} kg
              </p>
              {state.score && (
                <div className={styles.scoreDisplay}>
                  <p style={{ margin: 0 }}>
                    分數: {state.score}
                    {state.rawScore &&
                      state.rawScore > 100 &&
                      !state.isCapped && (
                        <span
                          className={styles.verifiedBadge}
                          title="已認證顯示真實分數"
                        >
                          {' '}
                          ✓
                        </span>
                      )}
                  </p>
                  {state.isCapped && (
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
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

StrengthExerciseCard.propTypes = {
  exercise: PropTypes.object.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onCalculate: PropTypes.func.isRequired,
  onUnlock: PropTypes.func.isRequired,
};

export default StrengthExerciseCard;
