/**
 * Ladder System Utilities
 * Progressive overload and workout progression calculations
 * Part of P0 Core Extraction
 */

/**
 * Calculate next weight for ladder progression
 * 
 * @param {number} currentWeight - Current weight in kg
 * @param {number} increment - Weight increment in kg (default: 2.5kg)
 * @returns {number} Next weight
 */
export const calculateNextLadderWeight = (currentWeight, increment = 2.5) => {
  if (currentWeight <= 0) {
    return increment;
  }
  
  return currentWeight + increment;
};

/**
 * Calculate ladder progression based on completion rate
 * 
 * @param {number} currentWeight - Current weight in kg
 * @param {number} targetReps - Target repetitions
 * @param {number} completedReps - Completed repetitions
 * @param {number} increment - Weight increment in kg
 * @returns {Object} { nextWeight, shouldProgress, shouldRegress }
 */
export const calculateLadderProgression = (
  currentWeight,
  targetReps,
  completedReps,
  increment = 2.5
) => {
  const completionRate = completedReps / targetReps;
  
  let nextWeight = currentWeight;
  let shouldProgress = false;
  let shouldRegress = false;
  
  if (completionRate >= 1.0) {
    // Completed all reps - progress
    nextWeight = calculateNextLadderWeight(currentWeight, increment);
    shouldProgress = true;
  } else if (completionRate < 0.7) {
    // Completed less than 70% - consider regression
    nextWeight = Math.max(0, currentWeight - increment);
    shouldRegress = true;
  } else {
    // Maintain current weight
    nextWeight = currentWeight;
  }
  
  return {
    nextWeight,
    shouldProgress,
    shouldRegress,
    completionRate
  };
};

/**
 * Calculate volume for ladder workout
 * 
 * @param {number} weight - Weight in kg
 * @param {Array<number>} repScheme - Array of rep counts for each set
 * @returns {number} Total volume (weight * total reps)
 */
export const calculateLadderVolume = (weight, repScheme) => {
  if (!Array.isArray(repScheme) || repScheme.length === 0) {
    return 0;
  }
  
  const totalReps = repScheme.reduce((sum, reps) => sum + reps, 0);
  return weight * totalReps;
};

/**
 * Generate ladder rep scheme
 * 
 * @param {number} startReps - Starting repetitions
 * @param {number} endReps - Ending repetitions
 * @param {number} sets - Number of sets
 * @param {boolean} ascending - If true, ascending ladder; if false, descending
 * @returns {Array<number>} Array of rep counts
 */
export const generateLadderScheme = (startReps, endReps, sets, ascending = true) => {
  if (sets <= 0) {
    return [];
  }
  
  if (sets === 1) {
    return [startReps];
  }
  
  const repScheme = [];
  const step = (endReps - startReps) / (sets - 1);
  
  for (let i = 0; i < sets; i++) {
    const reps = Math.round(startReps + step * i);
    repScheme.push(Math.max(1, reps));
  }
  
  return ascending ? repScheme : repScheme.reverse();
};

/**
 * Calculate estimated time for ladder workout
 * 
 * @param {number} sets - Number of sets
 * @param {number} restTime - Rest time between sets in seconds
 * @param {number} workTimePerRep - Time per rep in seconds (default: 2)
 * @param {Array<number>} repScheme - Rep scheme array
 * @returns {number} Estimated time in seconds
 */
export const calculateLadderTime = (sets, restTime, repScheme, workTimePerRep = 2) => {
  if (sets <= 0) {
    return 0;
  }
  
  const totalReps = repScheme.reduce((sum, reps) => sum + reps, 0);
  const workTime = totalReps * workTimePerRep;
  const restTimeTotal = (sets - 1) * restTime;
  
  return workTime + restTimeTotal;
};
