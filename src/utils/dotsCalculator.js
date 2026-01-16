/**
 * DOTS (Dynamic Objective Team Scoring) Calculator
 * Powerlifting coefficient for comparing strength across bodyweights
 * Part of P0 Core Extraction
 * 
 * Reference: https://www.openpowerlifting.org/opl
 */

/**
 * Calculate DOTS coefficient based on bodyweight
 * 
 * @param {number} bodyweight - Bodyweight in kg
 * @returns {number} DOTS coefficient
 */
const getDOTSCoefficient = (bodyweight) => {
  // DOTS formula coefficients
  const a = -0.000001093;
  const b = 0.0007391293;
  const c = -0.1918759221;
  const d = 24.0900756;
  const e = -307.75076;
  
  // Clamp bodyweight to reasonable range (40kg - 200kg)
  const bw = Math.max(40, Math.min(200, bodyweight));
  
  // Calculate coefficient using polynomial formula
  const coefficient = 
    a * Math.pow(bw, 4) +
    b * Math.pow(bw, 3) +
    c * Math.pow(bw, 2) +
    d * bw +
    e;
  
  return Math.max(0, coefficient);
};

/**
 * Calculate DOTS score
 * 
 * @param {number} total - Total weight lifted (sum of squat, bench, deadlift) in kg
 * @param {number} bodyweight - Bodyweight in kg
 * @returns {number} DOTS score
 */
export const calculateDOTS = (total, bodyweight) => {
  if (total <= 0 || bodyweight <= 0) {
    return 0;
  }
  
  const coefficient = getDOTSCoefficient(bodyweight);
  return total * coefficient;
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
export const calculateTotalDOTS = (squat, bench, deadlift, bodyweight) => {
  const total = squat + bench + deadlift;
  return calculateDOTS(total, bodyweight);
};
