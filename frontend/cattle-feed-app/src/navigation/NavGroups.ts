import { Ionicons } from '@expo/vector-icons';
import { AppStackParamList } from './types';

export interface NavItemConfig {
  name: string;
  route: keyof AppStackParamList;
  params?: any;
  icon: keyof typeof Ionicons.glyphMap;
  testID: string;
}

export interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

export const NAV_GROUPS: NavGroupConfig[] = [
  {
    title: 'DASHBOARD',
    items: [
      {
        name: 'Dashboard',
        route: 'Dashboard',
        icon: 'speedometer-outline',
        testID: 'nav-dashboard',
      },
    ],
  },
  {
    title: 'FARM MANAGEMENT',
    items: [
      {
        name: 'Farms',
        route: 'FarmList',
        icon: 'business-outline',
        testID: 'nav-farms',
      },
      {
        name: 'Animals',
        route: 'AnimalList',
        icon: 'paw-outline',
        testID: 'nav-animals',
      },
    ],
  },
  {
    title: 'FEED & QUALITY',
    items: [
      {
        name: 'Feed Samples',
        route: 'FeedList',
        icon: 'nutrition-outline',
        testID: 'nav-feed-samples',
      },
      {
        name: 'Silage Samples',
        route: 'SilageList',
        icon: 'leaf-outline',
        testID: 'nav-silage-samples',
      },
      {
        name: 'Test Results',
        route: 'TestResultList',
        icon: 'flask-outline',
        testID: 'nav-test-results',
      },
      {
        name: 'Quality & Risk',
        route: 'Assessments',
        icon: 'shield-checkmark-outline',
        testID: 'nav-quality-risk',
      },
      {
        name: 'Visual AI',
        route: 'CameraCapture',
        params: { sampleType: 'FEED', sampleId: 0, sampleCode: 'GENERAL' },
        icon: 'scan-outline',
        testID: 'nav-visual-ai',
      },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      {
        name: 'Health Screening',
        route: 'AnimalHealthScreening',
        params: { animalId: 0 },
        icon: 'fitness-outline',
        testID: 'nav-health-screening',
      },
      {
        name: 'Storage Monitoring',
        route: 'StorageUnitList',
        icon: 'hardware-chip-outline',
        testID: 'nav-storage-monitoring',
      },
      {
        name: 'Feed Plans',
        route: 'FeedPlanList',
        icon: 'calendar-outline',
        testID: 'nav-feed-plans',
      },
      {
        name: 'Alerts',
        route: 'AlertList',
        icon: 'notifications-outline',
        testID: 'nav-alerts',
      },
    ],
  },
  {
    title: 'PROFESSIONAL SUPPORT',
    items: [
      {
        name: 'Consultations',
        route: 'ConsultationList',
        icon: 'chatbubbles-outline',
        testID: 'nav-consultations',
      },
      {
        name: 'Evidence',
        route: 'EvidenceSummary',
        icon: 'document-text-outline',
        testID: 'nav-evidence',
      },
      {
        name: 'Analytics',
        route: 'AnalyticsDashboard',
        icon: 'trending-up-outline',
        testID: 'nav-analytics',
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      {
        name: 'Profile',
        route: 'Profile',
        icon: 'person-outline',
        testID: 'nav-profile',
      },
    ],
  },
];
