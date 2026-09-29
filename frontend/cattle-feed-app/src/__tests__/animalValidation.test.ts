import {
  validateAnimalTag,
  validateAnimalName,
  validateAnimalBreed,
  validateAnimalGender,
  validateAnimalFarmId,
  validateDateOfBirth,
  validateWeight,
  validateDaysInMilk,
  validateMilkProduction,
  validateAnimalForm,
} from '../utils/validation';

describe('Animal Validation', () => {
  describe('validateAnimalTag', () => {
    it('should reject empty or whitespace animalTag', () => {
      expect(validateAnimalTag('')).toBe('Animal tag is required');
      expect(validateAnimalTag('   ')).toBe('Animal tag is required');
    });

    it('should reject tag exceeding 50 characters', () => {
      const longTag = 'T'.repeat(51);
      expect(validateAnimalTag(longTag)).toBe('Animal tag must not exceed 50 characters');
    });

    it('should accept valid tag within 50 characters', () => {
      expect(validateAnimalTag('IN-MH-1024')).toBeNull();
      expect(validateAnimalTag('COW-01')).toBeNull();
    });
  });

  describe('validateAnimalGender', () => {
    it('should reject missing or invalid gender', () => {
      expect(validateAnimalGender(undefined)).toBe('Gender is required (MALE or FEMALE)');
      expect(validateAnimalGender('')).toBe('Gender is required (MALE or FEMALE)');
      expect(validateAnimalGender('OTHER')).toBe('Gender is required (MALE or FEMALE)');
    });

    it('should accept valid MALE and FEMALE values', () => {
      expect(validateAnimalGender('MALE')).toBeNull();
      expect(validateAnimalGender('FEMALE')).toBeNull();
    });
  });

  describe('validateAnimalFarmId', () => {
    it('should reject undefined, 0, or negative farmId', () => {
      expect(validateAnimalFarmId(undefined)).toBe('A farm must be selected');
      expect(validateAnimalFarmId(0)).toBe('A farm must be selected');
      expect(validateAnimalFarmId(-1)).toBe('A farm must be selected');
    });

    it('should accept positive farmId', () => {
      expect(validateAnimalFarmId(1)).toBeNull();
      expect(validateAnimalFarmId(42)).toBeNull();
    });
  });

  describe('validateDateOfBirth', () => {
    it('should accept optional date of birth', () => {
      expect(validateDateOfBirth(undefined)).toBeNull();
      expect(validateDateOfBirth('')).toBeNull();
    });

    it('should reject invalid format', () => {
      expect(validateDateOfBirth('01-01-2023')).toBe('Date of birth must be in YYYY-MM-DD format');
      expect(validateDateOfBirth('2023/01/01')).toBe('Date of birth must be in YYYY-MM-DD format');
    });

    it('should reject invalid calendar date', () => {
      expect(validateDateOfBirth('2023-02-31')).toBe('Please enter a valid date');
    });

    it('should reject future birth date', () => {
      const nextYear = new Date().getFullYear() + 2;
      expect(validateDateOfBirth(`${nextYear}-01-01`)).toBe('Date of birth cannot be in the future');
    });

    it('should accept past valid birth date', () => {
      expect(validateDateOfBirth('2022-05-15')).toBeNull();
    });
  });

  describe('validateWeight, validateDaysInMilk, validateMilkProduction', () => {
    it('should accept undefined/empty values (optional metrics)', () => {
      expect(validateWeight(undefined)).toBeNull();
      expect(validateDaysInMilk(undefined)).toBeNull();
      expect(validateMilkProduction(undefined)).toBeNull();
    });

    it('should reject negative values', () => {
      expect(validateWeight(-5)).toBe('Weight cannot be negative');
      expect(validateDaysInMilk(-1)).toBe('Days in milk cannot be negative');
      expect(validateMilkProduction(-2.5)).toBe('Milk production cannot be negative');
    });

    it('should reject non-numeric inputs', () => {
      expect(validateWeight('abc')).toBe('Weight must be a valid number');
      expect(validateDaysInMilk('xyz')).toBe('Days in milk must be an integer');
      expect(validateMilkProduction('invalid')).toBe('Milk production must be a valid number');
    });

    it('should accept zero or positive numbers', () => {
      expect(validateWeight(0)).toBeNull();
      expect(validateWeight(450.5)).toBeNull();
      expect(validateDaysInMilk(0)).toBeNull();
      expect(validateDaysInMilk(60)).toBeNull();
      expect(validateMilkProduction(0)).toBeNull();
      expect(validateMilkProduction(24.5)).toBeNull();
    });
  });

  describe('validateAnimalForm', () => {
    it('should validate a valid animal form', () => {
      const result = validateAnimalForm({
        farmId: 1,
        animalTag: 'TAG-101',
        name: 'Ganga',
        breed: 'Gir',
        gender: 'FEMALE',
        dateOfBirth: '2023-01-15',
        weight: 420.0,
        daysInMilk: 60,
        milkProductionPerDay: 18.5,
      });

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should fail when required fields (farmId, animalTag, gender) are missing', () => {
      const result = validateAnimalForm({
        name: 'Unnamed Cow',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.farmId).toBe('A farm must be selected');
      expect(result.errors.animalTag).toBe('Animal tag is required');
      expect(result.errors.gender).toBe('Gender is required (MALE or FEMALE)');
    });
  });
});
