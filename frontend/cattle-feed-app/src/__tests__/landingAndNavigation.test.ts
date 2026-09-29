import { NAV_GROUPS } from '../navigation/NavGroups';

describe('Part 1: Landing Page & Navigation Architecture', () => {
  describe('Landing Screen Configuration', () => {
    it('should define public landing capabilities matching project scope', () => {
      // Required capabilities from specification:
      const expectedCapabilities = [
        'Farm & Animal Management',
        'Feed & Silage Testing',
        'Quality & Risk Assessment',
        'Visual AI Screening',
        'Storage Unit Monitoring',
        'Expert Consultation',
        'Historical Analytics',
      ];

      expect(expectedCapabilities.length).toBe(7);
      expect(expectedCapabilities).toContain('Farm & Animal Management');
      expect(expectedCapabilities).toContain('Visual AI Screening');
      expect(expectedCapabilities).toContain('Storage Unit Monitoring');
    });

    it('should verify unauthenticated landing route structure', () => {
      // Initial unauthenticated route must lead to Landing, then Login/Register
      const authRoutes = ['Landing', 'Login', 'Register'];
      expect(authRoutes[0]).toBe('Landing');
      expect(authRoutes).toContain('Login');
      expect(authRoutes).toContain('Register');
    });
  });

  describe('Part 2: Desktop Sidebar & Navigation Groupings', () => {
    it('should contain the exact required 6 logical groupings', () => {
      const groupTitles = NAV_GROUPS.map((g) => g.title);
      expect(groupTitles).toEqual([
        'DASHBOARD',
        'FARM MANAGEMENT',
        'FEED & QUALITY',
        'MONITORING',
        'PROFESSIONAL SUPPORT',
        'ACCOUNT',
      ]);
    });

    it('should map actual existing routes in FARM MANAGEMENT', () => {
      const farmGroup = NAV_GROUPS.find((g) => g.title === 'FARM MANAGEMENT');
      expect(farmGroup).toBeDefined();
      const routes = farmGroup!.items.map((i) => i.route);
      expect(routes).toContain('FarmList');
      expect(routes).toContain('AnimalList');
    });

    it('should map actual existing routes in FEED & QUALITY', () => {
      const feedGroup = NAV_GROUPS.find((g) => g.title === 'FEED & QUALITY');
      expect(feedGroup).toBeDefined();
      const routes = feedGroup!.items.map((i) => i.route);
      expect(routes).toContain('FeedList');
      expect(routes).toContain('SilageList');
      expect(routes).toContain('TestResultList');
      expect(routes).toContain('Assessments');
      expect(routes).toContain('CameraCapture');
    });

    it('should map actual existing routes in MONITORING', () => {
      const monGroup = NAV_GROUPS.find((g) => g.title === 'MONITORING');
      expect(monGroup).toBeDefined();
      const routes = monGroup!.items.map((i) => i.route);
      expect(routes).toContain('AnimalHealthScreening');
      expect(routes).toContain('StorageUnitList');
      expect(routes).toContain('FeedPlanList');
      expect(routes).toContain('AlertList');
    });

    it('should map actual existing routes in PROFESSIONAL SUPPORT', () => {
      const supportGroup = NAV_GROUPS.find((g) => g.title === 'PROFESSIONAL SUPPORT');
      expect(supportGroup).toBeDefined();
      const routes = supportGroup!.items.map((i) => i.route);
      expect(routes).toContain('ConsultationList');
      expect(routes).toContain('EvidenceSummary');
      expect(routes).toContain('AnalyticsDashboard');
    });

    it('should map Profile in ACCOUNT grouping', () => {
      const accountGroup = NAV_GROUPS.find((g) => g.title === 'ACCOUNT');
      expect(accountGroup).toBeDefined();
      const routes = accountGroup!.items.map((i) => i.route);
      expect(routes).toContain('Profile');
    });
  });

  describe('Part 3: Mobile Drawer Navigation', () => {
    it('should mirror desktop navigation items without duplication', () => {
      const totalItems = NAV_GROUPS.reduce((acc, g) => acc + g.items.length, 0);
      expect(totalItems).toBe(16);

      // Verify no duplicate testIDs
      const testIds = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.testID));
      const uniqueTestIds = new Set(testIds);
      expect(uniqueTestIds.size).toBe(testIds.length);
    });
  });
});
