// Validation utilities

/**
 * Validates Italian phone numbers
 * Accepts formats like: +39 123 456 7890, 39 123 456 7890, 06 1234 5678, 333 1234567, etc.
 */
export const validateItalianPhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Il numero di telefono è obbligatorio' };
  }

  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Italian mobile numbers (start with 3)
  const mobileRegex = /^(?:\+?39)?3\d{9}$/;
  
  // Italian landline numbers (start with 0)
  const landlineRegex = /^(?:\+?39)?0\d{8,10}$/;

  // Check if it matches either format
  if (mobileRegex.test(cleaned) || landlineRegex.test(cleaned)) {
    return { valid: true };
  }

  // Check if it only has "39" (common mistake)
  if (cleaned === '39' || cleaned === '+39') {
    return { valid: false, error: 'Il numero di telefono deve essere completo (es. +39 333 123 4567)' };
  }

  // Check minimum length
  if (cleaned.length < 9) {
    return { valid: false, error: 'Il numero di telefono è troppo corto' };
  }

  return { valid: false, error: 'Formato numero di telefono non valido. Usa un numero italiano valido (es. +39 333 123 4567 o 06 1234 5678)' };
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'L\'email è obbligatoria' };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato email non valido' };
  }

  // Check for common mistakes
  if (email.includes('..')) {
    return { valid: false, error: 'L\'email non può contenere punti consecutivi' };
  }

  if (email.startsWith('.') || email.endsWith('.')) {
    return { valid: false, error: 'L\'email non può iniziare o finire con un punto' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'L\'email è troppo lunga' };
  }

  return { valid: true };
};

/**
 * Validates price
 */
export const validatePrice = (price: string | number): { valid: boolean; error?: string; value?: number } => {
  if (!price && price !== 0) {
    return { valid: false, error: 'Il prezzo è obbligatorio' };
  }

  const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.')) : price;

  if (isNaN(numPrice)) {
    return { valid: false, error: 'Il prezzo deve essere un numero valido' };
  }

  if (numPrice < 0) {
    return { valid: false, error: 'Il prezzo non può essere negativo' };
  }

  if (numPrice === 0) {
    return { valid: false, error: 'Il prezzo deve essere maggiore di zero' };
  }

  if (numPrice > 1000000000) {
    return { valid: false, error: 'Il prezzo è troppo alto' };
  }

  return { valid: true, value: numPrice };
};

/**
 * Formats phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digits except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +39, format as +39 XXX XXX XXXX
  if (cleaned.startsWith('+39')) {
    const number = cleaned.substring(3);
    if (number.length === 10) {
      return `+39 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
  }
  
  // If it starts with 39, format as +39 XXX XXX XXXX
  if (cleaned.startsWith('39') && cleaned.length === 11) {
    const number = cleaned.substring(2);
    return `+39 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
  }
  
  // If it starts with 0 (landline), format as 0X XXXX XXXX
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 6)} ${cleaned.substring(6)}`;
  }
  
  return phone;
};
