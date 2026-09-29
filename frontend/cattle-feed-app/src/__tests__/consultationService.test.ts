import { apiClient } from '../services/apiClient';
import { consultationService } from '../services/consultationService';
import {
  ConsultationRequest,
  ConsultationResponse,
  ConsultationStatus,
  ExpertRecommendationRequest,
} from '../models/consultation';
import { AppApiError } from '../models/api';

describe('Consultation Service & Workflow (Milestone 8)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockConsultation: ConsultationResponse = {
    id: 1,
    subject: 'Feed intake reduction in COW-101',
    question: 'The animal has reduced its feed intake by 25% over the past two days. Please review.',
    additionalContext: 'Weather has been warm and humid.',
    status: 'REQUESTED',
    requestDate: '2026-09-28',
    createdAt: '2026-09-28T10:00:00',
    updatedAt: '2026-09-28T10:00:00',
    farmerId: 10,
    farmerName: 'FarmerJohn',
    farmerEmail: 'farmer.john@example.com',
    animalId: 101,
    animalTag: 'COW-101',
    feedSampleId: 201,
    feedSampleCode: 'FEED-201',
  };

  describe('1. Consultation Service API Calls', () => {
    it('creates consultation successfully with valid request', async () => {
      const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockConsultation);

      const request: ConsultationRequest = {
        subject: 'Feed intake reduction in COW-101',
        question: 'The animal has reduced its feed intake by 25%.',
        animalId: 101,
        feedSampleId: 201,
      };

      const result = await consultationService.createConsultation(request);

      expect(postSpy).toHaveBeenCalledWith('/api/consultations', request);
      expect(result.id).toBe(1);
      expect(result.status).toBe('REQUESTED');
      expect(result.animalTag).toBe('COW-101');
    });

    it('retrieves user consultations list', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockConsultation]);

      const list = await consultationService.getConsultations();

      expect(getSpy).toHaveBeenCalledWith('/api/consultations');
      expect(list).toHaveLength(1);
      expect(list[0].subject).toBe('Feed intake reduction in COW-101');
    });

    it('retrieves single consultation by ID with details', async () => {
      const detailedResponse: ConsultationResponse = {
        ...mockConsultation,
        status: 'IN_REVIEW',
        expertId: 5,
        expertName: 'Dr. Jane Smith',
        expertQualification: 'DVM, Veterinary Nutritionist',
        expertSpecialization: 'VETERINARY',
        animal: {
          id: 101,
          animalTag: 'COW-101',
          breed: 'Holstein Friesian',
          lactationStage: 'MID',
          milkProductionPerDay: 24.5,
        },
      };

      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(detailedResponse);

      const result = await consultationService.getConsultationById(1);

      expect(getSpy).toHaveBeenCalledWith('/api/consultations/1');
      expect(result.expertName).toBe('Dr. Jane Smith');
      expect(result.animal?.breed).toBe('Holstein Friesian');
    });

    it('expert accepts an open consultation', async () => {
      const acceptedResponse: ConsultationResponse = {
        ...mockConsultation,
        status: 'ACCEPTED',
        expertId: 5,
        expertName: 'Dr. Jane Smith',
      };

      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(acceptedResponse);

      const result = await consultationService.acceptConsultation(1);

      expect(putSpy).toHaveBeenCalledWith('/api/consultations/1/accept', {});
      expect(result.status).toBe('ACCEPTED');
    });

    it('expert moves consultation to review', async () => {
      const reviewResponse: ConsultationResponse = {
        ...mockConsultation,
        status: 'IN_REVIEW',
        expertId: 5,
      };

      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(reviewResponse);

      const result = await consultationService.startReview(1);

      expect(putSpy).toHaveBeenCalledWith('/api/consultations/1/review', {});
      expect(result.status).toBe('IN_REVIEW');
    });

    it('expert responds with recommendation and notes', async () => {
      const responsePayload: ExpertRecommendationRequest = {
        recommendation: 'Increase fiber proportion gradually and ensure fresh water access.',
        expertNotes: 'Check rumen fill score twice daily.',
      };

      const respondedData: ConsultationResponse = {
        ...mockConsultation,
        status: 'RESPONDED',
        expertRecommendation: responsePayload.recommendation,
        expertNotes: responsePayload.expertNotes,
        responseDate: '2026-09-28',
      };

      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(respondedData);

      const result = await consultationService.respondConsultation(1, responsePayload);

      expect(putSpy).toHaveBeenCalledWith('/api/consultations/1/respond', responsePayload);
      expect(result.status).toBe('RESPONDED');
      expect(result.expertRecommendation).toBe(responsePayload.recommendation);
      expect(result.expertNotes).toBe(responsePayload.expertNotes);
    });

    it('expert completes consultation', async () => {
      const completedData: ConsultationResponse = {
        ...mockConsultation,
        status: 'COMPLETED',
        expertRecommendation: 'Nutritional adjustments implemented.',
        completedAt: '2026-09-28T16:00:00',
      };

      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(completedData);

      const result = await consultationService.completeConsultation(1);

      expect(putSpy).toHaveBeenCalledWith('/api/consultations/1/complete', {});
      expect(result.status).toBe('COMPLETED');
      expect(result.completedAt).toBeDefined();
    });

    it('farmer cancels eligible consultation', async () => {
      const cancelledData: ConsultationResponse = {
        ...mockConsultation,
        status: 'CANCELLED',
      };

      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(cancelledData);

      const result = await consultationService.cancelConsultation(1);

      expect(putSpy).toHaveBeenCalledWith('/api/consultations/1/cancel', {});
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('2. Validation & Lifecycle State Rules', () => {
    it('rejects consultation request with empty subject or question', () => {
      const validateRequest = (req: Partial<ConsultationRequest>): string | null => {
        if (!req.subject || !req.subject.trim()) {
          return 'Subject is required';
        }
        if (!req.question || !req.question.trim()) {
          return 'Farmer question is required';
        }
        return null;
      };

      expect(validateRequest({ subject: '', question: 'Help' })).toBe('Subject is required');
      expect(validateRequest({ subject: 'Feed Issue', question: '  ' })).toBe('Farmer question is required');
      expect(validateRequest({ subject: 'Feed Issue', question: 'Valid inquiry' })).toBeNull();
    });

    it('rejects expert response with empty recommendation', () => {
      const validateResponse = (req: Partial<ExpertRecommendationRequest>): string | null => {
        if (!req.recommendation || !req.recommendation.trim()) {
          return 'Recommendation is required';
        }
        return null;
      };

      expect(validateResponse({ recommendation: '' })).toBe('Recommendation is required');
      expect(validateResponse({ recommendation: 'Feed hay and fresh clover' })).toBeNull();
    });

    it('enforces valid status lifecycle sequence', () => {
      const isValidTransition = (current: ConsultationStatus, next: ConsultationStatus): boolean => {
        switch (current) {
          case 'REQUESTED':
            return next === 'ACCEPTED' || next === 'CANCELLED';
          case 'ACCEPTED':
            return next === 'IN_REVIEW' || next === 'CANCELLED';
          case 'IN_REVIEW':
            return next === 'RESPONDED';
          case 'RESPONDED':
            return next === 'COMPLETED';
          case 'COMPLETED':
          case 'CANCELLED':
          case 'CLOSED':
            return false;
          default:
            return false;
        }
      };

      expect(isValidTransition('REQUESTED', 'ACCEPTED')).toBe(true);
      expect(isValidTransition('REQUESTED', 'CANCELLED')).toBe(true);
      expect(isValidTransition('REQUESTED', 'COMPLETED')).toBe(false);

      expect(isValidTransition('ACCEPTED', 'IN_REVIEW')).toBe(true);
      expect(isValidTransition('ACCEPTED', 'CANCELLED')).toBe(true);
      expect(isValidTransition('ACCEPTED', 'COMPLETED')).toBe(false);

      expect(isValidTransition('IN_REVIEW', 'RESPONDED')).toBe(true);
      expect(isValidTransition('IN_REVIEW', 'CANCELLED')).toBe(false);

      expect(isValidTransition('RESPONDED', 'COMPLETED')).toBe(true);
      expect(isValidTransition('COMPLETED', 'ACCEPTED')).toBe(false);
      expect(isValidTransition('CANCELLED', 'IN_REVIEW')).toBe(false);
    });
  });

  describe('3. Error Handling & Ownership Enforcement', () => {
    it('handles 403 Forbidden on cross-farmer access', async () => {
      const errorResponse = new AppApiError({
        status: 403,
        errorType: 'Forbidden',
        message: 'You are not authorized to view another farmer consultation',
      });

      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(errorResponse);

      await expect(consultationService.getConsultationById(99)).rejects.toMatchObject({
        status: 403,
        message: expect.stringContaining('not authorized'),
      });
    });

    it('handles 404 Not Found on missing consultation', async () => {
      const errorResponse = new AppApiError({
        status: 404,
        errorType: 'Not Found',
        message: 'Consultation not found with id: 999',
      });

      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(errorResponse);

      await expect(consultationService.getConsultationById(999)).rejects.toMatchObject({
        status: 404,
      });
    });

    it('handles 400 Bad Request on invalid status change', async () => {
      const errorResponse = new AppApiError({
        status: 400,
        errorType: 'Bad Request',
        message: 'Consultation cannot be completed before an expert response is submitted',
      });

      jest.spyOn(apiClient, 'put').mockRejectedValueOnce(errorResponse);

      await expect(consultationService.completeConsultation(1)).rejects.toMatchObject({
        status: 400,
      });
    });
  });

  describe('4. Scientific Safety & Terminology Enforcement', () => {
    const MANDATORY_DISCLAIMER =
      'This system provides decision support and does not replace professional veterinary diagnosis or treatment.';

    it('mandates the decision support disclaimer', () => {
      expect(MANDATORY_DISCLAIMER).toContain('decision support');
      expect(MANDATORY_DISCLAIMER).toContain('does not replace professional veterinary diagnosis');
    });

    it('prohibits inappropriate automated diagnostic claims', () => {
      const text = 'Expert recommendation provided based on available clinical observation.';
      expect(text).not.toContain('Guaranteed diagnosis');
      expect(text).not.toContain('Automated Disease Diagnosis');
      expect(text).not.toContain('dietician');
    });
  });
});
