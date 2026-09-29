import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '../constants/theme';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import {
  AddFarmScreen,
  EditFarmScreen,
  FarmDetailsScreen,
  FarmListScreen,
} from '../screens/farm';
import {
  AddAnimalScreen,
  AnimalDetailsScreen,
  AnimalListScreen,
  EditAnimalScreen,
} from '../screens/animals';
import {
  AddFeedScreen,
  EditFeedScreen,
  FeedDetailsScreen,
  FeedListScreen,
} from '../screens/feed';
import {
  AddSilageScreen,
  EditSilageScreen,
  SilageDetailsScreen,
  SilageListScreen,
} from '../screens/silage';
import {
  AddTestResultScreen,
  TestResultDetailsScreen,
  TestResultListScreen,
} from '../screens/testResults';
import { AssessmentResultScreen } from '../screens/assessments';
import {
  AdvisoryDetailsScreen,
  AdvisoryListScreen,
} from '../screens/advisories';
import { AnimalHealthScreeningScreen } from '../screens/health';
import { CameraCaptureScreen } from '../screens/camera';
import {
  ConsultationListScreen,
  ConsultationDetailsScreen,
  RequestConsultationScreen,
  ExpertConsultationReviewScreen,
  ExpertResponseScreen,
} from '../screens/consultation';
import {
  AnalyticsDashboardScreen,
  AnimalAnalyticsScreen,
  FeedHistoryScreen,
  SilageHistoryScreen,
} from '../screens/analytics';
import {
  AlertDetailsScreen,
  AlertListScreen,
} from '../screens/alerts';
import {
  FeedPlanListScreen,
  FeedPlanDetailsScreen,
  AddFeedPlanScreen,
  EditFeedPlanScreen,
} from '../screens/feedPlans';
import { EvidenceSummaryScreen } from '../screens/evidence';
import {
  StorageUnitListScreen,
  StorageUnitDetailsScreen,
  AddStorageUnitScreen,
  RecordSensorReadingScreen,
} from '../screens/storage';
import { EditProfileScreen, ProfileScreen } from '../screens/profile';
import { AppLayout } from './AppLayout';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <AppLayout>
      <Stack.Navigator
        initialRouteName="Dashboard"
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'CattleFeedAI Dashboard',
          headerBackVisible: false,
        }}
      />

      {/* Farm Management Routes */}
      <Stack.Screen
        name="FarmList"
        component={FarmListScreen}
        options={{
          title: 'My Farms',
        }}
      />
      <Stack.Screen
        name="Farms"
        component={FarmListScreen}
        options={{
          title: 'My Farms',
        }}
      />
      <Stack.Screen
        name="FarmDetails"
        component={FarmDetailsScreen}
        options={{
          title: 'Farm Details',
        }}
      />
      <Stack.Screen
        name="AddFarm"
        component={AddFarmScreen}
        options={{
          title: 'Register Farm',
        }}
      />
      <Stack.Screen
        name="EditFarm"
        component={EditFarmScreen}
        options={{
          title: 'Edit Farm',
        }}
      />

      {/* Animal Management Routes */}
      <Stack.Screen
        name="AnimalList"
        component={AnimalListScreen}
        options={{
          title: 'Livestock Herd',
        }}
      />
      <Stack.Screen
        name="Animals"
        component={AnimalListScreen}
        options={{
          title: 'Livestock Herd',
        }}
      />
      <Stack.Screen
        name="AnimalDetails"
        component={AnimalDetailsScreen}
        options={{
          title: 'Animal Profile',
        }}
      />
      <Stack.Screen
        name="AddAnimal"
        component={AddAnimalScreen}
        options={{
          title: 'Register Animal',
        }}
      />
      <Stack.Screen
        name="EditAnimal"
        component={EditAnimalScreen}
        options={{
          title: 'Edit Animal Profile',
        }}
      />

      {/* Feed Sample Management Routes (M6.3) */}
      <Stack.Screen
        name="FeedList"
        component={FeedListScreen}
        options={{
          title: 'Feed Samples',
        }}
      />
      <Stack.Screen
        name="Feed"
        component={FeedListScreen}
        options={{
          title: 'Feed Samples',
        }}
      />
      <Stack.Screen
        name="FeedDetails"
        component={FeedDetailsScreen}
        options={{
          title: 'Feed Sample Details',
        }}
      />
      <Stack.Screen
        name="AddFeed"
        component={AddFeedScreen}
        options={{
          title: 'Register Feed Sample',
        }}
      />
      <Stack.Screen
        name="EditFeed"
        component={EditFeedScreen}
        options={{
          title: 'Edit Feed Sample',
        }}
      />

      {/* Silage Sample Management Routes (M6.3) */}
      <Stack.Screen
        name="SilageList"
        component={SilageListScreen}
        options={{
          title: 'Silage Samples',
        }}
      />
      <Stack.Screen
        name="Silage"
        component={SilageListScreen}
        options={{
          title: 'Silage Samples',
        }}
      />
      <Stack.Screen
        name="SilageDetails"
        component={SilageDetailsScreen}
        options={{
          title: 'Silage Sample Details',
        }}
      />
      <Stack.Screen
        name="AddSilage"
        component={AddSilageScreen}
        options={{
          title: 'Register Silage Sample',
        }}
      />
      <Stack.Screen
        name="EditSilage"
        component={EditSilageScreen}
        options={{
          title: 'Edit Silage Sample',
        }}
      />

      {/* Test Results Routes (M6.3) */}
      <Stack.Screen
        name="TestResultList"
        component={TestResultListScreen}
        options={{
          title: 'Test Results',
        }}
      />
      <Stack.Screen
        name="TestResultDetails"
        component={TestResultDetailsScreen}
        options={{
          title: 'Test Result Analysis',
        }}
      />
      <Stack.Screen
        name="AddTestResult"
        component={AddTestResultScreen}
        options={{
          title: 'Record Test Result',
        }}
      />

      {/* Quality & Risk Assessment Routes (M6.4) */}
      <Stack.Screen
        name="AssessmentResult"
        component={AssessmentResultScreen}
        options={{
          title: 'Quality & Risk Assessment',
        }}
      />
      <Stack.Screen
        name="Assessments"
        component={AdvisoryListScreen}
        options={{
          title: 'Herd Advisories',
        }}
      />

      {/* Advisory Routes (M6.4) */}
      <Stack.Screen
        name="AdvisoryList"
        component={AdvisoryListScreen}
        options={{
          title: 'Herd Advisories',
        }}
      />
      <Stack.Screen
        name="Advisories"
        component={AdvisoryListScreen}
        options={{
          title: 'Herd Advisories',
        }}
      />
      <Stack.Screen
        name="AdvisoryDetails"
        component={AdvisoryDetailsScreen}
        options={{
          title: 'Advisory Recommendation',
        }}
      />

      {/* Animal Health Risk Screening Routes (M6.5) */}
      <Stack.Screen
        name="AnimalHealthScreening"
        component={AnimalHealthScreeningScreen}
        options={{
          title: 'Animal Health Screening',
        }}
      />

      {/* Camera / Webcam Capture Routes (M6.6) */}
      <Stack.Screen
        name="CameraCapture"
        component={CameraCaptureScreen}
        options={{
          title: 'Capture Sample Image',
        }}
      />

      {/* Expert Consultation Routes (M8) */}
      <Stack.Screen
        name="ConsultationList"
        component={ConsultationListScreen}
        options={{
          title: 'Consultations',
        }}
      />
      <Stack.Screen
        name="Consultations"
        component={ConsultationListScreen}
        options={{
          title: 'Consultations',
        }}
      />
      <Stack.Screen
        name="RequestConsultation"
        component={RequestConsultationScreen}
        options={{
          title: 'Request Consultation',
        }}
      />
      <Stack.Screen
        name="ConsultationDetails"
        component={ConsultationDetailsScreen}
        options={{
          title: 'Consultation Details',
        }}
      />
      <Stack.Screen
        name="ExpertConsultationReview"
        component={ExpertConsultationReviewScreen}
        options={{
          title: 'Review Consultation',
        }}
      />
      <Stack.Screen
        name="ExpertResponse"
        component={ExpertResponseScreen}
        options={{
          title: 'Expert Recommendation',
        }}
      />

      {/* Analytics & Historical Trends Routes (M9) */}
      <Stack.Screen
        name="AnalyticsDashboard"
        component={AnalyticsDashboardScreen}
        options={{
          title: 'Analytics & Trends',
        }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsDashboardScreen}
        options={{
          title: 'Analytics & Trends',
        }}
      />
      <Stack.Screen
        name="AnimalAnalytics"
        component={AnimalAnalyticsScreen}
        options={{
          title: 'Animal Analytics',
        }}
      />
      <Stack.Screen
        name="FeedHistory"
        component={FeedHistoryScreen}
        options={{
          title: 'Feed History',
        }}
      />
      <Stack.Screen
        name="SilageHistory"
        component={SilageHistoryScreen}
        options={{
          title: 'Silage History',
        }}
      />

      {/* Notifications & Alerts Routes (M10) */}
      <Stack.Screen
        name="AlertList"
        component={AlertListScreen}
        options={{
          title: 'Notifications & Alerts',
        }}
      />
      <Stack.Screen
        name="Alerts"
        component={AlertListScreen}
        options={{
          title: 'Notifications & Alerts',
        }}
      />
      <Stack.Screen
        name="AlertDetails"
        component={AlertDetailsScreen}
        options={{
          title: 'Alert Details',
        }}
      />

      {/* Feed Planning & Management Routes (M11) */}
      <Stack.Screen
        name="FeedPlanList"
        component={FeedPlanListScreen}
        options={{
          title: 'Feed Plans',
        }}
      />
      <Stack.Screen
        name="FeedPlans"
        component={FeedPlanListScreen}
        options={{
          title: 'Feed Plans',
        }}
      />
      <Stack.Screen
        name="FeedPlanDetails"
        component={FeedPlanDetailsScreen}
        options={{
          title: 'Feed Plan Details',
        }}
      />
      <Stack.Screen
        name="AddFeedPlan"
        component={AddFeedPlanScreen}
        options={{
          title: 'Create Feed Plan',
        }}
      />
      <Stack.Screen
        name="EditFeedPlan"
        component={EditFeedPlanScreen}
        options={{
          title: 'Edit Feed Plan',
        }}
      />
      {/* Integrated Decision Support (M12) */}
      <Stack.Screen
        name="EvidenceSummary"
        component={EvidenceSummaryScreen}
        options={{
          title: 'Evidence Summary',
        }}
      />

      {/* Storage Unit Monitoring & Hardware Alerts (Post-M13 Module) */}
      <Stack.Screen
        name="StorageUnits"
        component={StorageUnitListScreen}
        options={{
          title: 'Storage Unit Monitoring',
        }}
      />
      <Stack.Screen
        name="StorageUnitList"
        component={StorageUnitListScreen}
        options={{
          title: 'Storage Unit Monitoring',
        }}
      />
      <Stack.Screen
        name="StorageUnitDetails"
        component={StorageUnitDetailsScreen}
        options={{
          title: 'Storage Unit Details',
        }}
      />
      <Stack.Screen
        name="AddStorageUnit"
        component={AddStorageUnitScreen}
        options={{
          title: 'Register Storage Unit',
        }}
      />
      <Stack.Screen
        name="RecordSensorReading"
        component={RecordSensorReadingScreen}
        options={{
          title: 'Ingest Sensor Telemetry',
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Farmer Profile',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
    </Stack.Navigator>
  </AppLayout>
  );
};

export default AppNavigator;
