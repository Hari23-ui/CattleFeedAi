import { apiClient } from './apiClient';
import {
  CreateStorageUnitRequest,
  StorageMonitoringSummary,
  StorageUnit,
  UpdateStorageUnitRequest,
} from '../models/storageUnit';
import { CreateSensorReadingRequest, SensorReading } from '../models/sensorReading';

/**
 * Storage Unit Service
 * Handles Storage Unit CRUD, Hardware Telemetry Ingestion, and Condition Monitoring:
 * - POST   /api/storage-units
 * - GET    /api/storage-units(?farmId=X)
 * - GET    /api/storage-units/summary
 * - GET    /api/storage-units/:id
 * - PUT    /api/storage-units/:id
 * - DELETE /api/storage-units/:id
 * - POST   /api/storage-units/:storageUnitId/sensor-readings
 * - GET    /api/storage-units/:storageUnitId/sensor-readings
 * - GET    /api/storage-units/:storageUnitId/sensor-readings/latest
 */
export const storageUnitService = {
  /**
   * Create a new storage unit under an owned farm.
   */
  async createStorageUnit(request: CreateStorageUnitRequest): Promise<StorageUnit> {
    return apiClient.post<StorageUnit>('/api/storage-units', request);
  },

  /**
   * Retrieve all storage units belonging to the authenticated farmer,
   * optionally filtered by farmId.
   */
  async getAllStorageUnits(farmId?: number): Promise<StorageUnit[]> {
    const queryString = farmId !== undefined && farmId !== null ? `?farmId=${encodeURIComponent(farmId)}` : '';
    return apiClient.get<StorageUnit[]>(`/api/storage-units${queryString}`);
  },

  /**
   * Retrieve aggregated dashboard monitoring metrics.
   */
  async getStorageMonitoringSummary(): Promise<StorageMonitoringSummary> {
    return apiClient.get<StorageMonitoringSummary>('/api/storage-units/summary');
  },

  /**
   * Retrieve a single storage unit with latest readings and monitoring status.
   */
  async getStorageUnitById(id: number): Promise<StorageUnit> {
    return apiClient.get<StorageUnit>(`/api/storage-units/${id}`);
  },

  /**
   * Update storage unit metadata.
   */
  async updateStorageUnit(id: number, request: UpdateStorageUnitRequest): Promise<StorageUnit> {
    return apiClient.put<StorageUnit>(`/api/storage-units/${id}`, request);
  },

  /**
   * Delete a storage unit and its sensor readings.
   */
  async deleteStorageUnit(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/storage-units/${id}`);
  },

  /**
   * Ingest a new sensor reading from hardware or manual entry.
   */
  async recordSensorReading(storageUnitId: number, request: CreateSensorReadingRequest): Promise<SensorReading> {
    return apiClient.post<SensorReading>(`/api/storage-units/${storageUnitId}/sensor-readings`, request);
  },

  /**
   * Retrieve historical sensor readings (chronological descending).
   */
  async getSensorReadings(storageUnitId: number): Promise<SensorReading[]> {
    return apiClient.get<SensorReading[]>(`/api/storage-units/${storageUnitId}/sensor-readings`);
  },

  /**
   * Retrieve latest recorded telemetry for a storage unit.
   */
  async getLatestSensorReading(storageUnitId: number): Promise<SensorReading> {
    return apiClient.get<SensorReading>(`/api/storage-units/${storageUnitId}/sensor-readings/latest`);
  },
};
