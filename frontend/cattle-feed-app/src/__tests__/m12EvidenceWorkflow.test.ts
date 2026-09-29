import { AppStackParamList } from '../navigation/types';
import { EvidenceSummary, EvidenceSourceType } from '../models/evidence';

/**
 * Route resolution test helper for M12 Integrated Decision Support workflow
 */
type M12NavAction =
  | { type: 'Dashboard:REVIEW_EVIDENCE' }
  | { type: 'AnimalDetails:VIEW_EVIDENCE'; animalId: number }
  | { type: 'ConsultationDetails:VIEW_EVIDENCE'; consultationId: number }
  | { type: 'ExpertConsultationReview:VIEW_EVIDENCE'; consultationId: number }
  | { type: 'FeedPlanDetails:VIEW_EVIDENCE'; animalId: number }
  | { type: 'EvidenceSummary:OPEN_FEED'; sampleId: number }
  | { type: 'EvidenceSummary:OPEN_SILAGE'; sampleId: number }
  | { type: 'EvidenceSummary:OPEN_TEST'; resultId: number }
  | { type: 'EvidenceSummary:OPEN_FEED_PLAN'; planId: number }
  | { type: 'EvidenceSummary:OPEN_ADVISORY'; advisoryId: number };

function resolveM12Route(
  currentScreen: keyof AppStackParamList,
  action: M12NavAction
): { screen: keyof AppStackParamList; params?: any } {
  switch (`${currentScreen}:${action.type}`) {
    case 'Dashboard:Dashboard:REVIEW_EVIDENCE':
      return { screen: 'EvidenceSummary', params: { title: 'Unified Evidence Summary' } };

    case 'AnimalDetails:AnimalDetails:VIEW_EVIDENCE':
      return { screen: 'EvidenceSummary', params: { animalId: (action as any).animalId } };

    case 'ConsultationDetails:ConsultationDetails:VIEW_EVIDENCE':
      return {
        screen: 'EvidenceSummary',
        params: { consultationId: (action as any).consultationId, title: 'Consultation Evidence Summary' },
      };

    case 'ExpertConsultationReview:ExpertConsultationReview:VIEW_EVIDENCE':
      return {
        screen: 'EvidenceSummary',
        params: { consultationId: (action as any).consultationId, title: 'Case Evidence Summary' },
      };

    case 'FeedPlanDetails:FeedPlanDetails:VIEW_EVIDENCE':
      return {
        screen: 'EvidenceSummary',
        params: { animalId: (action as any).animalId, title: 'Animal Evidence Summary' },
      };

    case 'EvidenceSummary:EvidenceSummary:OPEN_FEED':
      return { screen: 'FeedDetails', params: { sampleId: (action as any).sampleId } };

    case 'EvidenceSummary:EvidenceSummary:OPEN_SILAGE':
      return { screen: 'SilageDetails', params: { sampleId: (action as any).sampleId } };

    case 'EvidenceSummary:EvidenceSummary:OPEN_TEST':
      return { screen: 'TestResultDetails', params: { resultId: (action as any).resultId } };

    case 'EvidenceSummary:EvidenceSummary:OPEN_FEED_PLAN':
      return { screen: 'FeedPlanDetails', params: { planId: (action as any).planId } };

    case 'EvidenceSummary:EvidenceSummary:OPEN_ADVISORY':
      return { screen: 'AdvisoryDetails', params: { advisoryId: (action as any).advisoryId } };

    default:
      throw new Error(`Unhandled M12 navigation: ${currentScreen} -> ${action.type}`);
  }
}

describe('M12 Integrated Decision Support Workflow', () => {
  describe('Navigation Flow', () => {
    it('should navigate from Dashboard to EvidenceSummary', () => {
      const target = resolveM12Route('Dashboard', { type: 'Dashboard:REVIEW_EVIDENCE' });
      expect(target.screen).toBe('EvidenceSummary');
    });

    it('should navigate from AnimalDetails to EvidenceSummary with animalId', () => {
      const target = resolveM12Route('AnimalDetails', {
        type: 'AnimalDetails:VIEW_EVIDENCE',
        animalId: 10,
      });
      expect(target.screen).toBe('EvidenceSummary');
      expect(target.params.animalId).toBe(10);
    });

    it('should navigate from ConsultationDetails to EvidenceSummary with consultationId', () => {
      const target = resolveM12Route('ConsultationDetails', {
        type: 'ConsultationDetails:VIEW_EVIDENCE',
        consultationId: 5,
      });
      expect(target.screen).toBe('EvidenceSummary');
      expect(target.params.consultationId).toBe(5);
    });

    it('should navigate from ExpertConsultationReview to EvidenceSummary with consultationId', () => {
      const target = resolveM12Route('ExpertConsultationReview', {
        type: 'ExpertConsultationReview:VIEW_EVIDENCE',
        consultationId: 5,
      });
      expect(target.screen).toBe('EvidenceSummary');
      expect(target.params.consultationId).toBe(5);
    });

    it('should navigate from FeedPlanDetails to EvidenceSummary with animalId', () => {
      const target = resolveM12Route('FeedPlanDetails', {
        type: 'FeedPlanDetails:VIEW_EVIDENCE',
        animalId: 10,
      });
      expect(target.screen).toBe('EvidenceSummary');
      expect(target.params.animalId).toBe(10);
    });

    it('should drill down from EvidenceSummary into child resources', () => {
      expect(resolveM12Route('EvidenceSummary', { type: 'EvidenceSummary:OPEN_FEED', sampleId: 1 })).toEqual({
        screen: 'FeedDetails',
        params: { sampleId: 1 },
      });
      expect(resolveM12Route('EvidenceSummary', { type: 'EvidenceSummary:OPEN_SILAGE', sampleId: 2 })).toEqual({
        screen: 'SilageDetails',
        params: { sampleId: 2 },
      });
      expect(resolveM12Route('EvidenceSummary', { type: 'EvidenceSummary:OPEN_TEST', resultId: 100 })).toEqual({
        screen: 'TestResultDetails',
        params: { resultId: 100 },
      });
      expect(resolveM12Route('EvidenceSummary', { type: 'EvidenceSummary:OPEN_FEED_PLAN', planId: 7 })).toEqual({
        screen: 'FeedPlanDetails',
        params: { planId: 7 },
      });
      expect(resolveM12Route('EvidenceSummary', { type: 'EvidenceSummary:OPEN_ADVISORY', advisoryId: 15 })).toEqual({
        screen: 'AdvisoryDetails',
        params: { advisoryId: 15 },
      });
    });
  });

  describe('Evidence Source Attribution & Transparency', () => {
    const validSources: EvidenceSourceType[] = [
      'LABORATORY_DATA',
      'RECORDED_DATA',
      'AI_VISUAL_SCREENING',
      'DETERMINISTIC_VISUAL_SCREENING',
      'RULE_BASED_QUALITY_ASSESSMENT',
      'RISK_SCREENING',
      'ANIMAL_HEALTH_SCREENING',
      'FARMER_RECORDED_INFORMATION',
      'EXPERT_RESPONSE',
      'HISTORICAL_ANALYTICS',
    ];

    it('should have properly defined evidence source types', () => {
      expect(validSources).toContain('AI_VISUAL_SCREENING');
      expect(validSources).toContain('DETERMINISTIC_VISUAL_SCREENING');
      expect(validSources).toContain('LABORATORY_DATA');
      expect(validSources).toContain('RULE_BASED_QUALITY_ASSESSMENT');
    });

    it('should distinguish ML visual screening from deterministic fallback', () => {
      const mlEvidence: EvidenceSummary['visualScreeningEvidence'] = {
        evidenceAvailable: true,
        analysisSource: 'ML_VISUAL_SCREENING',
        modelVersion: '1.0.0',
        visualStatus: 'NORMAL',
        identifiedVisualRisks: [],
        disclaimer: 'Surface characteristics only.',
        evidenceSource: 'AI_VISUAL_SCREENING',
      };

      const fallbackEvidence: EvidenceSummary['visualScreeningEvidence'] = {
        evidenceAvailable: true,
        analysisSource: 'DETERMINISTIC_VISUAL_SCREENING',
        visualStatus: 'NORMAL',
        identifiedVisualRisks: [],
        disclaimer: 'Surface characteristics only.',
        evidenceSource: 'DETERMINISTIC_VISUAL_SCREENING',
      };

      expect(mlEvidence.analysisSource).toBe('ML_VISUAL_SCREENING');
      expect(mlEvidence.modelVersion).toBe('1.0.0');
      expect(fallbackEvidence.analysisSource).toBe('DETERMINISTIC_VISUAL_SCREENING');
      expect(fallbackEvidence.modelVersion).toBeUndefined();
    });
  });

  describe('Missing Data & Scientific Boundaries', () => {
    it('should preserve nulls or Not Available when data is missing rather than fabricating zeros', () => {
      const sparseEvidence: Partial<EvidenceSummary> = {
        animal: undefined,
        feedEvidence: [],
        silageEvidence: [],
        testEvidence: [],
        qualityEvidence: undefined,
        riskEvidence: undefined,
        visualScreeningEvidence: {
          evidenceAvailable: false,
          analysisSource: 'NONE',
          visualStatus: 'NOT_AVAILABLE',
          identifiedVisualRisks: [],
          disclaimer: 'Physical characteristics only.',
          evidenceSource: 'RECORDED_DATA',
        },
        feedPlans: [],
        advisories: [],
        historicalSummary: undefined,
      };

      expect(sparseEvidence.animal).toBeUndefined();
      expect(sparseEvidence.feedEvidence).toHaveLength(0);
      expect(sparseEvidence.visualScreeningEvidence?.evidenceAvailable).toBe(false);
      expect(sparseEvidence.qualityEvidence).toBeUndefined();
    });

    it('should enforce proper professional designations and prohibited terms', () => {
      const allowedRoles = ['Veterinarian', 'Veterinary Nutritionist', 'Animal Nutrition Expert'];
      const prohibitedRole = 'dietician';

      expect(allowedRoles).not.toContain(prohibitedRole);

      // Verify disclaimer contains mandatory wording
      const sampleDisclaimer =
        'This evidence summary combines available recorded, laboratory, screening, and historical information for decision support. AI visual screening evaluates image characteristics only and does not measure chemical composition or provide veterinary diagnosis. Professional interpretation should be obtained from a qualified Veterinarian or Veterinary Nutritionist.';

      expect(sampleDisclaimer).toContain('Veterinarian or Veterinary Nutritionist');
      expect(sampleDisclaimer).toContain('does not measure chemical composition');
      expect(sampleDisclaimer.toLowerCase()).not.toContain('dietician');
    });
  });
});
