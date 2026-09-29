import { Platform } from 'react-native';
import { SampleImageResponse } from '../models/sampleImage';
import { apiClient } from './apiClient';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Helper to convert base64 Data URL to Blob for web upload
 */
function dataUriToBlob(dataUri: string): Blob {
  const parts = dataUri.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/jpeg';
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

export const sampleImageService = {
  /**
   * Validate image before attempting upload
   */
  validateImage(
    uri: string,
    fileSize?: number,
    mimeType?: string
  ): { isValid: boolean; error?: string } {
    if (!uri || uri.trim() === '') {
      return { isValid: false, error: 'Please select or capture a valid image.' };
    }

    if (fileSize !== undefined && fileSize > MAX_IMAGE_SIZE_BYTES) {
      return { isValid: false, error: 'Image file size exceeds maximum limit of 10MB.' };
    }

    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      return {
        isValid: false,
        error: 'Unsupported image format. Allowed formats: JPEG, PNG, WebP.',
      };
    }

    return { isValid: true };
  },

  /**
   * Upload image for a feed sample
   */
  async uploadFeedImage(
    feedSampleId: number,
    imageUri: string,
    caption?: string,
    filename?: string,
    mimeType?: string
  ): Promise<SampleImageResponse> {
    const validation = this.validateImage(imageUri, undefined, mimeType);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    const finalFilename = filename || `feed_${feedSampleId}_${Date.now()}.jpg`;
    const finalType = mimeType || 'image/jpeg';

    if (Platform.OS === 'web' && imageUri.startsWith('data:')) {
      const blob = dataUriToBlob(imageUri);
      formData.append('file', blob, finalFilename);
    } else {
      formData.append('file', {
        uri: imageUri,
        name: finalFilename,
        type: finalType,
      } as unknown as Blob);
    }

    if (caption && caption.trim().length > 0) {
      formData.append('caption', caption.trim());
    }

    return apiClient.postForm<SampleImageResponse>(
      `/api/feed-samples/${feedSampleId}/images`,
      formData
    );
  },

  /**
   * Get all images associated with a feed sample
   */
  async getFeedImages(feedSampleId: number): Promise<SampleImageResponse[]> {
    return apiClient.get<SampleImageResponse[]>(
      `/api/feed-samples/${feedSampleId}/images`
    );
  },

  /**
   * Delete an image from a feed sample
   */
  async deleteFeedImage(feedSampleId: number, imageId: number): Promise<void> {
    return apiClient.delete<void>(
      `/api/feed-samples/${feedSampleId}/images/${imageId}`
    );
  },

  /**
   * Upload image for a silage sample
   */
  async uploadSilageImage(
    silageSampleId: number,
    imageUri: string,
    caption?: string,
    filename?: string,
    mimeType?: string
  ): Promise<SampleImageResponse> {
    const validation = this.validateImage(imageUri, undefined, mimeType);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    const finalFilename = filename || `silage_${silageSampleId}_${Date.now()}.jpg`;
    const finalType = mimeType || 'image/jpeg';

    if (Platform.OS === 'web' && imageUri.startsWith('data:')) {
      const blob = dataUriToBlob(imageUri);
      formData.append('file', blob, finalFilename);
    } else {
      formData.append('file', {
        uri: imageUri,
        name: finalFilename,
        type: finalType,
      } as unknown as Blob);
    }

    if (caption && caption.trim().length > 0) {
      formData.append('caption', caption.trim());
    }

    return apiClient.postForm<SampleImageResponse>(
      `/api/silage-samples/${silageSampleId}/images`,
      formData
    );
  },

  /**
   * Get all images associated with a silage sample
   */
  async getSilageImages(silageSampleId: number): Promise<SampleImageResponse[]> {
    return apiClient.get<SampleImageResponse[]>(
      `/api/silage-samples/${silageSampleId}/images`
    );
  },

  /**
   * Delete an image from a silage sample
   */
  async deleteSilageImage(silageSampleId: number, imageId: number): Promise<void> {
    return apiClient.delete<void>(
      `/api/silage-samples/${silageSampleId}/images/${imageId}`
    );
  },

  /**
   * Generate full absolute URL to stream/view image
   */
  getImageFileUrl(sampleType: 'FEED' | 'SILAGE', sampleId: number, imageId: number): string {
    const base = apiClient.getBaseUrl();
    const prefix = sampleType === 'FEED' ? 'feed-samples' : 'silage-samples';
    return `${base}/api/${prefix}/${sampleId}/images/${imageId}/file`;
  },
};
