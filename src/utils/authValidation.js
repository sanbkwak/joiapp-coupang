// src/utils/authValidation.js

// Disposable email domains blacklist (sample - extend as needed)
const DISPOSABLE_EMAIL_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.org',
  'yopmail.com',
  'throwaway.email',
  'temp-mail.org'
];

/**
 * Password policy validation
 * Requirements: 최소 10자, 영문 대/소문자+숫자+특수문자 포함
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    return ['비밀번호를 입력해주세요.'];
  }
  
  if (password.length < 10) {
    errors.push('비밀번호는 최소 10자 이상이어야 합니다.');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('영문 소문자를 포함해야 합니다.');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('영문 대문자를 포함해야 합니다.');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다.');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다.');
  }
  
  return errors;
};

/**
 * Get password strength indicator
 */
export const getPasswordStrength = (password) => {
  const errors = validatePassword(password);
  const score = Math.max(0, 5 - errors.length);
  
  const strength = {
    0: { level: 'very-weak', text: '매우 약함', color: '#dc2626' },
    1: { level: 'weak', text: '약함', color: '#ea580c' },
    2: { level: 'fair', text: '보통', color: '#d97706' },
    3: { level: 'good', text: '좋음', color: '#65a30d' },
    4: { level: 'strong', text: '강함', color: '#16a34a' },
    5: { level: 'very-strong', text: '매우 강함', color: '#059669' }
  };
  
  return {
    score,
    ...strength[score],
    isValid: errors.length === 0
  };
};

/**
 * Email validation with disposable domain check
 */
export const validateEmail = (email) => {
  const errors = [];
  
  if (!email) {
    return ['이메일을 입력해주세요.'];
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('올바른 이메일 형식이 아닙니다.');
    return errors;
  }
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    errors.push('일회용 이메일 주소는 사용할 수 없습니다.');
  }
  
  return errors;
};

/**
 * Age validation (만 14세 이상)
 */
export const validateAge = (birthdate) => {
  if (!birthdate) {
    return ['생년월일을 입력해주세요.'];
  }
  
  const birth = new Date(birthdate);
  const today = new Date();
  
  // Check if date is valid
  if (isNaN(birth.getTime())) {
    return ['올바른 날짜 형식이 아닙니다.'];
  }
  
  // Check if date is in the future
  if (birth > today) {
    return ['생년월일이 미래일 수 없습니다.'];
  }
  
  // Calculate age
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  if (age < 14) {
    return ['만 14세 이상만 가입할 수 있습니다. 법정대리인 동의가 필요합니다.'];
  }
  
  if (age > 120) {
    return ['올바른 생년월일을 입력해주세요.'];
  }
  
  return [];
};

/**
 * Hire year validation
 */
export const validateHireYear = (hireYear, birthdate) => {
  const errors = [];
  const currentYear = new Date().getFullYear();
  const year = parseInt(hireYear);
  
  if (!hireYear) {
    return ['입사연도를 입력해주세요.'];
  }
  
  if (isNaN(year) || year < 1950 || year > currentYear) {
    errors.push(`입사연도는 1950년부터 ${currentYear}년까지 입력 가능합니다.`);
  }
  
  // Check if hire year is reasonable compared to birth date
  if (birthdate && !isNaN(year)) {
    const birthYear = new Date(birthdate).getFullYear();
    const minHireAge = 14; // Minimum working age
    
    if (year < birthYear + minHireAge) {
      errors.push('입사연도가 생년월일과 맞지 않습니다.');
    }
  }
  
  return errors;
};

/**
 * Support ID generator (8-char base62)
 */
export const generateSupportId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Email masking for display
 */
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  
  const [local, domain] = email.split('@');
  
  if (local.length <= 2) {
    return `${local}@${domain}`;
  }
  
  const firstChar = local[0];
  const lastChar = local[local.length - 1];
  const masked = '*'.repeat(Math.max(1, local.length - 2));
  
  return `${firstChar}${masked}${lastChar}@${domain}`;
};

/**
 * Comprehensive form validation
 */
export const validateRegistrationForm = (formData) => {
  const errors = {};
  
  // Email validation
  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) {
    errors.email = emailErrors[0];
  }
  
  // Password validation
  const passwordErrors = validatePassword(formData.password);
  if (passwordErrors.length > 0) {
    errors.password = passwordErrors;
  }
  
  // Password confirmation
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
  }
  
  return errors;
};

/**
 * Profile validation
 */
export const validateProfileForm = (formData) => {
  const errors = {};
  
  // Age validation
  const ageErrors = validateAge(formData.birthday);
  if (ageErrors.length > 0) {
    errors.birthday = ageErrors[0];
  }
  
  // Hire year validation
  const hireYearErrors = validateHireYear(formData.hireYear, formData.birthday);
  if (hireYearErrors.length > 0) {
    errors.hireYear = hireYearErrors[0];
  }
  
  // Gender validation
  if (!formData.gender) {
    errors.gender = '성별을 선택해주세요.';
  }
  
  return errors;
};