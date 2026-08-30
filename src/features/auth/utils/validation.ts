/**
 * TLDs that are almost always a mistype of `.com` (not real public suffixes).
 */
const TYPED_COM_TLDS = new Set(['con', 'cpm', 'comm', 'comn', 'coom', 'cmo']);

const TYPED_DOMAINS: Record<string, string> = {
  'gnail.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'icoud.com': 'icloud.com',
  'iclod.com': 'icloud.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
};

/**
 * Hint when the address is formatted like an email but the domain is a common typo.
 * Example: `name@icloud.con` → "Did you mean name@icloud.com?"
 */
export function getEmailTypoHint(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at < 1) return null;

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (!local || !domain.includes('.')) return null;

  const suggestedDomain = TYPED_DOMAINS[domain];
  if (suggestedDomain) {
    return `Did you mean ${local}@${suggestedDomain}?`;
  }

  const tld = domain.slice(domain.lastIndexOf('.') + 1);
  if (TYPED_COM_TLDS.has(tld)) {
    const corrected = `${local}@${domain.slice(0, domain.lastIndexOf('.'))}.com`;
    return `Did you mean ${corrected}?`;
  }

  return null;
}

/**
 * Email validation utility
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  return getEmailTypoHint(email) === null;
};

/**
 * Password validation utility
 */
export const validatePassword = (
  password: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Form validation for sign up
 */
export const validateSignUpForm = (data: {
  email: string;
  password: string;
  confirmPassword: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Email validation
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email =
      getEmailTypoHint(data.email) ?? 'Please enter a valid email address';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0]; // Show first error
    }
  }

  // Confirm password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Form validation for sign in
 */
export const validateSignInForm = (data: {
  email: string;
  password: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Email validation
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email =
      getEmailTypoHint(data.email) ?? 'Please enter a valid email address';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
