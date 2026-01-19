import { useRouteCleanup } from '../../../hooks/useRouteCleanup';
import { MagitekChassis } from '../../layout/MagitekChassis';
import HonorUnlockModal from '../../Strength/HonorUnlockModal';
import AssessmentSuccessModal from '../shared/AssessmentSuccessModal';
import { useFFMILogic } from './useFFMILogic';
import baseStyles from '../../../styles/modules/AssessmentBase.module.css';
import styles from '../../../styles/modules/FFMIPage.module.css';

/**
 * FFMI Page (Rebirth)
 * Stores score into `scores.bodyFat` (legacy mapping).
 */
export default function FFMIPage() {
  const {
    userData,
    bodyFat,
    setBodyFat,
    ffmi,
    ffmiScore,
    ffmiRawScore,
    isCapped,
    ffmiCategory,
    isExpanded,
    setIsExpanded,
    isTableExpanded,
    setIsTableExpanded,
    submitting,
    showSuccessModal,
    setShowSuccessModal,
    isUnlockModalOpen,
    setIsUnlockModalOpen,
    unlockModalData,
    setUnlockModalData,
    calculateScores,
    handleSubmit,
    handleUnlockClick,
    ffmiTable,
  } = useFFMILogic();

  useRouteCleanup('assessment-ffmi');

  return (
    <MagitekChassis>
      <div className={baseStyles.page}>
        <header className={baseStyles.header}>
          <div className={baseStyles.title}>🧪 FFMI 測試</div>
          <div className={baseStyles.subtitle}>去脂體重指數（Fat Free Mass Index）</div>
          <div className={baseStyles.metaRow}>
            <span className={styles.pill}>性別：{userData.gender ?? '未設定'}</span>
            <span className={styles.pill}>身高：{userData.height ?? '未設定'}</span>
            <span className={styles.pill}>體重：{userData.weight ?? '未設定'}</span>
          </div>
        </header>

        <section className={baseStyles.card}>
          <div className={baseStyles.row}>
            <label className={baseStyles.label} htmlFor="bodyFat">
              體脂率（%）
            </label>
            <input
              id="bodyFat"
              className={baseStyles.input}
              type="number"
              inputMode="decimal"
              placeholder="例如：18"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
            />
          </div>
          <button type="button" className={baseStyles.primaryBtn} onClick={calculateScores}>
            計算分數
          </button>
        </section>

        {ffmi && (
          <section className={baseStyles.card}>
            <div className={baseStyles.resultCard}>
              <div className={baseStyles.scoreLine}>
                分數：{ffmiScore}
                {ffmiRawScore !== null && ffmiRawScore > 100 && !isCapped && (
                  <span className={baseStyles.verifiedBadge} title="已認證顯示真實分數">
                    ✓
                  </span>
                )}
              </div>
              <div className={styles.note}>FFMI：{ffmi}</div>
              <div className={styles.note}>分類：{ffmiCategory || '--'}</div>

              {isCapped && (
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

        <section className={baseStyles.card}>
          <div
            className={baseStyles.collapsibleHeader}
            onClick={() => setIsExpanded(!isExpanded)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded);
            }}
          >
            <div className={baseStyles.sectionTitle}>📜 FFMI 是什麼？</div>
            <div className={baseStyles.arrow}>{isExpanded ? '▲' : '▼'}</div>
          </div>
          {isExpanded && (
            <div className={styles.note}>
              FFMI 以「去脂體重」與「身高」估算你的肌肉量密度，適合用來追蹤長期身材變化。
              <br />
              注意：身高非常高、體脂非常高/非常低時，解讀要更保守。
            </div>
          )}
        </section>

        <section className={baseStyles.card}>
          <div
            className={baseStyles.collapsibleHeader}
            onClick={() => setIsTableExpanded(!isTableExpanded)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsTableExpanded(!isTableExpanded);
            }}
          >
            <div className={baseStyles.sectionTitle}>📋 參考表（概略）</div>
            <div className={baseStyles.arrow}>{isTableExpanded ? '▲' : '▼'}</div>
          </div>
          {isTableExpanded && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>範圍</th>
                  <th>評估</th>
                </tr>
              </thead>
              <tbody>
                {ffmiTable.map((row) => (
                  <tr key={row.range}>
                    <td>{row.range}</td>
                    <td>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className={baseStyles.submitSection}>
          <button
            type="button"
            className={baseStyles.primaryBtn}
            onClick={handleSubmit}
            disabled={submitting || !ffmiScore}
          >
            {submitting ? '提交中...' : '✅ 提交結果'}
          </button>
        </div>

        <AssessmentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="✅ FFMI 提交成功！"
          message="你的 FFMI 測試分數已保存。"
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

