import { Animal, CreateAnimalRequest, UpdateAnimalRequest } from '../models/animal';
import { apiClient } from '../services/apiClient';
import { animalService } from '../services/animalService';
import { AppApiError } from '../models/api';

describe('Animal Service', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockAnimal: Animal = {
    id: 10,
    farmId: 1,
    animalTag: 'TAG-101',
    name: 'Ganga',
    breed: 'Gir',
    gender: 'FEMALE',
    dateOfBirth: '2023-01-15',
    weight: 420.5,
    lactationStage: 'EARLY',
    daysInMilk: 45,
    milkProductionPerDay: 16.5,
    pregnancyStatus: 'NOT_PREGNANT',
    feedIntakeStatus: 'NORMAL',
  };

  it('should create an animal successfully via POST /api/animals', async () => {
    const payload: CreateAnimalRequest = {
      farmId: 1,
      animalTag: 'TAG-101',
      name: 'Ganga',
      breed: 'Gir',
      gender: 'FEMALE',
      dateOfBirth: '2023-01-15',
      weight: 420.5,
      lactationStage: 'EARLY',
      daysInMilk: 45,
      milkProductionPerDay: 16.5,
      pregnancyStatus: 'NOT_PREGNANT',
      feedIntakeStatus: 'NORMAL',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockAnimal);

    const result = await animalService.createAnimal(payload);

    expect(postSpy).toHaveBeenCalledWith('/api/animals', payload);
    expect(result).toEqual(mockAnimal);
    expect(result.animalTag).toBe('TAG-101');
    expect(result.farmId).toBe(1);
  });

  it('should retrieve all farmer animals via GET /api/animals', async () => {
    const mockAnimals: Animal[] = [
      mockAnimal,
      {
        id: 11,
        farmId: 1,
        animalTag: 'TAG-102',
        name: 'Lakshmi',
        breed: 'Jersey',
        gender: 'FEMALE',
        lactationStage: 'MID',
        daysInMilk: 120,
        milkProductionPerDay: 22.0,
      },
    ];

    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAnimals);

    const result = await animalService.getAllAnimals();

    expect(getSpy).toHaveBeenCalledWith('/api/animals');
    expect(result).toHaveLength(2);
    expect(result[0].animalTag).toBe('TAG-101');
    expect(result[1].animalTag).toBe('TAG-102');
  });

  it('should retrieve animals filtered by farmId via GET /api/animals?farmId=X', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockAnimal]);

    const result = await animalService.getAllAnimals(1);

    expect(getSpy).toHaveBeenCalledWith('/api/animals?farmId=1');
    expect(result).toHaveLength(1);
    expect(result[0].farmId).toBe(1);
  });

  it('should retrieve single animal by ID via GET /api/animals/:id', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAnimal);

    const result = await animalService.getAnimalById(10);

    expect(getSpy).toHaveBeenCalledWith('/api/animals/10');
    expect(result).toEqual(mockAnimal);
  });

  it('should update animal via PUT /api/animals/:id', async () => {
    const updatePayload: UpdateAnimalRequest = {
      farmId: 1,
      animalTag: 'TAG-101',
      name: 'Ganga Updated',
      breed: 'Gir',
      gender: 'FEMALE',
      weight: 435.0,
      lactationStage: 'MID',
      daysInMilk: 90,
      milkProductionPerDay: 18.0,
      pregnancyStatus: 'PREGNANT',
      feedIntakeStatus: 'NORMAL',
    };

    const updatedAnimal: Animal = {
      ...mockAnimal,
      name: updatePayload.name,
      weight: updatePayload.weight,
      lactationStage: updatePayload.lactationStage,
      daysInMilk: updatePayload.daysInMilk,
      milkProductionPerDay: updatePayload.milkProductionPerDay,
      pregnancyStatus: updatePayload.pregnancyStatus,
    };

    const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(updatedAnimal);

    const result = await animalService.updateAnimal(10, updatePayload);

    expect(putSpy).toHaveBeenCalledWith('/api/animals/10', updatePayload);
    expect(result.name).toBe('Ganga Updated');
    expect(result.weight).toBe(435.0);
    expect(result.lactationStage).toBe('MID');
    expect(result.pregnancyStatus).toBe('PREGNANT');
  });

  it('should delete an animal via DELETE /api/animals/:id', async () => {
    const deleteSpy = jest.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined as unknown as void);

    await animalService.deleteAnimal(10);

    expect(deleteSpy).toHaveBeenCalledWith('/api/animals/10');
  });

  it('should propagate duplicate tag 409 conflict error', async () => {
    const duplicateError = new AppApiError({
      message: "Animal with tag 'TAG-101' already exists in this farm",
      status: 409,
      errorType: 'CONFLICT',
    });

    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(duplicateError);

    await expect(
      animalService.createAnimal({
        farmId: 1,
        animalTag: 'TAG-101',
        gender: 'FEMALE',
      })
    ).rejects.toThrow("Animal with tag 'TAG-101' already exists in this farm");
  });
});
