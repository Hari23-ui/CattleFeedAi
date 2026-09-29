import {
  validateFarmName,
  validateLocation,
  validateDistrict,
  validateState,
  validatePincode,
  validateFarmForm,
} from '../utils/validation';

describe('Farm Validation', () => {
  describe('validateFarmName', () => {
    it('should reject empty or whitespace-only name', () => {
      expect(validateFarmName('')).toBe('Farm name is required');
      expect(validateFarmName('   ')).toBe('Farm name is required');
    });

    it('should reject farm name exceeding 100 characters', () => {
      const longName = 'A'.repeat(101);
      expect(validateFarmName(longName)).toBe('Farm name must not exceed 100 characters');
    });

    it('should accept valid farm names', () => {
      expect(validateFarmName('Green Pastures Dairy')).toBeNull();
      expect(validateFarmName('Farm #12')).toBeNull();
    });
  });

  describe('validateLocation', () => {
    it('should accept undefined, empty, or whitespace location (optional)', () => {
      expect(validateLocation(undefined)).toBeNull();
      expect(validateLocation('')).toBeNull();
      expect(validateLocation('   ')).toBeNull();
    });

    it('should reject location exceeding 255 characters', () => {
      const longLocation = 'L'.repeat(256);
      expect(validateLocation(longLocation)).toBe('Location must not exceed 255 characters');
    });

    it('should accept valid location within 255 characters', () => {
      expect(validateLocation('Plot 12, Village Rampur, Tehsil Sadar')).toBeNull();
    });
  });

  describe('validateDistrict and validateState', () => {
    it('should accept optional district and state within 100 characters', () => {
      expect(validateDistrict('Anand')).toBeNull();
      expect(validateState('Gujarat')).toBeNull();
      expect(validateDistrict(undefined)).toBeNull();
      expect(validateState(undefined)).toBeNull();
    });

    it('should reject district or state exceeding 100 characters', () => {
      expect(validateDistrict('D'.repeat(101))).toBe('District must not exceed 100 characters');
      expect(validateState('S'.repeat(101))).toBe('State must not exceed 100 characters');
    });
  });

  describe('validatePincode', () => {
    it('should accept optional valid pincode within 10 characters', () => {
      expect(validatePincode('388001')).toBeNull();
      expect(validatePincode(undefined)).toBeNull();
      expect(validatePincode('')).toBeNull();
    });

    it('should reject pincode exceeding 10 characters', () => {
      expect(validatePincode('12345678901')).toBe('Pincode must not exceed 10 characters');
    });
  });

  describe('validateFarmForm', () => {
    it('should validate a complete valid farm form', () => {
      const result = validateFarmForm({
        farmName: 'Anand Organic Dairy',
        location: 'Village Chikhodra',
        district: 'Anand',
        state: 'Gujarat',
        pincode: '388320',
      });

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should fail when farmName is missing', () => {
      const result = validateFarmForm({
        farmName: '',
        location: 'Some location',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.farmName).toBe('Farm name is required');
    });

    it('should fail when multiple fields exceed constraints', () => {
      const result = validateFarmForm({
        farmName: 'F'.repeat(101),
        location: 'L'.repeat(256),
        district: 'D'.repeat(101),
        state: 'S'.repeat(101),
        pincode: '123456789012',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.farmName).toBeDefined();
      expect(result.errors.location).toBeDefined();
      expect(result.errors.district).toBeDefined();
      expect(result.errors.state).toBeDefined();
      expect(result.errors.pincode).toBeDefined();
    });
  });
});
