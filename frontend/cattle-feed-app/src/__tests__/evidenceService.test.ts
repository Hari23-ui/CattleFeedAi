import { apiClient } from '../services/apiClient';
import { evidenceService } from '../services/evidenceService';
import { EvidenceSummary } from '../models/evidence';

describe('EvidenceService (M12 Backend Integration)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockEvidence: EvidenceSummary = {
    animal: {
      id: 10,
      farmId: 1,
      name: 'Gauri',
      animalTag: 'TAG-M12-001',
      breed: 'Gir',
      gender: 'FEMALE',
      dateOfBirth: '2021-01-01',
      weight: 420.0,
      lactationStage: 'MID',
      daysInMilk: 120,
      milkProductionPerDay: 18.0,
      pregnancyStatus: 'NOT_PREGNANT',
      feedIntakeStatus: 'NORMAL',
    },
    consultation: {
      id: 5,
      subject: 'Feed Quality Evaluation Request',
      question: 'Is this silage safe given slight discoloration?',
      additionalContext: 'Stored in bunker for 45 days',
      status: 'UNDER_REVIEW',
      requestDate: '2026-09-28T10:00:00',
      farmerId: 1,
      farmerName: 'Farmer Ramesh',
      expertId: 2,
      expertName: 'Dr. Expert Rao',
      expertSpecialization: 'Veterinary Nutritionist',
      evidenceSource: 'EXPERT_RESPONSE',
    },
    feedEvidence: [
      {
        feedSampleId: 1,
        sampleCode: 'FEE-20260928-001',
        feedType: 'Concentrate',
        source: 'Purchased commercial batch',
        sampleDate: '2026-09-28',
        imageCount: 2,
        latestQuality: 'GOOD',
        evidenceSource: 'RECORDED_DATA',
      },
    ],
    silageEvidence: [
      {
        silageSampleId: 2,
        sampleCode: 'SIL-20260928-002',
        silageType: 'Corn Silage',
        source: 'Pit Silo A',
        sampleDate: '2026-09-28',
        imageCount: 1,
        latestQuality: 'ACCEPTABLE',
        evidenceSource: 'RECORDED_DATA',
      },
    ],
    testEvidence: [
      {
        testResultId: 100,
        sampleType: 'FEED',
        sampleCode: 'FEE-20260928-001',
        testDate: '2026-09-28',
        analysisSource: 'LABORATORY_DATA',
        moisture: 12.0,
        crudeProtein: 18.5,
        fiber: 14.0,
        energyValue: 2.8,
        ph: 6.2,
        qualityStatus: 'GOOD',
        riskLevel: 'LOW',
        evidenceSource: 'LABORATORY_DATA',
      },
    ],
    qualityEvidence: {
      qualityStatus: 'GOOD',
      explanation: 'Nutrient parameters within acceptable baseline ranges.',
      parameters: [],
      triggeredRulesCount: 0,
      evaluationTimestamp: '2026-09-28T12:00:00',
      disclaimer: 'Rule-based quality screening.',
    },
    riskEvidence: {
      overallRiskLevel: 'LOW',
      allRisks: [],
      contaminationRisks: [],
      nutritionalImbalances: [],
      storageSpoilageRisks: [],
      screeningDisclaimer: 'Non-diagnostic screening.',
    },
    visualScreeningEvidence: {
      evidenceAvailable: true,
      analysisSource: 'ML_VISUAL_SCREENING',
      modelVersion: '1.2.0',
      modelAvailable: true,
      visualStatus: 'NORMAL',
      mouldDetected: false,
      spoilageDetected: false,
      foreignMaterialDetected: false,
      confidenceScore: 92.5,
      identifiedVisualRisks: [],
      disclaimer: 'AI visual screening evaluates surface image characteristics only.',
      evidenceSource: 'AI_VISUAL_SCREENING',
    },
    healthScreeningEvidence: {
      animalId: 10,
      animalTag: 'TAG-M12-001',
      screeningStatus: 'NORMAL',
      missingInformation: [],
      detectedRisks: [],
      recentObservationsCount: 2,
      recentTestResultsCount: 1,
      dietaryAndHealthSummary: 'Nutritional balance aligned with mid-lactation status.',
      recommendationSummary: 'Continue standard ration monitoring.',
      disclaimer: 'Non-diagnostic animal health screening.',
    },
    feedPlans: [
      {
        id: 7,
        planName: 'High Yield Lactation Plan',
        startDate: '2026-09-20',
        status: 'ACTIVE',
        plannedQuantity: 15.0,
        notes: 'Maintain mineral mix',
        createdAt: '2026-09-20T10:00:00',
        updatedAt: '2026-09-20T10:00:00',
        animal: {
          id: 10,
          animalTag: 'TAG-M12-001',
          name: 'Gauri',
        },
      },
    ],
    advisories: [
      {
        id: 15,
        animalId: 10,
        animalTag: 'TAG-M12-001',
        category: 'NUTRITION',
        priority: 'MEDIUM',
        title: 'Balanced Concentrate Recommendation',
        message: 'Ensure constant clean water supply alongside concentrate.',
        recommendedAction: 'Provide fresh water ad libitum.',
        isRead: false,
        createdAt: '2026-09-28T10:00:00',
      },
    ],
    historicalSummary: {
      totalTestResults: 5,
      totalFeedTests: 3,
      totalSilageTests: 2,
      totalConsultations: 1,
      totalActiveAdvisories: 1,
      qualityDistribution: { GOOD: 4, ACCEPTABLE: 1 },
      riskDistribution: { LOW: 5 },
      descriptiveSummary: 'Historical records indicate stable quality across 5 completed tests.',
      disclaimer: 'Historical analytics decision-support.',
      evidenceSource: 'HISTORICAL_ANALYTICS',
    },
    disclaimer:
      'This evidence summary combines available recorded, laboratory, screening, and historical information for decision support.',
  };

  describe('getEvidenceForAnimal', () => {
    it('should call GET /api/evidence/animals/{animalId} and return EvidenceSummary', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockEvidence);

      const result = await evidenceService.getEvidenceForAnimal(10);

      expect(getSpy).toHaveBeenCalledWith('/api/evidence/animals/10');
      expect(result.animal?.animalTag).toBe('TAG-M12-001');
      expect(result.visualScreeningEvidence?.analysisSource).toBe('ML_VISUAL_SCREENING');
      expect(result.feedPlans).toHaveLength(1);
      expect(result.historicalSummary?.totalTestResults).toBe(5);
    });

    it('should propagate errors such as 403 or 404', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce({
        response: { status: 403, data: { message: 'Access denied to animal records' } },
      });

      await expect(evidenceService.getEvidenceForAnimal(99)).rejects.toMatchObject({
        response: { status: 403 },
      });
    });
  });

  describe('getEvidenceForConsultation', () => {
    it('should call GET /api/evidence/consultations/{consultationId} and return EvidenceSummary', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockEvidence);

      const result = await evidenceService.getEvidenceForConsultation(5);

      expect(getSpy).toHaveBeenCalledWith('/api/evidence/consultations/5');
      expect(result.consultation?.id).toBe(5);
      expect(result.consultation?.expertSpecialization).toBe('Veterinary Nutritionist');
      expect(result.visualScreeningEvidence?.mouldDetected).toBe(false);
    });

    it('should handle unassigned expert 403 error', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce({
        response: { status: 403, data: { message: 'Only assigned expert may view evidence' } },
      });

      await expect(evidenceService.getEvidenceForConsultation(99)).rejects.toMatchObject({
        response: { status: 403 },
      });
    });
  });
});
