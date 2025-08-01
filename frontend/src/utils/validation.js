// Validation utilities for WhatsApp related forms

// Clean a phone number: keep digits & optional leading +
export const cleanPhoneNumber = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  // Keep digits and plus
  let num = raw.trim().replace(/[^0-9+]/g, '');
  // Deduplicate plus sign if present elsewhere
  if (num.startsWith('++')) num = num.replace(/^\++/, '+');
  return num;
};

// Determine if a cleaned number is in a valid length range (10-15 digits)
export const isValidPhoneNumber = (cleanNum) => {
  if (!cleanNum) return false;
  // Remove leading + for length check
  const digits = cleanNum.startsWith('+') ? cleanNum.slice(1) : cleanNum;
  return digits.length >= 10 && digits.length <= 15;
};

// Format number to international format assumed default country code 92 (Pakistan)
export const formatPhoneNumberInternational = (raw) => {
  const cleaned = cleanPhoneNumber(raw);
  if (!isValidPhoneNumber(cleaned)) return null;
  let digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  // If number starts with 0 and does not have country code, prepend default
  if (!digits.startsWith('92') && digits.startsWith('0')) {
    digits = `92${digits.slice(1)}`;
  } else if (!digits.startsWith('92') && !cleaned.startsWith('+')) {
    // If no leading 0 or country code, still prepend default 92
    digits = `92${digits}`;
  }
  return `${digits}`; // return digits only; caller can append @c.us
};

export const validateGroupName = (name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return { valid: false, error: 'Group name is required' };
  if (trimmed.length > 25) return { valid: false, error: 'Group name must be 25 characters or less' };
  return { valid: true, value: trimmed };
};

export const validateParticipantsList = (rawList) => {
  // rawList: array of strings
  const valid = [];
  const invalid = [];
  rawList.forEach((p) => {
    const formatted = formatPhoneNumberInternational(p);
    if (formatted) valid.push(formatted);
    else invalid.push(p);
  });
  return { valid, invalid };
}; 