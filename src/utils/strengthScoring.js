/**
 * Strength Scoring Utilities
 * Calculates strength scores based on exercise type, weight, reps, bodyweight, gender, and age
 * Part of Phase 4.2 Rebirth Migration
 * 
 * Ported from legacy strength/scoring.js
 */

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
  // Validate inputs
  if (!exerciseType || !weight || !reps || !bodyweight || !gender || !age) {
    return null;
  }

  if (weight <= 0 || reps <= 0 || bodyweight <= 0 || age <= 0) {
    return null;
  }

  // Normalize gender
  const normalizedGender = gender === 'male' || gender === '男性' ? 'male' : 'female';

  // Calculate relative strength (weight lifted / bodyweight)
  const relativeStrength = weight / bodyweight;

  // Base score calculation (simplified version)
  // This is a placeholder - actual scoring should be based on strength standards
  // For now, we'll use a relative strength formula with age and gender adjustments
  
  let baseScore = relativeStrength * 100;

  // Gender adjustment (males typically have higher strength standards)
  if (normalizedGender === 'male') {
    baseScore = baseScore * 1.0; // No adjustment for males (baseline)
  } else {
    baseScore = baseScore * 1.2; // Females get adjusted multiplier
  }

  // Age adjustment (strength typically peaks in 20s-30s)
  if (age < 20) {
    baseScore = baseScore * 0.9; // Younger athletes
  } else if (age >= 20 && age < 30) {
    baseScore = baseScore * 1.0; // Peak age
  } else if (age >= 30 && age < 40) {
    baseScore = baseScore * 0.95;
  } else if (age >= 40 && age < 50) {
    baseScore = baseScore * 0.9;
  } else if (age >= 50 && age < 60) {
    baseScore = baseScore * 0.85;
  } else {
    baseScore = baseScore * 0.8; // 60+
  }

  // Exercise-specific multipliers (different exercises have different difficulty)
  const exerciseMultipliers = {
    'Bench Press': 1.0,
    'Squat': 1.1,
    'Deadlift': 1.15,
    'Lat Pulldown': 0.9,
    'Overhead Press': 0.95,
    'Pull-ups': 1.2, // Bodyweight exercise gets higher multiplier
  };

  const multiplier = exerciseMultipliers[exerciseType] || 1.0;
  baseScore = baseScore * multiplier;

  // Rep adjustment (higher reps = slightly lower score per rep)
  // This is simplified - actual formula should account for rep ranges
  if (reps > 1) {
    const repFactor = 1 - (reps - 1) * 0.02; // Slight reduction per rep
    baseScore = baseScore * Math.max(0.8, repFactor);
  }

  // Round to 2 decimal places
  return Math.round(baseScore * 100) / 100;
};
