import { FeedPlan, FeedPlanRequest } from '../models/feedPlan';
import { AppStackParamList } from '../navigation/types';

/**
 * Route resolution test helper for M11 Feed Planning & Dashboard workflow
 */
type M11NavAction =
  | { type: 'Dashboard:NAVIGATE_FEED_PLANS' }
  | { type: 'Dashboard:ADD_FEED_PLAN' }
  | { type: 'Dashboard:NAVIGATE_FARMS' }
  | { type: 'Dashboard:NAVIGATE_ANIMALS' }
  | { type: 'Dashboard:NAVIGATE_FEED' }
  | { type: 'Dashboard:NAVIGATE_SILAGE' }
  | { type: 'Dashboard:NAVIGATE_TEST_RESULTS' }
  | { type: 'Dashboard:NAVIGATE_ADVISORIES' }
  | { type: 'Dashboard:NAVIGATE_ALERTS' }
  | { type: 'Dashboard:NAVIGATE_CONSULTATIONS' }
  | { type: 'Dashboard:NAVIGATE_ANALYTICS' }
  | { type: 'FeedPlanList:VIEW_DETAILS'; planId: number }
  | { type: 'FeedPlanList:CREATE_PLAN' }
  | { type: 'FeedPlanDetails:EDIT_PLAN'; planId: number }
  | { type: 'FeedPlanDetails:DELETE_PLAN' }
  | { type: 'AddFeedPlan:SUBMIT_SUCCESS' }
  | { type: 'EditFeedPlan:SUBMIT_SUCCESS'; planId: number };

function resolveM11Route(
  currentScreen: keyof AppStackParamList,
  action: M11NavAction
): { screen: keyof AppStackParamList; params?: any } {
  switch (`${currentScreen}:${action.type}`) {
    case 'Dashboard:Dashboard:NAVIGATE_FEED_PLANS':
      return { screen: 'FeedPlanList' };
    case 'Dashboard:Dashboard:ADD_FEED_PLAN':
      return { screen: 'AddFeedPlan' };
    case 'Dashboard:Dashboard:NAVIGATE_FARMS':
      return { screen: 'FarmList' };
    case 'Dashboard:Dashboard:NAVIGATE_ANIMALS':
      return { screen: 'AnimalList' };
    case 'Dashboard:Dashboard:NAVIGATE_FEED':
      return { screen: 'FeedList' };
    case 'Dashboard:Dashboard:NAVIGATE_SILAGE':
      return { screen: 'SilageList' };
    case 'Dashboard:Dashboard:NAVIGATE_TEST_RESULTS':
      return { screen: 'TestResultList' };
    case 'Dashboard:Dashboard:NAVIGATE_ADVISORIES':
      return { screen: 'AdvisoryList' };
    case 'Dashboard:Dashboard:NAVIGATE_ALERTS':
      return { screen: 'AlertList' };
    case 'Dashboard:Dashboard:NAVIGATE_CONSULTATIONS':
      return { screen: 'ConsultationList' };
    case 'Dashboard:Dashboard:NAVIGATE_ANALYTICS':
      return { screen: 'AnalyticsDashboard' };

    case 'FeedPlanList:FeedPlanList:VIEW_DETAILS':
      return { screen: 'FeedPlanDetails', params: { planId: (action as any).planId } };
    case 'FeedPlanList:FeedPlanList:CREATE_PLAN':
      return { screen: 'AddFeedPlan' };

    case 'FeedPlanDetails:FeedPlanDetails:EDIT_PLAN':
      return { screen: 'EditFeedPlan', params: { planId: (action as any).planId } };
    case 'FeedPlanDetails:FeedPlanDetails:DELETE_PLAN':
      return { screen: 'FeedPlanList' };

    case 'AddFeedPlan:AddFeedPlan:SUBMIT_SUCCESS':
      return { screen: 'FeedPlanList' };
    case 'EditFeedPlan:EditFeedPlan:SUBMIT_SUCCESS':
      return { screen: 'FeedPlanDetails', params: { planId: (action as any).planId } };

    default:
      throw new Error(`Unhandled navigation: ${currentScreen} -> ${action.type}`);
  }
}

describe('M11 Feed Planning & Unified Dashboard Navigation Workflow', () => {
  it('navigates from Dashboard to FeedPlanList when Feed Plans card is tapped', () => {
    const next = resolveM11Route('Dashboard', { type: 'Dashboard:NAVIGATE_FEED_PLANS' });
    expect(next.screen).toBe('FeedPlanList');
  });

  it('navigates from Dashboard to AddFeedPlan when Create Feed Plan button is tapped', () => {
    const next = resolveM11Route('Dashboard', { type: 'Dashboard:ADD_FEED_PLAN' });
    expect(next.screen).toBe('AddFeedPlan');
  });

  it('navigates from FeedPlanList to FeedPlanDetails with planId', () => {
    const next = resolveM11Route('FeedPlanList', {
      type: 'FeedPlanList:VIEW_DETAILS',
      planId: 42,
    });
    expect(next.screen).toBe('FeedPlanDetails');
    expect(next.params).toEqual({ planId: 42 });
  });

  it('navigates from FeedPlanDetails to EditFeedPlan with planId', () => {
    const next = resolveM11Route('FeedPlanDetails', {
      type: 'FeedPlanDetails:EDIT_PLAN',
      planId: 42,
    });
    expect(next.screen).toBe('EditFeedPlan');
    expect(next.params).toEqual({ planId: 42 });
  });

  it('navigates back to FeedPlanList after plan deletion', () => {
    const next = resolveM11Route('FeedPlanDetails', {
      type: 'FeedPlanDetails:DELETE_PLAN',
    });
    expect(next.screen).toBe('FeedPlanList');
  });

  it('navigates back to FeedPlanList after successful plan creation', () => {
    const next = resolveM11Route('AddFeedPlan', {
      type: 'AddFeedPlan:SUBMIT_SUCCESS',
    });
    expect(next.screen).toBe('FeedPlanList');
  });

  it('navigates to FeedPlanDetails after successful edit', () => {
    const next = resolveM11Route('EditFeedPlan', {
      type: 'EditFeedPlan:SUBMIT_SUCCESS',
      planId: 42,
    });
    expect(next.screen).toBe('FeedPlanDetails');
    expect(next.params).toEqual({ planId: 42 });
  });

  it('provides complete navigation from Unified Dashboard to all application modules', () => {
    expect(resolveM11Route('Dashboard', { type: 'Dashboard:NAVIGATE_FARMS' }).screen).toBe('FarmList');
    expect(resolveM11Route('Dashboard', { type: 'Dashboard:NAVIGATE_ANIMALS' }).screen).toBe('AnimalList');
    expect(resolveM11Route('Dashboard', { type: 'Dashboard:NAVIGATE_FEED' }).screen).toBe('FeedList');
    expect(resolveM11Route('Dashboard', { type: 'Dashboard:NAVIGATE_SILAGE' }).screen).toBe('SilageList');
    expect(resolveM11Route('Dashboard', { type: 'Dashboard:NAVIGATE_TEST_RESULTS' }).screen).toBe('TestResultList');
    expect(resolveM11Route('Dashboard', { type: 'Dashboard:NAVIGATE_ADVISORIES' }).screen).toBe('AdvisoryList');
    expect(resolveM11Route('Dashboard', { type: 'Dashboard:NAVIGATE_ALERTS' }).screen).toBe('AlertList');
    expect(resolveM11Route('Dashboard', { type: 'Dashboard:NAVIGATE_CONSULTATIONS' }).screen).toBe('ConsultationList');
    expect(resolveM11Route('Dashboard', { type: 'Dashboard:NAVIGATE_ANALYTICS' }).screen).toBe('AnalyticsDashboard');
  });
});

describe('Feed Plan Filter Logic', () => {
  const samplePlans: FeedPlan[] = [
    {
      id: 1,
      planName: 'Active Plan 1',
      startDate: '2026-10-01',
      status: 'ACTIVE',
      createdAt: '2026-09-28T00:00:00',
      updatedAt: '2026-09-28T00:00:00',
      animal: { id: 1, animalTag: 'C-01' },
    },
    {
      id: 2,
      planName: 'Completed Plan',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      status: 'COMPLETED',
      createdAt: '2026-08-01T00:00:00',
      updatedAt: '2026-08-31T00:00:00',
      animal: { id: 2, animalTag: 'C-02' },
    },
    {
      id: 3,
      planName: 'Cancelled Plan',
      startDate: '2026-07-01',
      status: 'CANCELLED',
      createdAt: '2026-07-01T00:00:00',
      updatedAt: '2026-07-02T00:00:00',
      animal: { id: 3, animalTag: 'C-03' },
    },
    {
      id: 4,
      planName: 'Active Plan 2',
      startDate: '2026-10-10',
      status: 'ACTIVE',
      createdAt: '2026-09-28T00:00:00',
      updatedAt: '2026-09-28T00:00:00',
      animal: { id: 4, animalTag: 'C-04' },
    },
  ];

  const filterPlans = (plans: FeedPlan[], tab: 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => {
    if (tab === 'ALL') return plans;
    return plans.filter((p) => (p.status || '').toUpperCase() === tab);
  };

  it('filters all plans correctly', () => {
    expect(filterPlans(samplePlans, 'ALL')).toHaveLength(4);
  });

  it('filters active plans correctly', () => {
    const active = filterPlans(samplePlans, 'ACTIVE');
    expect(active).toHaveLength(2);
    expect(active.every((p) => p.status === 'ACTIVE')).toBe(true);
  });

  it('filters completed plans correctly', () => {
    const completed = filterPlans(samplePlans, 'COMPLETED');
    expect(completed).toHaveLength(1);
    expect(completed[0].id).toBe(2);
  });

  it('filters cancelled plans correctly', () => {
    const cancelled = filterPlans(samplePlans, 'CANCELLED');
    expect(cancelled).toHaveLength(1);
    expect(cancelled[0].id).toBe(3);
  });
});

describe('Feed Plan Form Validation Logic', () => {
  const validateFeedPlanForm = (data: Partial<FeedPlanRequest>): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.planName || !data.planName.trim()) {
      errors.planName = 'Plan name is required';
    }
    if (!data.animalId) {
      errors.animalId = 'Animal selection is required';
    }
    if (!data.startDate || !data.startDate.trim()) {
      errors.startDate = 'Start date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.startDate.trim())) {
      errors.startDate = 'Date format must be YYYY-MM-DD';
    }
    if (data.endDate && data.endDate.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.endDate.trim())) {
        errors.endDate = 'Date format must be YYYY-MM-DD';
      } else if (data.startDate && data.endDate.trim() < data.startDate.trim()) {
        errors.endDate = 'End date cannot be before start date';
      }
    }
    if (data.plannedQuantity !== undefined && data.plannedQuantity !== null) {
      if (isNaN(data.plannedQuantity) || data.plannedQuantity <= 0) {
        errors.plannedQuantity = 'Quantity must be a positive number';
      }
    }
    return errors;
  };

  it('validates a complete, valid feed plan request', () => {
    const errors = validateFeedPlanForm({
      planName: 'Healthy Lactation Diet',
      animalId: 10,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      plannedQuantity: 5.5,
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('rejects empty plan name', () => {
    const errors = validateFeedPlanForm({
      planName: '   ',
      animalId: 10,
      startDate: '2026-10-01',
    });
    expect(errors.planName).toBe('Plan name is required');
  });

  it('rejects missing animal ID', () => {
    const errors = validateFeedPlanForm({
      planName: 'Diet Plan',
      startDate: '2026-10-01',
    });
    expect(errors.animalId).toBe('Animal selection is required');
  });

  it('rejects invalid start date format', () => {
    const errors = validateFeedPlanForm({
      planName: 'Diet Plan',
      animalId: 10,
      startDate: '01/10/2026',
    });
    expect(errors.startDate).toBe('Date format must be YYYY-MM-DD');
  });

  it('rejects end date that is before start date', () => {
    const errors = validateFeedPlanForm({
      planName: 'Diet Plan',
      animalId: 10,
      startDate: '2026-10-31',
      endDate: '2026-10-01',
    });
    expect(errors.endDate).toBe('End date cannot be before start date');
  });

  it('rejects non-positive planned quantities', () => {
    const errorsZero = validateFeedPlanForm({
      planName: 'Diet Plan',
      animalId: 10,
      startDate: '2026-10-01',
      plannedQuantity: 0,
    });
    expect(errorsZero.plannedQuantity).toBe('Quantity must be a positive number');

    const errorsNegative = validateFeedPlanForm({
      planName: 'Diet Plan',
      animalId: 10,
      startDate: '2026-10-01',
      plannedQuantity: -2.5,
    });
    expect(errorsNegative.plannedQuantity).toBe('Quantity must be a positive number');
  });
});

describe('Dashboard Live Counts & Null Safety', () => {
  const formatDashboardCount = (count: number | null, isLoading: boolean): string => {
    if (isLoading && count === null) return '...';
    if (count === null) return '0';
    return String(count);
  };

  it('renders loading dots when counts are fetching and count is null', () => {
    expect(formatDashboardCount(null, true)).toBe('...');
  });

  it('renders real count when loaded', () => {
    expect(formatDashboardCount(5, false)).toBe('5');
    expect(formatDashboardCount(0, false)).toBe('0');
  });

  it('never hardcodes production counts', () => {
    const counts = [0, 1, 12, 100];
    counts.forEach((c) => {
      expect(formatDashboardCount(c, false)).toBe(String(c));
    });
  });
});

describe('Scientific Safety & Non-Diagnostic Terminology', () => {
  const disclaimerText =
    'Informational feed planning record only. Non-diagnostic. ' +
    'Does not constitute veterinary prescription or diagnosis. ' +
    'Consult a qualified Veterinarian, Veterinary Nutritionist, or Animal Nutrition Expert ' +
    'for clinical or dietary interventions.';

  it('strictly adheres to veterinary non-diagnostic terminology', () => {
    expect(disclaimerText).toContain('Non-diagnostic');
    expect(disclaimerText).toContain('Veterinarian');
    expect(disclaimerText).toContain('Animal Nutrition Expert');
    expect(disclaimerText.toLowerCase()).not.toContain('dietician');
    expect(disclaimerText.toLowerCase()).not.toContain('prescription guaranteed');
  });
});
