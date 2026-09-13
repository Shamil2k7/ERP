/**
 * Backend Phone Number Validation Utility
 * Standard: 10-digit Indian Mobile Phone Numbers
 * - Numbers only (0-9)
 * - Exactly 10 digits
 * - No alphabets, spaces, or special characters
 */

/**
 * Validates if the phone number meets the strict 10-digit numeric rule.
 * @param {string|number} phone 
 * @param {boolean} isRequired 
 * @returns {boolean}
 */
export const validatePhoneNumber = (phone, isRequired = true) => {
  if (phone === null || phone === undefined || String(phone).trim() === "") {
    return !isRequired;
  }
  const cleaned = String(phone).trim();
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(cleaned);
};

/**
 * Sanitizes phone number by removing any non-digit character and returning 10 digits.
 * @param {string|number} phone 
 * @returns {string}
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "").slice(0, 10);
};

/**
 * Returns human-readable validation error message for phone numbers.
 * @param {string|number} phone 
 * @param {boolean} isRequired 
 * @returns {string|null}
 */
export const getPhoneValidationError = (phone, isRequired = true) => {
  if (phone === null || phone === undefined || String(phone).trim() === "") {
    return isRequired ? "Phone number is required" : null;
  }
  const str = String(phone).trim();
  if (/\D/.test(str)) {
    return "Phone number must contain numbers only";
  }
  if (str.length < 10) {
    return "Phone number must contain exactly 10 digits";
  }
  if (str.length > 10) {
    return "Phone number cannot exceed 10 digits";
  }
  return null;
};
