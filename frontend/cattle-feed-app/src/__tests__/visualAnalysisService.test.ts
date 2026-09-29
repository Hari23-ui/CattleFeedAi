import { visualAnalysisService } from '../services/visualAnalysisService';
import { apiClient } from '../services/apiClient';
import { VisualAnalysisResponse } from '../models/visualAnalysis';

jest.mock('../services/apiClient');

describe('visualAnalysisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockResponse: VisualAnalysisResponse = {
    analysis_available: true,
    analysis_source: 'IMAGE_VISUAL_SCREENING',
    image_metadata: {
      filename: 'sample.jpg',
      content_type: 'image/jpeg',
      size_bytes: 45000,
      width: 800,
      height: 600,
      format: 'JPEG',
      was_resized: false,
    },
    image_quality: {
      status: 'SUFFICIENT',
      issues: [],
      metrics: {
        width: 800,
        height: 600,
        mean_luminance: 120.5,
        contrast_std: 40.2,
      },
    },
    visual_indicators: [
      {
        type: 'MOULD_LIKE_APPEARANCE',
        label: 'Possible mould-like growth',
        confidence: 0.76,
        severity: 'MEDIUM',
        evidence: 'Localized pale discolouration detected.',
      },
    ],
    overall_screening: {
      status: 'POSSIBLE_CONCERN',
      summary: 'Visual screening detected potential surface indicators.',
    },
    disclaimer:
      'VISUAL SCREENING ONLY: Computer vision analysis identifies surface physical characteristics, mould discoloration, and visible foreign material. It does NOT measure chemical attributes like protein, moisture %, fiber, or aflatoxin, nor does it provide veterinary disease diagnosis.',
  };

  test('analyzeFeedSampleImage calls correct endpoint with sampleId and imageId', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await visualAnalysisService.analyzeFeedSampleImage(101, 501);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/feed-samples/101/images/501/analyze',
      {}
    );
    expect(result.analysis_available).toBe(true);
    expect(result.image_quality.status).toBe('SUFFICIENT');
    expect(result.visual_indicators.length).toBe(1);
    expect(result.visual_indicators[0].type).toBe('MOULD_LIKE_APPEARANCE');
    expect(result.overall_screening.status).toBe('POSSIBLE_CONCERN');
  });

  test('analyzeSilageSampleImage calls correct endpoint with sampleId and imageId', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await visualAnalysisService.analyzeSilageSampleImage(202, 602);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/silage-samples/202/images/602/analyze',
      {}
    );
    expect(result.analysis_available).toBe(true);
  });

  test('analyzeImageFile creates FormData and calls postForm', async () => {
    (apiClient.postForm as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await visualAnalysisService.analyzeImageFile(
      'file:///path/to/test.jpg',
      'test.jpg',
      'image/jpeg'
    );

    expect(apiClient.postForm).toHaveBeenCalledWith(
      '/api/ai/analyze-image',
      expect.any(FormData)
    );
    expect(result.overall_screening.status).toBe('POSSIBLE_CONCERN');
  });

  test('M7.3: parses ML visual screening response with model version', async () => {
    const mlResponse: VisualAnalysisResponse = {
      ...mockResponse,
      analysis_source: 'ML_VISUAL_SCREENING',
      model_available: true,
      model_version: 'visual-classifier-1.0',
    };
    (apiClient.post as jest.Mock).mockResolvedValueOnce(mlResponse);

    const result = await visualAnalysisService.analyzeFeedSampleImage(101, 501);
    expect(result.analysis_source).toBe('ML_VISUAL_SCREENING');
    expect(result.model_available).toBe(true);
    expect(result.model_version).toBe('visual-classifier-1.0');
  });

  test('Scientific boundary: response strictly prohibits chemical prediction functions', () => {
    expect((visualAnalysisService as any).predictCrudeProtein).toBeUndefined();
    expect((visualAnalysisService as any).predictAflatoxin).toBeUndefined();
    expect((visualAnalysisService as any).predictMoisture).toBeUndefined();
    expect((visualAnalysisService as any).diagnoseDisease).toBeUndefined();
  });
});
