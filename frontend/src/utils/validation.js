/**
 * Phone Number Validation and Sanitization Utility
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
export const isValidPhoneNumber = (phone, isRequired = true) => {
  if (phone === null || phone === undefined || String(phone).trim() === "") {
    return !isRequired;
  }
  const cleaned = String(phone).trim();
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(cleaned);
};

/**
 * Sanitizes phone number by removing any non-digit character and truncating to max 10 digits.
 * Ideal for onChange / onPaste event handlers.
 * @param {string|number} value 
 * @returns {string}
 */
export const sanitizePhoneInput = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\D/g, "").slice(0, 10);
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

/**
 * Helper to handle standard input change events on phone fields.
 * Sanitizes input and updates state.
 * @param {Function} setter - State setter function (e.g. setPhone or setFormData)
 * @param {string} [fieldName] - Optional field name if setting an object state
 */
export const handlePhoneChange = (e, setter, fieldName) => {
  const rawValue = e.target ? e.target.value : e;
  const sanitized = sanitizePhoneInput(rawValue);
  
  if (fieldName) {
    setter((prev) => ({ ...prev, [fieldName]: sanitized }));
  } else {
    setter(sanitized);
  }
};
