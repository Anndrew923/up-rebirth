/**
 * Assessment Scoring Utilities (Cardio / Muscle / FFMI / Power)
 * Phase 4.4: Bulk Migration of the P1 Assessment Suite
 *
 * Standards source-of-truth:
 * - src/constants/assessmentStandards.js
 */

import {
  cooperStandardsMale,
  cooperStandardsFemale,
  muscleStandardsMaleSMM,
  muscleStandardsMaleSMPercent,
  muscleStandardsFemaleSMM,
  muscleStandardsFemaleSMPercent,
  verticalJumpStandardsMale,
  verticalJumpStandardsFemale,
  standingLongJumpStandardsMale,
  standingLongJumpStandardsFemale,
  sprintStandardsMale,
  sprintStandardsFemale,
} from '../constants/assessmentStandards.js';

export const normalizeGender = (gender) => {
  if (!gender) return null;
  const g = `${gender}`.toLowerCase();
  if (g === 'male' || gender === '男性') return 'male';
  if (g === 'female' || gender === '女性') return 'female';
  return g.includes('m') ? 'male' : 'female';
};

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * Honor policy:
 * - Unverified: submit-time cap at 100
 * - Verified: allow up to 200 (aligned with userStore.updateUserStats score sanitizer)
 */
export const capScoreForSubmission = (rawScore, isVerified) => {
  const safe = typeof rawScore === 'number' && !Number.isNaN(rawScore) ? rawScore : 0;
  const capped = isVerified ? clamp(safe, 0, 200) : clamp(safe, 0, 100);
  return {
    rawScore: safe,
    scoreToSave: capped,
    isCapped: !isVerified && safe > 100,
    isLimitBroken: safe > 100,
  };
};

/* ============================================================
 * Cardio
 * ============================================================ */

export const getCardioAgeRange = (age) => {
  const ageNum = parseInt(age, 10);
  if (!ageNum || ageNum <= 0) return null;
  if (ageNum >= 13 && ageNum <= 14) return '13-14';
  if (ageNum >= 15 && ageNum <= 16) return '15-16';
  if (ageNum >= 17 && ageNum <= 20) return '17-20';
  if (ageNum >= 21 && ageNum <= 29) return '20-29';
  if (ageNum >= 30 && ageNum <= 39) return '30-39';
  if (ageNum >= 40 && ageNum <= 49) return '40-49';
  if (ageNum >= 50) return '50+';
  return null;
};

export const calculateCooperScore = ({ distanceMeters, age, gender }) => {
  const dist = parseFloat(distanceMeters);
  if (!dist || dist <= 0) return 0;

  const ageRange = getCardioAgeRange(age);
  const g = normalizeGender(gender) || 'male';

  const standardMap = g === 'male' ? cooperStandardsMale : cooperStandardsFemale;
  const standard = ageRange ? standardMap?.[ageRange] : null;
  if (!standard) return 0;

  const min = standard[60];
  const max = standard[100];
  if (!min || !max || max === min) return 0;

  // Legacy logic: 60 + linear extension based on (100-60) segment.
  const slope = 40 / (max - min);
  const calculatedScore = 60 + (dist - min) * slope;
  return Math.round(Math.max(0, calculatedScore) * 100) / 100;
};

export const calculate5KmScore = ({ totalSeconds }) => {
  const sec = parseInt(totalSeconds, 10);
  if (!sec || sec <= 0) return 0;

  const benchmarkSeconds = 20 * 60;
  const baselineSeconds = 45 * 60;

  if (sec <= benchmarkSeconds) {
    const bonus = (benchmarkSeconds - sec) / 10;
    return Math.round((100 + bonus) * 100) / 100;
  }
  if (sec >= baselineSeconds) return 0;

  const range = baselineSeconds - benchmarkSeconds;
  const diff = sec - benchmarkSeconds;
  const score = 100 - (diff / range) * 100;
  return Math.round(score * 100) / 100;
};

export const getLevelFromScore = (scoreNum) => {
  const s = Number(scoreNum) || 0;
  if (s >= 100) return 'legend';
  if (s >= 90) return 'apex';
  if (s >= 80) return 'elite';
  if (s >= 60) return 'steel';
  if (s >= 40) return 'growth';
  return 'potential';
};

/* ============================================================
 * Muscle (SMM + SMM%)
 * ============================================================ */

export const getMuscleAgeRange = (age) => {
  const ageNum = parseInt(age, 10);
  if (!ageNum || ageNum <= 0) return null;
  if (ageNum >= 10 && ageNum <= 12) return '10-12';
  if (ageNum >= 13 && ageNum <= 17) return '13-17';
  if (ageNum >= 18 && ageNum <= 30) return '18-30';
  if (ageNum >= 31 && ageNum <= 40) return '31-40';
  if (ageNum >= 41 && ageNum <= 50) return '41-50';
  if (ageNum >= 51 && ageNum <= 60) return '51-60';
  if (ageNum >= 61 && ageNum <= 70) return '61-70';
  if (ageNum >= 71 && ageNum <= 80) return '71-80';
  return null;
};

// Legacy scoring interpolation + extension beyond 100.
export const calculateScoreFromStandard = (value, standard) => {
  const v = parseFloat(value);
  if (!standard || !Number.isFinite(v)) return 0;

  let rawScore = 0;

  // Extended scoring for values beyond 100
  if (v >= standard[100]) {
    const valueDiff = standard[100] - standard[90];
    const slope = valueDiff > 0 ? 10 / valueDiff : 0;
    const extraValue = v - standard[100];
    let extendedScore = 100 + extraValue * slope;

    // Soft cap after 120: halve the growth
    if (extendedScore > 120) {
      extendedScore = 120 + (extendedScore - 120) * 0.5;
    }

    rawScore = parseFloat(extendedScore.toFixed(2));
  } else {
    if (v <= standard[0]) {
      rawScore = 0;
    } else {
      let lower = 0;
      let upper = 100;
      for (let i = 10; i <= 100; i += 10) {
        if (v < standard[i]) {
          upper = i;
          lower = i - 10;
          break;
        }
      }

      const lowerValue = standard[lower];
      const upperValue = standard[upper];
      if (upperValue === lowerValue) {
        rawScore = upper;
      } else {
        rawScore =
          lower + ((v - lowerValue) / (upperValue - lowerValue)) * (upper - lower);
        rawScore = Math.round(rawScore * 100) / 100;
      }
    }
  }

  return rawScore;
};

export const calculateMuscleScores = ({ smmKg, weightKg, age, gender }) => {
  const w = parseFloat(weightKg);
  const smm = parseFloat(smmKg);
  if (!w || !smm || w <= 0 || smm <= 0) {
    return {
      smPercent: null,
      smmScoreRaw: null,
      smPercentScoreRaw: null,
      smmScoreWeightedRaw: null,
      finalRawScore: null,
    };
  }

  const ageRange = getMuscleAgeRange(age);
  const g = normalizeGender(gender) || 'male';
  if (!ageRange) {
    return {
      smPercent: null,
      smmScoreRaw: null,
      smPercentScoreRaw: null,
      smmScoreWeightedRaw: null,
      finalRawScore: null,
    };
  }

  const smPercent = (smm / w) * 100;

  const smmStandards = g === 'male' ? muscleStandardsMaleSMM : muscleStandardsFemaleSMM;
  const smPercentStandards =
    g === 'male' ? muscleStandardsMaleSMPercent : muscleStandardsFemaleSMPercent;

  const smmStandard = smmStandards[ageRange];
  const smPercentStandard = smPercentStandards[ageRange];
  if (!smmStandard || !smPercentStandard) {
    return {
      smPercent: null,
      smmScoreRaw: null,
      smPercentScoreRaw: null,
      smmScoreWeightedRaw: null,
      finalRawScore: null,
    };
  }

  const smmRaw = calculateScoreFromStandard(smm, smmStandard);
  const smPercentRaw = calculateScoreFromStandard(smPercent, smPercentStandard);

  // Legacy: SMM gets 1.25 weight
  const smmScoreWeightedRaw = parseFloat((smmRaw * 1.25).toFixed(2));
  const finalRawScore = (smmScoreWeightedRaw + smPercentRaw) / 2;

  return {
    smPercent: Math.round(smPercent * 100) / 100,
    smmScoreRaw: Math.round(smmRaw * 100) / 100,
    smPercentScoreRaw: Math.round(smPercentRaw * 100) / 100,
    smmScoreWeightedRaw: Math.round(smmScoreWeightedRaw * 100) / 100,
    finalRawScore: Math.round(finalRawScore * 100) / 100,
  };
};

/* ============================================================
 * FFMI
 * ============================================================ */

export const calculateFFMI = ({ gender, heightCm, weightKg, bodyFatPercent }) => {
  const g = normalizeGender(gender) || 'male';
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  const bf = parseFloat(bodyFatPercent);

  if (!h || !w || bf === null || bf === undefined || Number.isNaN(bf)) {
    return { ffmi: null, adjustedFfmi: null };
  }
  const heightInMeters = h / 100;
  const bodyFatValue = bf / 100;
  const fatFreeMass = w * (1 - bodyFatValue);
  const rawFfmi = fatFreeMass / (heightInMeters * heightInMeters);
  const adjustedFfmi =
    heightInMeters > 1.8 ? rawFfmi + 6.0 * (heightInMeters - 1.8) : rawFfmi;

  return {
    ffmi: Math.round(adjustedFfmi * 100) / 100,
    adjustedFfmi,
    isMale: g === 'male',
  };
};

export const calculateFFMIScore = ({ gender, adjustedFfmi }) => {
  const g = normalizeGender(gender) || 'male';
  const v = parseFloat(adjustedFfmi);
  if (!v || v <= 0) return 0;

  let score;
  if (g === 'male') {
    const baseFfmi = 18.5;
    const maxFfmi = 25;
    if (v <= baseFfmi) score = (v / baseFfmi) * 60;
    else if (v < maxFfmi) score = 60 + ((v - baseFfmi) / (maxFfmi - baseFfmi)) * 40;
    else score = 100 + (v - maxFfmi) * 5;
  } else {
    const baseFfmi = 15.5;
    const maxFfmi = 21;
    if (v <= baseFfmi) score = (v / baseFfmi) * 60;
    else if (v < maxFfmi) score = 60 + ((v - baseFfmi) / (maxFfmi - baseFfmi)) * 40;
    else score = 100 + (v - maxFfmi) * 5;
  }

  return Math.round(score * 100) / 100;
};

export const getFFMICategory = ({ gender, adjustedFfmi }) => {
  const g = normalizeGender(gender) || 'male';
  const v = parseFloat(adjustedFfmi);
  if (!v || v <= 0) return '';

  // Legacy-aligned bucket thresholds (labels simplified; i18n can be added later)
  if (g === 'male') {
    if (v < 18) return '偏瘦（一般）';
    if (v < 20) return '普通（健身入門）';
    if (v < 22) return '健壯（進階）';
    if (v < 23) return '精英（非常強）';
    if (v < 26) return '極限（頂尖）';
    if (v < 28) return '超人（可能需長期訓練）';
    return '怪物（極少數）';
  }

  if (v < 15) return '偏瘦（一般）';
  if (v < 17) return '普通（健身入門）';
  if (v < 19) return '健壯（進階）';
  if (v < 22) return '精英（非常強）';
  return '極限（頂尖）';
};

/* ============================================================
 * Power (Vertical Jump / Standing Long Jump / Sprint)
 * ============================================================ */

export const getPowerAgeRange = (age) => {
  const a = parseInt(age, 10);
  if (!a || a <= 0) return null;
  if (a >= 12 && a <= 15) return '12-15';
  if (a >= 16 && a <= 20) return '16-20';
  if (a >= 21 && a <= 30) return '21-30';
  if (a >= 31 && a <= 40) return '31-40';
  if (a >= 41 && a <= 50) return '41-50';
  if (a >= 51 && a <= 60) return '51-60';
  if (a >= 61 && a <= 70) return '61-70';
  if (a >= 71 && a <= 80) return '71-80';
  return null;
};

export const calculateScoreIncreasing = (value, standard) => {
  const v = parseFloat(value);
  if (!v || v <= 0) return 0;
  if (v < standard[0]) return 0;

  if (v >= standard[100]) {
    const excess = v - standard[100];
    const bonus = excess * 2;
    return Math.round((100 + bonus) * 100) / 100;
  }

  if (v < standard[50]) {
    return Math.round((((v - standard[0]) / (standard[50] - standard[0])) * 50) * 100) / 100;
  }
  return Math.round(
    (50 + ((v - standard[50]) / (standard[100] - standard[50])) * 50) * 100
  ) / 100;
};

export const calculateScoreDecreasing = (value, standard) => {
  const v = parseFloat(value);
  if (!v || v <= 0) return 0;
  if (v > standard[0]) return 0;

  if (v <= standard[100]) {
    const excess = standard[100] - v;
    const bonus = excess * 20;
    return Math.round((100 + bonus) * 100) / 100;
  }

  if (v > standard[50]) {
    return Math.round((((standard[0] - v) / (standard[0] - standard[50])) * 50) * 100) / 100;
  }
  return Math.round(
    (50 + ((standard[50] - v) / (standard[50] - standard[100])) * 50) * 100
  ) / 100;
};

export const getPowerStandards = ({ gender, age }) => {
  const g = normalizeGender(gender) || 'male';
  const range = getPowerAgeRange(age);
  if (!range) return null;

  const vjMap = g === 'male' ? verticalJumpStandardsMale : verticalJumpStandardsFemale;
  const sljMap = g === 'male' ? standingLongJumpStandardsMale : standingLongJumpStandardsFemale;
  const spMap = g === 'male' ? sprintStandardsMale : sprintStandardsFemale;

  return {
    vjump: vjMap[range],
    slj: sljMap[range],
    sprint: spMap[range],
    ageRange: range,
  };
};

export const calculatePowerScores = ({ verticalJump, standingLongJump, sprint, gender, age }) => {
  const standards = getPowerStandards({ gender, age });
  if (!standards?.vjump || !standards?.slj || !standards?.sprint) {
    return {
      verticalJumpRawScore: null,
      standingLongJumpRawScore: null,
      sprintRawScore: null,
      finalRawScore: null,
    };
  }
  const { vjump, slj, sprint: sprintStd } = standards;

  const vj = verticalJump ? calculateScoreIncreasing(verticalJump, vjump) : null;
  const lj = standingLongJump ? calculateScoreIncreasing(standingLongJump, slj) : null;
  const sp = sprint ? calculateScoreDecreasing(sprint, sprintStd) : null;

  const rawScores = [vj, lj, sp].filter((x) => x !== null && x !== undefined);
  const finalRaw = rawScores.length ? rawScores.reduce((a, b) => a + b, 0) / rawScores.length : null;

  return {
    verticalJumpRawScore: vj,
    standingLongJumpRawScore: lj,
    sprintRawScore: sp,
    finalRawScore: finalRaw,
  };
};

