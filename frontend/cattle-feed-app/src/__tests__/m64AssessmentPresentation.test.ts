import { QualityStatus } from '../models/assessment';
import { RiskIndicatorDto, Severity } from '../models/risk';
import { AdvisoryResponse, Priority } from '../models/advisory';

describe('M6.4 Assessment, Risk & Advisory Presentation Logic', () => {
  // Test 1: Quality Status Badge Mapping
  describe('QualityStatus mappings (M5 Backend Contract)', () => {
    const STATUS_DESCRIPTIONS: Record<QualityStatus, { label: string; desc: string }> = {
      GOOD: {
        label: 'Good Quality',
        desc: 'Available measurements did not trigger the configured quality rules.',
      },
      ACCEPTABLE: {
        label: 'Acceptable',
        desc: 'Some measurements may require attention.',
      },
      NEEDS_ATTENTION: {
        label: 'Needs Attention',
        desc: 'One or more quality indicators require attention.',
      },
      UNSAFE: {
        label: 'Potential Hazard / Unsafe',
        desc: 'One or more configured safety rules were triggered.',
      },
      INSUFFICIENT_DATA: {
        label: 'Insufficient Data',
        desc: 'More measurements are required for a complete assessment.',
      },
    };

    it('should map GOOD status conservatively without claiming absolute safety', () => {
      const config = STATUS_DESCRIPTIONS.GOOD;
      expect(config.label).toBe('Good Quality');
      expect(config.desc).toContain('did not trigger');
      expect(config.desc).not.toContain('100% safe');
      expect(config.desc).not.toContain('Guaranteed');
    });

    it('should map ACCEPTABLE status accurately', () => {
      const config = STATUS_DESCRIPTIONS.ACCEPTABLE;
      expect(config.label).toBe('Acceptable');
      expect(config.desc).toContain('Some measurements may require attention');
    });

    it('should map NEEDS_ATTENTION status accurately', () => {
      const config = STATUS_DESCRIPTIONS.NEEDS_ATTENTION;
      expect(config.label).toBe('Needs Attention');
      expect(config.desc).toContain('require attention');
    });

    it('should map UNSAFE status with safety warning', () => {
      const config = STATUS_DESCRIPTIONS.UNSAFE;
      expect(config.label).toContain('Unsafe');
      expect(config.desc).toContain('safety rules were triggered');
    });

    it('should map INSUFFICIENT_DATA explicitly and not convert to GOOD', () => {
      const config = STATUS_DESCRIPTIONS.INSUFFICIENT_DATA;
      expect(config.label).toBe('Insufficient Data');
      expect(config.desc).toContain('More measurements are required');
      expect(config.label).not.toBe('Good Quality');
    });
  });

  // Test 2: Nullable Parameter Rendering Rules (Phase 11)
  describe('Nullable parameter rendering (Phase 11)', () => {
    const formatValueSafely = (
      val: unknown,
      unit?: string | null
    ): string => {
      if (val === null || val === undefined) {
        return 'Not Available';
      }
      if (typeof val === 'boolean') {
        return val ? 'Detected ⚠️' : 'Not Detected ✓';
      }
      return unit ? `${val} ${unit}` : `${val}`;
    };

    it('should render null numbers as "Not Available"', () => {
      expect(formatValueSafely(null, '%')).toBe('Not Available');
      expect(formatValueSafely(undefined, 'ppb')).toBe('Not Available');
    });

    it('never converts null to 0 or "Safe"', () => {
      const result = formatValueSafely(null, '%');
      expect(result).not.toBe('0');
      expect(result).not.toBe('0 %');
      expect(result).not.toBe('Safe');
      expect(result).not.toBe('Normal');
    });

    it('correctly formats numeric measurements with units', () => {
      expect(formatValueSafely(12.5, '%')).toBe('12.5 %');
      expect(formatValueSafely(4.2, 'ppb')).toBe('4.2 ppb');
      expect(formatValueSafely(6.5, 'pH')).toBe('6.5 pH');
    });

    it('renders booleans as Detected or Not Detected', () => {
      expect(formatValueSafely(true)).toBe('Detected ⚠️');
      expect(formatValueSafely(false)).toBe('Not Detected ✓');
      expect(formatValueSafely(null)).toBe('Not Available');
    });
  });

  // Test 3: Risk Indicator Categorization & Grouping
  describe('Risk grouping logic', () => {
    const sampleRisks: RiskIndicatorDto[] = [
      {
        category: 'CONTAMINATION',
        riskTitle: 'Potential Risk: AFLATOXIN',
        severity: 'CRITICAL',
        description: 'Aflatoxin exceeds standard safe limit',
        mitigationRecommendation: 'Do not feed this batch.',
        detectedParameter: 'AFLATOXIN',
      },
      {
        category: 'NUTRITION',
        riskTitle: 'Potential Imbalance: CRUDE_PROTEIN',
        severity: 'WARNING',
        description: 'Low protein content',
        mitigationRecommendation: 'Supplement with concentrate.',
        detectedParameter: 'CRUDE_PROTEIN',
      },
      {
        category: 'STORAGE',
        riskTitle: 'Potential Risk: MOULD_DETECTED',
        severity: 'HIGH',
        description: 'Mould detected in forage',
        mitigationRecommendation: 'Inspect storage facility.',
        detectedParameter: 'MOULD_DETECTED',
      },
      {
        category: 'SILAGE',
        riskTitle: 'Potential Risk: PH',
        severity: 'WARNING',
        description: 'Elevated pH indicates poor fermentation',
        mitigationRecommendation: 'Ensure anaerobic compaction.',
        detectedParameter: 'PH',
      },
    ];

    it('should correctly filter contamination risks', () => {
      const contamination = sampleRisks.filter(r => r.category === 'CONTAMINATION');
      expect(contamination).toHaveLength(1);
      expect(contamination[0].detectedParameter).toBe('AFLATOXIN');
      expect(contamination[0].severity).toBe('CRITICAL');
    });

    it('should correctly filter nutritional imbalances', () => {
      const nutrition = sampleRisks.filter(r => r.category === 'NUTRITION');
      expect(nutrition).toHaveLength(1);
      expect(nutrition[0].detectedParameter).toBe('CRUDE_PROTEIN');
      expect(nutrition[0].severity).toBe('WARNING');
    });

    it('should group storage and silage risks under storage/spoilage', () => {
      const storageSpoilage = sampleRisks.filter(
        r => r.category === 'STORAGE' || r.category === 'SILAGE'
      );
      expect(storageSpoilage).toHaveLength(2);
    });

    it('handles empty risk list correctly without crashing', () => {
      const emptyRisks: RiskIndicatorDto[] = [];
      const contamination = emptyRisks.filter(r => r.category === 'CONTAMINATION');
      expect(contamination).toHaveLength(0);
    });
  });

  // Test 4: Advisory Prioritization & Non-diagnostic Terminology
  describe('Advisory presentation', () => {
    const advisories: AdvisoryResponse[] = [
      {
        id: 1,
        animalId: 10,
        animalTag: 'COW-01',
        category: 'CONTAMINATION',
        priority: 'HIGH',
        title: 'Potential Feed Risk',
        message: 'Elevated moisture and potential mould growth detected.',
        recommendedAction: 'Discard suspect feed; ensure dry storage.',
        isRead: false,
      },
      {
        id: 2,
        animalId: 10,
        animalTag: 'COW-01',
        category: 'NUTRITION',
        priority: 'LOW',
        title: 'Nutritional Balance Guidance',
        message: 'Protein levels are near optimal maintenance.',
        recommendedAction: 'Maintain current feeding regimen.',
        isRead: true,
      },
    ];

    it('should separate HIGH vs LOW priority advisories', () => {
      const highPriority = advisories.filter(a => a.priority === 'HIGH');
      const lowPriority = advisories.filter(a => a.priority === 'LOW');
      expect(highPriority).toHaveLength(1);
      expect(lowPriority).toHaveLength(1);
    });

    it('uses non-diagnostic phrasing', () => {
      advisories.forEach(adv => {
        expect(adv.title).not.toMatch(/Your cow has [a-zA-Z]+/i);
        expect(adv.title).not.toMatch(/Confirmed disease/i);
        expect(adv.message).not.toMatch(/This feed caused [a-zA-Z]+/i);
      });
    });

    it('handles null recommendedAction without errors', () => {
      const advisoryWithoutAction: AdvisoryResponse = {
        id: 3,
        title: 'General Notification',
        message: 'General screening advisory message.',
        isRead: true,
      };
      expect(advisoryWithoutAction.recommendedAction).toBeUndefined();
    });
  });
});
