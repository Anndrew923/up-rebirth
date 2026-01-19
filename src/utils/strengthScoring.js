/**
 * Strength Scoring Utilities
 * Calculates strength scores based on exercise type, weight, reps, bodyweight, gender, and age
 * Part of Phase 4.2 Rebirth Migration
 * 
 * Ported from legacy strength/scoring.js
 */

import { calculate1RM_Brzycki } from './strengthCalculations.js';
import { calculateDOTS_IPF } from './dotsCalculator.js';
import { ANCHOR_DOTS } from '../constants/assessmentStandards.js';

/**
 * McCulloch age correction coefficient (legacy logic).
 * @param {number} age
 * @returns {number}
 */
export function getMcCullochCoefficient(age) {
  const a = Number(age);
  if (!a || a <= 0 || !Number.isFinite(a) || Number.isNaN(a)) return 1.0;

  if (a < 14) return 1.23;

  if (a >= 14 && a <= 23) {
    const progress = (a - 14) / (23 - 14);
    return 1.23 - progress * 0.23;
  }

  if (a >= 24 && a <= 40) return 1.0;

  if (a >= 41 && a <= 44) return 1.045;
  if (a >= 45 && a <= 49) return 1.11;
  if (a >= 50 && a <= 54) return 1.15;
  if (a >= 55 && a <= 59) return 1.2;
  if (a >= 60 && a <= 64) return 1.25;
  if (a >= 65 && a <= 69) return 1.3;
  if (a >= 70 && a <= 74) return 1.35;
  if (a >= 75 && a <= 79) return 1.4;

  return 1.45;
}

/**
 * Calculate strength score for a given exercise
 * 
 * @param {string} exerciseType - Exercise type (e.g., 'Bench Press', 'Squat', 'Deadlift')
 * @param {number} weight - Weight lifted in kg
 * @param {number} reps - Number of repetitions
 * @param {number} bodyweight - User's bodyweight in kg
 * @param {string} gender - User's gender ('male' or 'female')
 * @param {number} age - User's age
 * @returns {number|null} Strength score (0-100+), or null if invalid
 */
export const calculateStrengthScore = (exerciseType, weight, reps, bodyweight, gender, age) => {
  // Validate required inputs
  if (!exerciseType || exerciseType.length === 0) return null;

  // 🛡️ ZERO-TRUST SAFETY GUARD: bodyweight must be a positive finite number.
  // Return 0 (not null) to prevent UI overflow.
  const bw = Number(bodyweight);
  if (
    bw === null ||
    bw === undefined ||
    bw <= 0 ||
    !Number.isFinite(bw) ||
    Number.isNaN(bw)
  ) {
    console.warn(
      `[calculateStrengthScore] Invalid bodyweight: ${bodyweight}. Returning 0.`
    );
    return 0;
  }

  const w = Number(weight);
  const r = Number(reps);
  const a = Number(age);

  if (!w || w <= 0 || !Number.isFinite(w) || Number.isNaN(w)) return null;
  if (!r || r <= 0 || !Number.isFinite(r) || Number.isNaN(r)) return null;
  if (!a || a <= 0 || !Number.isFinite(a) || Number.isNaN(a)) return null;

  const normalizedGender = gender === 'female' || gender === '女性' ? 'female' : 'male';

  if (!(exerciseType in ANCHOR_DOTS)) {
    console.warn(`[calculateStrengthScore] Invalid exerciseType: ${exerciseType}`);
    return null;
  }

  // 1) Determine lift weight used for 1RM
  const liftWeight =
    exerciseType === 'Pull-ups' ? bw + w : w;

  // 2) 1RM via Brzycki
  const oneRepMax = calculate1RM_Brzycki(liftWeight, r);

  // 3) Raw DOTS via IPF formula
  const rawDOTS = calculateDOTS_IPF(bw, oneRepMax, normalizedGender);

  // 4) Age correction
  const ageCorrection = getMcCullochCoefficient(a);
  const correctedDOTS = rawDOTS * ageCorrection;

  // 5) Normalize by anchor DOTS
  const anchor = ANCHOR_DOTS[exerciseType];
  const finalScore = (correctedDOTS / anchor) * 100;

  if (!Number.isFinite(finalScore) || Number.isNaN(finalScore) || finalScore > 500) {
    console.error(
      `[calculateStrengthScore] Abnormal score detected: ${finalScore}. Inputs: weight=${w}, reps=${r}, bodyWeight=${bw}, gender=${normalizedGender}, age=${a}`
    );
    return 0;
  }

  return Math.round(finalScore * 100) / 100;
};
