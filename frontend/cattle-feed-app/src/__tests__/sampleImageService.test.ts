import { sampleImageService } from '../services/sampleImageService';
import { apiClient } from '../services/apiClient';
import { SampleImageResponse } from '../models/sampleImage';

jest.mock('../services/apiClient');

describe('sampleImageService', () => {
  const mockFeedImage: SampleImageResponse = {
    id: 1,
    sampleType: 'FEED',
    sampleId: 10,
    originalFilename: 'corn_pellet.jpg',
    storedFilename: 'uuid-1.jpg',
    fileReference: '/api/feed-samples/10/images/1/file',
    contentType: 'image/jpeg',
    fileSize: 102400,
    caption: 'Fresh inspection',
    createdAt: '2026-09-27T10:00:00',
  };

  const mockSilageImage: SampleImageResponse = {
    id: 2,
    sampleType: 'SILAGE',
    sampleId: 20,
    originalFilename: 'maize_silage.png',
    storedFilename: 'uuid-2.png',
    fileReference: '/api/silage-samples/20/images/2/file',
    contentType: 'image/png',
    fileSize: 204800,
    caption: 'Trench #1 pit photo',
    createdAt: '2026-09-27T11:00:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getBaseUrl as jest.Mock).mockReturnValue('http://localhost:8080');
  });

  describe('validateImage', () => {
    it('returns error for empty uri', () => {
      const res = sampleImageService.validateImage('');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Please select or capture a valid image.');
    });

    it('returns error for image exceeding 10MB', () => {
      const res = sampleImageService.validateImage('file:///test.jpg', 11 * 1024 * 1024);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('exceeds maximum limit of 10MB');
    });

    it('returns error for unsupported mime type', () => {
      const res = sampleImageService.validateImage('file:///test.gif', 1024, 'image/gif');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Unsupported image format');
    });

    it('accepts valid JPEG, PNG, and WebP images within size limit', () => {
      expect(sampleImageService.validateImage('file:///photo.jpg', 500000, 'image/jpeg').isValid).toBe(true);
      expect(sampleImageService.validateImage('file:///photo.png', 500000, 'image/png').isValid).toBe(true);
      expect(sampleImageService.validateImage('file:///photo.webp', 500000, 'image/webp').isValid).toBe(true);
    });
  });

  describe('uploadFeedImage', () => {
    it('sends multipart POST to /api/feed-samples/:id/images and returns image metadata', async () => {
      (apiClient.postForm as jest.Mock).mockResolvedValueOnce(mockFeedImage);

      const result = await sampleImageService.uploadFeedImage(
        10,
        'file:///path/to/feed.jpg',
        'Inspection notes',
        'feed.jpg',
        'image/jpeg'
      );

      expect(apiClient.postForm).toHaveBeenCalledTimes(1);
      expect(apiClient.postForm).toHaveBeenCalledWith(
        '/api/feed-samples/10/images',
        expect.any(FormData)
      );
      expect(result).toEqual(mockFeedImage);
    });

    it('throws validation error if image format is unsupported', async () => {
      await expect(
        sampleImageService.uploadFeedImage(10, 'file:///bad.bmp', undefined, 'bad.bmp', 'image/bmp')
      ).rejects.toThrow('Unsupported image format');
      expect(apiClient.postForm).not.toHaveBeenCalled();
    });
  });

  describe('getFeedImages', () => {
    it('calls GET /api/feed-samples/:id/images', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce([mockFeedImage]);

      const result = await sampleImageService.getFeedImages(10);
      expect(apiClient.get).toHaveBeenCalledWith('/api/feed-samples/10/images');
      expect(result).toEqual([mockFeedImage]);
    });
  });

  describe('deleteFeedImage', () => {
    it('calls DELETE /api/feed-samples/:id/images/:imageId', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({});

      await sampleImageService.deleteFeedImage(10, 1);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/feed-samples/10/images/1');
    });
  });

  describe('uploadSilageImage', () => {
    it('sends multipart POST to /api/silage-samples/:id/images and returns image metadata', async () => {
      (apiClient.postForm as jest.Mock).mockResolvedValueOnce(mockSilageImage);

      const result = await sampleImageService.uploadSilageImage(
        20,
        'file:///path/to/silage.png',
        'Pit photo',
        'silage.png',
        'image/png'
      );

      expect(apiClient.postForm).toHaveBeenCalledWith(
        '/api/silage-samples/20/images',
        expect.any(FormData)
      );
      expect(result).toEqual(mockSilageImage);
    });
  });

  describe('getSilageImages', () => {
    it('calls GET /api/silage-samples/:id/images', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce([mockSilageImage]);

      const result = await sampleImageService.getSilageImages(20);
      expect(apiClient.get).toHaveBeenCalledWith('/api/silage-samples/20/images');
      expect(result).toEqual([mockSilageImage]);
    });
  });

  describe('deleteSilageImage', () => {
    it('calls DELETE /api/silage-samples/:id/images/:imageId', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({});

      await sampleImageService.deleteSilageImage(20, 2);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/silage-samples/20/images/2');
    });
  });

  describe('getImageFileUrl', () => {
    it('generates correct file streaming url for feed sample', () => {
      const url = sampleImageService.getImageFileUrl('FEED', 10, 1);
      expect(url).toBe('http://localhost:8080/api/feed-samples/10/images/1/file');
    });

    it('generates correct file streaming url for silage sample', () => {
      const url = sampleImageService.getImageFileUrl('SILAGE', 20, 2);
      expect(url).toBe('http://localhost:8080/api/silage-samples/20/images/2/file');
    });
  });
});
