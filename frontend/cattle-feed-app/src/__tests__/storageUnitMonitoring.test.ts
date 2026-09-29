import { apiClient } from '../services/apiClient';
import { storageUnitService } from '../services/storageUnitService';
import { StorageUnit, CreateStorageUnitRequest, StorageMonitoringSummary } from '../models/storageUnit';
import { SensorReading, CreateSensorReadingRequest } from '../models/sensorReading';

describe('Storage Unit Monitoring & Telemetry (Post-M13 Module)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockStorageUnit: StorageUnit = {
    id: 10,
    farmId: 1,
    farmName: 'Green Valley Farm',
    name: 'Maize Silage Bunker 01',
    storageType: 'SILAGE_STORAGE',
    location: 'North Sector 2',
    capacity: '50 MT',
    deviceId: 'ESP32-STORAGE-001',
    latestTemperature: 28.4,
    latestPh: 4.2,
    latestHumidity: 65.0,
    lastReadingTime: '2026-09-29T20:30:00Z',
    monitoringStatus: 'MONITORING',
    unreadAlertCount: 0,
    createdAt: '2026-09-29T10:00:00Z',
    updatedAt: '2026-09-29T20:30:00Z',
  };

  const mockReading: SensorReading = {
    id: 101,
    storageUnitId: 10,
    deviceId: 'ESP32-STORAGE-001',
    readingTime: '2026-09-29T20:30:00Z',
    temperature: 28.4,
    ph: 4.2,
    humidity: 65.0,
    source: 'IOT',
    createdAt: '2026-09-29T20:30:00Z',
  };

  const mockSummary: StorageMonitoringSummary = {
    totalStorageUnits: 3,
    monitoringUnits: 2,
    normalUnits: 0,
    attentionRequiredUnits: 1,
    offlineUnits: 0,
    unreadAlertCount: 1,
  };

  // 1. Create Storage Unit
  it('1. should create storage unit via POST /api/storage-units', async () => {
    const payload: CreateStorageUnitRequest = {
      farmId: 1,
      name: 'Maize Silage Bunker 01',
      storageType: 'SILAGE_STORAGE',
      location: 'North Sector 2',
      capacity: '50 MT',
      deviceId: 'ESP32-STORAGE-001',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockStorageUnit);

    const result = await storageUnitService.createStorageUnit(payload);

    expect(postSpy).toHaveBeenCalledWith('/api/storage-units', payload);
    expect(result.id).toBe(10);
    expect(result.name).toBe('Maize Silage Bunker 01');
    expect(result.storageType).toBe('SILAGE_STORAGE');
  });

  // 2. Storage List
  it('2. should retrieve storage units via GET /api/storage-units', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockStorageUnit]);

    const result = await storageUnitService.getAllStorageUnits();

    expect(getSpy).toHaveBeenCalledWith('/api/storage-units');
    expect(result).toHaveLength(1);
    expect(result[0].deviceId).toBe('ESP32-STORAGE-001');
  });

  it('3. should filter storage units by farmId via GET /api/storage-units?farmId=1', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockStorageUnit]);

    const result = await storageUnitService.getAllStorageUnits(1);

    expect(getSpy).toHaveBeenCalledWith('/api/storage-units?farmId=1');
    expect(result[0].farmId).toBe(1);
  });

  // 3. Storage Details
  it('4. should retrieve storage unit details via GET /api/storage-units/:id', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockStorageUnit);

    const result = await storageUnitService.getStorageUnitById(10);

    expect(getSpy).toHaveBeenCalledWith('/api/storage-units/10');
    expect(result.id).toBe(10);
    expect(result.monitoringStatus).toBe('MONITORING');
  });

  // 4. Ingest Sensor Reading
  it('5. should ingest hardware sensor reading via POST /api/storage-units/:id/sensor-readings', async () => {
    const payload: CreateSensorReadingRequest = {
      deviceId: 'ESP32-STORAGE-001',
      temperature: 28.4,
      ph: 4.2,
      humidity: 65.0,
      source: 'IOT',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockReading);

    const result = await storageUnitService.recordSensorReading(10, payload);

    expect(postSpy).toHaveBeenCalledWith('/api/storage-units/10/sensor-readings', payload);
    expect(result.id).toBe(101);
    expect(result.temperature).toBe(28.4);
    expect(result.ph).toBe(4.2);
  });

  // 5. Sensor History
  it('6. should retrieve chronological sensor history via GET /api/storage-units/:id/sensor-readings', async () => {
    const readings: SensorReading[] = [
      mockReading,
      {
        ...mockReading,
        id: 100,
        readingTime: '2026-09-29T18:00:00Z',
        temperature: 26.5,
        ph: 4.1,
      },
    ];

    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(readings);

    const result = await storageUnitService.getSensorReadings(10);

    expect(getSpy).toHaveBeenCalledWith('/api/storage-units/10/sensor-readings');
    expect(result).toHaveLength(2);
    expect(result[0].temperature).toBe(28.4);
    expect(result[1].temperature).toBe(26.5);
  });

  // 6. Latest Sensor Reading
  it('7. should retrieve latest sensor reading via GET /api/storage-units/:id/sensor-readings/latest', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockReading);

    const result = await storageUnitService.getLatestSensorReading(10);

    expect(getSpy).toHaveBeenCalledWith('/api/storage-units/10/sensor-readings/latest');
    expect(result.temperature).toBe(28.4);
    expect(result.ph).toBe(4.2);
  });

  // 7. Monitoring Summary
  it('8. should retrieve monitoring summary via GET /api/storage-units/summary', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockSummary);

    const result = await storageUnitService.getStorageMonitoringSummary();

    expect(getSpy).toHaveBeenCalledWith('/api/storage-units/summary');
    expect(result.totalStorageUnits).toBe(3);
    expect(result.attentionRequiredUnits).toBe(1);
    expect(result.unreadAlertCount).toBe(1);
  });

  // 8. Delete Storage Unit
  it('9. should delete storage unit via DELETE /api/storage-units/:id', async () => {
    const deleteSpy = jest.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined);

    await storageUnitService.deleteStorageUnit(10);

    expect(deleteSpy).toHaveBeenCalledWith('/api/storage-units/10');
  });

  // 9. Null Handling (Preserves null, doesn't convert to 0)
  it('10. should allow missing measurements to remain null rather than converting to zero', async () => {
    const nullReading: SensorReading = {
      id: 102,
      storageUnitId: 10,
      readingTime: '2026-09-29T21:00:00Z',
      temperature: null,
      ph: null,
      humidity: null,
      source: 'MANUAL',
    };

    jest.spyOn(apiClient, 'get').mockResolvedValueOnce(nullReading);

    const result = await storageUnitService.getLatestSensorReading(10);

    expect(result.temperature).toBeNull();
    expect(result.ph).toBeNull();
    expect(result.humidity).toBeNull();
  });
});
