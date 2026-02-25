/**
 * Validation regex and helpers for Login & SignUp (FOCUS).
 * Ready for API; client-side only.
 */

// Email: standard format (local@domain.tld)
export const REGEX_EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Egyptian mobile: 01xxxxxxxx (10 digits after 01) or +20 1xxxxxxxx
export const REGEX_PHONE_EG = /^(\+?20)?01[0-2,5]{1}[0-9]{8}$/;

// Password: min 6 chars (optional: letter + number for strength)
export const REGEX_PASSWORD_MIN = /^.{6,}$/;
export const REGEX_PASSWORD_STRONG = /^(?=.*[A-Za-z])(?=.*[0-9]).{6,}$/;

// Full name: letters (Arabic/English) and spaces, 2+ chars
export const REGEX_FULL_NAME = /^[\u0600-\u06FFa-zA-Z\s]{2,}$/;

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  if (!value || typeof value !== 'string') return false;
  return REGEX_EMAIL.test(value.trim());
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidPhoneEg(value) {
  if (!value || typeof value !== 'string') return false;
  const digits = value.replace(/\D/g, '');
  return REGEX_PHONE_EG.test(value.trim()) || (digits.length >= 10 && digits.length <= 11);
}

/**
 * Login: accept email OR Egyptian phone
 * @param {string} value
 * @returns {boolean}
 */
export function isValidLoginIdentifier(value) {
  if (!value || typeof value !== 'string') return false;
  const t = value.trim();
  return isValidEmail(t) || isValidPhoneEg(t);
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidPassword(value) {
  if (!value || typeof value !== 'string') return false;
  return REGEX_PASSWORD_MIN.test(value);
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidFullName(value) {
  if (!value || typeof value !== 'string') return false;
  return REGEX_FULL_NAME.test(value.trim());
}
