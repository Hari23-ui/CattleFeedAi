import { LoginRequest, RegisterRequest } from '../models/auth';
import { CreateFarmRequest, UpdateFarmRequest } from '../models/farm';
import { CreateAnimalRequest } from '../models/animal';
import { CreateFeedSampleRequest, FeedType } from '../models/feed';
import { CreateSilageSampleRequest, SilageType } from '../models/silage';
import { CreateTestResultRequest } from '../models/testResult';

/**
 * Form validation utilities matching backend constraints:
 * - Username: required, 3 - 50 characters
 * - Email: required, valid RFC 5322 format, max 100 characters
 * - Password: required, 6 - 100 characters
 * - Phone: optional, max 20 characters
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

export const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  const trimmed = email.trim();
  if (trimmed.length > 100) {
    return 'Email must not exceed 100 characters';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password || password === '') {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  if (password.length > 100) {
    return 'Password must not exceed 100 characters';
  }
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username || username.trim() === '') {
    return 'Username is required';
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (trimmed.length > 50) {
    return 'Username must not exceed 50 characters';
  }
  return null;
};

export const validatePhone = (phone?: string): string | null => {
  if (!phone || phone.trim() === '') {
    return null; // Phone is optional
  }
  const trimmed = phone.trim();
  if (trimmed.length > 20) {
    return 'Phone number must not exceed 20 characters';
  }
  if (!PHONE_REGEX.test(trimmed)) {
    return 'Please enter a valid phone number';
  }
  return null;
};

export interface FormValidationResult<T> {
  isValid: boolean;
  errors: Partial<Record<keyof T, string>>;
}

export const validateLoginForm = (form: LoginRequest): FormValidationResult<LoginRequest> => {
  const errors: Partial<Record<keyof LoginRequest, string>> = {};

  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(form.password);
  if (passwordError) errors.password = passwordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateRegisterForm = (
  form: RegisterRequest
): FormValidationResult<RegisterRequest> => {
  const errors: Partial<Record<keyof RegisterRequest, string>> = {};

  const usernameError = validateUsername(form.username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(form.password);
  if (passwordError) errors.password = passwordError;

  if (form.phone) {
    const phoneError = validatePhone(form.phone);
    if (phoneError) errors.phone = phoneError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Farm validation rules strictly matching backend FarmRequest constraints:
 * - farmName: required, max 100 characters
 * - location: optional, max 255 characters
 * - district: optional, max 100 characters
 * - state: optional, max 100 characters
 * - pincode: optional, max 10 characters
 */

export const validateFarmName = (name: string): string | null => {
  if (!name || name.trim() === '') {
    return 'Farm name is required';
  }
  const trimmed = name.trim();
  if (trimmed.length > 100) {
    return 'Farm name must not exceed 100 characters';
  }
  return null;
};

export const validateLocation = (location?: string | null): string | null => {
  if (!location || location.trim() === '') {
    return null;
  }
  if (location.trim().length > 255) {
    return 'Location must not exceed 255 characters';
  }
  return null;
};

export const validateDistrict = (district?: string | null): string | null => {
  if (!district || district.trim() === '') {
    return null;
  }
  if (district.trim().length > 100) {
    return 'District must not exceed 100 characters';
  }
  return null;
};

export const validateState = (state?: string | null): string | null => {
  if (!state || state.trim() === '') {
    return null;
  }
  if (state.trim().length > 100) {
    return 'State must not exceed 100 characters';
  }
  return null;
};

export const validatePincode = (pincode?: string | null): string | null => {
  if (!pincode || pincode.trim() === '') {
    return null;
  }
  const trimmed = pincode.trim();
  if (trimmed.length > 10) {
    return 'Pincode must not exceed 10 characters';
  }
  return null;
};

export const validateFarmForm = (
  form: Partial<CreateFarmRequest | UpdateFarmRequest>
): FormValidationResult<CreateFarmRequest> => {
  const errors: Partial<Record<keyof CreateFarmRequest, string>> = {};

  const nameError = validateFarmName(form.farmName || '');
  if (nameError) errors.farmName = nameError;

  const locationError = validateLocation(form.location);
  if (locationError) errors.location = locationError;

  const districtError = validateDistrict(form.district);
  if (districtError) errors.district = districtError;

  const stateError = validateState(form.state);
  if (stateError) errors.state = stateError;

  const pincodeError = validatePincode(form.pincode);
  if (pincodeError) errors.pincode = pincodeError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Animal validation rules strictly matching backend AnimalRequest constraints:
 * - farmId: required, positive number
 * - animalTag: required, max 50 characters
 * - name: optional, max 100 characters
 * - breed: optional, max 100 characters
 * - gender: required (MALE | FEMALE)
 * - dateOfBirth: optional, valid date YYYY-MM-DD not in the future
 * - weight: optional, >= 0.0
 * - daysInMilk: optional, >= 0 integer
 * - milkProductionPerDay: optional, >= 0.0
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const validateAnimalTag = (tag: string): string | null => {
  if (!tag || tag.trim() === '') {
    return 'Animal tag is required';
  }
  const trimmed = tag.trim();
  if (trimmed.length > 50) {
    return 'Animal tag must not exceed 50 characters';
  }
  return null;
};

export const validateAnimalName = (name?: string | null): string | null => {
  if (!name || name.trim() === '') {
    return null;
  }
  if (name.trim().length > 100) {
    return 'Animal name must not exceed 100 characters';
  }
  return null;
};

export const validateAnimalBreed = (breed?: string | null): string | null => {
  if (!breed || breed.trim() === '') {
    return null;
  }
  if (breed.trim().length > 100) {
    return 'Breed must not exceed 100 characters';
  }
  return null;
};

export const validateAnimalGender = (gender?: string | null): string | null => {
  if (!gender || (gender !== 'MALE' && gender !== 'FEMALE')) {
    return 'Gender is required (MALE or FEMALE)';
  }
  return null;
};

export const validateAnimalFarmId = (farmId?: number | null): string | null => {
  if (!farmId || farmId <= 0) {
    return 'A farm must be selected';
  }
  return null;
};

export const validateDateOfBirth = (dob?: string | null): string | null => {
  if (!dob || dob.trim() === '') {
    return null;
  }
  const trimmed = dob.trim();
  if (!DATE_REGEX.test(trimmed)) {
    return 'Date of birth must be in YYYY-MM-DD format';
  }
  const parts = trimmed.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (month < 1 || month > 12) {
    return 'Please enter a valid date';
  }

  const parsed = new Date(year, month - 1, day);
  if (
    isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return 'Please enter a valid date';
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) {
    return 'Date of birth cannot be in the future';
  }
  return null;
};

export const validateWeight = (weight?: number | string | null): string | null => {
  if (weight === undefined || weight === null || weight === '') {
    return null;
  }
  const num = typeof weight === 'number' ? weight : parseFloat(weight);
  if (isNaN(num)) {
    return 'Weight must be a valid number';
  }
  if (num < 0) {
    return 'Weight cannot be negative';
  }
  return null;
};

export const validateDaysInMilk = (days?: number | string | null): string | null => {
  if (days === undefined || days === null || days === '') {
    return null;
  }
  const num = typeof days === 'number' ? days : parseInt(days, 10);
  if (isNaN(num) || !Number.isInteger(num)) {
    return 'Days in milk must be an integer';
  }
  if (num < 0) {
    return 'Days in milk cannot be negative';
  }
  return null;
};

export const validateMilkProduction = (
  production?: number | string | null
): string | null => {
  if (production === undefined || production === null || production === '') {
    return null;
  }
  const num = typeof production === 'number' ? production : parseFloat(production);
  if (isNaN(num)) {
    return 'Milk production must be a valid number';
  }
  if (num < 0) {
    return 'Milk production cannot be negative';
  }
  return null;
};

export const validateAnimalForm = (
  form: Partial<CreateAnimalRequest>
): FormValidationResult<CreateAnimalRequest> => {
  const errors: Partial<Record<keyof CreateAnimalRequest, string>> = {};

  const farmError = validateAnimalFarmId(form.farmId);
  if (farmError) errors.farmId = farmError;

  const tagError = validateAnimalTag(form.animalTag || '');
  if (tagError) errors.animalTag = tagError;

  const nameError = validateAnimalName(form.name);
  if (nameError) errors.name = nameError;

  const breedError = validateAnimalBreed(form.breed);
  if (breedError) errors.breed = breedError;

  const genderError = validateAnimalGender(form.gender);
  if (genderError) errors.gender = genderError;

  const dobError = validateDateOfBirth(form.dateOfBirth);
  if (dobError) errors.dateOfBirth = dobError;

  const weightError = validateWeight(form.weight);
  if (weightError) errors.weight = weightError;

  const daysError = validateDaysInMilk(form.daysInMilk);
  if (daysError) errors.daysInMilk = daysError;

  const milkError = validateMilkProduction(form.milkProductionPerDay);
  if (milkError) errors.milkProductionPerDay = milkError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Feed Sample validation rules matching backend FeedSampleRequest constraints:
 * - farmId: required
 * - sampleCode: required, max 50 characters
 * - feedType: required, valid FeedType enum
 * - sampleDate: required, valid YYYY-MM-DD not in future
 * - source: optional, max 255 characters
 */

export const validateSampleCode = (code: string): string | null => {
  if (!code || code.trim() === '') {
    return 'Sample code is required';
  }
  const trimmed = code.trim();
  if (trimmed.length > 50) {
    return 'Sample code must not exceed 50 characters';
  }
  return null;
};

const VALID_FEED_TYPES: FeedType[] = [
  'CATTLE_FEED_PELLET',
  'FEED_MASH',
  'MINERAL_MIXTURE',
  'GREEN_FODDER',
  'DRY_FODDER',
  'OTHER',
];

export const validateFeedType = (type?: string | null): string | null => {
  if (!type || !VALID_FEED_TYPES.includes(type as FeedType)) {
    return 'A valid feed type is required';
  }
  return null;
};

const VALID_SILAGE_TYPES: SilageType[] = [
  'MAIZE',
  'SORGHUM',
  'NAPIER',
  'MIXED',
  'OTHER',
];

export const validateSilageType = (type?: string | null): string | null => {
  if (!type || !VALID_SILAGE_TYPES.includes(type as SilageType)) {
    return 'A valid silage type is required';
  }
  return null;
};

export const validateSampleDate = (date?: string | null): string | null => {
  if (!date || date.trim() === '') {
    return 'Sample collection date is required';
  }
  const trimmed = date.trim();
  if (!DATE_REGEX.test(trimmed)) {
    return 'Sample date must be in YYYY-MM-DD format';
  }
  const parts = trimmed.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (month < 1 || month > 12) {
    return 'Please enter a valid date';
  }

  const parsed = new Date(year, month - 1, day);
  if (
    isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return 'Please enter a valid date';
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) {
    return 'Sample date cannot be in the future';
  }
  return null;
};

export const validateSampleSource = (source?: string | null): string | null => {
  if (!source || source.trim() === '') {
    return null;
  }
  if (source.trim().length > 255) {
    return 'Source must not exceed 255 characters';
  }
  return null;
};

export const validateFeedSampleForm = (
  form: Partial<CreateFeedSampleRequest>
): FormValidationResult<CreateFeedSampleRequest> => {
  const errors: Partial<Record<keyof CreateFeedSampleRequest, string>> = {};

  const farmError = validateAnimalFarmId(form.farmId);
  if (farmError) errors.farmId = farmError;

  const codeError = validateSampleCode(form.sampleCode || '');
  if (codeError) errors.sampleCode = codeError;

  const typeError = validateFeedType(form.feedType);
  if (typeError) errors.feedType = typeError;

  const dateError = validateSampleDate(form.sampleDate);
  if (dateError) errors.sampleDate = dateError;

  const sourceError = validateSampleSource(form.source);
  if (sourceError) errors.source = sourceError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateSilageSampleForm = (
  form: Partial<CreateSilageSampleRequest>
): FormValidationResult<CreateSilageSampleRequest> => {
  const errors: Partial<Record<keyof CreateSilageSampleRequest, string>> = {};

  const farmError = validateAnimalFarmId(form.farmId);
  if (farmError) errors.farmId = farmError;

  const codeError = validateSampleCode(form.sampleCode || '');
  if (codeError) errors.sampleCode = codeError;

  const typeError = validateSilageType(form.silageType);
  if (typeError) errors.silageType = typeError;

  const dateError = validateSampleDate(form.sampleDate);
  if (dateError) errors.sampleDate = dateError;

  const sourceError = validateSampleSource(form.source);
  if (sourceError) errors.source = sourceError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Test Result validation rules matching backend TestResultRequest constraints:
 * - Either feedSampleId or silageSampleId required (not both, not neither)
 * - Measurement metrics (moisture, crudeProtein, fiber, energyValue, aflatoxin, mycotoxin, ph, confidenceScore): optional, >= 0.0
 */

export const validateTestResultParent = (
  feedSampleId?: number | null,
  silageSampleId?: number | null
): string | null => {
  if (!feedSampleId && !silageSampleId) {
    return 'Either a feed sample or a silage sample must be selected';
  }
  if (feedSampleId && silageSampleId) {
    return 'A test result must be associated with either feed or silage, not both';
  }
  return null;
};

export const validateNonNegativeDecimal = (
  value?: number | string | null,
  fieldName = 'Value'
): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < 0) {
    return `${fieldName} cannot be negative`;
  }
  return null;
};

export const validateTestDate = (date?: string | null): string | null => {
  if (!date || date.trim() === '') {
    return null; // testDate is optional, backend defaults to LocalDate.now()
  }
  return validateSampleDate(date);
};

export const validatePh = (value?: number | string | null): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) {
    return 'pH must be a valid number';
  }
  if (num < 0) {
    return 'pH cannot be negative';
  }
  if (num > 14) {
    return 'pH must be between 0 and 14';
  }
  return null;
};

export const validateConfidenceScore = (
  value?: number | string | null
): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) {
    return 'Confidence Score must be a valid number';
  }
  if (num < 0) {
    return 'Confidence Score cannot be negative';
  }
  if (num > 1.0) {
    return 'Confidence Score must be between 0.0 and 1.0';
  }
  return null;
};

export const validateTestResultForm = (
  form: Partial<CreateTestResultRequest>
): FormValidationResult<CreateTestResultRequest> => {
  const errors: Partial<Record<keyof CreateTestResultRequest, string>> = {};

  const parentError = validateTestResultParent(form.feedSampleId, form.silageSampleId);
  if (parentError) errors.feedSampleId = parentError;

  const dateError = validateTestDate(form.testDate);
  if (dateError) errors.testDate = dateError;

  const moistureError = validateNonNegativeDecimal(form.moisture, 'Moisture');
  if (moistureError) errors.moisture = moistureError;

  const proteinError = validateNonNegativeDecimal(form.crudeProtein, 'Crude Protein');
  if (proteinError) errors.crudeProtein = proteinError;

  const fiberError = validateNonNegativeDecimal(form.fiber, 'Crude Fiber');
  if (fiberError) errors.fiber = fiberError;

  const energyError = validateNonNegativeDecimal(form.energyValue, 'Energy Value');
  if (energyError) errors.energyValue = energyError;

  const aflatoxinError = validateNonNegativeDecimal(form.aflatoxin, 'Aflatoxin');
  if (aflatoxinError) errors.aflatoxin = aflatoxinError;

  const mycotoxinError = validateNonNegativeDecimal(form.mycotoxin, 'Mycotoxin');
  if (mycotoxinError) errors.mycotoxin = mycotoxinError;

  const phError = validatePh(form.ph);
  if (phError) errors.ph = phError;

  const scoreError = validateConfidenceScore(form.confidenceScore);
  if (scoreError) errors.confidenceScore = scoreError;

  if (form.mineralStatus && form.mineralStatus.length > 100) {
    errors.mineralStatus = 'Mineral Status must not exceed 100 characters';
  }

  if (form.adulteration && form.adulteration.length > 100) {
    errors.adulteration = 'Adulteration findings must not exceed 100 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
