import { apiClient } from '../services/apiClient';
import { userService } from '../services/userService';
import { storageUnitService } from '../services/storageUnitService';
import { StorageUnit } from '../models/storageUnit';
import { UserProfile } from '../models/user';

jest.mock('../services/apiClient');

describe('Part 4: Farmer Profile Subsystem', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch real authenticated user profile via GET /api/users/me', async () => {
    const mockProfile: UserProfile = {
      id: 15,
      username: 'farmer_ramesh',
      email: 'ramesh@dairyfarm.in',
      phone: '+91-9876543210',
      role: 'FARMER',
      language: 'hi',
      createdAt: '2026-01-15T10:00:00Z',
    };

    mockApiClient.get.mockResolvedValueOnce(mockProfile);

    const profile = await userService.getProfile();

    expect(mockApiClient.get).toHaveBeenCalledWith('/api/users/me');
    expect(profile.id).toBe(15);
    expect(profile.username).toBe('farmer_ramesh');
    expect(profile.email).toBe('ramesh@dairyfarm.in');
    expect(profile.role).toBe('FARMER');
    expect(profile.phone).toBe('+91-9876543210');
    expect(profile.language).toBe('hi');
  });

  it('should only permit updating non-security fields (username, phone, language) via PUT /api/users/me', async () => {
    const updatedProfile: UserProfile = {
      id: 15,
      username: 'ramesh_kumar',
      email: 'ramesh@dairyfarm.in',
      phone: '+91-9988776655',
      role: 'FARMER',
      language: 'en',
    };

    mockApiClient.put.mockResolvedValueOnce(updatedProfile);

    const result = await userService.updateProfile({
      username: 'ramesh_kumar',
      phone: '+91-9988776655',
      language: 'en',
    });

    expect(mockApiClient.put).toHaveBeenCalledWith('/api/users/me', {
      username: 'ramesh_kumar',
      phone: '+91-9988776655',
      language: 'en',
    });
    expect(result.username).toBe('ramesh_kumar');
    expect(result.phone).toBe('+91-9988776655');
  });

  it('should handle backend error responses (401, 403, 409 duplicate)', async () => {
    mockApiClient.put.mockRejectedValueOnce({
      status: 409,
      message: "Username 'taken_user' is already taken",
    });

    await expect(
      userService.updateProfile({ username: 'taken_user' })
    ).rejects.toMatchObject({
      status: 409,
    });
  });
});

describe('Part 5, 6, 7 & 8: Storage Monitoring Judge Demo & SMS Architecture', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should setup or retrieve evaluator Demo Storage Godown via POST /api/storage-units/demo', async () => {
    const mockDemoUnit: StorageUnit = {
      id: 99,
      farmId: 1,
      name: 'Demo Storage Godown',
      storageType: 'SILAGE_STORAGE',
      deviceId: 'ESP32-DEMO-001',
      location: 'Central Evaluation Bunker',
      capacity: '50 Tons',
      monitoringStatus: 'NORMAL',
      latestTemperature: 24.5,
      latestPh: 4.2,
      latestHumidity: 65.0,
      lastReadingTime: '2026-09-29T10:00:00Z',
      unreadAlertCount: 0,
      createdAt: '2026-09-29T09:00:00Z',
    };

    mockApiClient.post.mockResolvedValueOnce(mockDemoUnit);

    const unit = await storageUnitService.createOrGetDemoStorageUnit();

    expect(mockApiClient.post).toHaveBeenCalledWith('/api/storage-units/demo', {});
    expect(unit.name).toBe('Demo Storage Godown');
    expect(unit.deviceId).toBe('ESP32-DEMO-001');
    expect(unit.storageType).toBe('SILAGE_STORAGE');
  });

  it('should ingest demo telemetry through the identical backend API pipeline', async () => {
    const payload = {
      temperature: 35.8,
      ph: 4.5,
      humidity: 70.0,
      readingTime: '2026-09-29T12:00:00Z',
    };

    mockApiClient.post.mockResolvedValueOnce({
      id: 1001,
      storageUnitId: 99,
      ...payload,
      source: 'DEMO',
    });

    await storageUnitService.recordSensorReading(99, payload);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/storage-units/99/sensor-readings',
      payload
    );
  });

  it('should retrieve simulated SMS audit log records for judges via GET /api/storage-units/demo/sms-logs', async () => {
    const mockLogs = [
      {
        id: 'sms-001',
        recipientPhone: '+91-9876543210',
        senderId: 'CTLFED',
        message: 'CattleFeedAI Storage Alert: A storage condition change has been detected in Demo Storage Godown. Potential spoilage/fungal-growth risk condition detected. Please inspect temperature, humidity and storage conditions.',
        provider: 'mock',
        status: 'MOCK_DELIVERED',
        dltTemplateId: '1107161234567890123',
      },
    ];

    mockApiClient.get.mockResolvedValueOnce(mockLogs);

    const logs = await storageUnitService.getDemoSmsLogs();

    expect(mockApiClient.get).toHaveBeenCalledWith('/api/storage-units/demo/sms-logs');
    expect(logs.length).toBe(1);
    expect(logs[0].senderId).toBe('CTLFED');
    expect(logs[0].dltTemplateId).toBe('1107161234567890123');
    // Verify non-diagnostic review wording (PART 8)
    expect(logs[0].message).toContain('Potential spoilage/fungal-growth risk condition detected');
    expect(logs[0].message).not.toContain('Fungal attack confirmed');
  });
});
