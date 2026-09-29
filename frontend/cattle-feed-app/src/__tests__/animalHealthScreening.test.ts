import { AnimalHealthScreeningResponse, HealthScreeningStatus } from '../models/animalHealth';
import { RiskIndicatorDto } from '../models/risk';

describe('Animal Health Screening Presentation & Non-Diagnostic Verification (Phase 9 & 24)', () => {
  const SCREENING_CONFIG: Record<
    HealthScreeningStatus,
    { title: string; desc: string; icon: string }
  > = {
    NORMAL: {
      title: 'Baseline Normal Screening',
      desc: 'No immediate feed-related risk indicators detected based on available records.',
      icon: '✓',
    },
    POTENTIAL_CONCERN: {
      title: 'Potential Concern Identified',
      desc: 'Parameters deviate from baseline screening requirements.',
      icon: '⚠️',
    },
    INSUFFICIENT_DATA: {
      title: 'Insufficient Data for Complete Screening',
      desc: 'Additional feed tests or logged observations required.',
      icon: 'ℹ️',
    },
  };

  it('maps NORMAL status with non-diagnostic language', () => {
    const config = SCREENING_CONFIG.NORMAL;
    expect(config.title).toBe('Baseline Normal Screening');
    expect(config.desc).not.toContain('guaranteed');
    expect(config.desc).not.toContain('healthy forever');
  });

  it('maps POTENTIAL_CONCERN with screening indicator terminology', () => {
    const config = SCREENING_CONFIG.POTENTIAL_CONCERN;
    expect(config.title).toBe('Potential Concern Identified');
    expect(config.title).not.toContain('Disease Diagnosed');
  });

  it('maps INSUFFICIENT_DATA clearly without defaulting to NORMAL', () => {
    const config = SCREENING_CONFIG.INSUFFICIENT_DATA;
    expect(config.title).toContain('Insufficient Data');
    expect(config.title).not.toBe('Baseline Normal Screening');
  });

  describe('Non-diagnostic rule enforcement (Phase 9)', () => {
    const mockScreening: AnimalHealthScreeningResponse = {
      animalId: 10,
      animalTag: 'COW-01',
      screeningStatus: 'POTENTIAL_CONCERN',
      missingInformation: [],
      detectedRisks: [
        {
          category: 'NUTRITION',
          riskTitle: 'Potential Nutritional Imbalance: Protein Deficit Risk for Lactation Yield',
          severity: 'WARNING',
          description: 'Animal is in high-demand lactation while crude protein is below 16%.',
          mitigationRecommendation: 'Supplement with oil cakes or leguminous fodder.',
          detectedParameter: 'CRUDE_PROTEIN',
        },
        {
          category: 'CONTAMINATION',
          riskTitle: 'Possible Feed-Related Concern: Appetite Reduction Linked to Feed Quality',
          severity: 'HIGH',
          description: 'Reduced intake reported concurrently with feed moisture elevation.',
          mitigationRecommendation: 'Inspect feed bunks for heating or mould.',
        },
      ],
      recentObservationsCount: 1,
      recentTestResultsCount: 2,
      dietaryAndHealthSummary: 'Identified 2 potential feed-related risk indicators.',
      recommendationSummary: 'Review indicated nutritional and storage mitigations.',
      disclaimer:
        'Screening Disclaimer: Animal health risk screening correlates nutritional parameters and logged farmer observations. It identifies potential feed-related risk indicators and does NOT constitute a veterinary diagnosis.',
    };

    it('contains official screening disclaimer', () => {
      expect(mockScreening.disclaimer).toContain(
        'does NOT constitute a veterinary diagnosis'
      );
      expect(mockScreening.disclaimer).toContain('Screening Disclaimer');
    });

    it('uses non-diagnostic phrasing across all detected risks', () => {
      mockScreening.detectedRisks.forEach(risk => {
        // Must NOT claim clinical diagnoses
        expect(risk.riskTitle).not.toMatch(/Your cow has [a-zA-Z]+/i);
        expect(risk.riskTitle).not.toMatch(/Confirmed disease/i);
        expect(risk.riskTitle).not.toMatch(/Diagnosed with/i);
        expect(risk.description).not.toMatch(/This feed caused disease/i);

        // MUST use screening terminology
        const hasScreeningTerm =
          risk.riskTitle.includes('Potential') ||
          risk.riskTitle.includes('Possible') ||
          risk.riskTitle.includes('Risk') ||
          risk.riskTitle.includes('Concern') ||
          risk.riskTitle.includes('Imbalance');
        expect(hasScreeningTerm).toBe(true);
      });
    });

    it('presents mitigation recommendations without prescribing medical drugs', () => {
      mockScreening.detectedRisks.forEach(risk => {
        if (risk.mitigationRecommendation) {
          expect(risk.mitigationRecommendation).not.toMatch(/Inject [a-zA-Z]+/i);
          expect(risk.mitigationRecommendation).not.toMatch(/Antibiotics prescription/i);
        }
      });
    });
  });

  describe('Missing Information rendering for INSUFFICIENT_DATA', () => {
    const insufficientScreening: AnimalHealthScreeningResponse = {
      animalId: 20,
      animalTag: 'COW-02',
      screeningStatus: 'INSUFFICIENT_DATA',
      missingInformation: [
        'Feed or Silage test results for this animal',
        'Farmer-logged health observations',
      ],
      detectedRisks: [],
      recentObservationsCount: 0,
      recentTestResultsCount: 0,
      dietaryAndHealthSummary: 'No feed tests or health observations available for this animal.',
      recommendationSummary:
        'Record at least one feed/silage test or health observation to enable nutritional risk screening.',
      disclaimer: 'Screening Disclaimer: Does not constitute veterinary diagnosis.',
    };

    it('lists all missing requirements', () => {
      expect(insufficientScreening.missingInformation).toHaveLength(2);
      expect(insufficientScreening.missingInformation[0]).toContain('Feed or Silage test results');
      expect(insufficientScreening.missingInformation[1]).toContain('health observations');
    });

    it('reports zero detected risks safely', () => {
      expect(insufficientScreening.detectedRisks).toHaveLength(0);
      expect(insufficientScreening.recentTestResultsCount).toBe(0);
      expect(insufficientScreening.recentObservationsCount).toBe(0);
    });
  });
});
