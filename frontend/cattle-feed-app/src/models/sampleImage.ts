/**
 * Sample Image Attachment Models
 * Represents images captured via mobile camera or PC webcam, or selected from gallery.
 */

export interface SampleImageResponse {
  id: number;
  sampleType: 'FEED' | 'SILAGE';
  sampleId: number;
  originalFilename: string;
  storedFilename: string;
  fileReference: string;
  contentType: string;
  fileSize: number;
  caption?: string | null;
  createdAt: string;
}

export interface ImageUploadPayload {
  uri: string;
  name?: string;
  type?: string;
  caption?: string;
}
