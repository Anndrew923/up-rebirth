import { useCallback, useMemo, useState } from 'react';
import { useUserStore } from '../../../stores/userStore';
import { useUIStore } from '../../../stores/uiStore';
import {
  verticalJumpStandardsMale,
  verticalJumpStandardsFemale,
  standingLongJumpStandardsMale,
  standingLongJumpStandardsFemale,
  sprintStandardsMale,
  sprintStandardsFemale,
} from '../../../constants/assessmentStandards';
import {
  capScoreForSubmission,
  calculateScoreDecreasing,
  calculateScoreIncreasing,
  getLevelFromScore,
  getPowerAgeRange,
  normalizeGender,
} from '../../../utils/assessmentScoring';

export const usePowerLogic = () => {
  const userProfile = useUserStore((s) => s.userProfile);
  const stats = useUserStore((s) => s.stats);
  const updateUserStats = useUserStore((s) => s.updateUserStats);
  const setLoadingMessage = useUIStore((s) => s.setLoadingMessage);

  const userData = useMemo(() => {
    const emailVerified = userProfile?.emailVerified;
    const isVerified =
      userProfile?.isAnonymous === true ? false : emailVerified === false ? false : true;

    return {
      gender: stats?.gender || userProfile?.gender || null,
      age: stats?.age || null,
      isVerified,
      testInputs: stats?.testInputs || {},
      scores: stats?.scores || {},
    };
  }, [userProfile, stats]);

  const [verticalJump, setVerticalJump] = useState(
    userData.testInputs?.power?.verticalJump ?? ''
  );
  const [standingLongJump, setStandingLongJump] = useState(
    userData.testInputs?.power?.standingLongJump ?? ''
  );
  const [sprint, setSprint] = useState(userData.testInputs?.power?.sprint ?? '');

  const [result, setResult] = useState({
    verticalJumpScore: null,
    standingLongJumpScore: null,
    sprintScore: null,
    finalScore: null,
    verticalJumpRawScore: null,
    standingLongJumpRawScore: null,
    sprintRawScore: null,
    finalRawScore: null,
    isCapped: false,
  });

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isStandardsExpanded, setIsStandardsExpanded] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockModalData, setUnlockModalData] = useState(null);

  const calculatePowerScore = useCallback(() => {
    if (!userData.age || !userData.gender) {
      alert('請先在個人資料設定年齡與性別');
      return;
    }
    if (!verticalJump && !standingLongJump && !sprint) {
      alert('請至少輸入一項測量數據');
      return;
    }

    const ageRange = getPowerAgeRange(userData.age);
    const g = normalizeGender(userData.gender) || 'male';
    if (!ageRange) {
      alert('年齡不在可用範圍內');
      return;
    }

    const vjMap = g === 'male' ? verticalJumpStandardsMale : verticalJumpStandardsFemale;
    const sljMap = g === 'male' ? standingLongJumpStandardsMale : standingLongJumpStandardsFemale;
    const spMap = g === 'male' ? sprintStandardsMale : sprintStandardsFemale;

    const vjStd = vjMap[ageRange];
    const sljStd = sljMap[ageRange];
    const spStd = spMap[ageRange];
    if (!vjStd || !sljStd || !spStd) {
      alert('找不到對應的爆發力標準表（請確認年齡/性別）');
      return;
    }

    const vjRaw = verticalJump ? calculateScoreIncreasing(parseFloat(verticalJump), vjStd) : null;
    const sljRaw = standingLongJump
      ? calculateScoreIncreasing(parseFloat(standingLongJump), sljStd)
      : null;
    const spRaw = sprint ? calculateScoreDecreasing(parseFloat(sprint), spStd) : null;

    const rawScores = [vjRaw, sljRaw, spRaw].filter((x) => x !== null && x !== undefined);
    if (rawScores.length === 0) {
      alert('計算失敗，請檢查輸入');
      return;
    }

    const finalRaw = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
    const isCapped = !userData.isVerified && finalRaw > 100;

    setResult({
      verticalJumpScore:
        vjRaw !== null && vjRaw !== undefined
          ? vjRaw.toFixed(2)
          : null,
      standingLongJumpScore:
        sljRaw !== null && sljRaw !== undefined
          ? sljRaw.toFixed(2)
          : null,
      sprintScore:
        spRaw !== null && spRaw !== undefined
          ? spRaw.toFixed(2)
          : null,
      finalScore: finalRaw.toFixed(2),
      verticalJumpRawScore: vjRaw,
      standingLongJumpRawScore: sljRaw,
      sprintRawScore: spRaw,
      finalRawScore: finalRaw,
      isCapped,
    });
  }, [standingLongJump, sprint, userData, verticalJump]);

  const handleUnlockClick = useCallback(() => {
    const level = getLevelFromScore(result.finalRawScore ?? Number(result.finalScore || 0));
    setUnlockModalData({
      exercise: '爆發力（Power）',
      score: result.finalRawScore ?? result.finalScore,
      level,
      weight: null,
    });
    setIsUnlockModalOpen(true);
  }, [result.finalRawScore, result.finalScore]);

  const handleSubmit = useCallback(async () => {
    if (!result.finalScore || result.finalRawScore === null) {
      alert('請先計算分數');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setLoadingMessage('提交中...');

    try {
      const { scoreToSave } = capScoreForSubmission(result.finalRawScore, userData.isVerified);

      const ageRange = getPowerAgeRange(userData.age);
      const g = normalizeGender(userData.gender) || 'male';
      const standards = ageRange
        ? {
            ageRange,
            vjump:
              (g === 'male' ? verticalJumpStandardsMale : verticalJumpStandardsFemale)[ageRange],
            slj:
              (g === 'male' ? standingLongJumpStandardsMale : standingLongJumpStandardsFemale)[ageRange],
            sprint: (g === 'male' ? sprintStandardsMale : sprintStandardsFemale)[ageRange],
          }
        : null;

      const updatedTestInputs = {
        ...userData.testInputs,
        power: {
          ...(userData.testInputs?.power || {}),
          verticalJump: verticalJump ? parseFloat(verticalJump) : null,
          standingLongJump: standingLongJump ? parseFloat(standingLongJump) : null,
          sprint: sprint ? parseFloat(sprint) : null,
          raw: {
            verticalJump: result.verticalJumpRawScore,
            standingLongJump: result.standingLongJumpRawScore,
            sprint: result.sprintRawScore,
            final: result.finalRawScore,
          },
          standardsUsed: standards,
        },
      };

      const updateResult = await updateUserStats({
        scores: {
          ...userData.scores,
          explosivePower: parseFloat(scoreToSave.toFixed(2)),
        },
        testInputs: updatedTestInputs,
      });

      if (updateResult.success) {
        setShowSuccessModal(true);
      } else {
        alert(updateResult.error || '提交失敗，請稍後再試');
      }
    } catch (e) {
      console.error(e);
      alert('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
      setLoadingMessage(null);
    }
  }, [
    result.finalScore,
    result.finalRawScore,
    result.sprintRawScore,
    result.standingLongJumpRawScore,
    result.verticalJumpRawScore,
    sprint,
    standingLongJump,
    submitting,
    setLoadingMessage,
    updateUserStats,
    userData,
    verticalJump,
  ]);

  return {
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
  };
};

