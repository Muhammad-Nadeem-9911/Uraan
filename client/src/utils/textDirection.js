/**
 * Detects if a string contains characters that suggest a right-to-left (RTL) script,
 * primarily focusing on the Arabic script used by Urdu.
 * @param {string} text The text to check.
 * @returns {'rtl' | 'ltr'} The detected text direction.
 */
export const detectTextDirection = (text) => {
  if (!text) {
    return 'ltr'; // Default to LTR if text is empty
  }
  // Regex to check for Arabic script characters (Unicode range U+0600 to U+06FF)
  const rtlRegex = /[\u0600-\u06FF]/;
  if (rtlRegex.test(text)) {
    return 'rtl';
  }
  return 'ltr';
};