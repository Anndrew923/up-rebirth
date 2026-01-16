/**
 * Format score for display
 * Utility function for ladder scores
 */

/**
 * Format score with thousand separators
 * 
 * @param {number} score - Score to format
 * @returns {string} Formatted score
 */
export const formatScore = (score) => {
  if (score === null || score === undefined || isNaN(score)) {
    return '0';
  }
  
  return Math.floor(score).toLocaleString('zh-TW');
};

/**
 * Get age group from birthdate or age
 * 
 * @param {Date|string|number} birthdate - Birthdate or age
 * @returns {string} Age group identifier
 */
export const getAgeGroup = (birthdate) => {
  if (!birthdate) {
    return 'unknown';
  }
  
  let age;
  
  if (typeof birthdate === 'number') {
    // Already an age
    age = birthdate;
  } else {
    // Calculate age from birthdate
    const birth = new Date(birthdate);
    const today = new Date();
    age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
  }
  
  if (age < 20) return 'under20';
  if (age >= 20 && age <= 30) return '21to30';
  if (age >= 31 && age <= 40) return '31to40';
  if (age >= 41 && age <= 50) return '41to50';
  if (age >= 51 && age <= 60) return '51to60';
  if (age >= 61 && age <= 70) return '61to70';
  if (age > 70) return 'over70';
  
  return 'unknown';
};
