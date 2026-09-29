import { sampleImageService } from '../services/sampleImageService';

describe('CameraCapture Workflow & Boundaries', () => {
  it('validates captured image before upload', () => {
    const emptyCheck = sampleImageService.validateImage('');
    expect(emptyCheck.isValid).toBe(false);

    const validCheck = sampleImageService.validateImage('file:///sample.jpg', 2048, 'image/jpeg');
    expect(validCheck.isValid).toBe(true);
  });

  it('rejects image files exceeding 10MB limit', () => {
    const oversizedCheck = sampleImageService.validateImage('file:///sample.jpg', 12 * 1024 * 1024, 'image/jpeg');
    expect(oversizedCheck.isValid).toBe(false);
    expect(oversizedCheck.error).toContain('10MB');
  });

  it('rejects unsupported file formats', () => {
    const invalidFormat = sampleImageService.validateImage('file:///sample.pdf', 1024, 'application/pdf');
    expect(invalidFormat.isValid).toBe(false);
    expect(invalidFormat.error).toContain('Unsupported image format');
  });

  it('supports allowed formats: JPEG, PNG, WebP', () => {
    expect(sampleImageService.validateImage('file:///sample.jpg', 1024, 'image/jpeg').isValid).toBe(true);
    expect(sampleImageService.validateImage('file:///sample.png', 1024, 'image/png').isValid).toBe(true);
    expect(sampleImageService.validateImage('file:///sample.webp', 1024, 'image/webp').isValid).toBe(true);
  });

  it('maintains strict non-AI boundary in M6.6 (no computer vision or chemical parameter prediction)', () => {
    // Confirm no scientific evaluation functions exist in sampleImageService
    expect((sampleImageService as any).predictCrudeProtein).toBeUndefined();
    expect((sampleImageService as any).predictAflatoxin).toBeUndefined();
    expect((sampleImageService as any).predictMoisture).toBeUndefined();
    expect((sampleImageService as any).diagnoseDisease).toBeUndefined();
  });
});
