import {
  validateEmail,
  validateLoginForm,
  validatePassword,
  validatePhone,
  validateRegisterForm,
  validateUsername,
} from '../utils/validation';

describe('Form Validation Utilities', () => {
  describe('Email Validation', () => {
    it('should fail when email is empty or whitespace', () => {
      expect(validateEmail('')).toBe('Email is required');
      expect(validateEmail('   ')).toBe('Email is required');
    });

    it('should fail when email format is invalid', () => {
      expect(validateEmail('invalid-email')).toBe('Please enter a valid email address');
      expect(validateEmail('farmer@')).toBe('Please enter a valid email address');
      expect(validateEmail('@domain.com')).toBe('Please enter a valid email address');
    });

    it('should pass when email is valid', () => {
      expect(validateEmail('farmer@dairyfarm.com')).toBeNull();
      expect(validateEmail('john.doe@agri-tech.co.in')).toBeNull();
    });
  });

  describe('Password Validation', () => {
    it('should fail when password is empty', () => {
      expect(validatePassword('')).toBe('Password is required');
    });

    it('should fail when password is less than 6 characters', () => {
      expect(validatePassword('12345')).toBe('Password must be at least 6 characters');
    });

    it('should pass when password is 6 characters or longer', () => {
      expect(validatePassword('123456')).toBeNull();
      expect(validatePassword('FarmSecure#2026')).toBeNull();
    });
  });

  describe('Username Validation', () => {
    it('should fail when username is empty', () => {
      expect(validateUsername('')).toBe('Username is required');
    });

    it('should fail when username is shorter than 3 characters', () => {
      expect(validateUsername('ab')).toBe('Username must be at least 3 characters');
    });

    it('should pass when username is between 3 and 50 characters', () => {
      expect(validateUsername('greenvalley')).toBeNull();
      expect(validateUsername('farmer_john_123')).toBeNull();
    });
  });

  describe('Phone Validation', () => {
    it('should pass when phone is undefined or empty (optional field)', () => {
      expect(validatePhone(undefined)).toBeNull();
      expect(validatePhone('')).toBeNull();
    });

    it('should fail when phone format is invalid', () => {
      expect(validatePhone('abcdefghijk')).toBe('Please enter a valid phone number');
    });

    it('should pass when phone format is valid', () => {
      expect(validatePhone('+1 555-0199')).toBeNull();
      expect(validatePhone('9876543210')).toBeNull();
    });
  });

  describe('Login Form Validation', () => {
    it('should flag empty credentials', () => {
      const result = validateLoginForm({ email: '', password: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
    });

    it('should pass with valid credentials', () => {
      const result = validateLoginForm({
        email: 'farmer@dairyfarm.com',
        password: 'Password123!',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Register Form Validation', () => {
    it('should fail when required fields are missing', () => {
      const result = validateRegisterForm({
        username: '',
        email: '',
        password: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.username).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
    });

    it('should pass when all required fields meet backend specifications', () => {
      const result = validateRegisterForm({
        username: 'green_pastures',
        email: 'green@pastures.com',
        password: 'StrongPassword123!',
        phone: '+1 555-1234',
        language: 'en',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });
});
