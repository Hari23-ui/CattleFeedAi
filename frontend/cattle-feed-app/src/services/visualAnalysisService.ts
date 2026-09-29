import { apiClient } from './apiClient';
import { VisualAnalysisResponse } from '../models/visualAnalysis';

/**
 * Service for triggering and retrieving AI-based visual screening analysis.
 *
 * CRITICAL SCIENTIFIC BOUNDARY:
 * Visual screening identifies physical surface characteristics, mould discoloration,
 * and visible foreign material. It does NOT measure chemical parameters (protein, moisture %,
 * aflatoxin, etc.) nor does it diagnose animal diseases.
 */
export const visualAnalysisService = {
  /**
   * Analyze an already-uploaded feed sample image attachment.
   */
  async analyzeFeedSampleImage(
    feedSampleId: number,
    imageId: number
  ): Promise<VisualAnalysisResponse> {
    return apiClient.post<VisualAnalysisResponse>(
      `/api/feed-samples/${feedSampleId}/images/${imageId}/analyze`,
      {}
    );
  },

  /**
   * Analyze an already-uploaded silage sample image attachment.
   */
  async analyzeSilageSampleImage(
    silageSampleId: number,
    imageId: number
  ): Promise<VisualAnalysisResponse> {
    return apiClient.post<VisualAnalysisResponse>(
      `/api/silage-samples/${silageSampleId}/images/${imageId}/analyze`,
      {}
    );
  },

  /**
   * Directly upload and analyze an image file without sample association.
   */
  async analyzeImageFile(
    fileUri: string,
    filename: string,
    mimeType: string
  ): Promise<VisualAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: filename || 'inspection.jpg',
      type: mimeType || 'image/jpeg',
    } as any);

    return apiClient.postForm<VisualAnalysisResponse>('/api/ai/analyze-image', formData);
  },
};
