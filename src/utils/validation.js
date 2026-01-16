/**
 * Server-side Validation Logic Placeholders
 * Part of Bruno's Protocols: Data Integrity
 * 
 * Security: These validations should be enforced on the server-side
 * Client-side validation is for UX only, not security
 */

/**
 * Validate fitness data (1RM scores, etc.)
 * Prevents "extreme" value cheating
 * 
 * @param {Object} data - Fitness data to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validateFitnessData = (data) => {
  // Placeholder for server-side validation
  // These checks should be enforced on Firestore Security Rules or Cloud Functions
  
  const { type, value, timestamp } = data;
  
  // Validate timestamp (prevent future dates or very old dates)
  if (timestamp) {
    const now = Date.now();
    const dataTime = new Date(timestamp).getTime();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    
    if (dataTime > now) {
      return { valid: false, error: '時間戳不能是未來時間' };
    }
    
    if (dataTime < oneYearAgo) {
      return { valid: false, error: '時間戳過於久遠' };
    }
  }
  
  // Validate value ranges based on type
  if (type === '1RM' || type === 'weight') {
    // Reasonable weight range: 0.1kg to 1000kg
    if (value < 0.1 || value > 1000) {
      return { valid: false, error: '重量數值超出合理範圍' };
    }
  }
  
  if (type === 'reps') {
    // Reasonable rep range: 1 to 1000
    if (value < 1 || value > 1000) {
      return { valid: false, error: '次數數值超出合理範圍' };
    }
  }
  
  if (type === 'distance') {
    // Reasonable distance range: 0.01km to 1000km
    if (value < 0.01 || value > 1000) {
      return { valid: false, error: '距離數值超出合理範圍' };
    }
  }
  
  if (type === 'duration') {
    // Reasonable duration: 1 second to 24 hours (in seconds)
    const maxDuration = 24 * 60 * 60;
    if (value < 1 || value > maxDuration) {
      return { valid: false, error: '持續時間數值超出合理範圍' };
    }
  }
  
  // Additional validation: Check for suspicious patterns
  // (e.g., too many perfect round numbers, unrealistic progressions)
  if (isSuspiciousPattern(value, type)) {
    return { valid: false, error: '數據模式異常，請檢查輸入' };
  }
  
  return { valid: true };
};

/**
 * Check for suspicious data patterns
 * Security: Detect potential cheating attempts
 */
const isSuspiciousPattern = (value, type) => {
  // Check for too many perfect round numbers
  if (value % 10 === 0 && value > 100) {
    // Multiple perfect 10s might indicate manual entry rather than actual measurement
    // This is a soft check - server should enforce stricter rules
    return false; // Placeholder - implement based on business logic
  }
  
  // Check for unrealistic jumps in progress
  // (This would require comparing with previous values - placeholder for now)
  
  return false;
};

/**
 * Sanitize user input
 * Security: Prevent XSS and injection attacks
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove potentially dangerous characters
  // Note: For production, use a proper sanitization library
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Security: Enforce minimum password requirements
 */
export const validatePasswordStrength = (password) => {
  if (password.length < 6) {
    return { valid: false, error: '密碼長度至少需要 6 個字符' };
  }
  
  // Additional strength checks can be added here
  // (e.g., require uppercase, numbers, special characters)
  
  return { valid: true };
};
