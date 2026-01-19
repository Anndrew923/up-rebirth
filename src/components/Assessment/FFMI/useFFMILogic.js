import { useCallback, useMemo, useState } from 'react';
import { useUserStore } from '../../../stores/userStore';
import { useUIStore } from '../../../stores/uiStore';
import {
  calculateFFMI,
  calculateFFMIScore,
  capScoreForSubmission,
  getFFMICategory,
  getLevelFromScore,
  normalizeGender,
} from '../../../utils/assessmentScoring';

export const useFFMILogic = () => {
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
      height: stats?.height || null,
      bodyWeight: stats?.bodyWeight ?? stats?.bodyweight ?? stats?.weight ?? null,
      isVerified,
      testInputs: stats?.testInputs || {},
      scores: stats?.scores || {},
    };
  }, [userProfile, stats]);

  const [bodyFat, setBodyFat] = useState(userData.testInputs?.ffmi?.bodyFat ?? '');
  const [ffmi, setFfmi] = useState(null);
  const [ffmiScore, setFfmiScore] = useState(null);
  const [ffmiRawScore, setFfmiRawScore] = useState(null);
  const [ffmiCategory, setFfmiCategory] = useState('');
  const [isCapped, setIsCapped] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockModalData, setUnlockModalData] = useState(null);

  const calculateScores = useCallback(() => {
    const { gender, height, bodyWeight, age } = userData;
    if (!gender || !height || !bodyWeight || !age) {
      alert('請先在個人資料設定性別、身高、體重、年齡');
      return;
    }
    const bf = parseFloat(bodyFat);
    if (Number.isNaN(bf) || bf <= 0 || bf >= 70) {
      alert('請輸入合理體脂率（1 - 69）');
      return;
    }

    const ffmiResult = calculateFFMI({
      gender,
      heightCm: height,
      weightKg: bodyWeight,
      bodyFatPercent: bf,
    });

    if (!ffmiResult.ffmi) {
      alert('計算失敗，請檢查輸入');
      return;
    }

    const rawScore = calculateFFMIScore({ gender, adjustedFfmi: ffmiResult.adjustedFfmi });
    const category = getFFMICategory({ gender, adjustedFfmi: ffmiResult.adjustedFfmi });

    setFfmi(ffmiResult.ffmi.toFixed(2));
    setFfmiRawScore(rawScore);
    setFfmiScore(rawScore.toFixed(2));
    setFfmiCategory(category);
    setIsCapped(!userData.isVerified && rawScore > 100);
  }, [bodyFat, userData]);

  const handleUnlockClick = useCallback(() => {
    const level = getLevelFromScore(ffmiRawScore ?? Number(ffmiScore || 0));
    setUnlockModalData({
      exercise: 'FFMI（去脂體重指數）',
      score: ffmiRawScore ?? ffmiScore,
      level,
      weight: null,
    });
    setIsUnlockModalOpen(true);
  }, [ffmiRawScore, ffmiScore]);

  const handleSubmit = useCallback(async () => {
    if (!ffmi || ffmiRawScore === null || !ffmiScore) {
      alert('請先計算分數');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setLoadingMessage('提交中...');

    try {
      const { scoreToSave } = capScoreForSubmission(ffmiRawScore, userData.isVerified);

      const updatedTestInputs = {
        ...userData.testInputs,
        ffmi: {
          ...(userData.testInputs?.ffmi || {}),
          bodyFat: parseFloat(bodyFat) || 0,
          ffmi: parseFloat(ffmi) || null,
          rawScore: ffmiRawScore,
        },
      };

      // Legacy mapping: FFMI score is stored under `bodyFat` in overall scores
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
  }, [
    bodyFat,
    ffmi,
    ffmiRawScore,
    ffmiScore,
    submitting,
    setLoadingMessage,
    updateUserStats,
    userData,
  ]);

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

  return {
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
  };
};

