import { useCallback, useMemo, useState } from 'react';
import { useRouteCleanup } from '../../hooks/useRouteCleanup';
import { MagitekChassis } from '../layout/MagitekChassis';
import HonorUnlockModal from '../Strength/HonorUnlockModal';
import AssessmentSuccessModal from './shared/AssessmentSuccessModal';
import { useUserStore } from '../../stores/userStore';
import { useUIStore } from '../../stores/uiStore';
import {
  calculateFFMI,
  calculateFFMIScore,
  capScoreForSubmission,
  getFFMICategory,
  getLevelFromScore,
  normalizeGender,
} from '../../utils/assessmentScoring';
import { t } from '../../i18n';
import baseStyles from '../../styles/modules/AssessmentBase.module.css';
import styles from '../../styles/modules/FFMIPage.module.css';

/**
 * FFMI Assessment (Rebirth)
 * SSOT: pulls height/weight/bodyFat from global userStore; no redundant input.
 *
 * Legacy mapping note:
 * - FFMI score is stored under `scores.bodyFat` (historical schema).
 */
export default function FFMIAssessment() {
  useRouteCleanup('assessment-ffmi');

  const userProfile = useUserStore((s) => s.userProfile);
  const stats = useUserStore((s) => s.stats);
  const updateUserStats = useUserStore((s) => s.updateUserStats);
  const setLoadingMessage = useUIStore((s) => s.setLoadingMessage);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockModalData, setUnlockModalData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  const userData = useMemo(() => {
    const emailVerified = userProfile?.emailVerified;
    const isVerified =
      userProfile?.isAnonymous === true ? false : emailVerified === false ? false : true;

    const height = stats?.height ?? null;
    const bodyWeight = stats?.bodyWeight ?? stats?.bodyweight ?? stats?.weight ?? null;

    // SSOT bodyFat:
    // - Prefer dedicated `stats.bodyFat` / `stats.bodyFatPercent` if present (backward compatible)
    // - Fallback to last known FFMI input
    const bfFromProfile = stats?.bodyFatPercent ?? stats?.bodyFat ?? null;
    const bfFromTest = stats?.testInputs?.ffmi?.bodyFat ?? null;
    const bodyFat = bfFromProfile ?? bfFromTest ?? null;

    return {
      gender: stats?.gender || userProfile?.gender || null,
      age: stats?.age || null,
      height,
      bodyWeight,
      bodyFat,
      isVerified,
      testInputs: stats?.testInputs || {},
      scores: stats?.scores || {},
    };
  }, [stats, userProfile]);

  const computed = useMemo(() => {
    const g = normalizeGender(userData.gender);
    const height = Number(userData.height);
    const weight = Number(userData.bodyWeight);
    const bf = Number(userData.bodyFat);

    const hasBase =
      Boolean(g) &&
      Number.isFinite(height) &&
      height > 50 &&
      height < 300 &&
      Number.isFinite(weight) &&
      weight > 0 &&
      weight < 1000 &&
      Number.isFinite(bf) &&
      bf > 0 &&
      bf < 70;

    if (!hasBase) {
      return {
        ok: false,
        reason: 'missing',
        ffmi: null,
        adjustedFfmi: null,
        rawScore: null,
        score: null,
        category: '',
        isCapped: false,
      };
    }

    const ffmiResult = calculateFFMI({
      gender: g,
      heightCm: height,
      weightKg: weight,
      bodyFatPercent: bf,
    });

    if (!ffmiResult?.ffmi || !ffmiResult?.adjustedFfmi) {
      return {
        ok: false,
        reason: 'calc-failed',
        ffmi: null,
        adjustedFfmi: null,
        rawScore: null,
        score: null,
        category: '',
        isCapped: false,
      };
    }

    const rawScore = calculateFFMIScore({ gender: g, adjustedFfmi: ffmiResult.adjustedFfmi });
    const category = getFFMICategory({ gender: g, adjustedFfmi: ffmiResult.adjustedFfmi });
    const isCapped = !userData.isVerified && rawScore > 100;

    return {
      ok: true,
      reason: 'ok',
      ffmi: ffmiResult.ffmi,
      adjustedFfmi: ffmiResult.adjustedFfmi,
      rawScore,
      score: Number.isFinite(rawScore) ? Number(rawScore.toFixed(2)) : null,
      category,
      isCapped,
    };
  }, [userData]);

  const ffmiTable = useMemo(() => {
    const g = normalizeGender(userData.gender);
    if (g === 'male') {
      return [
        { range: '16 - 17', description: '偏瘦（一般）' },
        { range: '18 - 19', description: '普通（健身入門）' },
        { range: '20 - 21', description: '健壯（進階）' },
        { range: '22', description: '精英（非常強）' },
        { range: '23 - 25', description: '極限（頂尖）' },
        { range: '26 - 27', description: '超人（可能需長期訓練）' },
        { range: '28+', description: '怪物（極少數）' },
      ];
    }
    return [
      { range: '13 - 14', description: '偏瘦（一般）' },
      { range: '15 - 16', description: '普通（健身入門）' },
      { range: '17 - 18', description: '健壯（進階）' },
      { range: '19 - 21', description: '精英（非常強）' },
      { range: '22+', description: '極限（頂尖）' },
    ];
  }, [userData.gender]);

  const handleUnlockClick = useCallback(() => {
    const level = getLevelFromScore(computed.rawScore ?? Number(computed.score || 0));
    setUnlockModalData({
      exercise: 'FFMI（去脂體重指數）',
      score: computed.rawScore ?? computed.score,
      level,
      weight: null,
    });
    setIsUnlockModalOpen(true);
  }, [computed.rawScore, computed.score]);

  const handleSubmit = useCallback(async () => {
    if (!computed.ok || computed.rawScore === null || computed.score === null) {
      alert('資料不足，無法提交。請先補齊身高、體重、體脂率。');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setLoadingMessage('提交中...');

    try {
      const { scoreToSave } = capScoreForSubmission(computed.rawScore, userData.isVerified);

      const updatedTestInputs = {
        ...userData.testInputs,
        ffmi: {
          ...(userData.testInputs?.ffmi || {}),
          bodyFat: Number(userData.bodyFat),
          ffmi: Number(computed.ffmi?.toFixed?.(2) ?? computed.ffmi) || null,
          rawScore: computed.rawScore,
        },
      };

      const result = await updateUserStats({
        scores: {
          ...userData.scores,
          bodyFat: parseFloat(scoreToSave.toFixed(2)),
        },
        testInputs: updatedTestInputs,
      });

      if (result.success) {
        setShowSuccessModal(true);
      } else {
        alert(result.error || '提交失敗，請稍後再試');
      }
    } catch (e) {
      console.error(e);
      alert('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
      setLoadingMessage(null);
    }
  }, [computed, setLoadingMessage, submitting, updateUserStats, userData]);

  const title = t('assessment.ffmi', '🧪 FFMI 測試');

  return (
    <MagitekChassis>
      <div className={baseStyles.page}>
        <header className={baseStyles.header}>
          <div className={baseStyles.title}>{title}</div>
          <div className={baseStyles.subtitle}>去脂體重指數（Fat Free Mass Index）</div>
          <div className={baseStyles.metaRow}>
            <span className={styles.pill}>性別：{userData.gender ?? '未設定'}</span>
            <span className={styles.pill}>身高：{userData.height ?? '未設定'}</span>
            <span className={styles.pill}>體重：{userData.bodyWeight ?? '未設定'}</span>
            <span className={styles.pill}>體脂率：{userData.bodyFat ?? '未設定'}</span>
          </div>
        </header>

        {!computed.ok && (
          <section className={baseStyles.card}>
            <div className={baseStyles.warning}>
              ⚠️ FFMI 需要「身高、體重、體脂率」。目前資料不足，請先補齊個人資料/體脂率。
            </div>
          </section>
        )}

        {computed.ok && (
          <section className={baseStyles.card}>
            <div className={baseStyles.resultCard}>
              <div className={baseStyles.scoreLine}>
                分數：{computed.score?.toFixed?.(2) ?? computed.score}
                {computed.rawScore !== null && computed.rawScore > 100 && !computed.isCapped && (
                  <span className={baseStyles.verifiedBadge} title="已認證顯示真實分數">
                    ✓
                  </span>
                )}
              </div>
              <div className={styles.note}>FFMI：{computed.ffmi?.toFixed?.(2) ?? computed.ffmi}</div>
              <div className={styles.note}>分類：{computed.category || '--'}</div>

              {computed.isCapped && (
                <>
                  <div className={baseStyles.warning}>⚠️ 未驗證用戶提交時分數將鎖定為 100</div>
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
            disabled={submitting || !computed.ok}
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

