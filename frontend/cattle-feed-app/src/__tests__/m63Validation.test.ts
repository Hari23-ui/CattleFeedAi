import {
  validateFeedSampleForm,
  validateSilageSampleForm,
  validateTestResultForm,
  validateSampleCode,
  validateFeedType,
  validateSilageType,
  validateSampleDate,
  validateNonNegativeDecimal,
  validateTestResultParent,
} from '../utils/validation';
import { CreateFeedSampleRequest } from '../models/feed';
import { CreateSilageSampleRequest } from '../models/silage';
import { CreateTestResultRequest } from '../models/testResult';

describe('Milestone 6.3 Validations', () => {
  describe('Sample Code Validation', () => {
    it('should reject empty or missing sample codes', () => {
      expect(validateSampleCode('')).toBe('Sample code is required');
      expect(validateSampleCode('   ')).toBe('Sample code is required');
    });

    it('should reject sample codes longer than 50 characters', () => {
      expect(validateSampleCode('A'.repeat(51))).toBe('Sample code must not exceed 50 characters');
    });

    it('should accept valid sample codes', () => {
      expect(validateSampleCode('A')).toBeNull();
      expect(validateSampleCode('FEED-001')).toBeNull();
      expect(validateSampleCode('SILAGE-MAIZE-2026')).toBeNull();
    });
  });

  describe('Feed & Silage Type Validation', () => {
    it('should validate feed types', () => {
      expect(validateFeedType('CATTLE_FEED_PELLET')).toBeNull();
      expect(validateFeedType('FEED_MASH')).toBeNull();
      expect(validateFeedType('MINERAL_MIXTURE')).toBeNull();
      expect(validateFeedType('GREEN_FODDER')).toBeNull();
      expect(validateFeedType('DRY_FODDER')).toBeNull();
      expect(validateFeedType('OTHER')).toBeNull();
      expect(validateFeedType(undefined as unknown as any)).toBe('A valid feed type is required');
      expect(validateFeedType('INVALID_FEED' as any)).toBe('A valid feed type is required');
    });

    it('should validate silage types', () => {
      expect(validateSilageType('MAIZE')).toBeNull();
      expect(validateSilageType('SORGHUM')).toBeNull();
      expect(validateSilageType('NAPIER')).toBeNull();
      expect(validateSilageType('MIXED')).toBeNull();
      expect(validateSilageType('OTHER')).toBeNull();
      expect(validateSilageType(undefined as unknown as any)).toBe('A valid silage type is required');
      expect(validateSilageType('INVALID_SILAGE' as any)).toBe('A valid silage type is required');
    });
  });

  describe('Sample Date Validation', () => {
    it('should reject empty dates', () => {
      expect(validateSampleDate('')).toBe('Sample collection date is required');
    });

    it('should reject invalid date formats', () => {
      expect(validateSampleDate('27-09-2026')).toBe('Sample date must be in YYYY-MM-DD format');
      expect(validateSampleDate('2026/09/27')).toBe('Sample date must be in YYYY-MM-DD format');
      expect(validateSampleDate('2026-13-45')).toBe('Please enter a valid date');
    });

    it('should reject future dates', () => {
      expect(validateSampleDate('2099-01-01')).toBe('Sample date cannot be in the future');
    });

    it('should accept past or today dates', () => {
      expect(validateSampleDate('2020-01-01')).toBeNull();
      const today = new Date().toISOString().split('T')[0];
      expect(validateSampleDate(today)).toBeNull();
    });
  });

  describe('Feed Sample Form Validation', () => {
    it('should validate a complete valid feed sample', () => {
      const form: Partial<CreateFeedSampleRequest> = {
        farmId: 1,
        sampleCode: 'FEED-001',
        feedType: 'CATTLE_FEED_PELLET',
        sampleDate: '2026-01-15',
        source: 'Warehouse Batch 1',
        notes: 'Good condition',
      };

      const result = validateFeedSampleForm(form);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should flag errors when required feed fields are missing', () => {
      const form: Partial<CreateFeedSampleRequest> = {
        farmId: undefined,
        sampleCode: '',
        feedType: undefined,
        sampleDate: '',
      };

      const result = validateFeedSampleForm(form);
      expect(result.isValid).toBe(false);
      expect(result.errors.farmId).toBeDefined();
      expect(result.errors.sampleCode).toBeDefined();
      expect(result.errors.feedType).toBeDefined();
      expect(result.errors.sampleDate).toBeDefined();
    });
  });

  describe('Silage Sample Form Validation', () => {
    it('should validate a complete valid silage sample', () => {
      const form: Partial<CreateSilageSampleRequest> = {
        farmId: 2,
        sampleCode: 'SIL-001',
        silageType: 'MAIZE',
        sampleDate: '2026-02-01',
      };

      const result = validateSilageSampleForm(form);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should flag errors when required silage fields are missing', () => {
      const form: Partial<CreateSilageSampleRequest> = {
        farmId: undefined,
        sampleCode: '',
        silageType: undefined,
      };

      const result = validateSilageSampleForm(form);
      expect(result.isValid).toBe(false);
      expect(result.errors.farmId).toBeDefined();
      expect(result.errors.sampleCode).toBeDefined();
      expect(result.errors.silageType).toBeDefined();
    });
  });

  describe('Test Result Form Validation', () => {
    it('should enforce XOR between feedSampleId and silageSampleId', () => {
      // Neither
      expect(validateTestResultParent(undefined, undefined)).toBe(
        'Either a feed sample or a silage sample must be selected'
      );
      // Both
      expect(validateTestResultParent(1, 2)).toBe(
        'A test result must be associated with either feed or silage, not both'
      );
      // Only feed
      expect(validateTestResultParent(1, undefined)).toBeNull();
      // Only silage
      expect(validateTestResultParent(undefined, 2)).toBeNull();
    });

    it('should validate non-negative decimals', () => {
      expect(validateNonNegativeDecimal(12.5, 'Moisture')).toBeNull();
      expect(validateNonNegativeDecimal(0, 'Moisture')).toBeNull();
      expect(validateNonNegativeDecimal(-1, 'Moisture')).toBe('Moisture cannot be negative');
      expect(validateNonNegativeDecimal('abc', 'Moisture')).toBe('Moisture must be a valid number');
      expect(validateNonNegativeDecimal(undefined, 'Moisture')).toBeNull();
      expect(validateNonNegativeDecimal(null, 'Moisture')).toBeNull();
      expect(validateNonNegativeDecimal('', 'Moisture')).toBeNull();
    });

    it('should validate a valid test result form with full metrics', () => {
      const form: Partial<CreateTestResultRequest> = {
        feedSampleId: 10,
        moisture: 12.0,
        crudeProtein: 18.5,
        fiber: 9.8,
        energyValue: 11.2,
        aflatoxin: 10.0,
        mycotoxin: 0.2,
        ph: 6.2,
        confidenceScore: 0.95,
      };

      const result = validateTestResultForm(form);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should validate a sparse test result form with optional fields left blank', () => {
      const form: Partial<CreateTestResultRequest> = {
        silageSampleId: 20,
        ph: 4.1,
      };

      const result = validateTestResultForm(form);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should catch negative measurement values', () => {
      const form: Partial<CreateTestResultRequest> = {
        feedSampleId: 10,
        moisture: -5.0,
        crudeProtein: -1.0,
      };

      const result = validateTestResultForm(form);
      expect(result.isValid).toBe(false);
      expect(result.errors.moisture).toBe('Moisture cannot be negative');
      expect(result.errors.crudeProtein).toBe('Crude Protein cannot be negative');
    });
  });
});
