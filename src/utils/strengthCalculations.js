/**
 * Strength Calculation Utilities
 * Pure functions for 1RM (One Rep Max) calculations
 * Part of P0 Core Extraction
 */

/**
 * Calculate 1RM using Epley formula
 * Formula: weight * (1 + reps / 30)
 * 
 * @param {number} weight - Weight lifted in kg
 * @param {number} reps - Number of repetitions
 * @returns {number} Estimated 1RM in kg
 */
export const calculate1RM_Epley = (weight, reps) => {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }
  
  if (reps === 1) {
    return weight;
  }
  
  return weight * (1 + reps / 30);
};

/**
 * Calculate 1RM using Brzycki formula
 * Formula: weight * (36 / (37 - reps))
 * 
 * @param {number} weight - Weight lifted in kg
 * @param {number} reps - Number of repetitions
 * @returns {number} Estimated 1RM in kg
 */
export const calculate1RM_Brzycki = (weight, reps) => {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }
  
  if (reps === 1) {
    return weight;
  }
  
  if (reps >= 37) {
    return weight; // Prevent division by zero or negative
  }
  
  return weight * (36 / (37 - reps));
};

/**
 * Calculate 1RM using Lombardi formula
 * Formula: weight * reps^0.1
 * 
 * @param {number} weight - Weight lifted in kg
 * @param {number} reps - Number of repetitions
 * @returns {number} Estimated 1RM in kg
 */
export const calculate1RM_Lombardi = (weight, reps) => {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }
  
  if (reps === 1) {
    return weight;
  }
  
  return weight * Math.pow(reps, 0.1);
};

/**
 * Calculate 1RM using average of multiple formulas
 * Uses Epley, Brzycki, and Lombardi formulas
 * 
 * @param {number} weight - Weight lifted in kg
 * @param {number} reps - Number of repetitions
 * @returns {number} Average estimated 1RM in kg
 */
export const calculate1RM_Average = (weight, reps) => {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }
  
  if (reps === 1) {
    return weight;
  }
  
  const epley = calculate1RM_Epley(weight, reps);
  const brzycki = calculate1RM_Brzycki(weight, reps);
  const lombardi = calculate1RM_Lombardi(weight, reps);
  
  return (epley + brzycki + lombardi) / 3;
};

/**
 * Calculate 1RM (default: average method)
 * 
 * @param {number} weight - Weight lifted in kg
 * @param {number} reps - Number of repetitions
 * @param {string} method - Calculation method ('epley', 'brzycki', 'lombardi', 'average')
 * @returns {number} Estimated 1RM in kg
 */
export const calculate1RM = (weight, reps, method = 'average') => {
  switch (method.toLowerCase()) {
    case 'epley':
      return calculate1RM_Epley(weight, reps);
    case 'brzycki':
      return calculate1RM_Brzycki(weight, reps);
    case 'lombardi':
      return calculate1RM_Lombardi(weight, reps);
    case 'average':
    default:
      return calculate1RM_Average(weight, reps);
  }
};

/**
 * Calculate weight for specific rep range based on 1RM
 * 
 * @param {number} oneRM - One rep max in kg
 * @param {number} targetReps - Target number of repetitions
 * @param {string} method - Calculation method
 * @returns {number} Estimated weight for target reps
 */
export const calculateWeightForReps = (oneRM, targetReps, method = 'average') => {
  if (oneRM <= 0 || targetReps <= 0) {
    return 0;
  }
  
  if (targetReps === 1) {
    return oneRM;
  }
  
  const reps = Math.max(1, parseFloat(targetReps));

  // Reverse calculation: invert common 1RM formulas
  const epley = oneRM / (1 + reps / 30);
  const brzycki = oneRM * ((37 - reps) / 36);
  const lombardi = oneRM / Math.pow(reps, 0.1);

  let estimatedWeight;
  switch (method) {
    case 'epley':
      estimatedWeight = epley;
      break;
    case 'brzycki':
      estimatedWeight = brzycki;
      break;
    case 'lombardi':
      estimatedWeight = lombardi;
      break;
    case 'average':
    default:
      estimatedWeight = (epley + brzycki + lombardi) / 3;
      break;
  }

  return Math.max(0, estimatedWeight);
};
