import { useCallback, useMemo, useState } from 'react';
import { useUserStore } from '../../../stores/userStore';
import { useUIStore } from '../../../stores/uiStore';
import { cooperStandardsMale, cooperStandardsFemale } from '../../../constants/assessmentStandards';
import {
  calculate5KmScore,
  capScoreForSubmission,
  getLevelFromScore,
  getCardioAgeRange,
  normalizeGender,
} from '../../../utils/assessmentScoring';

export const useCardioLogic = () => {
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

  const [activeTab, setActiveTab] = useState('cooper'); // 'cooper' | '5km'
  const [distance, setDistance] = useState(userData.testInputs?.cardio?.distance ?? '');
  const [runMinutes, setRunMinutes] = useState(userData.testInputs?.run_5km?.minutes ?? '');
  const [runSeconds, setRunSeconds] = useState(userData.testInputs?.run_5km?.seconds ?? '');

  const [score, setScore] = useState(null);
  const [rawScore, setRawScore] = useState(null);
  const [isCapped, setIsCapped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockModalData, setUnlockModalData] = useState(null);

  const isLimitBroken = rawScore !== null && rawScore > 100;

  const handleCalculate = useCallback(() => {
    const { age, gender } = userData;
    if (!age || !gender) {
      alert('請先在個人資料設定年齡與性別');
      return;
    }

    if (activeTab === 'cooper') {
      const d = parseFloat(distance);
      if (!d || d <= 0) {
        alert('請輸入 12 分鐘跑距離（公尺）');
        return;
      }

      const ageRange = getCardioAgeRange(age);
      const g = normalizeGender(gender) || 'male';
      const standardMap = g === 'male' ? cooperStandardsMale : cooperStandardsFemale;
      const standard = ageRange ? standardMap?.[ageRange] : null;

      if (!standard) {
        alert('找不到對應的 Cooper 標準表（請確認年齡/性別設定）');
        return;
      }

      const min = standard[60];
      const max = standard[100];
      if (!min || !max || max === min) {
        alert('Cooper 標準表資料異常');
        return;
      }

      const slope = 40 / (max - min);
      const calculated = Math.max(0, 60 + (d - min) * slope);
      setRawScore(calculated);
      setScore(calculated.toFixed(2));
      setIsCapped(!userData.isVerified && calculated > 100);
      return;
    }

    const m = parseInt(runMinutes || 0, 10);
    const s = parseInt(runSeconds || 0, 10);
    const totalSec = m * 60 + s;
    if (!totalSec || totalSec <= 0) {
      alert('請輸入 5km 時間（分/秒）');
      return;
    }

    const calculated = calculate5KmScore({ totalSeconds: totalSec });
    setRawScore(calculated);
    setScore(calculated.toFixed(2));
    setIsCapped(!userData.isVerified && calculated > 100);
  }, [activeTab, distance, runMinutes, runSeconds, userData]);

  const handleUnlockClick = useCallback(() => {
    const level = getLevelFromScore(rawScore ?? Number(score || 0));
    const title = activeTab === 'cooper' ? '12 分鐘跑（Cooper）' : '5km 跑';
    setUnlockModalData({
      exercise: `心肺：${title}`,
      score: rawScore ?? score,
      level,
      weight: null,
    });
    setIsUnlockModalOpen(true);
  }, [activeTab, rawScore, score]);

  const getComment = useCallback(() => {
    const s = Number(rawScore ?? score ?? 0);
    const g = normalizeGender(userData.gender);
    if (s >= 100) return g === 'male' ? '傳奇心肺，別忘了恢復。' : '傳奇心肺，太強了。';
    if (s >= 80) return '表現非常優秀，持續保持節奏。';
    if (s >= 60) return '穩定不錯，再加一點間歇訓練會更快。';
    if (s >= 40) return '正在成長，先建立規律跑步習慣。';
    return '先從低強度累積，心肺會很快回來。';
  }, [rawScore, score, userData.gender]);

  const handleSubmit = useCallback(async () => {
    if (!score || rawScore === null) {
      alert('請先計算分數');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setLoadingMessage('提交中...');

    try {
      const { scoreToSave } = capScoreForSubmission(rawScore, userData.isVerified);

      const updatedTestInputs = {
        ...userData.testInputs,
      };

      if (activeTab === 'cooper') {
        updatedTestInputs.cardio = {
          ...(updatedTestInputs.cardio || {}),
          distance: parseFloat(distance) || 0,
        };
      } else {
        const m = parseInt(runMinutes || 0, 10);
        const s = parseInt(runSeconds || 0, 10);
        const totalSec = m * 60 + s;
        const paceInSeconds = totalSec > 0 ? Math.round(totalSec / 5) : 0;

        updatedTestInputs.run_5km = {
          minutes: m,
          seconds: s,
          totalSeconds: totalSec,
          paceInSeconds,
        };
      }

      const result = await updateUserStats({
        scores: {
          ...userData.scores,
          cardio: parseFloat(scoreToSave.toFixed(2)),
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
    activeTab,
    distance,
    runMinutes,
    runSeconds,
    rawScore,
    score,
    submitting,
    setLoadingMessage,
    updateUserStats,
    userData,
  ]);

  return {
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
    isLimitBroken,
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
  };
};

