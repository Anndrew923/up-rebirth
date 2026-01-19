/**
 * DOTS (Dynamic Objective Team Scoring) Calculator
 * Powerlifting coefficient for comparing strength across bodyweights
 * Part of P0 Core Extraction
 * 
 * Reference: https://www.openpowerlifting.org/opl
 */

/**
 * IPF DOTS coefficients (source-of-truth):
 * - src/constants/assessmentStandards.js
 */
import { DOTS_COEFFICIENTS } from '../constants/assessmentStandards.js';

const normalizeGender = (gender) => {
  const g = `${gender || 'male'}`.toLowerCase();
  return g === 'female' || gender === '女性' ? 'female' : 'male';
};

/**
 * Strict IPF DOTS score for a single lift (or total).
 *
 * Formula:
 * DOTS = (liftedWeight * 500) / (A*bw^4 + B*bw^3 + C*bw^2 + D*bw + E)
 *
 * @param {number} bodyWeight - Bodyweight in kg
 * @param {number} liftedWeight - Lifted weight (kg) or total (kg)
 * @param {'male'|'female'|string} gender
 * @returns {number}
 */
export const calculateDOTS_IPF = (bodyWeight, liftedWeight, gender = 'male') => {
  const bw = parseFloat(bodyWeight);
  const lw = parseFloat(liftedWeight);

  if (!bw || bw <= 0 || !Number.isFinite(bw) || Number.isNaN(bw)) return 0;
  if (!lw || lw <= 0 || !Number.isFinite(lw) || Number.isNaN(lw)) return 0;

  const g = normalizeGender(gender);
  const coeff = DOTS_COEFFICIENTS[g];
  if (!coeff) return 0;

  const denominator =
    coeff.A * Math.pow(bw, 4) +
    coeff.B * Math.pow(bw, 3) +
    coeff.C * Math.pow(bw, 2) +
    coeff.D * bw +
    coeff.E;

  if (!Number.isFinite(denominator) || Number.isNaN(denominator)) return 0;
  if (Math.abs(denominator) < 0.0001) return 0;

  const dots = (lw * 500) / denominator;
  if (!Number.isFinite(dots) || Number.isNaN(dots)) return 0;
  return dots;
};

/**
 * Calculate DOTS score
 * 
 * @param {number} total - Total weight lifted (sum of squat, bench, deadlift) in kg
 * @param {number} bodyweight - Bodyweight in kg
 * @param {'male'|'female'|string} gender - Optional, default male (legacy behavior)
 * @returns {number} DOTS score
 */
export const calculateDOTS = (total, bodyweight, gender = 'male') => {
  return calculateDOTS_IPF(bodyweight, total, gender);
};

/**
 * Calculate DOTS score for individual lift
 * 
 * @param {number} liftWeight - Weight of individual lift in kg
 * @param {number} bodyweight - Bodyweight in kg
 * @returns {number} DOTS score for the lift
 */
export const calculateDOTSForLift = (liftWeight, bodyweight) => {
  return calculateDOTS(liftWeight, bodyweight);
};

/**
 * Calculate total DOTS from three lifts
 * 
 * @param {number} squat - Squat weight in kg
 * @param {number} bench - Bench press weight in kg
 * @param {number} deadlift - Deadlift weight in kg
 * @param {number} bodyweight - Bodyweight in kg
 * @returns {number} Total DOTS score
 */
export const calculateTotalDOTS = (squat, bench, deadlift, bodyweight, gender = 'male') => {
  const total = squat + bench + deadlift;
  return calculateDOTS(total, bodyweight, gender);
};
