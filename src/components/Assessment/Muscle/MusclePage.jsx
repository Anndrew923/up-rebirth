import { useRouteCleanup } from '../../../hooks/useRouteCleanup';
import { MagitekChassis } from '../../layout/MagitekChassis';
import HonorUnlockModal from '../../Strength/HonorUnlockModal';
import AssessmentSuccessModal from '../shared/AssessmentSuccessModal';
import { useMuscleLogic } from './useMuscleLogic';
import baseStyles from '../../../styles/modules/AssessmentBase.module.css';
import styles from '../../../styles/modules/MusclePage.module.css';

/**
 * Muscle Page (Rebirth)
 * SMM + SMM% composite scoring.
 */
export default function MusclePage() {
  const {
    userData,
    smm,
    setSmm,
    result,
    calculateMuscleScore,
    submitting,
    showSuccessModal,
    setShowSuccessModal,
    isUnlockModalOpen,
    setIsUnlockModalOpen,
    unlockModalData,
    setUnlockModalData,
    handleUnlockClick,
    handleSubmit,
  } = useMuscleLogic();

  useRouteCleanup('assessment-muscle');

  return (
    <MagitekChassis>
      <div className={baseStyles.page}>
        <header className={baseStyles.header}>
          <div className={baseStyles.title}>🧬 肌肉量測試</div>
          <div className={baseStyles.subtitle}>以 SMM（kg）與 SMM% 合成分數</div>
          <div className={baseStyles.metaRow}>
            <span className={styles.statLine}>體重：{userData.weight ?? '未設定'}</span>
            <span className={styles.statLine}>年齡：{userData.age ?? '未設定'}</span>
            <span className={styles.statLine}>性別：{userData.gender ?? '未設定'}</span>
          </div>
        </header>

        <section className={baseStyles.card}>
          <div className={baseStyles.row}>
            <label className={baseStyles.label} htmlFor="smm">
              骨骼肌量（SMM, kg）
            </label>
            <input
              id="smm"
              className={baseStyles.input}
              type="number"
              inputMode="decimal"
              placeholder="例如：32.5"
              value={smm}
              onChange={(e) => setSmm(e.target.value)}
            />
          </div>

          <button type="button" className={baseStyles.primaryBtn} onClick={calculateMuscleScore}>
            計算分數
          </button>
        </section>

        {result.finalScore && (
          <section className={baseStyles.card}>
            <div className={baseStyles.resultCard}>
              <div className={baseStyles.scoreLine}>
                最終分數：{result.finalScore}
                {result.finalRawScore !== null &&
                  result.finalRawScore > 100 &&
                  !result.isFinalCapped && (
                    <span className={baseStyles.verifiedBadge} title="已認證顯示真實分數">
                      ✓
                    </span>
                  )}
              </div>

              <div className={styles.grid}>
                <div className={styles.statLine}>
                  SMM 加權分：{result.smmScore ?? '--'}
                </div>
                <div className={styles.statLine}>
                  SMM%：{result.smPercent ?? '--'}%
                </div>
                <div className={styles.statLine}>
                  SMM% 分數：{result.smPercentScore ?? '--'}
                </div>
              </div>

              {result.isFinalCapped && (
                <>
                  <div className={baseStyles.warning}>
                    ⚠️ 未驗證用戶提交時分數將鎖定為 100
                  </div>
                  <button type="button" className={baseStyles.unlockBtn} onClick={handleUnlockClick}>
                    <span>🔒</span>
                    <span className={baseStyles.unlockText}>解鎖限制</span>
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        <div className={baseStyles.submitSection}>
          <button
            type="button"
            className={baseStyles.primaryBtn}
            onClick={handleSubmit}
            disabled={submitting || !result.finalScore}
          >
            {submitting ? '提交中...' : '✅ 提交結果'}
          </button>
        </div>

        <AssessmentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="✅ 肌肉量提交成功！"
          message="你的肌肉量測試分數已保存。"
        />

        <HonorUnlockModal
          isOpen={isUnlockModalOpen}
          onClose={() => {
            setIsUnlockModalOpen(false);
            setUnlockModalData(null);
          }}
          data={unlockModalData}
        />
      </div>
    </MagitekChassis>
  );
}

