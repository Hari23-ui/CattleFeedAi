import { Farm, CreateFarmRequest, UpdateFarmRequest } from '../models/farm';
import { apiClient } from '../services/apiClient';
import { farmService } from '../services/farmService';
import { AppApiError } from '../models/api';

describe('Farm Service', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockFarm: Farm = {
    id: 1,
    farmName: 'Green Pastures Dairy',
    location: 'Village Rampur',
    district: 'Anand',
    state: 'Gujarat',
    pincode: '388001',
  };

  it('should create a farm successfully via POST /api/farms', async () => {
    const payload: CreateFarmRequest = {
      farmName: 'Green Pastures Dairy',
      location: 'Village Rampur',
      district: 'Anand',
      state: 'Gujarat',
      pincode: '388001',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockFarm);

    const result = await farmService.createFarm(payload);

    expect(postSpy).toHaveBeenCalledWith('/api/farms', payload);
    expect(result).toEqual(mockFarm);
    expect(result.id).toBe(1);
    expect(result.farmName).toBe('Green Pastures Dairy');
  });

  it('should retrieve all farmer farms via GET /api/farms', async () => {
    const mockFarms: Farm[] = [
      mockFarm,
      {
        id: 2,
        farmName: 'Sunrise Cattle Farm',
        location: 'Plot 4, Highway Road',
        district: 'Mehsana',
        state: 'Gujarat',
        pincode: '384002',
      },
    ];

    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockFarms);

    const result = await farmService.getAllFarms();

    expect(getSpy).toHaveBeenCalledWith('/api/farms');
    expect(result).toHaveLength(2);
    expect(result[0].farmName).toBe('Green Pastures Dairy');
    expect(result[1].farmName).toBe('Sunrise Cattle Farm');
  });

  it('should retrieve single farm by ID via GET /api/farms/:id', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockFarm);

    const result = await farmService.getFarmById(1);

    expect(getSpy).toHaveBeenCalledWith('/api/farms/1');
    expect(result).toEqual(mockFarm);
  });

  it('should update farm via PUT /api/farms/:id', async () => {
    const updatePayload: UpdateFarmRequest = {
      farmName: 'Green Pastures Dairy Updated',
      location: 'Village Rampur',
      district: 'Anand',
      state: 'Gujarat',
      pincode: '388002',
    };

    const updatedFarm: Farm = {
      ...mockFarm,
      farmName: updatePayload.farmName,
      pincode: updatePayload.pincode,
    };

    const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(updatedFarm);

    const result = await farmService.updateFarm(1, updatePayload);

    expect(putSpy).toHaveBeenCalledWith('/api/farms/1', updatePayload);
    expect(result.farmName).toBe('Green Pastures Dairy Updated');
    expect(result.pincode).toBe('388002');
  });

  it('should delete a farm via DELETE /api/farms/:id', async () => {
    const deleteSpy = jest.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined as unknown as void);

    await farmService.deleteFarm(1);

    expect(deleteSpy).toHaveBeenCalledWith('/api/farms/1');
  });

  it('should propagate API errors (e.g. 404 Farm Not Found)', async () => {
    const apiError = new AppApiError({
      message: 'Farm not found with id: 999',
      status: 404,
      errorType: 'NOT_FOUND',
    });

    jest.spyOn(apiClient, 'get').mockRejectedValueOnce(apiError);

    await expect(farmService.getFarmById(999)).rejects.toThrow('Farm not found with id: 999');
  });

  it('should propagate API errors (e.g. 403 Access Denied)', async () => {
    const apiError = new AppApiError({
      message: 'Access denied: You do not have permission to access this farm',
      status: 403,
      errorType: 'FORBIDDEN',
    });

    jest.spyOn(apiClient, 'delete').mockRejectedValueOnce(apiError);

    await expect(farmService.deleteFarm(42)).rejects.toThrow('Access denied');
  });
});
