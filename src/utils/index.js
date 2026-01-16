/**
 * Utils Index - Export all utility functions
 * Part of P0 Core Extraction
 */

// Strength calculations
export {
  calculate1RM,
  calculate1RM_Epley,
  calculate1RM_Brzycki,
  calculate1RM_Lombardi,
  calculate1RM_Average,
  calculateWeightForReps
} from './strengthCalculations';

// Strength scoring
export { calculateStrengthScore } from './strengthScoring';

// DOTS calculator
export {
  calculateDOTS,
  calculateDOTSForLift,
  calculateTotalDOTS
} from './dotsCalculator';

// RPG calculations
export {
  calculateXPForLevel,
  calculateTotalXPForLevel,
  calculateLevelFromXP,
  calculateXPProgress,
  calculateWorkoutXP
} from './rpgCalculations';

// Ladder utilities
export {
  calculateNextLadderWeight,
  calculateLadderProgression,
  calculateLadderVolume,
  generateLadderScheme,
  calculateLadderTime
} from './ladderUtils';

// Validation utilities
export {
  validateFitnessData,
  sanitizeInput,
  validateEmail,
  validatePasswordStrength
} from './validation';

// Format utilities
export {
  formatScore,
  getAgeGroup
} from './formatScore';
