import { AppStackParamList } from '../navigation/types';
import { sampleImageService } from '../services/sampleImageService';
import { apiClient } from '../services/apiClient';

jest.mock('../services/apiClient');

describe('M6.6 Navigation & Image Presentation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getBaseUrl as jest.Mock).mockReturnValue('http://localhost:8080');
  });

  it('CameraCapture route accepts FEED and SILAGE sample types', () => {
    const feedParams: AppStackParamList['CameraCapture'] = {
      sampleType: 'FEED',
      sampleId: 10,
      sampleCode: 'FEED-001',
    };
    expect(feedParams.sampleType).toBe('FEED');
    expect(feedParams.sampleId).toBe(10);
    expect(feedParams.sampleCode).toBe('FEED-001');

    const silageParams: AppStackParamList['CameraCapture'] = {
      sampleType: 'SILAGE',
      sampleId: 20,
      sampleCode: 'SIL-001',
    };
    expect(silageParams.sampleType).toBe('SILAGE');
    expect(silageParams.sampleId).toBe(20);
  });

  it('generates secure file streaming URLs with proper sample type routing', () => {
    const feedUrl = sampleImageService.getImageFileUrl('FEED', 42, 101);
    expect(feedUrl).toBe('http://localhost:8080/api/feed-samples/42/images/101/file');

    const silageUrl = sampleImageService.getImageFileUrl('SILAGE', 84, 202);
    expect(silageUrl).toBe('http://localhost:8080/api/silage-samples/84/images/202/file');
  });

  it('handles 403 Forbidden cross-user image upload rejection gracefully', async () => {
    (apiClient.postForm as jest.Mock).mockRejectedValueOnce({
      status: 403,
      message: 'Access denied: You do not own this feed sample',
    });

    await expect(
      sampleImageService.uploadFeedImage(99, 'file:///img.jpg')
    ).rejects.toEqual(
      expect.objectContaining({
        status: 403,
        message: expect.stringContaining('Access denied'),
      })
    );
  });

  it('handles 404 Not Found for nonexistent sample image retrieval', async () => {
    (apiClient.get as jest.Mock).mockRejectedValueOnce({
      status: 404,
      message: 'Feed sample not found with id: 999',
    });

    await expect(sampleImageService.getFeedImages(999)).rejects.toEqual(
      expect.objectContaining({
        status: 404,
      })
    );
  });

  it('handles 401 Unauthorized for unauthenticated image requests', async () => {
    (apiClient.delete as jest.Mock).mockRejectedValueOnce({
      status: 401,
      message: 'Unauthorized',
    });

    await expect(sampleImageService.deleteFeedImage(10, 1)).rejects.toEqual(
      expect.objectContaining({
        status: 401,
      })
    );
  });
});
