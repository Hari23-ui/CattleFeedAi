/**
 * M6.5 Route Resolution and Workflow Navigation Unit Tests
 */

export const resolveM65Route = (
  currentScreen: string,
  action: { type: string; payload?: Record<string, unknown> }
): { screen: string; params?: Record<string, unknown> } => {
  switch (`${currentScreen}:${action.type}`) {
    // AnimalDetails -> Health Screening (Phase 13)
    case 'AnimalDetails:VIEW_HEALTH_SCREENING':
      return {
        screen: 'AnimalHealthScreening',
        params: { animalId: action.payload?.animalId },
      };

    // AnimalHealthScreening -> Feed / Silage History (Phase 15)
    case 'AnimalHealthScreening:SELECT_FEED':
      return {
        screen: 'FeedDetails',
        params: { sampleId: action.payload?.sampleId },
      };
    case 'AnimalHealthScreening:SELECT_SILAGE':
      return {
        screen: 'SilageDetails',
        params: { sampleId: action.payload?.sampleId },
      };
    case 'AnimalHealthScreening:ADD_FEED':
      return {
        screen: 'AddFeed',
        params: { animalId: action.payload?.animalId, farmId: action.payload?.farmId },
      };
    case 'AnimalHealthScreening:ADD_SILAGE':
      return {
        screen: 'AddSilage',
        params: { animalId: action.payload?.animalId, farmId: action.payload?.farmId },
      };

    // AnimalHealthScreening -> Advisory details (Phase 16)
    case 'AnimalHealthScreening:SELECT_ADVISORY':
      return {
        screen: 'AdvisoryDetails',
        params: { advisoryId: action.payload?.advisoryId },
      };

    // Back to Animal Details
    case 'AnimalHealthScreening:BACK':
      return {
        screen: 'AnimalDetails',
        params: { animalId: action.payload?.animalId },
      };

    // Preservation of M6.4 routes
    case 'TestResultDetails:VIEW_ASSESSMENT':
      return {
        screen: 'AssessmentResult',
        params: { testResultId: action.payload?.testResultId },
      };
    case 'Dashboard:NAVIGATE_ADVISORIES':
      return { screen: 'AdvisoryList' };

    default:
      return { screen: currentScreen };
  }
};

describe('M6.5 Navigation & Workflow Transitions', () => {
  it('should navigate from AnimalDetails to AnimalHealthScreening with animalId', () => {
    const next = resolveM65Route('AnimalDetails', {
      type: 'VIEW_HEALTH_SCREENING',
      payload: { animalId: 15 },
    });
    expect(next.screen).toBe('AnimalHealthScreening');
    expect(next.params).toEqual({ animalId: 15 });
  });

  it('should navigate from AnimalHealthScreening to FeedDetails when selecting a feed sample', () => {
    const next = resolveM65Route('AnimalHealthScreening', {
      type: 'SELECT_FEED',
      payload: { sampleId: 101 },
    });
    expect(next.screen).toBe('FeedDetails');
    expect(next.params).toEqual({ sampleId: 101 });
  });

  it('should navigate from AnimalHealthScreening to SilageDetails when selecting a silage sample', () => {
    const next = resolveM65Route('AnimalHealthScreening', {
      type: 'SELECT_SILAGE',
      payload: { sampleId: 202 },
    });
    expect(next.screen).toBe('SilageDetails');
    expect(next.params).toEqual({ sampleId: 202 });
  });

  it('should navigate from AnimalHealthScreening to AdvisoryDetails when selecting an advisory', () => {
    const next = resolveM65Route('AnimalHealthScreening', {
      type: 'SELECT_ADVISORY',
      payload: { advisoryId: 5 },
    });
    expect(next.screen).toBe('AdvisoryDetails');
    expect(next.params).toEqual({ advisoryId: 5 });
  });

  it('should navigate from AnimalHealthScreening to AddFeed pre-populating animalId and farmId', () => {
    const next = resolveM65Route('AnimalHealthScreening', {
      type: 'ADD_FEED',
      payload: { animalId: 15, farmId: 3 },
    });
    expect(next.screen).toBe('AddFeed');
    expect(next.params).toEqual({ animalId: 15, farmId: 3 });
  });

  it('should navigate from AnimalHealthScreening to AddSilage pre-populating animalId and farmId', () => {
    const next = resolveM65Route('AnimalHealthScreening', {
      type: 'ADD_SILAGE',
      payload: { animalId: 15, farmId: 3 },
    });
    expect(next.screen).toBe('AddSilage');
    expect(next.params).toEqual({ animalId: 15, farmId: 3 });
  });

  it('should navigate back from AnimalHealthScreening to AnimalDetails', () => {
    const next = resolveM65Route('AnimalHealthScreening', {
      type: 'BACK',
      payload: { animalId: 15 },
    });
    expect(next.screen).toBe('AnimalDetails');
    expect(next.params).toEqual({ animalId: 15 });
  });

  it('should preserve M6.4 assessment and advisory routes', () => {
    expect(
      resolveM65Route('TestResultDetails', {
        type: 'VIEW_ASSESSMENT',
        payload: { testResultId: 50 },
      }).screen
    ).toBe('AssessmentResult');
    expect(
      resolveM65Route('Dashboard', { type: 'NAVIGATE_ADVISORIES' }).screen
    ).toBe('AdvisoryList');
  });
});
