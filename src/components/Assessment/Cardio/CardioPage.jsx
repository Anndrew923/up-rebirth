import { useRouteCleanup } from '../../../hooks/useRouteCleanup';
import { MagitekChassis } from '../../layout/MagitekChassis';
import HonorUnlockModal from '../../Strength/HonorUnlockModal';
import AssessmentSuccessModal from '../shared/AssessmentSuccessModal';
import { useCardioLogic } from './useCardioLogic';
import baseStyles from '../../../styles/modules/AssessmentBase.module.css';
import styles from '../../../styles/modules/CardioPage.module.css';

/**
 * Cardio Page (Rebirth)
 * - Zustand: useUserStore
 * - MagitekChassis wrapped
 * - Route cleanup
 * - CSS Modules only
 * - Zero-Trust submit via updateUserStats()
 */
export default function CardioPage() {
  const {
    userData,
    activeTab,
    setActiveTab,
    distance,
    setDistance,
    runMinutes,
    setRunMinutes,
    runSeconds,
    setRunSeconds,
    score,
    rawScore,
    isCapped,
    isExpanded,
    setIsExpanded,
    submitting,
    showSuccessModal,
    setShowSuccessModal,
    isUnlockModalOpen,
    setIsUnlockModalOpen,
    unlockModalData,
    setUnlockModalData,
    handleCalculate,
    handleSubmit,
    handleUnlockClick,
    getComment,
  } = useCardioLogic();

  useRouteCleanup('assessment-cardio');

  return (
    <MagitekChassis>
      <div className={baseStyles.page}>
        <header className={baseStyles.header}>
          <div className={baseStyles.title}>🫀 心肺測試</div>
          <div className={baseStyles.subtitle}>Cooper 12 分鐘跑 / 5km 跑步</div>
          <div className={baseStyles.metaRow}>
            <span className={styles.metric}>年齡：{userData.age ?? '未設定'}</span>
            <span className={styles.metric}>性別：{userData.gender ?? '未設定'}</span>
          </div>
        </header>

        <section className={baseStyles.card}>
          <div className={baseStyles.tabs}>
            <button
              type="button"
              className={`${baseStyles.tabBtn} ${activeTab === 'cooper' ? baseStyles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('cooper')}
            >
              Cooper（12 分鐘）
            </button>
            <button
              type="button"
              className={`${baseStyles.tabBtn} ${activeTab === '5km' ? baseStyles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('5km')}
            >
              5km 跑
            </button>
          </div>

          <div className={baseStyles.divider} />

          {activeTab === 'cooper' ? (
            <div className={baseStyles.row}>
              <label className={baseStyles.label} htmlFor="cooperDistance">
                12 分鐘跑距離（公尺）
              </label>
              <input
                id="cooperDistance"
                className={baseStyles.input}
                type="number"
                inputMode="numeric"
                placeholder="例如：2600"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>
          ) : (
            <div className={baseStyles.inlineInputs}>
              <div className={baseStyles.row}>
                <label className={baseStyles.label} htmlFor="runMinutes">
                  分
                </label>
                <input
                  id="runMinutes"
                  className={baseStyles.input}
                  type="number"
                  inputMode="numeric"
                  placeholder="例如：24"
                  value={runMinutes}
                  onChange={(e) => setRunMinutes(e.target.value)}
                />
              </div>
              <div className={baseStyles.row}>
                <label className={baseStyles.label} htmlFor="runSeconds">
                  秒
                </label>
                <input
                  id="runSeconds"
                  className={baseStyles.input}
                  type="number"
                  inputMode="numeric"
                  placeholder="例如：30"
                  value={runSeconds}
                  onChange={(e) => setRunSeconds(e.target.value)}
                />
              </div>
            </div>
          )}

          <button type="button" className={baseStyles.primaryBtn} onClick={handleCalculate}>
            計算分數
          </button>
        </section>

        {score !== null && (
          <section className={baseStyles.card}>
            <div className={baseStyles.resultCard}>
              <div className={baseStyles.scoreLine}>
                分數：{score}
                {rawScore !== null && rawScore > 100 && !isCapped && (
                  <span className={baseStyles.verifiedBadge} title="已認證顯示真實分數">
                    ✓
                  </span>
                )}
              </div>

              <div className={styles.comment}>{getComment()}</div>

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
            <div className={baseStyles.sectionTitle}>📜 測試說明</div>
            <div className={baseStyles.arrow}>{isExpanded ? '▲' : '▼'}</div>
          </div>
          {isExpanded && (
            <div className={styles.comment}>
              Cooper：12 分鐘內盡可能跑遠（建議操場或平坦道路）。
              <br />
              5km：輸入你的 5 公里成績時間。若你有 GPS 記錄會更準確。
            </div>
          )}
        </section>

        <div className={baseStyles.submitSection}>
          <button
            type="button"
            className={baseStyles.primaryBtn}
            onClick={handleSubmit}
            disabled={submitting || score === null}
          >
            {submitting ? '提交中...' : '✅ 提交結果'}
          </button>
        </div>

        <AssessmentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="✅ 心肺提交成功！"
          message="你的心肺測試分數已保存。"
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

