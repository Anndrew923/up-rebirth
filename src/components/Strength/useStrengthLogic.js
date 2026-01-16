import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useUIStore } from '../../stores/uiStore';
import { calculateStrengthScore } from '../../utils/strengthScoring';
import { calculate1RM } from '../../utils/strengthCalculations';

/**
 * Strength Logic Hook
 * Manages all strength test state and calculations
 * Part of Phase 4.2 Rebirth Migration
 * 
 * Migrated from legacy useStrengthLogic.js
 * - Replaced UserContext with useUserStore
 * - Integrated Zero-Trust validation via userStore.updateUserStats()
 */

// Exercise type mapping
const exerciseTypeMap = {
  benchPress: 'Bench Press',
  squat: 'Squat',
  deadlift: 'Deadlift',
  latPulldown: 'Lat Pulldown',
  shoulderPress: 'Overhead Press',
};

export function useStrengthLogic() {
  const userProfile = useUserStore((state) => state.userProfile);
  const stats = useUserStore((state) => state.stats);
  const updateUserStats = useUserStore((state) => state.updateUserStats);
  const setLoadingMessage = useUIStore((state) => state.setLoadingMessage);

  // Get user data from store
  const userData = useMemo(() => {
    return {
      gender: stats?.gender || userProfile?.gender || null,
      age: stats?.age || null,
      weight: stats?.bodyweight || stats?.weight || null,
      isVerified: userProfile?.emailVerified || false,
      testInputs: stats?.testInputs || {},
      scores: stats?.scores || {},
    };
  }, [userProfile, stats]);

  const { gender, age } = userData;

  // Tab state
  const [currentTab, setCurrentTab] = useState('exercises');

  // Exercise states - initialize from stored testInputs or empty
  const getInitialExerciseState = (exerciseKey) => {
    const stored = userData.testInputs?.strength?.[exerciseKey] || {};
    return {
      weight: stored.weight || '',
      reps: stored.reps || '',
      max: stored.max || null,
      score: stored.score || null,
      rawScore: stored.rawScore || null,
      isCapped: stored.isCapped || false,
    };
  };

  const [benchPress, setBenchPress] = useState(getInitialExerciseState('benchPress'));
  const [squat, setSquat] = useState(getInitialExerciseState('squat'));
  const [deadlift, setDeadlift] = useState(getInitialExerciseState('deadlift'));
  const [latPulldown, setLatPulldown] = useState(getInitialExerciseState('latPulldown'));
  const [shoulderPress, setShoulderPress] = useState(getInitialExerciseState('shoulderPress'));

  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockModalData, setUnlockModalData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState(new Set());
  const timeoutRef = useRef(null);

  // Calculate max strength
  const calculateMaxStrength = useCallback(
    (weight, reps, setState, type) => {
      if (!weight || !reps) {
        alert('請輸入重量和次數');
        return;
      }

      const weightNum = parseFloat(weight);
      const repsNum = parseFloat(reps);
      const userWeight = parseFloat(userData.weight);
      const userAge = parseFloat(age);

      if (!userWeight || !userAge) {
        alert('請先完成個人資料設定（體重、年齡）');
        return;
      }

      if (repsNum > 10) {
        alert('次數不能超過 10 次');
        setState(prev => ({ ...prev, reps: '' }));
        return;
      }

      const exerciseType = exerciseTypeMap[type];
      const genderValue = gender === 'male' || gender === '男性' ? 'male' : 'female';

      // Calculate strength score
      const finalScore = calculateStrengthScore(
        exerciseType,
        weightNum,
        repsNum,
        userWeight,
        genderValue,
        userAge
      );

      if (finalScore === null) {
        alert('計算失敗，請檢查輸入');
        return;
      }

      // Calculate 1RM
      const liftWeight = exerciseType === 'Pull-ups' ? userWeight + weightNum : weightNum;
      const oneRepMax = calculate1RM(liftWeight, repsNum);

      const isVerified = userData.isVerified === true;
      const isCapped = !isVerified && finalScore > 100;

      setState(prev => ({
        ...prev,
        max: oneRepMax.toFixed(2),
        score: finalScore.toFixed(2),
        rawScore: finalScore,
        isCapped: isCapped,
      }));
    },
    [userData.weight, userData.isVerified, age, gender]
  );

  // Auto-calculate existing data
  useEffect(() => {
    if (gender && userData.weight && age) {
      const exercisesToCalculate = [
        { key: 'benchPress', state: benchPress, setState: setBenchPress },
        { key: 'squat', state: squat, setState: setSquat },
        { key: 'deadlift', state: deadlift, setState: setDeadlift },
        { key: 'latPulldown', state: latPulldown, setState: setLatPulldown },
        { key: 'shoulderPress', state: shoulderPress, setState: setShoulderPress },
      ];

      exercisesToCalculate.forEach(({ key, state, setState }) => {
        if (state.weight && state.reps && !state.score) {
          calculateMaxStrength(state.weight, state.reps, setState, key);
        }
      });
    }
  }, [
    gender,
    userData.weight,
    age,
    benchPress,
    squat,
    deadlift,
    latPulldown,
    shoulderPress,
    calculateMaxStrength,
  ]);

  // Get strength feedback
  const getStrengthFeedback = (score) => {
    const scoreNum = parseFloat(score);
    if (scoreNum >= 100) return '傳奇級別';
    if (scoreNum >= 90) return '巔峰級別';
    if (scoreNum >= 80) return '精英級別';
    if (scoreNum >= 60) return '鋼鐵級別';
    if (scoreNum >= 40) return '成長級別';
    return '潛力級別';
  };

  // Calculate average score
  const rawScores = [
    benchPress.rawScore !== null && benchPress.rawScore !== undefined
      ? benchPress.rawScore
      : parseFloat(benchPress.score) || null,
    squat.rawScore !== null && squat.rawScore !== undefined
      ? squat.rawScore
      : parseFloat(squat.score) || null,
    deadlift.rawScore !== null && deadlift.rawScore !== undefined
      ? deadlift.rawScore
      : parseFloat(deadlift.score) || null,
    latPulldown.rawScore !== null && latPulldown.rawScore !== undefined
      ? latPulldown.rawScore
      : parseFloat(latPulldown.score) || null,
    shoulderPress.rawScore !== null && shoulderPress.rawScore !== undefined
      ? shoulderPress.rawScore
      : parseFloat(shoulderPress.score) || null,
  ].filter(score => score !== null);

  const averageScore =
    rawScores.length > 0
      ? (rawScores.reduce((a, b) => a + b, 0) / rawScores.length).toFixed(2)
      : null;

  // Handle submit - Zero-Trust validation via userStore
  const handleSubmit = async () => {
    if (!averageScore) {
      alert('請至少完成一項測試');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setLoadingMessage('提交中...');

    try {
      const rawScores = [
        benchPress.rawScore,
        squat.rawScore,
        deadlift.rawScore,
        latPulldown.rawScore,
        shoulderPress.rawScore,
      ].filter(score => score !== null && score !== undefined);

      if (rawScores.length === 0) {
        alert('請至少完成一項測試');
        setSubmitting(false);
        setLoadingMessage(null);
        return;
      }

      const rawAverageScore =
        rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
      const isVerified = userData.isVerified === true;
      const scoreToSave =
        !isVerified && rawAverageScore > 100 ? 100 : rawAverageScore;

      // Build test inputs
      const updatedTestInputs = {
        ...userData.testInputs,
        strength: {
          benchPress: {
            weight: benchPress.weight,
            reps: benchPress.reps,
            max: benchPress.max,
            score: benchPress.score,
            rawScore: benchPress.rawScore,
            isCapped: benchPress.isCapped,
          },
          squat: {
            weight: squat.weight,
            reps: squat.reps,
            max: squat.max,
            score: squat.score,
            rawScore: squat.rawScore,
            isCapped: squat.isCapped,
          },
          deadlift: {
            weight: deadlift.weight,
            reps: deadlift.reps,
            max: deadlift.max,
            score: deadlift.score,
            rawScore: deadlift.rawScore,
            isCapped: deadlift.isCapped,
          },
          latPulldown: {
            weight: latPulldown.weight,
            reps: latPulldown.reps,
            max: latPulldown.max,
            score: latPulldown.score,
            rawScore: latPulldown.rawScore,
            isCapped: latPulldown.isCapped,
          },
          shoulderPress: {
            weight: shoulderPress.weight,
            reps: shoulderPress.reps,
            max: shoulderPress.max,
            score: shoulderPress.score,
            rawScore: shoulderPress.rawScore,
            isCapped: shoulderPress.isCapped,
          },
          bodyWeight: parseFloat(userData.weight),
        },
      };

      // Update via Zero-Trust validated method
      // Note: updateUserStats expects flat structure, so we merge scores and testInputs
      const result = await updateUserStats({
        scores: {
          ...userData.scores,
          strength: parseFloat(scoreToSave.toFixed(2)),
        },
        testInputs: updatedTestInputs,
      });

      if (result.success) {
        setShowSuccessModal(true);
      } else {
        alert(result.error || '提交失敗，請稍後再試');
      }
    } catch (error) {
      console.error('提交失敗:', error);
      alert('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
      setLoadingMessage(null);
    }
  };

  // Get level from score
  const getLevelFromScore = (score) => {
    if (!score) return '新手';
    if (score >= 100) return '主權級';
    if (score >= 80) return '騎士級';
    if (score >= 60) return '先鋒級';
    if (score >= 40) return '守護級';
    return '新手';
  };

  // Handle unlock click
  const handleUnlockClick = (exercise) => {
    const { name, state } = exercise;
    const level = getLevelFromScore(state.score);
    setUnlockModalData({
      exercise: name,
      score: state.score,
      level: level,
      weight: state.weight,
    });
    setIsUnlockModalOpen(true);
  };

  // Exercises config
  const exercises = [
    {
      key: 'benchPress',
      name: '臥推',
      state: benchPress,
      setState: setBenchPress,
    },
    {
      key: 'squat',
      name: '深蹲',
      state: squat,
      setState: setSquat,
    },
    {
      key: 'deadlift',
      name: '硬舉',
      state: deadlift,
      setState: setDeadlift,
    },
    {
      key: 'latPulldown',
      name: '滑輪下拉',
      state: latPulldown,
      setState: setLatPulldown,
    },
    {
      key: 'shoulderPress',
      name: '肩推',
      state: shoulderPress,
      setState: setShoulderPress,
    },
  ];

  // Radar chart data
  const radarData = useMemo(
    () => [
      {
        name: '臥推',
        value: Math.min(parseFloat(benchPress.score) || 0, 100),
        rawValue: benchPress.rawScore || parseFloat(benchPress.score) || 0,
        isCapped: benchPress.isCapped || false,
      },
      {
        name: '深蹲',
        value: Math.min(parseFloat(squat.score) || 0, 100),
        rawValue: squat.rawScore || parseFloat(squat.score) || 0,
        isCapped: squat.isCapped || false,
      },
      {
        name: '硬舉',
        value: Math.min(parseFloat(deadlift.score) || 0, 100),
        rawValue: deadlift.rawScore || parseFloat(deadlift.score) || 0,
        isCapped: deadlift.isCapped || false,
      },
      {
        name: '滑輪下拉',
        value: Math.min(parseFloat(latPulldown.score) || 0, 100),
        rawValue: latPulldown.rawScore || parseFloat(latPulldown.score) || 0,
        isCapped: latPulldown.isCapped || false,
      },
      {
        name: '肩推',
        value: Math.min(parseFloat(shoulderPress.score) || 0, 100),
        rawValue: shoulderPress.rawScore || parseFloat(shoulderPress.score) || 0,
        isCapped: shoulderPress.isCapped || false,
      },
    ],
    [
      benchPress.score,
      benchPress.rawScore,
      benchPress.isCapped,
      squat.score,
      squat.rawScore,
      squat.isCapped,
      deadlift.score,
      deadlift.rawScore,
      deadlift.isCapped,
      latPulldown.score,
      latPulldown.rawScore,
      latPulldown.isCapped,
      shoulderPress.score,
      shoulderPress.rawScore,
      shoulderPress.isCapped,
    ]
  );

  return {
    // State
    currentTab,
    setCurrentTab,
    exercises,
    expandedExercises,
    setExpandedExercises,
    averageScore,
    radarData,
    submitting,
    isUnlockModalOpen,
    setIsUnlockModalOpen,
    unlockModalData,
    setUnlockModalData,
    showSuccessModal,
    setShowSuccessModal,
    // Functions
    calculateMaxStrength,
    handleSubmit,
    handleUnlockClick,
    getStrengthFeedback,
    getLevelFromScore,
    exerciseTypeMap,
    userData,
  };
}
