/**
 * RPG (Role-Playing Game) Style Calculations
 * Experience points, levels, and progression system
 * Part of P0 Core Extraction
 */

/**
 * Calculate experience points required for a level
 * Uses exponential progression
 * 
 * @param {number} level - Target level
 * @returns {number} Experience points required
 */
export const calculateXPForLevel = (level) => {
  if (level <= 0) {
    return 0;
  }
  
  // Base XP formula: 100 * level^2
  return Math.floor(100 * Math.pow(level, 2));
};

/**
 * Calculate total XP required to reach a level
 * 
 * @param {number} level - Target level
 * @returns {number} Total experience points required
 */
export const calculateTotalXPForLevel = (level) => {
  if (level <= 1) {
    return 0;
  }
  
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += calculateXPForLevel(i);
  }
  
  return totalXP;
};

/**
 * Calculate current level from total XP
 * 
 * @param {number} totalXP - Total experience points
 * @returns {number} Current level
 */
export const calculateLevelFromXP = (totalXP) => {
  if (totalXP <= 0) {
    return 1;
  }
  
  let level = 1;
  let requiredXP = 0;
  
  while (requiredXP <= totalXP) {
    level++;
    requiredXP += calculateXPForLevel(level - 1);
    
    if (level > 1000) {
      // Safety limit
      break;
    }
  }
  
  return Math.max(1, level - 1);
};

/**
 * Calculate XP progress for current level
 * 
 * @param {number} totalXP - Total experience points
 * @returns {Object} { level, currentLevelXP, nextLevelXP, progress }
 */
export const calculateXPProgress = (totalXP) => {
  const level = calculateLevelFromXP(totalXP);
  const totalXPForCurrentLevel = calculateTotalXPForLevel(level);
  const totalXPForNextLevel = calculateTotalXPForLevel(level + 1);
  
  const currentLevelXP = totalXP - totalXPForCurrentLevel;
  const nextLevelXP = totalXPForNextLevel - totalXPForCurrentLevel;
  const progress = nextLevelXP > 0 ? (currentLevelXP / nextLevelXP) * 100 : 100;
  
  return {
    level,
    currentLevelXP,
    nextLevelXP,
    progress: Math.min(100, Math.max(0, progress))
  };
};

/**
 * Award XP for workout completion
 * 
 * @param {number} baseXP - Base XP for the workout
 * @param {Object} multipliers - XP multipliers (difficulty, streak, etc.)
 * @returns {number} Total XP awarded
 */
export const calculateWorkoutXP = (baseXP, multipliers = {}) => {
  let totalXP = baseXP;
  
  // Apply multipliers
  if (multipliers.difficulty) {
    totalXP *= multipliers.difficulty;
  }
  
  if (multipliers.streak) {
    totalXP *= (1 + multipliers.streak * 0.1); // 10% bonus per streak day
  }
  
  if (multipliers.personalRecord) {
    totalXP *= 1.5; // 50% bonus for PR
  }
  
  return Math.floor(totalXP);
};
