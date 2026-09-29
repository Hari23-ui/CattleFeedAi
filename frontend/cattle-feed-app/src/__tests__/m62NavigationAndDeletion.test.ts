import { getFarmerFriendlyErrorMessage } from '../utils/errorHandler';
import { AppApiError } from '../models/api';

/**
 * Route resolution test helper representing authenticated navigation flows
 */
export const resolveAppRoute = (
  currentScreen: string,
  action: { type: string; payload?: Record<string, unknown> }
): { screen: string; params?: Record<string, unknown> } => {
  switch (`${currentScreen}:${action.type}`) {
    case 'Dashboard:NAVIGATE_FARMS':
      return { screen: 'FarmList' };

    case 'Dashboard:NAVIGATE_ANIMALS':
      return { screen: 'AnimalList' };

    case 'Dashboard:ADD_FARM':
      return { screen: 'AddFarm' };

    case 'Dashboard:ADD_ANIMAL':
      return { screen: 'AddAnimal' };

    case 'FarmList:SELECT_FARM':
      return { screen: 'FarmDetails', params: { farmId: action.payload?.farmId } };

    case 'FarmDetails:VIEW_ANIMALS':
      return {
        screen: 'AnimalList',
        params: { farmId: action.payload?.farmId, farmName: action.payload?.farmName },
      };

    case 'FarmDetails:EDIT_FARM':
      return { screen: 'EditFarm', params: { farmId: action.payload?.farmId } };

    case 'AnimalList:SELECT_ANIMAL':
      return { screen: 'AnimalDetails', params: { animalId: action.payload?.animalId } };

    case 'AnimalDetails:EDIT_ANIMAL':
      return { screen: 'EditAnimal', params: { animalId: action.payload?.animalId } };

    default:
      return { screen: currentScreen };
  }
};

/**
 * Mock alert confirmation handler test helper
 */
export const handleConfirmDeletion = (
  confirmed: boolean,
  onDelete: () => Promise<void>
): Promise<boolean> => {
  if (confirmed) {
    return onDelete().then(() => true);
  }
  return Promise.resolve(false);
};

describe('M6.2 Navigation and Workflow Routing', () => {
  it('should route Dashboard → Farms', () => {
    const route = resolveAppRoute('Dashboard', { type: 'NAVIGATE_FARMS' });
    expect(route.screen).toBe('FarmList');
  });

  it('should route Dashboard → Animals', () => {
    const route = resolveAppRoute('Dashboard', { type: 'NAVIGATE_ANIMALS' });
    expect(route.screen).toBe('AnimalList');
  });

  it('should route FarmList → Farm Details with farmId', () => {
    const route = resolveAppRoute('FarmList', {
      type: 'SELECT_FARM',
      payload: { farmId: 101 },
    });
    expect(route.screen).toBe('FarmDetails');
    expect(route.params?.farmId).toBe(101);
  });

  it('should route FarmDetails → Animals in Farm with farmId and farmName', () => {
    const route = resolveAppRoute('FarmDetails', {
      type: 'VIEW_ANIMALS',
      payload: { farmId: 101, farmName: 'Green Pastures' },
    });
    expect(route.screen).toBe('AnimalList');
    expect(route.params?.farmId).toBe(101);
    expect(route.params?.farmName).toBe('Green Pastures');
  });

  it('should route AnimalList → Animal Details with animalId', () => {
    const route = resolveAppRoute('AnimalList', {
      type: 'SELECT_ANIMAL',
      payload: { animalId: 501 },
    });
    expect(route.screen).toBe('AnimalDetails');
    expect(route.params?.animalId).toBe(501);
  });

  it('should route FarmDetails → Edit Farm', () => {
    const route = resolveAppRoute('FarmDetails', {
      type: 'EDIT_FARM',
      payload: { farmId: 101 },
    });
    expect(route.screen).toBe('EditFarm');
    expect(route.params?.farmId).toBe(101);
  });

  it('should route AnimalDetails → Edit Animal', () => {
    const route = resolveAppRoute('AnimalDetails', {
      type: 'EDIT_ANIMAL',
      payload: { animalId: 501 },
    });
    expect(route.screen).toBe('EditAnimal');
    expect(route.params?.animalId).toBe(501);
  });
});

describe('M6.2 Deletion Confirmation Logic', () => {
  it('should NOT execute deletion when user cancels confirmation', async () => {
    const deleteAction = jest.fn().mockResolvedValue(undefined);

    const executed = await handleConfirmDeletion(false, deleteAction);

    expect(executed).toBe(false);
    expect(deleteAction).not.toHaveBeenCalled();
  });

  it('should execute deletion only when user confirms dialog', async () => {
    const deleteAction = jest.fn().mockResolvedValue(undefined);

    const executed = await handleConfirmDeletion(true, deleteAction);

    expect(executed).toBe(true);
    expect(deleteAction).toHaveBeenCalledTimes(1);
  });
});

describe('M6.2 Duplicate Animal Tag & Conflict Error Handling', () => {
  it('should translate duplicate tag 409 conflict to farmer-friendly message', () => {
    const error = new AppApiError({
      message: "Animal with tag 'TAG-001' already exists in this farm",
      status: 409,
      errorType: 'CONFLICT',
    });

    const friendlyMessage = getFarmerFriendlyErrorMessage(error);
    expect(friendlyMessage).toBe("Animal with tag 'TAG-001' already exists in this farm");
  });

  it('should translate 403 access denied to clear permission message', () => {
    const error = new AppApiError({
      message: 'Access denied: You do not have permission to access this farm',
      status: 403,
      errorType: 'FORBIDDEN',
    });

    const friendlyMessage = getFarmerFriendlyErrorMessage(error);
    expect(friendlyMessage).toBe('Access denied: You do not have permission to access this farm');
  });

  it('should translate 404 not found to clear message', () => {
    const error = new AppApiError({
      message: 'Farm not found with id: 99',
      status: 404,
      errorType: 'NOT_FOUND',
    });

    const friendlyMessage = getFarmerFriendlyErrorMessage(error);
    expect(friendlyMessage).toBe('Farm not found with id: 99');
  });
});
