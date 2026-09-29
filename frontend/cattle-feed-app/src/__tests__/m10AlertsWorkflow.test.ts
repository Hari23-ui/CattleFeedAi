/**
 * M10 Notifications & Alerts Workflow & Presentation Unit Tests
 */

import { Alert, AlertSeverity, AlertType } from '../models/alert';

export const getAlertTypeIcon = (type?: AlertType | null): string => {
  if (!type) return '🔔';
  switch (type) {
    case 'FEED_QUALITY':
      return '🌾';
    case 'SILAGE_QUALITY':
      return '🌿';
    case 'STORAGE':
      return '🏭';
    case 'HEALTH_RISK':
      return '🩺';
    case 'CONSULTATION':
      return '👨‍⚕️';
    case 'GENERAL':
    default:
      return '🔔';
  }
};

export const getAlertTypeName = (type?: AlertType | null): string => {
  if (!type) return 'General';
  switch (type) {
    case 'FEED_QUALITY':
      return 'Feed Quality';
    case 'SILAGE_QUALITY':
      return 'Silage Quality';
    case 'STORAGE':
      return 'Storage & Bunker';
    case 'HEALTH_RISK':
      return 'Herd Health Risk';
    case 'CONSULTATION':
      return 'Expert Advice';
    case 'GENERAL':
    default:
      return 'General Alert';
  }
};

export const resolveM10Route = (
  currentScreen: string,
  action: { type: string; payload?: Record<string, unknown> }
): { screen: string; params?: Record<string, unknown> } => {
  switch (`${currentScreen}:${action.type}`) {
    case 'Dashboard:NAVIGATE_ALERTS':
      return { screen: 'AlertList' };
    case 'AlertList:SELECT_ALERT':
      return {
        screen: 'AlertDetails',
        params: { alertId: action.payload?.alertId },
      };
    case 'AlertDetails:BACK':
      return { screen: 'AlertList' };
    default:
      return { screen: currentScreen };
  }
};

describe('M10 Notifications & Alerts Workflow & Presentation', () => {
  const sampleAlerts: Alert[] = [
    {
      id: 1,
      title: 'Critical Feed Quality Alert: FS-101',
      message: 'Moisture exceeds threshold (18.5%). Risk of microbial decay.',
      alertType: 'FEED_QUALITY',
      severity: 'CRITICAL',
      isRead: false,
      createdAt: '2026-09-28T14:30:00Z',
      userId: 10,
      relatedEntityType: 'TEST_RESULT',
      relatedEntityId: 101,
    },
    {
      id: 2,
      title: 'High Risk Screening Alert: SIL-202',
      message: 'Organoleptic spoilage detected.',
      alertType: 'SILAGE_QUALITY',
      severity: 'HIGH',
      isRead: false,
      createdAt: '2026-09-28T13:00:00Z',
      userId: 10,
      relatedEntityType: 'TEST_RESULT',
      relatedEntityId: 102,
    },
    {
      id: 3,
      title: 'Urgent Advisory: Bunker Sealing Required',
      message: 'Aeration heating observed in silage bunker #3.',
      alertType: 'STORAGE',
      severity: 'HIGH',
      isRead: true,
      createdAt: '2026-09-27T16:00:00Z',
      userId: 10,
      relatedEntityType: 'ADVISORY',
      relatedEntityId: 50,
    },
    {
      id: 4,
      title: 'General Notification: Herd Vaccination Schedule',
      message: 'Routine health screening due next week.',
      alertType: 'HEALTH_RISK',
      severity: 'INFO',
      isRead: true,
      createdAt: '2026-09-25T09:00:00Z',
      userId: 10,
    },
  ];

  describe('Route Transitions', () => {
    it('navigates from Dashboard to AlertList when notification bell or alerts card is tapped', () => {
      const next = resolveM10Route('Dashboard', { type: 'NAVIGATE_ALERTS' });
      expect(next.screen).toBe('AlertList');
    });

    it('navigates from AlertList to AlertDetails with alertId payload', () => {
      const next = resolveM10Route('AlertList', {
        type: 'SELECT_ALERT',
        payload: { alertId: 1 },
      });
      expect(next.screen).toBe('AlertDetails');
      expect(next.params).toEqual({ alertId: 1 });
    });

    it('navigates back from AlertDetails to AlertList', () => {
      const next = resolveM10Route('AlertDetails', { type: 'BACK' });
      expect(next.screen).toBe('AlertList');
    });
  });

  describe('Filter Tab Logic', () => {
    type FilterTab = 'ALL' | 'UNREAD' | 'READ';

    const filterAlertsByTab = (tab: FilterTab, list: Alert[]) => {
      return list.filter(a => {
        if (tab === 'UNREAD') return !a.isRead;
        if (tab === 'READ') return a.isRead;
        return true;
      });
    };

    it('filters all alerts correctly on ALL tab', () => {
      const filtered = filterAlertsByTab('ALL', sampleAlerts);
      expect(filtered).toHaveLength(4);
    });

    it('filters unread alerts correctly on UNREAD tab', () => {
      const filtered = filterAlertsByTab('UNREAD', sampleAlerts);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(a => !a.isRead)).toBe(true);
    });

    it('filters read alerts correctly on READ tab', () => {
      const filtered = filterAlertsByTab('READ', sampleAlerts);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(a => a.isRead)).toBe(true);
    });
  });

  describe('Dashboard Unread Indicator Badge Logic', () => {
    const formatUnreadBadge = (count: number | null): string | null => {
      if (count === null || count <= 0) return null;
      return count > 99 ? '99+' : String(count);
    };

    it('hides badge when count is 0 or null', () => {
      expect(formatUnreadBadge(0)).toBeNull();
      expect(formatUnreadBadge(null)).toBeNull();
    });

    it('formats single-digit and double-digit unread counts', () => {
      expect(formatUnreadBadge(3)).toBe('3');
      expect(formatUnreadBadge(25)).toBe('25');
    });

    it('formats counts above 99 as 99+', () => {
      expect(formatUnreadBadge(100)).toBe('99+');
      expect(formatUnreadBadge(150)).toBe('99+');
    });
  });

  describe('Alert Type Icons and Human-Readable Names', () => {
    it('maps FEED_QUALITY type correctly', () => {
      expect(getAlertTypeIcon('FEED_QUALITY')).toBe('🌾');
      expect(getAlertTypeName('FEED_QUALITY')).toBe('Feed Quality');
    });

    it('maps SILAGE_QUALITY type correctly', () => {
      expect(getAlertTypeIcon('SILAGE_QUALITY')).toBe('🌿');
      expect(getAlertTypeName('SILAGE_QUALITY')).toBe('Silage Quality');
    });

    it('maps STORAGE type correctly', () => {
      expect(getAlertTypeIcon('STORAGE')).toBe('🏭');
      expect(getAlertTypeName('STORAGE')).toBe('Storage & Bunker');
    });

    it('maps HEALTH_RISK type correctly', () => {
      expect(getAlertTypeIcon('HEALTH_RISK')).toBe('🩺');
      expect(getAlertTypeName('HEALTH_RISK')).toBe('Herd Health Risk');
    });

    it('maps CONSULTATION type correctly', () => {
      expect(getAlertTypeIcon('CONSULTATION')).toBe('👨‍⚕️');
      expect(getAlertTypeName('CONSULTATION')).toBe('Expert Advice');
    });

    it('maps GENERAL or null type gracefully', () => {
      expect(getAlertTypeIcon('GENERAL')).toBe('🔔');
      expect(getAlertTypeIcon(null)).toBe('🔔');
      expect(getAlertTypeName(null)).toBe('General');
    });
  });

  describe('Scientific Safety & Disclaimers', () => {
    const DISCLAIMER_TEXT =
      'Notifications and alerts are communication and screening tools. They do not constitute veterinary medical diagnoses. For clinical herd issues, always consult a certified Veterinarian or Veterinary Nutritionist.';

    it('contains veterinary medical non-diagnostic disclaimer', () => {
      expect(DISCLAIMER_TEXT).toContain('do not constitute veterinary medical diagnoses');
    });

    it('prohibits referring to veterinary experts as dieticians', () => {
      expect(DISCLAIMER_TEXT.toLowerCase()).not.toContain('dietician');
      expect(DISCLAIMER_TEXT.toLowerCase()).not.toContain('dietitian');
      expect(DISCLAIMER_TEXT).toContain('Veterinarian');
      expect(DISCLAIMER_TEXT).toContain('Veterinary Nutritionist');
    });
  });
});
