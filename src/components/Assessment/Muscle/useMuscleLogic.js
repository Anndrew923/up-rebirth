import { useCallback, useMemo, useState } from 'react';
import { useUserStore } from '../../../stores/userStore';
import { useUIStore } from '../../../stores/uiStore';
import {
  muscleStandardsMaleSMM,
  muscleStandardsMaleSMPercent,
  muscleStandardsFemaleSMM,
  muscleStandardsFemaleSMPercent,
} from '../../../constants/assessmentStandards';
import {
  capScoreForSubmission,
  calculateScoreFromStandard,
  getLevelFromScore,
  getMuscleAgeRange,
  normalizeGender,
} from '../../../utils/assessmentScoring';

export const useMuscleLogic = () => {
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
      bodyWeight: stats?.bodyWeight ?? stats?.bodyweight ?? stats?.weight ?? null,
      isVerified,
      testInputs: stats?.testInputs || {},
      scores: stats?.scores || {},
    };
  }, [userProfile, stats]);

  const [smm, setSmm] = useState(userData.testInputs?.muscle?.smm ?? '');
  const [result, setResult] = useState({
    smmScore: null,
    smPercent: null,
    smPercentScore: null,
    finalScore: null,
    smmRawScore: null,
    smPercentRawScore: null,
    finalRawScore: null,
    isFinalCapped: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockModalData, setUnlockModalData] = useState(null);

  const calculateMuscleScore = useCallback(() => {
    if (!userData.bodyWeight || !userData.age || !userData.gender) {
      alert('請先在個人資料設定體重、年齡與性別');
      return;
    }
    if (!smm) {
      alert('請輸入骨骼肌量（SMM, kg）');
      return;
    }

    const weightNum = parseFloat(userData.bodyWeight);
    const smmNum = parseFloat(smm);
    const ageRange = getMuscleAgeRange(userData.age);
    const g = normalizeGender(userData.gender) || 'male';
    if (!weightNum || !smmNum || !ageRange) {
      alert('輸入無效（請檢查體重 / SMM / 年齡）');
      return;
    }

    const smPercent = (smmNum / weightNum) * 100;

    const smmStandards = g === 'male' ? muscleStandardsMaleSMM : muscleStandardsFemaleSMM;
    const smPercentStandards =
      g === 'male' ? muscleStandardsMaleSMPercent : muscleStandardsFemaleSMPercent;

    const smmStandard = smmStandards[ageRange];
    const smPercentStandard = smPercentStandards[ageRange];
    if (!smmStandard || !smPercentStandard) {
      alert('找不到對應的肌肉標準表（請確認年齡/性別）');
      return;
    }

    const smmRaw = calculateScoreFromStandard(smmNum, smmStandard);
    const smPercentRaw = calculateScoreFromStandard(smPercent, smPercentStandard);
    const smmWeightedRaw = parseFloat((smmRaw * 1.25).toFixed(2));
    const finalRaw = (smmWeightedRaw + smPercentRaw) / 2;

    const isFinalCapped = !userData.isVerified && finalRaw > 100;

    setResult({
      smmScore: smmWeightedRaw.toFixed(2),
      smPercent: smPercent.toFixed(2),
      smPercentScore: smPercentRaw.toFixed(2),
      finalScore: finalRaw.toFixed(2),
      smmRawScore: smmWeightedRaw,
      smPercentRawScore: smPercentRaw,
      finalRawScore: finalRaw,
      isFinalCapped,
    });
  }, [smm, userData]);

  const handleUnlockClick = useCallback(() => {
    const level = getLevelFromScore(result.finalRawScore ?? Number(result.finalScore || 0));
    setUnlockModalData({
      exercise: '肌肉量（SMM/比例）',
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

      const updatedTestInputs = {
        ...userData.testInputs,
        muscle: {
          ...(userData.testInputs?.muscle || {}),
          smm: parseFloat(smm) || 0,
          weight: parseFloat(userData.bodyWeight) || 0,
          smPercent: result.smPercent ? parseFloat(result.smPercent) : null,
          finalRawScore: result.finalRawScore,
        },
      };

      const updateResult = await updateUserStats({
        scores: {
          ...userData.scores,
          muscleMass: parseFloat(scoreToSave.toFixed(2)),
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
    result.smPercent,
    smm,
    submitting,
    setLoadingMessage,
    updateUserStats,
    userData,
  ]);

  return {
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
  };
};

