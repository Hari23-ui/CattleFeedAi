import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Type definitions for React Navigation Stacks
 */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;

  // Farm Management (M6.2)
  Farms: undefined;
  FarmList: undefined;
  FarmDetails: { farmId: number };
  AddFarm: undefined;
  EditFarm: { farmId: number };

  // Animal Management (M6.2)
  Animals: { farmId?: number; farmName?: string } | undefined;
  AnimalList: { farmId?: number; farmName?: string } | undefined;
  AnimalDetails: { animalId: number };
  AddAnimal: { farmId?: number } | undefined;
  EditAnimal: { animalId: number };

  // Feed Sample Management (M6.3)
  Feed: undefined;
  FeedList: { farmId?: number } | undefined;
  FeedDetails: { sampleId: number };
  AddFeed: { farmId?: number; animalId?: number } | undefined;
  EditFeed: { sampleId: number };

  // Silage Sample Management (M6.3)
  Silage: undefined;
  SilageList: { farmId?: number } | undefined;
  SilageDetails: { sampleId: number };
  AddSilage: { farmId?: number; animalId?: number } | undefined;
  EditSilage: { sampleId: number };

  // Test Results Management (M6.3)
  TestResultList: { feedSampleId?: number; silageSampleId?: number; sampleCode?: string } | undefined;
  TestResultDetails: { resultId: number };
  AddTestResult: { feedSampleId?: number; silageSampleId?: number; sampleCode?: string } | undefined;

  // Quality & Risk Assessment (M6.4)
  AssessmentResult: { testResultId: number; sampleCode?: string };
  Assessments: undefined;

  // Advisories (M6.4)
  AdvisoryList: { animalId?: number } | undefined;
  Advisories: undefined;
  AdvisoryDetails: { advisoryId: number };

  // Animal Health Risk Screening (M6.5)
  AnimalHealthScreening: { animalId: number };

  // Camera / Webcam Capture (M6.6)
  CameraCapture: {
    sampleType: 'FEED' | 'SILAGE';
    sampleId: number;
    sampleCode: string;
  };

  // Expert Consultation (M8)
  ConsultationList: undefined;
  Consultations: undefined;
  RequestConsultation: { animalId?: number; feedSampleId?: number; silageSampleId?: number } | undefined;
  ConsultationDetails: { consultationId: number };
  ExpertConsultationReview: { consultationId: number };
  ExpertResponse: { consultationId: number; subject?: string };

  // Analytics & Historical Trends (M9)
  AnalyticsDashboard: undefined;
  Analytics: undefined;
  AnimalAnalytics: { animalId: number; animalTag?: string };
  FeedHistory: { feedSampleId: number; sampleCode?: string };
  SilageHistory: { silageSampleId: number; sampleCode?: string };

  // Notifications & Alerts (M10)
  AlertList: undefined;
  Alerts: undefined;
  AlertDetails: { alertId: number };

  // Feed Planning & Management (M11)
  FeedPlanList: undefined;
  FeedPlans: undefined;
  FeedPlanDetails: { planId: number };
  AddFeedPlan: { animalId?: number } | undefined;
  EditFeedPlan: { planId: number };

  // Integrated Decision Support (M12)
  EvidenceSummary: { animalId?: number; consultationId?: number; title?: string } | undefined;

  // Storage Unit Monitoring (Post-M13 Module)
  StorageUnits: undefined;
  StorageUnitList: { farmId?: number } | undefined;
  StorageUnitDetails: { storageUnitId: number };
  AddStorageUnit: { farmId?: number } | undefined;
  RecordSensorReading: { storageUnitId: number; storageUnitName?: string };

  // Future Milestones
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppNavigationProp = NativeStackNavigationProp<AppStackParamList>;

// Screen Props Helpers
export type ScreenProps<RouteName extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, RouteName>;
