import { useMemo } from 'react';
import { useRouteCleanup } from '../../../hooks/useRouteCleanup';
import { MagitekChassis } from '../../layout/MagitekChassis';
import HonorUnlockModal from '../../Strength/HonorUnlockModal';
import AssessmentSuccessModal from '../shared/AssessmentSuccessModal';
import { usePowerLogic } from './usePowerLogic';
import { getPowerStandards } from '../../../utils/assessmentScoring';
import baseStyles from '../../../styles/modules/AssessmentBase.module.css';
import styles from '../../../styles/modules/PowerPage.module.css';

/**
 * Power Page (Rebirth)
 * Explosive power composite: Vertical Jump / Standing Long Jump / Sprint.
 */
export default function PowerPage() {
  const {
    userData,
    verticalJump,
    setVerticalJump,
    standingLongJump,
    setStandingLongJump,
    sprint,
    setSprint,
    result,
    isDescriptionExpanded,
    setIsDescriptionExpanded,
    isStandardsExpanded,
    setIsStandardsExpanded,
    submitting,
    showSuccessModal,
    setShowSuccessModal,
    isUnlockModalOpen,
    setIsUnlockModalOpen,
    unlockModalData,
    setUnlockModalData,
    calculatePowerScore,
    handleSubmit,
    handleUnlockClick,
  } = usePowerLogic();

  useRouteCleanup('assessment-power');

  const standards = useMemo(() => {
    if (!userData.gender || !userData.age) return null;
    return getPowerStandards({ gender: userData.gender, age: userData.age });
  }, [userData.gender, userData.age]);

  return (
    <MagitekChassis>
      <div className={baseStyles.page}>
        <header className={baseStyles.header}>
          <div className={baseStyles.title}>⚡ 爆發力測試</div>
          <div className={baseStyles.subtitle}>跳躍 / 跳遠 / 衝刺（可只做其中一項）</div>
          <div className={baseStyles.metaRow}>
            <span className={styles.note}>年齡：{userData.age ?? '未設定'}</span>
            <span className={styles.note}>性別：{userData.gender ?? '未設定'}</span>
          </div>
        </header>

        <section className={baseStyles.card}>
          <div className={baseStyles.row}>
            <label className={baseStyles.label} htmlFor="verticalJump">
              垂直跳（cm）
            </label>
            <input
              id="verticalJump"
              className={baseStyles.input}
              type="number"
              inputMode="decimal"
              placeholder="例如：55"
              value={verticalJump}
              onChange={(e) => setVerticalJump(e.target.value)}
            />
          </div>

          <div className={baseStyles.row}>
            <label className={baseStyles.label} htmlFor="standingLongJump">
              立定跳遠（cm）
            </label>
            <input
              id="standingLongJump"
              className={baseStyles.input}
              type="number"
              inputMode="decimal"
              placeholder="例如：230"
              value={standingLongJump}
              onChange={(e) => setStandingLongJump(e.target.value)}
            />
          </div>

          <div className={baseStyles.row}>
            <label className={baseStyles.label} htmlFor="sprint">
              衝刺（秒）
            </label>
            <input
              id="sprint"
              className={baseStyles.input}
              type="number"
              inputMode="decimal"
              placeholder="例如：12.5"
              value={sprint}
              onChange={(e) => setSprint(e.target.value)}
            />
          </div>

          <button type="button" className={baseStyles.primaryBtn} onClick={calculatePowerScore}>
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
                  !result.isCapped && (
                    <span className={baseStyles.verifiedBadge} title="已認證顯示真實分數">
                      ✓
                    </span>
                  )}
              </div>

              <div className={styles.kv}>
                <div>垂直跳分數：{result.verticalJumpScore ?? '--'}</div>
                <div>立定跳遠分數：{result.standingLongJumpScore ?? '--'}</div>
                <div>衝刺分數：{result.sprintScore ?? '--'}</div>
              </div>

              {result.isCapped && (
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
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsDescriptionExpanded(!isDescriptionExpanded);
            }}
          >
            <div className={baseStyles.sectionTitle}>📜 測試說明</div>
            <div className={baseStyles.arrow}>{isDescriptionExpanded ? '▲' : '▼'}</div>
          </div>
          {isDescriptionExpanded && (
            <div className={styles.note}>
              - 垂直跳：原地起跳，記錄最高跳躍高度（cm）。
              <br />
              - 立定跳遠：雙腳起跳，量測落地點距離（cm）。
              <br />
              - 衝刺：可用固定距離的短跑計時（秒）；建議用同一距離長期追蹤。
            </div>
          )}
        </section>

        <section className={baseStyles.card}>
          <div
            className={baseStyles.collapsibleHeader}
            onClick={() => setIsStandardsExpanded(!isStandardsExpanded)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsStandardsExpanded(!isStandardsExpanded);
            }}
          >
            <div className={baseStyles.sectionTitle}>📋 參考標準（概略）</div>
            <div className={baseStyles.arrow}>{isStandardsExpanded ? '▲' : '▼'}</div>
          </div>
          {isStandardsExpanded && standards && (
            <>
              <div className={styles.note}>
                本頁使用「年齡/性別」做基準曲線換算（非醫療標準），用於自我追蹤即可。
              </div>
              <ul className={styles.list}>
                <li>垂直跳：0/50/100 ≈ {standards.vjump[0].toFixed(0)}/{standards.vjump[50].toFixed(0)}/{standards.vjump[100].toFixed(0)} cm</li>
                <li>立定跳遠：0/50/100 ≈ {standards.slj[0].toFixed(0)}/{standards.slj[50].toFixed(0)}/{standards.slj[100].toFixed(0)} cm</li>
                <li>衝刺：0/50/100 ≈ {standards.sprint[0].toFixed(1)}/{standards.sprint[50].toFixed(1)}/{standards.sprint[100].toFixed(1)} 秒</li>
              </ul>
            </>
          )}
        </section>

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
          title="✅ 爆發力提交成功！"
          message="你的爆發力測試分數已保存。"
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

